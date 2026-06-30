import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import LayoutClient from '../layout/client/LayoutClient'
import LoginPage from '../pages/auth/login/LoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import ForgetPasswordPage from '../pages/auth/forgetpassword/ForgetPasswordPage'
import AboutPage from '../pages/client/about/AboutPage'
import ContactPage from '../pages/client/contact/ContactPage'
import SalaryPredictorPage from '../pages/client/salary/SalaryPredictorPage'
import HomePage from '../pages/client/home/HomePage'
import JobList from '../pages/client/job/JobList'
import JobDetailPage from '../pages/client/job/job-detail/JobDetailPage'
import CompanyList from '../pages/client/company/CompanyList'
import CompanyDetailPage from '../pages/client/company-detail/CompanyDetailPage'
import CompanyRegisterPage from '../pages/client/company/CompanyRegisterPage'
import ProfileSettings from '../pages/client/profile/ProfileSettings'
import ResumeManagerPage from '../pages/client/cv/ResumeManagerPage'
import ResumeBuilderPage from '../pages/client/cv/ResumeBuilderPage'
import JobHRPage             from '../pages/client/job-hr/JobHRPage'
import JobApplicationsPage   from '../pages/client/job-application/JobApplicationsPage'
import AppliedJobsPage       from '../pages/client/job-candidate/AppliedJobsPage'
import ChatPage              from '../pages/client/chat/ChatPage'
import NotificationList      from '../pages/client/notification/NotificationList'

import AdminLayout      from '../layout/admin/AdminLayout'
import RoleBasedRoute   from '../components/auth/RoleBasedRoute'
import Dashboard       from '../pages/admin/dashboard/Dashboard'
import PermissionTable from '../components/admin/permission/permission.table'
import RoleTable       from '../components/admin/role/role.table'
import CompanyTable    from '../components/admin/company/company.table'
import CustomerTable   from '../components/admin/customer/customer.table'
import SkillTable      from '../components/admin/skill/skill.table'
import ResumeAdminTable   from '../components/admin/resume/resume.table'
import ApplicationTable   from '../components/admin/application/application.table'
import AccountTable       from '../components/admin/account/account.table'
import JobTable           from '../components/admin/job/job.table'
import ContactTable       from '../components/admin/contact/contact.table'
import NotificationManagement from '../pages/admin/notifications/NotificationManagement'
import HireAgentManagement from '../pages/client/hire-agent/HireAgentManagement'
import InterviewSchedulerPage from '../pages/client/interview-scheduler/InterviewSchedulerPage'
import SupportPage from '../pages/admin/support/SupportPage'
import DocsPage from '../pages/admin/docs/DocsPage'

// ─── Public Pages (bỏ comment khi tạo file) ──────────────────────
// import HomePage from '../pages/client/HomePage'
// import JobListPage from '../pages/client/JobListPage'
// import JobDetailPage from '../pages/client/JobDetailPage'
// import CompanyListPage from '../pages/client/CompanyListPage'
// import SalaryPredictorPage from '../pages/client/SalaryPredictorPage'

// ─── Auth Pages (bỏ comment khi tạo file) ────────────────────────
// import LoginPage from '../pages/auth/LoginPage'
// import RegisterPage from '../pages/auth/RegisterPage'

// ─── Candidate Pages (bỏ comment khi tạo file) ───────────────────
// import CandidateDashboardPage from '../pages/client/candidate/CandidateDashboardPage'
// import CandidateProfilePage from '../pages/client/candidate/CandidateProfilePage'
// import ResumeManagerPage from '../pages/client/candidate/ResumeManagerPage'
// import ApplicationHistoryPage from '../pages/client/candidate/ApplicationHistoryPage'
// import SavedJobsPage from '../pages/client/candidate/SavedJobsPage'

// ─── Employer / Admin Pages (bỏ comment khi tạo file) ────────────
// import HRDashboardPage from '../pages/admin/HRDashboardPage'
// import JobManagementPage from '../pages/admin/JobManagementPage'
// import CreateJobPage from '../pages/admin/CreateJobPage'
// import EditJobPage from '../pages/admin/EditJobPage'
// import ATSBoardPage from '../pages/admin/ATSBoardPage'

// ─── Placeholder (xóa khi có trang thật) ─────────────────────────
const ComingSoon = ({ page }: { page: string }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
    <h2>🚧 Trang đang xây dựng</h2>
    <p>Page: <strong>{page}</strong></p>
  </div>
)

