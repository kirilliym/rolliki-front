import React, { useState, createContext, useContext, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Создаем контекст
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Провайдер авторизации
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Проверяем сохраненного пользователя при загрузке
    const savedUser = localStorage.getItem('rolliki_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = () => {
    const userData = {
      name: 'Иван Петров',
      email: 'demo@rolliki.com',
      avatar: 'ИП',
      id: 1
    }
    setUser(userData)
    localStorage.setItem('rolliki_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rolliki_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Защищенный маршрут
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

// Страница логина
const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    login()
    navigate('/') // Явный переход на главную
    setLoading(false)
  }

  return (
    <div style={{
      background: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial'
    }}>
      <div style={{
        background: '#2d2d2d',
        padding: '40px',
        borderRadius: '10px',
        border: '1px solid #404040',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#c62828', marginBottom: '10px' }}>ROLLIKI</h1>
        <p style={{ color: '#aaa', marginBottom: '30px' }}>Вход в систему</p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            background: loading ? '#666' : '#4285f4',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Вход...' : 'Войти через Google (Demo)'}
        </button>

        <div style={{ marginTop: '20px', color: '#777', fontSize: '14px' }}>
          Демо-режим • Mock авторизация
        </div>
      </div>
    </div>
  )
}

// Главная страница
const DashboardPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div style={{
      background: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '1px solid #404040',
        paddingBottom: '20px'
      }}>
        <h1 style={{ color: '#c62828', margin: 0 }}>ROLLIKI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#c62828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {user.avatar}
          </div>
          <span>{user.name}</span>
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #404040',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <div style={{ textAlign: 'center' }}>
        <h2>🎉 Добро пожаловать в ROLLIKI!</h2>
        <p style={{ color: '#aaa' }}>Система управления видеопроизводством</p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          maxWidth: '500px',
          margin: '40px auto'
        }}>
          <div style={{
            background: '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #404040'
          }}>
            <div style={{ fontSize: '2rem', color: '#c62828' }}>125K</div>
            <div style={{ color: '#aaa' }}>Подписчики</div>
          </div>
          <div style={{
            background: '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #404040'
          }}>
            <div style={{ fontSize: '2rem', color: '#c62828' }}>48</div>
            <div style={{ color: '#aaa' }}>Видео</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Главный App компонент
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App