// هيكل البيانات والمتغيرات العامة
let conversation = [];
let learningItems = {};
let selectedKey = 'smart'; // القيمة الافتراضية هي الاختيار الذكي
let keyUsageStats = {}; // إحصائيات استخدام المفاتيح
let messageCategories = {}; // تصنيفات الرسائل

// إعدادات الـ API
const apiConfig = {
    key1: {
        name: 'المفتاح الأول',
        description: 'محادثات عامة',
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        categories: ['general', 'conversation'],
        keywords: ['معلومات', 'ماذا', 'كيف', 'أخبرني', 'شرح'],
        rateLimitPerMinute: 10
    },
    key2: {
        name: 'المفتاح الثاني',
        description: 'محادثات تقنية وحقائق',
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        categories: ['technical', 'factual', 'programming'],
        keywords: ['برمجة', 'كود', 'تقنية', 'حاسوب', 'برنامج', 'تطوير', 'جافا', 'بايثون'],
        rateLimitPerMinute: 8
    },
    key3: {
        name: 'المفتاح الثالث',
        description: 'محادثات إبداعية واستكشافية',
        temperature: 0.9,
        topK: 60,
        topP: 0.99,
        categories: ['creative', 'story', 'imagination'],
        keywords: ['قصة', 'خيال', 'إبداع', 'فكرة', 'تخيل', 'فن', 'أدب', 'شعر'],
        rateLimitPerMinute: 6
    },
    key4: {
        name: 'المفتاح الرابع',
        description: 'محادثات متوازنة',
        temperature: 0.6,
        topK: 50,
        topP: 0.90,
        categories: ['balanced', 'advice', 'guidance'],
        keywords: ['نصيحة', 'توجيه', 'مساعدة', 'حل', 'مشكلة', 'طريقة', 'أفضل'],
        rateLimitPerMinute: 12
    },
    key5: {
        name: 'المفتاح الرابع',
        description: 'محادثات متوازنة',
        temperature: 0.6,
        topK: 50,
        topP: 0.90,
        categories: ['balanced', 'advice', 'guidance'],
        keywords: ['نصيحة', 'توجيه', 'مساعدة', 'حل', 'مشكلة', 'طريقة', 'أفضل'],
        rateLimitPerMinute: 12
    }
};

// تهيئة إحصائيات المفاتيح
function initKeyStats() {
    Object.keys(apiConfig).forEach(key => {
        if (!keyUsageStats[key]) {
            keyUsageStats[key] = {
                totalUses: 0,
                lastUsed: null,
                usesInLastMinute: 0,
                categoriesHandled: {},
                successRate: 1.0
            };
        }
    });
}

// اختيار المفتاح المناسب بناءً على محتوى الرسالة
function selectSmartKey(message) {
    // تحليل الرسالة وتحديد الفئة المناسبة
    const category = analyzeMessageCategory(message);
    
    // حساب نقاط لكل مفتاح بناءً على عدة عوامل
    const keyScores = {};
    
    Object.entries(apiConfig).forEach(([keyId, config]) => {
        const stats = keyUsageStats[keyId] || { 
            totalUses: 0, 
            lastUsed: null,
            usesInLastMinute: 0,
            categoriesHandled: {},
            successRate: 1.0
        };
        
        let score = 0;
        
        // 1. تطابق الفئة
        if (config.categories.includes(category)) {
            score += 5;
        }
        
        // 2. تطابق الكلمات المفتاحية
        const keywordMatchScore = calculateKeywordMatchScore(message, config.keywords);
        score += keywordMatchScore * 3;
        
        // 3. توزيع الحمل (أفضلية للمفاتيح الأقل استخدامًا)
        const loadBalancingScore = 1 - (stats.totalUses / (Math.max(...Object.values(keyUsageStats).map(s => s.totalUses || 1))));
        score += loadBalancingScore * 2;
        
        // 4. ضبط حسب معدل النجاح
        score *= stats.successRate;
        
        // 5. التحقق من حدود معدل الاستخدام
        if (stats.usesInLastMinute >= config.rateLimitPerMinute) {
            score *= 0.2; // تخفيض كبير في النقاط إذا تم الوصول إلى حد معدل الاستخدام
        }
        
        keyScores[keyId] = score;
    });
    
    // اختيار المفتاح ذو أعلى نقاط
    const sortedKeys = Object.entries(keyScores).sort((a, b) => b[1] - a[1]);
    const selectedKeyId = sortedKeys[0][0];
    
    // تحديث الفئة للرسالة الحالية
    messageCategories[message] = category;
    
    console.log('Smart key selection:', selectedKeyId, 'for category', category, 'with scores', keyScores);
    
    return selectedKeyId;
}

