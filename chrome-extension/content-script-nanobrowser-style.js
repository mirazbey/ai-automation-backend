// Fırsat Avcısı - Nanobrowser Tarzı Multi-Agent Sidebar
// Opera Uyumlu Versiyon v3.0

class NanobrowserStyleSidebar {
    constructor() {
        this.isVisible = false;
        this.isMinimized = false;
        this.agents = {
            planner: { name: 'Planner', status: 'idle', emoji: '🧠' },
            navigator: { name: 'Navigator', status: 'idle', emoji: '📍' },
            validator: { name: 'Validator', status: 'idle', emoji: '✅' }
        };
        this.conversationHistory = this.loadHistory();
        this.currentTask = null;
        
        this.init();
    }
    
    init() {
        this.createSidebar();
        this.setupEventListeners();
        this.loadStoredData();
        
        // Background script ile iletişim kur
        this.setupBackgroundCommunication();
        
        console.log('🎯 Nanobrowser Style Sidebar initialized');
    }
    
    createSidebar() {
        // Ana sidebar container
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'nanobrowser-sidebar';
        this.sidebar.className = 'nanobrowser-sidebar';
        this.sidebar.innerHTML = this.getSidebarHTML();
        
        // CSS stilleri ekle
        this.injectStyles();
        
        // Sidebar'ı sayfaya ekle
        document.body.appendChild(this.sidebar);
        
        // Sayfa içeriğini kaydır
        this.adjustPageLayout();
    }
    
    getSidebarHTML() {
        return `
            <div class="nanobrowser-header">
                <div class="nanobrowser-logo">
                    <span class="logo-icon">🎯</span>
                    <span class="logo-text">Fırsat Avcısı</span>
                </div>
                <div class="nanobrowser-controls">
                    <button class="control-btn minimize-btn" title="Küçült">
                        <span class="icon">−</span>
                    </button>
                    <button class="control-btn close-btn" title="Kapat">
                        <span class="icon">×</span>
                    </button>
                </div>
            </div>
            
            <div class="agent-status-bar">
                <div class="agent-indicator" data-agent="planner">
                    <span class="agent-emoji">🧠</span>
                    <span class="agent-name">Planner</span>
                    <span class="agent-status idle">💤</span>
                </div>
                <div class="agent-indicator" data-agent="navigator">
                    <span class="agent-emoji">📍</span>
                    <span class="agent-name">Navigator</span>
                    <span class="agent-status idle">💤</span>
                </div>
                <div class="agent-indicator" data-agent="validator">
                    <span class="agent-emoji">✅</span>
                    <span class="agent-name">Validator</span>
                    <span class="agent-status idle">💤</span>
                </div>
            </div>
            
            <div class="nanobrowser-content">
                <div class="chat-container">
                    <div class="messages-area" id="messages-area">
                        <div class="welcome-message">
                            <div class="agent-avatar">🤖</div>
                            <div class="message-content">
                                <div class="agent-name">Sistem</div>
                                <div class="message-text">
                                    Merhaba! Ben Fırsat Avcısı AI asistanınızım. 
                                    Size nasıl yardımcı olabilirim?
                                    <br><br>
                                    <strong>Örnek komutlar:</strong><br>
                                    • "Sahibinden.com'da Fiat Egea ara"<br>
                                    • "Bu sayfadaki bilgileri analiz et"<br>
                                    • "Google'da iPhone 15 fiyatları ara"
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-area">
                        <div class="input-container">
                            <input type="text" 
                                   id="user-input" 
                                   placeholder="Ne yapmamı istiyorsunuz?" 
                                   autocomplete="off">
                            <button class="send-btn" id="send-btn">
                                <span class="send-icon">🚀</span>
                            </button>
                        </div>
                        <div class="quick-actions">
                            <button class="quick-btn" data-action="analyze-page">
                                📊 Bu Sayfayı Analiz Et
                            </button>
                            <button class="quick-btn" data-action="search-products">
                                🛍️ Ürün Ara
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="tabs-container">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="chat">💬 Chat</button>
                        <button class="tab-btn" data-tab="history">📋 Geçmiş</button>
                        <button class="tab-btn" data-tab="settings">⚙️ Ayarlar</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-panel active" id="chat-panel">
                            <!-- Chat içeriği yukarıda -->
                        </div>
                        
                        <div class="tab-panel" id="history-panel">
                            <div class="history-header">
                                <h3>Görev Geçmişi</h3>
                                <button class="clear-history-btn">🗑️ Temizle</button>
                            </div>
                            <div class="history-list" id="history-list">
                                <!-- Geçmiş görevler buraya eklenecek -->
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="settings-panel">
                            <div class="settings-section">
                                <h3>Agent Ayarları</h3>
                                <div class="setting-item">
                                    <label>Otomatik Doğrulama</label>
                                    <input type="checkbox" id="auto-validation" checked>
                                </div>
                                <div class="setting-item">
                                    <label>Detaylı Loglar</label>
                                    <input type="checkbox" id="detailed-logs">
                                </div>
                                <div class="setting-item">
                                    <label>Ses Bildirimleri</label>
                                    <input type="checkbox" id="sound-notifications">
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h3>Dışa Aktarma</h3>
                                <button class="export-btn" data-format="json">📄 JSON</button>
                                <button class="export-btn" data-format="markdown">📝 Markdown</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="nanobrowser-footer">
                <div class="status-indicator">
                    <span class="status-dot online"></span>
                    <span class="status-text">Çevrimiçi</span>
                </div>
                <div class="task-counter">
                    <span id="task-count">0</span> görev tamamlandı
                </div>
            </div>
        `;
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .nanobrowser-sidebar {
                position: fixed;
                top: 0;
                right: 0;
                width: 420px;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 2147483647;
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: -5px 0 20px rgba(0,0,0,0.3);
                transition: transform 0.3s ease;
                color: white;
            }
            
            .nanobrowser-sidebar.minimized {
                transform: translateX(370px);
            }
            
            .nanobrowser-sidebar.hidden {
                transform: translateX(100%);
            }
            
            .nanobrowser-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0,0,0,0.2);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .nanobrowser-logo {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: bold;
                font-size: 16px;
            }
            
