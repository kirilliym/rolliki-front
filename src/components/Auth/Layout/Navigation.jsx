import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Дашборд', icon: '📊' },
    { path: '/pipeline', label: 'Конвейер', icon: '⚙️' },
    { path: '/analytics', label: 'Статистика', icon: '📈' },
    { path: '/team', label: 'Команда', icon: '👥' },
    { path: '/settings', label: 'Настройки', icon: '⚙️' },
    { path: '/ideas', label: 'Генератор идей', icon: '💡', premium: true }
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-content">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.premium && <span className="premium-badge">PREMIUM</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;