// تحليل فئة الرسالة
function analyzeMessageCategory(message) {
    const lowerMessage = message.toLowerCase();
    
    // البحث عن الكلمات المفتاحية في كل فئة
    const categoryScores = {
        'technical': 0,
        'creative': 0,
        'factual': 0,
        'general': 0,
        'balanced': 0
    };
    
    // فحص الكلمات المفتاحية التقنية
    if (/برمج|كود|تطوير|جافا|بايثون|javascript|python|code|html|css/.test(lowerMessage)) {
        categoryScores.technical += 2;
    }
    
    // فحص الكلمات المفتاحية الإبداعية
    if (/قصة|خيال|فكرة|إبداع|تخيل|فن|أدب|شعر|ابتكار/.test(lowerMessage)) {
        categoryScores.creative += 2;
    }
    
    // فحص طلبات الحقائق
    if (/ما هو|كيف|متى|أين|لماذا|من هو|تاريخ|حقيقة|معلومة/.test(lowerMessage)) {
        categoryScores.factual += 1.5;
    }
    
    // فحص طلبات النصائح
    if (/نصيحة|أفضل|طريقة|كيف يمكنني|ساعدني|حل|مشكلة/.test(lowerMessage)) {
        categoryScores.balanced += 1.5;
    }
    
    // طول الرسالة
    if (message.length < 20) {
        categoryScores.general += 1; // الرسائل القصيرة غالباً ما تكون عامة
    } else if (message.length > 100) {
        categoryScores.technical += 0.5; // الرسائل الطويلة قد تكون تقنية
        categoryScores.creative += 0.5; // أو إبداعية
    }
    
    // عدد علامات الترقيم
    const punctuationCount = (message.match(/[؟!.,;:]/g) || []).length;
    if (punctuationCount > 5) {
        categoryScores.creative += 0.5;
    }
    
    // اختيار الفئة ذات أعلى نقاط
    const topCategory = Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    // إذا كانت النقاط منخفضة جدًا لجميع الفئات، فاستخدم 'general'
    if (categoryScores[topCategory] < 0.5) {
        return 'general';
    }
    
    return topCategory;
}

// حساب درجة تطابق الكلمات المفتاحية
function calculateKeywordMatchScore(message, keywords) {
    const lowerMessage = message.toLowerCase();
    let matchCount = 0;
    
    keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword.toLowerCase())) {
            matchCount++;
        }
    });
    
    return matchCount / Math.max(keywords.length, 1);
}

// تحديث إحصائيات المفتاح
function updateKeyStats(keyId, success = true) {
    if (!keyUsageStats[keyId]) {
        keyUsageStats[keyId] = {
            totalUses: 0,
            lastUsed: null,
            usesInLastMinute: 0,
            categoriesHandled: {},
            successRate: 1.0
        };
    }
    
    const stats = keyUsageStats[keyId];
    const now = Date.now();
    
    // تحديث الإحصائيات الأساسية
    stats.totalUses++;
    stats.lastUsed = now;
    
    // تحديث عدد الاستخدامات في الدقيقة الأخيرة
    stats.usesInLastMinute = (stats.usesInLastMinute || 0) + 1;
    
    // إعادة ضبط عدد الاستخدامات في الدقيقة الأخيرة بعد مرور دقيقة
    setTimeout(() => {
        stats.usesInLastMinute = Math.max(0, (stats.usesInLastMinute || 0) - 1);
    }, 60000);
    
    // تحديث معدل النجاح
    if (!success) {
        stats.successRate = stats.successRate * 0.9; // تخفيض تدريجي للمعدل عند الفشل
    } else if (stats.successRate < 1.0) {
        stats.successRate = Math.min(1.0, stats.successRate + 0.05); // زيادة تدريجية للمعدل عند النجاح
    }
    
    // حفظ الإحصائيات المحدثة
    localStorage.setItem('keyUsageStats', JSON.stringify(keyUsageStats));
}

