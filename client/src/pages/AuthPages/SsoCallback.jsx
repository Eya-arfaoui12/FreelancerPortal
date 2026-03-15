import React, { useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthPageLayout';

const SsoCallback = () => {
  const { isSignedIn } = useAuth();
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger
    if (isSignedIn) {
      navigate('/homeDashboard');
      return;
    }

    const handleAuthRedirect = async () => {
      try {
        console.log('Traitement de la redirection OAuth');
        
        // Clerk gère automatiquement la redirection
        await handleRedirectCallback({
          redirectUrl: '/homeDashboard',
          redirectUrlComplete: '/homeDashboard',
        });
        
        // Si on arrive ici, c'est que la redirection a fonctionné
        console.log('Redirection OAuth réussie');
        navigate('/homeDashboard');
      } catch (error) {
        console.error('Erreur lors de la redirection OAuth:', error);
        
        // En cas d'erreur, rediriger vers la page de connexion
        navigate('/signin', { 
          state: { error: 'Échec de l\'authentification. Veuillez réessayer.' } 
        });
      }
    };

    handleAuthRedirect();
  }, [handleRedirectCallback, navigate, isSignedIn]);

  return (
    <AuthLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Traitement de l'authentification...</p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SsoCallback;