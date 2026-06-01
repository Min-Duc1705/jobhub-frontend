import { App } from 'antd'
import { useEffect } from 'react'
import { _initAntdInstances } from '../utils/antd'

/**
 * Đặt component này BÊN TRONG <AntdApp> để capture các instance.
 * Chỉ render một lần ở main.tsx.
 */
export default function AppGlobalHelper() {
  const { message, notification, modal } = App.useApp()

  useEffect(() => {
    _initAntdInstances(message, notification, modal)
  }, [message, notification, modal])

  return null
}
