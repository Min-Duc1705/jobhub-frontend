import { Outlet } from "react-router-dom"
import FooterClient from "./footer-client/FooterClient"
import HeaderClient from "./header-client/HeaderClient"
import FloatingChatWidget from "../../components/shared/chat/FloatingChatWidget"
import FloatingAIButton from "../../components/shared/ai-assistant/FloatingAIButton"

const LayoutClient = () => {
  return (
    <div>
        <HeaderClient />
        <Outlet />
        <FloatingChatWidget />
        <FloatingAIButton />
        <FooterClient />
    </div>
  )
}

export default LayoutClient