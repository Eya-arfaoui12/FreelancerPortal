import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // Si pas connecté → redirection vers page d'accueil
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Si un rôle est requis et que l'utilisateur n'a pas ce rôle
  if (requiredRole && currentUser?.role !== requiredRole) {
    if (currentUser?.role === "ADMIN") {
      return <Navigate to="/admin/overview" replace />;
    } else if (currentUser?.role === "FREELANCER") {
      return <Navigate to="/freelancer/overview" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // Si déjà connecté → redirection vers le dashboard approprié
  if (isAuthenticated()) {
    if (currentUser?.role === "ADMIN") {
      return <Navigate to="/admin/overview" replace />;
    } else if (currentUser?.role === "FREELANCER") {
      return <Navigate to="/freelancer/overview" replace />;
    }
  }

  return children;
};
