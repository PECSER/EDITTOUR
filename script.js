// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    ADMIN_PASSWORD: 'admin123',
    ADMINS: ['Boss', 'Admin', 'DemoUser'],
    MAX_DAILY_VOTES: 10,
    VOTE_REWARD: 15, // Опыт за голос
    LEVEL_UP_REWARD: 100, // Коины за уровень
    EXP_PER_LEVEL: 100, // Опыта для уровня
    TELEGRAM_BOT_TOKEN: '8370576423:AAFcuKWE7spALSwvPhIt1Eig3iqd0Botjg8',
    TELEGRAM_BOT_NAME: 'editour_bot',
    KING_REWARD: 50, // Ежедневная награда царя
    DEFAULT_TOURNAMENT_IMAGES: [
        'https://via.placeholder.com/400x200/8a2be2/ffffff?text=TikTok+Tournament',
        'https://via.placeholder.com/400x200/00ffcc/000000?text=Edit+Battle',
        'https://via.placeholder.com/400x200/ff3366/ffffff?text=Video+Contest',
        'https://via.placeholder.com/400x200/ffcc00/000000?text=Creative+Challenge'
    ]
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('EDITTOUR: Инициализация приложения');
    initData();
    initStars();
    setupEventListeners();
    updateUI();
    
    initTelegramAuth();
    initInfiniteTournament();
});

// ===== TELEGRAM ИНТЕГРАЦИЯ =====
function initTelegramAuth() {
    if (window.Telegram && Telegram.WebApp) {
        console.log('Telegram Web App обнаружен');
        const tg = window.Telegram.WebApp;
        
        tg.expand();
        tg.enableClosingConfirmation();
        
        const user = tg.initDataUnsafe.user;
        
        if (user) {
            console.log('Пользователь Telegram:', user);
            const users = getUsers();
            const username = user.username || `user_${user.id}`;
            
            if (!users[username]) {
                users[username] = {
                    username: username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    telegramId: user.id,
                    level: 1,
                    exp: 0,
                    coins: 100,
                    tournamentsPlayed: 0,
                    wins: 0,
                    bestResult: null,
                    totalVotes: 0,
                    votesEarned: 0,
                    dailyVotes: 0,
                    lastVoteDate: new Date().toISOString().split('T')[0],
                    isTelegramUser: true,
                    joinDate: new Date().toISOString(),
                    kingWins: 0,
                    totalKingTime: 0
                };
                localStorage.setItem('editourUsers', JSON.stringify(users));
                console.log('Создан новый пользователь Telegram:', username);
                
                // Добавляем нового пользователя в демо-турниры
                addNewUserToDemoTournaments(username);
            }
            
            localStorage.setItem('currentUser', username);
            updateUI();
            showNotification(`Добро пожаловать, ${user.first_name || username}!`, 'success');
        }
    } else {
        console.log('Telegram Web App не обнаружен, работаем в браузере');
    }
}

function setupTelegramLogin() {
    // Проверяем, находимся ли мы уже в Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        showNotification('Вы уже в Telegram!', 'info');
        return;
    }
    
    // Создаем правильную ссылку для авторизации
    const botName = CONFIG.TELEGRAM_BOT_NAME;
    const authUrl = `https://t.me/${botName}?start=webapp`;
    
    // Пытаемся открыть в том же окне для мобильных устройств
    try {
        window.location.href = authUrl;
    } catch (e) {
        window.open(authUrl, '_blank');
    }
    
    showNotification('Открывается Telegram...', 'info');
}

// ===== СИСТЕМА ДАННЫХ =====
function initData() {
    console.log('Инициализация данных...');
    
    if (!localStorage.getItem('editourUsers')) {
        console.log('Создание демо пользователей...');
        const demoUsers = {
            'DemoUser': {
                username: 'DemoUser',
                level: 1,
                exp: 30,
                coins: 100,
                tournamentsPlayed: 5,
                wins: 3,
                bestResult: 1,
                totalVotes: 12,
                votesEarned: 120,
                dailyVotes: 0,
                lastVoteDate: new Date().toISOString().split('T')[0],
                kingWins: 2,
                totalKingTime: 86400000 // 1 день в миллисекундах
            },
            'Boss': {
                username: 'Boss',
                level: 10,
                exp: 450,
                coins: 5000,
                tournamentsPlayed: 25,
                wins: 18,
                bestResult: 1,
                totalVotes: 89,
                votesEarned: 890,
                dailyVotes: 0,
                lastVoteDate: new Date().toISOString().split('T')[0],
                kingWins: 5,
                totalKingTime: 259200000 // 3 дня
            },
            'EditorPro': {
                username: 'EditorPro',
                level: 3,
                exp: 150,
                coins: 500,
                tournamentsPlayed: 12,
                wins: 8,
                bestResult: 1,
                totalVotes: 25,
                votesEarned: 250,
                kingWins: 1,
                totalKingTime: 43200000 // 12 часов
            },
            'CutMaster': {
                username: 'CutMaster',
                level: 2,
                exp: 80,
                coins: 300,
                tournamentsPlayed: 8,
                wins: 4,
                bestResult: 2,
                totalVotes: 18,
                votesEarned: 180,
                kingWins: 0,
                totalKingTime: 0
            }
        };
        localStorage.setItem('editourUsers', JSON.stringify(demoUsers));
        localStorage.setItem('currentUser', 'DemoUser');
        console.log('Демо пользователи созданы');
    }

    if (!localStorage.getItem('editourTournaments')) {
        console.log('Создание демо турниров...');
        const tournaments = [
            {
                id: 1,
                name: 'Турнир новичков',
                description: 'Идеальный старт для новых эдиторов. Покажи свои базовые навыки монтажа!',
                prize: 500,
                maxParticipants: 8,
                participants: ['DemoUser', 'EditorPro', 'CutMaster'],
                status: 'active',
                created: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                bracket: [
                    {
                        matchId: 1,
                        player1: 'DemoUser',
                        player2: 'EditorPro',
                        winner: null,
                        round: 1,
                        edits: {
                            'DemoUser': { id: 1, votes: 8 },
                            'EditorPro': { id: 2, votes: 12 }
                        }
                    },
                    {
                        matchId: 2,
                        player1: 'CutMaster',
                        player2: null,
                        winner: 'CutMaster',
                        round: 1,
                        edits: {
                            'CutMaster': { id: 3, votes: 5 }
                        }
                    }
                ],
                currentRound: 1,
                image: CONFIG.DEFAULT_TOURNAMENT_IMAGES[0]
            },
            {
                id: 2,
                name: 'Битва переходов',
                description: 'Турнир на лучшие переходы в TikTok. Креативность и плавность - ключ к победе!',
                prize: 800,
                maxParticipants: 16,
                participants: ['DemoUser'],
                status: 'upcoming',
                created: new Date().toISOString(),
                startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                bracket: [],
                currentRound: 1,
                image: CONFIG.DEFAULT_TOURNAMENT_IMAGES[1]
            },
            {
                id: 3,
                name: 'Элитный чемпионат',
                description: 'Только для лучших эдиторов. Призовой фонд 2000 коинов!',
                prize: 2000,
                maxParticipants: 32,
                participants: ['Boss', 'EditorPro'],
                status: 'active',
                created: new Date().toISOString(),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                bracket: [
                    {
                        matchId: 1,
                        player1: 'Boss',
                        player2: 'EditorPro',
                        winner: null,
                        round: 1,
                        edits: {
                            'Boss': { id: 4, votes: 15 },
                            'EditorPro': { id: 5, votes: 10 }
                        }
                    }
                ],
                currentRound: 1,
                image: CONFIG.DEFAULT_TOURNAMENT_IMAGES[2]
            }
        ];
        localStorage.setItem('editourTournaments', JSON.stringify(tournaments));
        console.log('Демо турниры созданы');
    }

    if (!localStorage.getItem('editourSubmissions')) {
        console.log('Создание демо заявок...');
        const submissions = [
            {
                id: 1,
                username: 'DemoUser',
                tournamentId: 2,
                tournamentName: 'Битва переходов',
                editLink: 'https://tiktok.com/@demouser/video/111',
                status: 'pending',
                date: new Date().toISOString()
            }
        ];
        localStorage.setItem('editourSubmissions', JSON.stringify(submissions));
        console.log('Демо заявки созданы');
    }

    if (!localStorage.getItem('editourApprovedEdits')) {
        console.log('Создание демо одобренных эдитов...');
        const approvedEdits = [
            { 
                id: 1, 
                username: 'DemoUser', 
                tournamentId: 1, 
                editLink: 'https://tiktok.com/@demouser/video/123', 
                votes: 8,
                title: 'Мой первый эдит',
                tournamentName: 'Турнир новичков'
            },
            { 
                id: 2, 
                username: 'EditorPro', 
                tournamentId: 1, 
                editLink: 'https://tiktok.com/@editorpro/video/456', 
                votes: 12,
                title: 'Профессиональный монтаж',
                tournamentName: 'Турнир новичков'
            },
            { 
                id: 3, 
                username: 'CutMaster', 
                tournamentId: 1, 
                editLink: 'https://tiktok.com/@cutmaster/video/789', 
                votes: 5,
                title: 'Резкие переходы',
                tournamentName: 'Турнир новичков'
            },
            { 
                id: 4, 
                username: 'Boss', 
                tournamentId: 3, 
                editLink: 'https://tiktok.com/@boss/video/101', 
                votes: 15,
                title: 'Босс монтажа',
                tournamentName: 'Элитный чемпионат'
            },
            { 
                id: 5, 
                username: 'EditorPro', 
                tournamentId: 3, 
                editLink: 'https://tiktok.com/@editorpro/video/112', 
                votes: 10,
                title: 'Элитный эдит',
                tournamentName: 'Элитный чемпионат'
            }
        ];
        localStorage.setItem('editourApprovedEdits', JSON.stringify(approvedEdits));
        console.log('Демо одобренные эдиты созданы');
    }

    if (!localStorage.getItem('editourVotes')) {
        localStorage.setItem('editourVotes', JSON.stringify({}));
        console.log('Система голосов инициализирована');
    }

    if (!localStorage.getItem('editourKing')) {
        const kingData = {
            currentKing: 'Boss',
            kingSince: new Date(Date.now() - 86400000).toISOString(), // 1 день назад
            defenseCount: 3,
            totalReigns: 5,
            challenges: []
        };
        localStorage.setItem('editourKing', JSON.stringify(kingData));
        console.log('Система Царя горы инициализирована');
    }

    resetDailyVotes();
    updateKingRewards();
    console.log('Инициализация данных завершена');
}

