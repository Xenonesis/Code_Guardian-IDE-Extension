"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAnalysis = void 0;
class SecurityAnalysis {
    constructor() {
        this.vulnerabilities = [];
        this.cache = new Map();
        this.maxCacheSize = 100;
        // Optimized security patterns with compiled regex
        this.securityPatterns = [
            {
                pattern: /\beval\s*\(/gi,
                message: 'Critical: Code injection vulnerability - Use of eval()',
                severity: 'HIGH'
            },
            {
                pattern: /innerHTML\s*=.*(?:user|input|param)/gi,
                message: 'High: XSS vulnerability - innerHTML assignment with user data',
                severity: 'HIGH'
            },
            {
                pattern: /document\.write\s*\(/gi,
                message: 'High: XSS vulnerability - Use of document.write()',
                severity: 'HIGH'
            },
            {
                pattern: /setTimeout\s*\(\s*['"`][^'"`]*['"`]/gi,
                message: 'Medium: Code injection risk - setTimeout with string argument',
                severity: 'MEDIUM'
            },
            {
                pattern: /(?:password|secret|key|token).*console\.log/gi,
                message: 'High: Information disclosure - Sensitive data logged to console',
                severity: 'HIGH'
            },
            {
                pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/gi,
                message: 'Medium: Insecure protocol - Use HTTPS instead of HTTP',
                severity: 'MEDIUM'
            },
            {
                pattern: /\.innerHTML\s*\+=|\.outerHTML\s*=/gi,
                message: 'Medium: Potential XSS - Direct HTML manipulation',
                severity: 'MEDIUM'
            },
            {
                pattern: /new\s+Function\s*\(/gi,
                message: 'High: Code injection risk - Use of Function constructor',
                severity: 'HIGH'
            },
            {
                pattern: /\.\$\s*\(/gi,
                message: 'Low: Potential jQuery injection if user input involved',
                severity: 'LOW'
            },
            {
                pattern: /localStorage\.setItem.*(?:password|token|secret)/gi,
                message: 'Medium: Sensitive data stored in localStorage',
                severity: 'MEDIUM'
            },
            {
                pattern: /(?:prompt|confirm|alert)\s*\(/gi,
                message: 'Low: User interaction dialogs may be used for social engineering',
                severity: 'LOW'
            },
            {
                pattern: /Math\.random\(\).*(?:password|token|id|key)/gi,
                message: 'High: Cryptographically weak random number generation',
                severity: 'HIGH'
            }
        ];
    }
    async analyzeSecurity(code) {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return [];
        }
        // Check cache first
        const codeHash = this.hashCode(code);
        if (this.cache.has(codeHash)) {
            return this.cache.get(codeHash);
        }
        try {
            const vulnerabilities = [];
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
        }
        catch (error) {
            console.error('Error analyzing security:', error);
            return ['Error occurred during security analysis'];
        }
    }
    hashCode(str) {
        let hash = 0;
        if (str.length === 0)
            return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
    cacheResult(key, result) {
        // Implement LRU cache behavior
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }
    clearCache() {
        this.cache.clear();
    }
    extractVulnerabilities(output) {
        // Enhanced vulnerability extraction logic
        return output.split('\n')
            .filter(line => line.includes('VULNERABILITY') || line.includes('SECURITY'))
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    getVulnerabilitiesBySeverity() {
        return {
            high: this.vulnerabilities.filter(v => v.includes('[HIGH]')),
            medium: this.vulnerabilities.filter(v => v.includes('[MEDIUM]')),
            low: this.vulnerabilities.filter(v => v.includes('[LOW]'))
        };
    }
    getVulnerabilities() {
        return this.vulnerabilities;
    }
}
exports.SecurityAnalysis = SecurityAnalysis;
//# sourceMappingURL=securityAnalysis.js.map