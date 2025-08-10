export interface NotificationOptions {
    showProgress?: boolean;
    showInStatusBar?: boolean;
    autoHide?: boolean;
    actions?: Array<{
        title: string;
        command: string;
        arguments?: any[];
    }>;
}
export declare class NotificationManager {
    private static instance;
    private progressResolvers;
    private constructor();
    static getInstance(): NotificationManager;
    showAnalysisStarted(analysisType: string, options?: NotificationOptions): Promise<void>;
    showAnalysisCompleted(analysisType: string, results: any, options?: NotificationOptions): Promise<void>;
    showAnalysisError(analysisType: string, error: string): Promise<void>;
    showQuickTip(tip: string, category: string): Promise<void>;
    showSecurityAlert(vulnerability: any): Promise<void>;
    showSecretAlert(secret: any): Promise<void>;
    showWelcomeMessage(): Promise<void>;
    showUpdateNotification(version: string, features: string[]): Promise<void>;
    private showProgressNotification;
    private showNotification;
    showContextualHelp(context: string): Promise<void>;
}
//# sourceMappingURL=notificationManager.d.ts.map