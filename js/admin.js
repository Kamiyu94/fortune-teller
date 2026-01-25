document.addEventListener('DOMContentLoaded', () => {
    // Current working data copy
    let cardsData = JSON.parse(JSON.stringify(TAROT_CARDS));
    let currentCardId = null;

    // Elements
    const cardList = document.getElementById('cardList');
    const searchInput = document.getElementById('searchInput');
    const editPanel = document.getElementById('editPanel');
    const editForm = document.getElementById('editForm');
    const exportBtn = document.getElementById('exportBtn');

    // Form inputs
    const inputs = {
        symbol: document.getElementById('inputSymbol'),
        name: document.getElementById('inputName'),
        nameEn: document.getElementById('inputNameEn'),
        uprightKeywords: document.getElementById('inputUprightKeywords'),
        uprightDesc: document.getElementById('inputUprightDesc'),
        reversedKeywords: document.getElementById('inputReversedKeywords'),
        reversedDesc: document.getElementById('inputReversedDesc'),
    };

    // Initialize list
    renderCardList();

    // Event Listeners
    searchInput.addEventListener('input', (e) => renderCardList(e.target.value));

    // Handle form save
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCurrentCard();
    });

    // Handle Export
    exportBtn.addEventListener('click', exportData);

    // Functions
    function renderCardList(filter = '') {
        cardList.innerHTML = '';

        cardsData.forEach(card => {
            if (filter && !card.name.includes(filter) && !card.nameEn.toLowerCase().includes(filter.toLowerCase())) {
                return;
            }

            const el = document.createElement('div');
            el.className = `card-item ${currentCardId === card.id ? 'active' : ''}`;
            el.innerHTML = `
                <div class="item-symbol">${card.symbol || '🎴'}</div>
                <div class="item-info">
                    <span class="item-name">${card.name}</span>
                    <span class="item-name-en">${card.nameEn}</span>
                </div>
            `;
            el.addEventListener('click', () => selectCard(card.id));
            cardList.appendChild(el);
        });
    }

    function selectCard(id) {
        currentCardId = id;
        const card = cardsData.find(c => c.id === id);
        if (!card) return;

        // Update list highlight
        renderCardList(searchInput.value);

        // Show form
        editForm.classList.remove('hidden');
        document.querySelector('.empty-state').style.display = 'none';

        // Populate fields
        document.getElementById('editCardName').textContent = card.name;
        document.getElementById('editSymbolDisplay').textContent = card.symbol || '🎴';
        document.getElementById('editCardId').textContent = `ID: ${card.id}`;

        inputs.symbol.value = card.symbol || '';
        inputs.name.value = card.name;
        inputs.nameEn.value = card.nameEn;
        inputs.uprightKeywords.value = card.upright.keywords.join('、');
        inputs.uprightDesc.value = card.upright.desc;
        inputs.reversedKeywords.value = card.reversed.keywords.join('、');
        inputs.reversedDesc.value = card.reversed.desc;

        // Reset scroll
        editPanel.scrollTop = 0;
    }

    function saveCurrentCard() {
        if (currentCardId === null) return;

        const cardIndex = cardsData.findIndex(c => c.id === currentCardId);
        if (cardIndex === -1) return;

        // Split keywords by comma or pause mark
        const splitKw = (str) => str.split(/[、,，]+/).map(k => k.trim()).filter(k => k);

        // Update data
        cardsData[cardIndex] = {
            ...cardsData[cardIndex],
            name: inputs.name.value,
            nameEn: inputs.nameEn.value,
            symbol: inputs.symbol.value,
            upright: {
                keywords: splitKw(inputs.uprightKeywords.value),
                desc: inputs.uprightDesc.value
            },
            reversed: {
                keywords: splitKw(inputs.reversedKeywords.value),
                desc: inputs.reversedDesc.value
            }
        };

        // Update UI
        document.getElementById('editCardName').textContent = cardsData[cardIndex].name;
        document.getElementById('editSymbolDisplay').textContent = cardsData[cardIndex].symbol;
        renderCardList(searchInput.value); // Update list to reflect name changes

        // Show feedback using a simple color flash on the button
        const btn = document.querySelector('.btn-save');
        const originalText = btn.textContent;
        btn.textContent = '✅ 已更新 (記住匯出)';
        btn.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }

    function exportData() {
        // Generate file content
        const fileContent = `// 塔羅牌資料庫 - 78張完整塔羅牌（含圖示）
const TAROT_CARDS = ${JSON.stringify(cardsData, null, 2)};
`;

        // Create blob and download link
        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'tarot-data.js';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('檔案「tarot-data.js」已開始下載！\n\n請將下載的檔案覆蓋專案目錄中的 js/tarot-data.js，然後提交到 GitHub。');
    }
});