            .logo-icon {
                font-size: 20px;
            }
            
            .nanobrowser-controls {
                display: flex;
                gap: 5px;
            }
            
            .control-btn {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .control-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .agent-status-bar {
                display: flex;
                justify-content: space-between;
                padding: 10px 15px;
                background: rgba(0,0,0,0.1);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .agent-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            
            .agent-indicator.active {
                opacity: 1;
                animation: pulse 2s infinite;
            }
            
            .agent-emoji {
                font-size: 16px;
            }
            
            .agent-name {
                font-weight: 500;
            }
            
            .agent-status {
                font-size: 10px;
            }
            
            .agent-status.thinking {
                animation: spin 1s linear infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .nanobrowser-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .chat-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }
            
            .messages-area {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 20px;
                padding-right: 10px;
            }
            
            .messages-area::-webkit-scrollbar {
                width: 6px;
            }
            
            .messages-area::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
            }
            
            .messages-area::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 3px;
            }
            
            .welcome-message, .message {
                display: flex;
                gap: 12px;
                margin-bottom: 15px;
                animation: fadeInUp 0.3s ease;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .agent-avatar {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .message-content {
                flex: 1;
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 12px 15px;
            }
            
            .agent-name {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 5px;
                opacity: 0.8;
            }
            
            .message-text {
                font-size: 14px;
                line-height: 1.4;
            }
            
            .user-message .message-content {
                background: rgba(255,255,255,0.2);
                margin-left: 40px;
            }
            
            .input-area {
                margin-top: auto;
            }
            
            .input-container {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            #user-input {
                flex: 1;
                padding: 12px 15px;
                border: none;
                border-radius: 25px;
                background: rgba(255,255,255,0.2);
                color: white;
                font-size: 14px;
                outline: none;
            }
            
            #user-input::placeholder {
                color: rgba(255,255,255,0.7);
            }
            
            .send-btn {
                width: 45px;
                height: 45px;
                border: none;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .send-btn:hover {
                background: rgba(255,255,255,0.4);
            }
            
            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .quick-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .quick-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 15px;
                background: rgba(255,255,255,0.2);
                color: white;
                font-size: 11px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .quick-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .tabs-container {
                border-top: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.1);
            }
            
            .tab-buttons {
                display: flex;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .tab-btn {
                flex: 1;
                padding: 12px;
                border: none;
                background: transparent;
                color: rgba(255,255,255,0.7);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .tab-btn.active {
                color: white;
                background: rgba(255,255,255,0.1);
            }
            
            .tab-panel {
                display: none;
                padding: 15px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            .nanobrowser-footer {
                padding: 10px 20px;
                background: rgba(0,0,0,0.2);
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4CAF50;
            }
            
            .status-dot.offline {
                background: #f44336;
            }
            
            /* Sayfa layout ayarlaması */
            body.nanobrowser-active {
                margin-right: 420px !important;
                transition: margin-right 0.3s ease;
            }
            
            body.nanobrowser-minimized {
                margin-right: 50px !important;
            }
            
            /* Responsive tasarım */
            @media (max-width: 1200px) {
                .nanobrowser-sidebar {
                    width: 350px;
                }
                
                body.nanobrowser-active {
                    margin-right: 350px !important;
                }
            }
            
            /* Özel mesaj tipleri */
            .message.success .message-content {
                background: rgba(76, 175, 80, 0.3);
                border-left: 3px solid #4CAF50;
            }
            
            .message.error .message-content {
                background: rgba(244, 67, 54, 0.3);
                border-left: 3px solid #f44336;
            }
            
            .message.warning .message-content {
                background: rgba(255, 152, 0, 0.3);
                border-left: 3px solid #FF9800;
            }
            
            .message.info .message-content {
                background: rgba(33, 150, 243, 0.3);
                border-left: 3px solid #2196F3;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Minimize/Close butonları
        this.sidebar.querySelector('.minimize-btn').addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        this.sidebar.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });
        
        // Send butonu ve Enter tuşu
        const sendBtn = this.sidebar.querySelector('#send-btn');
        const userInput = this.sidebar.querySelector('#user-input');
        
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Quick action butonları
        this.sidebar.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Tab butonları
        this.sidebar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Export butonları
        this.sidebar.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportData(e.target.dataset.format);
            });
        });
    }
    
    setupBackgroundCommunication() {
        // Background script ile iletişim
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'AUTOMATION_RESULT') {
                this.handleAutomationResult(message.data);
            } else if (message.type === 'AGENT_STATUS_UPDATE') {
                this.updateAgentStatus(message.agent, message.status);
            }
        });
    }
    
    show() {
        this.isVisible = true;
        this.sidebar.classList.remove('hidden');
        document.body.classList.add('nanobrowser-active');
        
        // Sidebar'ı localStorage'a kaydet
        localStorage.setItem('nanobrowser_visible', 'true');
    }
    
    hide() {
        this.isVisible = false;
        this.sidebar.classList.add('hidden');
        document.body.classList.remove('nanobrowser-active', 'nanobrowser-minimized');
        
        localStorage.setItem('nanobrowser_visible', 'false');
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            this.sidebar.classList.add('minimized');
            document.body.classList.add('nanobrowser-minimized');
            document.body.classList.remove('nanobrowser-active');
        } else {
            this.sidebar.classList.remove('minimized');
            document.body.classList.remove('nanobrowser-minimized');
            document.body.classList.add('nanobrowser-active');
        }
        
        localStorage.setItem('nanobrowser_minimized', this.isMinimized.toString());
    }
    
    sendMessage() {
        const userInput = this.sidebar.querySelector('#user-input');
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Kullanıcı mesajını göster
        this.addMessage('user', 'Sen', message);
        
        // Input'u temizle ve disable et
        userInput.value = '';
        userInput.disabled = true;
        this.sidebar.querySelector('#send-btn').disabled = true;
        
        // Agent'ları aktif et
        this.updateAgentStatus('planner', 'thinking');
        
        // Backend'e gönder
        this.processCommand(message);
    }
    
    async processCommand(command) {
        try {
            // Planner agent mesajı
            this.addMessage('agent', 'Planner', 'Görevinizi analiz ediyorum...', 'info');
            
            const response = await fetch('http://localhost:5000/api/automation/full-automation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.handleAutomationResult(result);
            } else {
                this.addMessage('agent', 'Sistem', `Hata: ${result.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Automation error:', error);
            this.addMessage('agent', 'Sistem', `Bağlantı hatası: ${error.message}`, 'error');
        } finally {
            // Input'u tekrar aktif et
            this.sidebar.querySelector('#user-input').disabled = false;
            this.sidebar.querySelector('#send-btn').disabled = false;
            
            // Agent'ları idle yap
            Object.keys(this.agents).forEach(agent => {
                this.updateAgentStatus(agent, 'idle');
            });
        }
    }
    
    handleAutomationResult(result) {
        // Plan sonuçlarını göster
        if (result.plan) {
            this.addMessage('agent', 'Planner', `Plan oluşturuldu: ${result.plan.steps?.length || 0} adım`, 'success');
            this.updateAgentStatus('planner', 'success');
            this.updateAgentStatus('navigator', 'thinking');
        }
        
        // Automation sonuçlarını göster
        if (result.automation_results) {
            result.automation_results.forEach((step, index) => {
                setTimeout(() => {
                    if (typeof step === 'string') {
                        this.addMessage('agent', 'Navigator', step, step.includes('✅') ? 'success' : 'warning');
                    } else if (step.result) {
                        this.addMessage('agent', 'Navigator', step.result, step.status === 'success' ? 'success' : 'warning');
                    }
                }, index * 500);
            });
            
            this.updateAgentStatus('navigator', 'success');
            this.updateAgentStatus('validator', 'thinking');
        }
        
        // Validation sonuçlarını göster
        if (result.validation) {
            setTimeout(() => {
                const validation = result.validation;
                const score = validation.success_score || 0;
                const message = `Doğrulama tamamlandı: ${score}/100 puan\n${validation.summary || ''}`;
                
                this.addMessage('agent', 'Validator', message, score > 70 ? 'success' : 'warning');
                this.updateAgentStatus('validator', score > 70 ? 'success' : 'warning');
                
                // Görev sayacını güncelle
                this.updateTaskCounter();
                
                // Geçmişe ekle
                this.addToHistory(result);
                
            }, (result.automation_results?.length || 0) * 500 + 1000);
        }
    }
    
    addMessage(type, sender, text, messageType = 'info') {
        const messagesArea = this.sidebar.querySelector('#messages-area');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${messageType}`;
        
        const avatar = type === 'user' ? '👤' : this.getAgentEmoji(sender);
        
        messageDiv.innerHTML = `
            <div class="agent-avatar">${avatar}</div>
            <div class="message-content">
                <div class="agent-name">${sender}</div>
                <div class="message-text">${text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    getAgentEmoji(agentName) {
        const emojis = {
            'Planner': '🧠',
            'Navigator': '📍',
            'Validator': '✅',
            'Sistem': '🤖'
        };
        return emojis[agentName] || '🤖';
    }
    
    updateAgentStatus(agentName, status) {
        const indicator = this.sidebar.querySelector(`[data-agent="${agentName}"]`);
        if (!indicator) return;
        
        const statusElement = indicator.querySelector('.agent-status');
        const statusEmojis = {
            'idle': '💤',
            'thinking': '🤔',
            'working': '⚡',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        
        statusElement.textContent = statusEmojis[status] || '💤';
        statusElement.className = `agent-status ${status}`;
        
        // Indicator'ı aktif/pasif yap
        if (status === 'thinking' || status === 'working') {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
        
        // Agent durumunu kaydet
        this.agents[agentName].status = status;
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'analyze-page':
                const currentUrl = window.location.href;
                this.sidebar.querySelector('#user-input').value = `Bu sayfayı analiz et: ${currentUrl}`;
                this.sendMessage();
                break;
                
            case 'search-products':
                this.sidebar.querySelector('#user-input').value = 'Sahibinden.com\'da ';
                this.sidebar.querySelector('#user-input').focus();
                break;
        }
    }
    
    switchTab(tabName) {
        // Tab butonlarını güncelle
        this.sidebar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.sidebar.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Tab panellerini güncelle
        this.sidebar.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        this.sidebar.querySelector(`#${tabName}-panel`).classList.add('active');
        
        // Geçmiş sekmesi açıldığında geçmişi yükle
        if (tabName === 'history') {
            this.loadHistoryPanel();
        }
    }
    
    updateTaskCounter() {
        const counter = this.sidebar.querySelector('#task-count');
        const currentCount = parseInt(counter.textContent) + 1;
        counter.textContent = currentCount;
        
        localStorage.setItem('nanobrowser_task_count', currentCount.toString());
    }
    
    addToHistory(result) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            command: result.original_command,
            success: result.success,
            summary: result.validation?.summary || 'Görev tamamlandı'
        };
        
        this.conversationHistory.unshift(historyItem);
        
        // Maksimum 50 öğe tut
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(0, 50);
        }
        
        this.saveHistory();
    }
    
    loadHistoryPanel() {
        const historyList = this.sidebar.querySelector('#history-list');
        historyList.innerHTML = '';
        
        if (this.conversationHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">Henüz görev geçmişi yok</div>';
            return;
        }
        
        this.conversationHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-header">
                    <span class="history-time">${new Date(item.timestamp).toLocaleString('tr-TR')}</span>
                    <span class="history-status ${item.success ? 'success' : 'error'}">
                        ${item.success ? '✅' : '❌'}
                    </span>
                </div>
                <div class="history-command">${item.command}</div>
                <div class="history-summary">${item.summary}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }
    
    exportData(format) {
        const data = {
            history: this.conversationHistory,
            settings: this.getSettings(),
            timestamp: new Date().toISOString()
        };
        
        let content, filename, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            filename = `firsat-avcisi-${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format === 'markdown') {
            content = this.generateMarkdownReport(data);
            filename = `firsat-avcisi-${Date.now()}.md`;
            mimeType = 'text/markdown';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    generateMarkdownReport(data) {
        let markdown = `# Fırsat Avcısı Raporu\n\n`;
        markdown += `**Oluşturulma Tarihi:** ${new Date(data.timestamp).toLocaleString('tr-TR')}\n\n`;
        markdown += `## Görev Geçmişi (${data.history.length} görev)\n\n`;
        
        data.history.forEach((item, index) => {
            markdown += `### ${index + 1}. ${item.success ? '✅' : '❌'} ${item.command}\n`;
            markdown += `**Tarih:** ${new Date(item.timestamp).toLocaleString('tr-TR')}\n`;
            markdown += `**Sonuç:** ${item.summary}\n\n`;
        });
        
        return markdown;
    }
    
    getSettings() {
        return {
            autoValidation: this.sidebar.querySelector('#auto-validation')?.checked || true,
            detailedLogs: this.sidebar.querySelector('#detailed-logs')?.checked || false,
            soundNotifications: this.sidebar.querySelector('#sound-notifications')?.checked || false
        };
    }
    
    loadStoredData() {
        // Görünürlük durumunu yükle
        const isVisible = localStorage.getItem('nanobrowser_visible') === 'true';
        const isMinimized = localStorage.getItem('nanobrowser_minimized') === 'true';
        
        if (isVisible) {
            if (isMinimized) {
                this.toggleMinimize();
            } else {
                this.show();
            }
        }
        
        // Görev sayacını yükle
        const taskCount = localStorage.getItem('nanobrowser_task_count') || '0';
        this.sidebar.querySelector('#task-count').textContent = taskCount;
    }
    
    loadHistory() {
        const stored = localStorage.getItem('nanobrowser_history');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveHistory() {
        localStorage.setItem('nanobrowser_history', JSON.stringify(this.conversationHistory));
    }
    
    adjustPageLayout() {
        // Sayfa layout'unu ayarla
        if (this.isVisible && !this.isMinimized) {
            document.body.classList.add('nanobrowser-active');
        }
    }
}

// Global sidebar instance
let nanobrowserSidebar = null;

// Background script'ten mesaj dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSidebar') {
        if (!nanobrowserSidebar) {
            nanobrowserSidebar = new NanobrowserStyleSidebar();
        }
        
        if (nanobrowserSidebar.isVisible) {
            nanobrowserSidebar.hide();
        } else {
            nanobrowserSidebar.show();
        }
        
        sendResponse({ success: true });
    }
});

// Sayfa yüklendiğinde sidebar'ı başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        nanobrowserSidebar = new NanobrowserStyleSidebar();
    });
} else {
    nanobrowserSidebar = new NanobrowserStyleSidebar();
}

console.log('🎯 Nanobrowser Style Content Script loaded');