// ─── Định nghĩa Router ────────────────────────────────────────────
const router = createBrowserRouter([

  // ── Public Routes (có layout Header + Footer chung) ──────────────
  {
    element: <LayoutClient />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/jobs', element: <JobList /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },
      { path: '/companies', element: <CompanyList /> },
      { path: '/companies/:id', element: <CompanyDetailPage /> },
      { path: '/salary-predict', element: <SalaryPredictorPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/candidate/profile', element: <ProfileSettings /> },
      { path: '/candidate/resume', element: <ResumeManagerPage /> },
      { path: '/candidate/resume/builder/:id', element: <ResumeBuilderPage /> },
      {
        path: '/candidate/applied-jobs',
        element: (
          <RoleBasedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
            <AppliedJobsPage />
          </RoleBasedRoute>
        )
      },
      {
        path: '/candidate/saved-jobs',
        element: (
          <RoleBasedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
            <AppliedJobsPage />
          </RoleBasedRoute>
        )
      },
      {
        path: '/candidate/notifications',
        element: (
          <RoleBasedRoute allowedRoles={['CANDIDATE', 'HR', 'ADMIN']}>
            <NotificationList />
          </RoleBasedRoute>
        )
      },
      { path: '/company/register', element: <CompanyRegisterPage /> },
      // ── HR routes (dùng layout client) ────────────────────────────
      {
        path: '/hr/jobs',
        element: (
          <RoleBasedRoute allowedRoles={['HR', 'ADMIN']}>
            <JobHRPage />
          </RoleBasedRoute>
        )
      },
      {
        path: '/hr/jobs/:jobId/applications',
        element: (
          <RoleBasedRoute allowedRoles={['HR', 'ADMIN']}>
            <JobApplicationsPage />
          </RoleBasedRoute>
        )
      },
      {
        path: '/hr/hire-agent',
        element: (
          <RoleBasedRoute allowedRoles={['HR', 'ADMIN']}>
            <HireAgentManagement />
          </RoleBasedRoute>
        )
      },
      {
        path: '/hr/interview-scheduler',
        element: (
          <RoleBasedRoute allowedRoles={['HR', 'ADMIN']}>
            <InterviewSchedulerPage />
          </RoleBasedRoute>
        )
      },
    ],
  },

  // ── Auth Routes (không layout chung) ─────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgetPasswordPage /> },

  // ── Candidate Portal Routes (layout sidebar ứng viên) ─────────────
  {
    path: '/candidate',
    // element: <CandidateLayout />,  // bỏ comment khi có layout
    element: <Outlet />,
    children: [
      { index: true, element: <ComingSoon page="CandidateDashboardPage" /> },
      { path: 'profile', element: <ComingSoon page="CandidateProfilePage" /> },
      { path: 'resumes', element: <ComingSoon page="ResumeManagerPage" /> },
      { path: 'applications', element: <ComingSoon page="ApplicationHistoryPage" /> },
      { path: 'saved-jobs', element: <ComingSoon page="SavedJobsPage" /> },
    ],
  },

  // ── Employer / HR Portal Routes (layout admin) ────────────────────
  {
    path: '/admin',
    element: (
      <RoleBasedRoute excludedRoles={['CANDIDATE']}>
        <AdminLayout />
      </RoleBasedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers',    element: <CustomerTable /> },
      { path: 'accounts',     element: <AccountTable /> },
      { path: 'permissions',  element: <PermissionTable /> },
      { path: 'roles',        element: <RoleTable /> },
      { path: 'companies',    element: <CompanyTable /> },
      { path: 'skills',       element: <SkillTable /> },
      { path: 'contacts',     element: <ContactTable /> },
      { path: 'resumes',      element: <ResumeAdminTable /> },
      { path: 'applications', element: <ApplicationTable /> },
      { path: 'jobs',         element: <JobTable /> },
      { path: 'notifications', element: <NotificationManagement /> },
      { path: 'jobs/create', element: <ComingSoon page="CreateJobPage" /> },
      { path: 'jobs/:id/edit', element: <ComingSoon page="EditJobPage" /> },
      { path: 'jobs/:id/ats', element: <ComingSoon page="ATSBoardPage" /> },
      { path: 'analytics', element: <ComingSoon page="Analytics" /> },
      { path: 'financials', element: <ComingSoon page="Financials" /> },
      { path: 'settings', element: <ComingSoon page="Settings" /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'docs', element: <DocsPage /> },
    ],
  },

  // ── 404 Fallback ─────────────────────────────────────────────────
  { path: '*', element: <ComingSoon page="404 - Không tìm thấy trang" /> },
])

// ─── Export RouterProvider ────────────────────────────────────────
export default function AppRouter() {
  return <RouterProvider router={router} />
}
