export const All_PERMISSIONS = {
  AUTH: {
    GET_ACCOUNT: { method: "GET", apiPath: "/api/v1/auth/account", module: "AUTH" },
  },
  USERS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/users", module: "USER" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/users/{id}", module: "USER" },
    CREATE: { method: "POST", apiPath: "/api/v1/users", module: "USER" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/users/{id}", module: "USER" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/users/{id}", module: "USER" },
    RESET_PASSWORD: { method: "PATCH", apiPath: "/api/v1/users/{id}/reset-password", module: "USER" },
  },
  ROLES: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/roles", module: "ROLE" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/roles/{id}", module: "ROLE" },
    CREATE: { method: "POST", apiPath: "/api/v1/roles", module: "ROLE" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/roles/{id}", module: "ROLE" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/roles/{id}", module: "ROLE" },
  },
  PERMISSIONS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/permissions", module: "PERMISSION" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/permissions/{id}", module: "PERMISSION" },
    CREATE: { method: "POST", apiPath: "/api/v1/permissions", module: "PERMISSION" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/permissions/{id}", module: "PERMISSION" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/permissions/{id}", module: "PERMISSION" },
  },
  PROFILES: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/customers", module: "PROFILE" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/customers/{id}", module: "PROFILE" },
    GET_MY: { method: "GET", apiPath: "/api/v1/customers/me", module: "PROFILE" },
    UPDATE_MY: { method: "PUT", apiPath: "/api/v1/customers/me", module: "PROFILE" },
    UPLOAD_AVATAR: { method: "POST", apiPath: "/api/v1/customers/upload-avatar", module: "PROFILE" },
  },
  CUSTOMERS: {
    UPDATE: { method: "PUT", apiPath: "/api/v1/customers/{id}", module: "CUSTOMER" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/customers/{id}", module: "CUSTOMER" },
  },
  COMPANIES: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/companies", module: "COMPANY" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/companies/{id}", module: "COMPANY" },
    CREATE: { method: "POST", apiPath: "/api/v1/companies", module: "COMPANY" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/companies/{id}", module: "COMPANY" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/companies/{id}", module: "COMPANY" },
    VERIFY: { method: "PATCH", apiPath: "/api/v1/companies/{id}/verify", module: "COMPANY" },
    UPLOAD: { method: "POST", apiPath: "/api/v1/companies/upload", module: "COMPANY" },
  },
  JOBS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/jobs", module: "JOB" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/jobs/{id}", module: "JOB" },
    GET_ADMIN: { method: "GET", apiPath: "/api/v1/admin/jobs", module: "JOB" },
    CREATE: { method: "POST", apiPath: "/api/v1/jobs", module: "JOB" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/jobs/{id}", module: "JOB" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/jobs/{id}", module: "JOB" },
    STATUS: { method: "PATCH", apiPath: "/api/v1/jobs/{id}/status", module: "JOB" },
    GET_SAVED: { method: "GET", apiPath: "/api/v1/saved-jobs", module: "JOB" },
    SAVE: { method: "POST", apiPath: "/api/v1/saved-jobs/{jobId}", module: "JOB" },
    UNSAVE: { method: "DELETE", apiPath: "/api/v1/saved-jobs/{jobId}", module: "JOB" },
  },
  RESUMES: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/resumes", module: "RESUME" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/resumes/{id}", module: "RESUME" },
    CREATE: { method: "POST", apiPath: "/api/v1/resumes", module: "RESUME" },
    CREATE_ONLINE: { method: "POST", apiPath: "/api/v1/resumes/online", module: "RESUME" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/resumes/{id}", module: "RESUME" },
    UPDATE_CONTENT: { method: "PUT", apiPath: "/api/v1/resumes/{id}/content", module: "RESUME" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/resumes/{id}", module: "RESUME" },
    SET_DEFAULT: { method: "PATCH", apiPath: "/api/v1/resumes/{id}/set-default", module: "RESUME" },
  },
  APPLICATIONS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/applications", module: "APPLICATION" },
    GET_BY_ID: { method: "GET", apiPath: "/api/v1/applications/{id}", module: "APPLICATION" },
    CREATE: { method: "POST", apiPath: "/api/v1/applications", module: "APPLICATION" },
    STATUS: { method: "PATCH", apiPath: "/api/v1/applications/{id}/status", module: "APPLICATION" },
  },
  SKILLS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/skills", module: "SKILL" },
    CREATE: { method: "POST", apiPath: "/api/v1/skills", module: "SKILL" },
    UPDATE: { method: "PUT", apiPath: "/api/v1/skills/{id}", module: "SKILL" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/skills/{id}", module: "SKILL" },
  },
  CONTACTS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/contacts", module: "CONTACT" }
  }
};
