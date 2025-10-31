import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MockGoogleAuth from '../components/Auth/MockGoogleAuth';
import './Login.css';

const Login = () => {
  const { login, loading } = useAuth();
  const [error, setError] = useState('');

  const handleLoginSuccess = async (googleToken) => {
    try {
      setError('');
      await login(googleToken);
    } catch (err) {
      setError('Ошибка входа. Попробуйте еще раз.');
      console.error('Login error:', err);
    }
  };

  const handleLoginError = (error) => {
    setError('Ошибка авторизации: ' + error.message);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">ROLLIKI</div>
          <h1>Добро пожаловать</h1>
          <p>Система управления видеопроизводством</p>
        </div>

        <div className="login-content">
          <div className="demo-notice">
            <div className="demo-badge">DEMO MODE</div>
            <p>Бэкенд временно не доступен. Используется mock-авторизация.</p>
          </div>

          <MockGoogleAuth
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            loading={loading}
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="login-features">
            <h3>Возможности системы:</h3>
            <ul>
              <li>🎬 Визуальный конвейер производства видео</li>
              <li>📊 Аналитика YouTube канала</li>
              <li>👥 Управление командой и ролями</li>
              <li>💰 Финансовый учет и выплаты</li>
              <li>💡 AI-генератор идей для видео</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;