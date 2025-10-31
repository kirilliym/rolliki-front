class MockAuthService {
  constructor() {
    this.users = this.loadUsers();
    this.currentUser = null;
  }

  loadUsers() {
    const stored = localStorage.getItem('mock_users');
    if (stored) {
      return JSON.parse(stored);
    }

    const demoUsers = [
      {
        id: 1,
        email: 'demo@rolliki.com',
        name: 'Иван Петров',
        avatar: 'ИП',
        role: 'owner',
        channel: 'ROLLIKI Channel'
      },
      {
        id: 2,
        email: 'editor@rolliki.com',
        name: 'Алексей Монтажер',
        avatar: 'АМ',
        role: 'editor',
        channel: 'ROLLIKI Channel'
      }
    ];

    localStorage.setItem('mock_users', JSON.stringify(demoUsers));
    return demoUsers;
  }

  async googleLogin(googleToken) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.users[0];
    this.currentUser = user;

    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('auth_token', 'mock_jwt_token_' + Date.now());

    return {
      user,
      accessToken: 'mock_jwt_token_' + Date.now()
    };
  }

  async validateToken(token) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const storedUser = localStorage.getItem('current_user');
    if (storedUser && token) {
      this.currentUser = JSON.parse(storedUser);
      return this.currentUser;
    }
    return null;
  }

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

export const mockAuthService = new MockAuthService();