// Функция для добавления новых пользователей в демо-турниры
function addNewUserToDemoTournaments(username) {
    const tournaments = getTournaments();
    let updated = false;
    
    tournaments.forEach(tournament => {
        if (tournament.status === 'upcoming' && 
            tournament.participants.length < tournament.maxParticipants &&
            !tournament.participants.includes(username)) {
            
            tournament.participants.push(username);
            updated = true;
        }
    });
    
    if (updated) {
        updateTournaments(tournaments);
        console.log(`Пользователь ${username} добавлен в демо-турниры`);
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem('editourUsers')) || {};
}

function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;
    
    const users = getUsers();
    return users[currentUser] || null;
}

function updateUser(user) {
    const users = getUsers();
    users[user.username] = user;
    localStorage.setItem('editourUsers', JSON.stringify(users));
    updateUI();
}

function getTournaments() {
    return JSON.parse(localStorage.getItem('editourTournaments')) || [];
}

function updateTournaments(tournaments) {
    localStorage.setItem('editourTournaments', JSON.stringify(tournaments));
}

function getSubmissions() {
    return JSON.parse(localStorage.getItem('editourSubmissions')) || [];
}

function updateSubmissions(submissions) {
    localStorage.setItem('editourSubmissions', JSON.stringify(submissions));
}

function getApprovedEdits() {
    return JSON.parse(localStorage.getItem('editourApprovedEdits')) || [];
}

function updateApprovedEdits(edits) {
    localStorage.setItem('editourApprovedEdits', JSON.stringify(edits));
}

function getVotes() {
    return JSON.parse(localStorage.getItem('editourVotes')) || {};
}

function updateVotes(votes) {
    localStorage.setItem('editourVotes', JSON.stringify(votes));
}

function getKingData() {
    return JSON.parse(localStorage.getItem('editourKing')) || {
        currentKing: null,
        kingSince: null,
        defenseCount: 0,
        totalReigns: 0,
        challenges: []
    };
}

function updateKingData(kingData) {
    localStorage.setItem('editourKing', JSON.stringify(kingData));
}

// ===== СИСТЕМА ЦАРЯ ГОРЫ =====
function initInfiniteTournament() {
    const tournaments = getTournaments();
    const infiniteTournament = tournaments.find(t => t.id === 'infinite');
    
    if (!infiniteTournament) {
        const kingData = getKingData();
        const newInfiniteTournament = {
            id: 'infinite',
            name: 'Царь горы',
            description: 'Бесконечный турнир! Побеждай и удерживай трон как можно дольше. Текущий царь получает ежедневную награду.',
            prize: CONFIG.KING_REWARD,
            maxParticipants: 1000,
            participants: kingData.currentKing ? [kingData.currentKing] : [],
            status: 'infinite',
            created: new Date().toISOString(),
            bracket: [],
            currentRound: 1,
            image: 'https://via.placeholder.com/400x200/FFD700/000000?text=Царь+Горы',
            isInfinite: true
        };
        
        tournaments.push(newInfiniteTournament);
        updateTournaments(tournaments);
        console.log('Бесконечный турнир "Царь горы" создан');
    }
    
    updateKingUI();
}

