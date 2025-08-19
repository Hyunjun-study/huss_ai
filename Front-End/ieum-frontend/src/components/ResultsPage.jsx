// src/components/ResultsPage.jsx - 최종 수정 버전

import React, { useState, useMemo, useRef, useEffect } from "react";
import "./ResultsPage.css";

import briefcaseIcon from "../assets/briefcase.svg";
import homeIcon from "../assets/home.svg";
import docIcon from "../assets/document-text.svg";
import arrowDownIcon from "../assets/arrow-down.svg";
import koreaMap from "../assets/south_korea.svg";
import bgImg from "../assets/background.svg";

import hospitalIcon from "../assets/hospital.svg"; // 병원
import pillIcon from "../assets/pill.svg";     // 약국
import convIcon from "../assets/conv.svg";     // 편의점

function ResultsPage({ searchData, resultData, onBackToMain }) {
  const [activeTab, setActiveTab] = useState("summary");
  const containerRef = useRef(null);   // 스냅 컨테이너
  const analysisRef = useRef(null);    // 분석결과 섹션
  const [page, setPage] = useState(0); // 0: 히어로, 1: 분석
  const animatingRef = useRef(false);  // 전환 진행 중 여부
  const tabContentRef = useRef(null);

  const scrollToAnalysis = () => goTo(1, 1100);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !analysisRef.current) return;

    // 내부 스크롤은 그대로 두고, 섹션 전환 때만 개입
    const onWheel = (e) => {
      if (isInsideMap(e.target) || isScrollableArea(e.target, e.deltaY)) return;
      e.preventDefault();
      if (animatingRef.current) return;

      if (e.deltaY > 0 && page === 0) goTo(1, 1100);
      else if (e.deltaY < 0 && page === 1) goTo(0, 1100);
    };

    const onKey = (e) => {
      if (isScrollableArea(document.activeElement || e.target)) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        if (page === 0) goTo(1, 1100);
      }
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        if (page === 1) goTo(0, 1100);
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("keydown", onKey);
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("keydown", onKey);
    };
  }, [page]);

  useEffect(() => {
    const el = tabContentRef.current;
    if (!el) return;
    // 탭 전환 시 항상 최상단
    el.scrollTop = 0;
    el.querySelectorAll('[data-reset-on-tab]').forEach(node => {
      node.scrollTop = 0;
    });
  }, [activeTab]);

  const mapRef = useRef(null);

  // 지도와 마커 저장용 ref
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const highlightMarker = (aptNm, on = true) => {
    const entry = markersRef.current[aptNm];
    if (!entry) return;
    entry.marker.setZIndex(on ? 999 : 0);
  };

  // 주변시설 검색 함수 ref
  const searchNearbyRef = useRef(null);

  // 부드러운 컨테이너 스크롤
  const smoothScrollTo = (targetY, duration = 1100, onDone) => {
    const el = containerRef.current; if (!el) return;
    const startY = el.scrollTop;
    const diff = targetY - startY;
    let start;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      el.scrollTop = startY + diff * easeOutCubic(p);
      if (p < 1) requestAnimationFrame(step);
      else onDone && onDone();
    };
    requestAnimationFrame(step);
  };

  // 컨테이너 기준 Y 좌표
  const getTop = (el, container) => {
    const cTop = container.getBoundingClientRect().top;
    const eTop = el.getBoundingClientRect().top;
    return container.scrollTop + (eTop - cTop);
  };

  // 섹션 인덱스로 전환
  const goTo = (index, duration = 1100) => {
    if (!containerRef.current || animatingRef.current) return;
    const y = index === 0 ? 0 : getTop(analysisRef.current, containerRef.current);
    animatingRef.current = true;
    smoothScrollTo(y, duration, () => {
      animatingRef.current = false;
      setPage(index);
    });
  };

  // 맵 컨테이너 내부 검사
  const isInsideMap = (node) => {
    const el = mapRef.current;
    return !!(el && (node === el || el.contains(node)));
  };

  // 내부 스크롤 영역 판별
  const isScrollableArea = (node, dy = 0) => {
    const container = containerRef.current;
    while (node && node !== container) {
      const style = window.getComputedStyle(node);
      const canScroll = /(auto|scroll)/.test(style.overflowY);
      if (canScroll && node.scrollHeight > node.clientHeight) {
        const atTop = node.scrollTop <= 0;
        const atBottom = Math.ceil(node.scrollTop + node.clientHeight) >= node.scrollHeight;
        if (!atTop && !atBottom) return true;
        if (atTop && dy < 0) return false;
        if (atBottom && dy > 0) return false;
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const handlePropertyClick = (aptNm) => {
    const map = mapInstanceRef.current;
    const target = markersRef.current[aptNm];
    if (!map || !target) return;
    map.setCenter(target.coords);
    target.infowindow.open(map, target.marker);
    if (searchNearbyRef.current) {
      searchNearbyRef.current(target.coords);
    }
  };

  const formatPrice = (priceStr) => {
    if (!priceStr) return "가격 정보 없음";
    const price = priceStr.replace(/,/g, "");
    if (isNaN(price)) return priceStr;
    const priceNum = parseInt(price, 10);
    if (priceNum >= 10000) {
      const eok = Math.floor(priceNum / 10000);
      const man = priceNum % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${priceNum.toLocaleString()}만원`;
  };

  useEffect(() => {
    if (activeTab !== "realestate") return;
    if (!mapRef.current || !window.kakao) return;

    const { kakao } = window;

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });
    mapInstanceRef.current = map;

    const geocoder = new kakao.maps.services.Geocoder();
    const places = new kakao.maps.services.Places();
    const items = resultData.realestate?.properties || [];
    if (items.length === 0) return;

    // 주변시설 마커 관리
    const facilityMarkers = [];
    const clearFacilityMarkers = () => {
      facilityMarkers.forEach((m) => m.setMap(null));
      facilityMarkers.length = 0;
    };

    // 커스텀 아이콘
    const ICON_SIZE = 24;
    const markerSize = new kakao.maps.Size(ICON_SIZE, ICON_SIZE);
    const markerOffset = new kakao.maps.Point(ICON_SIZE / 2, ICON_SIZE);

    const CATEGORY_ICON_URLS = {
      "병원": hospitalIcon,
      "약국": pillIcon,
      "편의점": convIcon,
    };

    const getFacilityMarkerImage = (keyword) => {
      const url = CATEGORY_ICON_URLS[keyword] || convIcon;
      return new kakao.maps.MarkerImage(url, markerSize, { offset: markerOffset });
    };

    // 주변시설 검색
    searchNearbyRef.current = (coords) => {
      clearFacilityMarkers();
      const categories = ["병원", "편의점", "약국"];
      categories.forEach((keyword) => {
        places.keywordSearch(
          keyword,
          (results, status) => {
            if (status === kakao.maps.services.Status.OK) {
              results.forEach((place) => {
                const facilityMarker = new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(place.y, place.x),
                  map,
                  image: getFacilityMarkerImage(keyword),
                });
                facilityMarkers.push(facilityMarker);

                const info = new kakao.maps.InfoWindow({
                  content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`,
                });

                kakao.maps.event.addListener(facilityMarker, "click", () => {
                  info.open(map, facilityMarker);
                  map.setCenter(coords);
                });
              });
            }
          },
          { location: coords, radius: 1000 }
        );
      });
    };

    // 첫 매물 중심
    const firstProperty = items[0];
    const firstQuery = `${firstProperty.estateAgentSggNm || ""} ${firstProperty.umdNm || ""}`.trim();
    if (firstQuery) {
      geocoder.addressSearch(firstQuery, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
          map.setCenter(coords);
        }
      });
    }

    // 아파트 마커
    items.slice(0, 20).forEach((property) => {
      const query = `${property.estateAgentSggNm || ""} ${property.umdNm || ""} ${property.jibun || ""}`.trim();
      geocoder.addressSearch(query, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
          const marker = new kakao.maps.Marker({ position: coords, map });
          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;">
                        ${property.aptNm || "아파트"}<br/>
                        ${formatPrice(property.dealAmount)}
                      </div>`,
          });
          kakao.maps.event.addListener(marker, "click", () => {
            infowindow.open(map, marker);
            map.setCenter(coords);
          });
          markersRef.current[property.aptNm] = { marker, infowindow, coords };
        }
      });
    });
  }, [activeTab, resultData.realestate]);

  // 데이터 안전성 검증
  const hasValidData = (data) => data && typeof data === "object" && data.success === true;
  const hasArrayData = (data, arrayKey) => hasValidData(data) && Array.isArray(data[arrayKey]) && data[arrayKey].length > 0;

  // 탭별 상태
  const tabStatus = useMemo(() => {
    return {
      summary: {
        hasData: hasValidData(resultData?.summary),
        isEmpty:
          !hasValidData(resultData?.summary) ||
          (resultData?.summary?.summary?.total_jobs === 0 &&
            resultData?.summary?.summary?.total_properties === 0 &&
            resultData?.summary?.summary?.total_policies === 0),
        error: resultData?.summary?.success === false ? "종합 분석 데이터를 불러올 수 없습니다." : null,
      },
      jobs: {
        hasData: hasArrayData(resultData?.jobs, "jobs"),
        isEmpty: hasValidData(resultData?.jobs) && (!resultData?.jobs?.jobs || resultData?.jobs?.jobs.length === 0),
        error: resultData?.jobs?.success === false ? "일자리 정보를 불러올 수 없습니다." : null,
      },
      realestate: {
        hasData: hasArrayData(resultData?.realestate, "properties"),
        isEmpty:
          hasValidData(resultData?.realestate) &&
          (!resultData?.realestate?.properties || resultData?.realestate?.properties.length === 0),
        error: resultData?.realestate?.success === false ? "부동산 정보를 불러올 수 없습니다." : null,
      },
      policies: {
        hasData: hasArrayData(resultData?.policies, "policies"),
        isEmpty:
          hasValidData(resultData?.policies) && (!resultData?.policies?.policies || resultData?.policies?.policies.length === 0),
        error: resultData?.policies?.success === false ? "정책 정보를 불러올 수 없습니다." : null,
      },
    };
  }, [resultData]);

  const handleTabChange = (tabName) => setActiveTab(tabName);

  const getTabButtonClass = (tabName) => {
    let className = "tab-button";
    if (activeTab === tabName) className += " active";
    const status = tabStatus[tabName];
    if (status.error) className += " error";
    else if (status.isEmpty) className += " empty";
    else if (status.hasData) className += " success";
    return className;
  };

  const getTabIcon = (tabName) => {
    const status = tabStatus[tabName];
    if (status.error) return "";
    if (status.isEmpty) return "";
    if (status.hasData) return "";
    return "";
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
  };

  // 요약 탭
  const renderSummaryTab = () => {
    const status = tabStatus.summary;
    if (status.error) return <div className="error-state">{status.error}</div>;
    if (!status.hasData) return <div className="no-data">종합 분석 데이터를 준비 중입니다...</div>;

    const summary = resultData.summary.summary || {};
    const preview = resultData.summary.preview_data || {};
    const regionInfo = resultData.summary.region_info || {};

    return (
      <div>
        <h3>{regionInfo.name || summary.region_name || "지역"} 종합 분석</h3>

        <div className="summary-grid">
          <div className="summary-card">
            <h3>{summary.total_jobs || 0}</h3>
            <p>채용공고</p>
          </div>
          <div className="summary-card">
            <h3>{summary.total_properties || 0}</h3>
            <p>부동산 매물</p>
          </div>
          <div className="summary-card">
            <h3>{summary.total_policies || 0}</h3>
            <p>지원정책</p>
          </div>
          <div className="summary-card">
            <h3>{summary.avg_property_price || "N/A"}</h3>
            <p>평균 매매가</p>
          </div>
        </div>

        <h4>미리보기</h4>
        <div className="data-list">
          {preview.jobs?.slice(0, 2).map((job, index) => (
            <div key={`job-${index}`} className="data-item preview-item">
              <h4>{job.instNm || "기관명 없음"}</h4>
              <p>{job.recrutPbancTtl || "제목 없음"}</p>
              <p>{job.workRgnNmLst || "근무지역 미정"}</p>
              {job.pbancEndYmd && <p>마감일: {formatDate(job.pbancEndYmd)}</p>}
            </div>
          ))}

          {preview.realestate?.slice(0, 2).map((property, index) => (
            <div key={`property-${index}`} className="data-item preview-item">
              <h4>{property.aptNm || "아파트명 없음"}</h4>
              <p>{formatPrice(property.dealAmount)}</p>
              <p>{property.excluUseAr || "면적 정보 없음"}㎡</p>
              <p>{property.umdNm || "위치 정보 없음"}</p>
            </div>
          ))}

          {preview.policies?.slice(0, 2).map((policy, index) => (
            <div key={`policy-${index}`} className="data-item preview-item">
              <h4>{policy.plcyNm || "정책명 없음"}</h4>
              <p>{(policy.plcyExplnCn || "설명 없음").substring(0, 100)}...</p>
              <p>{policy.sprvsnInstCdNm || "담당기관 미정"}</p>
            </div>
          ))}
        </div>

        <div className="data-status-summary">
          <h4>데이터 수집 결과</h4>
          <div className="status-grid">
            {Object.entries(tabStatus).map(([key, status]) => {
              const labels = { summary: "종합분석", jobs: "일자리", realestate: "부동산", policies: "정책" };
              return (
                <div key={key} className={`status-indicator ${status.hasData ? "success" : status.error ? "error" : "empty"}`}>
                  <span className="status-icon">{getTabIcon(key)}</span>
                  <span className="status-name">{labels[key]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 일자리 탭
  const renderJobsTab = () => {
    const status = tabStatus.jobs;
    if (status.error) return <div className="error-state">{status.error}</div>;
    if (status.isEmpty) {
      const regionName = resultData?.jobs?.region_info?.name || "해당 지역";
      return (
        <div className="no-data">
          <p><strong>{regionName}의 채용정보를 찾을 수 없습니다.</strong></p>
          <br />
          <p><strong>제안:</strong></p>
          <p>- 인근 시·군으로 확장해보세요</p>
          <p>- 원격근무 가능한 직종을 찾아보세요</p>
        </div>
      );
    }
    if (!status.hasData) return <div className="loading-state">일자리 정보를 불러오는 중...</div>;

    const jobs = resultData.jobs.jobs || [];
    const stats = resultData.jobs.statistics || {};
    const regionName = resultData.jobs.region_info?.name || "";

    return (
      <div>
        <h3>{regionName} 채용정보 ({stats.total || jobs.length}건)</h3>

        {Object.keys(stats.by_category || {}).length > 0 && (
          <div className="summary-grid" style={{ marginBottom: "1rem" }}>
            <div className="summary-card"><h3>{stats.total || jobs.length}</h3><p>총 채용공고</p></div>
            <div className="summary-card"><h3>{Object.keys(stats.by_category || {}).length}</h3><p>직무분야</p></div>
            <div className="summary-card"><h3>{Object.keys(stats.by_type || {}).length}</h3><p>고용형태</p></div>
          </div>
        )}

        <div className="data-list">
          {jobs.map((job, index) => (
            <div key={`job-${index}`} className="data-item">
              <div className="job-header">
                <h4>
                  <strong>{job.display_number || index + 1}. {job.formatted_company || job.instNm}</strong>
                  {job.formatted_hire_type && <span className="hire-type">({job.formatted_hire_type})</span>}
                </h4>
                <p className="job-title"><strong>{job.formatted_title || job.recrutPbancTtl}</strong></p>
              </div>
              <div className="job-details">
                {job.formatted_region && <p><strong>근무지역</strong>: {job.formatted_region}</p>}
                {job.formatted_recruit_type && job.formatted_recruit_type !== "구분 없음" && job.formatted_recruit_type !== "미정" &&
                  <p><strong>채용구분</strong>: {job.formatted_recruit_type}</p>}
                {job.formatted_deadline && <p><strong>마감일</strong>: {job.formatted_deadline}</p>}
                {job.formatted_ncs_field && <p><strong>직무분야</strong>: {job.formatted_ncs_field}</p>}
                {job.formatted_education && <p><strong>학력요건</strong>: {job.formatted_education}</p>}
                {job.formatted_hire_type_detailed &&
                  job.formatted_hire_type_detailed !== job.formatted_hire_type &&
                  !job.display_title?.includes(job.formatted_hire_type_detailed) &&
                  <p><strong>고용형태 상세</strong>: {job.formatted_hire_type_detailed}</p>}
                {job.career_cond && <p><strong>경력조건</strong>: {job.career_cond}</p>}
                {job.recruit_count && <p><strong>모집인원</strong>: {job.recruit_count}명</p>}
                {job.work_type && <p><strong>근무형태</strong>: {job.work_type}</p>}
                {job.salary_type && <p><strong>급여형태</strong>: {job.salary_type}</p>}
                {job.application_method && <p><strong>지원방법</strong>: {job.application_method}</p>}
                {job.contact_info && <p><strong>문의처</strong>: {job.contact_info}</p>}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(stats.by_category || {}).length > 0 && (
          <div className="statistics-summary">
            <h4>채용 현황 요약</h4>
            <div className="stats-grid">
              <div className="stats-section">
                <strong>주요 직무분야:</strong>
                <ul>{Object.entries(stats.by_category || {}).slice(0, 5).map(([category, count]) => (<li key={category}>{category}: {count}건</li>))}</ul>
              </div>
              <div className="stats-section">
                <strong>고용형태:</strong>
                <ul>{Object.entries(stats.by_type || {}).slice(0, 3).map(([type, count]) => (<li key={type}>{type}: {count}건</li>))}</ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 부동산 탭
  const renderRealestateTab = () => {
    const status = tabStatus.realestate;
    if (status.error) return <div className="error-state">{status.error}</div>;
    if (status.isEmpty) return <div className="no-data">해당 지역의 실거래 정보가 없습니다.</div>;
    if (!status.hasData) return <div className="loading-state">부동산 정보를 불러오는 중...</div>;

    const properties = resultData.realestate.properties || [];
    const regionName = resultData.realestate.region_info?.name || "";

    return (
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* 왼쪽: 아파트 목록 */}
        <div className="properties-list" style={{ flex: "1", minWidth: "400px" }}>
          <h4>실거래 목록</h4>
          <div className="data-list" style={{ maxHeight: "600px", overflowY: "auto" }}>
            {properties.map((property, index) => (
              <div
                key={`property-${index}`}
                className="data-item"
                style={{ cursor: "pointer" }}
                onClick={() => handlePropertyClick(property.aptNm)}
                onMouseEnter={() => highlightMarker(property.aptNm, true)}
                onMouseLeave={() => highlightMarker(property.aptNm, false)}
              >
                <h4>{property.aptNm || "아파트명 없음"}</h4>
                <p>거래금액: {formatPrice(property.dealAmount)}</p>
                <p>전용면적: {property.excluUseAr || "정보 없음"}㎡</p>
                <p>층수: {property.floor || "정보 없음"}층</p>
                <p>건축년도: {property.buildYear || "정보 없음"}년</p>
                <p>위치: {property.umdNm || "정보 없음"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 카카오 지도 */}
        <div className="map-section" style={{ flex: "1", minWidth: "400px", position: "sticky", top: "20px" }}>
          <h4>위치 지도</h4>
          <div
            ref={mapRef}
            className="kakao-map"
            style={{ width: "100%", height: "500px", border: "1px solid #ddd", borderRadius: "8px" }}
          ></div>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            아파트 목록을 클릭하면 지도에서 해당 위치로 이동합니다 <br />
            최대 {Math.min(properties.length, 20)}개 매물만 표시
          </p>
        </div>
      </div>
    );
  };

  // 정책 탭 (AI 섹션 클래스 기반으로 교체)
  const renderPoliciesTab = () => {
    const status = tabStatus.policies;
    if (status.error) return <div className="error-state">{status.error}</div>;
    if (status.isEmpty) return <div className="no-data">해당 지역의 청년정책이 없습니다.</div>;
    if (!status.hasData) return <div className="loading-state">정책 정보를 불러오는 중...</div>;

    const policies = resultData.policies.policies || [];
    const categories = resultData.policies.categories || {};
    const regionName = resultData.policies.region_info?.name || "";

    // AI 분석 결과/인사이트
    const aiAnalysis = resultData.policies.ai_analysis;
    const aiInsights = resultData.policies.ai_insights;

    // 디버깅
    console.log("[FRONTEND-DEBUG] AI 분석 결과:", aiAnalysis);
    console.log("[FRONTEND-DEBUG] AI 인사이트:", aiInsights);

    return (
      <div>
        <h3>{regionName} 청년지원정책 ({policies.length}건)</h3>

        {/* AI 맞춤 정책 추천 패널 */}
        {aiAnalysis && aiAnalysis.ai_enhanced && (
          <div className="ai-panel ai-panel--recommend">
            <h4 className="ai-panel__title">AI 맞춤 정책 추천</h4>

            {aiAnalysis.analysis?.맞춤_추천 && (
              <div className="ai-section">
                <h5 className="ai-section__title">추천 정책</h5>
                <div className="ai-reco-list">
                  {aiAnalysis.analysis.맞춤_추천.map((rec, i) => (
                    <div key={i} className="ai-card">
                      <h6 className="ai-card__title">
                        <span className="ai-badge">우선순위 {rec.우선순위}</span>
                        {rec.정책명}
                      </h6>
                      <p className="ai-card__line"><strong>추천 이유</strong> {rec.추천_이유}</p>
                      <p className="ai-card__line"><strong>예상 혜택</strong> {rec.예상_혜택}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.analysis?.종합_분석 && (
              <div className="ai-section">
                <h5 className="ai-section__title">종합 분석</h5>
                <p className="ai-note">{aiAnalysis.analysis.종합_분석}</p>
              </div>
            )}

            {aiAnalysis.analysis?.주의사항 && (
              <div className="ai-section">
                <h5 className="ai-section__title ai-section__title--warn">⚠️ 주의사항</h5>
                <p className="ai-note ai-note--warn">{aiAnalysis.analysis.주의사항}</p>
              </div>
            )}

            {aiAnalysis.analysis?.다음_단계 && (
              <div className="ai-section">
                <h5 className="ai-section__title ai-section__title--ok">다음 단계</h5>
                <p className="ai-note ai-note--ok">{aiAnalysis.analysis.다음_단계}</p>
              </div>
            )}

            <div className="ai-panel__meta">
              AI 분석 완료 | 처리된 정책: {aiAnalysis.processed_policies}개 | 신뢰도: {aiAnalysis.confidence}
            </div>
          </div>
        )}

        {/* AI 인사이트 패널 */}
        {aiInsights && aiInsights.insights_available && (
          <div className="ai-panel ai-panel--insights">
            <h4 className="ai-panel__title">AI 지역 정책 인사이트</h4>

            <div className="ai-grid">
              {aiInsights.insights?.지역_특징 && (
                <div className="ai-info-card">
                  <h6>지역 특징</h6>
                  <p>{aiInsights.insights.지역_특징}</p>
                </div>
              )}
              {aiInsights.insights?.강점 && (
                <div className="ai-info-card">
                  <h6>주요 강점</h6>
                  <p>{aiInsights.insights.강점}</p>
                </div>
              )}
              {aiInsights.insights?.개선점 && (
                <div className="ai-info-card">
                  <h6>개선점</h6>
                  <p>{aiInsights.insights.개선점}</p>
                </div>
              )}
              {aiInsights.insights?.추천_전략 && (
                <div className="ai-info-card">
                  <h6>추천 전략</h6>
                  <p>{aiInsights.insights.추천_전략}</p>
                </div>
              )}
            </div>

            <div className="ai-highlight">
              <strong>{aiInsights.insights?.한줄_요약}</strong>
              <span>정책 시장 점수: {aiInsights.insights?.시장_점수}/10</span>
            </div>
          </div>
        )}

        {/* AI 데이터 없음 디버그 박스 (톤 맞춤) */}
        {(!aiAnalysis || !aiAnalysis.ai_enhanced) && (
          <div className="ai-debug">
            <h5> AI 분석 디버깅 정보</h5>
            <ul className="ai-debug__list">
              <li>AI 분석 상태: {aiAnalysis ? "데이터 있음" : "데이터 없음"}</li>
              <li>AI 활성화: {aiAnalysis && aiAnalysis.ai_enhanced ? "예" : "아니오"}</li>
              <li>전체 데이터 크기: {JSON.stringify(resultData.policies).length}자</li>
            </ul>
            <details className="ai-debug__details">
              <summary>전체 응답 데이터 보기</summary>
              <pre>{JSON.stringify(resultData.policies, null, 2)}</pre>
            </details>
          </div>
        )}

        {/* 카테고리별 통계 */}
        {Object.keys(categories).length > 0 && (
          <div className="summary-grid" style={{ marginBottom: "1rem" }}>
            {Object.entries(categories).slice(0, 4).map(([category, count]) => (
              <div key={category} className="summary-card">
                <h3>{count}</h3>
                <p>{category}</p>
              </div>
            ))}
          </div>
        )}

        {/* 정책 목록 */}
        <div className="data-list">
          {policies.map((policy, index) => (
            <div key={`policy-${index}`} className="data-item">
              <h4>{policy.plcyNm || "정책명 없음"}</h4>
              {policy.plcyExplnCn && (
                <p className="policy-description">
                  {policy.plcyExplnCn.substring(0, 200)}
                  {policy.plcyExplnCn.length > 200 ? "..." : ""}
                </p>
              )}
              <div className="policy-details">
                <p><strong>담당기관</strong>: {policy.sprvsnInstCdNm || "정보 없음"}</p>
                <p><strong>분야</strong>: {[policy.lclsfNm, policy.mclsfNm].filter(Boolean).join(" > ") || "분야 정보 없음"}</p>
                <p><strong>적용범위</strong>: {policy.scope_display || "범위 정보 없음"}</p>
                {policy.support_content_display && <p><strong>지원내용</strong>: {policy.support_content_display}</p>}
                {policy.business_period_display && <p><strong>사업기간</strong>: {policy.business_period_display}</p>}
                <p><strong>신청기간</strong>: {policy.apply_period_display || "상시접수"}</p>
                {policy.sprtSclCnt && policy.sprtSclCnt !== "0" && <p><strong>지원규모</strong>: {policy.support_scale_display}</p>}
                {policy.plcyKywdNm && <p><strong>키워드</strong>: {policy.plcyKywdNm}</p>}
                {policy.detail_url && (
                  <p>
                    <a href={policy.detail_url} target="_blank" rel="noopener noreferrer" className="policy-link">상세보기</a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 사용자 프롬프트 → 히어로 부제
  const rawPrompt =
    searchData?.prompt ??
    searchData?.userPrompt ??
    searchData?.query ??
    resultData?.input_prompt ??
    resultData?.query?.raw ??
    resultData?.summary?.user_prompt ??
    "";

  const userPromptDisplay =
    (typeof rawPrompt === "string" && rawPrompt.trim())
      ? rawPrompt.trim()
      : (resultData?.summary?.region_info?.name
        || resultData?.summary?.summary?.region_name
        || "사용자 입력");

  return (
    <div
      className="results-container snap-container"
      ref={containerRef}
      tabIndex={0}
      style={{ '--bg-img': `url(${bgImg})` }}
    >
      <button
        className="newchat-fab"
        onClick={onBackToMain}
        aria-label="Start a new chat"
        title="New Chat"
      >
        New Chat
      </button>

      {/* ① 탐색결과 섹션 */}
      <section className="snap-section hero-section">
        <div className="hero-wrap">
          <h1 className="hero-title">ieum의 탐색 결과</h1>
          <p className="hero-sub">
            <span className="hero-prompt">"{userPromptDisplay}"</span>의 분석 결과입니다.
          </p>

          {/* AI 브리핑 카드 */}
          <div className="briefing-card">
            <div className="briefing-left">
              <h2 className="briefing-title">AI 브리핑 카드</h2>
              <ul className="briefing-list">
                <li className="briefing-item">
                  <img src={briefcaseIcon} alt="" />
                  <span className="label">일자리</span>
                  <span className="count">{resultData?.summary?.summary?.total_jobs ?? 0}건</span>
                </li>
                <li className="briefing-item">
                  <img src={homeIcon} alt="" />
                  <span className="label">부동산</span>
                  <span className="count">{resultData?.summary?.summary?.total_properties ?? 0}건</span>
                </li>
                <li className="briefing-item">
                  <img src={docIcon} alt="" />
                  <span className="label">정책</span>
                  <span className="count">{resultData?.summary?.summary?.total_policies ?? 0}건</span>
                </li>
              </ul>
            </div>
            <div className="briefing-map">
              <img src={koreaMap} alt="대한민국 지도" />
            </div>
          </div>

          {/* 아래로 안내 */}
          <button className="scroll-hint" onClick={scrollToAnalysis}>
            아래로 스크롤하여 상세 분석 결과를 확인하세요.
            <img src={arrowDownIcon} alt="" />
          </button>
        </div>
      </section>

      {/* ② 분석결과 섹션 */}
      <section className="snap-section analysis-section" ref={analysisRef}>
        <div className="analysis-inner">
          <h3 className="analysis-title">분석 결과</h3>

          <div className="tabs-container">
            <div className="tabs-header">
              <button className={getTabButtonClass("summary")} onClick={() => setActiveTab("summary")}>종합 요약</button>
              <button className={getTabButtonClass("jobs")} onClick={() => setActiveTab("jobs")}>일자리</button>
              <button className={getTabButtonClass("realestate")} onClick={() => setActiveTab("realestate")}>부동산</button>
              <button className={getTabButtonClass("policies")} onClick={() => setActiveTab("policies")}>정책</button>
            </div>

            <div className="tab-content" ref={tabContentRef}>
              {activeTab === "summary" && renderSummaryTab()}
              {activeTab === "jobs" && renderJobsTab()}
              {activeTab === "realestate" && renderRealestateTab()}
              {activeTab === "policies" && renderPoliciesTab()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ResultsPage;
