from pydantic import BaseModel


class IgnoreFrame(BaseModel):
    video_id: str
    frame_id: str
