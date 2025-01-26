from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette import status

from back_end.app.core.config import settings
from back_end.app.domain.services.ignore_frame_service import IgnoreFrameService
from back_end.app.domain.services.search_frame_service import SearchFrameService
from back_end.app.domain.services.video_service import VideoService


def get_ignore_frame_service():
    return IgnoreFrameService()

def get_search_frame_service():
    return SearchFrameService()

def get_video_service():
    return VideoService()

security = HTTPBasic()

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = settings.username
    correct_password = settings.password
    if credentials.username != correct_username or credentials.password != correct_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username