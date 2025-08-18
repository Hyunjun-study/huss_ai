// src/components/MainPage.jsx
import React, { useState, useRef, useEffect } from "react";
import "./MainPage.css";
import Modal from "./Modal";
import logo from "../assets/ieum_logo.svg";
import slogan from "../assets/slogan.svg";
import BackgroundPattern from "../assets/background.svg?react";

function MainPage({ onSubmit, error }) {
  // --- 기존 state 변수들 (변경 없음) ---
  const [isInputActive, setIsInputActive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState("");
  const promptWrapperRef = useRef(null);
  const sendButtonRef = useRef(null);
  const textareaRef = useRef(null);

  // --- 모달 상태 관리 ---
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  // 1. '서비스 소개' 모달 상태 추가
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // --- 기존 핸들러 함수들 (변경 없음) ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    if (inputError) setInputError("");
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (isSubmitting) return;
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setInputError("검색할 내용을 입력해주세요.");
      return;
    }
    try {
      setIsSubmitting(true);
      setInputError("");
      await onSubmit(cleanPrompt);
    } catch (err) {
      console.error("제출 오류:", err);
      setInputError(err?.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(null);
      if (sendButtonRef.current) {
        sendButtonRef.current.classList.add("active");
        setTimeout(() => {
          sendButtonRef.current?.classList.remove("active");
        }, 150);
      }
    }
  };

  const handleClickOutside = (event) => {
    if (
      promptWrapperRef.current &&
      !promptWrapperRef.current.contains(event.target)
    ) {
      if (inputError || !prompt.trim()) {
        setIsInputActive(false);
        setInputError("");
        setPrompt("");
      }
    }
  };

  useEffect(() => {
    if (isInputActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInputActive, prompt, inputError]);

  const handleInputClick = () => {
    setIsInputActive(true);
    setInputError("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const getInputClassName = () => {
    let className = "prompt-input";
    if (inputError) className += " error";
    if (isSubmitting) className += " submitting";
    return className;
  };

  const getButtonClassName = () => {
    let className = "send-button";
    if (isSubmitting) className += " loading";
    return className;
  };

  // --- JSX 렌더링 부분 ---
  return (
    <div className="main-container">
      <header className="header">
        <img src={logo} alt="ieum logo" className="logo" />
        <img src={slogan} alt="slogan" className="slogan" />
        <nav className="nav-links">
          {/* 2. '서비스 소개' 링크에 onClick 이벤트 추가 */}
          <a href="#about" onClick={(e) => { e.preventDefault(); setIsAboutModalOpen(true); }}>
            서비스 소개
          </a>
          <a>|</a>
          <a href="#help" onClick={(e) => { e.preventDefault(); setIsHelpModalOpen(true); }}>
            도움말
          </a>
        </nav>
      </header>

      {/* --- 기존 main 컨텐츠 (변경 없음) --- */}
      <main className="content">
        <h1>
          나의 새로운 시작은
          <br />
          어디서?
        </h1>
        <p>이음이 당신에게 꼭 맞는 지역을 찾아드려요</p>
        <div className="prompt-wrapper" ref={promptWrapperRef}>
          {!isInputActive ? (
            <button
              className="prompt-placeholder"
              onClick={handleInputClick}
              disabled={isSubmitting}
            >
              나에게 맞는 조건 입력하기
              <span className="enter-icon">↵</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="prompt-form">
              <div className="input-shell">
                <textarea
                  ref={textareaRef}
                  className={getInputClassName()}
                  placeholder="원하는 직업, 필요한 정책, 주거 예산을 자유롭게 입력해보세요.&#10;예: 강릉시에서 IT 프론트엔... (이하 생략)"
                  value={prompt}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <button
                  type="submit"
                  className={getButtonClassName()}
                  ref={sendButtonRef}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "검색 중..." : "Send"}
                </button>
                <div className="input-counter">{prompt.length}/500</div>
              </div>
            </form>
          )}
        </div>
        {(inputError || error) && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {inputError || error}
          </div>
        )}
        {isInputActive && !inputError && (
          <div className="prompt-examples">
            <p className="search-tips">
              <strong>🎯 검색 팁:</strong> 지역명, 원하는 직업, 주거 조건, 관심
              정책을 자유롭게 조합해서 입력해보세요!
            </p>
          </div>
        )}
        <div className="background-container">
          <BackgroundPattern />
        </div>
      </main>

      {/* --- 모달 컴포넌트 렌더링 --- */}
      {/* 3. '서비스 소개' 모달 추가 */}
      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="서비스 소개"
      >
        <p><strong>'이음'은 새로운 시작을 꿈꾸는 당신을 위한 다리입니다.</strong></p>
        <p>
          낯선 지역으로의 이주를 고민할 때, 가장 큰 막막함은 정보의 부족입니다.
          어디에 어떤 일자리가 있는지, 내가 받을 수 있는 혜택은 무엇인지, 집은 어디에 구해야 할지...
          '이음'은 흩어져 있는 정보들을 한데 모아 당신의 합리적인 의사결정을 돕습니다.
        </p>
        <p>
          단순한 정보 제공을 넘어, 당신의 조건과 희망에 꼭 맞는 '새로운 삶의 터전'을 찾아주는 것.
          그것이 바로 '이음'이 존재하는 이유입니다.
        </p>
      </Modal>

      {/* 도움말 모달 */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="도움말"
      >
        <p><strong>'이음' 서비스는 어떻게 사용하나요?</strong></p>
        <p>
          '이음'은 당신의 새로운 시작을 위한 최적의 지역을 찾아주는 서비스입니다.
          아래 입력창에 원하는 직업, 필요한 정부 지원 정책, 그리고 예상 주거 예산 등을 자유롭게 입력해보세요.
        </p>
        <p>
          <strong>예시:</strong><br />
          "강릉시에서 IT 프론트엔드 개발자로 일하고 싶어. 청년 버팀목 대출이 가능한 전세 2억 이하의 집이었으면 좋겠어."
        </p>
        <p>
          입력된 정보를 바탕으로, 'ieum'이 일자리 정보, 주거 정보, 관련 정책을 종합하여 가장 적합한 지역을 추천해 드립니다.
        </p>
      </Modal>
    </div>
  );
}

export default MainPage;