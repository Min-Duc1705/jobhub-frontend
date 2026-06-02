export interface BreadcrumbItem {
  title: string
  href?: string
}

export const ADMIN_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  accounts: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Người dùng' },
    { title: 'Tài khoản hệ thống' },
  ],
  customers: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Người dùng' },
    { title: 'Khách hàng' },
  ],
  companies: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Công ty' },
  ],
  skills: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Kỹ năng' },
  ],
  jobs: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Tin tuyển dụng' },
  ],
  resumes: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'CV & Ứng tuyển' },
    { title: 'Quản lý CV' },
  ],
  applications: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'CV & Ứng tuyển' },
    { title: 'Đơn ứng tuyển' },
  ],
  permissions: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Hệ thống' },
    { title: 'Permissions' },
  ],
  roles: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Hệ thống' },
    { title: 'Roles' },
  ],
  contacts: [
    { title: 'Trang chủ', href: '/admin/dashboard' },
    { title: 'Liên hệ' },
  ],
}
