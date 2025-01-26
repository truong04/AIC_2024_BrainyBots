from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from back_end.app.api.v1.endpoints import ignore_frames, video, user
from back_end.app.api.v1.endpoints import search_frames
from back_end.app.api.v1.endpoints import image_generator
import os
from fastapi.responses import StreamingResponse
from fastapi import Request
import cv2
import aiofiles

from back_end.app.core.config import settings

app = FastAPI(
    title="AIO BrainyBots"
)

app.mount("/keyframes_webp", StaticFiles(directory=settings.keyframe_webp_dir), name="keyframes_webp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ignore_frames.router, prefix="/api/v1/ignore_frames", tags=["Ignore Frames"])
app.include_router(search_frames.router, prefix="/api/v1/search_frames", tags=["Search Frames"])
app.include_router(image_generator.router, prefix="/api/v1/image_generator", tags=["Image Generator"])
app.include_router(video.router, prefix="/api/v1/video", tags=["Video Details"])

app.include_router(user.router, prefix="/api/v1/user", tags=["User"])


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3000)