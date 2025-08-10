"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotWebview = void 0;
const vscode = __importStar(require("vscode"));
class ChatbotWebview {
    constructor(context, chatbot) {
        this.currentAnalysisData = {};
        this.context = context;
        this.chatbot = chatbot;
    }
    createChatbotPanel(analysisData) {
        if (analysisData) {
            this.currentAnalysisData = analysisData;
        }
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('guardianChatbot', '🤖 Guardian Security Assistant', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [this.context.extensionUri]
        });
        this.panel.webview.html = this.getChatbotHtml();
        this.setupWebviewMessageHandling();
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        // Load current session if exists
        this.loadCurrentSession();
    }
    updateAnalysisContext(analysisData) {
        this.currentAnalysisData = analysisData;
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'analysisContextUpdated',
                data: analysisData
            });
        }
    }
    setupWebviewMessageHandling() {
        if (!this.panel) {
            return;
        }
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'sendMessage':
                    await this.handleSendMessage(message.content);
                    break;
                case 'newSession':
                    await this.handleNewSession();
                    break;
                case 'loadSession':
                    await this.handleLoadSession(message.sessionId);
                    break;
                case 'deleteSession':
                    await this.handleDeleteSession(message.sessionId);
                    break;
                case 'clearAllSessions':
                    await this.handleClearAllSessions();
                    break;
                case 'ready':
                    this.loadCurrentSession();
                    break;
            }
        });
    }
    async handleSendMessage(content) {
        try {
            const response = await this.chatbot.sendMessage(content, this.currentAnalysisData);
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'messageReceived',
                    message: response
                });
            }
        }
        catch (error) {
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'error',
                    message: `Error: ${error}`
                });
            }
        }
    }
    async handleNewSession() {
        this.chatbot.createNewSession(); // Session ID not needed in current implementation
        this.loadCurrentSession();
    }
    async handleLoadSession(sessionId) {
        if (this.chatbot.switchToSession(sessionId)) {
            this.loadCurrentSession();
        }
    }
    async handleDeleteSession(sessionId) {
        if (this.chatbot.deleteSession(sessionId)) {
            this.loadAllSessions();
            this.loadCurrentSession();
        }
    }
    async handleClearAllSessions() {
        this.chatbot.clearAllSessions();
        this.loadAllSessions();
        this.loadCurrentSession();
    }
    loadCurrentSession() {
        if (!this.panel) {
            return;
        }
        const currentSession = this.chatbot.getCurrentSession();
        this.panel.webview.postMessage({
            type: 'sessionLoaded',
            session: currentSession
        });
        this.loadAllSessions();
    }
    loadAllSessions() {
        if (!this.panel) {
            return;
        }
        const allSessions = this.chatbot.getAllSessions();
        this.panel.webview.postMessage({
            type: 'sessionsLoaded',
            sessions: allSessions.map(session => ({
                id: session.id,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                messageCount: session.messages.length,
                preview: session.messages.length > 1 ?
                    session.messages[1].content.substring(0, 50) + '...' :
                    'New conversation'
            }))
        });
    }
    getChatbotHtml() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardian Security Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .header h1 {
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }

        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .main-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .sidebar {
            width: 250px;
            background: var(--vscode-sideBar-background);
            border-right: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-weight: 600;
            font-size: 13px;
        }

        .sessions-list {
            flex: 1;
            overflow-y: auto;
        }

        .session-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-panel-border);
            transition: background-color 0.2s;
        }

        .session-item:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .session-item.active {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .session-preview {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .session-date {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }

        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .message {
            display: flex;
            gap: 12px;
            max-width: 80%;
        }

        .message.user {
            align-self: flex-end;
            flex-direction: row-reverse;
        }

        .message.assistant {
            align-self: flex-start;
        }

        .message.system {
            align-self: center;
            max-width: 90%;
        }

        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }

        .message.user .message-avatar {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .message.assistant .message-avatar {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .message.system .message-avatar {
            background: var(--vscode-notificationsInfoIcon-foreground);
            color: white;
        }

        .message-content {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 12px;
            padding: 12px 16px;
            flex: 1;
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .message.user .message-content {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .message-time {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .input-container {
            padding: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
            flex-shrink: 0;
        }

        .input-wrapper {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        .message-input {
            flex: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 12px 16px;
            font-family: inherit;
            font-size: 14px;
            resize: none;
            min-height: 44px;
            max-height: 120px;
        }

        .message-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .send-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.2s;
            height: 44px;
        }

        .send-btn:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .typing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--vscode-descriptionForeground);
            animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            gap: 16px;
        }

        .empty-state-icon {
            font-size: 48px;
            opacity: 0.5;
        }

        .context-indicator {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-bottom: 8px;
            display: inline-block;
        }

        .analysis-summary {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            font-size: 13px;
        }

        .scrollbar-style {
            scrollbar-width: thin;
            scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
        }

        .scrollbar-style::-webkit-scrollbar {
            width: 8px;
        }

        .scrollbar-style::-webkit-scrollbar-track {
            background: transparent;
        }

        .scrollbar-style::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 4px;
        }

        .scrollbar-style::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }

        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }
            
            .message {
                max-width: 95%;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            <span>🤖</span>
            Guardian Security Assistant
        </h1>
        <div class="header-actions">
            <button class="btn btn-secondary" onclick="newSession()">New Chat</button>
            <button class="btn btn-secondary" onclick="clearAllSessions()">Clear All</button>
        </div>
    </div>

    <div class="main-container">
        <div class="sidebar">
            <div class="sidebar-header">Chat History</div>
            <div class="sessions-list scrollbar-style" id="sessionsList">
                <!-- Sessions will be populated here -->
            </div>
        </div>

        <div class="chat-container">
            <div class="messages-container scrollbar-style" id="messagesContainer">
                <div class="empty-state" id="emptyState">
                    <div class="empty-state-icon">🤖</div>
                    <h3>Guardian Security Assistant</h3>
                    <p>I'm here to help you with security analysis, code quality questions, and best practices.</p>
                    <p>Start a conversation or run an analysis to get context-aware assistance!</p>
                </div>
            </div>

            <div class="typing-indicator" id="typingIndicator">
                <span>Guardian is thinking</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>

            <div class="input-container">
                <div class="input-wrapper">
                    <textarea 
                        class="message-input" 
                        id="messageInput" 
                        placeholder="Ask me about security, code quality, or best practices..."
                        rows="1"
                    ></textarea>
                    <button class="send-btn" id="sendBtn" onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentSession = null;
        let allSessions = [];
        let analysisContext = null;

        // Auto-resize textarea
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send message on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;

            // Add user message to UI immediately
            addMessageToUI({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            // Clear input and show typing indicator
            input.value = '';
            input.style.height = 'auto';
            showTypingIndicator();

            // Send to extension
            vscode.postMessage({
                type: 'sendMessage',
                content: message
            });
        }

        function addMessageToUI(message) {
            const container = document.getElementById('messagesContainer');
            const emptyState = document.getElementById('emptyState');
            
            if (emptyState) {
                emptyState.style.display = 'none';
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}\`;

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = message.role === 'user' ? '👤' : 
                                message.role === 'assistant' ? '🤖' : 'ℹ️';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Format message content
            let content = message.content;
            if (message.role === 'assistant') {
                content = formatAssistantMessage(content);
            }
            contentDiv.innerHTML = content;

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString();

            const contentWrapper = document.createElement('div');
            contentWrapper.appendChild(contentDiv);
            contentWrapper.appendChild(timeDiv);

            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentWrapper);

            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        }

        function formatAssistantMessage(content) {
            // Convert markdown-like formatting to HTML
            return content
                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                .replace(/\`(.*?)\`/g, '<code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">$1</code>')
                .replace(/^• (.+)$/gm, '<div style="margin-left: 16px;">• $1</div>')
                .replace(/^(\\d+\\. .+)$/gm, '<div style="margin-left: 16px;">$1</div>')
                .replace(/\\n/g, '<br>');
        }

        function showTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'flex';
            document.getElementById('sendBtn').disabled = true;
        }

        function hideTypingIndicator() {
            document.getElementById('typingIndicator').style.display = 'none';
            document.getElementById('sendBtn').disabled = false;
        }

        function newSession() {
            vscode.postMessage({ type: 'newSession' });
        }

        function loadSession(sessionId) {
            vscode.postMessage({ 
                type: 'loadSession', 
                sessionId: sessionId 
            });
        }

        function deleteSession(sessionId) {
            if (confirm('Are you sure you want to delete this chat session?')) {
                vscode.postMessage({ 
                    type: 'deleteSession', 
                    sessionId: sessionId 
                });
            }
        }

        function clearAllSessions() {
            if (confirm('Are you sure you want to clear all chat sessions?')) {
                vscode.postMessage({ type: 'clearAllSessions' });
            }
        }

        function renderSessions(sessions) {
            const container = document.getElementById('sessionsList');
            container.innerHTML = '';

            sessions.forEach(session => {
                const sessionDiv = document.createElement('div');
                sessionDiv.className = 'session-item';
                if (currentSession && session.id === currentSession.id) {
                    sessionDiv.classList.add('active');
                }

                sessionDiv.innerHTML = \`
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; min-width: 0;">
                            <div class="session-preview">\${session.preview}</div>
                            <div class="session-date">\${new Date(session.lastActivity).toLocaleDateString()}</div>
                        </div>
                        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="deleteSession('\${session.id}')">×</button>
                    </div>
                \`;

                sessionDiv.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') {
                        loadSession(session.id);
                    }
                });

                container.appendChild(sessionDiv);
            });
        }

        function renderCurrentSession(session) {
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';

            if (!session || !session.messages || session.messages.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🤖</div>
                        <h3>Guardian Security Assistant</h3>
                        <p>I'm here to help you with security analysis, code quality questions, and best practices.</p>
                        <p>Start a conversation or run an analysis to get context-aware assistance!</p>
                    </div>
                \`;
                return;
            }

            session.messages.forEach(message => {
                addMessageToUI(message);
            });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'sessionLoaded':
                    currentSession = message.session;
                    renderCurrentSession(currentSession);
                    break;

                case 'sessionsLoaded':
                    allSessions = message.sessions;
                    renderSessions(allSessions);
                    break;

                case 'messageReceived':
                    hideTypingIndicator();
                    addMessageToUI(message.message);
                    break;

                case 'analysisContextUpdated':
                    analysisContext = message.data;
                    // Show context indicator if analysis data is available
                    if (analysisContext && Object.keys(analysisContext).length > 0) {
                        showAnalysisContext();
                    }
                    break;

                case 'error':
                    hideTypingIndicator();
                    addMessageToUI({
                        role: 'system',
                        content: message.message,
                        timestamp: new Date()
                    });
                    break;
            }
        });

        function showAnalysisContext() {
            if (!analysisContext) return;

            const hasVulns = analysisContext.vulnerabilities?.length > 0;
            const hasSecrets = analysisContext.secrets?.length > 0;
            const qualityScore = analysisContext.qualityMetrics?.maintainabilityScore || 0;

            let contextMessage = "📊 **Analysis Context Available**\\n\\n";
            contextMessage += \`• Security: \${hasVulns ? analysisContext.vulnerabilities.length + ' issue(s)' : 'No issues'}\n\`;
            contextMessage += \`• Secrets: \${hasSecrets ? analysisContext.secrets.length + ' detected' : 'None found'}\n\`;
            contextMessage += \`• Quality Score: \${qualityScore}/100\n\n\`;
            contextMessage += "I can now provide context-aware assistance based on your analysis results!";

            addMessageToUI({
                role: 'system',
                content: contextMessage,
                timestamp: new Date()
            });
        }

        // Initialize
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
exports.ChatbotWebview = ChatbotWebview;
//# sourceMappingURL=chatbotWebview.js.map