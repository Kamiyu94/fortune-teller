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

    // Load saved config
    loadConfig();

    // Event Listeners for Config & Cloud
    let titleClickCount = 0;
    let titleClickTimer = null;

    adminTitle.addEventListener('click', () => {
        titleClickCount++;

        if (titleClickTimer) clearTimeout(titleClickTimer);

        titleClickTimer = setTimeout(() => {
            titleClickCount = 0;
        }, 800);

        if (titleClickCount >= 3) {
            configModal.classList.remove('hidden');
            titleClickCount = 0;
        }
    });

    closeConfigBtn.addEventListener('click', () => configModal.classList.add('hidden'));
    saveConfigBtn.addEventListener('click', saveConfig);
    saveCloudBtn.addEventListener('click', saveToCloud);

    // Initial check
    updateCloudButtonVisibility();

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

    async function saveToCloud() {
        const config = JSON.parse(localStorage.getItem('tarot_github_config'));
        if (!config) return;

        if (!confirm('確定要更新 Git Repository 上的資料嗎？\n這將會覆蓋 js/tarot-data.js 檔案。')) {
            return;
        }

        const originalText = saveCloudBtn.textContent;
        saveCloudBtn.textContent = '⏳ 上傳中...';
        saveCloudBtn.disabled = true;

        try {
            // 1. Generate Content
            const content = `// 塔羅牌資料庫 - 78張完整塔羅牌（含圖示）
const TAROT_CARDS = ${JSON.stringify(cardsData, null, 2)};
`;
            // Encode content to Base64 (handle UTF-8)
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const base64Content = btoa(String.fromCharCode(...new Uint8Array(data)));

            // 2. Get current SHA of the file
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
            const sha = fileData.sha;

            // 3. Update the file
            const putResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update tarot data via Admin Panel (${new Date().toLocaleDateString()})`,
                    content: base64Content, // GitHub API expects Base64 for file content
                    sha: sha
                })
            });

            if (!putResponse.ok) throw new Error('更新失敗');

            alert('🎉 更新成功！\nGitHub Pages 將在幾分鐘後自動部署新內容。');

        } catch (error) {
            console.error(error);
            alert(`錯誤: ${error.message}`);
        } finally {
            saveCloudBtn.textContent = originalText;
            saveCloudBtn.disabled = false;
        }
    }

    function exportData() {
        // ... (Keep existing exportData function)
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
    }
});
