export class AiProvider {
    private apiUrl: string;
    private cache = new Map<string, string[]>();
    private readonly maxCacheSize = 50;
    private requestQueue: Array<{ resolve: Function; reject: Function; code: string }> = [];
    private isProcessing = false;

    constructor(apiUrl?: string) {
        // AI Provider uses local analysis - no external API needed
        this.apiUrl = apiUrl || 'local'; // Local analysis mode
    }

    public async getSuggestions(code: string): Promise<string[]> {
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
            // Generate context-aware suggestions based on code analysis
            const suggestions = this.generateSmartSuggestions(code);
            
            // Cache the result
            this.cacheResult(codeHash, suggestions);
            
            return suggestions;
        } catch (error) {
            console.error('Error fetching AI suggestions:', error);
            return ['Unable to fetch AI suggestions at this time'];
        }
    }

    private generateSmartSuggestions(code: string): string[] {
        const suggestions: string[] = [];
        const codeLines = code.split('\n');
        const codeLength = code.length;
        
        // Advanced Security Suggestions
        if (code.includes('eval(')) {
            suggestions.push('🚨 CRITICAL: Remove eval() - it poses severe security risks and performance issues');
        }
        
        if (code.includes('innerHTML') && (code.includes('+') || code.includes('${') || code.includes('user') || code.includes('input'))) {
            suggestions.push('🔒 SECURITY: Avoid innerHTML with dynamic content - use textContent or sanitize input to prevent XSS');
        }
        
        if (code.includes('document.write')) {
            suggestions.push('🔒 SECURITY: Replace document.write() with safer DOM manipulation methods');
        }
        
        if (code.match(/(?:password|secret|key|token).*console\.log/gi)) {
            suggestions.push('🚨 CRITICAL: Remove console.log statements containing sensitive data');
        }
        
        if (code.includes('localStorage.setItem') && (code.includes('password') || code.includes('token') || code.includes('secret'))) {
            suggestions.push('🔒 SECURITY: Avoid storing sensitive data in localStorage - use secure HTTP-only cookies');
        }
        
        // Database Security
        if (code.match(/(?:SELECT|INSERT|UPDATE|DELETE).*\+.*(?:req\.|input|param|user)/gi)) {
            suggestions.push('🚨 CRITICAL: SQL injection vulnerability detected - use parameterized queries or prepared statements');
        }
        
        if (code.includes('password') && code.match(/password\s*=\s*['"`]['"`]/gi)) {
            suggestions.push('🚨 CRITICAL: Empty password detected - implement strong password requirements');
        }
        
        // DevOps & Infrastructure
        if (code.includes('FROM') && code.includes(':latest')) {
            suggestions.push('🔧 DEVOPS: Avoid :latest tag in Docker - use specific version tags for reproducible builds');
        }
        
        if (code.includes('USER root')) {
            suggestions.push('🔧 DEVOPS: Avoid running containers as root - create and use a non-root user');
        }
        
        if (code.includes('privileged: true')) {
            suggestions.push('🚨 CRITICAL: Remove privileged mode from containers - it breaks security isolation');
        }
        
        // API Security
        if (code.includes('cors()') && !code.includes('origin')) {
            suggestions.push('🔒 API: Configure CORS with specific origins instead of allowing all');
        }
        
        if (code.match(/app\.(?:get|post|put|delete)\s*\([^)]*\)\s*,\s*(?!.*auth|.*middleware)/gi)) {
            suggestions.push('🔒 API: Add authentication middleware to protect API endpoints');
        }
        
        if (code.includes('jwt.sign') && (code.includes('""') || code.includes("''") || code.includes('secret'))) {
            suggestions.push('🚨 CRITICAL: Use a strong, unique JWT secret key - never use empty or default secrets');
        }
        
        // Code Quality & Best Practices
        if (code.includes('let ') && !code.includes('let i =') && !code.includes('let j =') && !code.includes('++') && !code.includes('--')) {
            suggestions.push('💡 QUALITY: Consider using const instead of let for immutable variables');
        }
        
        if (code.includes('==') && !code.includes('===')) {
            suggestions.push('💡 QUALITY: Use strict equality (===) instead of loose equality (==)');
        }
        
        if (code.includes('var ')) {
            suggestions.push('💡 QUALITY: Replace var with let or const for better scoping and block-level declarations');
        }
        
        // Error Handling
        if (code.includes('JSON.parse') && !code.includes('try')) {
            suggestions.push('🛡️ RELIABILITY: Wrap JSON.parse in try-catch to handle malformed JSON gracefully');
        }
        
        if (code.includes('fetch(') && !code.includes('.catch') && !code.includes('try')) {
            suggestions.push('🛡️ RELIABILITY: Add error handling for fetch requests using .catch() or try-catch');
        }
        
        if (code.includes('async ') && !code.includes('try') && !code.includes('.catch')) {
            suggestions.push('🛡️ RELIABILITY: Add error handling to async functions with try-catch blocks');
        }
        
        // Performance Optimizations
        if (codeLines.length > 100) {
            suggestions.push('⚡ PERFORMANCE: Consider breaking this large function into smaller, more focused functions');
        }
        
        const cyclomaticComplexity = (code.match(/if\s*\(/g) || []).length + 
                                   (code.match(/for\s*\(/g) || []).length + 
                                   (code.match(/while\s*\(/g) || []).length + 
                                   (code.match(/switch\s*\(/g) || []).length;
        
        if (cyclomaticComplexity > 10) {
            suggestions.push(`⚡ PERFORMANCE: High cyclomatic complexity (${cyclomaticComplexity}) - consider refactoring for better maintainability`);
        }
        
        if (code.includes('for (') && code.includes('.length') && !code.includes('const length')) {
            suggestions.push('⚡ PERFORMANCE: Cache array length in loops for better performance');
        }
        
        // Modern JavaScript/TypeScript Suggestions
        if (code.includes('function(') && !code.includes('this.')) {
            suggestions.push('🔄 MODERN: Consider using arrow functions for cleaner syntax');
        }
        
        if (code.includes('.map(') && code.includes('return ') && !code.includes('=>')) {
            suggestions.push('🔄 MODERN: Use arrow functions in array methods for more concise code');
        }
        
        if (code.includes('Promise.all') && code.includes('await')) {
            suggestions.push('⚡ PERFORMANCE: Good use of Promise.all for concurrent operations');
        }
        
        // Framework-Specific Suggestions
        if (code.includes('useEffect') && !code.includes('return')) {
            suggestions.push('🔄 REACT: Add cleanup function to useEffect to prevent memory leaks');
        }
        
        if (code.includes('useState') && code.includes('object') && !code.includes('...')) {
            suggestions.push('🔄 REACT: Use spread operator when updating state objects');
        }
        
        if (code.includes('dangerouslySetInnerHTML')) {
            suggestions.push('🚨 REACT: Sanitize HTML content when using dangerouslySetInnerHTML to prevent XSS');
        }
        
        // Testing & Documentation
        if (codeLength > 500 && !code.includes('test') && !code.includes('describe') && !code.includes('it(')) {
            suggestions.push('🧪 TESTING: Consider adding unit tests for better code reliability and maintainability');
        }
        
        if (code.includes('function ') && !code.includes('/**') && !code.includes('//')) {
            suggestions.push('📝 DOCUMENTATION: Add JSDoc comments to document function parameters and return values');
        }
        
        // Accessibility
        if (code.includes('<img') && !code.includes('alt=')) {
            suggestions.push('♿ ACCESSIBILITY: Add alt attributes to images for better accessibility');
        }
        
        if (code.includes('<button') && !code.includes('aria-')) {
            suggestions.push('♿ ACCESSIBILITY: Consider adding ARIA attributes for better screen reader support');
        }
        
        // Environment-Specific
        if (code.includes('process.env') && !code.includes('NODE_ENV')) {
            suggestions.push('🔧 CONFIG: Use NODE_ENV to differentiate between development and production environments');
        }
        
        if (code.includes('console.log') && code.includes('production')) {
            suggestions.push('🔧 PRODUCTION: Remove or conditionally disable console.log statements in production');
        }
        
        // Return intelligent suggestions based on analysis
        if (suggestions.length === 0) {
            // Provide context-aware default suggestions
            if (code.includes('class ') || code.includes('function ')) {
                suggestions.push(
                    '✨ QUALITY: Code structure looks good - consider adding comprehensive error handling',
                    '📝 DOCUMENTATION: Add detailed comments explaining complex business logic',
                    '🧪 TESTING: Implement unit tests to ensure code reliability',
                    '⚡ PERFORMANCE: Profile critical paths for potential optimizations',
                    '🔒 SECURITY: Review for potential security vulnerabilities'
                );
            } else {
                suggestions.push(
                    '💡 ANALYSIS: Code appears to be well-structured',
                    '🔍 REVIEW: Consider peer review for additional insights',
                    '📊 METRICS: Monitor performance and error rates in production'
                );
            }
        }
        
        // Prioritize critical security issues
        const criticalSuggestions = suggestions.filter(s => s.includes('🚨 CRITICAL'));
        const securitySuggestions = suggestions.filter(s => s.includes('🔒') && !s.includes('🚨'));
        const otherSuggestions = suggestions.filter(s => !s.includes('🚨') && !s.includes('🔒'));
        
        return [...criticalSuggestions, ...securitySuggestions, ...otherSuggestions].slice(0, 8); // Limit to 8 suggestions
    }

    public async analyzeCode(code: string): Promise<any> {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return {
                complexity: 1,
                maintainability: 100,
                suggestions: []
            };
        }

        try {
            // Calculate actual metrics from code
            const complexity = this.calculateComplexity(code);
            const maintainability = this.calculateMaintainability(code);
            const suggestions = await this.getSuggestions(code);

            const analysis = {
                complexity,
                maintainability,
                suggestions
            };

            return analysis;
        } catch (error) {
            console.error('Error analyzing code:', error);
            throw new Error('Failed to analyze code');
        }
    }

    private calculateComplexity(code: string): number {
        // Calculate cyclomatic complexity
        const ifMatches = (code.match(/\bif\s*\(/g) || []).length;
        const forMatches = (code.match(/\bfor\s*\(/g) || []).length;
        const whileMatches = (code.match(/\bwhile\s*\(/g) || []).length;
        const switchMatches = (code.match(/\bswitch\s*\(/g) || []).length;
        const catchMatches = (code.match(/\bcatch\s*\(/g) || []).length;
        
        return Math.min(10, 1 + ifMatches + forMatches + whileMatches + switchMatches + catchMatches);
    }

    private calculateMaintainability(code: string): number {
        let score = 100;
        
        // Deduct points for various factors
        const lines = code.split('\n').length;
        if (lines > 100) {
            score -= Math.min(30, (lines - 100) / 10);
        }
        
        const complexity = this.calculateComplexity(code);
        score -= (complexity - 1) * 5;
        
        if (code.includes('TODO')) {
            score -= 5;
        }
        if (code.includes('FIXME')) {
            score -= 10;
        }
        if (code.includes('console.log')) {
            score -= 3;
        }
        
        return Math.max(0, Math.min(100, Math.round(score)));
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