// src/components/AnimatedMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import KoreaMap from '../assets/south_korea.svg?react';

const initialNodes = [
    { id: 1, x: 100, y: 650 }, // 남서
    { id: 2, x: 500, y: 680 }, // 남동
    { id: 3, x: 200, y: 400 }, // 충청 좌
    { id: 4, x: 400, y: 350 }, // 강원 우
    { id: 5, x: 300, y: 200 }, // 경기 중앙
    { id: 6, x: 150, y: 100 }, // 북서
    { id: 7, x: 500, y: 150 }, // 북동
];

const lines = [
    { from: 1, to: 3 },
    { from: 1, to: 2 },
    { from: 3, to: 5 },
    { from: 3, to: 4 },
    { from: 2, to: 4 },
    { from: 5, to: 6 },
    { from: 5, to: 7 },
    { from: 6, to: 4 },
    { from: 7, to: 4 },
];

function AnimatedMap() {
    const [nodes, setNodes] = useState(initialNodes);
    const svgRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            // 상태 업데이트 시 항상 최신 상태(prevNodes)를 기반으로 계산하여 안정성을 높임
            setNodes(prevNodes => {
                const viewBoxWidth = 600;
                const viewBoxHeight = 800;

                return prevNodes.map(node => {
                    let newX = node.x + (Math.random() - 0.5) * 40;
                    let newY = node.y + (Math.random() - 0.5) * 40;

                    const radius = 8;
                    // 노드가 경계 밖으로 나가지 않도록 보정
                    newX = Math.max(radius, Math.min(newX, viewBoxWidth - radius));
                    newY = Math.max(radius, Math.min(newY, viewBoxHeight - radius));

                    return { ...node, x: newX, y: newY };
                });
            });
        }, 750);

        return () => clearInterval(interval);
    }, []); // 의존성 배열을 비워 최초 한 번만 인터벌을 설정

    // ID로 노드를 찾는 헬퍼 함수
    const findNode = (id) => nodes.find(n => n.id === id);

    return (
        <div className="map-container">
            <KoreaMap className="map-background" />
            <svg className="map-overlay" viewBox="0 0 600 800" ref={svgRef}>
                {/* 선(line) 렌더링 */}
                {lines.map((line, index) => {
                    const fromNode = findNode(line.from);
                    const toNode = findNode(line.to);

                    // fromNode나 toNode가 없는 경우(오류 방지)에는 선을 그리지 않음
                    if (!fromNode || !toNode) {
                        return null;
                    }

                    return (
                        <motion.line
                            key={`line-${index}`} // key를 더 명확하게 변경
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke="#E8843C"
                            strokeWidth="2"
                            animate={{ x1: fromNode.x, y1: fromNode.y, x2: toNode.x, y2: toNode.y }}
                            transition={{ duration: 0.75, ease: "linear" }}
                        />
                    );
                })}
                {/* 노드(circle) 렌더링 */}
                {nodes.map(node => (
                    <motion.circle
                        key={`node-${node.id}`} // key를 더 명확하게 변경
                        cx={node.x}
                        cy={node.y}
                        r="8"
                        fill="#ffffff"
                        stroke="#E8843C"
                        strokeWidth="1.5"
                        animate={{ cx: node.x, cy: node.y }}
                        transition={{ duration: 0.75, ease: "linear" }}
                    />
                ))}
            </svg>
        </div>
    );
}

export default AnimatedMap;