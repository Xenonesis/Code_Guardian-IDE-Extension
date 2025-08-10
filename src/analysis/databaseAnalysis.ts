import { SecurityVulnerability } from '../types';

export interface DatabaseSecurityResult {
    vulnerabilities: SecurityVulnerability[];
    sqlInjectionRisks: string[];
    configurationIssues: string[];
    accessControlIssues: string[];
    encryptionIssues: string[];
    auditingIssues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class DatabaseAnalysis {
    private cache = new Map<string, DatabaseSecurityResult>();
    private readonly maxCacheSize = 100;

    // Database Security Patterns
    private readonly databasePatterns = [
        // SQL Injection Vulnerabilities
        {
            pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER).*\+.*(?:req\.|request\.|input|param|user|query|body)/gi,
            message: 'Critical: SQL injection vulnerability - String concatenation in SQL query',
            severity: 'critical' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'Dynamic Query Construction'
        },
        {
            pattern: /query\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi,
            message: 'Critical: SQL injection - Dynamic query construction with concatenation',
            severity: 'critical' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'Query Concatenation'
        },
        {
            pattern: /execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi,
            message: 'Critical: SQL injection - Dynamic execute statement',
            severity: 'critical' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'Execute Concatenation'
        },
        {
            pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
            message: 'High: Potential SQL injection - Template literal in SQL query',
            severity: 'high' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'Template Injection'
        },
        {
            pattern: /format\s*\(\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE).*['"`]/gi,
            message: 'High: SQL injection risk - String formatting in SQL query',
            severity: 'high' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'String Formatting'
        },

        // Authentication & Access Control
        {
            pattern: /password\s*=\s*['"`]['"`]/gi,
            message: 'Critical: Empty database password detected',
            severity: 'critical' as const,
            category: 'Authentication',
            cwe: 'CWE-521',
            type: 'Empty Password'
        },
        {
            pattern: /password\s*=\s*['"`](?:password|123456|admin|root|test)['"`]/gi,
            message: 'Critical: Weak default database password detected',
            severity: 'critical' as const,
            category: 'Authentication',
            cwe: 'CWE-521',
            type: 'Weak Password'
        },
        {
            pattern: /user\s*=\s*['"`](?:root|admin|sa)['"`]/gi,
            message: 'High: Using privileged database user account',
            severity: 'high' as const,
            category: 'Access Control',
            cwe: 'CWE-250',
            type: 'Privileged Account'
        },
        {
            pattern: /GRANT\s+ALL\s+PRIVILEGES/gi,
            message: 'High: Granting all privileges - follow principle of least privilege',
            severity: 'high' as const,
            category: 'Access Control',
            cwe: 'CWE-250',
            type: 'Excessive Privileges'
        },
        {
            pattern: /GRANT.*TO.*@'%'/gi,
            message: 'High: Granting permissions to any host (%) - restrict to specific hosts',
            severity: 'high' as const,
            category: 'Access Control',
            cwe: 'CWE-284',
            type: 'Overly Permissive Access'
        },

        // Connection Security
        {
            pattern: /sslmode\s*=\s*disable/gi,
            message: 'High: SSL/TLS disabled for database connection',
            severity: 'high' as const,
            category: 'Encryption',
            cwe: 'CWE-319',
            type: 'Unencrypted Connection'
        },
        {
            pattern: /trust_server_certificate\s*=\s*true/gi,
            message: 'Medium: Database connection trusting server certificate without verification',
            severity: 'medium' as const,
            category: 'Encryption',
            cwe: 'CWE-295',
            type: 'Certificate Validation Bypass'
        },
        {
            pattern: /encrypt\s*=\s*false/gi,
            message: 'High: Database connection encryption disabled',
            severity: 'high' as const,
            category: 'Encryption',
            cwe: 'CWE-319',
            type: 'Unencrypted Connection'
        },
        {
            pattern: /(?:mongodb|mysql|postgres):\/\/[^:]*:[^@]*@[^/]*\/[^?]*(?!\?.*ssl)/gi,
            message: 'Medium: Database connection string without SSL parameters',
            severity: 'medium' as const,
            category: 'Encryption',
            cwe: 'CWE-319',
            type: 'Missing SSL Configuration'
        },

        // Data Encryption
        {
            pattern: /CREATE\s+TABLE.*(?!.*ENCRYPTED)/gi,
            message: 'Low: Table created without encryption - consider encrypting sensitive data',
            severity: 'low' as const,
            category: 'Encryption',
            cwe: 'CWE-311',
            type: 'Unencrypted Storage'
        },
        {
            pattern: /(?:password|ssn|credit_card|social_security).*VARCHAR.*(?!.*ENCRYPTED)/gi,
            message: 'High: Sensitive data stored without encryption',
            severity: 'high' as const,
            category: 'Encryption',
            cwe: 'CWE-311',
            type: 'Sensitive Data Exposure'
        },

        // Configuration Issues
        {
            pattern: /skip-grant-tables/gi,
            message: 'Critical: MySQL running with skip-grant-tables (no authentication)',
            severity: 'critical' as const,
            category: 'Configuration',
            cwe: 'CWE-287',
            type: 'Authentication Bypass'
        },
        {
            pattern: /bind-address\s*=\s*0\.0\.0\.0/gi,
            message: 'Medium: Database bound to all interfaces - restrict to specific IPs',
            severity: 'medium' as const,
            category: 'Configuration',
            cwe: 'CWE-284',
            type: 'Network Exposure'
        },
        {
            pattern: /port\s*=\s*(?:3306|5432|1433|27017)/gi,
            message: 'Low: Using default database port - consider changing for security',
            severity: 'low' as const,
            category: 'Configuration',
            cwe: 'CWE-1188',
            type: 'Default Configuration'
        },

        // Stored Procedures & Functions
        {
            pattern: /DEFINER\s*=\s*.*@.*\s+SQL\s+SECURITY\s+DEFINER/gi,
            message: 'Medium: Stored procedure with DEFINER rights - review security context',
            severity: 'medium' as const,
            category: 'Access Control',
            cwe: 'CWE-250',
            type: 'Privilege Context'
        },
        {
            pattern: /EXEC\s*\(\s*@/gi,
            message: 'High: Dynamic SQL execution in stored procedure - SQL injection risk',
            severity: 'high' as const,
            category: 'SQL Injection',
            cwe: 'CWE-89',
            type: 'Dynamic SQL'
        },

        // Backup & Recovery
        {
            pattern: /mysqldump.*--single-transaction.*(?!--master-data)/gi,
            message: 'Low: Backup without master data - may affect point-in-time recovery',
            severity: 'low' as const,
            category: 'Backup Security',
            cwe: 'CWE-404',
            type: 'Incomplete Backup'
        },
        {
            pattern: /pg_dump.*(?!--no-password)/gi,
            message: 'Medium: Database backup may prompt for password - use .pgpass or environment variables',
            severity: 'medium' as const,
            category: 'Backup Security',
            cwe: 'CWE-522',
            type: 'Password Exposure'
        },

        // Logging & Auditing
        {
            pattern: /log_statement\s*=\s*none/gi,
            message: 'Medium: Database statement logging disabled - enable for security auditing',
            severity: 'medium' as const,
            category: 'Auditing',
            cwe: 'CWE-778',
            type: 'Insufficient Logging'
        },
        {
            pattern: /general_log\s*=\s*OFF/gi,
            message: 'Low: General query log disabled - consider enabling for auditing',
            severity: 'low' as const,
            category: 'Auditing',
            cwe: 'CWE-778',
            type: 'Logging Disabled'
        },

        // NoSQL Specific (MongoDB, etc.)
        {
            pattern: /db\.eval\s*\(/gi,
            message: 'High: MongoDB eval() function - potential code injection',
            severity: 'high' as const,
            category: 'NoSQL Injection',
            cwe: 'CWE-94',
            type: 'Code Injection'
        },
        {
            pattern: /\$where.*\+/gi,
            message: 'High: MongoDB $where operator with concatenation - injection risk',
            severity: 'high' as const,
            category: 'NoSQL Injection',
            cwe: 'CWE-94',
            type: 'Where Injection'
        },
        {
            pattern: /authorization:\s*disabled/gi,
            message: 'Critical: MongoDB authorization disabled',
            severity: 'critical' as const,
            category: 'Authentication',
            cwe: 'CWE-287',
            type: 'Authorization Disabled'
        },

        // Redis Specific
        {
            pattern: /requirepass\s*['"`]['"`]/gi,
            message: 'Critical: Redis password is empty',
            severity: 'critical' as const,
            category: 'Authentication',
            cwe: 'CWE-521',
            type: 'Empty Password'
        },
        {
            pattern: /protected-mode\s*no/gi,
            message: 'High: Redis protected mode disabled',
            severity: 'high' as const,
            category: 'Configuration',
            cwe: 'CWE-284',
            type: 'Protection Disabled'
        }
    ];

    public async analyzeDatabaseSecurity(code: string, dbType: string = 'unknown'): Promise<DatabaseSecurityResult> {
        if (!code || code.trim().length === 0) {
            return this.getEmptyResult();
        }

        // Check cache first
        const cacheKey = this.hashCode(code + dbType);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const result = this.performAnalysis(code, dbType);
        
        // Cache the result
        this.cacheResult(cacheKey, result);
        return result;
    }

    private performAnalysis(code: string, dbType: string): DatabaseSecurityResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const sqlInjectionRisks: string[] = [];
        const configurationIssues: string[] = [];
        const accessControlIssues: string[] = [];
        const encryptionIssues: string[] = [];
        const auditingIssues: string[] = [];

        // Get relevant patterns based on database type
        const relevantPatterns = this.getRelevantPatterns(dbType);

        for (const pattern of relevantPatterns) {
            const matches = code.match(pattern.pattern);
            if (matches) {
                const vulnerability: SecurityVulnerability = {
                    type: pattern.type,
                    severity: pattern.severity,
                    description: pattern.message,
                    file: dbType
                };

                vulnerabilities.push(vulnerability);

                // Categorize issues
                const issueText = `${pattern.message} (Found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`;
                
                switch (pattern.category) {
                    case 'SQL Injection':
                    case 'NoSQL Injection':
                        sqlInjectionRisks.push(issueText);
                        break;
                    case 'Configuration':
                    case 'Backup Security':
                        configurationIssues.push(issueText);
                        break;
                    case 'Access Control':
                    case 'Authentication':
                        accessControlIssues.push(issueText);
                        break;
                    case 'Encryption':
                        encryptionIssues.push(issueText);
                        break;
                    case 'Auditing':
                        auditingIssues.push(issueText);
                        break;
                    default:
                        configurationIssues.push(issueText);
                }
            }
        }

        const severity = this.calculateOverallSeverity(vulnerabilities);

        return {
            vulnerabilities,
            sqlInjectionRisks,
            configurationIssues,
            accessControlIssues,
            encryptionIssues,
            auditingIssues,
            severity
        };
    }

    private getRelevantPatterns(dbType: string) {
        const type = dbType.toLowerCase();
        
        if (type.includes('mysql') || type.includes('mariadb')) {
            return this.databasePatterns.filter(p => 
                !p.category.includes('NoSQL') && 
                !p.message.includes('PostgreSQL') &&
                !p.message.includes('MongoDB') &&
                !p.message.includes('Redis')
            );
        }
        
        if (type.includes('postgres') || type.includes('postgresql')) {
            return this.databasePatterns.filter(p => 
                !p.category.includes('NoSQL') && 
                !p.message.includes('MySQL') &&
                !p.message.includes('MongoDB') &&
                !p.message.includes('Redis')
            );
        }
        
        if (type.includes('mongodb') || type.includes('mongo')) {
            return this.databasePatterns.filter(p => 
                p.category.includes('NoSQL') || 
                p.category.includes('Authentication') ||
                p.category.includes('Encryption') ||
                p.category.includes('Access Control') ||
                p.message.includes('MongoDB')
            );
        }
        
        if (type.includes('redis')) {
            return this.databasePatterns.filter(p => 
                p.message.includes('Redis') ||
                p.category.includes('Authentication') ||
                p.category.includes('Configuration')
            );
        }

        // Return all patterns for unknown database types
        return this.databasePatterns;
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

    private getEmptyResult(): DatabaseSecurityResult {
        return {
            vulnerabilities: [],
            sqlInjectionRisks: [],
            configurationIssues: [],
            accessControlIssues: [],
            encryptionIssues: [],
            auditingIssues: [],
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

    private cacheResult(key: string, result: DatabaseSecurityResult): void {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    public clearCache(): void {
        this.cache.clear();
    }

    // Specific analysis methods for different database types
    public async analyzeMySQL(code: string): Promise<DatabaseSecurityResult> {
        return this.analyzeDatabaseSecurity(code, 'mysql');
    }

    public async analyzePostgreSQL(code: string): Promise<DatabaseSecurityResult> {
        return this.analyzeDatabaseSecurity(code, 'postgresql');
    }

    public async analyzeMongoDB(code: string): Promise<DatabaseSecurityResult> {
        return this.analyzeDatabaseSecurity(code, 'mongodb');
    }

    public async analyzeRedis(code: string): Promise<DatabaseSecurityResult> {
        return this.analyzeDatabaseSecurity(code, 'redis');
    }

    public async analyzeSQLServer(code: string): Promise<DatabaseSecurityResult> {
        return this.analyzeDatabaseSecurity(code, 'sqlserver');
    }
}