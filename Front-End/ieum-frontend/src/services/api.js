// src/services/api.js - Vite 호환 버전
import axios from 'axios';

// 🔧 Vite 환경변수 설정 (import.meta.env 사용)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔄 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        console.log('🚀 API 요청:', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            data: config.data ? Object.keys(config.data) : 'no data',
            timeout: config.timeout
        });
        return config;
    },
    (error) => {
        console.error('❌ 요청 설정 에러:', error);
        return Promise.reject(error);
    }
);

// 🛡️ 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => {
        console.log('✅ API 응답 성공:', {
            status: response.status,
            url: response.config.url,
            dataSize: JSON.stringify(response.data).length
        });
        return response;
    },
    (error) => {
        console.error('❌ API 응답 에러:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            message: error.message,
            code: error.code
        });

        return Promise.reject(error);
    }
);

// 🛡️ 공통 에러 처리 함수
const handleApiError = (error, operationName) => {
    console.error(`❌ ${operationName} 에러 상세:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: error.config?.url
    });

    // 네트워크 연결 오류
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }

    // 타임아웃 오류
    if (error.code === 'ECONNABORTED') {
        throw new Error('요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
    }

    // HTTP 상태 코드별 처리
    if (error.response) {
        const status = error.response.status;

        if (status >= 500) {
            throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }

        if (status === 404) {
            throw new Error('요청한 리소스를 찾을 수 없습니다. API 경로를 확인해주세요.');
        }

        if (status === 403) {
            throw new Error('접근 권한이 없습니다.');
        }

        if (status === 400) {
            const detail = error.response.data?.detail || '잘못된 요청입니다.';
            throw new Error(detail);
        }

        if (status === 429) {
            throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        }
    }

    // 기본 에러 메시지
    const errorMessage = error.response?.data?.detail
        || error.response?.data?.message
        || error.message
        || '알 수 없는 오류가 발생했습니다';

    throw new Error(`${operationName} 실패: ${errorMessage}`);
};

// 🔄 재시도 로직
const apiCallWithRetry = async (apiCall, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            if (attempt === maxRetries + 1) {
                throw error;
            }

            const isRetryable = error.code === 'ECONNABORTED'
                || error.response?.status >= 500
                || error.code === 'ERR_NETWORK';

            if (!isRetryable) {
                throw error;
            }

            console.warn(`⚠️ API 호출 실패 (${attempt}/${maxRetries + 1}), 재시도 중...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

// === API 함수들 ===

export const searchAPI = {
    // 🎯 종합 검색
    comprehensive: async (query, regionCode = "44790") => {
        return await apiCallWithRetry(async () => {
            try {
                console.log('🚀 Comprehensive 요청:', { query, regionCode });
                const response = await apiClient.post('/api/search/comprehensive', {
                    query,
                    region_code: regionCode
                });
                console.log('📥 Comprehensive 응답 성공');
                return response.data;
            } catch (error) {
                handleApiError(error, '종합 검색');
            }
        });
    },

    // 💼 일자리 검색
    jobs: async (regionCode, filters = {}) => {
        return await apiCallWithRetry(async () => {
            try {
                console.log('🚀 Jobs 요청:', { regionCode, filters });
                const response = await apiClient.post('/api/search/jobs', {
                    region_code: regionCode,
                    job_field: filters.ncsCdLst
                });
                console.log('📥 Jobs 응답 성공');
                return response.data;
            } catch (error) {
                handleApiError(error, '일자리 검색');
            }
        });
    },

    // 🏠 부동산 검색
    realestate: async (regionCode, dealYmd = "202506") => {
        return await apiCallWithRetry(async () => {
            try {
                console.log('🚀 Realestate 요청:', { regionCode, dealYmd });
                const response = await apiClient.post('/api/search/realestate', {
                    region_code: regionCode,
                    deal_ymd: dealYmd
                });
                console.log('📥 Realestate 응답 성공');
                return response.data;
            } catch (error) {
                handleApiError(error, '부동산 검색');
            }
        });
    },

    // 🎯 정책 검색
    policies: async (regionCode, keywords = null) => {
        return await apiCallWithRetry(async () => {
            try {
                console.log('🚀 Policies 요청:', { regionCode, keywords });
                const response = await apiClient.post('/api/search/policies', {
                    region_code: regionCode,
                    keywords
                });
                console.log('📥 Policies 응답 성공');
                return response.data;
            } catch (error) {
                handleApiError(error, '정책 검색');
            }
        });
    }
};

// 🔧 메타데이터 API
export const metaAPI = {
    health: async () => {
        try {
            const response = await apiClient.get('/api/health');
            return response.data;
        } catch (error) {
            handleApiError(error, '서버 상태 확인');
        }
    },

    regions: async () => {
        try {
            const response = await apiClient.get('/api/regions');
            return response.data;
        } catch (error) {
            handleApiError(error, '지역 목록 조회');
        }
    },

    jobFields: async () => {
        try {
            const response = await apiClient.get('/api/job-fields');
            return response.data;
        } catch (error) {
            handleApiError(error, '직무분야 목록 조회');
        }
    }
};

// 🔧 API 연결 테스트
export const testConnection = async () => {
    try {
        console.log('🔍 API 연결 테스트 시작...');
        const healthData = await metaAPI.health();
        console.log('✅ API 연결 성공:', healthData);
        return true;
    } catch (error) {
        console.error('❌ API 연결 실패:', error.message);
        return false;
    }
};

export default apiClient;