import axios from "axios";
import { Mutex } from "async-mutex";

/**
 * Axios instance chuẩn hoá cho JobHub:
 *  - Tự động gắn baseURL từ biến môi trường Vite (VITE_BACKEND_URL)
 *  - Gửi cookie (withCredentials) để server đọc được refresh_token (httpOnly cookie)
 *  - Thêm Authorization: Bearer <token> nếu có access_token trong localStorage
 *  - Tự động unwrap response.data nếu backend trả dạng { data: ... }
 *  - Xử lý 401: gọi GET /api/v1/auth/refresh để lấy access token mới
 *    + Mutex đảm bảo chỉ 1 request refresh được gửi dù nhiều request cùng bị 401
 *    + NO_RETRY_HEADER ngăn vòng lặp vô hạn
 *  - Redirect /login khi refresh token hết hạn (400 từ /auth/refresh)
 *    + Chỉ redirect nếu user đang ở trang cần xác thực (không phải public page)
 */

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // Gửi kèm cookie (refresh_token httpOnly)
  headers: {
    "ngrok-skip-browser-warning": "true"
  }
});

// Mutex: chỉ 1 request refresh token được gửi tại một thời điểm
// Các request 401 song song sẽ chờ mutex giải phóng rồi dùng token mới
const mutex = new Mutex();

// Header đánh dấu request đã retry → tránh vòng lặp refresh → 401 → refresh...
const NO_RETRY_HEADER = "x-no-retry";

// Trang public của JobHub — không redirect về /login khi refresh token hết hạn
const PUBLIC_PATHS = ["/", "/jobs", "/companies", "/about", "/contact", "/salary-predict"];
const isPublicPage = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname) ||
  pathname.startsWith("/login") ||
  pathname.startsWith("/register") ||
  pathname.startsWith("/forgot-password");

/**
 * Gọi GET /api/v1/auth/refresh trong mutex.
 * Server đọc refresh_token từ cookie httpOnly và trả về access token mới.
 * Trả về string token mới hoặc null nếu thất bại.
 */
const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    try {
      const res = await instance.get("/api/v1/auth/refresh");
      // Sau khi response interceptor unwrap: res = { data: { accessToken, user }, ... }
      if (res && res.data && res.data.accessToken) return res.data.accessToken as string;
      return null;
    } catch {
      return null;
    }
  });
};

// ── Request interceptor ──────────────────────────────────────────────────────
instance.interceptors.request.use(
  function (config) {
    // Không gắn Authorization cho chính request refresh (tránh gửi token cũ hết hạn)
    if (config.url === "/api/v1/auth/refresh") {
      return config;
    }

    // Gắn Bearer token nếu có trong localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const token = window.localStorage.getItem("access_token");
      if (token && token !== "null" && token !== "undefined") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Tự động thay thế localhost:9000 và domain trycloudflare.com bằng URL public từ VITE_BACKEND_URL
const normalizeBackendUrl = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    const cleanBackendUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;

    // Thay localhost:9000 (MinIO internal)
    if (obj.startsWith("http://localhost:9000") || obj.startsWith("http://127.0.0.1:9000")) {
      return obj.replace(/https?:\/\/(localhost|127\.0\.0\.1):9000/i, cleanBackendUrl);
    }

    // Thay bất kỳ domain trycloudflare.com nào → dùng VITE_BACKEND_URL hiện tại
    if (obj.includes("trycloudflare.com")) {
      try {
        const parsed = new URL(obj);
        return `${cleanBackendUrl}${parsed.pathname}${parsed.search}`;
      } catch {
        return obj.replace(/https?:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/i, cleanBackendUrl);
      }
    }

    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => normalizeBackendUrl(item));
  }

  if (typeof obj === "object") {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = normalizeBackendUrl(obj[key]);
      }
    }
    return obj;
  }

  return obj;
};

// Alias để tương thích ngược với code cũ dùng replaceLocalhostMinio
const replaceLocalhostMinio = normalizeBackendUrl;


// ── Response interceptor ─────────────────────────────────────────────────────
instance.interceptors.response.use(
  function (response) {
    // Unwrap backend envelope: { data: ..., message: ..., statusCode: ... }
    if (response.data && response.data.data !== undefined) {
      const unwrapped = response.data;
      unwrapped.data = replaceLocalhostMinio(unwrapped.data);
      return unwrapped;
    }
    if (response.data) {
      response.data = replaceLocalhostMinio(response.data);
    }
    return response;
  },
  async function (error) {
    // ── Case 1: 401 Unauthorized (access token hết hạn) ─────────────────────
    if (
      error.config &&
      error.response &&
      +error.response.status === 401 &&
      !error.config.headers[NO_RETRY_HEADER]
    ) {
      const newToken = await handleRefreshToken();
      error.config.headers[NO_RETRY_HEADER] = "true"; // chỉ retry 1 lần

      if (newToken) {
        // Cập nhật token mới và gửi lại request ban đầu
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        localStorage.setItem("access_token", newToken);
        return instance.request(error.config);
      }
      // Không lấy được token mới → để rơi xuống reject cuối
    }

    // ── Case 2: 400 từ /auth/refresh (refresh token hết hạn / bị revoke) ────
    if (
      error.config &&
      error.response &&
      +error.response.status === 400 &&
      error.config.url === "/api/v1/auth/refresh"
    ) {
      // Chỉ redirect nếu user đang ở trang cần xác thực
      if (!isPublicPage(window.location.pathname)) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

