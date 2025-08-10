import { AnalysisResult } from '../types/index';

export class SecretDetection {
    private detectedSecrets: string[] = [];
    private cache = new Map<string, string[]>();
    private readonly maxCacheSize = 100;

    // Enhanced secret patterns for comprehensive detection across all domains
    private readonly secretPatterns = [
        // Cloud Provider Keys (AWS, Azure, GCP)
        {
            name: 'AWS Access Key ID',
            pattern: /AKIA[0-9A-Z]{16}/g,
            confidence: 0.98,
            category: 'Cloud Credentials'
        },
        {
            name: 'AWS Secret Access Key',
            pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)['":\s]*['"][A-Za-z0-9/+=]{40}['"]/gi,
            confidence: 0.95,
            category: 'Cloud Credentials'
        },
        {
            name: 'AWS Session Token',
            pattern: /(?:aws_session_token|AWS_SESSION_TOKEN)['":\s]*['"][A-Za-z0-9/+=]{100,}['"]/gi,
            confidence: 0.95,
            category: 'Cloud Credentials'
        },
        {
            name: 'Azure Storage Account Key',
            pattern: /(?:DefaultEndpointsProtocol=https;AccountName=|AZURE_STORAGE_ACCOUNT)['":\s]*['"][A-Za-z0-9+/=]{88}['"]/gi,
            confidence: 0.95,
            category: 'Cloud Credentials'
        },
        {
            name: 'Google Cloud Service Account',
            pattern: /\{[^}]*"type":\s*"service_account"[^}]*\}/gi,
            confidence: 0.9,
            category: 'Cloud Credentials'
        },
        {
            name: 'Google API Key',
            pattern: /AIza[0-9A-Za-z_-]{35}/g,
            confidence: 0.95,
            category: 'Cloud Credentials'
        },

        // Version Control & CI/CD
        {
            name: 'GitHub Personal Access Token',
            pattern: /ghp_[a-zA-Z0-9]{36}/g,
            confidence: 0.98,
            category: 'Version Control'
        },
        {
            name: 'GitHub Fine-grained Token',
            pattern: /github_pat_[a-zA-Z0-9_]{82}/g,
            confidence: 0.98,
            category: 'Version Control'
        },
        {
            name: 'GitHub OAuth Token',
            pattern: /gho_[a-zA-Z0-9]{36}/g,
            confidence: 0.98,
            category: 'Version Control'
        },
        {
            name: 'GitLab Personal Access Token',
            pattern: /glpat-[a-zA-Z0-9_-]{20}/g,
            confidence: 0.98,
            category: 'Version Control'
        },
        {
            name: 'Bitbucket App Password',
            pattern: /(?:bitbucket|BITBUCKET)['":\s]*['"][A-Za-z0-9]{16}['"]/gi,
            confidence: 0.85,
            category: 'Version Control'
        },
        {
            name: 'Jenkins API Token',
            pattern: /(?:jenkins|JENKINS)['":\s]*['"][a-f0-9]{32}['"]/gi,
            confidence: 0.85,
            category: 'CI/CD'
        },
        {
            name: 'CircleCI Token',
            pattern: /(?:circle[_-]?ci|CIRCLE[_-]?CI)['":\s]*['"][a-f0-9]{40}['"]/gi,
            confidence: 0.9,
            category: 'CI/CD'
        },
        {
            name: 'Travis CI Token',
            pattern: /(?:travis|TRAVIS)['":\s]*['"][A-Za-z0-9_-]{22}['"]/gi,
            confidence: 0.85,
            category: 'CI/CD'
        },

        // Database Credentials
        {
            name: 'MongoDB Connection String',
            pattern: /mongodb(?:\+srv)?:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.95,
            category: 'Database'
        },
        {
            name: 'MySQL Connection String',
            pattern: /mysql:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.95,
            category: 'Database'
        },
        {
            name: 'PostgreSQL Connection String',
            pattern: /postgres(?:ql)?:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.95,
            category: 'Database'
        },
        {
            name: 'Redis Connection String',
            pattern: /redis:\/\/[^:\s'"]*:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.9,
            category: 'Database'
        },
        {
            name: 'Database Password (Generic)',
            pattern: /(?:db[_-]?password|database[_-]?password|DB[_-]?PASSWORD)['":\s]*['"][^'"]{8,}['"]/gi,
            confidence: 0.85,
            category: 'Database'
        },
        {
            name: 'SQL Server Connection String',
            pattern: /(?:server|data source)[^;]*;.*password[^;]*;/gi,
            confidence: 0.85,
            category: 'Database'
        },

        // API Keys & Tokens
        {
            name: 'Slack Bot Token',
            pattern: /xoxb-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g,
            confidence: 0.98,
            category: 'API Keys'
        },
        {
            name: 'Slack User Token',
            pattern: /xoxp-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g,
            confidence: 0.98,
            category: 'API Keys'
        },
        {
            name: 'Discord Bot Token',
            pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
            confidence: 0.95,
            category: 'API Keys'
        },
        {
            name: 'Stripe API Key',
            pattern: /sk_(?:live|test)_[a-zA-Z0-9]{24}/g,
            confidence: 0.98,
            category: 'API Keys'
        },
        {
            name: 'PayPal Client ID',
            pattern: /(?:paypal|PAYPAL)['":\s]*['"][A-Za-z0-9_-]{80}['"]/gi,
            confidence: 0.85,
            category: 'API Keys'
        },
        {
            name: 'Twilio Auth Token',
            pattern: /(?:twilio|TWILIO)['":\s]*['"][a-f0-9]{32}['"]/gi,
            confidence: 0.9,
            category: 'API Keys'
        },
        {
            name: 'SendGrid API Key',
            pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
            confidence: 0.98,
            category: 'API Keys'
        },
        {
            name: 'Mailgun API Key',
            pattern: /key-[a-f0-9]{32}/g,
            confidence: 0.9,
            category: 'API Keys'
        },

        // DevOps & Infrastructure
        {
            name: 'Docker Hub Token',
            pattern: /(?:docker[_-]?hub|DOCKER[_-]?HUB)['":\s]*['"][a-f0-9-]{36}['"]/gi,
            confidence: 0.85,
            category: 'DevOps'
        },
        {
            name: 'Kubernetes Service Account Token',
            pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
            confidence: 0.8,
            category: 'DevOps'
        },
        {
            name: 'Terraform Cloud Token',
            pattern: /(?:terraform|TERRAFORM)['":\s]*['"][A-Za-z0-9.]{14}['"]/gi,
            confidence: 0.85,
            category: 'DevOps'
        },
        {
            name: 'Ansible Vault Password',
            pattern: /\$ANSIBLE_VAULT;[0-9.]+;AES256/g,
            confidence: 0.98,
            category: 'DevOps'
        },

        // Cryptographic Keys
        {
            name: 'RSA Private Key',
            pattern: /-----BEGIN\s+RSA\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+RSA\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0,
            category: 'Cryptographic Keys'
        },
        {
            name: 'EC Private Key',
            pattern: /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+EC\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0,
            category: 'Cryptographic Keys'
        },
        {
            name: 'OpenSSH Private Key',
            pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+OPENSSH\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0,
            category: 'Cryptographic Keys'
        },
        {
            name: 'PGP Private Key',
            pattern: /-----BEGIN\s+PGP\s+PRIVATE\s+KEY\s+BLOCK-----[\s\S]*?-----END\s+PGP\s+PRIVATE\s+KEY\s+BLOCK-----/g,
            confidence: 1.0,
            category: 'Cryptographic Keys'
        },
        {
            name: 'Certificate Private Key',
            pattern: /-----BEGIN\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+PRIVATE\s+KEY-----/g,
            confidence: 1.0,
            category: 'Cryptographic Keys'
        },

        // Authentication & Session Tokens
        {
            name: 'JWT Token',
            pattern: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
            confidence: 0.9,
            category: 'Authentication'
        },
        {
            name: 'Bearer Token',
            pattern: /(?:bearer|Bearer)\s+[A-Za-z0-9_-]{20,}/g,
            confidence: 0.8,
            category: 'Authentication'
        },
        {
            name: 'Session Token',
            pattern: /(?:session[_-]?token|SESSION[_-]?TOKEN)['":\s]*['"][A-Za-z0-9+/=]{32,}['"]/gi,
            confidence: 0.8,
            category: 'Authentication'
        },
        {
            name: 'Auth Token (Generic)',
            pattern: /(?:auth[_-]?token|AUTH[_-]?TOKEN)['":\s]*['"][A-Za-z0-9+/=]{20,}['"]/gi,
            confidence: 0.75,
            category: 'Authentication'
        },

        // Generic Patterns (Lower Confidence)
        {
            name: 'API Key (Generic)',
            pattern: /(?:api[_-]?key|apikey|API[_-]?KEY)['":\s]*['"][a-zA-Z0-9]{16,}['"]/gi,
            confidence: 0.7,
            category: 'API Keys'
        },
        {
            name: 'Password (Hardcoded)',
            pattern: /(?:password|passwd|pwd|PASSWORD)['":\s]*['"][^'"]{8,}['"]/gi,
            confidence: 0.6,
            category: 'Credentials'
        },
        {
            name: 'Secret Key (Generic)',
            pattern: /(?:secret[_-]?key|secretkey|SECRET[_-]?KEY)['":\s]*['"][a-zA-Z0-9]{16,}['"]/gi,
            confidence: 0.7,
            category: 'Credentials'
        },
        {
            name: 'Access Token (Generic)',
            pattern: /(?:access[_-]?token|ACCESS[_-]?TOKEN)['":\s]*['"][A-Za-z0-9+/=]{20,}['"]/gi,
            confidence: 0.7,
            category: 'Authentication'
        },

        // Network & Communication
        {
            name: 'FTP Credentials',
            pattern: /ftp:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.95,
            category: 'Network'
        },
        {
            name: 'SMTP Credentials',
            pattern: /smtp:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.9,
            category: 'Network'
        },
        {
            name: 'SSH Connection String',
            pattern: /ssh:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g,
            confidence: 0.85,
            category: 'Network'
        },

        // Sensitive Data Patterns
        {
            name: 'Credit Card Number',
            pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
            confidence: 0.85,
            category: 'Sensitive Data'
        },
        {
            name: 'Social Security Number',
            pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
            confidence: 0.8,
            category: 'Sensitive Data'
        },
        {
            name: 'Email Address',
            pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            confidence: 0.5,
            category: 'Sensitive Data'
        },
        {
            name: 'Phone Number',
            pattern: /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
            confidence: 0.4,
            category: 'Sensitive Data'
        },

        // Encryption & Hashing
        {
            name: 'MD5 Hash',
            pattern: /\b[a-f0-9]{32}\b/gi,
            confidence: 0.3,
            category: 'Hashes'
        },
        {
            name: 'SHA1 Hash',
            pattern: /\b[a-f0-9]{40}\b/gi,
            confidence: 0.3,
            category: 'Hashes'
        },
        {
            name: 'SHA256 Hash',
            pattern: /\b[a-f0-9]{64}\b/gi,
            confidence: 0.3,
            category: 'Hashes'
        },
        {
            name: 'Base64 Encoded (Potential)',
            pattern: /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g,
            confidence: 0.2,
            category: 'Encoded Data'
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
        if (str.length === 0) {
            return hash.toString();
        }
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