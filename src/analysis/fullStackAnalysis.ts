import { SecurityVulnerability } from '../types';

export interface FullStackSecurityResult {
    vulnerabilities: SecurityVulnerability[];
    frontendIssues: string[];
    backendIssues: string[];
    apiIssues: string[];
    authenticationIssues: string[];
    dataValidationIssues: string[];
    sessionManagementIssues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class FullStackAnalysis {
    private cache = new Map<string, FullStackSecurityResult>();
    private readonly maxCacheSize = 100;

    // Full-Stack Security Patterns
    private readonly fullStackPatterns = [
        // Frontend Security Issues
        {
            pattern: /dangerouslySetInnerHTML.*\{.*__html:/gi,
            message: 'Critical: XSS vulnerability - dangerouslySetInnerHTML without sanitization',
            severity: 'critical' as const,
            category: 'Frontend Security',
            cwe: 'CWE-79',
            type: 'Cross-Site Scripting'
        },
        {
            pattern: /innerHTML\s*=.*(?:props\.|state\.|user|input)/gi,
            message: 'High: XSS risk - innerHTML with dynamic content',
            severity: 'high' as const,
            category: 'Frontend Security',
            cwe: 'CWE-79',
            type: 'DOM Manipulation'
        },
        {
            pattern: /document\.cookie\s*=.*(?:user|input|param)/gi,
            message: 'High: Cookie manipulation with user input',
            severity: 'high' as const,
            category: 'Frontend Security',
            cwe: 'CWE-79',
            type: 'Cookie Injection'
        },
        {
            pattern: /localStorage\.setItem.*(?:token|password|secret|key)/gi,
            message: 'High: Sensitive data stored in localStorage (accessible via XSS)',
            severity: 'high' as const,
            category: 'Frontend Security',
            cwe: 'CWE-922',
            type: 'Insecure Storage'
        },
        {
            pattern: /window\.postMessage\s*\(\s*.*,\s*['"`]\*['"`]/gi,
            message: 'High: postMessage with wildcard origin (*)',
            severity: 'high' as const,
            category: 'Frontend Security',
            cwe: 'CWE-346',
            type: 'Origin Validation'
        },
        {
            pattern: /fetch\s*\(\s*.*\+.*(?:user|input|param)/gi,
            message: 'Medium: Dynamic URL construction in fetch request',
            severity: 'medium' as const,
            category: 'Frontend Security',
            cwe: 'CWE-918',
            type: 'URL Manipulation'
        },

        // Backend Security Issues
        {
            pattern: /app\.use\s*\(\s*cors\s*\(\s*\)\s*\)/gi,
            message: 'Medium: CORS enabled without restrictions',
            severity: 'medium' as const,
            category: 'Backend Security',
            cwe: 'CWE-346',
            type: 'CORS Misconfiguration'
        },
        {
            pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi,
            message: 'High: CORS allowing all origins (*)',
            severity: 'high' as const,
            category: 'Backend Security',
            cwe: 'CWE-346',
            type: 'CORS Wildcard'
        },
        {
            pattern: /app\.use\s*\(\s*express\.static\s*\(.*\)\s*\)/gi,
            message: 'Medium: Static file serving without restrictions',
            severity: 'medium' as const,
            category: 'Backend Security',
            cwe: 'CWE-200',
            type: 'File Exposure'
        },
        {
            pattern: /process\.env\.NODE_ENV\s*!==\s*['"`]production['"`].*console\.log/gi,
            message: 'Low: Debug logging may leak sensitive information',
            severity: 'low' as const,
            category: 'Backend Security',
            cwe: 'CWE-532',
            type: 'Information Disclosure'
        },

        // API Security Issues
        {
            pattern: /app\.(?:get|post|put|delete)\s*\(\s*['"`][^'"`]*['"`]\s*,\s*(?!.*auth|.*middleware)/gi,
            message: 'Medium: API endpoint without authentication middleware',
            severity: 'medium' as const,
            category: 'API Security',
            cwe: 'CWE-306',
            type: 'Missing Authentication'
        },
        {
            pattern: /res\.json\s*\(\s*.*password.*\)/gi,
            message: 'High: Password field in API response',
            severity: 'high' as const,
            category: 'API Security',
            cwe: 'CWE-200',
            type: 'Sensitive Data Exposure'
        },
        {
            pattern: /app\.use\s*\(\s*['"`]\/api['"`].*(?!.*rate.*limit)/gi,
            message: 'Medium: API without rate limiting',
            severity: 'medium' as const,
            category: 'API Security',
            cwe: 'CWE-770',
            type: 'Missing Rate Limiting'
        },
        {
            pattern: /req\.query\.\w+.*(?:exec|eval|system)/gi,
            message: 'Critical: Command injection via query parameters',
            severity: 'critical' as const,
            category: 'API Security',
            cwe: 'CWE-78',
            type: 'Command Injection'
        },

        // Authentication Issues
        {
            pattern: /jwt\.sign\s*\(\s*.*,\s*['"`]['"`]/gi,
            message: 'Critical: JWT signed with empty secret',
            severity: 'critical' as const,
            category: 'Authentication',
            cwe: 'CWE-327',
            type: 'Weak JWT Secret'
        },
        {
            pattern: /jwt\.sign\s*\(\s*.*,\s*['"`]secret['"`]/gi,
            message: 'High: JWT signed with weak secret',
            severity: 'high' as const,
            category: 'Authentication',
            cwe: 'CWE-327',
            type: 'Weak JWT Secret'
        },
        {
            pattern: /bcrypt\.compare\s*\(\s*.*,\s*.*\)\s*(?!\.then|\.catch|await)/gi,
            message: 'Medium: bcrypt.compare without proper async handling',
            severity: 'medium' as const,
            category: 'Authentication',
            cwe: 'CWE-287',
            type: 'Authentication Logic'
        },
        {
            pattern: /passport\.authenticate\s*\(\s*['"`]local['"`]\s*,\s*\{\s*session\s*:\s*false/gi,
            message: 'Low: Passport authentication without session',
            severity: 'low' as const,
            category: 'Authentication',
            cwe: 'CWE-287',
            type: 'Session Management'
        },

        // Session Management
        {
            pattern: /session\s*\(\s*\{\s*secret\s*:\s*['"`](?:secret|default|key)['"`]/gi,
            message: 'High: Weak session secret',
            severity: 'high' as const,
            category: 'Session Management',
            cwe: 'CWE-327',
            type: 'Weak Session Secret'
        },
        {
            pattern: /session\s*\(\s*\{[^}]*secure\s*:\s*false/gi,
            message: 'Medium: Session cookies not marked as secure',
            severity: 'medium' as const,
            category: 'Session Management',
            cwe: 'CWE-614',
            type: 'Insecure Cookie'
        },
        {
            pattern: /session\s*\(\s*\{[^}]*httpOnly\s*:\s*false/gi,
            message: 'Medium: Session cookies accessible via JavaScript',
            severity: 'medium' as const,
            category: 'Session Management',
            cwe: 'CWE-1004',
            type: 'Cookie Accessibility'
        },
        {
            pattern: /res\.cookie\s*\(\s*.*,\s*.*,\s*\{[^}]*secure\s*:\s*false/gi,
            message: 'Medium: Cookie not marked as secure',
            severity: 'medium' as const,
            category: 'Session Management',
            cwe: 'CWE-614',
            type: 'Insecure Cookie'
        },

        // Data Validation Issues
        {
            pattern: /req\.body\.\w+.*(?!.*validate|.*sanitize|.*escape)/gi,
            message: 'Medium: Request body used without validation',
            severity: 'medium' as const,
            category: 'Data Validation',
            cwe: 'CWE-20',
            type: 'Input Validation'
        },
        {
            pattern: /req\.params\.\w+.*(?:query|exec|system)/gi,
            message: 'High: URL parameters used in dangerous operations',
            severity: 'high' as const,
            category: 'Data Validation',
            cwe: 'CWE-20',
            type: 'Parameter Injection'
        },
        {
            pattern: /parseInt\s*\(\s*req\./gi,
            message: 'Low: parseInt without radix parameter',
            severity: 'low' as const,
            category: 'Data Validation',
            cwe: 'CWE-20',
            type: 'Number Parsing'
        },
        {
            pattern: /JSON\.parse\s*\(\s*req\./gi,
            message: 'Medium: JSON.parse without try-catch',
            severity: 'medium' as const,
            category: 'Data Validation',
            cwe: 'CWE-20',
            type: 'JSON Parsing'
        },

        // File Upload Security
        {
            pattern: /multer\s*\(\s*\{[^}]*(?!.*fileFilter)/gi,
            message: 'Medium: File upload without file type validation',
            severity: 'medium' as const,
            category: 'File Upload',
            cwe: 'CWE-434',
            type: 'Unrestricted File Upload'
        },
        {
            pattern: /req\.file\.path.*(?!.*sanitize|.*validate)/gi,
            message: 'High: File path used without validation',
            severity: 'high' as const,
            category: 'File Upload',
            cwe: 'CWE-22',
            type: 'Path Traversal'
        },

        // Error Handling
        {
            pattern: /catch\s*\(\s*\w+\s*\)\s*\{[^}]*res\.(?:send|json)\s*\(\s*\w+/gi,
            message: 'Medium: Error details exposed in response',
            severity: 'medium' as const,
            category: 'Error Handling',
            cwe: 'CWE-209',
            type: 'Information Disclosure'
        },
        {
            pattern: /process\.on\s*\(\s*['"`]uncaughtException['"`]/gi,
            message: 'Low: Uncaught exception handler - may mask security issues',
            severity: 'low' as const,
            category: 'Error Handling',
            cwe: 'CWE-248',
            type: 'Exception Handling'
        },

        // React/Vue/Angular Specific
        {
            pattern: /v-html\s*=\s*['"`]\{\{.*\}\}['"`]/gi,
            message: 'High: Vue.js v-html with interpolation - XSS risk',
            severity: 'high' as const,
            category: 'Frontend Framework',
            cwe: 'CWE-79',
            type: 'Template Injection'
        },
        {
            pattern: /\[innerHTML\]\s*=\s*['"`].*\{\{.*\}\}.*['"`]/gi,
            message: 'High: Angular innerHTML binding with interpolation',
            severity: 'high' as const,
            category: 'Frontend Framework',
            cwe: 'CWE-79',
            type: 'Template Injection'
        },
        {
            pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*fetch\s*\(/gi,
            message: 'Low: useEffect with fetch - ensure proper cleanup',
            severity: 'low' as const,
            category: 'Frontend Framework',
            cwe: 'CWE-404',
            type: 'Resource Management'
        },

        // WebSocket Security
        {
            pattern: /new\s+WebSocket\s*\(\s*['"`]ws:/gi,
            message: 'Medium: Insecure WebSocket connection (ws:// instead of wss://)',
            severity: 'medium' as const,
            category: 'WebSocket Security',
            cwe: 'CWE-319',
            type: 'Unencrypted Connection'
        },
        {
            pattern: /ws\.on\s*\(\s*['"`]message['"`].*(?!.*validate|.*sanitize)/gi,
            message: 'Medium: WebSocket message handler without validation',
            severity: 'medium' as const,
            category: 'WebSocket Security',
            cwe: 'CWE-20',
            type: 'Input Validation'
        },

        // GraphQL Security
        {
            pattern: /graphql\s*\(\s*\{[^}]*introspection\s*:\s*true/gi,
            message: 'Medium: GraphQL introspection enabled in production',
            severity: 'medium' as const,
            category: 'GraphQL Security',
            cwe: 'CWE-200',
            type: 'Information Disclosure'
        },
        {
            pattern: /graphql\s*\(\s*\{[^}]*(?!.*depth.*limit)/gi,
            message: 'Medium: GraphQL without query depth limiting',
            severity: 'medium' as const,
            category: 'GraphQL Security',
            cwe: 'CWE-770',
            type: 'Resource Exhaustion'
        }
    ];

    public async analyzeFullStackSecurity(code: string, framework: string = 'unknown'): Promise<FullStackSecurityResult> {
        if (!code || code.trim().length === 0) {
            return this.getEmptyResult();
        }

        // Check cache first
        const cacheKey = this.hashCode(code + framework);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const result = this.performAnalysis(code, framework);
        
        // Cache the result
        this.cacheResult(cacheKey, result);
        return result;
    }

    private performAnalysis(code: string, framework: string): FullStackSecurityResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const frontendIssues: string[] = [];
        const backendIssues: string[] = [];
        const apiIssues: string[] = [];
        const authenticationIssues: string[] = [];
        const dataValidationIssues: string[] = [];
        const sessionManagementIssues: string[] = [];

        // Get relevant patterns based on framework
        const relevantPatterns = this.getRelevantPatterns(framework);

        for (const pattern of relevantPatterns) {
            const matches = code.match(pattern.pattern);
            if (matches) {
                const vulnerability: SecurityVulnerability = {
                    type: pattern.type,
                    severity: pattern.severity,
                    description: pattern.message,
                    file: framework
                };

                vulnerabilities.push(vulnerability);

                // Categorize issues
                const issueText = `${pattern.message} (Found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`;
                
                switch (pattern.category) {
                    case 'Frontend Security':
                    case 'Frontend Framework':
                    case 'WebSocket Security':
                        frontendIssues.push(issueText);
                        break;
                    case 'Backend Security':
                    case 'Error Handling':
                        backendIssues.push(issueText);
                        break;
                    case 'API Security':
                    case 'GraphQL Security':
                        apiIssues.push(issueText);
                        break;
                    case 'Authentication':
                        authenticationIssues.push(issueText);
                        break;
                    case 'Data Validation':
                    case 'File Upload':
                        dataValidationIssues.push(issueText);
                        break;
                    case 'Session Management':
                        sessionManagementIssues.push(issueText);
                        break;
                    default:
                        backendIssues.push(issueText);
                }
            }
        }

        const severity = this.calculateOverallSeverity(vulnerabilities);

        return {
            vulnerabilities,
            frontendIssues,
            backendIssues,
            apiIssues,
            authenticationIssues,
            dataValidationIssues,
            sessionManagementIssues,
            severity
        };
    }

    private getRelevantPatterns(framework: string) {
        const fw = framework.toLowerCase();
        
        if (fw.includes('react') || fw.includes('jsx') || fw.includes('tsx')) {
            return this.fullStackPatterns.filter(p => 
                p.category.includes('Frontend') || 
                p.category.includes('API') ||
                p.category.includes('Authentication') ||
                p.message.includes('React') ||
                p.message.includes('dangerouslySetInnerHTML')
            );
        }
        
        if (fw.includes('vue')) {
            return this.fullStackPatterns.filter(p => 
                p.category.includes('Frontend') || 
                p.category.includes('API') ||
                p.message.includes('Vue') ||
                p.message.includes('v-html')
            );
        }
        
        if (fw.includes('angular')) {
            return this.fullStackPatterns.filter(p => 
                p.category.includes('Frontend') || 
                p.category.includes('API') ||
                p.message.includes('Angular') ||
                p.message.includes('innerHTML')
            );
        }
        
        if (fw.includes('express') || fw.includes('node') || fw.includes('backend')) {
            return this.fullStackPatterns.filter(p => 
                p.category.includes('Backend') || 
                p.category.includes('API') ||
                p.category.includes('Authentication') ||
                p.category.includes('Session') ||
                p.category.includes('Data Validation')
            );
        }

        // Return all patterns for unknown frameworks
        return this.fullStackPatterns;
    }

    private calculateOverallSeverity(vulnerabilities: SecurityVulnerability[]): 'low' | 'medium' | 'high' | 'critical' {
        if (vulnerabilities.some(v => v.severity === 'critical')) {
            return 'critical';
        }
        if (vulnerabilities.some(v => v.severity === 'high')) {
            return 'high';
        }
        if (vulnerabilities.some(v => v.severity === 'medium')) {
            return 'medium';
        }
        return 'low';
    }

    private getEmptyResult(): FullStackSecurityResult {
        return {
            vulnerabilities: [],
            frontendIssues: [],
            backendIssues: [],
            apiIssues: [],
            authenticationIssues: [],
            dataValidationIssues: [],
            sessionManagementIssues: [],
            severity: 'low'
        };
    }

    private hashCode(str: string): string {
        let hash = 0;
        if (str.length === 0) {
            return hash.toString();
        }
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    private cacheResult(key: string, result: FullStackSecurityResult): void {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    public clearCache(): void {
        this.cache.clear();
    }

    // Specific analysis methods for different frameworks
    public async analyzeReact(code: string): Promise<FullStackSecurityResult> {
        return this.analyzeFullStackSecurity(code, 'react');
    }

    public async analyzeVue(code: string): Promise<FullStackSecurityResult> {
        return this.analyzeFullStackSecurity(code, 'vue');
    }

    public async analyzeAngular(code: string): Promise<FullStackSecurityResult> {
        return this.analyzeFullStackSecurity(code, 'angular');
    }

    public async analyzeExpress(code: string): Promise<FullStackSecurityResult> {
        return this.analyzeFullStackSecurity(code, 'express');
    }

    public async analyzeGraphQL(code: string): Promise<FullStackSecurityResult> {
        return this.analyzeFullStackSecurity(code, 'graphql');
    }
}