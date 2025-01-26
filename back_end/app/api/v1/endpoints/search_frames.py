import io

from PIL import Image
from fastapi import APIRouter, Depends, Body, UploadFile, File, Form

from back_end.app.api.v1.dependencies import get_search_frame_service
from back_end.app.domain.entities.search_request import SearchRequest
from back_end.app.domain.services.search_frame_service import SearchFrameService

router = APIRouter()


@router.post("/")
async def search_frames(request: SearchRequest = Body(...),
                        service: SearchFrameService = Depends(get_search_frame_service)):
    return await service.search_by_query(request)


@router.post("/by_id")
async def search_frame_by_id(image_id: str = Body(...),
                             feature_model: str = Body(...),
                             service: SearchFrameService = Depends(get_search_frame_service)):
    return await service.search_by_id(image_id, feature_model)


@router.get("/nearest-ids/{image_id}")
async def search_nearest_ids(image_id: str,
                             service: SearchFrameService = Depends(get_search_frame_service)):
    return await service.search_nearest_ids(image_id, 30)


@router.post("/by-image-file")
async def search_by_image_file(file: UploadFile = File(...),
                               result_size: str = Form(None),
                               ocr: str = Form(None),
                               asr: str = Form(None),
                               feature_model: str = Form(None),
                               is_enable_cluster: str = Form(None),
                               cau_hoi_so: str = Form(None),
                               service: SearchFrameService = Depends(get_search_frame_service)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    if ocr is None:
        ocr = ""
    if asr is None:
        asr = ""
    if cau_hoi_so is not None:
        cau_hoi_so = int(cau_hoi_so)
    return await service.search_by_image_file(image, result_size, ocr, asr, feature_model, is_enable_cluster == "True", cau_hoi_so)

@router.post("/remove_cau_hoi_so_by_id")
async def remove_cau_hoi_so_by_id(id_list: list = Body(...), cau_hoi_so: int = Body(...),
                                  service: SearchFrameService = Depends(get_search_frame_service)):
    return await service.remove_cau_hoi_so_by_id(id_list, cau_hoi_so)
