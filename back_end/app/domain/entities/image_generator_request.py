

from pydantic import BaseModel


class ImageGeneratorRequest(BaseModel):
    prompt: str
