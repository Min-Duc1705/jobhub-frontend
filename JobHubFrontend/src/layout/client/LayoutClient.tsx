import { Outlet } from "react-router-dom"
import FooterClient from "./footer-client/FooterClient"
import HeaderClient from "./header-client/HeaderClient"

const LayoutClient = () => {
  return (
    <div>
        <HeaderClient />
        <Outlet />
        <FooterClient />
    </div>
  )
}

export default LayoutClient