function updateKingUI() {
    const kingData = getKingData();
    const currentUser = getCurrentUser();
    
    // Обновляем информацию в профиле
    const kingAvatar = document.getElementById('current-king-avatar');
    const kingName = document.getElementById('current-king-name');
    const kingReignTime = document.getElementById('king-reign-time');
    const kingDefenseCount = document.getElementById('king-defense-count');
    const challengeBtn = document.getElementById('challenge-king-btn');
    
    if (kingData.currentKing) {
        kingAvatar.textContent = kingData.currentKing.substring(0, 2).toUpperCase();
        kingName.textContent = kingData.currentKing;
        
        const reignTime = new Date() - new Date(kingData.kingSince);
        const days = Math.floor(reignTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((reignTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        kingReignTime.textContent = `Правит ${days}д ${hours}ч`;
        kingDefenseCount.textContent = `${kingData.defenseCount} защит`;
        
        // Активируем кнопку вызова, если пользователь не текущий царь
        if (currentUser && currentUser.username !== kingData.currentKing) {
            challengeBtn.disabled = false;
            challengeBtn.innerHTML = '<i class="fas fa-fist-raised"></i> Бросить вызов';
        } else {
            challengeBtn.disabled = true;
            challengeBtn.innerHTML = '<i class="fas fa-crown"></i> Вы Царь!';
        }
    } else {
        kingAvatar.innerHTML = '<i class="fas fa-crown"></i>';
        kingName.textContent = 'Трон свободен';
        kingReignTime.textContent = 'Стань первым Царем горы!';
        kingDefenseCount.textContent = '0 защит';
        
        if (currentUser) {
            challengeBtn.disabled = false;
            challengeBtn.innerHTML = '<i class="fas fa-crown"></i> Захватить трон';
        }
    }
}

function updateKingRewards() {
    const kingData = getKingData();
    const users = getUsers();
    
    if (kingData.currentKing && kingData.kingSince) {
        const lastRewardDate = localStorage.getItem('lastKingRewardDate');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastRewardDate !== today) {
            const kingUser = users[kingData.currentKing];
            if (kingUser) {
                kingUser.coins += CONFIG.KING_REWARD;
                kingUser.kingWins = (kingUser.kingWins || 0) + 1;
                updateUser(kingUser);
                
                localStorage.setItem('lastKingRewardDate', today);
                showNotification(`🎉 ${kingData.currentKing} получает ${CONFIG.KING_REWARD} коинов как Царь горы!`, 'success');
            }
        }
    }
}

function challengeKing() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Войдите в систему для участия!', 'error');
        return;
    }
    
    const kingData = getKingData();
    
    if (kingData.currentKing && currentUser.username === kingData.currentKing) {
        showNotification('Вы уже Царь горы!', 'info');
        return;
    }
    
    // Создаем модальное окно для вызова
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <h3>Бросить вызов Царю горы</h3>
            <div class="challenge-info">
                ${kingData.currentKing ? `
                    <p>Вы бросаете вызов текущему Царю: <strong>${kingData.currentKing}</strong></p>
                    <p>Приз: <strong>${CONFIG.KING_REWARD} коинов</strong> ежедневно + слава!</p>
                ` : `
                    <p>Трон Царя горы свободен! Станьте первым правителем.</p>
                    <p>Приз: <strong>${CONFIG.KING_REWARD} коинов</strong> ежедневно!</p>
                `}
            </div>
            <div class="form-group">
                <label class="form-label">Ссылка на ваш эдит</label>
                <input type="text" class="form-input" id="challenge-edit-link" placeholder="https://tiktok.com/...">
            </div>
            <button class="btn btn-warning" id="submit-challenge-btn">
                <i class="fas fa-fist-raised"></i> Бросить вызов
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#submit-challenge-btn').addEventListener('click', () => {
        const editLink = document.getElementById('challenge-edit-link').value;
        if (!editLink) {
            showNotification('Введите ссылку на ваш эдит!', 'error');
            return;
        }
        
        submitKingChallenge(editLink);
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function submitKingChallenge(editLink) {
    const currentUser = getCurrentUser();
    const kingData = getKingData();
    
    // Добавляем вызов в историю
    kingData.challenges.unshift({
        challenger: currentUser.username,
        editLink: editLink,
        date: new Date().toISOString(),
        status: 'pending'
    });
    
    // Ограничиваем историю последними 10 вызовами
    kingData.challenges = kingData.challenges.slice(0, 10);
    
    updateKingData(kingData);
    
    if (kingData.currentKing) {
        showNotification(`Вызов ${kingData.currentKing} отправлен! Ожидайте голосования.`, 'success');
    } else {
        // Если трон свободен, сразу становимся царем
        becomeKing(currentUser.username);
    }
}

function becomeKing(newKing) {
    const kingData = getKingData();
    const users = getUsers();
    const oldKing = kingData.currentKing;
    
    // Награждаем старого царя
    if (oldKing) {
        const oldKingUser = users[oldKing];
        if (oldKingUser) {
            const reignTime = new Date() - new Date(kingData.kingSince);
            oldKingUser.totalKingTime = (oldKingUser.totalKingTime || 0) + reignTime;
            updateUser(oldKingUser);
        }
    }
    
    // Устанавливаем нового царя
    kingData.currentKing = newKing;
    kingData.kingSince = new Date().toISOString();
    kingData.defenseCount = 0;
    kingData.totalReigns = (kingData.totalReigns || 0) + 1;
    
    // Обновляем статистику нового царя
    const newKingUser = users[newKing];
    if (newKingUser) {
        newKingUser.kingWins = (newKingUser.kingWins || 0) + 1;
        updateUser(newKingUser);
    }
    
    updateKingData(kingData);
    
    // Обновляем турнир "Царь горы"
    const tournaments = getTournaments();
    const infiniteTournament = tournaments.find(t => t.id === 'infinite');
    if (infiniteTournament) {
        infiniteTournament.participants = [newKing];
        updateTournaments(tournaments);
    }
    
    showNotification(`🎉 ${newKing} становится новым Царем горы!`, 'success');
    updateKingUI();
    renderTournaments();
}

// ===== СИСТЕМА ГОЛОСОВАНИЯ =====
function resetDailyVotes() {
    const user = getCurrentUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (user.lastVoteDate !== today) {
        user.dailyVotes = 0;
        user.lastVoteDate = today;
        updateUser(user);
        console.log('Дневные голоса сброшены для пользователя:', user.username);
    }
}

function getRandomVotingPair() {
    const tournaments = getTournaments().filter(t => t.status === 'active' && t.bracket && t.bracket.length > 0);
    const user = getCurrentUser();
    if (!user) return null;
    
    const userVotes = getVotes()[user.username] || [];
    
    // Собираем все доступные матчи из активных турниров
    const availableMatches = [];
    
    tournaments.forEach(tournament => {
        tournament.bracket.forEach(match => {
            // Проверяем, что матч активен (нет победителя) и оба игрока сдали эдиты
            if (!match.winner && match.player1 && match.player2 && 
                match.edits[match.player1] && match.edits[match.player2]) {
                
                const voteKey = `match_${match.matchId}_tournament_${tournament.id}`;
                if (!userVotes.includes(voteKey)) {
                    availableMatches.push({
                        tournament: tournament,
                        match: match
                    });
                }
            }
        });
    });
    
    if (availableMatches.length === 0) {
        return null;
    }
    
    // Выбираем случайный матч
    const randomMatch = availableMatches[Math.floor(Math.random() * availableMatches.length)];
    
    // Получаем данные эдитов
    const approvedEdits = getApprovedEdits();
    const edit1 = approvedEdits.find(e => e.id === randomMatch.match.edits[randomMatch.match.player1].id);
    const edit2 = approvedEdits.find(e => e.id === randomMatch.match.edits[randomMatch.match.player2].id);
    
    if (!edit1 || !edit2) return null;
    
    return {
        tournament: randomMatch.tournament,
        match: randomMatch.match,
        edits: [edit1, edit2]
    };
}

// Функция для извлечения ID видео TikTok
function extractTikTokVideoId(url) {
    const match = url.match(/\/(\d+)(?:\?|$)/);
    return match ? match[1] : null;
}

// Функция для открытия модального окна с видео
function openVideoModal(videoUrl, username) {
    const modal = document.getElementById('video-modal');
    const videoContainer = document.getElementById('video-container');
    const videoTitle = document.getElementById('video-modal-title');
    const externalLink = document.getElementById('video-external-link');
    
    videoTitle.textContent = `Эдит от ${username}`;
    externalLink.href = videoUrl;
    
    // Создаем iframe для видео
    const isTikTok = videoUrl.includes('tiktok.com');
    
    if (isTikTok) {
        const videoId = extractTikTokVideoId(videoUrl);
        if (videoId) {
            videoContainer.innerHTML = `
                <iframe 
                    src="https://www.tiktok.com/embed/v2/${videoId}"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            `;
        } else {
            videoContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;"></i>
                    <p>Не удалось загрузить видео</p>
                    <a href="${videoUrl}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> Открыть в TikTok
                    </a>
                </div>
            `;
        }
    } else {
        videoContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-play-circle" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
                <p>Видео недоступно для предпросмотра</p>
                <a href="${videoUrl}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Открыть видео
                </a>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

function voteForEdit(editId, tournamentId, matchId) {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Войдите в систему для голосования!', 'error');
        return;
    }
    
    if (user.dailyVotes >= CONFIG.MAX_DAILY_VOTES) {
        showNotification(`Достигнут дневной лимит голосов (${CONFIG.MAX_DAILY_VOTES})!`, 'error');
        return;
    }
    
    const votes = getVotes();
    if (!votes[user.username]) {
        votes[user.username] = [];
    }
    
    const voteKey = `match_${matchId}_tournament_${tournamentId}`;
    if (votes[user.username].includes(voteKey)) {
        showNotification('Вы уже голосовали в этом матче!', 'error');
        return;
    }
    
    // Добавляем голос
    votes[user.username].push(voteKey);
    updateVotes(votes);
    
    // Обновляем счетчик голосов у эдита
    const approvedEdits = getApprovedEdits();
    const edit = approvedEdits.find(e => e.id === editId);
    if (edit) {
        edit.votes = (edit.votes || 0) + 1;
        updateApprovedEdits(approvedEdits);
    }
    
    // Обновляем счетчик в турнирной сетке
    const tournaments = getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
        const match = tournament.bracket.find(m => m.matchId === matchId);
        if (match && match.edits[edit.username]) {
            match.edits[edit.username].votes = (match.edits[edit.username].votes || 0) + 1;
            updateTournaments(tournaments);
        }
    }
    
    // НАГРАДА: Опыт вместо коинов
    user.dailyVotes += 1;
    user.totalVotes = (user.totalVotes || 0) + 1;
    
    const oldLevel = user.level;
    user.exp += CONFIG.VOTE_REWARD;
    
    // Проверяем повышение уровня
    if (user.exp >= CONFIG.EXP_PER_LEVEL) {
        const levelsGained = Math.floor(user.exp / CONFIG.EXP_PER_LEVEL);
        user.level += levelsGained;
        user.exp = user.exp % CONFIG.EXP_PER_LEVEL;
        const coinsReward = CONFIG.LEVEL_UP_REWARD * levelsGained;
        user.coins += coinsReward;
        
        showNotification(`🎉 Уровень повышен! Теперь у вас ${user.level} уровень! +${coinsReward} коинов`, 'success');
    }
    
    updateUser(user);
    showNotification(`Спасибо за ваш голос! +${CONFIG.VOTE_REWARD} опыта`, 'success');
    
    // Показываем следующую пару
    showNextVotingPair();
}

function showNextVotingPair() {
    console.log('Показ следующей пары для голосования...');
    const pairData = getRandomVotingPair();
    const currentPair = document.getElementById('current-pair');
    const votingComplete = document.getElementById('voting-complete');
    const remainingPairs = document.getElementById('remaining-pairs');
    const votesToday = document.getElementById('votes-today');
    
    const user = getCurrentUser();
    if (!user) {
        currentPair.style.display = 'none';
        votingComplete.style.display = 'block';
        votingComplete.querySelector('p').textContent = 'Войдите в систему для голосования';
        return;
    }
    
    const votes = getVotes();
    const userVotes = votes[user.username] || [];
    const remainingCount = CONFIG.MAX_DAILY_VOTES - (user.dailyVotes || 0);
    
    remainingPairs.textContent = remainingCount > 0 ? remainingCount : 0;
    votesToday.textContent = `${user.dailyVotes || 0}/${CONFIG.MAX_DAILY_VOTES}`;
    
    if (!pairData || user.dailyVotes >= CONFIG.MAX_DAILY_VOTES) {
        currentPair.style.display = 'none';
        votingComplete.style.display = 'block';
        console.log('Голосование завершено или достигнут лимит');
        return;
    }
    
    console.log('Показываем пару для голосования:', pairData);
    
    // Функция для создания превью видео
    function createVideoPreview(edit, index) {
        return `
            <div class="vote-preview" onclick="openVideoModal('${edit.editLink}', '${edit.username}')">
                <i class="fas fa-play-circle"></i>
                <div class="video-play-text">Смотреть эдит</div>
            </div>
        `;
    }
    
    currentPair.innerHTML = `
        <div class="voting-header">
            <h3>🏆 ${pairData.tournament.name}</h3>
            <p>Матч ${pairData.match.matchId} • Раунд ${pairData.match.round}</p>
            <div class="tournament-bracket-mini">
                <div class="bracket-match-mini">
                    <div class="player-mini ${pairData.match.winner === pairData.match.player1 ? 'winner' : ''}">
                        ${pairData.match.player1}
                    </div>
                    <div class="vs-mini">VS</div>
                    <div class="player-mini ${pairData.match.winner === pairData.match.player2 ? 'winner' : ''}">
                        ${pairData.match.player2}
                    </div>
                </div>
            </div>
        </div>
        <div class="vote-option" data-id="${pairData.edits[0].id}">
            <div class="vote-user">${pairData.edits[0].username}</div>
            ${createVideoPreview(pairData.edits[0], 0)}
            <div class="vote-stats">
                <i class="fas fa-fire"></i> ${pairData.edits[0].votes || 0} голосов
            </div>
            <button class="btn btn-primary vote-btn">
                <i class="fas fa-vote-yea"></i> Голосовать
            </button>
        </div>
        <div class="vote-option" data-id="${pairData.edits[1].id}">
            <div class="vote-user">${pairData.edits[1].username}</div>
            ${createVideoPreview(pairData.edits[1], 1)}
            <div class="vote-stats">
                <i class="fas fa-fire"></i> ${pairData.edits[1].votes || 0} голосов
            </div>
            <button class="btn btn-primary vote-btn">
                <i class="fas fa-vote-yea"></i> Голосовать
            </button>
        </div>
    `;
    
    currentPair.style.display = 'flex';
    votingComplete.style.display = 'none';
    
    // Добавляем обработчики для кнопок голосования
    const voteButtons = currentPair.querySelectorAll('.vote-btn');
    voteButtons[0].addEventListener('click', () => {
        console.log('Голос за эдит:', pairData.edits[0].id);
        voteForEdit(pairData.edits[0].id, pairData.tournament.id, pairData.match.matchId);
    });
    voteButtons[1].addEventListener('click', () => {
        console.log('Голос за эдит:', pairData.edits[1].id);
        voteForEdit(pairData.edits[1].id, pairData.tournament.id, pairData.match.matchId);
    });
}

// ===== СИСТЕМА ТУРНИРОВ =====
function generateTournamentBracket(participants) {
    const bracket = [];
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
            bracket.push({
                matchId: i / 2 + 1,
                player1: shuffled[i],
                player2: shuffled[i + 1],
                winner: null,
                round: 1,
                edits: {
                    [shuffled[i]]: null,
                    [shuffled[i + 1]]: null
                }
            });
        } else {
            // Если нечетное количество, один игрок проходит автоматически
            bracket.push({
                matchId: i / 2 + 1,
                player1: shuffled[i],
                player2: null,
                winner: shuffled[i],
                round: 1,
                edits: {
                    [shuffled[i]]: null
                }
            });
        }
    }
    return bracket;
}

function renderTournamentBracket(tournament) {
    if (!tournament.bracket || tournament.bracket.length === 0) {
        return '<div class="empty-bracket">Турнирная сетка будет сгенерирована после начала турнира</div>';
    }
    
    let html = '<div class="tournament-bracket">';
    html += '<h4>Турнирная сетка</h4>';
    html += '<div class="bracket-rounds">';
    
    tournament.bracket.forEach(match => {
        const player1Edit = match.edits[match.player1];
        const player2Edit = match.edits[match.player2];
        
        html += `
            <div class="bracket-match">
                <div class="match-header">Матч ${match.matchId} • Раунд ${match.round}</div>
                <div class="match-players">
                    <div class="player ${match.winner === match.player1 ? 'winner' : ''}">
                        <div class="player-name">${match.player1}</div>
                        <div class="player-status">
                            ${player1Edit ? `✅ ${player1Edit.votes || 0} голосов` : '⏳ Ожидает эдит'}
                        </div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="player ${match.winner === match.player2 ? 'winner' : ''}">
                        <div class="player-name">${match.player2 || 'BYE'}</div>
                        <div class="player-status">
                            ${player2Edit ? `✅ ${player2Edit.votes || 0} голосов` : (match.player2 ? '⏳ Ожидает эдит' : '')}
                        </div>
                    </div>
                </div>
                ${match.winner ? `<div class="match-winner">🏆 Победитель: ${match.winner}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

function openTournamentModal(tournament) {
    console.log('Открытие модального окна турнира:', tournament.name);
    const modal = document.getElementById('tournament-modal');
    const user = getCurrentUser();
    
    if (!user) {
        showNotification('Войдите в систему для участия в турнире!', 'error');
        return;
    }
    
    document.getElementById('tournament-modal-title').textContent = tournament.name;
    document.getElementById('tournament-modal-description').textContent = tournament.description;
    document.getElementById('tournament-modal-participants').textContent = `${tournament.participants.length}/${tournament.maxParticipants}`;
    document.getElementById('tournament-modal-prize').textContent = tournament.prize;
    
    // Добавляем турнирную сетку
    const tournamentInfo = document.querySelector('.tournament-modal-info');
    let bracketContainer = tournamentInfo.querySelector('.tournament-bracket-container');
    
    if (!bracketContainer) {
        bracketContainer = document.createElement('div');
        bracketContainer.className = 'tournament-bracket-container';
        tournamentInfo.appendChild(bracketContainer);
    }
    
    bracketContainer.innerHTML = renderTournamentBracket(tournament);
    
    // Обновляем кнопку в зависимости от участия
    const submitBtn = document.getElementById('submit-edit-btn');
    const isParticipant = tournament.participants.includes(user.username);
    
    if (isParticipant) {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Вы уже участвуете';
        submitBtn.disabled = true;
        submitBtn.className = 'btn btn-outline';
        document.getElementById('edit-link').style.display = 'none';
        document.querySelector('label[for="edit-link"]').style.display = 'none';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить на проверку';
        submitBtn.disabled = false;
        submitBtn.className = 'btn btn-primary';
        document.getElementById('edit-link').style.display = 'block';
        document.querySelector('label[for="edit-link"]').style.display = 'block';
        document.getElementById('edit-link').value = '';
    }
    
    modal.classList.add('active');
}

function joinTournament(tournamentId, editLink) {
    console.log('Попытка участия в турнире:', tournamentId);
    const user = getCurrentUser();
    const tournaments = getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
        showNotification('Турнир не найден!', 'error');
        return;
    }
    
    if (tournament.participants.includes(user.username)) {
        showNotification('Вы уже участвуете в этом турнире!', 'error');
        return;
    }
    
    if (tournament.participants.length >= tournament.maxParticipants) {
        showNotification('Турнир уже заполнен!', 'error');
        return;
    }
    
    // Добавляем заявку
    const submissions = getSubmissions();
    submissions.push({
        id: Date.now(),
        username: user.username,
        tournamentId: tournamentId,
        tournamentName: tournament.name,
        editLink: editLink,
        status: 'pending',
        date: new Date().toISOString()
    });
    updateSubmissions(submissions);
    
    // Добавляем в участники
    tournament.participants.push(user.username);
    updateTournaments(tournaments);
    
    showNotification('Заявка на участие отправлена! Ожидайте проверки.', 'success');
    renderTournaments();
}

function createTournament(name, description, prize, maxParticipants, imageUrl = null) {
    console.log('Создание нового турнира:', name);
    const tournaments = getTournaments();
    const newTournament = {
        id: Date.now(),
        name: name,
        description: description,
        prize: parseInt(prize),
        maxParticipants: parseInt(maxParticipants),
        participants: [],
        status: 'upcoming',
        created: new Date().toISOString(),
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        bracket: [],
        currentRound: 1,
        image: imageUrl || getDefaultTournamentImage()
    };
    
    tournaments.push(newTournament);
    updateTournaments(tournaments);
    showNotification('Турнир успешно создан!', 'success');
    renderTournaments();
    renderAdminTournaments();
}

// Функция для получения случайной обложки по умолчанию
function getDefaultTournamentImage() {
    return CONFIG.DEFAULT_TOURNAMENT_IMAGES[Math.floor(Math.random() * CONFIG.DEFAULT_TOURNAMENT_IMAGES.length)];
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateUI() {
    console.log('Обновление интерфейса...');
    const user = getCurrentUser();
    
    if (user) {
        document.getElementById('user-avatar').textContent = user.username.substring(0, 2).toUpperCase();
        document.getElementById('user-coins').textContent = user.coins;
        
        renderProfile();
        updateKingUI();
    } else {
        document.getElementById('user-avatar').innerHTML = '<i class="fas fa-user"></i>';
        document.getElementById('user-coins').textContent = '0';
    }
    
    const adminLink = document.querySelector('.admin-only');
    if (user && CONFIG.ADMINS.includes(user.username)) {
        adminLink.style.display = 'block';
        console.log('Пользователь является админом:', user.username);
    } else {
        adminLink.style.display = 'none';
    }
}

function renderProfile() {
    console.log('Рендер профиля...');
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('profile-username').textContent = 'Гость';
        document.getElementById('profile-level').textContent = '1';
        document.getElementById('profile-exp').textContent = '0/100 XP';
        document.getElementById('profile-exp-bar').style.width = '0%';
        return;
    }
    
    document.getElementById('profile-avatar').textContent = user.username.substring(0, 2).toUpperCase();
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-level').textContent = user.level;
    document.getElementById('profile-exp').textContent = `${user.exp}/${CONFIG.EXP_PER_LEVEL} XP`;
    document.getElementById('profile-exp-bar').style.width = `${Math.min((user.exp / CONFIG.EXP_PER_LEVEL) * 100, 100)}%`;
    
    document.getElementById('quick-coins').textContent = user.coins;
    document.getElementById('quick-wins').textContent = user.wins;
    document.getElementById('quick-tournaments').textContent = user.tournamentsPlayed;
    
    document.getElementById('stat-tournaments').textContent = user.tournamentsPlayed;
    document.getElementById('stat-wins').textContent = user.wins;
    document.getElementById('stat-best').textContent = user.bestResult || '-';
    const winrate = user.tournamentsPlayed > 0 ? Math.round((user.wins / user.tournamentsPlayed) * 100) : 0;
    document.getElementById('stat-winrate').textContent = `${winrate}%`;
}

function renderTournaments() {
    console.log('Рендер турниров...');
    const tournaments = getTournaments();
    const container = document.getElementById('tournaments-grid');
    const currentFilter = document.querySelector('.tournament-filter.active')?.getAttribute('data-filter') || 'active';
    
    container.innerHTML = '';
    
    const filteredTournaments = tournaments.filter(tournament => {
        const user = getCurrentUser();
        switch(currentFilter) {
            case 'active': return tournament.status === 'active' && !tournament.isInfinite;
            case 'upcoming': return tournament.status === 'upcoming';
            case 'completed': return tournament.status === 'completed';
            case 'my': 
                return user && tournament.participants.includes(user.username);
            case 'infinite':
                return tournament.isInfinite;
            default: return true;
        }
    });
    
    if (filteredTournaments.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                <i class="fas fa-trophy" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem;"></i>
                <h3>Турниров не найдено</h3>
                <p style="color: var(--text-secondary); margin: 1rem 0;">
                    ${currentFilter === 'my' ? 'Вы не участвуете в турнирах' : 'Попробуйте другой фильтр'}
                </p>
            </div>
        `;
        return;
    }
    
    filteredTournaments.forEach(tournament => {
        const user = getCurrentUser();
        const isInfinite = tournament.isInfinite;
        const isParticipant = user && tournament.participants.includes(user.username);
        const canJoin = tournament.status === 'active' && 
                       user &&
                       !isParticipant && 
                       tournament.participants.length < tournament.maxParticipants &&
                       !isInfinite;
        
        const tournamentElement = document.createElement('div');
        tournamentElement.className = `tournament-card ${isInfinite ? 'infinite' : ''}`;
        tournamentElement.setAttribute('data-id', tournament.id);
        
        tournamentElement.innerHTML = `
            ${tournament.image ? `<img src="${tournament.image}" alt="${tournament.name}" class="tournament-image">` : ''}
            <div class="tournament-header">
                <div>
                    <h3 class="tournament-title">${tournament.name}</h3>
                    <span class="tournament-status ${tournament.status} ${isInfinite ? 'infinite' : ''}">${
                        isInfinite ? 'Царь горы' :
                        tournament.status === 'active' ? 'Активный' :
                        tournament.status === 'upcoming' ? 'Скоро начнется' : 'Завершен'
                    }</span>
                </div>
            </div>
            
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${tournament.description}</p>
            
            <div class="tournament-info">
                <span><i class="fas fa-users"></i> ${tournament.participants.length}/${tournament.maxParticipants} участников</span>
                <span><i class="fas fa-coins"></i> ${tournament.prize} коинов</span>
            </div>
            
            ${isInfinite ? `
                <div class="king-tournament-info">
                    <div class="current-king">
                        <i class="fas fa-crown"></i> Текущий царь: ${tournament.participants[0] || 'Отсутствует'}
                    </div>
                </div>
            ` : ''}
            
            ${tournament.bracket && tournament.bracket.length > 0 ? `
                <div class="tournament-bracket-preview">
                    <h4>Турнирная сетка:</h4>
                    <div class="bracket-preview">
                        ${tournament.bracket.slice(0, 2).map(match => `
                            <div class="match-preview">
                                ${match.player1} vs ${match.player2 || 'BYE'}
                                ${match.winner ? ` (🏆 ${match.winner})` : ''}
                            </div>
                        `).join('')}
                        ${tournament.bracket.length > 2 ? `<div class="more-matches">... и еще ${tournament.bracket.length - 2} матчей</div>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-top: 1.5rem;">
                ${!user ? 
                    '<button class="btn btn-outline" style="width: 100%;" disabled>Войдите для участия</button>' :
                    isInfinite ?
                    '<button class="btn btn-warning" style="width: 100%;" id="challenge-king-main-btn">Бросить вызов</button>' :
                    isParticipant ? 
                    '<div class="participant-badge">✅ Вы участвуете</div>' :
                    canJoin ?
                    '<button class="btn btn-primary join-tournament-btn" style="width: 100%;">Участвовать</button>' :
                    '<button class="btn btn-outline" style="width: 100%;" disabled>Турнир заполнен</button>'
                }
            </div>
        `;
        
        if (canJoin) {
            tournamentElement.querySelector('.join-tournament-btn').addEventListener('click', () => {
                openTournamentModal(tournament);
            });
        }
        
        if (isInfinite) {
            tournamentElement.querySelector('#challenge-king-main-btn').addEventListener('click', challengeKing);
        }
        
        container.appendChild(tournamentElement);
    });
}

function renderTop() {
    console.log('Рендер топа игроков...');
    const users = getUsers();
    const container = document.getElementById('top-players');
    const currentFilter = document.querySelector('.top-filter.active')?.getAttribute('data-filter') || 'wins';
    
    container.innerHTML = '';
    
    const sortedUsers = Object.values(users).sort((a, b) => {
        switch(currentFilter) {
            case 'coins': return b.coins - a.coins;
            case 'level': return (b.level || 1) - (a.level || 1);
            case 'king': 
                const aKingScore = (a.kingWins || 0) * 1000 + (a.totalKingTime || 0);
                const bKingScore = (b.kingWins || 0) * 1000 + (b.totalKingTime || 0);
                return bKingScore - aKingScore;
            case 'wins': 
            default: return (b.wins || 0) - (a.wins || 0);
        }
    });
    
    sortedUsers.forEach((user, index) => {
        const playerElement = document.createElement('div');
        let rankClass = '';
        
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';
        
        playerElement.className = `top-player ${rankClass}`;
        
        const score = currentFilter === 'wins' ? user.wins || 0 :
                     currentFilter === 'coins' ? user.coins :
                     currentFilter === 'level' ? user.level || 1 :
                     currentFilter === 'king' ? (user.kingWins || 0) + ' побед' : 0;
        
        playerElement.innerHTML = `
            <div class="player-rank">${index + 1}</div>
            <div class="player-avatar">${user.username.substring(0, 2).toUpperCase()}</div>
            <div class="player-info">
                <div class="player-name">${user.username}</div>
                <div class="player-stats">
                    <span><i class="fas fa-trophy"></i> ${user.wins || 0} побед</span>
                    <span><i class="fas fa-coins"></i> ${user.coins} коинов</span>
                    <span><i class="fas fa-level-up-alt"></i> Ур. ${user.level || 1}</span>
                    ${currentFilter === 'king' ? `<span><i class="fas fa-crown"></i> ${user.kingWins || 0} раз царем</span>` : ''}
                </div>
            </div>
            <div class="player-score">${score}</div>
        `;
        
        container.appendChild(playerElement);
    });
    
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userIndex = sortedUsers.findIndex(u => u.username === currentUser.username);
        document.getElementById('user-rank').textContent = userIndex !== -1 ? userIndex + 1 : '-';
    } else {
        document.getElementById('user-rank').textContent = '-';
    }
}

// ===== АДМИН СИСТЕМА =====
function checkAdminAccess() {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Проверяем пароль из localStorage И наличие пользователя в списке админов
    const hasAccess = localStorage.getItem('editourAdminAccess') === 'true' && 
                     CONFIG.ADMINS.includes(user.username);
    
    console.log('Проверка доступа к админке:', hasAccess, 'для пользователя:', user.username);
    return hasAccess;
}

function grantAdminAccess() {
    localStorage.setItem('editourAdminAccess', 'true');
    document.getElementById('admin-auth').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    showNotification('Доступ к админке предоставлен!', 'success');
    renderAdminContent();
}

function revokeAdminAccess() {
    localStorage.setItem('editourAdminAccess', 'false');
    document.getElementById('admin-auth').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
    showNotification('Доступ к админке отозван!', 'success');
}

function adminLogin(password) {
    console.log('Попытка входа в админку...');
    if (password === CONFIG.ADMIN_PASSWORD) {
        grantAdminAccess();
        return true;
    } else {
        showNotification('Неверный пароль!', 'error');
        return false;
    }
}

function renderAdminContent() {
    console.log('Рендер админ панели...');
    renderAdminSubmissions();
    renderAdminTournaments();
    renderAdminUsers();
    renderAdminKing();
}

function renderAdminSubmissions() {
    console.log('Рендер заявок в админке...');
    const submissions = getSubmissions();
    const container = document.getElementById('admin-submissions');
    
    if (submissions.length === 0) {
        container.innerHTML = '<p>Нет заявок на проверку.</p>';
        return;
    }
    
    container.innerHTML = submissions.map(submission => `
        <div class="submission-item">
            <div>
                <h4>${submission.username}</h4>
                <p>Турнир: ${submission.tournamentName}</p>
                <p>Ссылка: <a href="${submission.editLink}" target="_blank">${submission.editLink}</a></p>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${new Date(submission.date).toLocaleDateString('ru-RU')}
                </p>
            </div>
            <div class="submission-actions">
                <button class="btn btn-success approve-btn" data-id="${submission.id}">
                    <i class="fas fa-check"></i> Одобрить
                </button>
                <button class="btn btn-danger reject-btn" data-id="${submission.id}">
                    <i class="fas fa-times"></i> Отклонить
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const submissionId = parseInt(btn.getAttribute('data-id'));
            console.log('Одобрение заявки:', submissionId);
            const submissions = getSubmissions();
            const submission = submissions.find(s => s.id === submissionId);
            
            if (submission) {
                // Добавляем эдит в approvedEdits
                const approvedEdits = getApprovedEdits();
                const newEdit = {
                    id: Date.now(),
                    username: submission.username,
                    tournamentId: submission.tournamentId,
                    editLink: submission.editLink,
                    votes: 0,
                    title: `Эдит от ${submission.username}`,
                    tournamentName: submission.tournamentName
                };
                approvedEdits.push(newEdit);
                updateApprovedEdits(approvedEdits);
                
                // Добавляем эдит в турнирную сетку
                const tournaments = getTournaments();
                const tournament = tournaments.find(t => t.id === submission.tournamentId);
                if (tournament && tournament.bracket) {
                    const userMatch = tournament.bracket.find(match => 
                        match.player1 === submission.username || match.player2 === submission.username
                    );
                    if (userMatch) {
                        userMatch.edits[submission.username] = {
                            id: newEdit.id,
                            votes: 0
                        };
                        updateTournaments(tournaments);
                    }
                }
                
                // Удаляем заявку
                const updatedSubmissions = submissions.filter(s => s.id !== submissionId);
                updateSubmissions(updatedSubmissions);
                
                showNotification(`Эдит ${submission.username} одобрен!`, 'success');
                renderAdminSubmissions();
            }
        });
    });
    
    container.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const submissionId = parseInt(btn.getAttribute('data-id'));
            console.log('Отклонение заявки:', submissionId);
            const submissions = getSubmissions();
            const updatedSubmissions = submissions.filter(s => s.id !== submissionId);
            
            updateSubmissions(updatedSubmissions);
            showNotification('Заявка отклонена!', 'success');
            renderAdminSubmissions();
        });
    });
}

function renderAdminTournaments() {
    console.log('Рендер турниров в админке...');
    const tournaments = getTournaments();
    const container = document.getElementById('admin-tournaments');
    
    container.innerHTML = tournaments.map(tournament => `
        <div class="tournament-item">
            <div>
                <h4>${tournament.name}</h4>
                <p>${tournament.description}</p>
                <p>Статус: <span class="tournament-status ${tournament.status} ${tournament.isInfinite ? 'infinite' : ''}">${
                    tournament.isInfinite ? 'Царь горы' :
                    tournament.status === 'active' ? 'Активный' :
                    tournament.status === 'upcoming' ? 'Скоро начнется' : 'Завершен'
                }</span></p>
                <p>Участников: ${tournament.participants.length}/${tournament.maxParticipants}</p>
                <p>Приз: ${tournament.prize} коинов</p>
                ${tournament.bracket && tournament.bracket.length > 0 ? `
                    <p>Турнирная сетка: ${tournament.bracket.length} матчей</p>
                ` : ''}
            </div>
            <div class="submission-actions">
                ${!tournament.isInfinite ? `
                    <button class="btn btn-primary start-tournament-btn" data-id="${tournament.id}" 
                        ${tournament.status !== 'upcoming' ? 'disabled' : ''}>
                        <i class="fas fa-play"></i> Запустить
                    </button>
                ` : ''}
                <button class="btn btn-danger delete-tournament-btn" data-id="${tournament.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.start-tournament-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tournamentId = parseInt(this.getAttribute('data-id'));
            console.log('Запуск турнира:', tournamentId);
            startTournament(tournamentId);
        });
    });
    
    container.querySelectorAll('.delete-tournament-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tournamentId = this.getAttribute('data-id');
            console.log('Удаление турнира:', tournamentId);
            deleteTournament(tournamentId);
        });
    });
}

