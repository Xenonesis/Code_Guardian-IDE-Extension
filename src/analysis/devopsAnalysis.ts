import { SecurityVulnerability } from '../types';

export interface DevOpsSecurityResult {
    vulnerabilities: SecurityVulnerability[];
    infrastructureIssues: string[];
    cicdIssues: string[];
    containerIssues: string[];
    kubernetesIssues: string[];
    terraformIssues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class DevOpsAnalysis {
    private cache = new Map<string, DevOpsSecurityResult>();
    private readonly maxCacheSize = 100;

    // DevOps and Infrastructure Security Patterns
    private readonly devopsPatterns = [
        // Docker Security
        {
            pattern: /FROM\s+.*:latest/gi,
            message: 'Avoid using :latest tag in production - use specific version tags',
            severity: 'medium' as const,
            category: 'Container Security',
            cwe: 'CWE-1188',
            type: 'Docker Tag Issue'
        },
        {
            pattern: /USER\s+root/gi,
            message: 'Running container as root user poses security risks',
            severity: 'high' as const,
            category: 'Container Security',
            cwe: 'CWE-250',
            type: 'Privilege Escalation'
        },
        {
            pattern: /COPY\s+\.\s+\./gi,
            message: 'Copying entire context may include sensitive files - use .dockerignore',
            severity: 'low' as const,
            category: 'Container Security',
            cwe: 'CWE-200',
            type: 'Information Disclosure'
        },
        {
            pattern: /EXPOSE\s+22/gi,
            message: 'Exposing SSH port (22) in container is generally not recommended',
            severity: 'medium' as const,
            category: 'Container Security',
            cwe: 'CWE-200',
            type: 'Unnecessary Service Exposure'
        },
        {
            pattern: /ADD\s+http/gi,
            message: 'Using ADD with URLs can be insecure - prefer COPY with explicit downloads',
            severity: 'medium' as const,
            category: 'Container Security',
            cwe: 'CWE-494',
            type: 'Insecure Download'
        },

        // Kubernetes Security
        {
            pattern: /privileged:\s*true/gi,
            message: 'Running privileged containers breaks container isolation',
            severity: 'critical' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-250',
            type: 'Privilege Escalation'
        },
        {
            pattern: /hostNetwork:\s*true/gi,
            message: 'Using host network bypasses network isolation',
            severity: 'high' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-250',
            type: 'Network Isolation Bypass'
        },
        {
            pattern: /hostPID:\s*true/gi,
            message: 'Using host PID namespace breaks process isolation',
            severity: 'high' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-250',
            type: 'Process Isolation Bypass'
        },
        {
            pattern: /runAsUser:\s*0/gi,
            message: 'Running as root user (UID 0) in Kubernetes pod',
            severity: 'high' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-250',
            type: 'Root User'
        },
        {
            pattern: /allowPrivilegeEscalation:\s*true/gi,
            message: 'Allowing privilege escalation can lead to container breakout',
            severity: 'high' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-250',
            type: 'Privilege Escalation'
        },
        {
            pattern: /kubectl\s+.*--insecure-skip-tls-verify/gi,
            message: 'Skipping TLS verification exposes to man-in-the-middle attacks',
            severity: 'high' as const,
            category: 'Kubernetes Security',
            cwe: 'CWE-295',
            type: 'TLS Bypass'
        },

        // Terraform Security
        {
            pattern: /ingress\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/gi,
            message: 'Security group allows access from anywhere (0.0.0.0/0)',
            severity: 'high' as const,
            category: 'Infrastructure Security',
            cwe: 'CWE-284',
            type: 'Overly Permissive Access'
        },
        {
            pattern: /cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/gi,
            message: 'CIDR block allows access from anywhere - consider restricting',
            severity: 'medium' as const,
            category: 'Infrastructure Security',
            cwe: 'CWE-284',
            type: 'Network Access Control'
        },
        {
            pattern: /publicly_accessible\s*=\s*true/gi,
            message: 'Database is publicly accessible - ensure this is intentional',
            severity: 'high' as const,
            category: 'Database Security',
            cwe: 'CWE-284',
            type: 'Public Database Access'
        },
        {
            pattern: /skip_final_snapshot\s*=\s*true/gi,
            message: 'Skipping final snapshot may lead to data loss',
            severity: 'medium' as const,
            category: 'Data Protection',
            cwe: 'CWE-404',
            type: 'Data Loss Risk'
        },
        {
            pattern: /encrypted\s*=\s*false/gi,
            message: 'Encryption disabled - data stored in plaintext',
            severity: 'high' as const,
            category: 'Data Protection',
            cwe: 'CWE-311',
            type: 'Unencrypted Data'
        },

        // CI/CD Security
        {
            pattern: /docker\s+run\s+.*--privileged/gi,
            message: 'Running Docker with --privileged flag in CI/CD pipeline',
            severity: 'high' as const,
            category: 'CI/CD Security',
            cwe: 'CWE-250',
            type: 'Privileged Container'
        },
        {
            pattern: /curl\s+.*\|\s*bash/gi,
            message: 'Piping curl output to bash is dangerous - verify scripts first',
            severity: 'high' as const,
            category: 'CI/CD Security',
            cwe: 'CWE-494',
            type: 'Remote Code Execution'
        },
        {
            pattern: /wget\s+.*\|\s*sh/gi,
            message: 'Piping wget output to shell is dangerous - verify scripts first',
            severity: 'high' as const,
            category: 'CI/CD Security',
            cwe: 'CWE-494',
            type: 'Remote Code Execution'
        },
        {
            pattern: /sudo\s+.*without.*password/gi,
            message: 'Passwordless sudo in CI/CD can be exploited',
            severity: 'medium' as const,
            category: 'CI/CD Security',
            cwe: 'CWE-250',
            type: 'Privilege Escalation'
        },

        // Infrastructure as Code
        {
            pattern: /default_security_group/gi,
            message: 'Using default security group - create custom security groups',
            severity: 'medium' as const,
            category: 'Infrastructure Security',
            cwe: 'CWE-284',
            type: 'Default Configuration'
        },
        {
            pattern: /versioning\s*=\s*false/gi,
            message: 'S3 versioning disabled - enable for data protection',
            severity: 'medium' as const,
            category: 'Data Protection',
            cwe: 'CWE-404',
            type: 'Version Control'
        },
        {
            pattern: /mfa_delete\s*=\s*false/gi,
            message: 'MFA delete disabled - enable for critical S3 buckets',
            severity: 'medium' as const,
            category: 'Data Protection',
            cwe: 'CWE-287',
            type: 'Multi-Factor Authentication'
        }
    ];

    public async analyzeDevOpsSecurity(code: string, fileType: string = 'unknown'): Promise<DevOpsSecurityResult> {
        if (!code || code.trim().length === 0) {
            return this.getEmptyResult();
        }

        // Check cache first
        const cacheKey = this.hashCode(code + fileType);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const result = this.performAnalysis(code, fileType);
        
        // Cache the result
        this.cacheResult(cacheKey, result);
        return result;
    }

    private performAnalysis(code: string, fileType: string): DevOpsSecurityResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const infrastructureIssues: string[] = [];
        const cicdIssues: string[] = [];
        const containerIssues: string[] = [];
        const kubernetesIssues: string[] = [];
        const terraformIssues: string[] = [];

        // Analyze based on file type for more accurate results
        const relevantPatterns = this.getRelevantPatterns(fileType);

        for (const pattern of relevantPatterns) {
            const matches = code.match(pattern.pattern);
            if (matches) {
                const vulnerability: SecurityVulnerability = {
                    type: pattern.type,
                    severity: pattern.severity,
                    description: pattern.message,
                    file: fileType
                };

                vulnerabilities.push(vulnerability);

                // Categorize issues
                const issueText = `${pattern.message} (Found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`;
                
                switch (pattern.category) {
                    case 'Container Security':
                        containerIssues.push(issueText);
                        break;
                    case 'Kubernetes Security':
                        kubernetesIssues.push(issueText);
                        break;
                    case 'Infrastructure Security':
                    case 'Data Protection':
                        if (fileType.includes('terraform') || fileType.includes('tf')) {
                            terraformIssues.push(issueText);
                        } else {
                            infrastructureIssues.push(issueText);
                        }
                        break;
                    case 'CI/CD Security':
                        cicdIssues.push(issueText);
                        break;
                    default:
                        infrastructureIssues.push(issueText);
                }
            }
        }

        const severity = this.calculateOverallSeverity(vulnerabilities);

        return {
            vulnerabilities,
            infrastructureIssues,
            cicdIssues,
            containerIssues,
            kubernetesIssues,
            terraformIssues,
            severity
        };
    }

