
import { Link, useRouteError } from "react-router-dom";

function Error() {
    const error = useRouteError();
    console.error("Router error:", error);
    return (
        <div style={{textAlign: "center", padding: "80px 20px"}}>
            <h1 style={{ fontSize: "80px", color: "#dc3545" }}>
                ERROR
            </h1>
            <h2>Oops! Đã xảy ra lỗi</h2>
            <p>
                Đường dẫn không hợp lệ hoặc trang bạn đang tìm kiếm không tồn tại.
            </p>
            <Link to="/login" style={{
                display: "inline-block",
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#0d6efd",
                color: "white",
                textDecoration: "none",
                borderRadius: "5px"
            }}
            >
                Quay về trang đăng nhập
            </Link>
        </div>
    );
}
export default Error;
