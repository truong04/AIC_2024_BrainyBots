import json
import os
import cv2
from elasticsearch import Elasticsearch, helpers
from back_end.app.core.config import settings
from back_end.imports.core.utils import find_all_files
# Elasticsearch settings
es = Elasticsearch([
    {
        'host': settings.elasticsearch_host,
        'port': settings.elasticsearch_port,
        'scheme': settings.elasticsearch_scheme
    }
],
    http_auth=(settings.elasticsearch_user, settings.elasticsearch_password))

index_name = "video_index"

# Define the index mappings
index_body = {
    "mappings": {
        "properties": {
            "video_id": {
                "type": "keyword"
            },
            "fps": {
                "type": "integer"
            },
            "total_frame": {
                "type": "integer"
            }
        }
    }
}

# Create the index
if es.indices.exists(index=index_name):
    es.indices.delete(index=index_name)

response = es.indices.create(index=index_name, body=index_body)

if 'acknowledged' in response and response['acknowledged']:
    print("Index created successfully.")
else:
    print("Failed to create index:", response)

def calculate(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    return fps, total_frames

# Populate the index with keyframe data
video_dir = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/video_with_audio"
video_files = find_all_files(video_dir, extensions=[".mp4"])
print(len(video_files))

batch = []
for video_file in video_files:
    video_id = video_file.split('/')[-1].split('.')[0]
    if os.path.exists(video_file):
        fps, total_frame = calculate(video_file)
        doc = {
            "_index": index_name,
            "_id": f"{video_id}",
            "_source": {
                "video_id": video_id,
                "fps": fps,
                "total_frame": total_frame
            }
        }
        batch.append(doc)

if batch:
    helpers.bulk(es, batch)

print("Video indexing completed.")