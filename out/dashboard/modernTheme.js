"use strict";
// Modern Theme Enhancements for Guardian Security Dashboard
Object.defineProperty(exports, "__esModule", { value: true });
exports.modernJavaScript = exports.modernThemeCSS = void 0;
exports.modernThemeCSS = `
    /* Enhanced Loading States */
    .loading-skeleton {
        background: linear-gradient(90deg, 
            var(--vscode-panel-background) 25%, 
            var(--vscode-sideBar-background) 50%, 
            var(--vscode-panel-background) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: var(--border-radius);
        height: 20px;
        margin: 10px 0;
    }

    /* Interactive Progress Bars */
    .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--vscode-panel-background);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
        margin: 10px 0;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--success-color), var(--info-color));
        border-radius: 4px;
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: progressShine 2s infinite;
    }

    @keyframes progressShine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    /* Enhanced Cards with Glassmorphism */
    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .glass-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    }

    .glass-card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    /* Floating Action Buttons */
    .fab {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-color), var(--info-color));
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 1000;
    }

    .fab:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(0,0,0,0.3);
    }

    /* Enhanced Tooltips */
    .tooltip {
        position: relative;
        display: inline-block;
    }

    .tooltip::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--vscode-editorHoverWidget-background);
        color: var(--vscode-editorHoverWidget-foreground);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
    }

    .tooltip::before {
        content: '';
        position: absolute;
        bottom: 115%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--vscode-editorHoverWidget-background);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .tooltip:hover::after,
    .tooltip:hover::before {
        opacity: 1;
        visibility: visible;
    }

    /* Micro-interactions */
    .bounce-in {
        animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }

    .slide-up {
        animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    /* Enhanced Issue Items */
    .issue-item-modern {
        background: var(--vscode-panel-background);
        border-radius: 12px;
        padding: 20px;
        margin: 12px 0;
        border-left: 4px solid var(--error-color);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }

    .issue-item-modern::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, transparent, rgba(255,255,255,0.02));
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .issue-item-modern:hover {
        transform: translateX(8px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    .issue-item-modern:hover::before {
        opacity: 1;
    }

    /* Status Indicators */
    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-critical {
        background: rgba(244, 67, 54, 0.1);
        color: var(--error-color);
        border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .status-warning {
        background: rgba(255, 152, 0, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(255, 152, 0, 0.3);
    }

    .status-info {
        background: rgba(33, 150, 243, 0.1);
        color: var(--info-color);
        border: 1px solid rgba(33, 150, 243, 0.3);
    }

    .status-success {
        background: rgba(76, 175, 80, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(76, 175, 80, 0.3);
    }

    /* Enhanced Tabs */
    .tab-container {
        border-bottom: 2px solid var(--vscode-panel-border);
        margin-bottom: 30px;
    }

    .tab-nav {
        display: flex;
        gap: 0;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .tab-button {
        background: none;
        border: none;
        padding: 16px 24px;
        cursor: pointer;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
        transition: all 0.3s ease;
        position: relative;
        border-radius: 8px 8px 0 0;
    }

    .tab-button.active {
        color: var(--primary-color);
        background: var(--vscode-panel-background);
    }

    .tab-button::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--primary-color);
        transform: scaleX(0);
        transition: transform 0.3s ease;
    }

    .tab-button.active::after {
        transform: scaleX(1);
    }

    .tab-button:hover {
        background: var(--vscode-list-hoverBackground);
        color: var(--vscode-foreground);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .container {
            padding: 15px;
        }
        
        .stats-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .header {
            padding: 30px 20px;
        }
        
        .fab {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 20px;
        }
    }
`;
exports.modernJavaScript = `
    // Enhanced interactions
    function addModernInteractions() {
        // Add ripple effect to buttons
        document.querySelectorAll('.btn, .stat-card').forEach(element => {
            element.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card, .issue-item, .feature-card').forEach(el => {
            observer.observe(el);
        });
    }

    // Initialize modern interactions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addModernInteractions);
    } else {
        addModernInteractions();
    }
`;
//# sourceMappingURL=modernTheme.js.map