function renderAdminUsers() {
    console.log('Рендер пользователей в админке...');
    const users = getUsers();
    const container = document.getElementById('admin-users');
    
    if (Object.keys(users).length === 0) {
        container.innerHTML = '<p>Пользователей не найдено</p>';
        return;
    }
    
    container.innerHTML = Object.values(users).map(user => `
        <div class="user-item" data-username="${user.username}">
            <div class="user-info">
                <h4>${user.username}</h4>
                <p>Уровень: ${user.level || 1} | Коины: ${user.coins || 0}</p>
                <p>Опыт: ${user.exp || 0}/${CONFIG.EXP_PER_LEVEL} | Побед: ${user.wins || 0}</p>
                <p>Турниров: ${user.tournamentsPlayed || 0} | Голосов: ${user.totalVotes || 0}</p>
                <p>Заработано голосами: ${user.votesEarned || 0} коинов</p>
                <p>Дневные голоса: ${user.dailyVotes || 0}/${CONFIG.MAX_DAILY_VOTES}</p>
                <p>Побед царем: ${user.kingWins || 0} | Время правления: ${formatTime(user.totalKingTime || 0)}</p>
                <p class="user-id">ID: ${user.username}</p>
            </div>
            <div class="user-actions">
                <button class="btn btn-primary edit-user-btn" data-username="${user.username}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-warning reset-stats-btn" data-username="${user.username}">
                    <i class="fas fa-redo"></i> Сбросить статистику
                </button>
                <button class="btn btn-danger delete-user-btn" data-username="${user.username}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
                <button class="btn btn-secondary add-coins-btn" data-username="${user.username}">
                    <i class="fas fa-coins"></i> +100 коинов
                </button>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            editUser(username);
        });
    });
    
    container.querySelectorAll('.reset-stats-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            resetUserStats(username);
        });
    });
    
    container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            deleteUser(username);
        });
    });
    
    container.querySelectorAll('.add-coins-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            addCoinsToUser(username, 100);
        });
    });
}

function renderAdminKing() {
    console.log('Рендер управления Царем горы...');
    const kingData = getKingData();
    const container = document.getElementById('king-stats-info');
    
    container.innerHTML = `
        <div class="king-stats">
            <p><strong>Текущий царь:</strong> ${kingData.currentKing || 'Отсутствует'}</p>
            <p><strong>Правит с:</strong> ${kingData.kingSince ? new Date(kingData.kingSince).toLocaleString('ru-RU') : 'Нет'}</p>
            <p><strong>Успешных защит:</strong> ${kingData.defenseCount}</p>
            <p><strong>Всего правлений:</strong> ${kingData.totalReigns}</p>
            <p><strong>Последние вызовы:</strong></p>
            <div class="challenges-list">
                ${kingData.challenges.slice(0, 5).map(challenge => `
                    <div class="challenge-item">
                        <span>${challenge.challenger}</span>
                        <span>${new Date(challenge.date).toLocaleDateString('ru-RU')}</span>
                        <span class="status ${challenge.status}">${challenge.status}</span>
                    </div>
                `).join('')}
                ${kingData.challenges.length === 0 ? '<p>Нет вызовов</p>' : ''}
            </div>
        </div>
    `;
    
    document.getElementById('current-king-input').value = kingData.currentKing || '';
}

// Вспомогательная функция для форматирования времени
function formatTime(milliseconds) {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}д ${hours}ч`;
}

// Админ функции
function startTournament(tournamentId) {
    console.log('Запуск турнира:', tournamentId);
    const tournaments = getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (tournament) {
        if (tournament.participants.length < 2) {
            if (!confirm('В турнире меньше 2 участников. Вы уверены, что хотите запустить турнир?')) {
                return;
            }
        }
        
        tournament.status = 'active';
        tournament.bracket = generateTournamentBracket(tournament.participants);
        tournament.currentRound = 1;
        tournament.startDate = new Date().toISOString();
        tournament.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        updateTournaments(tournaments);
        showNotification('Турнир запущен! Сетка сгенерирована.', 'success');
        renderAdminTournaments();
        renderTournaments();
    } else {
        showNotification('Турнир не найден!', 'error');
    }
}

function deleteTournament(tournamentId) {
    console.log('Удаление турнира:', tournamentId);
    if (!confirm('Вы уверены, что хотите удалить турнир?')) return;
    
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.filter(t => t.id != tournamentId);
    updateTournaments(updatedTournaments);
    showNotification('Турнир удален!', 'success');
    renderAdminTournaments();
    renderTournaments();
}

function editUser(username) {
    console.log('Редактирование пользователя:', username);
    const users = getUsers();
    const user = users[username];
    if (user) {
        const newCoins = prompt('Новое количество коинов:', user.coins);
        if (newCoins !== null) {
            user.coins = parseInt(newCoins);
            updateUser(user);
            showNotification('Пользователь обновлен!', 'success');
            renderAdminUsers();
        }
    }
}

function resetUserStats(username) {
    console.log('Сброс статистики пользователя:', username);
    const users = getUsers();
    const user = users[username];
    if (user) {
        user.tournamentsPlayed = 0;
        user.wins = 0;
        user.bestResult = null;
        user.totalVotes = 0;
        user.votesEarned = 0;
        user.dailyVotes = 0;
        user.level = 1;
        user.exp = 0;
        user.kingWins = 0;
        user.totalKingTime = 0;
        updateUser(user);
        showNotification('Статистика пользователя сброшена!', 'success');
        renderAdminUsers();
    }
}

function deleteUser(username) {
    console.log('Удаление пользователя:', username);
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) return;
    
    const users = getUsers();
    delete users[username];
    localStorage.setItem('editourUsers', JSON.stringify(users));
    showNotification('Пользователь удален!', 'success');
    renderAdminUsers();
}

