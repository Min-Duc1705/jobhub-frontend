import { Outlet } from "react-router-dom"
import FooterClient from "./footer-client/FooterClient"
import HeaderClient from "./header-client/HeaderClient"
import FloatingChatWidget from "../../components/shared/chat/FloatingChatWidget"

const LayoutClient = () => {
  return (
    <div>
        <HeaderClient />
        <Outlet />
        <FloatingChatWidget />
        <FooterClient />
    </div>
  )
}

export default LayoutClient