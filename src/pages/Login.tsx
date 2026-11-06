import { useState } from "react";
import type { SyntheticEvent } from "react";
function Login() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (mode === "login") {
            console.log("Login:", username, password);
        } else {
            console.log("Register:", username, password);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow p-4" style={{ width: "400px" }}>
                <h2 className="text-center mb-4">
                    App Chat
                </h2>
                {/* Chọn Login hoặc Register */}
                <div className="btn-group w-100 mb-4">
                    <button type="button"
                        className={`btn ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setMode("login")}>
                        Login
                    </button>
                    <button
                        type="button"
                        className={`btn ${mode === "register" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setMode("register")}>
                        Register
                    </button>
                </div>
                <h4 className="text-center mb-3">
                    {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                </h4>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>
                        <input type="text" className="form-control" placeholder="Nhập username" value={username}
                               onChange={(event) => setUsername(event.target.value)} required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>
                        <input type="password" className="form-control" placeholder="Nhập password" value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required/>
                    </div>
                    <button type="submit" className="btn btn-success w-100">
                        {mode === "login" ? "Login" : "Register"}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Login;