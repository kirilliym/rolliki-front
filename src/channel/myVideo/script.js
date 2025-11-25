class MyVideosPage {
    constructor() {
        this.videosGrid = document.getElementById('videosGrid');
        this.init();
    }
    
    init() {
        this.loadVideos();
    }
    
    loadVideos() {
        const mockVideos = [
            {
                id: 1,
                title: 'Как стать успешным блогером в 2024 году',
                createdDate: '2024-01-15',
                deadline: '2024-01-20',
                status: 'completed'
            },
            {
                id: 2,
                title: 'Обзор новых технологий для видеографов',
                createdDate: '2024-01-12',
                deadline: '2024-01-18',
                status: 'completed'
            },
            {
                id: 3,
                title: 'Секреты монтажа от профессионалов',
                createdDate: '2024-01-20',
                deadline: '2024-01-27',
                status: 'in_progress'
            },
            {
                id: 4,
                title: 'Интервью с известным видеоблогером',
                createdDate: '2024-01-05',
                deadline: '2024-01-12',
                status: 'completed'
            },
            {
                id: 5,
                title: 'Новый формат контента',
                createdDate: '2024-02-01',
                deadline: '2024-02-10',
                status: 'in_progress'
            },
            {
                id: 6,
                title: 'Анализ трендов YouTube 2024',
                createdDate: '2024-01-25',
                deadline: '2024-02-05',
                status: 'in_progress'
            }
        ];
        
        this.displayVideos(mockVideos);
    }
    
    displayVideos(videos) {
        this.videosGrid.innerHTML = videos.map(video => `
            <div class="video-card" onclick="myVideosPage.openVideo(${video.id})">
                <div class="video-thumbnail ${video.status}">
                    ${this.getVideoIcon(video.status)}
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-dates">
                        <div class="date-item">
                            <span class="date-label">Создано:</span>
                            <span class="date-value">${new Date(video.createdDate).toLocaleDateString()}</span>
                        </div>
                        <div class="date-item">
                            <span class="date-label">Дедлайн:</span>
                            <span class="date-value">${new Date(video.deadline).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="video-status ${video.status}">
                        ${this.getStatusText(video.status)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getVideoIcon(status) {
        const icons = {
            'completed': '✅',
            'in_progress': '⚡'
        };
        return icons[status] || '🎬';
    }
    
    getStatusText(status) {
        const statusTexts = {
            'completed': 'Завершено',
            'in_progress': 'В процессе'
        };
        return statusTexts[status] || 'Неизвестно';
    }
    
    openVideo(videoId) {
        // Здесь будет переход на страницу редактирования видео
        alert(`Открываем видео #${videoId}`);
    }
}

// Глобальные функции
function openUploadModal() {
    alert('Открываем модальное окно загрузки видео');
}

// Инициализация при загрузке страницы
let myVideosPage;
document.addEventListener('DOMContentLoaded', () => {
    myVideosPage = new MyVideosPage();
});