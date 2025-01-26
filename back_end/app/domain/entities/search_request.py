from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str
    ocr: str
    asr: str
    feature_model: str
    result_size: int
    is_enable_cluster: bool
    cau_hoi_so: int | None