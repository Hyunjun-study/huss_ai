// src/components/MainPage.jsx - 수정된 버전
import React, { useState, useRef, useEffect } from "react";
import "./MainPage.css";
import logo from "../assets/ieum_logo.svg";

function MainPage({ onSubmit, error }) {
  const [isInputActive, setIsInputActive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState(""); // 🛡️ 입력 검증 에러 상태 추가
  const promptWrapperRef = useRef(null);
  const sendButtonRef = useRef(null);
  const textareaRef = useRef(null);

  // 🛡️ 실시간 입력 검증 함수
  const validateInput = (value) => {
    const cleanValue = value.trim();

    if (cleanValue.length === 0) {
      return "";
    }

    if (cleanValue.length < 2) {
      return "검색어는 최소 2글자 이상 입력해주세요.";
    }

    if (cleanValue.length > 500) {
      return "검색어는 최대 500자까지 입력 가능합니다.";
    }

    // 특수 문자 검증 (기본적인 XSS 방지)
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanValue)) {
        return "허용되지 않는 문자가 포함되어 있습니다.";
      }
    }

    return "";
  };

  // 🔄 입력값 변경 핸들러 - 실시간 검증 추가
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPrompt(value);

    // 실시간 검증
    const error = validateInput(value);
    setInputError(error);
  };

  // 🚀 제출 핸들러 - 강화된 검증
  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }

    // 이미 제출 중이면 무시
    if (isSubmitting) {
      return;
    }

    const cleanPrompt = prompt.trim();

    // 최종 검증
    const validationError = validateInput(cleanPrompt);
    if (validationError) {
      setInputError(validationError);
      return;
    }

    if (!cleanPrompt) {
      setInputError("검색할 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setInputError("");

      // 부모 컴포넌트의 onSubmit 호출
      await onSubmit(cleanPrompt);
    } catch (err) {
      console.error("제출 오류:", err);
      setInputError(err.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⌨️ 키보드 이벤트 핸들러
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(null);

      // 시각적 피드백
      if (sendButtonRef.current) {
        sendButtonRef.current.classList.add("active");
        setTimeout(() => {
          if (sendButtonRef.current) {
            sendButtonRef.current.classList.remove("active");
          }
        }, 150);
      }
    }
  };

  // 🖱️ 외부 클릭 핸들러
  const handleClickOutside = (event) => {
    if (
      promptWrapperRef.current &&
      !promptWrapperRef.current.contains(event.target)
    ) {
      // 입력 내용이 있고 에러가 없을 때만 접기
      if (!prompt.trim() || inputError) {
        setIsInputActive(false);
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
    // 다음 틱에서 포커스 설정
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // 🎨 동적 스타일 계산
  const getInputClassName = () => {
    let className = "prompt-input";
    if (inputError) className += " error";
    if (isSubmitting) className += " submitting";
    return className;
  };

  const getButtonClassName = () => {
    let className = "send-button";
    if (isSubmitting) className += " loading";
    if (inputError || !prompt.trim()) className += " disabled";
    return className;
  };

  return (
    <div className="main-container">
      <header className="header">
        <img src={logo} alt="ieum logo" className="logo" />
        <nav className="nav-links">
          <a href="#about">서비스 소개</a>
          <a href="#language">언어</a>
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
              <textarea
                ref={textareaRef}
                className={getInputClassName()}
                placeholder="원하는 직업, 필요한 정책, 주거 예산을 자유롭게 입력해보세요.&#10;예: 강릉시에서 IT 프론트엔드 개발자로 일하고 싶어. 청년 버팀목 대출이 가능한 전세 2억 이하의 집이었으면 좋겠어."
                value={prompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={isSubmitting}
                maxLength={500} // HTML 레벨에서도 제한
              />
              <button
                type="submit"
                className={getButtonClassName()}
                ref={sendButtonRef}
                disabled={isSubmitting || inputError || !prompt.trim()}
              >
                {isSubmitting ? "검색 중..." : "Send"}
              </button>

              {/* 🔢 글자 수 카운터 */}
              <div className="input-counter">{prompt.length}/500</div>
            </form>
          )}
        </div>

        {/* 🚨 에러 메시지 표시 */}
        {(inputError || error) && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {inputError || error}
          </div>
        )}

        {/* 💡 사용 예시 */}
        {isInputActive && !inputError && (
          <div className="prompt-examples">
            <p>
              <strong>💡 검색 예시:</strong>
            </p>
            <ul>
              <li>
                정선군에서 IT 개발자로 일하고 싶어. 월세 50만원 이하의 집을 찾고
                있어.
              </li>
              <li>영월군 청년 창업 정책이 궁금해. 카페를 열고 싶어.</li>
              <li>청양군 간호사 채용 정보와 전세 1억 이하 아파트 알려줘.</li>
              <li>강릉시 교육 분야 일자리와 청년 주거 지원 정책 찾아줘.</li>
              <li>김제시에서 농업 관련 일자리와 귀농 정책 알아보고 싶어.</li>
            </ul>
            <p className="search-tips">
              <strong>🎯 검색 팁:</strong> 지역명, 원하는 직업, 주거 조건, 관심
              정책을 자유롭게 조합해서 입력해보세요!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainPage;