// الوظائف المساعدة لاختيار المفتاح
function getRandomKey() {
    const keys = Object.keys(apiConfig);
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
}

function getActiveKey(message = null) {
    // تهيئة إحصائيات المفاتيح إذا لم تكن موجودة
    initKeyStats();
    
    if (selectedKey === 'random') {
        return getRandomKey();
    } else if (selectedKey === 'smart' && message) {
        return selectSmartKey(message);
    } else if (selectedKey === 'smart') {
        // إذا لم يتم توفير رسالة، فاستخدم المفتاح الأقل استخدامًا
        const leastUsedKey = Object.entries(keyUsageStats)
            .sort((a, b) => a[1].totalUses - b[1].totalUses)[0][0];
        return leastUsedKey;
    }
    return selectedKey;
}

function getApiKey(keyId) {
    // أولاً نحاول الحصول على المفتاح من الخادم إذا كان متاحاً
    const serverKeys = {
        'key1': window.GEMINI_KEY_1,
        'key2': window.GEMINI_KEY_2,
        'key3': window.GEMINI_KEY_3,
        'key4': window.GEMINI_KEY_4,
        'key5': window.GEMINI_KEY_5
    };
    
    if (serverKeys[keyId]) {
        return serverKeys[keyId];
    }
    
    // إذا لم يكن المفتاح متاحاً من الخادم، نستخدم المفتاح المدخل يدوياً
    return document.getElementById(`apiKey${keyId.substring(3)}`).value;
}

// تحميل البيانات من التخزين المحلي
function loadFromLocalStorage() {
    // تحميل المحادثة
    const savedConversation = localStorage.getItem('conversation');
    if (savedConversation) {
        conversation = JSON.parse(savedConversation);
    }
    
    // تحميل العناصر المتعلمة
    const savedLearningItems = localStorage.getItem('learningItems');
    if (savedLearningItems) {
        learningItems = JSON.parse(savedLearningItems);
    }
    
    // تحميل المفتاح المختار
    const savedSelectedKey = localStorage.getItem('selectedKey');
    if (savedSelectedKey) {
        selectedKey = savedSelectedKey;
        document.getElementById('apiKeySelect').value = savedSelectedKey;
    }
}

// حفظ البيانات في التخزين المحلي
function saveToLocalStorage() {
    // حفظ المحادثة
    localStorage.setItem('conversation', JSON.stringify(conversation));
    
    // حفظ العناصر المتعلمة
    localStorage.setItem('learningItems', JSON.stringify(learningItems));
    
    // حفظ المفتاح المختار
    localStorage.setItem('selectedKey', selectedKey);
}

// حفظ مفاتيح API في التخزين المحلي
// لم نعد نحتاج لحفظ المفاتيح لأنها تُحمّل تلقائياً من بيئة التطبيق
function saveApiKeys() {
    // حفظ تفضيلات اختيار المفتاح فقط
    localStorage.setItem('selectedKey', selectedKey);
    console.log('تم حفظ تفضيلات اختيار المفتاح');
}