function addCoinsToUser(username, amount) {
    console.log('Добавление коинов пользователю:', username, amount);
    const users = getUsers();
    const user = users[username];
    if (user) {
        user.coins += amount;
        updateUser(user);
        showNotification(`Добавлено ${amount} коинов пользователю ${username}!`, 'success');
        renderAdminUsers();
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            console.log('Переход на страницу:', page);
            showPage(page);
        });
    });

    document.getElementById('demo-login-btn').addEventListener('click', () => {
        console.log('Нажата кнопка демо входа');
        const users = getUsers();
        const userList = Object.keys(users);
        const currentUser = localStorage.getItem('currentUser') || 'DemoUser';
        
        const currentIndex = userList.indexOf(currentUser);
        const nextIndex = (currentIndex + 1) % userList.length;
        const newUser = userList[nextIndex];
        
        localStorage.setItem('currentUser', newUser);
        updateUI();
        showNotification(`Добро пожаловать, ${newUser}!`, 'success');
        showPage('profile');
    });

    document.getElementById('telegram-login-btn').addEventListener('click', setupTelegramLogin);

    document.getElementById('refresh-tournaments').addEventListener('click', renderTournaments);

    document.querySelectorAll('.tournament-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.tournament-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            renderTournaments();
        });
    });

    document.querySelectorAll('.top-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.top-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            renderTop();
        });
    });

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    document.getElementById('admin-login-btn').addEventListener('click', () => {
        const password = document.getElementById('admin-password').value;
        adminLogin(password);
    });

    document.getElementById('admin-logout-btn').addEventListener('click', revokeAdminAccess);

    document.getElementById('create-tournament-btn').addEventListener('click', () => {
        document.getElementById('create-tournament-modal').classList.add('active');
    });

    document.getElementById('create-tournament-submit').addEventListener('click', () => {
        const name = document.getElementById('tournament-name').value;
        const description = document.getElementById('tournament-description').value;
        const prize = document.getElementById('tournament-prize').value;
        const participants = document.getElementById('tournament-participants').value;
        const imageUrl = document.getElementById('tournament-image').value;

        if (name && description && prize) {
            createTournament(name, description, prize, participants, imageUrl || null);
            document.getElementById('create-tournament-modal').classList.remove('active');
            
            document.getElementById('tournament-name').value = '';
            document.getElementById('tournament-description').value = '';
            document.getElementById('tournament-prize').value = '';
            document.getElementById('tournament-image').value = '';
        } else {
            showNotification('Заполните все обязательные поля!', 'error');
        }
    });

    document.getElementById('submit-edit-btn').addEventListener('click', function() {
        const editLink = document.getElementById('edit-link').value;
        if (!editLink) {
            showNotification('Введите ссылку на ваш эдит!', 'error');
            return;
        }
        
        const tournamentTitle = document.getElementById('tournament-modal-title').textContent;
        const tournaments = getTournaments();
        const tournament = tournaments.find(t => t.name === tournamentTitle);
        
        if (tournament) {
            joinTournament(tournament.id, editLink);
            document.getElementById('tournament-modal').classList.remove('active');
        } else {
            showNotification('Турнир не найден!', 'error');
        }
    });

    document.getElementById('go-to-tournaments-btn').addEventListener('click', function() {
        showPage('tournaments');
    });

    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Обработчики для Царя горы
    document.getElementById('challenge-king-btn').addEventListener('click', challengeKing);
    
    document.getElementById('set-king-btn').addEventListener('click', function() {
        const newKing = document.getElementById('current-king-input').value;
        if (newKing) {
            becomeKing(newKing);
            renderAdminKing();
        } else {
            showNotification('Введите имя пользователя!', 'error');
        }
    });
    
    document.getElementById('reset-king-btn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите сбросить трон Царя горы?')) {
            const kingData = getKingData();
            kingData.currentKing = null;
            kingData.kingSince = null;
            kingData.defenseCount = 0;
            updateKingData(kingData);
            
            // Обновляем турнир "Царь горы"
            const tournaments = getTournaments();
            const infiniteTournament = tournaments.find(t => t.id === 'infinite');
            if (infiniteTournament) {
                infiniteTournament.participants = [];
                updateTournaments(tournaments);
            }
            
            showNotification('Трон Царя горы сброшен!', 'success');
            updateKingUI();
            renderAdminKing();
            renderTournaments();
        }
    });
    
    // Обработчики для модального окна видео
    document.getElementById('video-modal-close').addEventListener('click', function() {
        document.getElementById('video-modal').classList.remove('active');
    });
    
    console.log('Обработчики событий настроены');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showPage(pageId) {
    console.log('Показ страницы:', pageId);
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Страница не найдена:', pageId);
        return;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    switch(pageId) {
        case 'profile':
            renderProfile();
            updateKingUI();
            break;
        case 'tournaments':
            renderTournaments();
            break;
        case 'voting':
            showNextVotingPair();
            break;
        case 'top':
            renderTop();
            break;
        case 'admin':
            if (checkAdminAccess()) {
                document.getElementById('admin-auth').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'block';
                renderAdminContent();
            } else {
                document.getElementById('admin-auth').style.display = 'block';
                document.getElementById('admin-panel').style.display = 'none';
            }
            break;
    }
}

