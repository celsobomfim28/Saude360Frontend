import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const hasPermission = !allowedRoles || (user ? allowedRoles.includes(user.role) : false);

    useEffect(() => {
        if (isAuthenticated && user && !hasPermission) {
            toast.warning('Você não tem permissão para acessar esta funcionalidade.', {
                toastId: `forbidden-route-${location.pathname}`,
            });
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, user, hasPermission, navigate, location.pathname]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasPermission) {
        return null;
    }

    return children;
}