// تحميل المحادثة السابقة
function loadChatHistory() {
    // مسح الرسائل الحالية
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    // إذا لم تكن هناك رسائل سابقة، عرض رسالة ترحيبية
    if (conversation.length === 0) {
        chatMessages.innerHTML = `
            <div class="text-center text-muted my-4">
                <div>
                    <i class="fas fa-comment-dots fa-3x mb-3"></i>
                </div>
                <p>ابدأ محادثة مع الذكاء الاصطناعي<br>يتعلم من تفاعلاتك!</p>
            </div>
        `;
        return;
    }
    
    // عرض الرسائل السابقة
    conversation.forEach(message => {
        addMessageToChat(message.role, message.content, message.api_used);
    });
    
    // التمرير إلى أسفل
    scrollToBottom();
    
    // تحديث عدد العناصر المتعلمة
    updateLearningCount();
}

// إضافة رسالة إلى المحادثة
function addMessageToChat(role, text, apiUsed = null) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;
    
    // إنشاء محتوى الرسالة
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);
    
    // إضافة شارة API لرسائل الذكاء الاصطناعي
    if (role === 'assistant' && apiUsed) {
        const apiBadge = document.createElement('div');
        apiBadge.className = 'api-badge badge bg-dark';
        apiBadge.textContent = `مدعوم بواسطة: ${getApiDisplayName(apiUsed)}`;
        messageDiv.appendChild(apiBadge);
    }
    
    // إضافة إلى المحادثة
    chatMessages.appendChild(messageDiv);
    
    // التمرير إلى أسفل
    scrollToBottom();
}

// الحصول على اسم العرض لمفتاح API
function getApiDisplayName(apiCode) {
    const apiNames = {
        'key1': 'المفتاح الأول',
        'key2': 'المفتاح الثاني',
        'key3': 'المفتاح الثالث',
        'key4': 'المفتاح الرابع',
        'key4': 'المفتاح الخامس',
        'error': 'خطأ',
        'none': 'لا يوجد خدمة'
    };
    
    return apiNames[apiCode] || 'Gemini';
}

// إرسال رسالة إلى الذكاء الاصطناعي
async function sendMessage(message) {
    // اختيار المفتاح بطريقة ذكية بناءً على محتوى الرسالة
    const keyId = getActiveKey(message);
    const apiKey = getApiKey(keyId);
    
    console.log(`تم اختيار المفتاح: ${keyId} للرسالة: "${message.substring(0, 30)}..."`);
    
    if (!apiKey) {
        showErrorMessage(`يرجى تعيين مفتاح API للـ ${getApiDisplayName(keyId)} في الإعدادات.`);
        return null;
    }
    
    try {
        // إعداد بيانات الطلب
        const model = "gemini-1.5-pro";
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
        
        // تنسيق محفوظات المحادثة
        const messages = [];
        for (const msg of conversation) {
            if (msg.role === 'user') {
                messages.push({"role": "user", "parts": [{"text": msg.content}]});
            } else {
                messages.push({"role": "model", "parts": [{"text": msg.content}]});
            }
        }
        
        // إضافة الرسالة الحالية
        messages.push({"role": "user", "parts": [{"text": message}]});
        
        // إعداد البيانات للإرسال
        const keyConfig = apiConfig[keyId];
        const payload = {
            "contents": messages,
            "generationConfig": {
                "temperature": keyConfig.temperature,
                "topK": keyConfig.topK,
                "topP": keyConfig.topP,
                "maxOutputTokens": 1024
            }
        };
        
        // إرسال الطلب
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // استخراج الرد النصي
        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts) {
                return {
                    text: candidate.content.parts[0].text,
                    api_used: keyId
                };
            }
        }
        
        throw new Error('تنسيق استجابة غير متوقع من API');
        
    } catch (error) {
        console.error('خطأ في استدعاء Gemini API:', error);
        return null;
    }
}

