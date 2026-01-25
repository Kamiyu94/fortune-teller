// 塔羅牌占卜 App - 主程式
const TEACHER_LINE_URL = "https://line.me/R/ti/p/@nuw5707v";

class TarotApp {
    constructor() {
        this.mode = null; // 'single', 'three', or 'five'
        this.drawnCards = [];
        this.currentDrawIndex = 0;

        // 定義各牌陣的標籤
        this.modeLabels = {
            single: ['指引'],
            three: ['過去', '現在', '未來'],
            five: [
                '問題現況',
                '外在影響',
                '內在影響',
                '解決建議',
                '全能洞見'
            ]
        };

        this.initElements();
        this.initEventListeners();
        this.createStars();
        this.registerServiceWorker();

        // Debug Check
        this.checkDebugMode();
    }

    checkDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const debugId = urlParams.get('debug_card');
        if (debugId) {
            const id = parseInt(debugId);
            const card = TAROT_CARDS.find(c => c.id === id);
            if (card) {
                console.log('Debug mode: Previewing card', card.name);
                this.mode = 'single';
                this.drawnCards = [{
                    card: card,
                    isReversed: false
                }];

                // Use native class switching (CSS handles opacity/visibility)
                // Remove active from all screens first
                this.homeScreen.classList.remove('active');
                this.drawScreen.classList.remove('active');
                this.resultScreen.classList.remove('active');

                // Add active to result screen
                this.resultScreen.classList.add('active');

                // Render the result immediately
                this.showResult();
            }
        }
    }

    initElements() {
        // Screens
        this.homeScreen = document.getElementById('homeScreen');
        this.drawScreen = document.getElementById('drawScreen');
        this.resultScreen = document.getElementById('resultScreen');

        // Home screen
        this.singleModeBtn = document.getElementById('singleModeBtn');
        this.threeModeBtn = document.getElementById('threeModeBtn');
        this.fiveModeBtn = document.getElementById('fiveModeBtn');

        // Draw screen
        this.backBtn = document.getElementById('backBtn');
        this.drawTitle = document.getElementById('drawTitle');
        this.cardsContainer = document.getElementById('cardsContainer');
        this.drawHint = document.getElementById('drawHint');

        // Result screen
        this.resultBackBtn = document.getElementById('resultBackBtn');
        this.resultContent = document.getElementById('resultContent');
        this.resultCards = document.getElementById('resultCards');
        this.resultMeanings = document.getElementById('resultMeanings');
        this.saveBtn = document.getElementById('saveBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.redrawBtn = document.getElementById('redrawBtn');

        // Loading
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        // Mode selection
        this.singleModeBtn.addEventListener('click', () => this.startDraw('single'));
        this.threeModeBtn.addEventListener('click', () => this.startDraw('three'));
        this.fiveModeBtn.addEventListener('click', () => this.startDraw('five'));

        // Back buttons
        this.backBtn.addEventListener('click', () => this.goToHome());
        this.resultBackBtn.addEventListener('click', () => this.goToHome());

        // Action buttons
        this.saveBtn.addEventListener('click', () => this.saveImage());
        this.shareBtn.addEventListener('click', () => this.shareResult());
        this.redrawBtn.addEventListener('click', () => this.startDraw(this.mode));
    }

    createStars() {
        const container = document.getElementById('starsContainer');
        const starCount = 100;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
            star.style.setProperty('--opacity', `${0.3 + Math.random() * 0.7}`);
            star.style.animationDelay = `${Math.random() * 3}s`;
            container.appendChild(star);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    switchScreen(target) {
        [this.homeScreen, this.drawScreen, this.resultScreen].forEach(screen => {
            screen.classList.remove('active');
        });
        target.classList.add('active');
    }

    goToHome() {
        this.switchScreen(this.homeScreen);
        this.drawnCards = [];
        this.currentDrawIndex = 0;
    }

    getCardCount(mode) {
        switch (mode) {
            case 'single': return 1;
            case 'three': return 3;
            case 'five': return 5;
            default: return 1;
        }
    }

    getDrawTitle(mode) {
        switch (mode) {
            case 'single': return '點擊卡牌抽牌';
            case 'three': return '依序點擊三張卡牌';
            case 'five': return '依序點擊五張卡牌';
            default: return '點擊卡牌抽牌';
        }
    }

    startDraw(mode) {
        this.mode = mode;
        this.drawnCards = [];
        this.currentDrawIndex = 0;

        const cardCount = this.getCardCount(mode);
        const labels = this.modeLabels[mode];
        this.drawTitle.textContent = this.getDrawTitle(mode);

        // Create cards
        this.cardsContainer.innerHTML = '';

        for (let i = 0; i < cardCount; i++) {
            const card = this.createCardElement(i, mode !== 'single' ? labels[i] : null);
            this.cardsContainer.appendChild(card);
        }

        this.drawHint.classList.remove('hidden');
        this.drawHint.querySelector('span:last-child').textContent = '點擊卡牌揭示命運';
        this.switchScreen(this.drawScreen);
    }

    createCardElement(index, label) {
        const card = document.createElement('div');
        card.className = 'tarot-card';
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back">
                    <div class="card-back-design"></div>
                </div>
                <div class="card-face card-front">
                    ${label ? `<div class="card-label">${label}</div>` : ''}
                    <div class="card-symbol"></div>
                    <div class="card-name"></div>
                    <div class="card-name-en"></div>
                    <div class="card-position"></div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.handleCardClick(card, index));
        return card;
    }

    handleCardClick(cardElement, index) {
        // Only allow clicking the next card in sequence
        if (index !== this.currentDrawIndex || cardElement.classList.contains('flipped')) {
            return;
        }

        // Draw a random card
        const drawnCard = this.drawRandomCard();
        this.drawnCards.push(drawnCard);

        // Update card display
        const cardFront = cardElement.querySelector('.card-front');
        const symbolEl = cardFront.querySelector('.card-symbol');

        if (drawnCard.card.image) {
            symbolEl.innerHTML = `<img src="${drawnCard.card.image}" class="tarot-img" alt="${drawnCard.card.name}">`;
        } else {
            symbolEl.textContent = drawnCard.card.symbol || '🎴';
        }
        cardFront.querySelector('.card-name').textContent = drawnCard.card.name;
        cardFront.querySelector('.card-name-en').textContent = drawnCard.card.nameEn;

        const positionEl = cardFront.querySelector('.card-position');
        positionEl.textContent = drawnCard.isReversed ? '逆位' : '正位';
        positionEl.className = `card-position ${drawnCard.isReversed ? 'reversed' : 'upright'}`;

        // Flip animation
        if (drawnCard.isReversed) {
            cardElement.classList.add('reversed');
        } else {
            cardElement.classList.add('flipped');
        }
        cardElement.classList.add('disabled');

        this.currentDrawIndex++;

        // Update hint
        const totalCards = this.getCardCount(this.mode);
        if (this.currentDrawIndex < totalCards) {
            this.drawHint.querySelector('span:last-child').textContent =
                `還剩 ${totalCards - this.currentDrawIndex} 張牌`;
        } else {
            this.drawHint.classList.add('hidden');
            // Show result after a delay
            setTimeout(() => this.showResult(), 1000);
        }
    }

    drawRandomCard() {
        // Get available cards (not already drawn)
        const drawnIds = this.drawnCards.map(d => d.card.id);
        const available = TAROT_CARDS.filter(c => !drawnIds.includes(c.id));

        // Random card and position
        const card = available[Math.floor(Math.random() * available.length)];
        const isReversed = Math.random() < 0.5;

        return { card, isReversed };
    }

    showResult() {
        const labels = this.modeLabels[this.mode];

        // Generate result cards HTML
        this.resultCards.innerHTML = this.drawnCards.map((drawn, i) => {
            const visual = drawn.card.image
                ? `<img src="${drawn.card.image}" class="tarot-img result-img" alt="${drawn.card.name}">`
                : drawn.card.symbol;

            return `
            <div class="result-card ${drawn.isReversed ? 'reversed' : ''}">
                ${this.mode !== 'single' ? `<div class="card-label">${labels[i]}</div>` : ''}
                <div class="card-symbol ${drawn.isReversed ? 'is-reversed' : ''}">${visual}</div>
                <div class="card-name">${drawn.card.name}</div>
            </div>`;
        }).join('');

        // Generate meanings HTML
        this.resultMeanings.innerHTML = this.drawnCards.map((drawn, i) => {
            const meaning = drawn.isReversed ? drawn.card.reversed : drawn.card.upright;
            const visual = drawn.card.image
                ? `<img src="${drawn.card.image}" class="tarot-img meaning-img" alt="${drawn.card.name}">`
                : drawn.card.symbol;

            return `
                <div class="meaning-card">
                    <div class="meaning-header">
                        ${this.mode !== 'single' ? `<span class="meaning-label">${labels[i]}</span>` : ''}
                        <span class="meaning-symbol">${visual}</span>
                        <span class="meaning-name">${drawn.card.name}</span>
                        <span class="meaning-position ${drawn.isReversed ? 'reversed' : 'upright'}">
                            ${drawn.isReversed ? '逆位' : '正位'}
                        </span>
                    </div>
                    <div class="meaning-keywords">
                        ${meaning.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
                    </div>
                    <div class="meaning-description">${meaning.desc}</div>
                </div>
            `;
        }).join('');

        this.switchScreen(this.resultScreen);

        // Inject Floating CTA Button
        // Inject Floating CTA Button
        const existingBtn = document.querySelector('.floating-cta');
        if (existingBtn) existingBtn.remove();

        // Load Config
        const siteConfig = JSON.parse(localStorage.getItem('siteConfig')) || {};
        const targetUrl = siteConfig.lineUrl || "https://line.me/";

        const ctaContainer = document.createElement('div');
        ctaContainer.className = 'floating-cta';
        ctaContainer.innerHTML = `
            <button class="line-floating-btn" onclick="window.open('${targetUrl}', '_blank')">
                <span class="line-icon">💬</span>
                <span class="line-text">詢問老師</span>
            </button>
        `;
        document.body.appendChild(ctaContainer);

        // Padding is now handled by CSS .result-content { padding-bottom: 140px !important; }
    }

    showLoading(show) {
        this.loadingOverlay.classList.toggle('active', show);
    }

    async saveImage() {
        this.showLoading(true);

        try {
            // Wait for fonts
            await document.fonts.ready;

            // Apply Snapshot Mode (text-only, full height)
            this.resultContent.classList.add('snapshot-mode');

            // Wait for layout update
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(this.resultContent, {
                backgroundColor: '#0a0a1a',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: this.resultContent.scrollWidth,
                windowHeight: this.resultContent.scrollHeight
            });

            // Remove Snapshot Mode
            this.resultContent.classList.remove('snapshot-mode');

            // Use Blob and URL.createObjectURL to download
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `塔羅占卜結果_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    this.showLoading(false);
                } else {
                    throw new Error('Failed to create blob');
                }
            }, 'image/png');
        } catch (error) {
            console.error('Save image failed:', error);
            // Remove Snapshot Mode in case of error
            this.resultContent.classList.remove('snapshot-mode');
            this.showLoading(false);
            // Fallback: copy text
            this.copyTextResult();
        }
    }


    copyTextResult() {
        const text = this.generateShareText();
        navigator.clipboard.writeText(text).then(() => {
            alert('圖片儲存失敗，已將結果複製到剪貼簿！');
        }).catch(() => {
            alert('儲存失敗，請手動截圖保存');
        });
    }

    async shareResult() {
        const text = this.generateShareText();

        // 檢查是否支援 Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '塔羅牌占卜結果',
                    text: text
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // 使用者取消不算錯誤
                    this.copyToClipboard(text);
                }
            }
        } else {
            // 不支援 Web Share API，複製到剪貼簿
            this.copyToClipboard(text);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('已複製結果到剪貼簿！您可以貼上到任何地方分享。');
        }).catch(() => {
            // 備用方案：顯示文字讓使用者手動複製
            prompt('請複製以下內容分享：', text);
        });
    }

    generateShareText() {
        const labels = this.modeLabels[this.mode];
        let text = '🔮 我的塔羅牌占卜結果：\n\n';

        this.drawnCards.forEach((drawn, i) => {
            if (this.mode !== 'single') {
                text += `【${labels[i]}】\n`;
            }
            text += `${drawn.card.symbol} ${drawn.card.name} (${drawn.isReversed ? '逆位' : '正位'})\n`;
            if (this.mode !== 'single') {
                text += '\n';
            }
        });

        text += '\n✨ 來自「塔羅牌占卜」App';
        text += '\n🔗 https://kamiyu94.github.io/fortune-teller/';
        return text;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TarotApp();
});

// ========================================
// STANDALONE DEBUG MODE - Mock 5-Card Spread
// Places the debug card in position 3 (center) with 4 random placeholders
// ========================================
window.addEventListener('load', function () {
    const params = new URLSearchParams(window.location.search);
    const debugId = params.get('debug_card');

    if (debugId !== null) {
        console.log("🔍 Debug Mode Active for Card ID:", debugId);

        // 1. Force Screen Switch
        const homeScreen = document.getElementById('homeScreen');
        const drawScreen = document.getElementById('drawScreen');
        const resultScreen = document.getElementById('resultScreen');

        if (homeScreen) homeScreen.classList.remove('active');
        if (drawScreen) drawScreen.classList.remove('active');
        if (resultScreen) resultScreen.classList.add('active');

        // 2. Find the Debug Card
        const debugCard = TAROT_CARDS.find(c => c.id == parseInt(debugId));

        if (debugCard) {
            console.log("Found debug card:", debugCard.name);

            // 3. Create Mock 5-Card Array
            // Position 3 (index 2) = debug card, others = random placeholders
            const usedIds = [debugCard.id];
            const getRandomCard = () => {
                const available = TAROT_CARDS.filter(c => !usedIds.includes(c.id));
                const card = available[Math.floor(Math.random() * available.length)];
                usedIds.push(card.id);
                return card;
            };

            const mockSpread = [
                { card: getRandomCard(), isReversed: false },
                { card: getRandomCard(), isReversed: false },
                { card: debugCard, isReversed: false },        // DEBUG CARD at position 3
                { card: getRandomCard(), isReversed: false },
                { card: getRandomCard(), isReversed: false }
            ];

            // 4. Define 5-card spread labels
            const labels = ['問題現況', '外在影響', '🔍 預覽', '解決建議', '全能洞見'];

            // 5. Render Result Cards (same format as real game)
            const resultCards = document.getElementById('resultCards');
            if (resultCards) {
                resultCards.innerHTML = mockSpread.map((drawn, i) => {
                    const isDebugCard = i === 2;
                    const visual = drawn.card.image
                        ? `<img src="${drawn.card.image}" class="tarot-img result-img" alt="${drawn.card.name}">`
                        : `<span>${drawn.card.symbol || '🎴'}</span>`;

                    return `
                    <div class="result-card ${drawn.isReversed ? 'reversed' : ''}" ${isDebugCard ? 'style="border-color: #e91e63; box-shadow: 0 0 15px rgba(233, 30, 99, 0.5);"' : ''}>
                        <div class="card-label">${labels[i]}</div>
                        <div class="card-symbol ${drawn.isReversed ? 'is-reversed' : ''}">${visual}</div>
                        <div class="card-name">${drawn.card.name}</div>
                    </div>`;
                }).join('');
            }

            // 6. Update Page Title
            const resultTitle = document.querySelector('.result-title');
            if (resultTitle) {
                resultTitle.textContent = '🔍 五牌陣預覽 - ' + debugCard.name;
            }

            // 7. Hide Meanings Section
            const resultMeanings = document.getElementById('resultMeanings');
            if (resultMeanings) {
                resultMeanings.style.display = 'none';
            }

            // 8. Update Action Buttons
            const redrawBtn = document.getElementById('redrawBtn');
            if (redrawBtn) {
                redrawBtn.textContent = '🔄 重新預覽';
                redrawBtn.onclick = function () {
                    window.location.reload();
                };
            }
        } else {
            console.error("Card not found for ID:", debugId);
        }
    }
});
