export const resolveChatUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If the url is a relative path (doesn't start with http/https)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBackendUrl}${cleanUrl}`;
  }
  
  // If the url is absolute but contains trycloudflare.com
  if (url.includes('trycloudflare.com')) {
    try {
      const parsedUrl = new URL(url);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
      return `${cleanBackendUrl}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
      return url.replace(/https?:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/i, cleanBackendUrl);
    }
  }

  // If the url contains localhost:9000 or 127.0.0.1:9000 (MinIO internal endpoint)
  if (url.includes('localhost:9000') || url.includes('127.0.0.1:9000')) {
    try {
      const parsedUrl = new URL(url);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
      return `${cleanBackendUrl}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
      return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):9000/i, cleanBackendUrl);
    }
  }
  
  return url;
};
