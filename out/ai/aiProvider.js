"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProvider = void 0;
class AiProvider {
    constructor(apiUrl) {
        this.cache = new Map();
        this.maxCacheSize = 50;
        this.requestQueue = [];
        this.isProcessing = false;
        // AI Provider uses local analysis - no external API needed
        this.apiUrl = apiUrl || 'local'; // Local analysis mode
    }
    async getSuggestions(code) {
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
            // Generate context-aware suggestions based on code analysis
            const suggestions = this.generateSmartSuggestions(code);
            // Cache the result
            this.cacheResult(codeHash, suggestions);
            return suggestions;
        }
        catch (error) {
            console.error('Error fetching AI suggestions:', error);
            return ['Unable to fetch AI suggestions at this time'];
        }
    }
    generateSmartSuggestions(code) {
        const suggestions = [];
        // Analyze code patterns and provide contextual suggestions
        if (code.includes('let ') && !code.includes('let i =') && !code.includes('let j =')) {
            suggestions.push('Consider using const instead of let for immutable variables');
        }
        if (code.includes('==') && !code.includes('===')) {
            suggestions.push('Use strict equality (===) instead of loose equality (==)');
        }
        if (code.includes('var ')) {
            suggestions.push('Consider using let or const instead of var for better scoping');
        }
        if (code.includes('function') && !code.includes('try') && !code.includes('catch')) {
            suggestions.push('Consider adding error handling with try-catch blocks');
        }
        if (code.includes('console.log')) {
            suggestions.push('Remove console.log statements before production deployment');
        }
        if (code.includes('document.getElementById') || code.includes('document.querySelector')) {
            suggestions.push('Add null checks when accessing DOM elements');
        }
        if (code.includes('setTimeout') || code.includes('setInterval')) {
            suggestions.push('Consider using async/await or Promises for better async handling');
        }
        if (code.includes('for (') && code.includes('.length')) {
            suggestions.push('Consider using for...of or forEach for better readability');
        }
        if (code.includes('JSON.parse') && !code.includes('try')) {
            suggestions.push('Wrap JSON.parse in try-catch to handle invalid JSON');
        }
        if (code.includes('fetch(') && !code.includes('.catch')) {
            suggestions.push('Add error handling for fetch requests');
        }
        // Performance suggestions
        if (code.split('\n').length > 50) {
            suggestions.push('Consider breaking this large function into smaller, more focused functions');
        }
        if ((code.match(/if\s*\(/g) || []).length > 5) {
            suggestions.push('High cyclomatic complexity detected - consider refactoring');
        }
        // Security suggestions
        if (code.includes('innerHTML') && code.includes('+')) {
            suggestions.push('Avoid string concatenation with innerHTML - use textContent or sanitize input');
        }
        if (code.includes('eval(')) {
            suggestions.push('Avoid using eval() - it poses security risks and performance issues');
        }
        // Return default suggestions if no specific patterns found
        if (suggestions.length === 0) {
            suggestions.push('Code structure looks good - consider adding comments for better maintainability', 'Review variable naming for clarity and consistency', 'Consider adding unit tests for better code reliability');
        }
        return suggestions.slice(0, 5); // Limit to 5 suggestions for better UX
    }
    async analyzeCode(code) {
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
        }
        catch (error) {
            console.error('Error analyzing code:', error);
            throw new Error('Failed to analyze code');
        }
    }
    calculateComplexity(code) {
        // Calculate cyclomatic complexity
        const ifMatches = (code.match(/\bif\s*\(/g) || []).length;
        const forMatches = (code.match(/\bfor\s*\(/g) || []).length;
        const whileMatches = (code.match(/\bwhile\s*\(/g) || []).length;
        const switchMatches = (code.match(/\bswitch\s*\(/g) || []).length;
        const catchMatches = (code.match(/\bcatch\s*\(/g) || []).length;
        return Math.min(10, 1 + ifMatches + forMatches + whileMatches + switchMatches + catchMatches);
    }
    calculateMaintainability(code) {
        let score = 100;
        // Deduct points for various factors
        const lines = code.split('\n').length;
        if (lines > 100)
            score -= Math.min(30, (lines - 100) / 10);
        const complexity = this.calculateComplexity(code);
        score -= (complexity - 1) * 5;
        if (code.includes('TODO'))
            score -= 5;
        if (code.includes('FIXME'))
            score -= 10;
        if (code.includes('console.log'))
            score -= 3;
        return Math.max(0, Math.min(100, Math.round(score)));
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
}
exports.AiProvider = AiProvider;
//# sourceMappingURL=aiProvider.js.map