// استخراج عناصر التعلم من المحادثة
function extractLearningItems(userMessage, aiResponse) {
    const items = {};
    
    // نهج بسيط: استخراج العبارات الرئيسية من رسالة المستخدم
    const words = userMessage.toLowerCase().split(/\s+/);
    const keyPhrases = words.filter(w => w.length > 4 && !/^\d+$/.test(w));
    
    // إذا وجدنا أي عبارات رئيسية، قم بربطها برد الذكاء الاصطناعي
    if (keyPhrases.length > 0 && userMessage.length > 10 && aiResponse.length > 20) {
        for (const phrase of keyPhrases.slice(0, 3)) {  // الحد إلى 3 عبارات رئيسية لكل تفاعل
            // تخزين فقط إذا كانت العبارة ذات معنى (ليست كلمات شائعة جدًا)
            if (![
                "about", "there", "these", "those", "where", "which", "hello", "please", "thanks",
                "شكرا", "مرحبا", "كيف", "لماذا", "متى", "اين", "هناك", "هؤلاء", "أولئك"
            ].includes(phrase)) {
                // إنشاء عنصر تعليمي مختصر مع السياق
                items[phrase] = {
                    content: `سأل المستخدم: '${userMessage}' - رد الذكاء الاصطناعي ذكر: '${aiResponse.slice(0, 100)}...'`,
                    confidence: 0.7,
                    created_at: new Date().toISOString()
                };
            }
        }
    }
    
    return items;
}

// البحث عن معلومات سياقية ذات صلة
function findRelevantContext(userMessage) {
    const relevantItems = [];
    const words = userMessage.toLowerCase().split(/\s+/);
    
    // البحث عن العناصر المتعلمة ذات الصلة
    for (const word of words) {
        if (word.length > 3 && learningItems[word]) {
            relevantItems.push(learningItems[word].content);
            
            // تحديث عدد مرات الاستخدام (إذا كان هناك عدد مرات استخدام)
            if (learningItems[word].times_used !== undefined) {
                learningItems[word].times_used++;
            } else {
                learningItems[word].times_used = 1;
            }
        }
    }
    
    return relevantItems;
}

// تحديث عدد العناصر المتعلمة
function updateLearningCount() {
    const count = Object.keys(learningItems).length;
    document.getElementById('learningCount').textContent = count;
}

// عرض عناصر التعلم في النافذة المنبثقة
function showLearningItems() {
    const learningItemsContainer = document.getElementById('learningItems');
    learningItemsContainer.innerHTML = '';
    
    // إذا لم تكن هناك عناصر متعلمة، عرض رسالة
    if (Object.keys(learningItems).length === 0) {
        learningItemsContainer.innerHTML = '<div class="alert alert-info">لا توجد عناصر متعلمة حتى الآن.</div>';
        return;
    }
    
    // إنشاء عنصر لكل عنصر متعلم
    for (const [key, item] of Object.entries(learningItems)) {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item learning-item';
        
        // العنوان
        const title = document.createElement('h6');
        title.className = 'mb-1';
        title.textContent = key;
        
        // الثقة
        const confidence = document.createElement('span');
        confidence.className = `confidence-badge badge ${getConfidenceBadgeClass(item.confidence)}`;
        confidence.textContent = `الثقة: ${(item.confidence * 100).toFixed(0)}%`;
        title.appendChild(confidence);
        
        // المحتوى
        const content = document.createElement('p');
        content.className = 'mb-1 small';
        content.textContent = item.content;
        
        // مرات الاستخدام
        const usageCount = document.createElement('small');
        usageCount.className = 'text-muted';
        usageCount.textContent = `استخدمت ${item.times_used || 0} مرات`;
        
        // إضافة العناصر
        itemElement.appendChild(title);
        itemElement.appendChild(content);
        itemElement.appendChild(usageCount);
        
        learningItemsContainer.appendChild(itemElement);
    }
}

// الحصول على فئة الشارة بناءً على مستوى الثقة
function getConfidenceBadgeClass(confidence) {
    if (confidence > 0.8) {
        return 'bg-success';
    } else if (confidence > 0.5) {
        return 'bg-primary';
    } else if (confidence > 0.3) {
        return 'bg-warning';
    } else {
        return 'bg-danger';
    }
}

