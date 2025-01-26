import json

import numpy as np
from elasticsearch import Elasticsearch, helpers
from tqdm import tqdm
import sys
import os

project_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.append(project_path)
from back_end.app.core.config import settings
from back_end.imports.core.utils import find_all_files, get_video_id, get_keyframes_by_video_id, \
    get_video_id_and_frame_id

keyframe_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/Keyframes"
clip_feature_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/CLIP_features"
sig_clip_feature_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/SIG_CLIP_features"
dfn5b_clip_feature_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/DFN5B_CLIP_features"
blip2_feature_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/BLIP2_features"
tag_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/Tags"
ocr_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/OCR_NEW"
img_caption_folder = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/img_caption"

index_name = "all_index"

es = Elasticsearch([
    {
        'host': settings.elasticsearch_host,
        'port': settings.elasticsearch_port,
        'scheme': settings.elasticsearch_scheme
    }
],
    http_auth=(settings.elasticsearch_user, settings.elasticsearch_password))

if es.indices.exists(index=index_name):
    es.indices.delete(index=index_name)

index_body = {
    "settings": {
        "analysis": {
            "filter": {
                "ascii_folding": {
                    "type": "asciifolding",
                    "preserve_original": True
                }
            },
            "analyzer": {
                "my_vi_analyzer": {
                    "tokenizer": "vi_tokenizer",
                    "filter": ["lowercase", "vi_stop", "ascii_folding"]
                }
            }
        }
    },

    "mappings": {
        "properties": {
            "tags": {
                "type": "text",
                "analyzer": "my_vi_analyzer"
            },
            "ocr": {
                "type": "text",
                "analyzer": "my_vi_analyzer"
            },
            "img_caption" : {
                "type": "text",
                "analyzer": "my_vi_analyzer"
            },
            "clip_vector": {
                "type": "dense_vector",
            },
            "sig_clip_vector": {
                "type": "dense_vector",
            },
            "dfn5b_clip_vector": {
                "type": "dense_vector",
            },
            # "blip2_vector": {
            #     "type": "dense_vector",
            # },
            "cau_hoi_so": {
                "type": "integer"
            }
        }
    }
}

if not es.indices.exists(index=index_name):
    response = es.indices.create(index=index_name, body=index_body)

    # Kiểm tra phản hồi từ Elasticsearch
    if 'acknowledged' in response and response['acknowledged']:
        print("Index created successfully.")
    else:
        print("Failed to create index:", response)
else:
    print("Index already exists.")

clip_feature_file_paths = find_all_files(clip_feature_folder, ['.npy'])

batch_size = 100  # Set batch size
batch = []

for filePath in tqdm(clip_feature_file_paths, "Indexing clip features"):
    video_id = get_video_id(filePath)
    key_frame_paths = get_keyframes_by_video_id(keyframe_folder, video_id)
    features = np.load(filePath)
    sig_clip_features = np.load(filePath.replace(clip_feature_folder, sig_clip_feature_folder))
    dfn5b_clip_features = np.load(filePath.replace(clip_feature_folder, dfn5b_clip_feature_folder))
    # blip2_features = np.load(filePath.replace(clip_feature_folder, blip2_feature_folder))

    for index, key_frame_path in enumerate(key_frame_paths):
        video_id, frame_id = get_video_id_and_frame_id(key_frame_path)
        splits = video_id.split('_')
        tag_file_path = f"{tag_folder}/{splits[0]}_extra/{splits[1]}/{frame_id}.txt"
        ocr_file_path = f"{ocr_folder}/{splits[0]}_extra/{splits[1]}/{frame_id}.json"
        img_caption_file_path = f"{img_caption_folder}/{splits[0]}_extra/{splits[1]}/{frame_id}.json"
        tag_text = ""
        ocr_text = ""
        img_caption_text = ""
        try:
            with open(tag_file_path, 'r', encoding='utf-8') as file:
                tag_text = file.read()
        except:
            print(f"File not found: {tag_file_path}")
        try:
            with open(ocr_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                ocr_text = ' '.join(data)
        except:
            print(f"File not found: {ocr_file_path}")
        try:
            with open(img_caption_file_path, 'r', encoding='utf-8') as file:
                img_caption_text = json.load(file)['output']
        except:
            print(f"File not found: {img_caption_file_path}")
        doc = {
            "_index": "all_index",
            "_id": f"{video_id}_{frame_id}",
            "_source": {
                "tags": tag_text,
                "ocr": ocr_text,
                "img_caption": img_caption_text,
                "clip_vector": features[index].tolist(),
                "sig_clip_vector": sig_clip_features[index].tolist(),
                "dfn5b_clip_vector": dfn5b_clip_features[index].tolist(),
                # "blip2_vector": blip2_features[index].tolist(),
                "cau_hoi_so": list(range(1, 51))
            }
        }
        try:
            batch.append(doc)
            if len(batch) >= batch_size:
                helpers.bulk(es, batch)
                batch = []
        except Exception as e:
            print(key_frame_path)
            print(f"Error: {e}")

# Index any remaining documents in the batch
if batch:
    helpers.bulk(es, batch)

print("Batch indexing completed.")
