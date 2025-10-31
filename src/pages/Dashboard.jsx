import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';
import Navigation from '../components/Layout/Navigation';
import { mockDashboardData } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, recentActivity } = mockDashboardData;

  return (
    <div className="dashboard">
      <Header user={user} />
      <Navigation />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Добро пожаловать в ROLLIKI, {user?.name}!</h1>
          <p>Управляйте вашим видеопроизводством эффективно</p>
          <div className="demo-indicator">
            🔄 Работа в demo-режиме. Данные обновляются локально.
          </div>
        </div>

        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value">{stats.videosInProgress}</div>
            <div className="stat-label">Видео в работе</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.tasksToday}</div>
            <div className="stat-label">Задачи сегодня</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.monthlyViews}</div>
            <div className="stat-label">Просмотров за месяц</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.monthlyRevenue}</div>
            <div className="stat-label">Доход за месяц</div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Последняя активность</h2>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <div className="activity-meta">
                    <span className="activity-time">{activity.time}</span>
                    {activity.user && (
                      <span className="activity-user">• {activity.user}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;