    private getRelevantPatterns(fileType: string) {
        // Filter patterns based on file type for more accurate analysis
        if (fileType.toLowerCase().includes('dockerfile')) {
            return this.devopsPatterns.filter(p => p.category === 'Container Security');
        }
        
        if (fileType.toLowerCase().includes('kubernetes') || fileType.toLowerCase().includes('k8s') || 
            fileType.toLowerCase().includes('yaml') || fileType.toLowerCase().includes('yml')) {
            return this.devopsPatterns.filter(p => 
                p.category === 'Kubernetes Security' || p.category === 'Container Security'
            );
        }
        
        if (fileType.toLowerCase().includes('terraform') || fileType.toLowerCase().includes('.tf')) {
            return this.devopsPatterns.filter(p => 
                p.category === 'Infrastructure Security' || p.category === 'Data Protection'
            );
        }
        
        if (fileType.toLowerCase().includes('jenkins') || fileType.toLowerCase().includes('github') ||
            fileType.toLowerCase().includes('gitlab') || fileType.toLowerCase().includes('ci')) {
            return this.devopsPatterns.filter(p => p.category === 'CI/CD Security');
        }

        // Return all patterns for unknown file types
        return this.devopsPatterns;
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

    private getEmptyResult(): DevOpsSecurityResult {
        return {
            vulnerabilities: [],
            infrastructureIssues: [],
            cicdIssues: [],
            containerIssues: [],
            kubernetesIssues: [],
            terraformIssues: [],
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

    private cacheResult(key: string, result: DevOpsSecurityResult): void {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    public clearCache(): void {
        this.cache.clear();
    }

    // Specific analysis methods for different DevOps tools
    public async analyzeDockerfile(code: string): Promise<DevOpsSecurityResult> {
        return this.analyzeDevOpsSecurity(code, 'dockerfile');
    }

    public async analyzeKubernetesManifest(code: string): Promise<DevOpsSecurityResult> {
        return this.analyzeDevOpsSecurity(code, 'kubernetes');
    }

    public async analyzeTerraform(code: string): Promise<DevOpsSecurityResult> {
        return this.analyzeDevOpsSecurity(code, 'terraform');
    }

    public async analyzeCICD(code: string): Promise<DevOpsSecurityResult> {
        return this.analyzeDevOpsSecurity(code, 'cicd');
    }
}