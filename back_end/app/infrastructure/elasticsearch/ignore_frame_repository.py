from typing import List

from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

from back_end.app.core.config import settings
from back_end.app.domain.entities.ignore_frame import IgnoreFrame


class IgnoreFrameRepository:
    def __init__(self):
        self.es = Elasticsearch(
            [{'host': settings.elasticsearch_host, 'port': settings.elasticsearch_port,
              'scheme': settings.elasticsearch_scheme}],
            basic_auth=(settings.elasticsearch_user, settings.elasticsearch_password))
        self.index = "ignore_frame"
        # Define the mapping for the my_id field
        mapping = {
            "mappings": {
                "properties": {
                    "my_id": {
                        "type": "search_as_you_type"
                    },
                }
            }
        }
        # Create the index with the mapping if it does not exist
        if not self.es.indices.exists(index=self.index):
            self.es.indices.create(index=self.index, body=mapping)

        new_max_result_window = 1000000

        # Update the index settings
        max_result_window_settings = {
            "index": {
                "max_result_window": new_max_result_window
            }
        }

        # Apply the settings to the index
        self.es.indices.put_settings(index=self.index, body=max_result_window_settings)

    def bulk_insert_by_docs(self, documents):
        actions = [
            {
                "_op_type": "index",
                "_index": self.index,
                "_id": doc["_id"],
                "_source": {**doc["_source"], "my_id": doc["_id"]}
            }
            for doc in documents
        ]
        bulk(self.es, actions)
        return True

    def get_by_ids(self, image_ids: list):
        documents = []
        for image_id in image_ids:
            # Retrieve the document by ID
            doc = self.es.get(index=self.index, id=image_id)
            # remove id from source
            doc['_source'].pop('my_id')
            documents.append({"_id": image_id, "_source": doc['_source']})
        return documents

    def search_page_with_prefixes(self, page_index: int, page_size: int, prefixes: List[str]):
        body = {
            "from": (page_index - 1) * page_size,
            "size": page_size,
            "track_total_hits": True,
            "source": ["my_id", "tags"],
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": prefix,
                                "type": "bool_prefix",
                                "fields": [
                                    "my_id",
                                    "my_id._2gram",
                                    "my_id._3gram"
                                ]
                            }
                        }
                        for prefix in prefixes
                    ]
                }
            }
        }
        return self.es.search(index=self.index, body=body)

    def get_all_ids(self):
        ids = []
        scroll_size = 1000  # Adjust the scroll size as needed

        # Initial search request with scroll
        response = self.es.search(index=self.index, body={"query": {"match_all": {}}}, scroll="2m", size=scroll_size)

        scroll_id = response['_scroll_id']
        hits = response['hits']['hits']

        while len(hits) > 0:
            for hit in hits:
                ids.append(hit['_id'])

            # Continue scrolling
            response = self.es.scroll(scroll_id=scroll_id, scroll="2m")
            scroll_id = response['_scroll_id']
            hits = response['hits']['hits']

        # Clear the scroll context
        self.es.clear_scroll(scroll_id=scroll_id)

        return ids

    def bulk_delete(self, ignore_frames: List[IgnoreFrame]):
        actions = [
            {
                "_op_type": "delete",
                "_index": self.index,
                "_id": f"{frame.video_id}_{frame.frame_id}"
            }
            for frame in ignore_frames
        ]
        bulk(self.es, actions)
        return True

    def delete_all(self):
        self.es.delete_by_query(index=self.index, body={"query": {"match_all": {}}})
        return True