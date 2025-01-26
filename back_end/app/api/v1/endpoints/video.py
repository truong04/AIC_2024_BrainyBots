from fastapi import APIRouter, Depends, HTTPException
from back_end.app.domain.services.video_service import VideoService
from back_end.app.api.v1.dependencies import get_video_service
from fastapi.responses import StreamingResponse
from fastapi import Request
import aiofiles
import os
router = APIRouter()
video_dir = "/media/daoan/T7 Shield2/AI_Challenge_2024_DATA/video_with_audio"
@router.get("/{video_id}")
async def get_video_by_id(video_id: str, service: VideoService = Depends(get_video_service)):
    try:
        video_details = await service.get_video_by_id(video_id)
        return video_details
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


CHUNK_SIZE = 1024 * 1024  # 1 MB
@router.get("/stream/{video_id}")
async def stream_video(video_id: str, request: Request):
    video_path = os.path.join(video_dir, f"Videos_{video_id.split('_')[0]}/video/{video_id}.mp4")
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")

    range_header = request.headers.get("range")
    file_size = os.path.getsize(video_path)

    async def get_video_stream(start: int = 0, end: int = None):
        async with aiofiles.open(video_path, "rb") as video_file:
            await video_file.seek(start)
            remaining_bytes = end - start + 1 if end else None
            while remaining_bytes:
                chunk_size = min(CHUNK_SIZE, remaining_bytes)
                data = await video_file.read(chunk_size)
                if not data:
                    break
                yield data
                remaining_bytes -= len(data)

    if range_header:
        start, end = 0, file_size - 1
        range_match = range_header.strip().replace("bytes=", "").split("-")

        if range_match[0]:
            start = int(range_match[0])
        if range_match[1]:
            end = int(range_match[1])

        content_length = end - start + 1
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(get_video_stream(start, end), headers=headers, status_code=206)
    else:
        headers = {
            "Content-Length": str(file_size),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(get_video_stream(), headers=headers)