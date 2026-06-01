import { useEffect, useState } from "react";
import { useAppSelector } from "../../redux/hooks";
import ForbiddenPage from "../shared/common/403/403";

// Interface định nghĩa props của component
interface IProps {
  hideChildren?: boolean; // true = ẩn hoàn toàn, false = hiện trang 403
  children: React.ReactNode; // Nội dung cần bảo vệ
  permission: { method: string; apiPath: string; module: string }; // Quyền cần check
}

const Access = (props: IProps) => {
  const { permission } = props;
  
  // Tự động xác định hideChildren:
  // Nếu là quyền GET list (thường là apiPath không chứa '{id}' và method là 'GET'), ta hiển thị ForbiddenPage.
  // Các quyền khác (CREATE, UPDATE, DELETE, v.v.) thì ẩn luôn (render nothing).
  const isGetList = permission?.method === "GET" && !permission?.apiPath?.includes("{id}");
  const hideChildren = props.hideChildren !== undefined ? props.hideChildren : !isGetList;
  const [allow, setAllow] = useState<boolean>(false);

  const user = useAppSelector((state: any) => state.auth.user);
  const permissions = user?.role?.permissions || [];

  useEffect(() => {
    // Nếu không có user hoặc role, hoặc permission chưa được định nghĩa, không cho phép
    if (!user || !user.role || !permission) {
      setAllow(false);
      return;
    }

    // Nếu là admin, cho phép tất cả
    if (user.role.name?.toLowerCase().includes("admin")) {
      setAllow(true);
      return;
    }

    // Check permission cụ thể
    if (permissions?.length) {
      const check = permissions.find(
        (item: any) =>
          item &&
          item.apiPath === permission.apiPath &&
          item.method === permission.method &&
          item.module === permission.module
      );

      if (check) {
        setAllow(true);
      } else {
        setAllow(false);
      }
    } else {
      setAllow(false);
    }
  }, [permissions, user, permission]);

  return (
    <>
      {allow === true ? (
        <>{props.children}</>
      ) : (
        <>
          {hideChildren === false ? (
            <ForbiddenPage />
          ) : (
            <>{/* render nothing */}</>
          )}
        </>
      )}
    </>
  );
};

export default Access;
