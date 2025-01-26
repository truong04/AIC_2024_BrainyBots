from fastapi import APIRouter, Depends, HTTPException
from typing import List

from back_end.app.api.v1.dependencies import get_ignore_frame_service, get_current_username, get_search_frame_service
from back_end.app.domain.entities.ignore_frame import IgnoreFrame
from back_end.app.domain.services.ignore_frame_service import IgnoreFrameService
from back_end.app.domain.services.search_frame_service import SearchFrameService

router = APIRouter()


@router.post("/")
async def bulk_upsert_ignore_frame(frames: List[IgnoreFrame],
                                   ignore_service: IgnoreFrameService = Depends(get_ignore_frame_service),
                                   search_service: SearchFrameService = Depends(get_search_frame_service)
                                   ):
    docs = await search_service.get_by_ids([f'{frame.video_id}_{frame.frame_id}' for frame in frames])
    if len(docs) != len(frames):
        raise HTTPException(status_code=400, detail='Some frames not found')
    ignore_service.upsert_ignore_frame_by_docs(docs)
    await search_service.delete_docs_by_id_list([f'{frame.video_id}_{frame.frame_id}' for frame in frames])
    return True

@router.post("/by_id_and_threshold")
async def ignore_frames_by_id_and_threshold(body: dict,
                                            ignore_service: IgnoreFrameService = Depends(get_ignore_frame_service),
                                            search_service: SearchFrameService = Depends(get_search_frame_service)):
    image_id = body.get('image_id')
    threshold = body.get('threshold')
    docs = await search_service.search_by_id_and_threshold(image_id, threshold)
    docs = docs['hits']['hits']
    ignore_service.upsert_ignore_frame_by_docs(docs)
    await search_service.delete_docs_by_id_list([f'{doc["_id"]}' for doc in docs])
    return True

@router.post("/search")
async def search_ignore_frames(page_index: int, page_size: int,
                               prefixes: List[str],
                               service: IgnoreFrameService = Depends(get_ignore_frame_service)):
    return service.search_ignore_frames(page_index, page_size, prefixes)


@router.post("/restore")
async def bulk_delete_ignore_frame(frames: List[IgnoreFrame],
                                   ignore_service: IgnoreFrameService = Depends(get_ignore_frame_service),
                                   search_service: SearchFrameService = Depends(get_search_frame_service)
                                   ):
    docs = ignore_service.get_by_ids([f'{frame.video_id}_{frame.frame_id}' for frame in frames])
    if len(docs) != len(frames):
        raise HTTPException(status_code=400, detail='Some frames not found')
    await search_service.bulk_insert_by_docs(docs)
    return ignore_service.delete_ignore_frame(frames)

@router.get("/get-all-ids")
async def get_all_ids(service: IgnoreFrameService = Depends(get_ignore_frame_service)):
    all_ids = service.get_all_ids()
    with open("all_ids.txt", "w") as f:
        for item_id in all_ids:
            f.write(item_id + "\n")

    print(f"Exported {len(all_ids)} IDs to all_ids.txt")
    return True

@router.delete("/all")
async def delete_all(service: IgnoreFrameService = Depends(get_ignore_frame_service),
                     username: str = Depends(get_current_username)):
    return service.delete_all()
