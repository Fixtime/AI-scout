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



        // New secondary action buttons
        document.getElementById('generateMoreBtn2').addEventListener('click', () => {
            this.generateMoreCases();
        });

        document.getElementById('clearBtn2').addEventListener('click', () => {
            this.clearResults();
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
        
        // Заменяем плейсхолдер на загрузку кейсов
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <p>Генерируем кейсы...</p>
            </div>
        `;
        
        // Очищаем детали кейса
        const caseDetails = document.getElementById('caseDetails');
        caseDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Кейсы генерируются, скоро появятся подробности...</p>
            </div>
        `;
        

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
        
        // Показываем прогресс-бар вместо кнопок
        this.showProgressForMoreGeneration(true);
        
        try {
            // Передаем полный контекст первой генерации
            const contextData = {
                roleDescription: roleDescription,
                originalAnalysis: this.currentResults.roleAnalysis,
                originalPractices: this.currentResults.bestPractices,
                existingCases: this.currentResults.automationCases,
                existingTitles: this.currentResults.automationCases.map(c => c.title)
            };
            
            const newRecommendations = await this.callAIForMore(contextData);
            this.addMoreResults(newRecommendations);
        } catch (error) {
            console.error('Error generating more cases:', error);
            this.showError('Ошибка при генерации дополнительных кейсов: ' + error.message);
        } finally {
            this.showProgressForMoreGeneration(false);
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

ВАЖНО: Если в кейсе выбрана платформа Make, то для поля automationPipeline.steps сгенерируй такой пайплайн, чтобы его можно было преобразовать в рабочий Make.com Blueprint. 

ИСПОЛЬЗУЙ АКТУАЛЬНЫЕ ПРИЛОЖЕНИЯ MAKE, НО НЕ ОГРАНИЧИВАЙСЯ ИМИ, а смотри в этот список https://teletype.in/@prompt_design/api_n8n
AI: OpenAI (ChatGPT, Whisper, DALL-E), Anthropic Claude, ElevenLabs, Leonardo.ai, Cloudinary
Productivity: Google Sheets, Google Calendar, ClickUp, Notion, AirTable  
Marketing: Facebook Pages, Instagram for Business, Facebook Lead Ads, LinkedIn, Pinterest
Communication: Telegram Bot, Gmail, Slack
Task tracking: Jira
Customer Support: Intercom, Zendesk, Freshdesk, Help Scout, Fresh Service
E-commerce: WooCommerce

Каждый шаг должен соответствовать реальному модулю Make из списка выше (например, gmail:TriggerAction, openai:ActionModule, google-sheets:ActionModule и т.д.), с обязательными параметрами и метаданными. Все соединения между модулями должны быть явно указаны. Запрещено использовать абстрактные шаги или устаревшие приложения. Все параметры должны быть заполнены плейсхолдерами или примерными значениями.

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
      "systemPrompt": "ПРАКТИЧЕСКИЙ промпт для решения ЭТОЙ КОНКРЕТНОЙ задачи. НЕ описывай роль агента, а дай четкие инструкции: ВХОДНЫЕ ДАННЫЕ (формат), АЛГОРИТМ ДЕЙСТВИЙ (пошагово), ВЫХОДНЫЕ ДАННЫЕ (формат), ПРИМЕРЫ использования, обработку EDGE CASES. Начинай с конкретного действия, а не 'Ты помощник...'. Минимум 400 слов.",
      "automationPipeline": {
        "platform": "Make/n8n",
        "steps": [
          {
            "step": 1,
            "action": "Триггер события (например: получение email, webhook)",
            "tool": "Gmail/Webhook/ClickUp",
            "description": "Инициация автоматизации при получении новых данных"
          },
          {
            "step": 2,
            "action": "Первичная обработка и валидация данных",
            "tool": "OpenAI/Claude",
            "description": "Анализ и проверка корректности входящих данных"
          },
          {
            "step": 3,
            "action": "Обогащение данными из внешних источников",
            "tool": "Google Sheets/Notion/AirTable",
            "description": "Получение дополнительной информации из баз данных"
          },
          {
            "step": 4,
            "action": "Принятие решения или классификация",
            "tool": "OpenAI/Claude",
            "description": "Интеллектуальный анализ и выбор дальнейших действий"
          },
          {
            "step": 5,
            "action": "Выполнение целевого действия",
            "tool": "Telegram Bot/Slack/LinkedIn/Gmail",
            "description": "Реализация основной бизнес-логики автоматизации"
          },
          {
            "step": 6,
            "action": "Логирование и уведомление о результате",
            "tool": "Google Sheets/Monday/Telegram",
            "description": "Сохранение результата и отправка уведомлений"
          }
        ]
      }
    }
  ]
}

КРИТИЧЕСКИ ВАЖНЫЕ ТРЕБОВАНИЯ К СИСТЕМНЫМ ПРОМПТАМ:
- НЕ начинай с "Ты помощник/агент/AI для..." - это неправильно!
- НАЧИНАЙ с конкретного действия: "Анализируй...", "Обрабатывай...", "Создавай..."
- ЧЕТКИЙ АЛГОРИТМ: пошаговые инструкции что делать
- ВХОДНЫЕ ДАННЫЕ: точный формат того, что поступает на вход
- ВЫХОДНЫЕ ДАННЫЕ: точный формат результата с примерами
- ПРИМЕРЫ: конкретные кейсы использования
- EDGE CASES: как обрабатывать ошибки и исключения
- КРИТЕРИИ КАЧЕСТВА: как оценить успешность выполнения

