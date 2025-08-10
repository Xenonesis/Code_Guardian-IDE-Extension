import * as vscode from 'vscode';
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    analysisContext?: any;
}
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    lastActivity: Date;
}
export declare class GuardianChatbot {
    private sessions;
    private currentSessionId;
    private context;
    constructor(context: vscode.ExtensionContext);
    createNewSession(): string;
    sendMessage(message: string, analysisContext?: any): Promise<ChatMessage>;
    private generateResponse;
    private processUserQuery;
    private handleSecurityQuery;
    private handleQualityQuery;
    private handleSecretQuery;
    private handleAnalysisQuery;
    private handleBestPracticesQuery;
    private handleHelpQuery;
    private handleFixQuery;
    private handleGeneralQuery;
    getCurrentSession(): ChatSession | null;
    getAllSessions(): ChatSession[];
    switchToSession(sessionId: string): boolean;
    deleteSession(sessionId: string): boolean;
    clearAllSessions(): void;
    private generateSessionId;
    private generateMessageId;
    private saveSessions;
    private loadSessions;
}
//# sourceMappingURL=chatbot.d.ts.map