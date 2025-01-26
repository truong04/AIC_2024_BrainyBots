import asyncio
from back_end.app.infrastructure.elasticsearch.video_repository import VideoRepository

class VideoService:
    def __init__(self, video_repository=VideoRepository()):
        self.video_repository = video_repository

    async def get_video_by_id(self, video_id: str):
        try:
            response = await self.video_repository.get_by_video_id(video_id)
            return response['_source']
        except Exception as e:
            raise Exception(f"Error fetching video with id {video_id}: {str(e)}")

# Example usage
if __name__ == "__main__":
    video_service = VideoService()
    video_id = "L01_V001"
    loop = asyncio.get_event_loop()
    video_details = loop.run_until_complete(video_service.get_video_by_id(video_id))
    print(video_details)