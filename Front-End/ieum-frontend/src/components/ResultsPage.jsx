// src/components/ResultsPage.jsx - 수정된 버전
import React, { useState, useMemo } from "react";
import "./ResultsPage.css";

function ResultsPage({ searchData, resultData, onBackToMain }) {
  const [activeTab, setActiveTab] = useState("summary");

  // 🛡️ 데이터 안전성 검증 함수들
  const hasValidData = (data) => {
    return data && typeof data === "object" && data.success === true;
  };

  const hasArrayData = (data, arrayKey) => {
    return (
      hasValidData(data) &&
      Array.isArray(data[arrayKey]) &&
      data[arrayKey].length > 0
    );
  };

  // 🎯 각 탭별 데이터 상태 계산
  const tabStatus = useMemo(() => {
    return {
      summary: {
        hasData: hasValidData(resultData?.summary),
        isEmpty:
          !hasValidData(resultData?.summary) ||
          (resultData?.summary?.summary?.total_jobs === 0 &&
            resultData?.summary?.summary?.total_properties === 0 &&
            resultData?.summary?.summary?.total_policies === 0),
        error:
          resultData?.summary?.success === false
            ? "종합 분석 데이터를 불러올 수 없습니다."
            : null,
      },
      jobs: {
        hasData: hasArrayData(resultData?.jobs, "jobs"),
        isEmpty:
          hasValidData(resultData?.jobs) &&
          (!resultData?.jobs?.jobs || resultData?.jobs?.jobs.length === 0),
        error:
          resultData?.jobs?.success === false
            ? "일자리 정보를 불러올 수 없습니다."
            : null,
      },
      realestate: {
        hasData: hasArrayData(resultData?.realestate, "properties"),
        isEmpty:
          hasValidData(resultData?.realestate) &&
          (!resultData?.realestate?.properties ||
            resultData?.realestate?.properties.length === 0),
        error:
          resultData?.realestate?.success === false
            ? "부동산 정보를 불러올 수 없습니다."
            : null,
      },
      policies: {
        hasData: hasArrayData(resultData?.policies, "policies"),
        isEmpty:
          hasValidData(resultData?.policies) &&
          (!resultData?.policies?.policies ||
            resultData?.policies?.policies.length === 0),
        error:
          resultData?.policies?.success === false
            ? "정책 정보를 불러올 수 없습니다."
            : null,
      },
    };
  }, [resultData]);

  // 탭 변경 핸들러
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // 🎨 탭 버튼 스타일 계산
  const getTabButtonClass = (tabName) => {
    let className = "tab-button";
    if (activeTab === tabName) className += " active";

    const status = tabStatus[tabName];
    if (status.error) className += " error";
    else if (status.isEmpty) className += " empty";
    else if (status.hasData) className += " success";

    return className;
  };

  // 🎯 탭 버튼에 상태 아이콘 추가
  const getTabIcon = (tabName) => {
    const status = tabStatus[tabName];
    if (status.error) return "";
    if (status.isEmpty) return "";
    if (status.hasData) return "";
    return "";
  };

  // 💰 가격 포맷팅 함수
  const formatPrice = (priceStr) => {
    if (!priceStr) return "가격 정보 없음";

    const price = priceStr.replace(/,/g, "");
    if (isNaN(price)) return priceStr;

    const priceNum = parseInt(price);
    if (priceNum >= 10000) {
      const eok = Math.floor(priceNum / 10000);
      const man = priceNum % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${priceNum.toLocaleString()}만원`;
  };

  // 📅 날짜 포맷팅 함수
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(
      6,
      8
    )}`;
  };

  // 🌟 요약 탭 렌더링
  const renderSummaryTab = () => {
    const status = tabStatus.summary;

    if (status.error) {
      return <div className="error-state">{status.error}</div>;
    }

    if (!status.hasData) {
      return <div className="no-data">종합 분석 데이터를 준비 중입니다...</div>;
    }

    const summary = resultData.summary.summary || {};
    const preview = resultData.summary.preview_data || {};
    const regionInfo = resultData.summary.region_info || {};

    return (
      <div>
        <h3>🌟 {regionInfo.name || summary.region_name || "지역"} 종합 분석</h3>

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

        <h4>🔍 미리보기</h4>
        <div className="data-list">
          {/* 채용정보 미리보기 */}
          {preview.jobs?.slice(0, 2).map((job, index) => (
            <div key={`job-${index}`} className="data-item preview-item">
              <h4>💼 {job.instNm || "기관명 없음"}</h4>
              <p>{job.recrutPbancTtl || "제목 없음"}</p>
              <p>📍 {job.workRgnNmLst || "근무지역 미정"}</p>
              {job.pbancEndYmd && (
                <p>⏰ 마감일: {formatDate(job.pbancEndYmd)}</p>
              )}
            </div>
          ))}

          {/* 부동산 미리보기 */}
          {preview.realestate?.slice(0, 2).map((property, index) => (
            <div key={`property-${index}`} className="data-item preview-item">
              <h4>🏠 {property.aptNm || "아파트명 없음"}</h4>
              <p>💰 {formatPrice(property.dealAmount)}</p>
              <p>📐 {property.excluUseAr || "면적 정보 없음"}㎡</p>
              <p>📍 {property.umdNm || "위치 정보 없음"}</p>
            </div>
          ))}

          {/* 정책 미리보기 */}
          {preview.policies?.slice(0, 2).map((policy, index) => (
            <div key={`policy-${index}`} className="data-item preview-item">
              <h4>🎯 {policy.plcyNm || "정책명 없음"}</h4>
              <p>{(policy.plcyExplnCn || "설명 없음").substring(0, 100)}...</p>
              <p>🏛️ {policy.sprvsnInstCdNm || "담당기관 미정"}</p>
            </div>
          ))}
        </div>

        {/* 탭별 데이터 로드 상태 표시 */}
        <div className="data-status-summary">
          <h4>📊 데이터 수집 결과</h4>
          <div className="status-grid">
            {Object.entries(tabStatus).map(([key, status]) => {
              const labels = {
                summary: "종합분석",
                jobs: "일자리",
                realestate: "부동산",
                policies: "정책",
              };

              return (
                <div
                  key={key}
                  className={`status-indicator ${status.hasData
                      ? "success"
                      : status.error
                        ? "error"
                        : "empty"
                    }`}
                >
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

  // 💼 일자리 탭 렌더링
  const renderJobsTab = () => {
    const status = tabStatus.jobs;

    if (status.error) {
      return <div className="error-state">{status.error}</div>;
    }

    if (status.isEmpty) {
      const regionName = resultData?.jobs?.region_info?.name || "해당 지역";
      return (
        <div className="no-data">
          <p>
            📋 <strong>{regionName}의 채용정보를 찾을 수 없습니다.</strong>
          </p>
          <br />
          <p>
            💡 <strong>제안:</strong>
          </p>
          <p>- 인근 시·군으로 확장해보세요</p>
          <p>- 원격근무 가능한 직종을 찾아보세요</p>
        </div>
      );
    }

    if (!status.hasData) {
      return <div className="loading-state">일자리 정보를 불러오는 중...</div>;
    }

    const jobs = resultData.jobs.jobs || [];
    const stats = resultData.jobs.statistics || {};
    const regionName = resultData.jobs.region_info?.name || "";

    if (jobs.length > 0) {
      console.log("🔍 첫 번째 채용공고 채용구분 상세:", {
        recrutSe: jobs[0].recrutSe, // 원본 코드
        recrutSeNm: jobs[0].recrutSeNm, // 원본 명칭
        recruit_type_code: jobs[0].recruit_type_code, // 가공된 코드
        formatted_recruit_type: jobs[0].formatted_recruit_type, // 가공된 명칭
      });
    }

    return (
      <div>
        <h3>
          💼 {regionName} 채용정보 ({stats.total || jobs.length}건)
        </h3>

        {/* 통계 카드 */}
        {Object.keys(stats.by_category || {}).length > 0 && (
          <div className="summary-grid" style={{ marginBottom: "1rem" }}>
            <div className="summary-card">
              <h3>{stats.total || jobs.length}</h3>
              <p>총 채용공고</p>
            </div>
            <div className="summary-card">
              <h3>{Object.keys(stats.by_category || {}).length}</h3>
              <p>직무분야</p>
            </div>
            <div className="summary-card">
              <h3>{Object.keys(stats.by_type || {}).length}</h3>
              <p>고용형태</p>
            </div>
            <div className="summary-card">
              <h3>{Object.keys(stats.by_region || {}).length}</h3>
              <p>근무지역</p>
            </div>
          </div>
        )}

        {/* 채용공고 목록 */}
        <div className="data-list">
          {jobs.map((job, index) => (
            <div key={`job-${index}`} className="data-item">
              <div className="job-header">
                <h4>
                  🏢{" "}
                  <strong>
                    {job.display_number || index + 1}.{" "}
                    {job.formatted_company || job.instNm}
                  </strong>
                  {job.formatted_hire_type && (
                    <span className="hire-type">
                      ({job.formatted_hire_type})
                    </span>
                  )}
                </h4>
                <p className="job-title">
                  📌{" "}
                  <strong>{job.formatted_title || job.recrutPbancTtl}</strong>
                </p>
              </div>

              <div className="job-details">
                {job.formatted_region && (
                  <p>
                    🌍 <strong>근무지역</strong>: {job.formatted_region}
                  </p>
                )}
                {/* 🆕 채용구분 추가 */}
                {job.formatted_recruit_type &&
                  job.formatted_recruit_type !== "구분 없음" &&
                  job.formatted_recruit_type !== "미정" && (
                    <p>
                      👥 <strong>채용구분</strong>: {job.formatted_recruit_type}
                    </p>
                  )}

                {job.formatted_deadline && (
                  <p>
                    ⏰ <strong>마감일</strong>: {job.formatted_deadline}
                  </p>
                )}
                {job.formatted_ncs_field && (
                  <p>
                    🔧 <strong>직무분야</strong>: {job.formatted_ncs_field}
                  </p>
                )}

                {/* 🎯 학력요건만 표시 (중복 제거) */}
                {job.formatted_education && (
                  <p>
                    🎓 <strong>학력요건</strong>: {job.formatted_education}
                  </p>
                )}

                {/* 🎯 고용형태 상세는 기본 고용형태와 다를 때만 표시 */}
                {job.formatted_hire_type_detailed &&
                  job.formatted_hire_type_detailed !==
                  job.formatted_hire_type &&
                  !job.display_title.includes(
                    job.formatted_hire_type_detailed
                  ) && (
                    <p>
                      💼 <strong>고용형태 상세</strong>:{" "}
                      {job.formatted_hire_type_detailed}
                    </p>
                  )}

                {job.career_cond && (
                  <p>
                    💼 <strong>경력조건</strong>: {job.career_cond}
                  </p>
                )}
                {job.recruit_count && (
                  <p>
                    👥 <strong>모집인원</strong>: {job.recruit_count}명
                  </p>
                )}
                {job.work_type && (
                  <p>
                    ⏰ <strong>근무형태</strong>: {job.work_type}
                  </p>
                )}
                {job.salary_type && (
                  <p>
                    💰 <strong>급여형태</strong>: {job.salary_type}
                  </p>
                )}
                {job.application_method && (
                  <p>
                    📝 <strong>지원방법</strong>: {job.application_method}
                  </p>
                )}
                {job.contact_info && (
                  <p>
                    📞 <strong>문의처</strong>: {job.contact_info}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 통계 요약 */}
        {Object.keys(stats.by_category || {}).length > 0 && (
          <div className="statistics-summary">
            <h4>📊 채용 현황 요약</h4>
            <div className="stats-grid">
              <div className="stats-section">
                <strong>주요 직무분야:</strong>
                <ul>
                  {Object.entries(stats.by_category || {})
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <li key={category}>
                        {category}: {count}건
                      </li>
                    ))}
                </ul>
              </div>
              <div className="stats-section">
                <strong>고용형태:</strong>
                <ul>
                  {Object.entries(stats.by_type || {})
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <li key={type}>
                        {type}: {count}건
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 🏠 부동산 탭 렌더링
  const renderRealestateTab = () => {
    const status = tabStatus.realestate;

    if (status.error) {
      return <div className="error-state">{status.error}</div>;
    }

    if (status.isEmpty) {
      return <div className="no-data">해당 지역의 실거래 정보가 없습니다.</div>;
    }

    if (!status.hasData) {
      return <div className="loading-state">부동산 정보를 불러오는 중...</div>;
    }

    const properties = resultData.realestate.properties || [];
    const analysis = resultData.realestate.price_analysis || {};
    const regionName = resultData.realestate.region_info?.name || "";

    return (
      <div>
        <h3>
          🏠 {regionName} 아파트 실거래가 ({properties.length}건)
        </h3>

        {/* 가격 분석 요약 */}
        {analysis.price_range && (
          <div className="price-analysis">
            <div className="summary-card">
              <h4>💰 가격대</h4>
              <p>{analysis.price_range}</p>
            </div>
            <div className="summary-card">
              <h4>📊 시장 동향</h4>
              <p>{analysis.trend || "분석 중"}</p>
            </div>
            {analysis.sample_count && (
              <div className="summary-card">
                <h4>📈 분석 샘플</h4>
                <p>{analysis.sample_count}건</p>
              </div>
            )}
          </div>
        )}

        {/* 실거래 목록 */}
        <div className="data-list">
          {properties.map((property, index) => (
            <div key={`property-${index}`} className="data-item">
              <h4>🏠 {property.aptNm || "아파트명 없음"}</h4>
              <div className="property-details">
                <p>
                  💰 <strong>거래금액</strong>:{" "}
                  {formatPrice(property.dealAmount)}
                </p>
                <p>
                  📐 <strong>전용면적</strong>:{" "}
                  {property.excluUseAr || "정보 없음"}㎡
                </p>
                <p>
                  🏢 <strong>층수</strong>: {property.floor || "정보 없음"}층
                </p>
                <p>
                  🗓️ <strong>건축년도</strong>:{" "}
                  {property.buildYear || "정보 없음"}년
                </p>
                <p>
                  📍 <strong>위치</strong>: {property.umdNm || "정보 없음"}
                </p>
                {property.dealYear &&
                  property.dealMonth &&
                  property.dealDay && (
                    <p>
                      📅 <strong>거래일</strong>: {property.dealYear}.
                      {property.dealMonth.padStart(2, "0")}.
                      {property.dealDay.padStart(2, "0")}
                    </p>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 🎯 정책 탭 렌더링
  const renderPoliciesTab = () => {
    const status = tabStatus.policies;

    if (status.error) {
      return <div className="error-state">{status.error}</div>;
    }

    if (status.isEmpty) {
      return <div className="no-data">해당 지역의 청년정책이 없습니다.</div>;
    }

    if (!status.hasData) {
      return <div className="loading-state">정책 정보를 불러오는 중...</div>;
    }

    const policies = resultData.policies.policies || [];
    const categories = resultData.policies.categories || {};
    const regionName = resultData.policies.region_info?.name || "";

    return (
      <div>
        <h3>
          🎯 {regionName} 청년지원정책 ({policies.length}건)
        </h3>

        {/* 카테고리별 통계 */}
        {Object.keys(categories).length > 0 && (
          <div className="summary-grid" style={{ marginBottom: "1rem" }}>
            {Object.entries(categories)
              .slice(0, 4)
              .map(([category, count]) => (
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
              <h4>🎯 {policy.plcyNm || "정책명 없음"}</h4>

              {policy.plcyExplnCn && (
                <p className="policy-description">
                  {policy.plcyExplnCn.substring(0, 200)}
                  {policy.plcyExplnCn.length > 200 ? "..." : ""}
                </p>
              )}

              <div className="policy-details">
                <p>
                  🏛️ <strong>담당기관</strong>:{" "}
                  {policy.sprvsnInstCdNm || "정보 없음"}
                </p>
                <p>
                  📂 <strong>분야</strong>:{" "}
                  {[policy.lclsfNm, policy.mclsfNm]
                    .filter(Boolean)
                    .join(" > ") || "분야 정보 없음"}
                </p>
                <p>
                  🎯 <strong>적용범위</strong>:{" "}
                  {policy.scope_display || "범위 정보 없음"}
                </p>

                {policy.support_content_display && (
                  <p>
                    💰 <strong>지원내용</strong>:{" "}
                    {policy.support_content_display}
                  </p>
                )}

                {policy.business_period_display && (
                  <p>
                    📅 <strong>사업기간</strong>:{" "}
                    {policy.business_period_display}
                  </p>
                )}

                <p>
                  📋 <strong>신청기간</strong>:{" "}
                  {policy.apply_period_display || "상시접수"}
                </p>

                {policy.sprtSclCnt && policy.sprtSclCnt !== "0" && (
                  <p>
                    👥 <strong>지원규모</strong>: {policy.support_scale_display}
                  </p>
                )}

                {policy.plcyKywdNm && (
                  <p>
                    🏷️ <strong>키워드</strong>: {policy.plcyKywdNm}
                  </p>
                )}

                {policy.detail_url && (
                  <p>
                    🔗{" "}
                    <a
                      href={policy.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="policy-link"
                    >
                      상세보기
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>검색 결과</h1>
        <p>"{searchData?.prompt || "검색 내용"}"에 대한 분석 결과입니다.</p>
        <button className="back-button" onClick={onBackToMain}>
          ← 새로운 검색
        </button>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={getTabButtonClass("summary")}
            onClick={() => handleTabChange("summary")}
          >
            {getTabIcon("summary")} 📊 종합 요약
          </button>
          <button
            className={getTabButtonClass("jobs")}
            onClick={() => handleTabChange("jobs")}
          >
            {getTabIcon("jobs")} 💼 일자리
          </button>
          <button
            className={getTabButtonClass("realestate")}
            onClick={() => handleTabChange("realestate")}
          >
            {getTabIcon("realestate")} 🏠 부동산
          </button>
          <button
            className={getTabButtonClass("policies")}
            onClick={() => handleTabChange("policies")}
          >
            {getTabIcon("policies")} 🎯 정책
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "summary" && renderSummaryTab()}
          {activeTab === "jobs" && renderJobsTab()}
          {activeTab === "realestate" && renderRealestateTab()}
          {activeTab === "policies" && renderPoliciesTab()}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;