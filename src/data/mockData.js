export const mockDashboardData = {
  stats: {
    videosInProgress: 12,
    tasksToday: 8,
    monthlyViews: '3.2M',
    monthlyRevenue: '$2,840'
  },
  recentActivity: [
    {
      id: 1,
      type: 'video',
      icon: '🎬',
      message: 'Видео "Обзор iPhone 17" перешло на этап монтажа',
      time: '2 часа назад',
      user: 'Алексей Монтажер'
    },
    {
      id: 2,
      type: 'analytics',
      icon: '📊',
      message: 'Новый рекорд: 100K просмотров за 24 часа',
      time: '5 часов назад',
      user: 'Система'
    },
    {
      id: 3,
      type: 'task',
      icon: '✅',
      message: 'Задача "Дизайн обложки" завершена',
      time: 'Вчера',
      user: 'Мария Дизайнер'
    }
  ]
};