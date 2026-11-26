import { useState } from "react";
import type { SyntheticEvent } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.ts";
import { loginSuccess } from "../store/slice/AuthSlice";
import "./login.css";
import { useTranslation } from "react-i18next";
function Login() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (loading) return;
        if (mode === "register" && !/^[a-zA-Z0-9_]+$/.test(username)) {
            setError("Username chỉ được chứa chữ cái, chữ số và dấu gạch dưới.");
            return;
        }
        if (mode === "register") {
            if (password.length < 8) {
                setError("Mật khẩu phải có ít nhất 8 ký tự.");
                return;
            }
            if (password !== confirmPassword) {
                setError("Mật khẩu nhập lại không khớp.");
                return;
            }
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
                setConfirmPassword("");
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
        setPassword("");
        setConfirmPassword("");
    };
    return (
        <div className="login_page">
            <div className="card login_card">
                <h2 className="login_title">
                    App Chat
                </h2>
                <div className="btn-group login_mode">
                    <button type="button" className={`btn ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => changeMode("login")}
                        disabled={loading}>
                        {t("login")}
                    </button>
                    <button type="button" className={`btn ${mode === "register" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => changeMode("register")}
                        disabled={loading}>
                        {t("register")}
                    </button>
                </div>
                <h4 className="login_heading text-center">
                    {mode === "login" ? t("login") : t("register")}
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
                <form className="login_form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>
                        <input type="text" className="form-control" placeholder={t("enterUName")} value={username} required disabled={loading}
                            onChange={(event) => setUsername(event.target.value)}/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>
                        <input type="password" className="form-control" placeholder={t("enterPass")} value={password} required disabled={loading}
                            onChange={(event) => setPassword(event.target.value)}/>
                    </div>
                    {mode === "register" && (
                        <div className="mb-3">
                            <label className="form-label">
                                {t("confirmPass")}
                            </label>
                            <input type="password" className="form-control" placeholder={t("enterConfirmPass")} value={confirmPassword} required disabled={loading}
                                onChange={(event) => setConfirmPassword(event.target.value)}/>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary login_submit w-100" disabled={loading}>
                        {
                            loading ? t("processing") : mode === "login" ? "Login" : "Register"
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;