// src/components/LoadingPage.jsx
import React, { useState, useEffect } from "react";
import AnimatedText from "./AnimatedText";
import AnimatedMap from "./AnimatedMap";
import "./LoadingPage.css";
import logo from "../assets/ieum_logo.svg";
import StatusIcon from "./StatusIcon"; // 새로 만든 StatusIcon 컴포넌트 import

function LoadingPage({ searchPrompt = null, loadingStatus = {} }) {
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // 진행률 계산
  useEffect(() => {
    const statuses = Object.values(loadingStatus);
    const completed = statuses.filter((status) => status.completed).length;

    setCompletedCount(completed);

    const calculatedProgress = (completed / statuses.length) * 100;
    setProgress(Math.min(calculatedProgress, 100));
  }, [loadingStatus]);

  // CSS 클래스를 반환하는 함수
  const getStatusClass = (status) => {
    if (status.loading) return "loading";
    if (status.completed) return "completed";
    if (status.error) return "error";
    return "waiting";
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
          <a>|</a>
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

          {/* 전체 진행률 표시 */}
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

          {/* 데이터 수집 상황 패널 */}
          <div className="loading-status-panel">
            <h4>데이터 수집 상황</h4>
            <div className="status-list">

              <div className={`status-item ${getStatusClass(loadingStatus.summary || {})}`}>
                <StatusIcon status={getStatusClass(loadingStatus.summary || {})} />
                <div className="status-content">
                  <span className="status-label">종합 분석</span>
                </div>
              </div>

              <div className={`status-item ${getStatusClass(loadingStatus.jobs || {})}`}>
                <StatusIcon status={getStatusClass(loadingStatus.jobs || {})} />
                <div className="status-content">
                  <span className="status-label">일자리 정보</span>
                </div>
              </div>

              <div className={`status-item ${getStatusClass(loadingStatus.realestate || {})}`}>
                <StatusIcon status={getStatusClass(loadingStatus.realestate || {})} />
                <div className="status-content">
                  <span className="status-label">부동산 정보</span>
                </div>
              </div>

              <div className={`status-item ${getStatusClass(loadingStatus.policies || {})}`}>
                <StatusIcon status={getStatusClass(loadingStatus.policies || {})} />
                <div className="status-content">
                  <span className="status-label">정책 정보</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        <div className="map-area">
          <AnimatedMap />
        </div>
      </main>
    </div>
  );
}

export default LoadingPage;