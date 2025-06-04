class AIDelegate {
    constructor() {
        this.apiKey = null;
        this.apiProvider = 'openai';
        this.currentResults = null;
        this.readCases = new Set(); // Множество прочитанных кейсов
        this.currentTheme = 'dark'; // По умолчанию темная тема
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSampleRoles();
        this.updateApiKeyPlaceholder();
        this.loadReadCases(); // Загружаем прочитанные кейсы из localStorage
        this.initTheme(); // Инициализируем тему
    }

    bindEvents() {
        // API Provider selection
        document.getElementById('apiProvider').addEventListener('change', (e) => {
            this.apiProvider = e.target.value;
            this.updateApiKeyPlaceholder();
        });

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

        // Generate more button
        document.getElementById('generateMoreBtn').addEventListener('click', () => {
            this.generateMoreCases();
        });

        // Test API button
        document.getElementById('testApiBtn').addEventListener('click', () => {
            this.testApiConnection();
        });

        // Theme toggle button
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
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

        // Sample role buttons
        document.querySelectorAll('.sample-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.target.getAttribute('data-role');
                document.getElementById('roleDescription').value = role;
            });
        });
    }

    // Инициализация темы
    initTheme() {
        const savedTheme = localStorage.getItem('ai-scout-theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Определяем предпочтения системы
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        this.applyTheme(this.currentTheme);
    }

    // Переключение темы
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        this.saveTheme();
    }

    // Применение темы
    applyTheme(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        
        // Добавляем класс для плавной анимации
        document.body.classList.add('theme-transition');
        
        // Применяем тему через data-атрибут к document.documentElement
        document.documentElement.setAttribute('data-color-scheme', theme);
        
        // Обновляем иконку
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Убираем класс анимации через 300ms
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }

    // Сохранение темы в localStorage
    saveTheme() {
        try {
            localStorage.setItem('ai-scout-theme', this.currentTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
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
        
        console.log('=== Starting analyzeRole ===');
        console.log('Role description:', roleDescription);
        console.log('API key set:', !!this.apiKey);
        console.log('API provider:', this.apiProvider);
        
        if (!this.apiKey) {
            console.error('No API key provided');
            this.showError('Пожалуйста, введите API ключ для выбранного провайдера');
            return;
        }

        if (!roleDescription) {
            console.error('No role description provided');
            this.showError('Пожалуйста, опишите вашу роль');
            return;
        }

        this.showLoading(true);
        
        // Очищаем предыдущие результаты и подготавливаем интерфейс
        this.prepareResultsDisplay();
        
        try {
            console.log('Calling AI API...');
            const recommendations = await this.callAI(roleDescription);
            console.log('AI API call successful, displaying results');
            
            // Постепенно отображаем результаты
            await this.displayResultsGradually(recommendations);
            
            this.showSuccess('✅ Рекомендации успешно сгенерированы!');
        } catch (error) {
            console.error('=== Error in analyzeRole ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            this.showError('Ошибка при анализе роли: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    prepareResultsDisplay() {
        // Показываем секцию анализа
        const analysisSection = document.getElementById('analysisSection');
        analysisSection.classList.remove('hidden');
        
        // Очищаем списки кейсов
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = '<div class="loading-cases">Генерируем кейсы...</div>';
        
        // Очищаем детали кейса
        const caseDetails = document.getElementById('caseDetails');
        caseDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Кейсы генерируются, скоро появятся подробности...</p>
            </div>
        `;
        
        // Скрываем кнопку "Сгенерировать еще"
        document.getElementById('generateMoreBtn').classList.add('hidden');
    }

    async displayResultsGradually(recommendations) {
        this.currentResults = recommendations;
        
        // Сначала показываем анализ роли и лучшие практики
        document.getElementById('roleAnalysisContent').textContent = recommendations.roleAnalysis;
        document.getElementById('bestPracticesContent').textContent = recommendations.bestPractices;
        
        // Очищаем список кейсов
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = '';
        
        // Постепенно добавляем кейсы с задержкой для создания эффекта "появления"
        for (let i = 0; i < recommendations.automationCases.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms задержка между кейсами
            
            const caseItem = recommendations.automationCases[i];
            const caseElement = this.createCaseListItem(caseItem, i);
            
            // Добавляем с анимацией появления
            caseElement.style.opacity = '0';
            caseElement.style.transform = 'translateY(20px)';
            casesList.appendChild(caseElement);
            
            // Анимация появления
            setTimeout(() => {
                caseElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                caseElement.style.opacity = '1';
                caseElement.style.transform = 'translateY(0)';
            }, 50);
            
            // Обновляем счетчик кейсов
            this.updateCasesCount(i + 1);
        }
        
        // Показываем кнопку "Сгенерировать еще"
        setTimeout(() => {
            document.getElementById('generateMoreBtn').classList.remove('hidden');
        }, 500);
    }

    async generateMoreCases() {
        if (!this.apiKey) {
            this.showError('Пожалуйста, введите OpenAI API ключ');
            return;
        }

        if (!this.currentResults) {
            this.showError('Сначала выполните анализ роли');
            return;
        }

        const roleDescription = document.getElementById('roleDescription').value.trim();
        this.showMoreLoading(true);
        
        try {
            const existingTitles = this.currentResults.automationCases.map(c => c.title);
            const newRecommendations = await this.callAIForMore(roleDescription, existingTitles);
            this.addMoreResults(newRecommendations);
        } catch (error) {
            console.error('Error generating more cases:', error);
            this.showError('Ошибка при генерации дополнительных кейсов: ' + error.message);
        } finally {
            this.showMoreLoading(false);
        }
    }

    async callAI(roleDescription) {
        switch (this.apiProvider) {
            case 'openai':
                return await this.callOpenAI(roleDescription);
            case 'anthropic':
                return await this.callClaude(roleDescription);
            case 'gigachat':
                return await this.callGigaChat(roleDescription);
            case 'yandexgpt':
                return await this.callYandexGPT(roleDescription);
            default:
                throw new Error('Неподдерживаемый AI провайдер');
        }
    }

    async callOpenAI(roleDescription) {
        const systemPrompt = `Ты эксперт по автоматизации бизнес-процессов и внедрению AI агентов.

КРИТИЧЕСКИ ВАЖНО: Сосредоточься ТОЛЬКО на конкретных задачах, которые пользователь описал в своей роли. НЕ добавляй общие рекомендации или стандартные процессы, которые не упомянуты в описании роли.

АЛГОРИТМ АНАЛИЗА:
1. ВНИМАТЕЛЬНО прочитай описание роли и зафиксируй каждую задачу, сформулированную в явном виде (глагол + существительное, напр. «контролирую оплату подрядчиков»).  
2. ВЫДЕЛИ только те конкретные задачи и процессы, которые упомянул пользователь. Отфильтруй на автоматизируемость. Оцени каждую задачу по критериям: 1) наличие цифрового входа/выхода данных. 2) повторяемость ≥ 1 раз в месяц. 3) влияние на деньги/срок/качество. Сгруппируй взаимосвязанные задачи, чтобы избежать дублирования.     
3. ПРОИГНОРИРУЙ общие лучшие практики - фокусируйся только на описанных задачах
4. Для КАЖДОЙ упомянутой задачи создай кейс с AI агентом
5. ОБЯЗАТЕЛЬНО создай РОВНО 6 кейсов с AI агентами для описанных задач
6. Если пользователь упомянул менее 6 задач, создай более глубокую автоматизацию для этих задач (разные аспекты, подзадачи)

СТРОГИЕ ПРАВИЛА:
- ЗАПРЕЩЕНО: Добавлять задачи, которые не упоминал пользователь
- ЗАПРЕЩЕНО: Общие рекомендации типа "email-уведомления" если пользователь о них не писал
- ОБЯЗАТЕЛЬНО: Использовать точные формулировки и контекст из описания роли
- ОБЯЗАТЕЛЬНО: Ссылаться на конкретные инструменты/системы, упомянутые пользователем
- ОБЯЗАТЕЛЬНО: Создать РОВНО 6 кейсов автоматизации в массиве automationCases
- ОБЯЗАТЕЛЬНО: Названия кейсов должны начинаться со слова "агент"

КОНТЕКСТ: Российский рынок, современные инструменты автоматизации (Make, n8n, Telegram, Bitrix24, Yandex Cloud), фокус на практическое применение.

КРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста. Начни ответ сразу с {

ФОРМАТ ОТВЕТА - строго JSON с РОВНО 6 кейсами:
{
  "roleAnalysis": "детальный анализ ТОЛЬКО тех задач, которые описал пользователь (2-3 предложения)",
  "bestPractices": "рекомендации по автоматизации конкретно для ОПИСАННЫХ пользователем задач (2-3 предложения)", 
  "automationCases": [
    {
      "title": "агент для конкретной задачи ИЗ ОПИСАНИЯ пользователя",
      "description": "подробное описание AI агента для ИМЕННО этой задачи",
      "priority": "высокий/средний/низкий", 
      "roiEstimate": "10-50%",
      "complexity": "низкая/средняя/высокая",
      "tools": ["конкретный инструмент 1", "конкретный инструмент 2"],
      "systemPrompt": "Детальный системный промпт для AI агента с конкретными инструкциями для ЭТОЙ КОНКРЕТНОЙ задачи из описания роли. Минимум 300 слов.",
      "automationPipeline": {
        "platform": "Make/n8n",
        "steps": [
          {
            "step": 1,
            "action": "Триггер для КОНКРЕТНОЙ задачи пользователя",
            "tool": "Релевантный инструмент",
            "description": "Краткое описание шага"
          },
          {
            "step": 2,
            "action": "Обработка данных для этой задачи",
            "tool": "OpenAI/Claude",
            "description": "Краткое описание шага"
          },
          {
            "step": 3,
            "action": "Результат выполнения задачи",
            "tool": "Релевантный инструмент",
            "description": "Краткое описание шага"
          }
        ]
      }
    }
  ]
}

ВАЖНО: в пайплайне должно быть МИНИМУМ 3 шага, цепочка шагов должна полностью покрывать задачу
ВАЖНО: В массиве automationCases должно быть РОВНО 6 элементов.
ВАЖНО: Названия ВСЕХ кейсов должны начинаться со слова "агент" (например: "агент управления roadmap", "агент координации команд")

ПРИМЕР ПРАВИЛЬНОГО ПОДХОДА:
Если пользователь написал "управляю roadmap продукта", создай кейс "агент управления roadmap продукта".
Если пользователь написал "координирую команды разработки", создай кейс "агент координации команд разработки".
НЕ добавляй кейсы по email или CRM, если пользователь о них не упоминал.

АНАЛИЗИРУЕМАЯ РОЛЬ:
${roleDescription}`;

        console.log('=== API Request Debug Info ===');
        console.log('API Key length:', this.apiKey ? this.apiKey.length : 'not set');
        console.log('API Key starts with sk-:', this.apiKey ? this.apiKey.startsWith('sk-') : false);
        console.log('Role description length:', roleDescription.length);

        const requestBody = {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 6000,
            stream: false // Используем обычный режим для упрощения
        };

        console.log('Sending request to OpenAI...');

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response text:', errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    console.error('Parsed error data:', errorData);
                    
                    if (response.status === 401) {
                        throw new Error('Неверный API ключ. Проверьте правильность ключа OpenAI.');
                    } else if (response.status === 429) {
                        throw new Error('Превышен лимит запросов. Попробуйте позже.');
                    } else if (response.status === 400) {
                        throw new Error('Ошибка в запросе: ' + (errorData.error?.message || 'неизвестная ошибка'));
                    } else {
                        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || errorText}`);
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    throw new Error(`HTTP ${response.status}: ${errorText || 'Неизвестная ошибка сервера'}`);
                }
            }

            const data = await response.json();
            console.log('Response received, processing...');
            
            let content = data.choices[0].message.content.trim();
            
            console.log('Raw OpenAI response length:', content.length);
            console.log('First 200 chars:', content.substring(0, 200));
            
            // Очистка и парсинг JSON
            try {
                // Если ответ начинается не с {, попробуем найти JSON
                if (!content.startsWith('{')) {
                    console.log('Response does not start with {, searching for JSON...');
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        content = jsonMatch[0];
                        console.log('Found JSON match');
                    } else {
                        console.error('No JSON found in response');
                        // Попробуем использовать fallback
                        console.log('Using fallback response');
                        return this.getFallbackResponse();
                    }
                }
                
                // Очистка кодировки
                content = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
                content = content.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
                
                console.log('Attempting to parse JSON...');
                const result = JSON.parse(content);
                console.log('JSON parsed successfully');
                
                // Валидация
                if (!result.roleAnalysis || !result.bestPractices || !result.automationCases) {
                    console.error('Missing required fields');
                    return this.getFallbackResponse();
                }
                
                if (!Array.isArray(result.automationCases)) {
                    console.error('automationCases is not an array');
                    return this.getFallbackResponse();
                }
                
                // Если меньше 6 кейсов, дополняем fallback данными
                if (result.automationCases.length < 6) {
                    console.log(`Only ${result.automationCases.length} cases received, padding with fallback`);
                    const fallback = this.getFallbackResponse();
                    const needed = 6 - result.automationCases.length;
                    result.automationCases.push(...fallback.automationCases.slice(0, needed));
                }
                
                // Ограничиваем до 6 кейсов
                result.automationCases = result.automationCases.slice(0, 6);
                
                console.log('Validation passed, returning result');
                return result;
                
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError.message);
                console.error('Content that failed to parse (first 500 chars):', content.substring(0, 500));
                
                // Используем fallback при ошибке парсинга
                console.log('Parse failed, using fallback response');
                return this.getFallbackResponse();
            }
            
        } catch (networkError) {
            console.error('Network Error:', networkError.message);
            
            if (networkError.name === 'TypeError' && networkError.message.includes('Failed to fetch')) {
                throw new Error('Ошибка соединения с OpenAI API. Для доступа из России требуется VPN.');
            } else {
                throw new Error(`Ошибка соединения с API: ${networkError.message}`);
            }
        }
    }

    async callOpenAIForMore(roleDescription, existingTitles) {
        const systemPrompt = `Ты эксперт по автоматизации бизнес-процессов и внедрению AI агентов. Пользователь уже получил первый набор рекомендаций и хочет еще 6 ДОПОЛНИТЕЛЬНЫХ кейсов автоматизации.

КОНТЕКСТ: Российский рынок, современные инструменты автоматизации (Zapier, UiPath, AI агенты), фокус на практическое применение и ROI.

УЖЕ ПРЕДЛОЖЕННЫЕ КЕЙСЫ (НЕ ПОВТОРЯЙ ИХ):
${existingTitles.map(title => `- ${title}`).join('\n')}

ИНСТРУКЦИИ:
1. Сгенерируй 6 НОВЫХ кейсов автоматизации, которые НЕ дублируют уже предложенные
2. Фокусируйся на более специализированных или менее приоритетных функциях
3. Создай детальный системный промпт для каждого AI агента
4. Рассмотри менее очевидные, но полезные процессы для автоматизации

КРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста. Начни ответ сразу с {

ФОРМАТ ОТВЕТА - строго JSON:
{
  "automationCases": [
    {
      "title": "конкретное название функции (НЕ ПОВТОРЯЮЩЕЕ УЖЕ ПРЕДЛОЖЕННЫЕ)",
      "description": "подробное описание что именно автоматизируется",
      "priority": "высокий/средний/низкий", 
      "roiEstimate": "30-50%",
      "complexity": "низкая/средняя/высокая",
      "tools": ["конкретный инструмент 1", "конкретный инструмент 2"],
      "systemPrompt": "Детальный системный промпт для AI агента с конкретными инструкциями, форматом ответа и примерами. Минимум 200 слов.",
      "automationPipeline": {
        "platform": "Make/n8n",
        "steps": [
          {
            "step": 1,
            "action": "Триггер (например: Получение email)",
            "tool": "Gmail/Outlook",
            "description": "Краткое описание шага"
          },
          {
            "step": 2,
            "action": "Обработка данных",
            "tool": "OpenAI/Claude",
            "description": "Краткое описание шага"
          }
        ]
      }
    }
  ]
}

ТРЕБОВАНИЯ К СИСТЕМНЫМ ПРОМПТАМ:
- Конкретные, actionable инструкции
- Формат входных и выходных данных
- Примеры использования
- Критерии качества результата
- Обработка edge cases

ТРЕБОВАНИЯ К ПАЙПЛАЙНАМ АВТОМАТИЗАЦИИ:
- Используй платформы Make (Integromat) или n8n
- 3-7 шагов в пайплайне
- Конкретные триггеры и действия
- Популярные интеграции (Gmail, Slack, Telegram, Google Sheets)
- Реалистичная реализация без сложного кода

Роль для анализа: ${roleDescription}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
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
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        console.log('Raw OpenAI response for more cases:', content);
        
        // Попробуем извлечь JSON из ответа
        try {
            // Если ответ начинается не с {, попробуем найти JSON
            if (!content.startsWith('{')) {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                } else {
                    throw new Error('JSON не найден в ответе');
                }
            }
            
            // Попробуем очистить возможные проблемы с кодировкой
            content = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
            // Исправляем возможные проблемы с кавычками
            content = content.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
            
            const result = JSON.parse(content);
            
            // Проверим обязательные поля
            if (!result.automationCases || !Array.isArray(result.automationCases)) {
                throw new Error('Нет кейсов автоматизации в ответе');
            }
            
            return result;
            
        } catch (parseError) {
            console.error('JSON parse error for more cases:', parseError);
            console.error('Content that failed to parse:', content);
            
            // Fallback: создадим дополнительные базовые кейсы
            const fallbackResponse = {
                automationCases: [
                    {
                        title: "Автоматизация отчетности",
                        description: "Автоматическое создание еженедельных и месячных отчетов",
                        priority: "средний",
                        roiEstimate: "15-25%",
                        complexity: "средняя",
                        tools: ["Google Sheets API", "Power BI"],
                        systemPrompt: "Ты помощник для автоматизации отчетности. Собирай данные из различных источников, анализируй тренды и создавай структурированные отчеты с ключевыми метриками.",
                        automationPipeline: {
                            platform: "Make",
                            steps: [
                                {
                                    step: 1,
                                    action: "Получение данных из Google Sheets",
                                    tool: "Google Sheets API",
                                    description: "Триггер при получении новых данных"
                                },
                                {
                                    step: 2,
                                    action: "Анализ данных",
                                    tool: "Power BI",
                                    description: "Анализ данных и создание отчета"
                                },
                                {
                                    step: 3,
                                    action: "Отправка отчета",
                                    tool: "Email",
                                    description: "Отправка отчета на email руководителя"
                                }
                            ]
                        }
                    },
                    {
                        title: "Автоматизация социальных сетей",
                        description: "Планирование и публикация контента в социальных сетях",
                        priority: "низкий",
                        roiEstimate: "10-20%",
                        complexity: "низкая",
                        tools: ["Buffer", "Telegram Bot API"],
                        systemPrompt: "Ты помощник для управления социальными сетями. Создавай контент-план, планируй публикации и анализируй эффективность постов.",
                        automationPipeline: {
                            platform: "Make",
                            steps: [
                                {
                                    step: 1,
                                    action: "Создание контента",
                                    tool: "OpenAI",
                                    description: "Генерация постов для соцсетей"
                                },
                                {
                                    step: 2,
                                    action: "Планирование публикации",
                                    tool: "Buffer",
                                    description: "Автоматическая публикация в соцсети"
                                }
                            ]
                        }
                    },
                    {
                        title: "Автоматизация обработки документов",
                        description: "Автоматическое извлечение и обработка данных из документов",
                        priority: "средний",
                        roiEstimate: "25-35%",
                        complexity: "высокая",
                        tools: ["OCR API", "Google Drive API"],
                        systemPrompt: "Ты помощник для обработки документов. Извлекай текст из PDF, анализируй содержимое и структурируй данные.",
                        automationPipeline: {
                            platform: "n8n",
                            steps: [
                                {
                                    step: 1,
                                    action: "Получение документа",
                                    tool: "Google Drive",
                                    description: "Триггер при загрузке нового документа"
                                },
                                {
                                    step: 2,
                                    action: "Извлечение текста",
                                    tool: "OCR API",
                                    description: "Распознавание текста в документе"
                                },
                                {
                                    step: 3,
                                    action: "Обработка данных",
                                    tool: "OpenAI",
                                    description: "Структурирование извлеченных данных"
                                }
                            ]
                        }
                    },
                    {
                        title: "Автоматизация backup данных",
                        description: "Регулярное резервное копирование важных данных",
                        priority: "высокий",
                        roiEstimate: "40-60%",
                        complexity: "средняя",
                        tools: ["Google Drive API", "Yandex.Disk API"],
                        systemPrompt: "Ты помощник для резервного копирования. Следи за важными файлами, создавай бэкапы и уведомляй о статусе операций.",
                        automationPipeline: {
                            platform: "Make",
                            steps: [
                                {
                                    step: 1,
                                    action: "Проверка файлов",
                                    tool: "File System",
                                    description: "Ежедневная проверка изменений"
                                },
                                {
                                    step: 2,
                                    action: "Создание бэкапа",
                                    tool: "Google Drive",
                                    description: "Загрузка измененных файлов"
                                },
                                {
                                    step: 3,
                                    action: "Уведомление",
                                    tool: "Telegram",
                                    description: "Отчет о статусе бэкапа"
                                }
                            ]
                        }
                    },
                    {
                        title: "Автоматизация мониторинга конкурентов",
                        description: "Отслеживание цен и новостей конкурентов",
                        priority: "низкий",
                        roiEstimate: "15-30%",
                        complexity: "средняя",
                        tools: ["Web Scraping", "RSS Parser"],
                        systemPrompt: "Ты помощник для мониторинга конкурентов. Отслеживай изменения цен, новые продукты и новости компаний-конкурентов.",
                        automationPipeline: {
                            platform: "n8n",
                            steps: [
                                {
                                    step: 1,
                                    action: "Сбор данных с сайтов",
                                    tool: "Web Scraper",
                                    description: "Ежедневный парсинг сайтов конкурентов"
                                },
                                {
                                    step: 2,
                                    action: "Анализ изменений",
                                    tool: "OpenAI",
                                    description: "Выявление значимых изменений"
                                },
                                {
                                    step: 3,
                                    action: "Отправка отчета",
                                    tool: "Slack",
                                    description: "Уведомление команды об изменениях"
                                }
                            ]
                        }
                    },
                    {
                        title: "Автоматизация инвентаризации",
                        description: "Учет и контроль материальных ценностей",
                        priority: "средний",
                        roiEstimate: "20-35%",
                        complexity: "низкая",
                        tools: ["QR Scanner", "Google Sheets"],
                        systemPrompt: "Ты помощник для управления инвентарем. Отслеживай движение товаров, контролируй остатки и планируй закупки.",
                        automationPipeline: {
                            platform: "Make",
                            steps: [
                                {
                                    step: 1,
                                    action: "Сканирование QR-кода",
                                    tool: "QR Scanner",
                                    description: "Считывание информации о товаре"
                                },
                                {
                                    step: 2,
                                    action: "Обновление базы",
                                    tool: "Google Sheets",
                                    description: "Запись данных в таблицу"
                                },
                                {
                                    step: 3,
                                    action: "Проверка остатков",
                                    tool: "OpenAI",
                                    description: "Анализ необходимости докупки"
                                }
                            ]
                        }
                    }
                ]
            };
            
            return fallbackResponse;
        }
    }

    displayResults(recommendations) {
        this.currentResults = recommendations;
        
        // Show analysis section
        const analysisSection = document.getElementById('analysisSection');
        analysisSection.classList.remove('hidden');
        
        // Update analysis content
        document.getElementById('roleAnalysisContent').textContent = recommendations.roleAnalysis;
        document.getElementById('bestPracticesContent').textContent = recommendations.bestPractices;
        
        // Show generate more button
        document.getElementById('generateMoreBtn').classList.remove('hidden');
        
        // Display cases in center panel
        this.displayCasesList(recommendations.automationCases);
        
        // Update cases count
        this.updateCasesCount(recommendations.automationCases.length);
    }

    displayCasesList(cases) {
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = '';
        
        cases.forEach((caseItem, index) => {
            const caseElement = this.createCaseListItem(caseItem, index);
            casesList.appendChild(caseElement);
        });
    }

    createCaseListItem(caseItem, index) {
        const caseId = this.generateCaseId(caseItem, index);
        const isRead = this.readCases.has(caseId);
        
        console.log(`Creating case ${index}: ID=${caseId}, isRead=${isRead}`); // Отладка
        
        const div = document.createElement('div');
        div.className = `case-item ${isRead ? 'read' : 'unread'}`;
        div.dataset.index = index;
        div.dataset.caseId = caseId;
        
        div.innerHTML = `
            <div class="case-item-title">${caseItem.title}</div>
            <div class="case-item-description">${caseItem.description}</div>
            <div class="case-item-meta">
                <div class="meta-item">
                    <span class="meta-label">Приоритет:</span>
                    <span class="priority-badge priority-${caseItem.priority.toLowerCase()}">${caseItem.priority}</span>
            </div>
                <div class="meta-item">
                    <span class="meta-label">Сложность:</span>
                    <span class="meta-value">${caseItem.complexity}</span>
                </div>
            </div>
            <div class="case-tools">
                ${caseItem.tools.map(tool => `<span class="tool-tag">${tool}</span>`).join('')}
            </div>
        `;
        
        // Add click handler
        div.addEventListener('click', () => {
            this.selectCase(caseItem, index, div, caseId);
        });
        
        return div;
    }

    selectCase(caseItem, index, element, caseId) {
        // Remove active class from all items
        document.querySelectorAll('.case-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item
        element.classList.add('active');
        
        // Пометить кейс как прочитанный
        this.markCaseAsRead(caseId);
        
        // Display case details in right panel
        this.displayCaseDetails(caseItem, index);
    }

    displayCaseDetails(caseItem, index) {
        const caseDetails = document.getElementById('caseDetails');
        
        caseDetails.innerHTML = `
            <div class="case-detail-content">
                <div class="detail-section">
                    <h4>${caseItem.title}</h4>
                    <div class="detail-text">${caseItem.description}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Метрики</h4>
                    <div class="case-item-meta">
                <div class="meta-item">
                    <span class="meta-label">Приоритет:</span>
                            <span class="priority-badge priority-${caseItem.priority.toLowerCase()}">${caseItem.priority}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Сложность:</span>
                            <span class="meta-value">${caseItem.complexity}</span>
                        </div>
                </div>
            </div>
            
                <div class="detail-section">
                    <h4>Рекомендуемые инструменты</h4>
            <div class="case-tools">
                    ${caseItem.tools.map(tool => `<span class="tool-tag">${tool}</span>`).join('')}
                </div>
            </div>
            
                <div class="detail-section">
                    <h4>Пайплайн автоматизации</h4>
                    <div class="pipeline-steps">
                        ${caseItem.automationPipeline.steps.map(step => `
                            <div class="pipeline-step" data-step="${step.step}">
                                <div class="step-content">
                                    <div class="step-action">${step.action}</div>
                                    <div class="step-tool">${step.tool}</div>
                                    <div class="step-description">${step.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Системный промпт</h4>
                    <div class="detail-text" style="max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 11px; background: var(--bg-primary); padding: 12px; border-radius: 4px; border: 1px solid var(--border-color);">
                        ${caseItem.systemPrompt}
                    </div>
                </div>
                
                <div class="export-actions">
                    <button class="export-btn" onclick="app.showSystemPrompt('${caseItem.title}', \`${caseItem.systemPrompt.replace(/`/g, '\\`')}\`)">
                        Показать промпт
                    </button>
                    <button class="export-btn" onclick="app.exportWorkflowJSON(${JSON.stringify(caseItem).replace(/"/g, '&quot;')}, ${index})">
                        Скачать Make JSON
                    </button>
                    <button class="export-btn" onclick="app.exportN8nJSON(${JSON.stringify(caseItem).replace(/"/g, '&quot;')}, ${index})">
                        Скачать n8n JSON
                    </button>
                    <button class="export-btn" onclick="app.exportCaseMarkdown(${JSON.stringify(caseItem).replace(/"/g, '&quot;')}, ${index})">
                        Скачать MD
                    </button>
                </div>
            </div>
        `;
    }

    updateCasesCount(count) {
        document.getElementById('casesCount').textContent = `${count} кейс${count === 1 ? '' : count < 5 ? 'а' : 'ов'}`;
    }

    addMoreResults(newRecommendations) {
        // Add new cases to current results
        this.currentResults.automationCases = [...this.currentResults.automationCases, ...newRecommendations.automationCases];
        
        // Update display
        this.displayCasesList(this.currentResults.automationCases);
        this.updateCasesCount(this.currentResults.automationCases.length);
        
        this.showSuccess(`Добавлено ${newRecommendations.automationCases.length} новых кейсов`);
    }

    exportN8nJSON(caseItem, index) {
        const n8nWorkflow = this.generateN8nWorkflow(caseItem);
        const fileName = `n8n-${this.slugify(caseItem.title)}.json`;
        this.downloadJSON(n8nWorkflow, fileName);
        this.showSuccess('n8n workflow скачан!');
    }

    clearResults() {
        this.currentResults = null;
        
        // Сбрасываем состояние прочитанности для текущих кейсов
        this.clearReadCases();
        
        // Hide analysis section
        document.getElementById('analysisSection').classList.add('hidden');
        
        // Clear cases list
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <p>Опишите вашу роль и нажмите "Сгенерировать рекомендации" чтобы увидеть кейсы автоматизации</p>
            </div>
        `;
        
        // Clear case details
        const caseDetails = document.getElementById('caseDetails');
        caseDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Выберите кейс из списка чтобы увидеть подробную информацию, пайплайн автоматизации и системный промпт</p>
            </div>
        `;
        
        // Update cases count
        this.updateCasesCount(0);
        
        // Hide generate more button
        document.getElementById('generateMoreBtn').classList.add('hidden');
    }

    // Очистить все прочитанные кейсы
    clearReadCases() {
        this.readCases.clear();
        this.saveReadCases();
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showLoading(show) {
        const btn = document.getElementById('analyzeBtn');
        const progressContainer = document.getElementById('generationProgress');
        
        console.log('showLoading called with show:', show);
        console.log('analyzeBtn element found:', !!btn);
        console.log('generationProgress element found:', !!progressContainer);
        
        if (!btn || !progressContainer) {
            console.error('Required elements not found for loading state');
            return;
        }
        
        if (show) {
            // Скрываем кнопку и показываем прогресс-бар
            btn.style.display = 'none';
            progressContainer.classList.remove('hidden');
            
            // Начинаем анимацию прогресса
            this.startProgressAnimation();
        } else {
            // Показываем кнопку и скрываем прогресс-бар
            btn.style.display = 'flex';
            progressContainer.classList.add('hidden');
            
            // Сбрасываем прогресс
            this.resetProgress();
        }
    }

    startProgressAnimation() {
        const progressFill = document.getElementById('progressFill');
        const progressTexts = [
            'Анализируем вашу роль...',
            'Ищем автоматизируемые задачи...',
            'Создаем кейсы автоматизации...',
            'Финализируем рекомендации...'
        ];
        
        console.log('startProgressAnimation called');
        console.log('progressFill element found:', !!progressFill);
        
        if (!progressFill) {
            console.error('progressFill element not found');
            return;
        }
        
        let currentStep = 0;
        const totalSteps = progressTexts.length;
        
        // Симулируем прогресс
        const progressInterval = setInterval(() => {
            if (currentStep < totalSteps) {
                // Обновляем прогресс-бар
                const progress = ((currentStep + 1) / totalSteps) * 100;
                progressFill.style.width = progress + '%';
                
                // Обновляем текст
                const progressText = document.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = progressTexts[currentStep];
                }
                
                currentStep++;
            } else {
                clearInterval(progressInterval);
            }
        }, 1500); // Каждые 1.5 секунды переключаем шаг
        
        // Сохраняем интервал для возможности очистки
        this.progressInterval = progressInterval;
    }

    resetProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.querySelector('.progress-text');
        
        // Сброс прогресс-бара
        progressFill.style.width = '0%';
        progressText.textContent = 'Генерируем рекомендации...';
    }

    showMoreLoading(show) {
        const btn = document.getElementById('generateMoreBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        if (show) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            btn.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            btn.disabled = false;
        }
    }

    showTestLoading(show) {
        const btn = document.getElementById('testApiBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        if (show) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            btn.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            btn.disabled = false;
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove any existing messages
        this.removeMessages();
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Add to container
        const container = document.getElementById('messagesContainer');
        container.appendChild(messageDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    removeMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
    }

    exportWorkflowJSON(caseItem, index) {
        const platform = caseItem.automationPipeline?.platform || 'Make';
        let workflowJSON;
        
        if (platform.toLowerCase().includes('make')) {
            workflowJSON = this.generateMakeWorkflow(caseItem);
        } else {
            workflowJSON = this.generateN8nWorkflow(caseItem);
        }
        
        const blob = new Blob([JSON.stringify(workflowJSON, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.slugify(caseItem.title)}-${platform.toLowerCase()}-workflow.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess(`${platform} workflow JSON скачан`);
    }

    generateMakeWorkflow(caseItem) {
        const modules = caseItem.automationPipeline?.steps?.map((step, index) => ({
            id: index + 1,
            module: step.tool.replace(/\s+/g, '').toLowerCase(),
            version: 1,
            parameters: {},
            mapper: {},
            metadata: {
                designer: {
                    x: 100 + (index * 200),
                    y: 100
                },
                restore: {},
                parameters: [],
                expect: []
            }
        })) || [];

        return {
            name: caseItem.title,
            description: caseItem.description,
            flow: modules,
            metadata: {
                instant: false,
                version: 1,
                scenario: {
                    roundtrips: 1,
                    maxErrors: 3,
                    autoCommit: true,
                    autoCommitTriggerLast: true,
                    sequential: false,
                    slots: null,
                    confidential: false,
                    dataloss: false,
                    dlq: false,
                    freshVariables: false
                },
                designer: {
                    orphans: []
                },
                zone: "eu1.make.com"
            }
        };
    }

    generateN8nWorkflow(caseItem) {
        const nodes = caseItem.automationPipeline?.steps?.map((step, index) => ({
            id: `node_${index}`,
            name: step.action,
            type: step.tool.replace(/\s+/g, '').toLowerCase(),
            typeVersion: 1,
            position: [100 + (index * 200), 100],
            parameters: {},
            credentials: {},
            webhookId: index === 0 ? "webhook_id" : undefined
        })) || [];

        const connections = {};
        nodes.forEach((node, index) => {
            if (index < nodes.length - 1) {
                connections[node.name] = {
                    main: [[{
                        node: nodes[index + 1].name,
                        type: "main",
                        index: 0
                    }]]
                };
            }
        });

        return {
            name: caseItem.title,
            nodes: nodes,
            connections: connections,
            active: false,
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versionId: "1",
            id: `workflow_${Date.now()}`
        };
    }

    exportCaseMarkdown(caseItem, index) {
        const platform = caseItem.automationPipeline?.platform || 'Make';
        const workflowJSON = platform.toLowerCase().includes('make') 
            ? this.generateMakeWorkflow(caseItem) 
            : this.generateN8nWorkflow(caseItem);
        
        const markdown = `# ${caseItem.title}

## 📋 Описание кейса
${caseItem.description}

## 📊 Характеристики
- **Приоритет:** ${caseItem.priority}
- **Сложность:** ${caseItem.complexity}
- **Платформа автоматизации:** ${platform}

## 🛠 Рекомендуемые инструменты
${caseItem.tools.map(tool => `- ${tool}`).join('\n')}

## 🔄 Пайплайн автоматизации

${caseItem.automationPipeline?.steps?.map(step => 
`### Шаг ${step.step}: ${step.action}
- **Инструмент:** ${step.tool}
- **Описание:** ${step.description}`
).join('\n\n') || 'Пайплайн не определен'}

## 🤖 Системный промпт для AI-агента

\`\`\`
${caseItem.systemPrompt}
\`\`\`

## 📥 JSON Workflow для ${platform}

\`\`\`json
${JSON.stringify(workflowJSON, null, 2)}
\`\`\`

---

*Создано с помощью AI-agent scout*
*Дата создания: ${new Date().toLocaleDateString('ru-RU')}*
`;

        const blob = new Blob([markdown], {
            type: 'text/markdown;charset=utf-8'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.slugify(caseItem.title)}-automation-case.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Markdown файл скачан');
    }

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
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

    async testApiConnection() {
        if (!this.apiKey) {
            this.showError('Пожалуйста, введите API ключ');
            return;
        }

        // Проверка формата ключа в зависимости от провайдера
        const keyValidation = {
            'openai': (key) => key.startsWith('sk-'),
            'anthropic': (key) => key.startsWith('sk-ant-'),
            'gigachat': (key) => key.length > 10, // Базовая проверка
            'yandexgpt': (key) => key.length > 10 // Базовая проверка
        };

        if (keyValidation[this.apiProvider] && !keyValidation[this.apiProvider](this.apiKey)) {
            const expectedFormats = {
                'openai': 'API ключ должен начинаться с "sk-"',
                'anthropic': 'API ключ должен начинаться с "sk-ant-"',
                'gigachat': 'Введите токен доступа GigaChat',
                'yandexgpt': 'Введите токен YandexGPT'
            };
            this.showError(expectedFormats[this.apiProvider]);
            return;
        }

        this.showTestLoading(true);
        
        try {
            console.log(`=== Testing ${this.apiProvider.toUpperCase()} API Connection ===`);
            console.log('API Key length:', this.apiKey.length);
            
            let testResult;
            switch (this.apiProvider) {
                case 'openai':
                    testResult = await this.testOpenAIConnection();
                    break;
                case 'anthropic':
                    testResult = await this.testClaudeConnection();
                    break;
                case 'gigachat':
                    testResult = await this.testGigaChatConnection();
                    break;
                case 'yandexgpt':
                    testResult = await this.testYandexGPTConnection();
                    break;
                default:
                    throw new Error('Неподдерживаемый AI провайдер');
            }

            if (testResult.success) {
                this.showSuccess(`✅ Подключение к ${this.apiProvider.toUpperCase()} API успешно установлено!`);
            } else {
                throw new Error(testResult.error);
            }

        } catch (error) {
            console.error(`=== ${this.apiProvider.toUpperCase()} API Test Error ===`);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                if (this.apiProvider === 'openai' || this.apiProvider === 'anthropic') {
                    this.showError(`❌ Ошибка соединения с ${this.apiProvider.toUpperCase()} API. Для доступа из России требуется VPN.`);
                } else {
                    this.showError(`❌ Ошибка соединения с ${this.apiProvider.toUpperCase()} API. Проверьте подключение к интернету.`);
                }
            } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
                this.showError('❌ Сетевая ошибка. Проверьте подключение к интернету.');
            } else if (error.message.includes('CORS')) {
                this.showError('❌ CORS ошибка. Попробуйте обновить страницу или использовать другой браузер.');
            } else {
                this.showError('❌ ' + error.message);
            }
        } finally {
            this.showTestLoading(false);
        }
    }

    async testOpenAIConnection() {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Тест соединения. Ответь "OK"' }],
                max_tokens: 10,
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                return { success: false, error: `HTTP ${response.status}: ${errorText}` };
            }
            
            if (response.status === 401) {
                return { success: false, error: 'Неверный API ключ OpenAI' };
            } else if (response.status === 429) {
                return { success: false, error: 'Превышен лимит запросов OpenAI' };
            } else {
                return { success: false, error: `HTTP ${response.status}: ${errorData.error?.message || errorText}` };
            }
        }

        const data = await response.json();
        return { success: true, data };
    }

    async testClaudeConnection() {
        // Заглушка для тестирования Claude
        return { success: false, error: 'Claude API пока не реализован' };
    }

    async testGigaChatConnection() {
        // Заглушка для тестирования GigaChat  
        return { success: false, error: 'GigaChat API пока не реализован' };
    }

    async testYandexGPTConnection() {
        // Заглушка для тестирования YandexGPT
        return { success: false, error: 'YandexGPT API пока не реализован' };
    }

    updateApiKeyPlaceholder() {
        const apiKeyInput = document.getElementById('apiKey');
        const placeholders = {
            'openai': 'sk-...',
            'anthropic': 'sk-ant-...',
            'gigachat': 'Токен доступа GigaChat',
            'yandexgpt': 'Токен YandexGPT'
        };
        apiKeyInput.placeholder = placeholders[this.apiProvider] || 'Введите API ключ...';
    }

    async callAIForMore(roleDescription, existingTitles) {
        switch (this.apiProvider) {
            case 'openai':
                return await this.callOpenAIForMore(roleDescription, existingTitles);
            case 'anthropic':
                return await this.callClaudeForMore(roleDescription, existingTitles);
            case 'gigachat':
                return await this.callGigaChatForMore(roleDescription, existingTitles);
            case 'yandexgpt':
                return await this.callYandexGPTForMore(roleDescription, existingTitles);
            default:
                throw new Error('Неподдерживаемый AI провайдер');
        }
    }

    async callClaude(roleDescription) {
        // Заглушка для Claude API - пока возвращаем fallback
        console.log('Claude API не реализован, используем fallback');
        return this.getFallbackResponse();
    }

    async callGigaChat(roleDescription) {
        // Заглушка для GigaChat API - пока возвращаем fallback
        console.log('GigaChat API не реализован, используем fallback');
        return this.getFallbackResponse();
    }

    async callYandexGPT(roleDescription) {
        // Заглушка для YandexGPT API - пока возвращаем fallback
        console.log('YandexGPT API не реализован, используем fallback');
        return this.getFallbackResponse();
    }

    async callClaudeForMore(roleDescription, existingTitles) {
        console.log('Claude API не реализован, используем fallback');
        return this.getFallbackMoreResponse();
    }

    async callGigaChatForMore(roleDescription, existingTitles) {
        console.log('GigaChat API не реализован, используем fallback');
        return this.getFallbackMoreResponse();
    }

    async callYandexGPTForMore(roleDescription, existingTitles) {
        console.log('YandexGPT API не реализован, используем fallback');
        return this.getFallbackMoreResponse();
    }

    getFallbackResponse() {
        return {
            roleAnalysis: "К сожалению, выбранный AI провайдер пока не поддерживается. Используется fallback-ответ с примерами автоматизации.",
            bestPractices: "Рекомендуем начать с автоматизации простых повторяющихся задач и постепенно переходить к более сложным процессам.",
            automationCases: [
                {
                    title: "Автоматизация email-уведомлений",
                    description: "Настройка автоматических уведомлений и ответов на типовые запросы",
                    priority: "высокий",
                    roiEstimate: "20-30%",
                    complexity: "низкая",
                    tools: ["Zapier", "Gmail API"],
                    systemPrompt: "Ты помощник для автоматизации email-коммуникаций. Анализируй входящие письма и предлагай подходящие ответы. Сортируй письма по приоритету и создавай краткие сводки для руководителя.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Получение нового email",
                                tool: "Gmail",
                                description: "Триггер при получении нового письма"
                            },
                            {
                                step: 2,
                                action: "Анализ содержимого",
                                tool: "OpenAI",
                                description: "Определение темы и приоритета письма"
                            },
                            {
                                step: 3,
                                action: "Отправка уведомления",
                                tool: "Telegram",
                                description: "Уведомление в Telegram о важном письме"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация планирования встреч",
                    description: "Умное планирование и координация встреч с командой",
                    priority: "средний",
                    roiEstimate: "15-25%",
                    complexity: "средняя",
                    tools: ["Calendly", "Google Calendar API"],
                    systemPrompt: "Ты помощник для планирования встреч. Анализируй календари участников, предлагай оптимальное время и автоматически отправляй приглашения.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Анализ доступности участников",
                                tool: "Google Calendar",
                                description: "Проверка свободного времени в календарях"
                            },
                            {
                                step: 2,
                                action: "Поиск оптимального времени",
                                tool: "OpenAI",
                                description: "Алгоритм поиска лучшего времени"
                            },
                            {
                                step: 3,
                                action: "Отправка приглашений",
                                tool: "Gmail",
                                description: "Автоматическая рассылка приглашений"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация создания отчетов",
                    description: "Генерация регулярных отчетов на основе данных",
                    priority: "высокий",
                    roiEstimate: "25-40%",
                    complexity: "высокая",
                    tools: ["Google Sheets", "Power BI"],
                    systemPrompt: "Ты помощник для создания отчетов. Собирай данные из различных источников, анализируй показатели и создавай структурированные отчеты с ключевыми метриками и выводами.",
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Сбор данных из источников",
                                tool: "Google Sheets",
                                description: "Получение данных из таблиц"
                            },
                            {
                                step: 2,
                                action: "Анализ и обработка",
                                tool: "OpenAI",
                                description: "Анализ данных и создание выводов"
                            },
                            {
                                step: 3,
                                action: "Формирование отчета",
                                tool: "Power BI",
                                description: "Создание визуального отчета"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация управления задачами",
                    description: "Интеллектуальное распределение и отслеживание задач",
                    priority: "средний",
                    roiEstimate: "20-35%",
                    complexity: "средняя",
                    tools: ["Trello", "Slack API"],
                    systemPrompt: "Ты помощник для управления задачами. Анализируй загрузку команды, приоритеты проектов и автоматически распределяй задачи между участниками с учетом их компетенций.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Получение новой задачи",
                                tool: "Trello",
                                description: "Триггер при создании новой карточки"
                            },
                            {
                                step: 2,
                                action: "Анализ и назначение",
                                tool: "OpenAI",
                                description: "Определение исполнителя и приоритета"
                            },
                            {
                                step: 3,
                                action: "Уведомление команды",
                                tool: "Slack",
                                description: "Отправка уведомления в канал"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация контроля качества",
                    description: "Автоматическая проверка и контроль качества работы",
                    priority: "низкий",
                    roiEstimate: "15-30%",
                    complexity: "высокая",
                    tools: ["Jira", "GitHub API"],
                    systemPrompt: "Ты помощник для контроля качества. Анализируй выполненные задачи, проверяй соответствие стандартам и автоматически создавай отчеты о качестве работы команды.",
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Мониторинг выполненных задач",
                                tool: "Jira",
                                description: "Отслеживание завершенных задач"
                            },
                            {
                                step: 2,
                                action: "Проверка качества",
                                tool: "OpenAI",
                                description: "Анализ соответствия стандартам"
                            },
                            {
                                step: 3,
                                action: "Создание отчета",
                                tool: "Google Docs",
                                description: "Формирование отчета о качестве"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация обучения команды",
                    description: "Персонализированное обучение и развитие сотрудников",
                    priority: "низкий",
                    roiEstimate: "10-25%",
                    complexity: "средняя",
                    tools: ["LMS", "Notion API"],
                    systemPrompt: "Ты помощник для обучения команды. Анализируй навыки сотрудников, выявляй пробелы в знаниях и автоматически предлагай персонализированные программы обучения.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Анализ навыков сотрудников",
                                tool: "Google Forms",
                                description: "Сбор данных о компетенциях"
                            },
                            {
                                step: 2,
                                action: "Подбор обучающих материалов",
                                tool: "OpenAI",
                                description: "Персонализация программы обучения"
                            },
                            {
                                step: 3,
                                action: "Создание плана обучения",
                                tool: "Notion",
                                description: "Формирование индивидуального плана"
                            }
                        ]
                    }
                }
            ]
        };
    }

    getFallbackMoreResponse() {
        return {
            roleAnalysis: "К сожалению, выбранный AI провайдер пока не поддерживается. Используется fallback-ответ с примерами автоматизации.",
            bestPractices: "Рекомендуем начать с автоматизации простых повторяющихся задач и постепенно переходить к более сложным процессам.",
            automationCases: [
                {
                    title: "Автоматизация отчетности",
                    description: "Автоматическое создание еженедельных и месячных отчетов",
                    priority: "средний",
                    roiEstimate: "15-25%",
                    complexity: "средняя",
                    tools: ["Google Sheets API", "Power BI"],
                    systemPrompt: "Ты помощник для автоматизации отчетности. Собирай данные из различных источников, анализируй тренды и создавай структурированные отчеты с ключевыми метриками.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Получение данных из Google Sheets",
                                tool: "Google Sheets API",
                                description: "Триггер при получении новых данных"
                            },
                            {
                                step: 2,
                                action: "Анализ данных",
                                tool: "Power BI",
                                description: "Анализ данных и создание отчета"
                            },
                            {
                                step: 3,
                                action: "Отправка отчета",
                                tool: "Email",
                                description: "Отправка отчета на email руководителя"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация социальных сетей",
                    description: "Планирование и публикация контента в социальных сетях",
                    priority: "низкий",
                    roiEstimate: "10-20%",
                    complexity: "низкая",
                    tools: ["Buffer", "Telegram Bot API"],
                    systemPrompt: "Ты помощник для управления социальными сетями. Создавай контент-план, планируй публикации и анализируй эффективность постов.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Создание контента",
                                tool: "OpenAI",
                                description: "Генерация постов для соцсетей"
                            },
                            {
                                step: 2,
                                action: "Планирование публикации",
                                tool: "Buffer",
                                description: "Автоматическая публикация в соцсети"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация обработки документов",
                    description: "Автоматическое извлечение и обработка данных из документов",
                    priority: "средний",
                    roiEstimate: "25-35%",
                    complexity: "высокая",
                    tools: ["OCR API", "Google Drive API"],
                    systemPrompt: "Ты помощник для обработки документов. Извлекай текст из PDF, анализируй содержимое и структурируй данные.",
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Получение документа",
                                tool: "Google Drive",
                                description: "Триггер при загрузке нового документа"
                            },
                            {
                                step: 2,
                                action: "Извлечение текста",
                                tool: "OCR API",
                                description: "Распознавание текста в документе"
                            },
                            {
                                step: 3,
                                action: "Обработка данных",
                                tool: "OpenAI",
                                description: "Структурирование извлеченных данных"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация backup данных",
                    description: "Регулярное резервное копирование важных данных",
                    priority: "высокий",
                    roiEstimate: "40-60%",
                    complexity: "средняя",
                    tools: ["Google Drive API", "Yandex.Disk API"],
                    systemPrompt: "Ты помощник для резервного копирования. Следи за важными файлами, создавай бэкапы и уведомляй о статусе операций.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Проверка файлов",
                                tool: "File System",
                                description: "Ежедневная проверка изменений"
                            },
                            {
                                step: 2,
                                action: "Создание бэкапа",
                                tool: "Google Drive",
                                description: "Загрузка измененных файлов"
                            },
                            {
                                step: 3,
                                action: "Уведомление",
                                tool: "Telegram",
                                description: "Отчет о статусе бэкапа"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация мониторинга конкурентов",
                    description: "Отслеживание цен и новостей конкурентов",
                    priority: "низкий",
                    roiEstimate: "15-30%",
                    complexity: "средняя",
                    tools: ["Web Scraping", "RSS Parser"],
                    systemPrompt: "Ты помощник для мониторинга конкурентов. Отслеживай изменения цен, новые продукты и новости компаний-конкурентов.",
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Сбор данных с сайтов",
                                tool: "Web Scraper",
                                description: "Ежедневный парсинг сайтов конкурентов"
                            },
                            {
                                step: 2,
                                action: "Анализ изменений",
                                tool: "OpenAI",
                                description: "Выявление значимых изменений"
                            },
                            {
                                step: 3,
                                action: "Отправка отчета",
                                tool: "Slack",
                                description: "Уведомление команды об изменениях"
                            }
                        ]
                    }
                },
                {
                    title: "Автоматизация инвентаризации",
                    description: "Учет и контроль материальных ценностей",
                    priority: "средний",
                    roiEstimate: "20-35%",
                    complexity: "низкая",
                    tools: ["QR Scanner", "Google Sheets"],
                    systemPrompt: "Ты помощник для управления инвентарем. Отслеживай движение товаров, контролируй остатки и планируй закупки.",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Сканирование QR-кода",
                                tool: "QR Scanner",
                                description: "Считывание информации о товаре"
                            },
                            {
                                step: 2,
                                action: "Обновление базы",
                                tool: "Google Sheets",
                                description: "Запись данных в таблицу"
                            },
                            {
                                step: 3,
                                action: "Проверка остатков",
                                tool: "OpenAI",
                                description: "Анализ необходимости докупки"
                            }
                        ]
                    }
                }
            ]
        };
    }

    testFallback() {
        console.log('Testing fallback functionality...');
        const fallbackData = this.getFallbackResponse();
        this.displayResults(fallbackData);
        this.showSuccess('✅ Тест завершен! Показаны демо-данные (6 кейсов автоматизации)');
    }

    // Загрузка прочитанных кейсов из localStorage
    loadReadCases() {
        try {
            const savedReadCases = localStorage.getItem('ai-scout-read-cases');
            if (savedReadCases) {
                this.readCases = new Set(JSON.parse(savedReadCases));
            }
        } catch (error) {
            console.error('Error loading read cases:', error);
            this.readCases = new Set();
        }
    }

    // Сохранение прочитанных кейсов в localStorage
    saveReadCases() {
        try {
            localStorage.setItem('ai-scout-read-cases', JSON.stringify([...this.readCases]));
        } catch (error) {
            console.error('Error saving read cases:', error);
        }
    }

    // Пометить кейс как прочитанный
    markCaseAsRead(caseId) {
        console.log(`Marking case as read: ${caseId}`); // Отладка
        this.readCases.add(caseId);
        this.saveReadCases();
        this.updateCaseReadStatus(caseId);
        console.log(`Read cases now:`, [...this.readCases]); // Отладка
    }

    // Обновить визуальное состояние кейса
    updateCaseReadStatus(caseId) {
        const caseElement = document.querySelector(`[data-case-id="${caseId}"]`);
        console.log(`Updating case status for ${caseId}, element found:`, !!caseElement); // Отладка
        
        if (caseElement) {
            if (this.readCases.has(caseId)) {
                caseElement.classList.remove('unread');
                caseElement.classList.add('read');
                console.log(`Case ${caseId} marked as read`); // Отладка
            } else {
                caseElement.classList.remove('read');
                caseElement.classList.add('unread');
                console.log(`Case ${caseId} marked as unread`); // Отладка
            }
        } else {
            console.error(`Case element not found for ID: ${caseId}`); // Отладка
        }
    }

    // Генерация уникального ID для кейса (улучшенная версия)
    generateCaseId(caseItem, index) {
        // Создаем более стабильный ID на основе заголовка и индекса
        const title = caseItem.title || '';
        const description = caseItem.description || '';
        const baseString = `${title}-${description}-${index}`;
        
        // Простое хеширование строки
        let hash = 0;
        for (let i = 0; i < baseString.length; i++) {
            const char = baseString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Конвертируем в 32-битное число
        }
        
        return `case-${Math.abs(hash)}-${index}`;
    }
}

// Инициализация приложения
const app = new AIDelegate();

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