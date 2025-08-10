"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQuality = void 0;
class CodeQuality {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100;
        // Pre-compiled regex patterns for better performance
        this.patterns = {
            if: /\bif\s*\(/g,
            for: /\bfor\s*\(/g,
            while: /\bwhile\s*\(/g,
            switch: /\bswitch\s*\(/g,
            todo: /TODO/gi,
            fixme: /FIXME/gi,
            consoleLog: /console\.log/g,
            magicNumbers: /\b\d{2,}\b/g
        };
    }
    async analyzeQuality(code) {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return {
                maintainabilityScore: 100,
                complexityScore: 1,
                technicalDebt: 0
            };
        }
        // Check cache first
        const codeHash = this.hashCode(code);
        if (this.cache.has(codeHash)) {
            return this.cache.get(codeHash);
        }
        const metrics = this.calculateMetrics(code);
        const result = {
            maintainabilityScore: metrics.maintainabilityScore,
            complexityScore: metrics.complexityScore,
            technicalDebt: metrics.technicalDebt
        };
        // Cache the result
        this.cacheResult(codeHash, result);
        return result;
    }
    getQualityMetrics(code) {
        // Quick return for empty code
        if (!code || code.trim().length === 0) {
            return { qualityScore: 100, issues: [] };
        }
        // Check cache for similar calculation
        const codeHash = this.hashCode(code);
        const cachedMetrics = this.cache.get(codeHash);
        if (cachedMetrics) {
            const metrics = this.calculateMetrics(code);
            return {
                qualityScore: cachedMetrics.maintainabilityScore,
                issues: metrics.issues
            };
        }
        const metrics = this.calculateMetrics(code);
        return {
            qualityScore: metrics.maintainabilityScore,
            issues: metrics.issues
        };
    }
    calculateMetrics(code) {
        const issues = [];
        let maintainabilityScore = 100;
        let complexityScore = 1;
        let technicalDebt = 0;
        // Calculate complexity based on control structures using pre-compiled patterns
        const ifMatches = code.match(this.patterns.if);
        const forMatches = code.match(this.patterns.for);
        const whileMatches = code.match(this.patterns.while);
        const switchMatches = code.match(this.patterns.switch);
        complexityScore = 1 + (ifMatches?.length || 0) + (forMatches?.length || 0) +
            (whileMatches?.length || 0) + (switchMatches?.length || 0);
        // Batch check for code quality issues using pre-compiled patterns
        const todoMatches = code.match(this.patterns.todo);
        if (todoMatches) {
            issues.push(`Found ${todoMatches.length} TODO comment${todoMatches.length > 1 ? 's' : ''} in the code`);
            technicalDebt += todoMatches.length * 5;
            maintainabilityScore -= todoMatches.length * 5;
        }
        const fixmeMatches = code.match(this.patterns.fixme);
        if (fixmeMatches) {
            issues.push(`Found ${fixmeMatches.length} FIXME comment${fixmeMatches.length > 1 ? 's' : ''} in the code`);
            technicalDebt += fixmeMatches.length * 10;
            maintainabilityScore -= fixmeMatches.length * 10;
        }
        const consoleLogMatches = code.match(this.patterns.consoleLog);
        if (consoleLogMatches) {
            issues.push(`Found ${consoleLogMatches.length} debug statement${consoleLogMatches.length > 1 ? 's' : ''} (console.log)`);
            maintainabilityScore -= consoleLogMatches.length * 3;
        }
        // Check for long functions (optimized line counting)
        const lineCount = code.split('\n').length;
        if (lineCount > 50) {
            issues.push(`Function appears to be too long (${lineCount} lines, recommended: <50)`);
            maintainabilityScore -= Math.min(30, Math.floor((lineCount - 50) / 10) * 5 + 15);
            technicalDebt += Math.min(40, Math.floor((lineCount - 50) / 10) * 5 + 20);
        }
        // Check for magic numbers
        const magicNumbers = code.match(this.patterns.magicNumbers);
        if (magicNumbers && magicNumbers.length > 3) {
            issues.push(`Multiple magic numbers found (${magicNumbers.length}) - consider using constants`);
            maintainabilityScore -= Math.min(20, magicNumbers.length * 2);
        }
        // Ensure scores are within valid ranges
        maintainabilityScore = Math.max(0, Math.min(100, maintainabilityScore));
        complexityScore = Math.max(1, complexityScore);
        technicalDebt = Math.max(0, technicalDebt);
        return {
            maintainabilityScore,
            complexityScore,
            technicalDebt,
            issues
        };
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
exports.CodeQuality = CodeQuality;
//# sourceMappingURL=codeQuality.js.map