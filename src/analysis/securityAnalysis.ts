export class SecurityAnalysis {
    private vulnerabilities: string[] = [];
    private cache = new Map<string, string[]>();
    private readonly maxCacheSize = 100;

    // Enhanced security patterns with comprehensive vulnerability detection
    private readonly securityPatterns = [
        // Code Injection Vulnerabilities
        {
            pattern: /\beval\s*\(/gi,
            message: 'Critical: Code injection vulnerability - Use of eval()',
            severity: 'CRITICAL',
            category: 'Code Injection',
            cwe: 'CWE-94'
        },
        {
            pattern: /new\s+Function\s*\(/gi,
            message: 'Critical: Code injection risk - Use of Function constructor',
            severity: 'CRITICAL',
            category: 'Code Injection',
            cwe: 'CWE-94'
        },
        {
            pattern: /setTimeout\s*\(\s*['"`][^'"`]*['"`]/gi,
            message: 'High: Code injection risk - setTimeout with string argument',
            severity: 'HIGH',
            category: 'Code Injection',
            cwe: 'CWE-94'
        },
        {
            pattern: /setInterval\s*\(\s*['"`][^'"`]*['"`]/gi,
            message: 'High: Code injection risk - setInterval with string argument',
            severity: 'HIGH',
            category: 'Code Injection',
            cwe: 'CWE-94'
        },

        // XSS Vulnerabilities
        {
            pattern: /innerHTML\s*=.*(?:user|input|param|req\.|query|body)/gi,
            message: 'Critical: XSS vulnerability - innerHTML assignment with user data',
            severity: 'CRITICAL',
            category: 'Cross-Site Scripting',
            cwe: 'CWE-79'
        },
        {
            pattern: /document\.write\s*\(/gi,
            message: 'High: XSS vulnerability - Use of document.write()',
            severity: 'HIGH',
            category: 'Cross-Site Scripting',
            cwe: 'CWE-79'
        },
        {
            pattern: /\.innerHTML\s*\+=|\.outerHTML\s*=/gi,
            message: 'Medium: Potential XSS - Direct HTML manipulation',
            severity: 'MEDIUM',
            category: 'Cross-Site Scripting',
            cwe: 'CWE-79'
        },
        {
            pattern: /dangerouslySetInnerHTML/gi,
            message: 'High: XSS risk - dangerouslySetInnerHTML without sanitization',
            severity: 'HIGH',
            category: 'Cross-Site Scripting',
            cwe: 'CWE-79'
        },

        // SQL Injection
        {
            pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*\+.*(?:req\.|input|param|user)/gi,
            message: 'Critical: SQL injection vulnerability - String concatenation in SQL query',
            severity: 'CRITICAL',
            category: 'SQL Injection',
            cwe: 'CWE-89'
        },
        {
            pattern: /query\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi,
            message: 'Critical: SQL injection - Dynamic query construction',
            severity: 'CRITICAL',
            category: 'SQL Injection',
            cwe: 'CWE-89'
        },
        {
            pattern: /execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi,
            message: 'Critical: SQL injection - Dynamic execute statement',
            severity: 'CRITICAL',
            category: 'SQL Injection',
            cwe: 'CWE-89'
        },

        // Authentication & Authorization
        {
            pattern: /(?:password|secret|key|token).*console\.log/gi,
            message: 'Critical: Information disclosure - Sensitive data logged to console',
            severity: 'CRITICAL',
            category: 'Information Disclosure',
            cwe: 'CWE-532'
        },
        {
            pattern: /localStorage\.setItem.*(?:password|token|secret|jwt)/gi,
            message: 'High: Sensitive data stored in localStorage (accessible via XSS)',
            severity: 'HIGH',
            category: 'Insecure Storage',
            cwe: 'CWE-922'
        },
        {
            pattern: /sessionStorage\.setItem.*(?:password|token|secret|jwt)/gi,
            message: 'High: Sensitive data stored in sessionStorage',
            severity: 'HIGH',
            category: 'Insecure Storage',
            cwe: 'CWE-922'
        },
        {
            pattern: /Math\.random\(\).*(?:password|token|id|key|session)/gi,
            message: 'Critical: Cryptographically weak random number generation',
            severity: 'CRITICAL',
            category: 'Weak Cryptography',
            cwe: 'CWE-338'
        },

        // Network Security
        {
            pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/gi,
            message: 'Medium: Insecure protocol - Use HTTPS instead of HTTP',
            severity: 'MEDIUM',
            category: 'Insecure Communication',
            cwe: 'CWE-319'
        },
        {
            pattern: /fetch\s*\(\s*['"`]http:\/\//gi,
            message: 'Medium: Insecure HTTP request - Use HTTPS',
            severity: 'MEDIUM',
            category: 'Insecure Communication',
            cwe: 'CWE-319'
        },
        {
            pattern: /XMLHttpRequest.*open\s*\(\s*['"`]GET['"`]\s*,\s*['"`]http:/gi,
            message: 'Medium: Insecure AJAX request over HTTP',
            severity: 'MEDIUM',
            category: 'Insecure Communication',
            cwe: 'CWE-319'
        },

        // File System & Path Traversal
        {
            pattern: /readFile\s*\(.*(?:req\.|input|param|user)/gi,
            message: 'High: Path traversal vulnerability - User input in file path',
            severity: 'HIGH',
            category: 'Path Traversal',
            cwe: 'CWE-22'
        },
        {
            pattern: /writeFile\s*\(.*(?:req\.|input|param|user)/gi,
            message: 'High: Path traversal vulnerability - User input in file write',
            severity: 'HIGH',
            category: 'Path Traversal',
            cwe: 'CWE-22'
        },
        {
            pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/gi,
            message: 'Medium: Potential path traversal sequence detected',
            severity: 'MEDIUM',
            category: 'Path Traversal',
            cwe: 'CWE-22'
        },

        // Command Injection
        {
            pattern: /exec\s*\(.*(?:req\.|input|param|user)/gi,
            message: 'Critical: Command injection vulnerability - User input in exec()',
            severity: 'CRITICAL',
            category: 'Command Injection',
            cwe: 'CWE-78'
        },
        {
            pattern: /spawn\s*\(.*(?:req\.|input|param|user)/gi,
            message: 'Critical: Command injection vulnerability - User input in spawn()',
            severity: 'CRITICAL',
            category: 'Command Injection',
            cwe: 'CWE-78'
        },
        {
            pattern: /system\s*\(.*(?:req\.|input|param|user)/gi,
            message: 'Critical: Command injection vulnerability - User input in system()',
            severity: 'CRITICAL',
            category: 'Command Injection',
            cwe: 'CWE-78'
        },

        // DevOps & Infrastructure Security
        {
            pattern: /FROM\s+.*:latest/gi,
            message: 'Medium: Docker security - Avoid using :latest tag in production',
            severity: 'MEDIUM',
            category: 'DevOps Security',
            cwe: 'CWE-1188'
        },
        {
            pattern: /USER\s+root/gi,
            message: 'High: Docker security - Running as root user',
            severity: 'HIGH',
            category: 'DevOps Security',
            cwe: 'CWE-250'
        },
        {
            pattern: /COPY\s+\.\s+\./gi,
            message: 'Low: Docker security - Copying entire context (consider .dockerignore)',
            severity: 'LOW',
            category: 'DevOps Security',
            cwe: 'CWE-200'
        },
        {
            pattern: /kubectl\s+.*--insecure-skip-tls-verify/gi,
            message: 'High: Kubernetes security - Skipping TLS verification',
            severity: 'HIGH',
            category: 'DevOps Security',
            cwe: 'CWE-295'
        },

        // API Security
        {
            pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi,
            message: 'High: CORS misconfiguration - Allowing all origins (*)',
            severity: 'HIGH',
            category: 'API Security',
            cwe: 'CWE-346'
        },
        {
            pattern: /app\.use\s*\(\s*cors\s*\(\s*\)\s*\)/gi,
            message: 'Medium: CORS enabled without restrictions',
            severity: 'MEDIUM',
            category: 'API Security',
            cwe: 'CWE-346'
        },
        {
            pattern: /express\.static\s*\(.*\)\s*(?!.*\{.*dotfiles.*\})/gi,
            message: 'Medium: Static file serving without dotfiles protection',
            severity: 'MEDIUM',
            category: 'API Security',
            cwe: 'CWE-200'
        },

        // Cryptography
        {
            pattern: /md5|sha1(?!.*hmac)/gi,
            message: 'Medium: Weak cryptographic hash function (MD5/SHA1)',
            severity: 'MEDIUM',
            category: 'Weak Cryptography',
            cwe: 'CWE-327'
        },
        {
            pattern: /DES|3DES|RC4/gi,
            message: 'High: Weak encryption algorithm detected',
            severity: 'HIGH',
            category: 'Weak Cryptography',
            cwe: 'CWE-327'
        },

        // Social Engineering & UI Security
        {
            pattern: /(?:prompt|confirm|alert)\s*\(/gi,
            message: 'Low: User interaction dialogs may be used for social engineering',
            severity: 'LOW',
            category: 'Social Engineering',
            cwe: 'CWE-1021'
        },
        {
            pattern: /window\.open\s*\(/gi,
            message: 'Low: Popup windows may be blocked or used maliciously',
            severity: 'LOW',
            category: 'UI Security',
            cwe: 'CWE-1021'
        },

        // Database Security
        {
            pattern: /password\s*=\s*['"`]['"`]/gi,
            message: 'High: Empty database password detected',
            severity: 'HIGH',
            category: 'Database Security',
            cwe: 'CWE-521'
        },
        {
            pattern: /trust_server_certificate\s*=\s*true/gi,
            message: 'Medium: Database connection trusting server certificate',
            severity: 'MEDIUM',
            category: 'Database Security',
            cwe: 'CWE-295'
        }
    ];

    public async analyzeSecurity(code: string): Promise<string[]> {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return [];
        }

        // Check cache first
        const codeHash = this.hashCode(code);
        if (this.cache.has(codeHash)) {
            return this.cache.get(codeHash)!;
        }

        try {
            const vulnerabilities: string[] = [];

            // Use Promise.all for parallel pattern matching (if needed for heavy operations)
            // For now, keep it synchronous as regex operations are fast
            for (const { pattern, message, severity } of this.securityPatterns) {
                const matches = code.match(pattern);
                if (matches) {
                    vulnerabilities.push(`[${severity}] ${message} (Found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
                }
            }

            this.vulnerabilities = vulnerabilities;
            
            // Cache the result
            this.cacheResult(codeHash, vulnerabilities);
            
            return vulnerabilities;
        } catch (error) {
            console.error('Error analyzing security:', error);
            return ['Error occurred during security analysis'];
        }
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

    private extractVulnerabilities(output: string): string[] {
        // Enhanced vulnerability extraction logic
        return output.split('\n')
            .filter(line => line.includes('VULNERABILITY') || line.includes('SECURITY'))
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    public getVulnerabilitiesBySeverity(): { high: string[]; medium: string[]; low: string[] } {
        return {
            high: this.vulnerabilities.filter(v => v.includes('[HIGH]')),
            medium: this.vulnerabilities.filter(v => v.includes('[MEDIUM]')),
            low: this.vulnerabilities.filter(v => v.includes('[LOW]'))
        };
    }

    public getVulnerabilities(): string[] {
        return this.vulnerabilities;
    }
}