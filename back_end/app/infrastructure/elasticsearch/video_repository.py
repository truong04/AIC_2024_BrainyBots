from elasticsearch import AsyncElasticsearch

from back_end.app.core.config import settings


class VideoRepository:
    def __init__(self):
        self.index_name = "video_index"
        self.es = AsyncElasticsearch(
            [{'host': settings.elasticsearch_host, 'port': settings.elasticsearch_port,
              'scheme': settings.elasticsearch_scheme}],
            basic_auth=(settings.elasticsearch_user, settings.elasticsearch_password))

    # get content by video_id
    async def get_by_video_id(self, video_id: str):
        response = await self.es.get(index=self.index_name, id=video_id)
        return response

