import { AnalysisResult } from '../types/index';

export class SecretDetection {
    private detectedSecrets: string[] = [];
    private cache = new Map<string, string[]>();
    private readonly maxCacheSize = 100;

    // Pre-compiled patterns for better performance
    private readonly secretPatterns = [
        {
            name: 'AWS Access Key',
            pattern: /AKIA[0-9A-Z]{16}/g,
            confidence: 0.95
        },
        {
            name: 'AWS Secret Key',
            pattern: /[A-Za-z0-9/+=]{40}/g,
            confidence: 0.7
        },
        {
            name: 'GitHub Token (Classic)',
            pattern: /ghp_[a-zA-Z0-9]{36}/g,
            confidence: 0.95
        },
        {
            name: 'GitHub Token (Fine-grained)',
            pattern: /github_pat_[a-zA-Z0-9_]{82}/g,
            confidence: 0.95
        },
        {
            name: 'GitLab Token',
            pattern: /glpat-[a-zA-Z0-9_-]{20}/g,
            confidence: 0.95
        },
        {
            name: 'Google API Key',
            pattern: /AIza[0-9A-Za-z_-]{35}/g,
            confidence: 0.9
        },
        {
            name: 'Slack Token',
            pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g,
            confidence: 0.95
        },
        {
            name: 'Discord Bot Token',
            pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
            confidence: 0.9
        },
        {
            name: 'API Key (Generic)',
            pattern: /(?:api[_-]?key|apikey)['":\s]*['"][a-zA-Z0-9]{16,}['"]/gi,
            confidence: 0.8
        },
        {
            name: 'Password (Hardcoded)',
            pattern: /(?:password|passwd|pwd)['":\s]*['"][^'"]{8,}['"]/gi,
            confidence: 0.7
        },
        {
            name: 'Secret Key',
            pattern: /(?:secret[_-]?key|secretkey)['":\s]*['"][a-zA-Z0-9]{16,}['"]/gi,
            confidence: 0.8
        },
        {
            name: 'JWT Token',
            pattern: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
            confidence: 0.9
        },
        {
            name: 'Private Key (RSA)',
            pattern: /-----BEGIN\s+RSA\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0
        },
        {
            name: 'Private Key (Generic)',
            pattern: /-----BEGIN\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0
        },
        {
            name: 'SSH Private Key',
            pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0
        },
        {
            name: 'Database URL (MongoDB)',
            pattern: /mongodb(?:\+srv)?:\/\/[^\s'"]+/g,
            confidence: 0.85
        },
        {
            name: 'Database URL (MySQL)',
            pattern: /mysql:\/\/[^\s'"]+/g,
            confidence: 0.85
        },
        {
            name: 'Database URL (PostgreSQL)',
            pattern: /postgres(?:ql)?:\/\/[^\s'"]+/g,
            confidence: 0.85
        },
        {
            name: 'Redis URL',
            pattern: /redis:\/\/[^\s'"]+/g,
            confidence: 0.8
        },
        {
            name: 'FTP Credentials',
            pattern: /ftp:\/\/[^@\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.9
        },
        {
            name: 'Base64 Encoded (Potential)',
            pattern: /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g,
            confidence: 0.3
        },
        {
            name: 'Credit Card Number',
            pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
            confidence: 0.8
        },
        {
            name: 'Social Security Number',
            pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
            confidence: 0.7
        },
        {
            name: 'Phone Number',
            pattern: /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
            confidence: 0.5
        }
    ];

    public async detectSecrets(code: string): Promise<string[]> {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return [];
        }

        // Check cache first
        const codeHash = this.hashCode(code);
        if (this.cache.has(codeHash)) {
            return this.cache.get(codeHash)!;
        }

        this.detectedSecrets = [];
        const detectedSecrets: string[] = [];

        // Process patterns in batches to avoid blocking
        const batchSize = 5;
        for (let i = 0; i < this.secretPatterns.length; i += batchSize) {
            const batch = this.secretPatterns.slice(i, i + batchSize);
            
            for (const { name, pattern, confidence } of batch) {
                const matches = code.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        // Skip very common base64 patterns that are likely false positives
                        if (name === 'Base64 Encoded (Potential)' && match.length < 20) {
                            continue;
                        }
                        
                        // Mask sensitive data for display
                        const maskedMatch = this.maskSensitiveData(match);
                        const severity = this.getSeverityLevel(confidence);
                        const secretInfo = `[${severity}] ${name}: ${maskedMatch} (confidence: ${(confidence * 100).toFixed(0)}%)`;
                        detectedSecrets.push(secretInfo);
                        this.detectedSecrets.push(match);
                    }
                }
            }
            
            // Yield control to prevent blocking
            if (i + batchSize < this.secretPatterns.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Cache the result
        this.cacheResult(codeHash, detectedSecrets);
        return detectedSecrets;
    }

    public getDetectedSecrets(): AnalysisResult {
        return {
            secrets: this.detectedSecrets,
            count: this.detectedSecrets.length
        };
    }

    private maskSensitiveData(data: string): string {
        if (data.length <= 8) {
            return '*'.repeat(data.length);
        }
        const visibleChars = Math.min(4, Math.floor(data.length * 0.2));
        const start = data.substring(0, visibleChars);
        const end = data.substring(data.length - visibleChars);
        const masked = '*'.repeat(Math.max(1, data.length - (visibleChars * 2)));
        return `${start}${masked}${end}`;
    }

    private getSeverityLevel(confidence: number): string {
        if (confidence >= 0.9) {
            return 'CRITICAL';
        }
        if (confidence >= 0.8) {
            return 'HIGH';
        }
        if (confidence >= 0.6) {
            return 'MEDIUM';
        }
        return 'LOW';
    }

    public getSecretsBySeverity(): { critical: string[]; high: string[]; medium: string[]; low: string[] } {
        const results: { critical: string[]; high: string[]; medium: string[]; low: string[] } = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
        
        this.detectedSecrets.forEach(secret => {
            if (secret.includes('[CRITICAL]')) {
                results.critical.push(secret);
            } else if (secret.includes('[HIGH]')) {
                results.high.push(secret);
            } else if (secret.includes('[MEDIUM]')) {
                results.medium.push(secret);
            } else if (secret.includes('[LOW]')) {
                results.low.push(secret);
            }
        });
        
        return results;
    }

    private hashCode(str: string): string {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    private cacheResult(key: string, result: string[]): void {
        // Implement LRU cache behavior
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    public clearCache(): void {
        this.cache.clear();
    }
}