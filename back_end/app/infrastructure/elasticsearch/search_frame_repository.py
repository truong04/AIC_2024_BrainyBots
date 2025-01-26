import asyncio
from elasticsearch import AsyncElasticsearch
from elasticsearch._async import helpers
from fastapi import File
from googletrans import Translator
from sentence_transformers import SentenceTransformer

from back_end.app.core.config import settings

from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from PIL import Image

from sklearn.cluster import DBSCAN

from back_end.app.infrastructure.feature_extraction.dfn5b_clip import DFN5B_CLIP
from back_end.app.infrastructure.feature_extraction.openai_clip import OpenAI_CLIP
from back_end.app.infrastructure.feature_extraction.sig_clip import SigCLIP


async def cluster_and_sort_hits(response):
    hits = response['hits']['hits']

    # Trích xuất các vector từ trường clip_vector
    vectors = [hit['_source']['clip_vector'] for hit in hits]

    # Tính cosine similarity
    cosine_sim_matrix = cosine_similarity(vectors)

    # Chuyển đổi cosine similarity thành khoảng cách và đảm bảo không có giá trị âm
    distance_matrix = 1 - cosine_sim_matrix
    distance_matrix = np.clip(distance_matrix, 0, 1)

    # Sử dụng DBSCAN để phân cụm các vector
    clustering = DBSCAN(eps=0.07, min_samples=1, metric='precomputed').fit(distance_matrix)

    # Sắp xếp các hits theo nhãn cụm và điểm số
    sorted_hits = sorted(zip(hits, clustering.labels_), key=lambda x: (x[1], -x[0]['_score']))

    # Chỉ giữ lại một item cho mỗi cụm
    unique_hits = {}
    for hit, label in sorted_hits:
        if label not in unique_hits:
            unique_hits[label] = hit

    # Trả về các hits đã được sắp xếp và loại bỏ các item trùng lặp
    return list(unique_hits.values())


