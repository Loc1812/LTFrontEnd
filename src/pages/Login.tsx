import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.ts";
import { loginSuccess } from "../store/slice/AuthSlice";
function Login() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (loading) return;
        if (mode === "register" && !/^[a-zA-Z0-9_]+$/.test(username)) {
            setError("Username chỉ được chứa chữ cái, chữ số và dấu gạch dưới.");
            return;
        }
        setLoading(true);
        try {
            if (mode === "login") {
                const reLoginCode = await authService.login(username, password);
                authService.saveSession(username, reLoginCode);
                dispatch(loginSuccess({username, reLoginCode}));
                navigate("/chat");
            } else {
                await authService.register(username, password);
                setSuccess("Đăng ký thành công! Hãy đăng nhập.");
                setMode("login");
                setPassword("");
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Đã xảy ra lỗi không xác định.");
            }
        } finally {
            setLoading(false);
        }
    };
    const changeMode = (newMode: "login" | "register") => {
        setMode(newMode);
        setError("");
        setSuccess("");
    };
    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow p-4" style={{ width: "400px" }}>
                <h2 className="text-center mb-4">
                    App Chat
                </h2>
                <div className="btn-group w-100 mb-4">
                    <button type="button" className={`btn ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => changeMode("login")}
                        disabled={loading}>
                        đăng nhập
                    </button>
                    <button type="button" className={`btn ${mode === "register" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => changeMode("register")}
                        disabled={loading}>
                        Đăng ký
                    </button>
                </div>
                <h4 className="text-center mb-3">
                    {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                </h4>
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="alert alert-success">
                        {success}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>
                        <input type="text" className="form-control" placeholder="Nhập username" value={username} required disabled={loading}
                            onChange={(event) => setUsername(event.target.value)}/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>
                        <input type="password" className="form-control" placeholder="Nhập password" value={password} required disabled={loading}
                            onChange={(event) => setPassword(event.target.value)}/>
                    </div>
                    <button type="submit" className="btn btn-success w-100" disabled={loading}>
                        {
                            loading ? "Đang xử lý..." : mode === "login" ? "Login" : "Register"
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;