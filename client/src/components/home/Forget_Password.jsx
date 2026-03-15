import React from 'react';
import { Clerk } from '@clerk/clerk-js';

const Forget_Password = () => {
    const handleResetPassword = () => {
        try {
        Clerk.redirectToForgotPassword(); // Redirige vers la page Clerk "Forgot Password"
        } catch (error) {
        console.error('Erreur lors de la redirection :', error);
        }
        };

    return (
        <div>
            <p onClick={handleResetPassword} className="text-sm text-[#6d6eff] my-4 cursor-pointer hover:underline" >
            Mot de passe oublié ?
            </p>
        </div>
    );
};

export default Forget_Password;