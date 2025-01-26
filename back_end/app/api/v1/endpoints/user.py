from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
import httpx
from fastapi import Request
router = APIRouter()



@router.post("/login")
async def login(username: str = Body(...), password: str = Body(...)):
    url = 'https://eventretrieval.one/api/v2/login'
    headers = {
        'Content-Type': 'application/json',
    }
    data = {
        "username": username,
        "password": password,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        if response.status_code == 200:
            response_data = response.json()
            session_id = response_data.get('sessionId')

            # Make the second API call using the sessionId
            eval_url = f'https://eventretrieval.one/api/v2/client/evaluation/list?session={session_id}'
            eval_response = await client.get(eval_url)
            if eval_response.status_code == 200:
                eval_data = eval_response.json()
                return JSONResponse(content={"login_data": response_data, "evaluation_data": eval_data})
            else:
                raise HTTPException(status_code=eval_response.status_code, detail=eval_response.text)
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)