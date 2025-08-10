import * as vscode from 'vscode';
import { GuardianChatbot } from '../ai/chatbot';
export declare class ChatbotWebview {
    private panel;
    private context;
    private chatbot;
    private currentAnalysisData;
    constructor(context: vscode.ExtensionContext, chatbot: GuardianChatbot);
    createChatbotPanel(analysisData?: any): void;
    updateAnalysisContext(analysisData: any): void;
    private setupWebviewMessageHandling;
    private handleSendMessage;
    private handleNewSession;
    private handleLoadSession;
    private handleDeleteSession;
    private handleClearAllSessions;
    private loadCurrentSession;
    private loadAllSessions;
    private getChatbotHtml;
    dispose(): void;
}
//# sourceMappingURL=chatbotWebview.d.ts.map