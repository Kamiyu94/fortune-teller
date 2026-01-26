// Â°îÁ??åÂ???App - ‰∏ªÁ?Âº?
const TEACHER_LINE_URL = "https://line.me/R/ti/p/@nuw5707v";

class TarotApp {
    constructor() {
        this.mode = null; // 'single', 'three', or 'five'
        this.drawnCards = [];
        this.currentDrawIndex = 0;

        // ÂÆöÁæ©?ÑÁ????Ê®ôÁ±§
        this.modeLabels = {
            single: ['?áÂ?'],
            three: ['?éÂéª', '?æÂú®', '?™‰?'],
            five: [
                '?èÈ??æÊ?',
                'Â§ñÂú®ÂΩ±Èüø',
                '?ßÂú®ÂΩ±Èüø',
                'Ëß?±∫Âª∫Ë≠∞',
                '?®ËÉΩÊ¥ûË?'
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
        target.classList.add('active'); window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 50);
    }

    goToHome() {
        this.switchScreen(this.homeScreen);
        this.drawnCards = [];
        this.currentDrawIndex = 0;

        // Remove CTA
        const cta = document.querySelector('.floating-cta');
        if (cta) cta.remove();

        // Clean URL
        if (window.location.hash === '#result') {
            history.replaceState(null, '', ' '); // Remove hash
        }
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
            case 'single': return 'ÈªûÊ??°Á??ΩÁ?';
            case 'three': return '‰æùÂ?ÈªûÊ?‰∏âÂºµ?°Á?';
            case 'five': return '‰æùÂ?ÈªûÊ?‰∫îÂºµ?°Á?';
            default: return 'ÈªûÊ??°Á??ΩÁ?';
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
        this.drawHint.querySelector('span:last-child').textContent = 'ÈªûÊ??°Á??≠Á§∫?ΩÈ?';
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
            symbolEl.textContent = drawnCard.card.symbol || '?é¥';
        }
        cardFront.querySelector('.card-name').textContent = drawnCard.card.name;
        cardFront.querySelector('.card-name-en').textContent = drawnCard.card.nameEn;

        const positionEl = cardFront.querySelector('.card-position');
        positionEl.textContent = drawnCard.isReversed ? '?Ü‰?' : 'Ê≠??';
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
                `?ÑÂâ© ${totalCards - this.currentDrawIndex} ÂºµÁ?`;
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
                            ${drawn.isReversed ? '?Ü‰?' : 'Ê≠??'}
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

        // Push History State
        history.pushState({ page: 'result' }, 'Result', '#result');

        // Inject Floating CTA Button
        // Inject Floating CTA Button
        const existingBtn = document.querySelector('.floating-cta');
        if (existingBtn) existingBtn.remove();

        // Load Config
        const siteConfig = JSON.parse(localStorage.getItem('siteConfig')) || {};
        // ?î• CLIENT SPECIFIC URL (Hardcoded for Demo)
        const DEFAULT_DEMO_URL = "https://line.me/R/ti/p/@nuw5707v";
        const targetUrl = siteConfig.lineUrl || DEFAULT_DEMO_URL;

        const ctaContainer = document.createElement('div');
        ctaContainer.className = 'floating-cta';
        ctaContainer.innerHTML = `
            <button class="line-floating-btn" onclick="window.open('${targetUrl}', '_blank')">
                <span class="line-icon">?í¨</span>
                <span class="line-text">Ë©¢Â??ÅÂ∏´</span>
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
                    link.download = `Â°îÁ??†Â?ÁµêÊ?_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.png`;
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
            alert('?ñÁ??≤Â?Â§±Ê?ÔºåÂ∑≤Â∞áÁ??úË?Ë£ΩÂà∞?™Ë≤ºÁ∞øÔ?');
        }).catch(() => {
            alert('?≤Â?Â§±Ê?ÔºåË??ãÂ??™Â?‰øùÂ?');
        });
    }

    async shareResult() {
        const text = this.generateShareText();

        // Ê™¢Êü•?ØÂê¶?ØÊè¥ Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Â°îÁ??åÂ??úÁ???,
                    text: text
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // ‰ΩøÁî®?ÖÂ?Ê∂à‰?ÁÆóÈåØË™?
                    this.copyToClipboard(text);
                }
            }
        } else {
            // ‰∏çÊîØ??Web Share APIÔºåË?Ë£ΩÂà∞?™Ë≤ºÁ∞?
            this.copyToClipboard(text);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Â∑≤Ë?Ë£ΩÁ??úÂà∞?™Ë≤ºÁ∞øÔ??®ÂèØ‰ª•Ë≤º‰∏äÂà∞‰ªª‰??∞Êñπ?Ü‰∫´??);
        }).catch(() => {
            // ?ôÁî®?πÊ?ÔºöÈ°ØÁ§∫Ê?Â≠óË?‰ΩøÁî®?ÖÊ??ïË?Ë£?
            prompt('Ë´ãË?Ë£Ω‰ª•‰∏ãÂÖßÂÆπÂ?‰∫´Ô?', text);
        });
    }

    generateShareText() {
        const labels = this.modeLabels[this.mode];
        let text = '?îÆ ?ëÁ?Â°îÁ??åÂ??úÁ??úÔ?\n\n';

        this.drawnCards.forEach((drawn, i) => {
            if (this.mode !== 'single') {
                text += `??{labels[i]}?ë\n`;
            }
            text += `${drawn.card.symbol} ${drawn.card.name} (${drawn.isReversed ? '?Ü‰?' : 'Ê≠??'})\n`;
            if (this.mode !== 'single') {
                text += '\n';
            }
        });

        text += '\n??‰æÜËá™?åÂ?ÁæÖÁ??†Â??çApp';
        text += '\n?? https://kamiyu94.github.io/fortune-teller/';
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
        console.log("?? Debug Mode Active for Card ID:", debugId);

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
            const labels = ['?èÈ??æÊ?', 'Â§ñÂú®ÂΩ±Èüø', '?? ?êË¶Ω', 'Ëß?±∫Âª∫Ë≠∞', '?®ËÉΩÊ¥ûË?'];

            // 5. Render Result Cards (same format as real game)
            const resultCards = document.getElementById('resultCards');
            if (resultCards) {
                resultCards.innerHTML = mockSpread.map((drawn, i) => {
                    const isDebugCard = i === 2;
                    const visual = drawn.card.image
                        ? `<img src="${drawn.card.image}" class="tarot-img result-img" alt="${drawn.card.name}">`
                        : `<span>${drawn.card.symbol || '?é¥'}</span>`;

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
                resultTitle.textContent = '?? ‰∫îÁ????Ë¶?- ' + debugCard.name;
            }

            // 7. Hide Meanings Section
            const resultMeanings = document.getElementById('resultMeanings');
            if (resultMeanings) {
                resultMeanings.style.display = 'none';
            }

            // 8. Update Action Buttons
            const redrawBtn = document.getElementById('redrawBtn');
            if (redrawBtn) {
                redrawBtn.textContent = '?? ?çÊñ∞?êË¶Ω';
                redrawBtn.onclick = function () {
                    window.location.reload();
                };
            }
        } else {
            console.error("Card not found for ID:", debugId);
        }
    }
});

// Handle Browser Back Button
window.addEventListener('popstate', (event) => {
    // If we are popping back to the initial state (no hash)
    // We need to access the TarotApp instance. Since it's inside a closure/class, 
    // we might need to expose it or reload. simpler: reload if hash is empty.
    // Or better: trigger the back button logic if we are on home.
    
    if (!window.location.hash) {
        // Assume we want to go home if hash is empty
        const homeBtn = document.getElementById('backBtn'); // This is usually on draw screen
        // Ideally we call resetGame. But we don't have global access.
        // Let's reload to be safe and clean, OR find the instance.
        // For this simple app, we can just reload or try to click a back button.
        
        // Hack: Click the result back button if it's visible
        const resultBack = document.getElementById('resultBackBtn');
        if (resultBack && resultBack.offsetParent) {
            resultBack.click();
        } else {
            // Just reload to clear state if confused
             window.location.reload();
        }
    }
});
