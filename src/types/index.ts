export interface AnalysisResult {
    success?: boolean;
    message?: string;
    vulnerabilities?: string[];
    qualityMetrics?: QualityMetrics;
    qualityScore?: number;
    issues?: string[];
    secrets?: string[];
    secretsDetected?: string[];
    count?: number;
}

export interface QualityMetrics {
    maintainabilityScore: number;
    complexityScore: number;
    technicalDebt: number;
}

export interface AiSuggestion {
    suggestion: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
}

export interface SecurityVulnerability {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    line?: number;
    column?: number;
    file?: string;
}

export interface SecretMatch {
    type: string;
    value: string;
    line: number;
    column: number;
    confidence: number;
}