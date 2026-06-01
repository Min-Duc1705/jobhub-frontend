/**
 * Global Ant Design message / notification / modal proxy.
 *
 * Thay vì gọi `message.success(...)` từ antd (static — không nhận theme/locale),
 * hãy import từ file này:
 *
 *   import { message, notification } from '../../utils/antd'
 *
 * Các instance được khởi tạo qua `AppGlobalHelper` (bên trong <AntdApp>).
 */

import type { MessageInstance }        from 'antd/es/message/interface'
import type { NotificationInstance }   from 'antd/es/notification/interface'
import type { ModalStaticFunctions }   from 'antd/es/modal/confirm'

// ── Private storage ───────────────────────────────────────────────────────────
let _msg:  MessageInstance
let _ntf:  NotificationInstance
let _modal: Omit<ModalStaticFunctions, 'warn'>

/** Được gọi bởi AppGlobalHelper khi App context sẵn sàng. */
export function _initAntdInstances(
  msg:   MessageInstance,
  ntf:   NotificationInstance,
  modal: Omit<ModalStaticFunctions, 'warn'>,
) {
  _msg   = msg
  _ntf   = ntf
  _modal = modal
}

// ── Public proxies — API giống hệt antd static ────────────────────────────────
export const message = {
  success: (...args: Parameters<MessageInstance['success']>) => _msg?.success(...args),
  error:   (...args: Parameters<MessageInstance['error']>)   => _msg?.error(...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => _msg?.warning(...args),
  info:    (...args: Parameters<MessageInstance['info']>)    => _msg?.info(...args),
  loading: (...args: Parameters<MessageInstance['loading']>) => _msg?.loading(...args),
  open:    (...args: Parameters<MessageInstance['open']>)    => _msg?.open(...args),
  destroy: (...args: Parameters<MessageInstance['destroy']>) => _msg?.destroy(...args),
}

export const notification = {
  success: (...args: Parameters<NotificationInstance['success']>) => _ntf?.success(...args),
  error:   (...args: Parameters<NotificationInstance['error']>)   => _ntf?.error(...args),
  warning: (...args: Parameters<NotificationInstance['warning']>) => _ntf?.warning(...args),
  info:    (...args: Parameters<NotificationInstance['info']>)    => _ntf?.info(...args),
  open:    (...args: Parameters<NotificationInstance['open']>)    => _ntf?.open(...args),
  destroy: (...args: Parameters<NotificationInstance['destroy']>) => _ntf?.destroy(...args),
}

export const modal = {
  confirm: (...args: Parameters<ModalStaticFunctions['confirm']>) => _modal?.confirm(...args),
  info:    (...args: Parameters<ModalStaticFunctions['info']>)    => _modal?.info(...args),
  success: (...args: Parameters<ModalStaticFunctions['success']>) => _modal?.success(...args),
  error:   (...args: Parameters<ModalStaticFunctions['error']>)   => _modal?.error(...args),
  warning: (...args: Parameters<ModalStaticFunctions['warning']>) => _modal?.warning(...args),
}
