import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = ({ user }) => {
  const { logout } = useAuth();

  return (
    <header className="main-header">
      <div className="header-content">
        <div className="logo">ROLLIKI</div>
        
        <div className="header-actions">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="user-name">{user?.name}</span>
          </div>
          
          <button onClick={logout} className="logout-btn">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;