// src/components/Auth/GoogleAuth.jsx
import React, { useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import './GoogleAuth.css';

const GoogleAuth = ({ onSuccess, onError, buttonText = "Войти через Google" }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const initializeGoogleAuth = () => {
      authService.initGoogleAuth(onSuccess, onError);
      
      // Рендерим кнопку Google
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            width: 300,
          }
        );
      }
    };

    if (document.readyState === 'complete') {
      initializeGoogleAuth();
    } else {
      window.addEventListener('load', initializeGoogleAuth);
    }

    return () => {
      window.removeEventListener('load', initializeGoogleAuth);
    };
  }, [onSuccess, onError]);

  return (
    <div className="google-auth-container">
      <div ref={googleButtonRef} className="google-auth-button"></div>
    </div>
  );
};

export default GoogleAuth;  