function showNotification(message, type = 'info') {
    console.log('Показ уведомления:', message, type);
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    text.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

function initStars() {
    const stars = document.getElementById('stars');
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 5}s`;
        stars.appendChild(star);
    }
}

// ===== ОТЛАДОЧНЫЕ ФУНКЦИИ =====
window.switchUser = function(username) {
    const users = getUsers();
    if (users[username]) {
        localStorage.setItem('currentUser', username);
        updateUI();
        showNotification(`Переключен на пользователя: ${username}`, 'success');
        showPage('profile');
    } else {
        showNotification(`Пользователь ${username} не найден!`, 'error');
    }
};

window.showData = function() {
    console.log('=== DATA DUMP ===');
    console.log('Users:', getUsers());
    console.log('Tournaments:', getTournaments());
    console.log('Submissions:', getSubmissions());
    console.log('Approved Edits:', getApprovedEdits());
    console.log('Votes:', getVotes());
    console.log('King Data:', getKingData());
    console.log('Current User:', getCurrentUser());
};

window.resetAllData = function() {
    if (confirm('Вы уверены, что хотите сбросить ВСЕ данные?')) {
        localStorage.removeItem('editourUsers');
        localStorage.removeItem('editourTournaments');
        localStorage.removeItem('editourSubmissions');
        localStorage.removeItem('editourApprovedEdits');
        localStorage.removeItem('editourVotes');
        localStorage.removeItem('editourKing');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('editourAdminAccess');
        localStorage.removeItem('lastKingRewardDate');
        
        showNotification('Все данные сброшены!', 'success');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
};

console.log('EDITTOUR: Приложение полностью загружено и готово к работе!');
console.log('Доступные команды для отладки:');
console.log('- switchUser("username") - переключиться на пользователя');
console.log('- showData() - показать все данные');
console.log('- resetAllData() - сбросить все данные');
