import {createBrowserRouter, Navigate} from "react-router-dom";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import { useSelector } from "react-redux";
import type { RootState } from "../store/Store";
function ProtectedRoute() {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated
    );
    return isAuthenticated ? <Chat /> : <Navigate to="/login" replace />;
}
function LoginRoute() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    return isAuthenticated ? <Navigate to="/chat" replace /> : <Login />;
}
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" replace />
    },
    {
        path: "/login",
        element: <LoginRoute />
    },
    {
        path: "/chat",
        element: <ProtectedRoute />
    }
]);