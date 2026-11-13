import {createBrowserRouter, Navigate, Outlet} from "react-router-dom";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import Error from "./Error.tsx";
import {useSelector} from "react-redux";
import type {RootState} from "../store/Store";
import SocketManager from "../component/SocketManager.tsx";
function ProtectedRoute() {
    const isAuthenticated = useSelector(
        (state: RootState) => state.auth.isAuthenticated
    );
    return isAuthenticated ? <Chat/> : <Navigate to="/login" replace/>;
}
function LoginRoute() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    return isAuthenticated ? <Navigate to="/chat" replace/> : <Login/>;
}
function AppLayout() {
    return (
        <SocketManager>
            <Outlet/>
        </SocketManager>
    );
}
export const router = createBrowserRouter([
    {
        element: <AppLayout/>,
        children: [
            {
                path: "/",
                element: <Navigate to="/login" replace/>
            },
            {
                path: "/login",
                element: <LoginRoute/>
            },
            {
                path: "/chat",
                element: <ProtectedRoute/>
            },
            {
                path: "*",
                element: <Error/>
            }
        ]
    }
]);