// عرض رسالة خطأ
function showErrorMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger mx-auto my-3';
    errorDiv.textContent = text;
    chatMessages.appendChild(errorDiv);
    
    // إزالة بعد 5 ثوان
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// التمرير إلى أسفل المحادثة
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// مسح تاريخ المحادثة
function clearChatHistory() {
    if (!confirm('هل أنت متأكد من رغبتك في مسح تاريخ المحادثة؟')) {
        return;
    }
    
    // مسح البيانات
    conversation = [];
    saveToLocalStorage();
    
    // مسح الرسائل من واجهة المستخدم
    loadChatHistory();
}

// عند تحميل المستند
document.addEventListener('DOMContentLoaded', function() {
    // الإشارة إلى العناصر
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const typingIndicator = document.getElementById('typingIndicator');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const apiKeySelect = document.getElementById('apiKeySelect');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const showLearningBtn = document.getElementById('showLearningBtn');
    
    // تهيئة مودال العناصر المتعلمة
    const learningModal = new bootstrap.Modal(document.getElementById('learningModal'));
    
    // تحميل البيانات
    loadFromLocalStorage();
    
    // تحميل إحصائيات استخدام المفاتيح 
    const savedKeyStats = localStorage.getItem('keyUsageStats');
    if (savedKeyStats) {
        keyUsageStats = JSON.parse(savedKeyStats);
    }
    
    // تهيئة إحصائيات المفاتيح
    initKeyStats();
    
    // تحميل تاريخ المحادثة
    loadChatHistory();
    
    // مستمعو الأحداث
    chatForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        // إضافة رسالة المستخدم
        addMessageToChat('user', messageText);
        conversation.push({role: 'user', content: messageText});
        
        // مسح حقل الإدخال
        messageInput.value = '';
        
        // إظهار مؤشر الكتابة
        typingIndicator.style.display = 'block';
        
        // التمرير إلى أسفل
        scrollToBottom();
        
        // البحث عن معلومات سياق ذات صلة
        const relevantContext = findRelevantContext(messageText);
        
        // إرسال الرسالة إلى الذكاء الاصطناعي
        try {
            const response = await sendMessage(messageText);
            
            // إخفاء مؤشر الكتابة
            typingIndicator.style.display = 'none';
            
            if (response) {
                // إضافة رد الذكاء الاصطناعي
                addMessageToChat('assistant', response.text, response.api_used);
                conversation.push({
                    role: 'assistant', 
                    content: response.text, 
                    api_used: response.api_used
                });
                
                // استخراج عناصر التعلم
                const newLearningItems = extractLearningItems(messageText, response.text);
                
                // دمج عناصر التعلم الجديدة
                learningItems = {...learningItems, ...newLearningItems};
                
                // تحديث عدد العناصر المتعلمة
                updateLearningCount();
                
                // تحديث إحصائيات استخدام المفتاح
                updateKeyStats(response.api_used, true);
                
                // حفظ البيانات
                saveToLocalStorage();
            } else {
                // تحديث إحصائيات استخدام المفتاح عند الفشل
                const keyId = getActiveKey(messageText);
                updateKeyStats(keyId, false);
                
                showErrorMessage('فشل في الحصول على رد. يرجى التحقق من مفتاح API الخاص بك والمحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // إخفاء مؤشر الكتابة
            typingIndicator.style.display = 'none';
            
            // عرض رسالة خطأ
            showErrorMessage('فشل في الحصول على رد. يرجى المحاولة مرة أخرى.');
        }
    });
    
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    
    apiKeySelect.addEventListener('change', function() {
        selectedKey = this.value;
        localStorage.setItem('selectedKey', selectedKey);
    });
    
    saveSettingsBtn.addEventListener('click', function() {
        saveApiKeys();
        showErrorMessage('تم حفظ الإعدادات بنجاح!'); // استخدام نفس الفنكشن ولكن كتأكيد وليس خطأ
    });
    
    showLearningBtn.addEventListener('click', function() {
        showLearningItems();
        learningModal.show();
    });
});