# youth_policy_server.py — 최종 수정본
import os
import ssl
from typing import Any, Dict, Optional, Tuple, Iterable, List

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("youth-policy-mcp")

# 청소년정책 API
BASE_URL = (os.getenv("YOUTH_BASE_URL") or "https://www.youthcenter.go.kr/go/ythip/getPlcy").rstrip("/")
API_KEY = (os.getenv("YOUTH_API_KEY") or "55930c52-9e2e-42ba-9aec-f562fc10cd09").strip()

# ✅ [수정] 각 지역별 '이웃 도시' 키워드를 명확하게 추가
REGION_MAPPING = {
    "51150": {
        "name": "강릉시", "keywords": ["강릉"], "province_keywords": ["강원"],
        "sibling_city_keywords": ["춘천", "원주", "속초", "동해", "태백", "삼척", "홍천", "횡성", "영월", "평창", "정선", "철원", "화천", "양구", "인제", "고성", "양양"]
    },
    "51770": {
        "name": "정선군", "keywords": ["정선"], "province_keywords": ["강원"],
        "sibling_city_keywords": ["춘천", "원주", "강릉", "속초", "동해", "태백", "삼척", "홍천", "횡성", "영월", "평창", "철원", "화천", "양구", "인제", "고성", "양양"]
    },
    "51750": {
        "name": "영월군", "keywords": ["영월"], "province_keywords": ["강원"],
        "sibling_city_keywords": ["춘천", "원주", "강릉", "속초", "동해", "태백", "삼척", "홍천", "횡성", "정선", "평창", "철원", "화천", "양구", "인제", "고성", "양양"]
    },
    "44790": {
        "name": "청양군", "keywords": ["청양"], "province_keywords": ["충남", "충청남도"],
        "sibling_city_keywords": ["천안", "공주", "보령", "아산", "서산", "논산", "계룡", "당진", "금산", "부여", "서천", "홍성", "예산", "태안"]
    },
    "52210": {
        "name": "김제시", "keywords": ["김제"], "province_keywords": ["전북", "전라북도"],
        "sibling_city_keywords": ["전주", "익산", "군산", "정읍", "남원", "완주", "진안", "무주", "장수", "임실", "순창", "고창", "부안"]
    }
}


def _client_candidates() -> Iterable[Tuple[str, httpx.Client]]:
    yield "default", httpx.Client(http2=False, timeout=30, trust_env=True)
    try:
        tls = ssl.create_default_context()
        tls.minimum_version = ssl.TLSVersion.TLSv1_2
        try: tls.set_ciphers("DEFAULT:@SECLEVEL=1")
        except Exception: pass
        yield "tls12_seclevel1", httpx.Client(verify=tls, http2=False, timeout=30, trust_env=True)
    except Exception: pass
    yield "insecure", httpx.Client(verify=False, http2=False, timeout=30, trust_env=True)

def _try_get(url: str, params: Dict[str, Any]):
    last_err: Optional[Exception] = None
    for mode, client in _client_candidates():
        try:
            with client as c: return c.get(url, params=params)
        except Exception as e: last_err = e
    if last_err: raise last_err
    raise RuntimeError("No HTTP client candidates available")

def call_youth_api_enhanced(page_num: int = 1, page_size: int = 100, search_attempts: List[str] = None):
    if not API_KEY: return {"status": "error", "message": "YOUTH_API_KEY is missing"}
    all_policies = []
    for filters in (search_attempts or [{}]):
        params = {"apiKeyNm": API_KEY, "pageNum": page_num, "pageSize": page_size, "rtnType": "json", **(filters or {})}
        try:
            resp = _try_get(BASE_URL, params)
            resp.raise_for_status()
            json_data = resp.json()
            if json_data.get("resultCode") == 200:
                policies = json_data.get("result", {}).get("youthPolicyList", [])
                if policies: all_policies.extend(policies)
        except Exception as e:
            print(f"API 호출 오류: {e}")
    unique_policies = {p['plcyNo']: p for p in all_policies if p.get('plcyNo')}
    final_policies = list(unique_policies.values())
    return {"status": "ok" if final_policies else "no_results", "policies": final_policies}


@mcp.tool()
def searchPoliciesByRegion(regionCode: str, pageNum: int = 1, pageSize: int = 50, categories: Optional[str] = None, **kwargs):
    """
    지역별 청소년정책 검색 - 이웃 도시 제거 로직이 포함된 최종 필터링
    """
    if regionCode not in REGION_MAPPING:
        return {"status": "error", "message": f"지원하지 않는 지역코드: {regionCode}."}

    region_info = REGION_MAPPING[regionCode]
    search_attempts = []
    search_keywords = region_info["keywords"] + region_info["province_keywords"]
    for keyword in set(search_keywords):
        base_filter = {"plcyNm": keyword}
        if categories: base_filter["lclsfNm"] = categories
        search_attempts.append(base_filter)

    api_result = call_youth_api_enhanced(page_num=pageNum, page_size=pageSize, search_attempts=search_attempts)

    # --- 💡 여기가 새롭게 수정된 최종 필터링 로직 💡 ---
    if api_result["status"] == "ok":
        original_policies = api_result["policies"]
        
        target_keyword = region_info["keywords"][0] # "청양", "강릉" 등
        sibling_keywords = set(region_info.get("sibling_city_keywords", []))

        filtered_policies = []
        for policy in original_policies:
            full_text = " ".join(filter(None, [
                policy.get("plcyNm", ""),       # 정책 이름
                policy.get("plcyExplnCn", ""),  # 정책 설명
                policy.get("cnsgNmor", ""),      # 담당 기관
            ]))

            # 1순위 (무조건 포함): '청양'처럼 타겟 도시 이름이 있으면 무조건 통과
            if target_keyword in full_text:
                filtered_policies.append(policy)
                continue

            # 2순위 (무조건 제외): '공주', '논산'처럼 이웃 도시 이름이 있으면 무조건 제외
            if any(sibling in full_text for sibling in sibling_keywords):
                continue
            
            # 3순위 (광역 정책으로 간주하고 포함): 위 두 조건에 모두 해당 안되면 통과
            filtered_policies.append(policy)

        api_result["policies"] = filtered_policies
        api_result["total_count"] = len(filtered_policies)
        api_result["search_summary"] = f"API 검색 결과 {len(original_policies)}개 중, 최종 필터링 후 {len(filtered_policies)}개 발견"
        if not filtered_policies:
            api_result["status"] = "no_results"

    return api_result


@mcp.tool()
def searchYouthPolicies(pageNum: int = 1, pageSize: int = 20, **kwargs):
    filters = {k: v for k, v in kwargs.items() if v is not None}
    return call_youth_api_enhanced(page_num=pageNum, page_size=pageSize, search_attempts=[filters])

@mcp.tool()
def getYouthPolicyDetail(policyNumber: str, **kwargs):
    return call_youth_api_enhanced(search_attempts=[{"plcyNo": policyNumber}])

@mcp.tool()
def ping():
    return {"status": "ok", "message": "Youth policy server (final-fix) pong"}

def main():
    try:
        names = [t.name for t in mcp._tools]
        print(f"[YOUTH POLICY SERVER FINAL] tools: {names}", flush=True)
    except Exception: pass
    mcp.run()

if __name__ == "__main__":
    main()