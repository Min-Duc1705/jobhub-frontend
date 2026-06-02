import { Button } from 'antd'
import { BookOutlined, SendOutlined, MessageOutlined } from '@ant-design/icons'

interface Props {
  saved: boolean
  alreadyApplied: boolean
  showChatButton: boolean
  onToggleSave: () => void
  onApply: () => void
  onMessage: () => void
}

const JobStickyBar = ({ saved, alreadyApplied, showChatButton, onToggleSave, onApply, onMessage }: Props) => {
  return (
    <div className="jd-sticky-bar">
      <Button
        type={saved ? 'primary' : 'default'}
        style={{ flex: 1, borderColor: '#005daa', color: saved ? undefined : '#005daa' }}
        icon={<BookOutlined />}
        onClick={onToggleSave}
      >
        {saved ? 'Đã lưu' : 'Lưu tin'}
      </Button>
      {showChatButton && (
        <Button
          style={{ flex: 1, borderColor: '#005daa', color: '#005daa' }}
          icon={<MessageOutlined />}
          onClick={onMessage}
        >
          Chat
        </Button>
      )}
      <Button
        type="primary"
        style={alreadyApplied
          ? { flex: 2, background: '#52c41a', borderColor: '#52c41a', fontWeight: 700 }
          : { flex: 2, background: '#002660', borderColor: '#002660', fontWeight: 700 }
        }
        icon={<SendOutlined />}
        disabled={alreadyApplied}
        onClick={alreadyApplied ? undefined : onApply}
      >
        {alreadyApplied ? '✓ Đã ứng tuyển' : 'Ứng tuyển ngay'}
      </Button>
    </div>
  )
}

export default JobStickyBar
