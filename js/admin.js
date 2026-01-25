document.addEventListener('DOMContentLoaded', () => {
    // Current working data copy
    // We keep original copy to track changes
    const originalCardsData = JSON.parse(JSON.stringify(TAROT_CARDS));
    let cardsData = JSON.parse(JSON.stringify(TAROT_CARDS));
    let currentCardId = null;

    // Elements
    const cardList = document.getElementById('cardList');
    const searchInput = document.getElementById('searchInput');
    const editPanel = document.getElementById('editPanel');
    const editForm = document.getElementById('editForm');
    const exportBtn = document.getElementById('exportBtn');

    // Review Modal Elements
    const reviewModal = document.getElementById('reviewModal');
    const reviewList = document.getElementById('reviewList');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const changeCountLabel = document.getElementById('changeCount');

    // GitHub Config Elements
    const adminTitle = document.getElementById('adminTitle');
    const configModal = document.getElementById('configModal');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const closeConfigBtn = document.getElementById('closeConfigBtn');
    const saveCloudBtn = document.getElementById('saveCloudBtn');
    const cloudSeparator = document.getElementById('cloudSeparator');

    // Config Inputs
    const githubToken = document.getElementById('githubToken');
    const githubUser = document.getElementById('githubUser');
    const githubRepo = document.getElementById('githubRepo');

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
    // Load saved config
    loadConfig();

    // Event Listeners
    searchInput.addEventListener('input', (e) => renderCardList(e.target.value));

    // Handle form save
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCurrentCard();
    });

    // Handle Export
    exportBtn.addEventListener('click', exportData);

    // Config Listeners
    let titleClickCount = 0;
    let titleClickTimer = null;

    adminTitle.addEventListener('click', () => {
        titleClickCount++;
        if (titleClickTimer) clearTimeout(titleClickTimer);
        titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 800);
        if (titleClickCount >= 3) {
            configModal.classList.remove('hidden');
            titleClickCount = 0;
        }
    });

    closeConfigBtn.addEventListener('click', () => configModal.classList.add('hidden'));
    saveConfigBtn.addEventListener('click', saveConfig);

    // Cloud Upload Flow
    saveCloudBtn.addEventListener('click', initiateCloudUpload);
    cancelUploadBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));
    confirmUploadBtn.addEventListener('click', executeCloudUpload);
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = reviewList.querySelectorAll('.change-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });

    // Initial check
    updateCloudButtonVisibility();

    // --- Core Functions ---

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

        renderCardList(searchInput.value); // Highlight active
        editForm.classList.remove('hidden');
        document.querySelector('.empty-state').style.display = 'none';

        // Populate form
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

        editPanel.scrollTop = 0;
    }

    function saveCurrentCard() {
        if (currentCardId === null) return;
        const cardIndex = cardsData.findIndex(c => c.id === currentCardId);
        if (cardIndex === -1) return;

        const splitKw = (str) => str.split(/[、,，]+/).map(k => k.trim()).filter(k => k);

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

        // UI Updates
        document.getElementById('editCardName').textContent = cardsData[cardIndex].name;
        document.getElementById('editSymbolDisplay').textContent = cardsData[cardIndex].symbol;
        renderCardList(searchInput.value);

        const btn = document.querySelector('.btn-save');
        const originalText = btn.textContent;
        btn.textContent = '✅ 已暫存 (請寫入雲端)';
        btn.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }

    // --- Cloud Upload & Review Logic ---

    function getChangedCards() {
        const changes = [];
        cardsData.forEach((card, index) => {
            const original = originalCardsData[index];
            if (JSON.stringify(card) !== JSON.stringify(original)) {
                // Determine what changed
                const diffs = [];
                if (card.name !== original.name) diffs.push('名稱');
                if (card.symbol !== original.symbol) diffs.push('圖示');
                if (JSON.stringify(card.upright) !== JSON.stringify(original.upright)) diffs.push('正位解釋');
                if (JSON.stringify(card.reversed) !== JSON.stringify(original.reversed)) diffs.push('逆位解釋');

                changes.push({
                    card: card,
                    diffs: diffs
                });
            }
        });
        return changes;
    }

    function initiateCloudUpload() {
        // Auto-save currently editing form
        if (!editForm.classList.contains('hidden')) {
            saveCurrentCard();
        }

        const changes = getChangedCards();
        if (changes.length === 0) {
            alert('⚠️ 目前沒有任何修改內容，無需寫入。');
            return;
        }

        // Populate Review Modal
        reviewList.innerHTML = '';
        changeCountLabel.textContent = `共 ${changes.length} 項修改`;

        changes.forEach(item => {
            const el = document.createElement('div');
            el.className = 'review-item';
            el.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="change-checkbox" data-id="${item.card.id}" checked>
                </div>
                <div class="review-item-info">
                    <div class="review-item-title">${item.card.symbol || ''} ${item.card.name}</div>
                    <div class="review-item-changes">
                        修改項目：${item.diffs.map(d => `<span class="change-tag">${d}</span>`).join('')}
                    </div>
                </div>
            `;
            reviewList.appendChild(el);
        });

        selectAllCheckbox.checked = true;
        reviewModal.classList.remove('hidden');
    }

    async function executeCloudUpload() {
        const config = JSON.parse(localStorage.getItem('tarot_github_config'));
        if (!config) return;

        const checkboxes = reviewList.querySelectorAll('.change-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('請至少勾選一項修改');
            return;
        }

        // Build the final dataset based on selection
        // Start with original data
        const finalData = JSON.parse(JSON.stringify(originalCardsData));

        // Apply checked changes
        checkboxes.forEach(cb => {
            const id = parseInt(cb.dataset.id);
            const modifiedCard = cardsData.find(c => c.id === id);
            const index = finalData.findIndex(c => c.id === id);
            if (index !== -1 && modifiedCard) {
                finalData[index] = modifiedCard;
            }
        });

        const originalText = confirmUploadBtn.textContent;
        confirmUploadBtn.textContent = '⏳ 寫入中...';
        confirmUploadBtn.disabled = true;

        try {
            // Generate Content
            const content = `// 塔羅牌資料庫 - 78張完整塔羅牌（含圖示）
const TAROT_CARDS = ${JSON.stringify(finalData, null, 2)};
`;
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const base64Content = btoa(String.fromCharCode(...new Uint8Array(data)));

            // API Calls
            const path = 'js/tarot-data.js';
            const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${path}`;

            const getResponse = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!getResponse.ok) throw new Error('無法取得檔案資訊 (檢查 Token 或 Repo 名稱)');
            const fileData = await getResponse.json();

            const putResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update tarot data via Admin Panel (${new Date().toLocaleDateString()})`,
                    content: base64Content,
                    sha: fileData.sha
                })
            });

            if (!putResponse.ok) throw new Error('更新失敗');

            reviewModal.classList.add('hidden');
            alert('🎉 更新成功！\nGitHub Pages 將在幾分鐘後自動部署新內容。\n\n您可以使用「🔍 檢查資料」按鈕來確認檔案內容。');

            // Ideally update originalCardsData to reflect the new committed state
            // So subsequent diffs are accurate
            // Update originalCardsData ONLY for the committed cards
            checkboxes.forEach(cb => {
                const id = parseInt(cb.dataset.id);
                const modifiedCard = cardsData.find(c => c.id === id);
                const index = originalCardsData.findIndex(c => c.id === id);
                if (index !== -1) {
                    originalCardsData[index] = JSON.parse(JSON.stringify(modifiedCard));
                }
            });

        } catch (error) {
            console.error(error);
            alert(`錯誤: ${error.message}`);
        } finally {
            confirmUploadBtn.textContent = originalText;
            confirmUploadBtn.disabled = false;
        }
    }

    // --- Settings Functions ---

    function loadConfig() {
        const config = JSON.parse(localStorage.getItem('tarot_github_config'));
        if (config) {
            githubToken.value = config.token;
            githubUser.value = config.user;
            githubRepo.value = config.repo;
            updateCloudButtonVisibility();
        }
    }

    function saveConfig() {
        const config = {
            token: githubToken.value.trim(),
            user: githubUser.value.trim(),
            repo: githubRepo.value.trim()
        };

        if (!config.token || !config.user || !config.repo) {
            alert('請填寫所有欄位');
            return;
        }

        localStorage.setItem('tarot_github_config', JSON.stringify(config));
        configModal.classList.add('hidden');
        updateCloudButtonVisibility();
        alert('設定已儲存！');
    }

    function updateCloudButtonVisibility() {
        const config = JSON.parse(localStorage.getItem('tarot_github_config'));
        if (config && config.token) {
            saveCloudBtn.style.display = 'block';
            cloudSeparator.style.display = 'block';
        } else {
            saveCloudBtn.style.display = 'none';
            cloudSeparator.style.display = 'none';
        }
    }

    function exportData() {
        // Build final data same as upload (or just dump all current local changes? Usually download means dump local state)
        // Let's dump cardsData (current view)
        const fileContent = `// 塔羅牌資料庫 - 78張完整塔羅牌（含圖示）
const TAROT_CARDS = ${JSON.stringify(cardsData, null, 2)};
`;
        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tarot-data.js';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
