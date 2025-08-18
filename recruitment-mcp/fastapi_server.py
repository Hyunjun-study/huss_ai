# fastapi_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 패키지 방식으로 import
from src.web_api_handler import WebAPIHandler

# FastAPI 앱 생성
app = FastAPI(
    title="이음(IEUM) 통합 정보 조회 API",
    description="채용정보 + 부동산 + 청소년정책 통합 검색 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용으로 모든 오리진 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 핸들러 초기화
handler = WebAPIHandler()

# === Request/Response 모델들 ===
class SearchRequest(BaseModel):
    query: str
    region_code: str = "44790"

class JobSearchRequest(BaseModel):
    region_code: str
    job_field: Optional[str] = None
    hire_type: Optional[str] = None
    education: Optional[str] = None

class RealestateSearchRequest(BaseModel):
    region_code: str
    deal_ymd: str = "202506"

class PolicySearchRequest(BaseModel):
    region_code: str
    keywords: Optional[str] = None

# === API 엔드포인트들 ===
@app.post("/api/search/comprehensive")
async def search_comprehensive(request: SearchRequest):
    try:
        result = await handler.search_comprehensive(
            query=request.query,
            region_code=request.region_code
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.post("/api/search/jobs")
async def search_jobs(request: JobSearchRequest):
    # 필터 구성
    filters = {}
    if request.job_field:
        filters["ncsCdLst"] = request.job_field
    if request.hire_type:
        filters["hireTypeLst"] = request.hire_type
    if request.education:
        filters["acbgCondLst"] = request.education
    
    try:
        # ✅ WebAPIHandler 사용하도록 수정
        result = await handler.search_jobs_only(
            region_code=request.region_code,
            filters=filters
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.post("/api/search/realestate")
async def search_realestate(request: RealestateSearchRequest):
    try:
        # ✅ WebAPIHandler 사용하도록 수정
        result = await handler.search_realestate_only(
            region_code=request.region_code,
            deal_ymd=request.deal_ymd
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.post("/api/search/policies")
async def search_policies(request: PolicySearchRequest):
    try:
        # ✅ WebAPIHandler 사용하도록 수정
        result = await handler.search_policies_only(
            region_code=request.region_code,
            keywords=request.keywords
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "이음 API 서버가 정상 동작 중입니다.",
        "supported_regions": {
            "51770": "정선군",
            "51750": "영월군", 
            "44790": "청양군",
            "51150": "강릉시",
            "52210": "김제시"
        }
    }

@app.get("/api/regions")
async def get_supported_regions():
    return {
        "regions": {
            "51770": "정선군",
            "51750": "영월군",
            "44790": "청양군", 
            "51150": "강릉시",
            "52210": "김제시"
        }
    }

@app.get("/api/job-fields")
async def get_job_fields():
    return {
        "job_fields": {
            "R600020": "정보통신",
            "R600006": "보건.의료",
            "R600004": "교육.자연.사회과학",
            "R600002": "경영.회계.사무",
            "R600014": "건설",
            "R600025": "연구"
        }
    }

def run_server():
    uvicorn.run(
        "fastapi_server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    run_server()