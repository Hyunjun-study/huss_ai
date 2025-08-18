// src/components/LoadingPage.jsx - 수정된 버전
import React, { useState, useEffect } from "react";
import AnimatedText from "./AnimatedText";
import AnimatedMap from "./AnimatedMap";
import "./LoadingPage.css";
import logo from "../assets/ieum_logo.svg";

function LoadingPage({ searchPrompt = null, loadingStatus = {} }) {
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // 🚀 진행률 계산
  useEffect(() => {
    const statuses = Object.values(loadingStatus);
    const completed = statuses.filter((status) => status.completed).length;
    const loading = statuses.filter((status) => status.loading).length;
    const errors = statuses.filter((status) => status.error).length;

    setCompletedCount(completed);

    // 진행률 계산 (완료 + 로딩 중인 것들의 절반)
    const calculatedProgress = (completed / statuses.length) * 100;
    setProgress(Math.min(calculatedProgress, 100));
  }, [loadingStatus]);

  // 각 API 상태를 표시하는 함수
  const getStatusIcon = (status) => {
    if (status.loading) return "🔄";
    if (status.completed) return "✅";
    if (status.error) return "❌";
    return "⏳";
  };

  const getStatusText = (status) => {
    if (status.loading) return "분석 중";
    if (status.completed) return "완료";
    if (status.error) return "실패";
    return "대기 중";
  };

  const getStatusClass = (status) => {
    if (status.loading) return "loading";
    if (status.completed) return "completed";
    if (status.error) return "error";
    return "waiting";
  };

  // 🎯 상태별 메시지 생성
  const getStatusMessage = (status, type) => {
    if (status.error) {
      return `${type} 데이터를 가져오지 못했습니다`;
    }
    if (status.completed) {
      return `${type} 데이터 수집 완료`;
    }
    if (status.loading) {
      return `${type} 데이터를 분석하고 있습니다`;
    }
    return `${type} 데이터 수집 대기 중`;
  };

  // 전체 진행 상태 메시지
  const getOverallStatusMessage = () => {
    if (completedCount === 4) {
      return "모든 데이터 수집이 완료되었습니다! 결과를 준비하고 있어요.";
    }
    if (completedCount === 0) {
      return "데이터 수집을 시작합니다...";
    }
    return `${completedCount}/4개 데이터 수집 완료`;
  };

  return (
    <div className="loading-container">
      <header className="header">
        <img src={logo} alt="ieum logo" className="logo" />
        <nav className="nav-links">
          <a href="#about">서비스 소개</a>
          <a href="#language">언어</a>
          <a href="#help">도움말</a>
        </nav>
      </header>

      <main className="loading-content">
        <div className="text-area">
          <AnimatedText />

          {/* 검색어 표시 */}
          {searchPrompt && (
            <div className="search-prompt-display">
              <p className="search-label">검색 중인 내용:</p>
              <p className="search-prompt">"{searchPrompt}"</p>
            </div>
          )}

          {/* 🚀 전체 진행률 표시 */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(progress)}% 완료</div>
            </div>
            <p className="overall-status">{getOverallStatusMessage()}</p>
          </div>
        </div>

        {/* 실시간 로딩 상태 - 왼쪽 하단 */}
        <div className="loading-status-panel">
          <h4>🔍 데이터 수집 상황</h4>
          <div className="status-list">
            <div
              className={`status-item ${getStatusClass(
                loadingStatus.summary || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.summary || {})}
              </span>
              <div className="status-content">
                <span className="status-label">종합 분석</span>
                <span className="status-detail">
                  {getStatusMessage(loadingStatus.summary || {}, "종합 분석")}
                </span>
              </div>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.jobs || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.jobs || {})}
              </span>
              <div className="status-content">
                <span className="status-label">일자리 정보</span>
                <span className="status-detail">
                  {getStatusMessage(loadingStatus.jobs || {}, "채용 정보")}
                </span>
              </div>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.realestate || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.realestate || {})}
              </span>
              <div className="status-content">
                <span className="status-label">부동산 정보</span>
                <span className="status-detail">
                  {getStatusMessage(
                    loadingStatus.realestate || {},
                    "부동산 정보"
                  )}
                </span>
              </div>
            </div>

            <div
              className={`status-item ${getStatusClass(
                loadingStatus.policies || {}
              )}`}
            >
              <span className="status-icon">
                {getStatusIcon(loadingStatus.policies || {})}
              </span>
              <div className="status-content">
                <span className="status-label">정책 정보</span>
                <span className="status-detail">
                  {getStatusMessage(loadingStatus.policies || {}, "청년 정책")}
                </span>
              </div>
            </div>
          </div>

          {/* 🎯 에러 요약 (에러가 있는 경우만 표시) */}
          {Object.values(loadingStatus).some((status) => status.error) && (
            <div className="error-summary">
              <p className="error-summary-title">⚠️ 일부 데이터 수집 실패</p>
              <p className="error-summary-text">
                가능한 데이터로 결과를 보여드릴게요
              </p>
            </div>
          )}
        </div>

        <div className="map-area">
          <AnimatedMap />
        </div>
      </main>
    </div>
  );
}

export default LoadingPage;