class SearchFrameRepository:
    def __init__(self):
        self.index_name = "all_index"
        self.es = AsyncElasticsearch(
            [{'host': settings.elasticsearch_host, 'port': settings.elasticsearch_port,
              'scheme': settings.elasticsearch_scheme}],
            basic_auth=(settings.elasticsearch_user, settings.elasticsearch_password))
        self.openai_clip_model = OpenAI_CLIP()
        self.dfn5b_clip_model = DFN5B_CLIP()
        self.sig_clip_model = SigCLIP()
        self.translator = Translator()

    async def analyze_query(self, query):
        analyzed = await self.es.indices.analyze(index=self.index_name, body={
            "analyzer": "my_vi_analyzer",
            "text": query
        })
        tokens = [token['token'] for token in analyzed['tokens']]
        return tokens

    async def bulk_insert_by_docs(self, documents):
        for doc in documents:
            await self.es.index(index=self.index_name, id=doc["_id"], body=doc["_source"])
        return True

    async def get_by_ids(self, image_ids: list):
        documents = []
        for image_id in image_ids:
            # Retrieve the document by ID
            doc = await self.es.get(index=self.index_name, id=image_id)
            documents.append({"_id": image_id, "_source": doc['_source']})

        return documents

    async def search_by_id_and_threshold(self, image_id: str, threshold: float):
        # Retrieve the document by ID to get the CLIP vector
        doc = await self.es.get(index=self.index_name, id=image_id)
        clip_vector = doc['_source']['clip_vector']

        # Construct the search query using the CLIP vector
        search_query = {
            "size": 10000,
            "query": {
                "script_score": {
                    "query": {
                        "match_all": {}
                    },
                    "script": {
                        "source": """
                            double cosineSimilarity = cosineSimilarity(params.query_vector, 'clip_vector');
                            return cosineSimilarity > params.threshold ? cosineSimilarity : 0;
                        """,
                        "params": {
                            "query_vector": clip_vector,
                            "threshold": threshold
                        }
                    }
                }
            }
        }

        return await self.es.search(index=self.index_name, body=search_query)

    async def search_by_image_file(self, image: Image, result_size: int, ocr: str, asr: str, feature_model:str,
                                   is_enable_cluster: bool, cau_hoi_so: int | None):
        image_feats = None
        if feature_model == "clip":
            image_feats = await asyncio.to_thread(self.openai_clip_model.extract_feature_image, image)
        elif feature_model == "dfn5b_clip":
            image_feats = await asyncio.to_thread(self.dfn5b_clip_model.extract_feature_image, image)
        elif feature_model == "sig_clip":
            image_feats = await asyncio.to_thread(self.sig_clip_model.extract_feature_image, image)

        ocr_tokens = await self.analyze_query(ocr)
        ocr_token_query = {
            "bool": {
                "should": []
            }
        }
        for ocr_token in ocr_tokens:
            match_query = {
                "match": {
                    "ocr": {
                        "query": ocr_token,
                        "fuzziness": "AUTO"
                    }
                }
            }
            ocr_token_query["bool"]["should"].append(match_query)
        search_query = {
            "size": result_size,
            "retriever": {
                "rrf": {
                    "retrievers": [],
                    "rank_constant": 60,
                    "rank_window_size": result_size
                }
            },
        }
        search_query["retriever"]["rrf"]["retrievers"].append({
            "knn": {
                "field": feature_model + "_vector",
                "query_vector": image_feats,
                "k": result_size,
                "num_candidates": result_size
            },
        })
        if cau_hoi_so:
            search_query["retriever"]["rrf"]["retrievers"].append({
                "standard": {
                    "query": {
                        "terms": {
                            "cau_hoi_so": [
                                cau_hoi_so
                            ],
                        }
                    },
                }
            })
        if ocr_tokens:
            search_query["retriever"]["rrf"]["retrievers"].append({
                "standard": {
                    "query": {
                        "bool": {
                            "must": [
                                ocr_token_query
                            ],
                        }
                    },
                }
            })
        if len(search_query["retriever"]["rrf"]["retrievers"]) < 2:
            del search_query["retriever"]
            search_query["knn"] = {
                "field": feature_model + "_vector",
                "query_vector": image_feats,
                "k": result_size,
                "num_candidates": result_size
            }

        response = await self.es.search(index=self.index_name, body=search_query)
        if is_enable_cluster:
            response['hits']['hits'] = await cluster_and_sort_hits(response)
        if cau_hoi_so:
            response['hits']['hits'] = [hit for hit in response['hits']['hits'] if cau_hoi_so in hit['_source']['cau_hoi_so']]
        return [
                   {
                       "id": hit['_id'],
                       "tags": hit['_source']['tags'],
                       "image_path": f"{split_id[0]}_extra/{split_id[1]}/{split_id[2]}.webp",
                       "video_id": f"{split_id[0]}_{split_id[1]}",
                       "frame_id": split_id[2],
                       "score": hit['_score']
                   }
                   for hit in response['hits']['hits']
                   for split_id in [hit['_id'].split('_')]
               ][0:200]

    async def search_by_id(self, image_id: str, feature_model: str):
        # Retrieve the document by ID to get the CLIP vector
        doc = await self.es.get(index=self.index_name, id=image_id)
        clip_vector = doc['_source'][ feature_model + '_vector']

        # Construct the search query using the CLIP vector
        search_query = {
            "size": 100,
            "query": {
                "bool": {
                    "must": [
                        {
                            "knn": {
                                "field": feature_model + "_vector",
                                "query_vector": clip_vector,
                                "k": 100,
                                "num_candidates": 100
                            }
                        },
                    ],
                }
            }
        }

        # Execute the search query
        response = await self.es.search(index=self.index_name, body=search_query)

        # Process and return the search results
        return [
            {
                "id": hit['_id'],
                "tags": hit['_source']['tags'],
                "image_path": f"{split_id[0]}_extra/{split_id[1]}/{split_id[2]}.webp",
                "video_id": f"{split_id[0]}_{split_id[1]}",
                "frame_id": split_id[2],
                "score": hit['_score']
            }
            for hit in response['hits']['hits']
            for split_id in [hit['_id'].split('_')]
        ]

    async def delete_docs_by_id_list(self, id_list: list):
        body = {"query": {"ids": {"values": id_list}}}
        return await self.es.delete_by_query(index=self.index_name, body=body)

    async def remove_cau_hoi_so_by_id(self, id_list: list, cau_hoi_so: int):
        actions = []
        for id in id_list:
            action = {
                "_op_type": "update",
                "_index": "all_index",
                "_id": id,
                "script": {
                    "lang": "painless",
                    "source": "ctx._source.cau_hoi_so.removeAll(params.remove_list)",
                    "params": {
                        "remove_list": [cau_hoi_so]
                    }
                }
            }
            actions.append(action)
        return await helpers.async_bulk(self.es, actions)

    async def search_by_query(self, query: str, ocr: str, asr: str, feature_model:str, result_size: int,
                              is_enable_cluster: bool, cau_hoi_so: int | None):
        query_en = ""
        tokens = []
        if query:
            query_en = self.translator.translate(query, dest='en').text
            tokens = await self.analyze_query(query_en)
        ocr_tokens = await self.analyze_query(ocr)
        sentence_embedding = None
        if feature_model == "clip":
            sentence_embedding = await asyncio.to_thread(self.openai_clip_model.extract_feature_text, query_en)
        elif feature_model == "dfn5b_clip":
            sentence_embedding = await asyncio.to_thread(self.dfn5b_clip_model.extract_feature_text, query_en)
        elif feature_model == "sig_clip":
            sentence_embedding = await asyncio.to_thread(self.sig_clip_model.extract_feature_text, query_en)
        token_query = {
            "bool": {
                "should": []
            }
        }
        for token in tokens:
            match_query = {
                "match": {
                    "tag": {
                        "query": token,
                        "fuzziness": "AUTO"
                    }
                }
            }
            img_cap_match_query = {
                "match": {
                    "img_caption": {
                        "query": token,
                        "fuzziness": "AUTO"
                    }
                }
            }
            token_query["bool"]["should"].append(match_query)
            # token_query["bool"]["should"].append(img_cap_match_query)
        ocr_token_query = {
            "bool": {
                "should": []
            }
        }
        for ocr_token in ocr_tokens:
            match_query = {
                "match": {
                    "ocr": {
                        "query": ocr_token,
                        "fuzziness": "AUTO"
                    }
                }
            }
            ocr_token_query["bool"]["should"].append(match_query)
        search_query = {
            "size": result_size,
            "retriever": {
                "rrf": {
                    "retrievers": [],
                    "rank_constant": 60,
                    "rank_window_size": result_size
                }
            },
        }
        if cau_hoi_so:
            search_query["retriever"]["rrf"]["retrievers"].append({
                "standard": {
                    "query": {
                        "terms": {
                            "cau_hoi_so": [
                                cau_hoi_so
                            ],
                        }
                    },
                }
            })
        if tokens:
            search_query["retriever"]["rrf"]["retrievers"].append({
                "knn": {
                    "field": feature_model + "_vector",
                    "query_vector": sentence_embedding.tolist(),
                    "k": result_size,
                    "num_candidates": result_size
                },
            })
            search_query["retriever"]["rrf"]["retrievers"].append({
                "standard": {
                    "query": {
                        "bool": {
                            "must": [
                                token_query
                            ],
                        }
                    },
                }
            }, )
        if ocr_tokens:
            search_query["retriever"]["rrf"]["retrievers"].append({
                "standard": {
                    "query": {
                        "bool": {
                            "must": [
                                ocr_token_query
                            ],
                        }
                    },
                }
            })
        if len(search_query["retriever"]["rrf"]["retrievers"]) < 2:
            del search_query["retriever"]
            if ocr_tokens:
                search_query["query"] = {
                    "bool": {
                        "must": [
                            ocr_token_query
                        ],
                    }
                }

        response = await self.es.search(index=self.index_name, body=search_query)
        if is_enable_cluster:
            response['hits']['hits'] = await cluster_and_sort_hits(response)
        if cau_hoi_so:
            response['hits']['hits'] = [hit for hit in response['hits']['hits'] if cau_hoi_so in hit['_source']['cau_hoi_so']]
        return [
                   {
                       "id": hit['_id'],
                       "tags": hit['_source']['tags'],
                       "image_path": f"{split_id[0]}_extra/{split_id[1]}/{split_id[2]}.webp",
                       "video_id": f"{split_id[0]}_{split_id[1]}",
                       "frame_id": split_id[2],
                       "score": hit['_score'],
                       'cau_hoi_so': hit['_source']['cau_hoi_so']
                   }
                   for hit in response['hits']['hits']
                   for split_id in [hit['_id'].split('_')]
               ][0:100]
