class AIDelegate {
    constructor() {
        this.apiKey = null;
        this.currentResults = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSampleRoles();
    }

    bindEvents() {
        // API Key input
        document.getElementById('apiKey').addEventListener('input', (e) => {
            this.apiKey = e.target.value.trim();
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeRole();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearResults();
        });

        // Sample role buttons
        document.querySelectorAll('.sample-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.target.getAttribute('data-role');
                document.getElementById('roleDescription').value = role;
            });
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('copyPrompt').addEventListener('click', () => {
            this.copyPrompt();
        });

        // Close modal on overlay click
        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
    }

    loadSampleRoles() {
        const sampleRoles = [
            "Chief Product Officer (CPO) в IT компании с командой 100+ человек",
            "Head of Marketing в e-commerce проекте",
            "Руководитель отдела продаж B2B SaaS",
            "CTO стартапа в финтех сфере",
            "Менеджер проектов в digital агентстве"
        ];
    }

    async analyzeRole() {
        const roleDescription = document.getElementById('roleDescription').value.trim();
        
        if (!this.apiKey) {
            this.showError('Пожалуйста, введите OpenAI API ключ');
            return;
        }

        if (!roleDescription) {
            this.showError('Пожалуйста, опишите вашу роль');
            return;
        }

        this.showLoading(true);
        
        try {
            const recommendations = await this.callOpenAI(roleDescription);
            this.displayResults(recommendations);
        } catch (error) {
            console.error('Error analyzing role:', error);
            this.showError('Ошибка при анализе роли: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async callOpenAI(roleDescription) {
        const systemPrompt = `Ты эксперт по автоматизации бизнес-процессов и внедрению AI агентов. Твоя задача - проанализировать описание роли пользователя и создать персонализированные рекомендации по автоматизации.

КОНТЕКСТ: Российский рынок, современные инструменты автоматизации (Zapier, UiPath, AI агенты), фокус на практическое применение и ROI.

ИНСТРУКЦИИ:
1. Проанализируй роль и определи ключевые функции для автоматизации
2. Сгенерируй минимум 6 конкретных кейсов автоматизации
3. Для каждого кейса создай детальный системный промпт для AI агента
4. Учитывай специфику российского рынка и доступные инструменты

ФОРМАТ ОТВЕТА - строго JSON:
{
  "roleAnalysis": "детальный анализ роли (2-3 предложения)",
  "bestPractices": "лучшие практики автоматизации для данной роли (2-3 предложения)", 
  "automationCases": [
    {
      "title": "конкретное название функции",
      "description": "подробное описание что именно автоматизируется",
      "priority": "высокий/средний/низкий", 
      "roiEstimate": "30-50%",
      "complexity": "низкая/средняя/высокая",
      "tools": ["конкретный инструмент 1", "конкретный инструмент 2"],
      "systemPrompt": "Детальный системный промпт для AI агента с конкретными инструкциями, форматом ответа и примерами. Минимум 200 слов."
    }
  ]
}

ТРЕБОВАНИЯ К СИСТЕМНЫМ ПРОМПТАМ:
- Конкретные, actionable инструкции
- Формат входных и выходных данных
- Примеры использования
- Критерии качества результата
- Обработка edge cases

Роль для анализа: ${roleDescription}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw content:', content);
            throw new Error('Ошибка парсинга ответа от OpenAI');
        }
    }

    displayResults(recommendations) {
        this.currentResults = recommendations;
        
        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Update role analysis
        document.getElementById('roleAnalysisContent').textContent = recommendations.roleAnalysis;
        document.getElementById('bestPracticesContent').textContent = recommendations.bestPractices;
        
        // Update recommendations count
        const count = recommendations.automationCases.length;
        document.getElementById('recommendationsCount').textContent = `${count} рекомендаций`;
        
        // Display automation cases
        this.displayAutomationCases(recommendations.automationCases);
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    displayAutomationCases(cases) {
        const grid = document.getElementById('automationGrid');
        grid.innerHTML = '';
        
        cases.forEach((caseItem, index) => {
            const caseElement = this.createCaseElement(caseItem, index);
            grid.appendChild(caseElement);
        });
    }

    createCaseElement(caseItem, index) {
        const element = document.createElement('div');
        element.className = 'automation-case fade-in';
        
        const priorityClass = this.getPriorityClass(caseItem.priority);
        const complexityText = this.getComplexityText(caseItem.complexity);
        
        element.innerHTML = `
            <div class="case-header">
                <h4 class="case-title">${caseItem.title}</h4>
                <p class="case-description">${caseItem.description}</p>
            </div>
            
            <div class="case-meta">
                <div class="meta-item">
                    <span class="meta-label">Приоритет:</span>
                    <span class="priority-badge ${priorityClass}">${caseItem.priority}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Сложность:</span>
                    <span class="meta-value">${caseItem.complexity} (${complexityText})</span>
                </div>
            </div>
            
            <div class="case-tools">
                <div class="tools-label">Рекомендуемые инструменты:</div>
                <div class="tools-list">
                    ${caseItem.tools.map(tool => `<span class="tool-tag">${tool}</span>`).join('')}
                </div>
            </div>
            
            <div class="case-footer">
                <div class="roi-estimate">ROI: ${caseItem.roiEstimate}</div>
                <button class="prompt-btn" data-case-index="${index}">Системный промпт</button>
            </div>
        `;
        
        // Add event listener for prompt button
        const promptBtn = element.querySelector('.prompt-btn');
        promptBtn.addEventListener('click', () => {
            this.showSystemPrompt(caseItem.title, caseItem.systemPrompt);
        });
        
        return element;
    }

    getPriorityClass(priority) {
        const classes = {
            'высокий': 'priority-high',
            'средний': 'priority-medium', 
            'низкий': 'priority-low'
        };
        return classes[priority] || 'priority-low';
    }

    getComplexityText(complexity) {
        const texts = {
            'низкая': '1-2 недели внедрения',
            'средняя': '1-2 месяца внедрения',
            'высокая': '3+ месяцев внедрения'
        };
        return texts[complexity] || '1-2 недели внедрения';
    }

    showSystemPrompt(title, prompt) {
        document.getElementById('modalTitle').textContent = `Системный промпт: ${title}`;
        document.getElementById('systemPromptContent').textContent = prompt;
        document.getElementById('promptModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('promptModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    async copyPrompt() {
        const promptContent = document.getElementById('systemPromptContent').textContent;
        
        try {
            await navigator.clipboard.writeText(promptContent);
            this.showSuccess('Промпт скопирован в буфер обмена');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = promptContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Промпт скопирован в буфер обмена');
        }
    }

    clearResults() {
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('automationGrid').innerHTML = '';
        this.currentResults = null;
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoader = analyzeBtn.querySelector('.btn-loader');
        
        if (show) {
            loadingIndicator.classList.remove('hidden');
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('loading');
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            loadingIndicator.classList.add('hidden');
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('loading');
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    showError(message) {
        this.removeMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const roleSection = document.querySelector('.role-section .card__body');
        roleSection.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        this.removeMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const modalFooter = document.querySelector('.modal-footer');
        modalFooter.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    removeMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(msg => {
            msg.remove();
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AIDelegate();
});

// Handle escape key for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('promptModal');
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }
});