ВАЖНО: в пайплайне должно быть 4-7 шагов (оптимально 5-6), чтобы полностью покрыть весь процесс автоматизации от триггера до результата с валидацией, обработкой данных, принятием решений и логированием
ВАЖНО: В массиве automationCases должно быть РОВНО 6 элементов.
ВАЖНО: Названия ВСЕХ кейсов должны начинаться со слова "агент" (например: "агент управления roadmap", "агент координации команд")

ПРИМЕР ПРАВИЛЬНОГО ПОДХОДА:
Если пользователь написал "управляю roadmap продукта", создай кейс "агент управления roadmap продукта".
Если пользователь написал "координирую команды разработки", создай кейс "агент координации команд разработки".
НЕ добавляй кейсы по email или CRM, если пользователь о них не упоминал.

ПРИМЕРЫ ПРАВИЛЬНЫХ СИСТЕМНЫХ ПРОМПТОВ:
❌ НЕПРАВИЛЬНО: "Ты помощник для управления задачами. Анализируй проекты и помогай команде..."
✅ ПРАВИЛЬНО: "Анализируй входящие задачи и автоматически назначай исполнителей. ВХОДНЫЕ ДАННЫЕ: описание задачи, навыки команды, текущая загрузка. АЛГОРИТМ: 1) Определи требуемые навыки 2) Найди свободных участников 3) Сопоставь задачу с навыками 4) Назначь оптимального исполнителя..."

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

    async callOpenAIForMore(contextData) {
        const { roleDescription, originalAnalysis, originalPractices, existingCases, existingTitles } = contextData;
        
        // Извлекаем конкретные задачи и инструменты из первых кейсов для анализа
        const identifiedTasks = existingCases.map(c => c.description).join('; ');
        const usedTools = [...new Set(existingCases.flatMap(c => c.tools))];
        
        const systemPrompt = `Ты эксперт по автоматизации бизнес-процессов и внедрению AI агентов. Пользователь уже получил первый набор из 6 кейсов автоматизации и хочет 6 ДОПОЛНИТЕЛЬНЫХ кейсов, которые ПРОДОЛЖАЮТ и УГЛУБЛЯЮТ автоматизацию ТОЙ ЖЕ РОЛИ.

КОНТЕКСТ РОЛИ ПОЛЬЗОВАТЕЛЯ:
${roleDescription}

ПРЕДЫДУЩИЙ АНАЛИЗ РОЛИ:
${originalAnalysis}

ПРЕДЫДУЩИЕ ЛУЧШИЕ ПРАКТИКИ:
${originalPractices}

УЖЕ РЕАЛИЗОВАННЫЕ КЕЙСЫ АВТОМАТИЗАЦИИ:
${existingCases.map((c, i) => `${i+1}. ${c.title}: ${c.description}`).join('\n')}

ИСПОЛЬЗУЕМЫЕ ИНСТРУМЕНТЫ В ПЕРВЫХ КЕЙСАХ:
${usedTools.join(', ')}

КРИТИЧЕСКИ ВАЖНАЯ ЗАДАЧА:
Создай 6 НОВЫХ кейсов автоматизации, которые:
1. ПРОДОЛЖАЮТ работу с ТОЙ ЖЕ РОЛЬЮ и теми же процессами
2. УГЛУБЛЯЮТ автоматизацию уже выявленных задач  
3. ПОКРЫВАЮТ аспекты роли, которые еще НЕ АВТОМАТИЗИРОВАНЫ
4. ДОПОЛНЯЮТ уже созданные кейсы, создавая целостную экосистему автоматизации
5. НЕ ДУБЛИРУЮТ уже предложенные решения

СТРАТЕГИИ ДЛЯ НОВЫХ КЕЙСОВ:
- Создать подзадачи для уже автоматизированных процессов
- Автоматизировать промежуточные этапы между существующими кейсами
- Добавить мониторинг и аналитику для существующих автоматизаций
- Создать кейсы для обработки исключений и edge cases
- Автоматизировать подготовительные или завершающие этапы процессов
- Добавить интеграции между разными системами из роли

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Все кейсы должны быть ПРЯМО СВЯЗАНЫ с исходным описанием роли
- Использовать конкретные инструменты и системы, упомянутые пользователем
- Создавать синергию с уже существующими кейсами
- Названия должны начинаться со слова "агент"
- 4-7 шагов в каждом пайплайне

ИСПОЛЬЗУЙ ТОЛЬКО АКТУАЛЬНЫЕ ПРИЛОЖЕНИЯ MAKE:
AI: OpenAI (ChatGPT, Whisper, DALL-E), Anthropic Claude, ElevenLabs, Leonardo.ai, Cloudinary
Productivity: Google Sheets, Google Calendar, Monday, ClickUp, Notion, AirTable  
Marketing: Facebook Pages, Instagram for Business, Facebook Lead Ads, LinkedIn, Pinterest
Communication: Slack, Telegram Bot, Gmail
Customer Support: Intercom, Zendesk, Freshdesk, Help Scout, Fresh Service
E-commerce: WooCommerce
Trending: Bluesky, ClickFunnels 2.0, Braze, Snapchat Campaign Management

КРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО валидный JSON, без дополнительного текста. Начни ответ сразу с {

ФОРМАТ ОТВЕТА - строго JSON:
{
  "automationCases": [
    {
      "title": "агент [конкретная подзадача или дополнительный аспект роли]",
      "description": "детальное описание как этот кейс ДОПОЛНЯЕТ уже существующие и углубляет автоматизацию роли",
      "priority": "высокий/средний/низкий",
      "roiEstimate": "10-50%",
      "complexity": "низкая/средняя/высокая",
      "tools": ["конкретные инструменты из роли"],
      "systemPrompt": "ПРАКТИЧЕСКИЙ промпт для решения этой задачи. НЕ описывай роль, а дай четкие инструкции: ВХОДНЫЕ ДАННЫЕ, АЛГОРИТМ (пошагово), ВЫХОДНЫЕ ДАННЫЕ, ПРИМЕРЫ, EDGE CASES. Учитывай интеграцию с уже существующими автоматизациями. Начинай с действия, не с 'Ты агент...'. Минимум 400 слов.",
      "automationPipeline": {
        "platform": "Make/n8n",
        "steps": [
          {
            "step": 1,
            "action": "Триггер события или интеграция с существующим кейсом",
            "tool": "Актуальный инструмент",
            "description": "Как этот шаг связан с ролью и существующими процессами"
          },
          // ... 4-7 шагов
        ]
      }
    }
  ]
}

ПРИМЕРЫ ХОРОШИХ ДОПОЛНИТЕЛЬНЫХ КЕЙСОВ:
- Если есть "агент создания отчетов" → добавить "агент валидации данных для отчетов"
- Если есть "агент управления задачами" → добавить "агент мониторинга прогресса задач"
- Если есть "агент коммуникации с клиентами" → добавить "агент анализа обратной связи клиентов"

НЕ ПОВТОРЯЙ ЭТИ КЕЙСЫ:
${existingTitles.map(title => `- ${title}`).join('\n')}`;

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
                max_tokens: 6000
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
            
            // Используем улучшенный fallback с контекстом
            return this.getContextualFallbackMoreResponse(existingCases, roleDescription);
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
        
        // Переключаем обратно на первичную кнопку
        this.switchToPrimaryActions();
    }

    // Очистить все прочитанные кейсы
    clearReadCases() {
        this.readCases.clear();
        this.saveReadCases();
    }

    // Переключение на вторичные действия (после генерации)
    switchToSecondaryActions() {
        document.getElementById('primaryActions').classList.add('hidden');
        document.getElementById('secondaryActions').classList.remove('hidden');
    }

    // Переключение на первичную кнопку (после очистки)
    switchToPrimaryActions() {
        document.getElementById('primaryActions').classList.remove('hidden');
        document.getElementById('secondaryActions').classList.add('hidden');
    }

    // Показ прогресс-бара во время генерации дополнительных кейсов
    showProgressForMoreGeneration(show) {
        const progressContainer = document.getElementById('generationProgress');
        const secondaryActions = document.getElementById('secondaryActions');
        
        if (show) {
            // Скрываем кнопки и показываем прогресс-бар
            secondaryActions.classList.add('hidden');
            progressContainer.classList.remove('hidden');
            
            // Начинаем анимацию прогресса
            this.startProgressAnimation();
        } else {
            // Скрываем прогресс-бар и показываем кнопки
            progressContainer.classList.add('hidden');
            secondaryActions.classList.remove('hidden');
            
            // Сбрасываем прогресс
            this.resetProgress();
        }
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
        const progressContainer = document.getElementById('generationProgress');
        const primaryActions = document.getElementById('primaryActions');
        const secondaryActions = document.getElementById('secondaryActions');
        
        console.log('showLoading called with show:', show);
        console.log('generationProgress element found:', !!progressContainer);
        console.log('primaryActions element found:', !!primaryActions);
        console.log('secondaryActions element found:', !!secondaryActions);
        
        if (!progressContainer || !primaryActions || !secondaryActions) {
            console.error('Required elements not found for loading state');
            return;
        }
        
        if (show) {
            // Скрываем все группы кнопок и показываем прогресс-бар
            primaryActions.classList.add('hidden');
            secondaryActions.classList.add('hidden');
            progressContainer.classList.remove('hidden');
            
            // Начинаем анимацию прогресса
            this.startProgressAnimation();
        } else {
            // Скрываем прогресс-бар и показываем соответствующие кнопки
            progressContainer.classList.add('hidden');
            
            // Сбрасываем прогресс
            this.resetProgress();
            
            // Показываем вторичные кнопки (так как генерация завершена)
            this.switchToSecondaryActions();
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
        // Эта функция теперь не используется, так как используется прогресс-бар
        // Оставляем для обратной совместимости
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
        
        this.showSuccess(`${platform} workflow JSON скачан ✅ (обновлен список актуальных приложений)`);
    }

    generateMakeWorkflow(caseItem) {
        const steps = caseItem.automationPipeline?.steps || [];
        
        // Создаем модули для Make.com
        const modules = steps.map((step, index) => {
            const moduleId = index + 1;
            
            // Определяем тип модуля на основе инструмента (актуальные apps из Make)
            let moduleType = 'custom';
            let appName = step.tool.toLowerCase();
            
            // AI приложения
            if (appName.includes('openai') || appName.includes('gpt') || appName.includes('chatgpt')) {
                moduleType = 'openai';
                appName = 'openai';
            } else if (appName.includes('claude') || appName.includes('anthropic')) {
                moduleType = 'anthropic-claude';
                appName = 'anthropic-claude';
            } else if (appName.includes('elevenlabs')) {
                moduleType = 'elevenlabs';
                appName = 'elevenlabs';
            } else if (appName.includes('leonardo')) {
                moduleType = 'leonardo-ai';
                appName = 'leonardo-ai';
            } 
            // Email и Gmail
            else if (appName.includes('gmail') || appName.includes('email')) {
                moduleType = 'gmail';
                appName = 'gmail';
            }
            // Productivity приложения
            else if (appName.includes('google sheets') || appName.includes('sheets')) {
                moduleType = 'google-sheets';
                appName = 'google-sheets';
            } else if (appName.includes('google calendar') || appName.includes('calendar')) {
                moduleType = 'google-calendar';
                appName = 'google-calendar';
            } else if (appName.includes('clickup')) {
                moduleType = 'clickup';
                appName = 'clickup';
            } else if (appName.includes('notion')) {
                moduleType = 'notion';
                appName = 'notion';
            } else if (appName.includes('airtable')) {
                moduleType = 'airtable';
                appName = 'airtable';
            }
            // Коммуникации
            else if (appName.includes('slack')) {
                moduleType = 'slack';
                appName = 'slack';
            } else if (appName.includes('telegram')) {
                moduleType = 'telegram-bot';
                appName = 'telegram-bot';
            }
            // Маркетинг
            else if (appName.includes('facebook')) {
                moduleType = 'facebook-pages';
                appName = 'facebook-pages';
            } else if (appName.includes('instagram')) {
                moduleType = 'instagram-for-business';
                appName = 'instagram-for-business';
            } else if (appName.includes('linkedin')) {
                moduleType = 'linkedin';
                appName = 'linkedin';
            } else if (appName.includes('pinterest')) {
                moduleType = 'pinterest';
                appName = 'pinterest';
            }
            // Customer Support
            else if (appName.includes('intercom')) {
                moduleType = 'intercom';
                appName = 'intercom';
            } else if (appName.includes('zendesk')) {
                moduleType = 'zendesk';
                appName = 'zendesk';
            } else if (appName.includes('freshdesk')) {
                moduleType = 'freshdesk';
                appName = 'freshdesk';
            } else if (appName.includes('help scout')) {
                moduleType = 'help-scout';
                appName = 'help-scout';
            }
            // E-commerce
            else if (appName.includes('woocommerce')) {
                moduleType = 'woocommerce';
                appName = 'woocommerce';
            }
            
            return {
                id: moduleId,
                module: `${appName}:${index === 0 ? 'TriggerAction' : 'ActionModule'}`,
                version: 3,
                parameters: {
                    __IMTCONN__: null
                },
                mapper: {
                    text: step.description || step.action
                },
                metadata: {
                    designer: {
                        x: 100 + (index * 300),
                        y: 100,
                        name: step.action
                    },
                    restore: {
                        parameters: {
                            __IMTCONN__: {
                                data: {},
                                label: step.tool
                            }
                        }
                    },
                    parameters: [
                        {
                            name: "__IMTCONN__",
                            type: "account",
                            label: "Connection",
                            required: true
                        }
                    ]
                }
            };
        });

        // Создаем соединения между модулями
        const connections = [];
        for (let i = 0; i < modules.length - 1; i++) {
            connections.push({
                id: i + 1,
                srcModuleId: modules[i].id,
                srcPort: 0,
                dstModuleId: modules[i + 1].id,
                dstPort: 0
            });
        }

        return {
            name: caseItem.title || "AI Agent Automation",
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
            },
            connections: connections
        };
    }

    generateN8nWorkflow(caseItem) {
        const steps = caseItem.automationPipeline?.steps || [];
        
        // Создаем узлы для n8n workflow
        const nodes = steps.map((step, index) => {
            const nodeId = `node${index}`;
            const position = [200 + (index * 300), 200];
            
            // Определяем тип узла на основе инструмента (актуальные n8n узлы)
            let nodeType = 'n8n-nodes-base.httpRequest';
            let nodeName = step.tool;
            
            // AI узлы
            if (step.tool.toLowerCase().includes('openai') || step.tool.toLowerCase().includes('gpt') || step.tool.toLowerCase().includes('chatgpt')) {
                nodeType = 'n8n-nodes-base.openAi';
                nodeName = 'OpenAI';
            } else if (step.tool.toLowerCase().includes('claude') || step.tool.toLowerCase().includes('anthropic')) {
                nodeType = 'n8n-nodes-base.anthropic';
                nodeName = 'Anthropic Claude';
            }
            // Email
            else if (step.tool.toLowerCase().includes('gmail') || step.tool.toLowerCase().includes('email')) {
                nodeType = 'n8n-nodes-base.gmail';
                nodeName = 'Gmail';
            }
            // Productivity
            else if (step.tool.toLowerCase().includes('google sheets') || step.tool.toLowerCase().includes('sheets')) {
                nodeType = 'n8n-nodes-base.googleSheets';
                nodeName = 'Google Sheets';
            } else if (step.tool.toLowerCase().includes('google calendar') || step.tool.toLowerCase().includes('calendar')) {
                nodeType = 'n8n-nodes-base.googleCalendar';
                nodeName = 'Google Calendar';
            } else if (step.tool.toLowerCase().includes('clickup')) {
                nodeType = 'n8n-nodes-base.clickUp';
                nodeName = 'ClickUp';
            } else if (step.tool.toLowerCase().includes('notion')) {
                nodeType = 'n8n-nodes-base.notion';
                nodeName = 'Notion';
            } else if (step.tool.toLowerCase().includes('airtable')) {
                nodeType = 'n8n-nodes-base.airtable';
                nodeName = 'Airtable';
            }
            // Communication
            else if (step.tool.toLowerCase().includes('slack')) {
                nodeType = 'n8n-nodes-base.slack';
                nodeName = 'Slack';
            } else if (step.tool.toLowerCase().includes('telegram')) {
                nodeType = 'n8n-nodes-base.telegram';
                nodeName = 'Telegram';
            }
            // Marketing
            else if (step.tool.toLowerCase().includes('facebook')) {
                nodeType = 'n8n-nodes-base.facebook';
                nodeName = 'Facebook';
            } else if (step.tool.toLowerCase().includes('linkedin')) {
                nodeType = 'n8n-nodes-base.linkedIn';
                nodeName = 'LinkedIn';
            }
            // Default
            else if (step.tool.toLowerCase().includes('webhook') || index === 0) {
                nodeType = 'n8n-nodes-base.webhook';
                nodeName = 'Webhook';
            }
            
            const node = {
                parameters: {
                    // Базовые параметры зависят от типа узла
                    ...(nodeType === 'n8n-nodes-base.webhook' ? {
                        path: `automation-webhook-${Date.now()}`,
                        httpMethod: 'POST',
                        responseMode: 'onReceived'
                    } : {}),
                    ...(nodeType === 'n8n-nodes-base.openAi' ? {
                        resource: 'text',
                        operation: 'complete',
                        prompt: step.description || step.action,
                        maxTokens: 1000
                    } : {}),
                    ...(step.description ? { description: step.description } : {})
                },
                id: nodeId,
                name: `${nodeName}${index > 0 ? ` ${index}` : ''}`,
                type: nodeType,
                typeVersion: 1,
                position: position,
                ...(nodeType === 'n8n-nodes-base.webhook' ? {
                    webhookId: `${nodeId}-webhook`
                } : {})
            };
            
            return node;
        });
        
        // Если нет шагов, создаем базовый webhook узел
        if (nodes.length === 0) {
            nodes.push({
                parameters: {
                    path: `automation-webhook-${Date.now()}`,
                    httpMethod: 'POST',
                    responseMode: 'onReceived'
                },
                id: 'node0',
                name: 'Webhook',
                type: 'n8n-nodes-base.webhook',
                typeVersion: 1,
                position: [200, 200],
                webhookId: 'node0-webhook'
            });
        }

        // Создаем соединения между узлами
        const connections = {};
        nodes.forEach((node, index) => {
            if (index < nodes.length - 1) {
                const nextNode = nodes[index + 1];
                connections[node.name] = {
                    main: [[{
                        node: nextNode.name,
                        type: 'main',
                        index: 0
                    }]]
                };
            }
        });

        return {
            name: caseItem.title || 'AI Agent Workflow',
            nodes: nodes,
            connections: connections,
            active: false,
            settings: {
                executionOrder: 'v1'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versionId: 1,
            id: Date.now().toString(),
            tags: ['ai-agent', 'automation']
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

    async callAIForMore(contextData) {
        switch (this.apiProvider) {
            case 'openai':
                return await this.callOpenAIForMore(contextData);
            case 'anthropic':
                return await this.callClaudeForMore(contextData);
            case 'gigachat':
                return await this.callGigaChatForMore(contextData);
            case 'yandexgpt':
                return await this.callYandexGPTForMore(contextData);
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

    async callClaudeForMore(contextData) {
        console.log('Claude API не реализован, используем fallback');
        return this.getContextualFallbackMoreResponse(contextData.existingCases, contextData.roleDescription);
    }

    async callGigaChatForMore(contextData) {
        console.log('GigaChat API не реализован, используем fallback');
        return this.getContextualFallbackMoreResponse(contextData.existingCases, contextData.roleDescription);
    }

    async callYandexGPTForMore(contextData) {
        console.log('YandexGPT API не реализован, используем fallback');
        return this.getContextualFallbackMoreResponse(contextData.existingCases, contextData.roleDescription);
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
                    tools: ["Make", "Gmail"],
                    systemPrompt: "Анализируй входящие email и генерируй персонализированные ответы. ВХОДНЫЕ ДАННЫЕ: текст письма, данные отправителя, история переписки. АЛГОРИТМ: 1) Определи тему и тон письма 2) Классифицируй приоритет (высокий/средний/низкий) 3) Проверь историю общения 4) Создай подходящий ответ или переадресуй 5) Сформируй краткую сводку для руководителя. ВЫХОДНЫЕ ДАННЫЕ: JSON с приоритетом, темой, предлагаемым ответом, действиями. ПРИМЕРЫ: жалоба клиента → извинение + решение, партнерский запрос → вежливая переадресация. EDGE CASES: спам (игнорировать), срочные вопросы (немедленное уведомление), неопознанный язык (использовать переводчик).",
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
                                action: "Проверка контекста отправителя",
                                tool: "Google Sheets",
                                description: "Поиск дополнительной информации об отправителе"
                            },
                            {
                                step: 4,
                                action: "Генерация ответа или уведомления",
                                tool: "OpenAI",
                                description: "Создание подходящего ответа на основе анализа"
                            },
                            {
                                step: 5,
                                action: "Отправка уведомления",
                                tool: "Telegram Bot",
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
                    tools: ["Make", "Google Calendar"],
                    systemPrompt: "Координируй планирование встреч с автоматическим поиском оптимального времени. ВХОДНЫЕ ДАННЫЕ: список участников, длительность встречи, предпочтительные временные рамки, приоритет встречи. АЛГОРИТМ: 1) Получи календари всех участников 2) Найди пересечения свободного времени 3) Учти часовые пояса и рабочие часы 4) Выбери лучший слот по критериям 5) Создай событие и отправь приглашения. ВЫХОДНЫЕ ДАННЫЕ: JSON с предложенным временем, статусом участников, ссылкой на встречу. ПРИМЕРЫ: команда из 5 человек → поиск 1ч слота на следующей неделе. EDGE CASES: нет общего времени (предложить альтернативы), участник в отпуске (исключить), конфликт приоритетов (эскалация).",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Получение запроса на встречу",
                                tool: "Gmail",
                                description: "Триггер при получении email с запросом встречи"
                            },
                            {
                                step: 2,
                                action: "Анализ доступности участников",
                                tool: "Google Calendar",
                                description: "Проверка свободного времени в календарях"
                            },
                            {
                                step: 3,
                                action: "Поиск оптимального времени",
                                tool: "OpenAI",
                                description: "Алгоритм поиска лучшего времени"
                            },
                            {
                                step: 4,
                                action: "Создание события в календаре",
                                tool: "Google Calendar",
                                description: "Автоматическое создание встречи"
                            },
                            {
                                step: 5,
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
                    tools: ["Google Sheets", "Make"],
                    systemPrompt: "Генерируй структурированные отчеты с автоматическим анализом данных и выводами. ВХОДНЫЕ ДАННЫЕ: таблицы с метриками, временной период, цели отчета, аудитория. АЛГОРИТМ: 1) Собери данные из всех источников 2) Проверь качество и полноту данных 3) Рассчитай ключевые показатели и тренды 4) Выяви аномалии и важные изменения 5) Создай выводы и рекомендации 6) Оформи в структурированный отчет. ВЫХОДНЫЕ ДАННЫЕ: PDF отчет с графиками, таблицами, выводами и рекомендациями. ПРИМЕРЫ: месячный отчет по продажам с анализом конверсии. EDGE CASES: неполные данные (указать ограничения), резкие изменения (пометить как требующие внимания), технические ошибки (альтернативные источники).",
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
                    tools: ["ClickUp", "Telegram"],
                    systemPrompt: "Распределяй задачи между участниками команды на основе загрузки и компетенций. ВХОДНЫЕ ДАННЫЕ: новая задача, профили участников команды, текущая загрузка, компетенции, приоритеты проектов. АЛГОРИТМ: 1) Проанализируй требования задачи 2) Определи необходимые навыки 3) Оцени загруженность каждого участника 4) Сопоставь навыки с требованиями 5) Выбери оптимального исполнителя 6) Назначь задачу и установи дедлайн. ВЫХОДНЫЕ ДАННЫЕ: JSON с назначенным исполнителем, обоснованием выбора, приоритетом, дедлайном. ПРИМЕРЫ: фронтенд задача → разработчик React с наименьшей загрузкой. EDGE CASES: все заняты (эскалация), нет подходящих навыков (запрос на обучение), критическая задача (перераспределение приоритетов).",
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Получение новой задачи",
                                tool: "ClickUp",
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
                                tool: "Telegram",
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
                    systemPrompt: "Контролируй качество выполненных задач и генерируй отчеты о соответствии стандартам. ВХОДНЫЕ ДАННЫЕ: завершенные задачи, чеклисты качества, стандарты команды, код-ревью, метрики. АЛГОРИТМ: 1) Проверь соответствие техническим требованиям 2) Оцени качество кода/документации 3) Проверь покрытие тестами 4) Сравни с стандартами команды 5) Выяви проблемные области 6) Создай рекомендации по улучшению. ВЫХОДНЫЕ ДАННЫЕ: отчет с оценкой качества, списком проблем, рекомендациями, трендами по времени. ПРИМЕРЫ: код не соответствует стайл-гайду → рекомендация по рефакторингу. EDGE CASES: субъективные критерии (привлечь экспертов), технические ограничения (документировать исключения), критические баги (немедленная эскалация).",
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
                                tool: "Telegram",
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

    getContextualFallbackMoreResponse(existingCases, roleDescription) {
        // Анализируем уже существующие кейсы для создания связанных дополнений
        const usedTools = [...new Set(existingCases.flatMap(c => c.tools))];
        const existingTitles = existingCases.map(c => c.title);
        
        return {
            automationCases: [
                {
                    title: "агент валидации и контроля качества данных",
                    description: "Проверка целостности и качества данных во всех автоматизированных процессах для предотвращения ошибок",
                    priority: "высокий",
                    roiEstimate: "25-40%",
                    complexity: "средняя",
                    tools: usedTools.slice(0, 3),
                    systemPrompt: `Валидируй входящие данные и предотвращай ошибки в автоматизированных процессах. ВХОДНЫЕ ДАННЫЕ: таблицы, формы, API запросы, файлы в форматах CSV/JSON/XML. АЛГОРИТМ: 1) Проверь полноту обязательных полей 2) Валидируй форматы (email, телефон, даты) 3) Проверь бизнес-правила (лимиты, ограничения) 4) Найди дубликаты и аномалии 5) Создай отчет с ошибками и рекомендациями. ВЫХОДНЫЕ ДАННЫЕ: JSON с результатом валидации, списком ошибок, статистикой качества. ПРИМЕРЫ: email без @ → ошибка формата, отрицательная цена → нарушение бизнес-правил. EDGE CASES: неизвестный формат (запросить спецификацию), массовые ошибки (остановить процесс), критические данные (двойная проверка).`,
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Мониторинг входящих данных",
                                tool: "Google Sheets",
                                description: "Отслеживание новых записей в системах"
                            },
                            {
                                step: 2,
                                action: "Валидация по правилам",
                                tool: "OpenAI",
                                description: "Проверка данных на соответствие бизнес-логике"
                            },
                            {
                                step: 3,
                                action: "Проверка дубликатов",
                                tool: "Google Sheets",
                                description: "Поиск повторяющихся записей"
                            },
                            {
                                step: 4,
                                action: "Формирование отчета о качестве",
                                tool: "OpenAI",
                                description: "Создание детального отчета о найденных проблемах"
                            },
                            {
                                step: 5,
                                action: "Уведомление о проблемах",
                                tool: "Telegram Bot",
                                description: "Отправка срочных уведомлений при критических ошибках"
                            }
                        ]
                    }
                },
                {
                    title: "агент мониторинга и аналитики автоматизаций",
                    description: "Отслеживание эффективности всех автоматизированных процессов и предоставление аналитических отчетов для оптимизации",
                    priority: "средний",
                    roiEstimate: "20-35%",
                    complexity: "высокая",
                    tools: ["Google Sheets", "OpenAI", "Slack"],
                    systemPrompt: `Мониторь KPI автоматизированных процессов и создавай аналитические отчеты. ВХОДНЫЕ ДАННЫЕ: логи выполнения, метрики времени, количество ошибок, объемы данных, пользовательская активность. АЛГОРИТМ: 1) Собери метрики за период 2) Рассчитай KPI (время выполнения, success rate, throughput) 3) Выяви тренды и аномалии 4) Сравни с прошлыми периодами 5) Определи узкие места 6) Создай рекомендации по оптимизации. ВЫХОДНЫЕ ДАННЫЕ: дашборд с графиками, таблица KPI, список рекомендаций, приоритизированный план улучшений. ПРИМЕРЫ: увеличение времени обработки на 20% → исследовать нагрузку. EDGE CASES: нет данных (указать ограничения), резкие изменения (требуют внимания), системные сбои (исключить из анализа).`,
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Сбор метрик из систем",
                                tool: "Google Sheets",
                                description: "Агрегация данных о работе автоматизаций"
                            },
                            {
                                step: 2,
                                action: "Анализ производительности",
                                tool: "OpenAI",
                                description: "Выявление трендов и аномалий в работе"
                            },
                            {
                                step: 3,
                                action: "Создание дашборда",
                                tool: "Google Sheets",
                                description: "Визуализация ключевых показателей"
                            },
                            {
                                step: 4,
                                action: "Генерация рекомендаций",
                                tool: "OpenAI",
                                description: "Предложения по улучшению процессов"
                            },
                            {
                                step: 5,
                                action: "Отправка еженедельного отчета",
                                tool: "Slack",
                                description: "Автоматическая рассылка аналитики команде"
                            }
                        ]
                    }
                },
                {
                    title: "агент обработки исключительных ситуаций",
                    description: "Автоматическая обработка ошибок и исключений во всех автоматизированных процессах с эскалацией к человеку при необходимости",
                    priority: "высокий",
                    roiEstimate: "30-45%",
                    complexity: "высокая",
                    tools: ["OpenAI", "Telegram Bot", "Gmail"],
                    systemPrompt: `Ты специализированный агент для обработки исключений в контексте роли: ${roleDescription}. Отслеживай все ошибки и сбои в автоматизированных процессах, классифицируй их по критичности, пытайся автоматически восстановить работу системы. Для критических ошибок немедленно уведомляй ответственных сотрудников с детальным описанием проблемы и предлагаемыми решениями. Ведей журнал всех инцидентов для анализа паттернов сбоев.`,
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Мониторинг ошибок в системах",
                                tool: "Gmail",
                                description: "Получение уведомлений об ошибках"
                            },
                            {
                                step: 2,
                                action: "Классификация критичности",
                                tool: "OpenAI",
                                description: "Определение серьезности проблемы"
                            },
                            {
                                step: 3,
                                action: "Попытка автоматического решения",
                                tool: "OpenAI",
                                description: "Поиск и применение известных решений"
                            },
                            {
                                step: 4,
                                action: "Эскалация критических ошибок",
                                tool: "Telegram Bot",
                                description: "Срочное уведомление ответственных"
                            },
                            {
                                step: 5,
                                action: "Логирование инцидента",
                                tool: "Google Sheets",
                                description: "Запись в журнал для последующего анализа"
                            }
                        ]
                    }
                },
                {
                    title: "агент интеграции между системами",
                    description: "Обеспечение бесшовной передачи данных между различными инструментами и платформами, используемыми в роли",
                    priority: "средний",
                    roiEstimate: "25-40%",
                    complexity: "высокая",
                    tools: usedTools,
                    systemPrompt: `Ты агент интеграции для роли: ${roleDescription}. Обеспечиваешь синхронизацию данных между различными системами, преобразуешь форматы данных для совместимости, отслеживаешь целостность информации при передаче. Автоматически сопоставляешь поля между системами, разрешаешь конфликты данных, ведешь журнал всех операций интеграции. При возникновении проблем совместимости предлагаешь альтернативные способы передачи данных.`,
                    automationPipeline: {
                        platform: "n8n",
                        steps: [
                            {
                                step: 1,
                                action: "Мониторинг изменений в системе A",
                                tool: usedTools[0] || "Google Sheets",
                                description: "Отслеживание обновлений данных"
                            },
                            {
                                step: 2,
                                action: "Трансформация данных",
                                tool: "OpenAI",
                                description: "Преобразование формата для системы B"
                            },
                            {
                                step: 3,
                                action: "Валидация совместимости",
                                tool: "OpenAI",
                                description: "Проверка корректности преобразования"
                            },
                            {
                                step: 4,
                                action: "Синхронизация с системой B",
                                tool: usedTools[1] || "ClickUp",
                                description: "Передача данных в целевую систему"
                            },
                            {
                                step: 5,
                                action: "Подтверждение целостности",
                                tool: "OpenAI",
                                description: "Проверка успешности операции"
                            },
                            {
                                step: 6,
                                action: "Логирование операции",
                                tool: "Google Sheets",
                                description: "Запись в журнал интеграций"
                            }
                        ]
                    }
                },
                {
                    title: "агент обучения и адаптации процессов",
                    description: "Анализ паттернов использования автоматизаций и автоматическая оптимизация процессов на основе накопленного опыта",
                    priority: "низкий",
                    roiEstimate: "15-30%",
                    complexity: "высокая",
                    tools: ["OpenAI", "Google Sheets", "Notion"],
                    systemPrompt: `Ты агент машинного обучения для роли: ${roleDescription}. Анализируешь историю выполнения автоматизированных процессов, выявляешь закономерности в поведении пользователей, оптимизируешь параметры работы систем. Предлагаешь улучшения на основе анализа данных, создаешь рекомендации по настройке процессов, автоматически адаптируешь параметры автоматизаций под изменяющиеся условия работы.`,
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Сбор данных о использовании",
                                tool: "Google Sheets",
                                description: "Агрегация истории операций"
                            },
                            {
                                step: 2,
                                action: "Анализ паттернов поведения",
                                tool: "OpenAI",
                                description: "Выявление закономерностей в данных"
                            },
                            {
                                step: 3,
                                action: "Генерация предложений по улучшению",
                                tool: "OpenAI",
                                description: "Создание рекомендаций по оптимизации"
                            },
                            {
                                step: 4,
                                action: "Документирование улучшений",
                                tool: "Notion",
                                description: "Сохранение предложений в базе знаний"
                            },
                            {
                                step: 5,
                                action: "Уведомление о возможностях оптимизации",
                                tool: "Slack",
                                description: "Информирование команды о найденных улучшениях"
                            }
                        ]
                    }
                },
                {
                    title: "агент планирования и расписания автоматизаций",
                    description: "Интеллектуальное управление расписанием выполнения всех автоматизированных процессов с учетом приоритетов и ресурсов",
                    priority: "средний",
                    roiEstimate: "20-35%",
                    complexity: "средняя",
                    tools: ["Google Calendar", "OpenAI", "Telegram Bot"],
                    systemPrompt: `Ты агент планирования для роли: ${roleDescription}. Управляешь расписанием выполнения всех автоматизированных процессов, оптимизируешь загрузку системных ресурсов, избегаешь конфликтов при одновременном выполнении задач. Учитываешь приоритеты процессов, доступность внешних систем, пиковые нагрузки. Автоматически переносишь выполнение задач при возникновении конфликтов или технических проблем.`,
                    automationPipeline: {
                        platform: "Make",
                        steps: [
                            {
                                step: 1,
                                action: "Анализ очереди задач",
                                tool: "Google Calendar",
                                description: "Проверка запланированных автоматизаций"
                            },
                            {
                                step: 2,
                                action: "Оптимизация расписания",
                                tool: "OpenAI",
                                description: "Планирование оптимального времени выполнения"
                            },
                            {
                                step: 3,
                                action: "Проверка доступности ресурсов",
                                tool: "OpenAI",
                                description: "Анализ загрузки систем и API лимитов"
                            },
                            {
                                step: 4,
                                action: "Обновление календаря выполнения",
                                tool: "Google Calendar",
                                description: "Корректировка расписания автоматизаций"
                            },
                            {
                                step: 5,
                                action: "Уведомление об изменениях",
                                tool: "Telegram Bot",
                                description: "Информирование о переносах или конфликтах"
                            }
                        ]
                    }
                }
            ]
        };
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