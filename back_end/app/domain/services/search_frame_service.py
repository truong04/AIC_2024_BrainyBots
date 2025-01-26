import os

from fastapi import File
from PIL import Image
from back_end.app.core.config import settings
from back_end.app.domain.entities.search_request import SearchRequest
from back_end.app.infrastructure.elasticsearch.search_frame_repository import SearchFrameRepository


class SearchFrameService:
    def __init__(self, frame_repository=SearchFrameRepository()):
        self.frame_repository = frame_repository

    async def search_by_query(self, req: SearchRequest):
        return await self.frame_repository.search_by_query(req.query, req.ocr.strip(), req.asr.strip(),
                                                           req.feature_model.strip(), req.result_size,
                                                           req.is_enable_cluster, req.cau_hoi_so)

    async def search_by_id(self, image_id: str, feature_model: str):
        return await self.frame_repository.search_by_id(image_id, feature_model)

    async def search_by_image_file(self, image: Image, result_size: str, ocr: str, asr: str, feature_model:str, is_enable_cluster: bool, cau_hoi_so: int | None):
        return await self.frame_repository.search_by_image_file(image, int(result_size), ocr, asr, feature_model, is_enable_cluster, cau_hoi_so)

    async def search_by_id_and_threshold(self, image_id: str, threshold: float):
        return await self.frame_repository.search_by_id_and_threshold(image_id, threshold)

    async def get_by_ids(self, image_ids: list):
        return await self.frame_repository.get_by_ids(image_ids)

    async def bulk_insert_by_docs(self, documents):
        return await self.frame_repository.bulk_insert_by_docs(documents)

    async def delete_docs_by_id_list(self, id_list: list):
        return await self.frame_repository.delete_docs_by_id_list(id_list)

    async def remove_cau_hoi_so_by_id(self, id_list: list, cau_hoi_so: int):
        return await self.frame_repository.remove_cau_hoi_so_by_id(id_list, cau_hoi_so)

    async def search_nearest_ids(self, image_id: str, window_size: int):
        parts = image_id.split('_')
        video_folder = os.path.join(settings.keyframe_webp_dir, f"{parts[0]}_extra",
                                    parts[1])
        keyframes = os.listdir(video_folder)
        keyframes.sort()
        index = keyframes.index(parts[2] + ".webp")
        start = max(0, index - window_size)
        end = min(len(keyframes), index + window_size)

        result = []
        for i in range(start, end):
            frame_id = keyframes[i].split('.')[0]
            id = f"{parts[0]}_{parts[1]}_{frame_id}"
            image_path = f"{parts[0]}_extra/{parts[1]}/{keyframes[i]}"
            video_id = f"{parts[0]}_{parts[1]}"
            result.append({"id": id, "image_path": image_path, "video_id": video_id, "frame_id": frame_id})
        return result
