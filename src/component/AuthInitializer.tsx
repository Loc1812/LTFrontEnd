import {useEffect, useState, type ReactNode} from "react";
import { useDispatch } from "react-redux";
import {authService, AuthServiceError} from "../services/authService";
import { websocketService } from "../services/websocket";
import {loginSuccess, logout} from "../store/slice/AuthSlice";
interface AuthInitializerProps {children: ReactNode;}
function AuthInitializer({children}: AuthInitializerProps) {
    const dispatch = useDispatch();
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        let active = true;
        const restoreSession = async () => {
            const savedSession = authService.getSavedSession();
            if (!savedSession) {
                if (active) {
                    setInitialized(true);
                }
                return;
            }
            try {
                const newCode = await authService.reLogin(savedSession.username, savedSession.reLoginCode);
                if (!active) return;
                authService.saveSession(savedSession.username, newCode);
                dispatch(
                    loginSuccess({
                        username: savedSession.username,
                        reLoginCode: newCode
                    })
                );
            } catch (error) {
                if (!active) return;
                console.error("Không thể khôi phục phiên đăng nhập:", error);
                if (error instanceof AuthServiceError && error.code !== "REQUEST_FAILED") {
                    authService.clearSession();
                    dispatch(logout());
                } else {
                    websocketService.close();
                }
            } finally {
                if (active) {
                    setInitialized(true);
                }
            }
        };
        restoreSession();
        return () => {
            active = false;
        };
    }, [dispatch]);
    if (!initialized) {
        return (<div className="container text-center mt-5">Đang khôi phục phiên đăng nhập...</div>);
    }
    return <>{children}</>;
}
export default AuthInitializer;
