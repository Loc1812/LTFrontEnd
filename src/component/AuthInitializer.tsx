import { useEffect, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { authService } from "../services/authService";
import {loginSuccess, logout} from "../store/slice/AuthSlice";
interface AuthInitializerProps {
    children: ReactNode;
}
function AuthInitializer({ children }: AuthInitializerProps) {
    const dispatch = useDispatch();
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        const restoreSession = async () => {
            const savedSession = authService.getSavedSession();
            if (!savedSession) {
                setInitialized(true);
                return;
            }
            try {
                const newCode = await authService.reLogin(savedSession.username, savedSession.reLoginCode);
                authService.saveSession(savedSession.username, newCode);
                dispatch(
                    loginSuccess({
                        username: savedSession.username,
                        reLoginCode: newCode
                    })
                );
            } catch (error) {
                console.error("Không thể khôi phục phiên đăng nhập.");
                const message = error instanceof Error ? error.message : "";
                if (/session expired|re-login error/i.test(message)) {
                    authService.clearSession();
                    dispatch(logout());
                }
            } finally {
                setInitialized(true);
            }
        };
        restoreSession();
    }, [dispatch]);
    if (!initialized) {
        return <div>Đang khôi phục phiên đăng nhập...</div>;
    }
    return <>{children}</>;
}
export default AuthInitializer;
