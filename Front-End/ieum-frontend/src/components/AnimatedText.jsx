// src/components/AnimatedText.jsx
import React, { useState, useEffect } from 'react';

const TEXTS = [
    "데이터를 분석하는 중이에요",
    "일자리를 분석하는 중이에요",
    "주거지를 찾고 있는 중이에요",
    "지원 정책을 찾아보는 중이에요",
];

function AnimatedText() {
    const [textIndex, setTextIndex] = useState(0);
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        let repetition = 0;

        // '...' 애니메이션을 위한 타이머 (0.5초마다 점 개수 변경)
        const dotInterval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4); // 0, 1, 2, 3 반복
        }, 500);

        // 문장 변경을 위한 타이머 (4.5초마다)
        // (점 4단계 * 0.5초 * 3회 반복 = 6초. 넉넉히 4.5초로 설정)
        const textInterval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % TEXTS.length);
        }, 4500);


        // 컴포넌트가 사라질 때 타이머 정리 (메모리 누수 방지)
        return () => {
            clearInterval(dotInterval);
            clearInterval(textInterval);
        };
    }, []); // []를 비워두면 컴포넌트가 처음 생길 때 딱 한 번만 실행됨

    const currentText = TEXTS[textIndex];
    const dots = '.'.repeat(dotCount);

    return <h2>{currentText}{dots}</h2>;
}

export default AnimatedText;