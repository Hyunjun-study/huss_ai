
// src/components/MainPage.jsx
import React, { useState, useRef, useEffect } from "react";
import "./MainPage.css";
import logo from "../assets/ieum_logo.svg";
import slogan from "../assets/slogan.svg";
import BackgroundPattern from "../assets/background.svg?react";

function MainPage({ onSubmit, error }) {
  const [isInputActive, setIsInputActive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState("");
  const promptWrapperRef = useRef(null);
  const sendButtonRef = useRef(null);
  const textareaRef = useRef(null);

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPrompt(value);
    if (inputError) setInputError("");
  };

  // 제출 핸들러
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

  // 키보드 이벤트 핸들러
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

  // 외부 클릭 핸들러
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

  // 이벤트 리스너 등록
  useEffect(() => {
    if (isInputActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInputActive, prompt, inputError]);

  // 입력 영역 활성화
  const handleInputClick = () => {
    setIsInputActive(true);
    setInputError("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // 동적 스타일 계산
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

  return (
    <div className="main-container">
      <header className="header">
        <img src={logo} alt="ieum logo" className="logo" />
        <img src={slogan} alt="slogan" className="slogan" />
        <nav className="nav-links">
          <a href="#about">서비스 소개</a>
          <a>|</a>
          <a href="#help">도움말</a>
        </nav>
      </header>

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
              {/* 🔒 FIX: 입력 영역을 래퍼로 감싸서 스크롤 트랙을 클립 */}
              <div className="input-shell">
                <textarea
                  ref={textareaRef}
                  className={getInputClassName()}
                  placeholder="원하는 직업, 필요한 정책, 주거 예산을 자유롭게 입력해보세요.&#10;예: 강릉시에서 IT 프론트엔드 개발자로 일하고 싶어. 청년 버팀목 대출이 가능한 전세 2억 이하의 집이었으면 좋겠어."
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
    </div>
  );
}

export default MainPage;
