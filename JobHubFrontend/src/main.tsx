import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { ProConfigProvider } from '@ant-design/pro-components'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import AuthProvider from './components/auth/AuthProvider'
import AppGlobalHelper from './components/AppGlobalHelper'
import './index.scss'
import AppRouter from './App.tsx'

// ── Vietnamese locale cho @ant-design/pro-components ─────────────────────────
// Pro-components không có sẵn vi_VN nên cần tự định nghĩa
const proViVN = {
  locale: 'vi_VN',
  getMessage: (id: string, defaultMessage: string) => {
    const messages: Record<string, string> = {
      // Search form
      'tableForm.search':            'Tìm kiếm',
      'tableForm.reset':             'Đặt lại',
      'tableForm.submit':            'Tìm kiếm',
      'tableForm.collapsed':         'Thu gọn',
      'tableForm.expand':            'Mở rộng',
      'tableForm.inputPlaceholder':  'Vui lòng nhập',
      'tableForm.selectPlaceholder': 'Vui lòng chọn',
      // Alert / selection
      'alert.clear':    'Bỏ chọn',
      'alert.selected': 'Đã chọn',
      'alert.item':     'mục',
      // Toolbar
      'tableToolBar.reload':           'Tải lại',
      'tableToolBar.density':          'Mật độ',
      'tableToolBar.densityLarger':    'Rộng',
      'tableToolBar.densityMiddle':    'Trung bình',
      'tableToolBar.densitySmall':     'Hẹp',
      'tableToolBar.columnDisplay':    'Cài đặt cột',
      'tableToolBar.filter':           'Bộ lọc',
      'tableToolBar.export':           'Xuất',
      'tableToolBar.reset':            'Đặt lại',
      'tableToolBar.showHide':         'Hiện/Ẩn',
      'tableToolBar.leftFixedTitle':   'Cố định trái',
      'tableToolBar.rightFixedTitle':  'Cố định phải',
      'tableToolBar.noFixedTitle':     'Không cố định',
      // Light filter
      'form.lightFilter.more':    'Xem thêm',
      'form.lightFilter.clear':   'Xóa',
      'form.lightFilter.confirm': 'Xác nhận',
      'form.lightFilter.itemUnit':'mục',
    }
    return messages[id] ?? defaultMessage
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {/* ConfigProvider: theme & locale antd (vi_VN) */}
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#005daa',   // Brand secondary navy — tints đẹp hơn #002660
            borderRadius: 6,
            fontFamily: "'Inter', sans-serif",
          },
        }}
      >
        {/* ProConfigProvider: locale tiếng Việt cho @ant-design/pro-components */}
        <ProConfigProvider intl={proViVN}>
          <AntdApp>
            <AppGlobalHelper />
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </AntdApp>
        </ProConfigProvider>
      </ConfigProvider>
    </Provider>
  </StrictMode>,
)
