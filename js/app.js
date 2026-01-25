// 塔羅牌占卜 App - 主程式

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
        cardFront.querySelector('.card-symbol').textContent = drawnCard.card.symbol;
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
        this.resultCards.innerHTML = this.drawnCards.map((drawn, i) => `
            <div class="result-card ${drawn.isReversed ? 'reversed' : ''}">
                ${this.mode !== 'single' ? `<div class="card-label">${labels[i]}</div>` : ''}
                <div class="card-symbol">${drawn.card.symbol}</div>
                <div class="card-name">${drawn.card.name}</div>
            </div>
        `).join('');

        // Generate meanings HTML
        this.resultMeanings.innerHTML = this.drawnCards.map((drawn, i) => {
            const meaning = drawn.isReversed ? drawn.card.reversed : drawn.card.upright;
            return `
                <div class="meaning-card">
                    <div class="meaning-header">
                        ${this.mode !== 'single' ? `<span class="meaning-label">${labels[i]}</span>` : ''}
                        <span class="meaning-symbol">${drawn.card.symbol}</span>
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
    }

    showLoading(show) {
        this.loadingOverlay.classList.toggle('active', show);
    }

    async saveImage() {
        this.showLoading(true);

        try {
            // 等待字體載入
            await document.fonts.ready;

            const canvas = await html2canvas(this.resultContent, {
                backgroundColor: '#0a0a1a',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            // 使用 Blob 和 URL.createObjectURL 來下載
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
            this.showLoading(false);
            // 備用方案：複製文字到剪貼簿
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
