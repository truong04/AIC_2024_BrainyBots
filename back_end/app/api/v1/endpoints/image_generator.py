import base64
import os
from io import BytesIO

import aiohttp
import requests
from PIL import Image
from fastapi import APIRouter, Body
from openai import AsyncOpenAI

from back_end.app.domain.entities.image_generator_request import ImageGeneratorRequest

router = APIRouter()

os.environ[
    'OPENAI_API_KEY'] = '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'


async def download_and_process_image(image_url):
    async with aiohttp.ClientSession() as session:
        image_response = await session.get(image_url)
        image_data = await image_response.read()
    image = Image.open(BytesIO(image_data))

    # Resize image to 512x512
    image = image.resize((512, 512))

    # Convert image to base64
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return img_str

@router.post("/create")
async def create_image(req: ImageGeneratorRequest):
    client = AsyncOpenAI()
    response = await client.images.generate(
        model="dall-e-3",
        prompt= req.prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    image_url = response.data[0].url

    return {"image": await download_and_process_image(image_url)}