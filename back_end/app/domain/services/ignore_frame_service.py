from typing import List

from back_end.app.domain.entities.ignore_frame import IgnoreFrame
from back_end.app.infrastructure.elasticsearch.ignore_frame_repository import IgnoreFrameRepository


class IgnoreFrameService:
    def __init__(self, ignore_frame_repository = IgnoreFrameRepository()):
        self.ignore_frame_repository = ignore_frame_repository

    def upsert_ignore_frame_by_docs(self, documents):
        return self.ignore_frame_repository.bulk_insert_by_docs(documents)

    def get_all_ids(self):
        return self.ignore_frame_repository.get_all_ids()

    def search_ignore_frames(self, page_index, page_size, prefixes):
        return self.ignore_frame_repository.search_page_with_prefixes(page_index, page_size, prefixes)

    def delete_ignore_frame(self, ignore_frames: List[IgnoreFrame]):
        return self.ignore_frame_repository.bulk_delete(ignore_frames)

    def delete_all(self):
        return self.ignore_frame_repository.delete_all()

    def get_by_ids(self, image_ids: list):
        return self.ignore_frame_repository.get_by_ids(image_ids)