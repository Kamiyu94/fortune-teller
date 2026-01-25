document.addEventListener('DOMContentLoaded', () => {
    // Current working data copy
    // We keep original copy to track changes
    const originalCardsData = JSON.parse(JSON.stringify(TAROT_CARDS));
    let cardsData = JSON.parse(JSON.stringify(TAROT_CARDS));
    let currentCardId = null;
    let pendingUploads = new Map(); // Stores File objects: id -> File

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

    // Image Upload Modal Elements
    const imageUploadModal = document.getElementById('imageUploadModal');
    const modalInputImage = document.getElementById('modalInputImage');
    const modalInputSymbol = document.getElementById('modalInputSymbol');
    const confirmImageBtn = document.getElementById('confirmImageBtn');
    const cancelImageBtn = document.getElementById('cancelImageBtn');

    // GitHub Config Elements
    const adminTitle = document.getElementById('adminTitle');
    const configModal = document.getElementById('configModal');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const closeConfigBtn = document.getElementById('closeConfigBtn');
    const saveCloudBtn = document.getElementById('saveCloudBtn');
    const cloudSeparator = document.getElementById('cloudSeparator');
    const shareConfigBtn = document.getElementById('shareConfigBtn');

    // Config Inputs
    const githubToken = document.getElementById('githubToken');
    const githubUser = document.getElementById('githubUser');
    const githubRepo = document.getElementById('githubRepo');

    // Form inputs
    const inputs = {
        name: document.getElementById('inputName'),
        nameEn: document.getElementById('inputNameEn'),
        uprightKeywords: document.getElementById('inputUprightKeywords'),
        uprightDesc: document.getElementById('inputUprightDesc'),
        reversedKeywords: document.getElementById('inputReversedKeywords'),
        reversedDesc: document.getElementById('inputReversedDesc'),
    };

    const imagePreviewBox = {
        container: document.getElementById('imagePreviewBox'),
        emoji: document.getElementById('editSymbolDisplay'),
        img: document.getElementById('editImageDisplay')
    };

    // Initialize list
    renderCards(cardsData);
    // Load saved config
    loadConfig();

    // Event Listeners
    searchInput.addEventListener('input', (e) => renderCards(cardsData, e.target.value));

    // Handle form save
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCurrentCard();
    });

    // Image Modal Trigger
    imagePreviewBox.container.addEventListener('click', openImageModal);

    // Image Modal Actions
    cancelImageBtn.addEventListener('click', () => imageUploadModal.classList.add('hidden'));
    confirmImageBtn.addEventListener('click', handleModalConfirm);

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
    shareConfigBtn.addEventListener('click', generateShareLink);

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

    function renderCards(data, filter = '') {
        const scrollTop = cardList.scrollTop;
        cardList.innerHTML = '';
        data.forEach(card => {
            if (filter && !card.name.includes(filter) && !card.nameEn.toLowerCase().includes(filter.toLowerCase())) {
                return;
            }
            const el = document.createElement('div');
            el.className = `card-item ${currentCardId === card.id ? 'active' : ''}`;

            // Check for pending upload preview or existing image or symbol
            let visual = card.itemImageDisplay || (card.image ? `<img src="${card.image}" style="width:24px;height:36px;object-fit:cover;">` : (card.symbol || '🎴'));

            el.innerHTML = `
                <div class="item-symbol">${visual}</div>
                <div class="item-info">
                    <span class="item-name">${card.name}</span>
                    <span class="item-name-en">${card.nameEn}</span>
                </div>
            `;
            el.addEventListener('click', () => selectCard(card.id));
            cardList.appendChild(el);
        });
        cardList.scrollTop = scrollTop;
    }

    function selectCard(id) {
        currentCardId = id;
        const card = cardsData.find(c => c.id === id);
        if (!card) return;

        renderCards(cardsData, searchInput.value); // Highlight active
        editForm.classList.remove('hidden');
        document.querySelector('.empty-state').style.display = 'none';

        // Populate form
        document.getElementById('editCardName').textContent = card.name;
        document.getElementById('editCardId').textContent = `ID: ${card.id}`;

        // Show Image or Symbol in Preview Box
        if (pendingUploads.has(id)) {
            // Show pending image
            const file = pendingUploads.get(id);
            const url = URL.createObjectURL(file);
            showPreviewImage(url);
        } else if (card.image) {
            showPreviewImage(card.image);
        } else {
            showPreviewSymbol(card.symbol || '🎴');
        }

        inputs.name.value = card.name;
        inputs.nameEn.value = card.nameEn;
        inputs.uprightKeywords.value = card.upright.keywords.join('、');
        inputs.uprightDesc.value = card.upright.desc;
        inputs.reversedKeywords.value = card.reversed.keywords.join('、');
        inputs.reversedDesc.value = card.reversed.desc;

        editPanel.scrollTop = 0;
    }

    // --- Image Modal Logic ---

    function openImageModal() {
        if (currentCardId === null) return;

        // Reset Modal Inputs
        modalInputImage.value = '';
        modalInputSymbol.value = '';

        // Populate Symbol Input if currently using symbol
        const card = cardsData.find(c => c.id === currentCardId);
        if (card && !card.image && !pendingUploads.has(currentCardId)) {
            modalInputSymbol.value = card.symbol || '';
        }

        imageUploadModal.classList.remove('hidden');
    }

    function handleModalConfirm() {
        // 1. Check for Image File
        if (modalInputImage.files && modalInputImage.files[0]) {
            const file = modalInputImage.files[0];
            const url = URL.createObjectURL(file);

            showPreviewImage(url);
            pendingUploads.set(currentCardId, file);

            // Update list visual
            const card = cardsData.find(c => c.id === currentCardId);
            if (card) {
                card.itemImageDisplay = `<img src="${url}" style="width:24px;height:36px;object-fit:cover;">`;
                renderCards(cardsData, searchInput.value);
            }

            // Auto save triggers
            saveCurrentCard();
            imageUploadModal.classList.add('hidden');
            return;
        }

        // 2. Check for Emoji/Symbol
        if (modalInputSymbol.value.trim()) {
            const symbol = modalInputSymbol.value.trim();
            showPreviewSymbol(symbol);

            // Clear any pending image upload if switching back to symbol
            if (pendingUploads.has(currentCardId)) {
                pendingUploads.delete(currentCardId);
                const card = cardsData.find(c => c.id === currentCardId);
                if (card) {
                    delete card.itemImageDisplay;
                }
            }

            // Update local data specifically for symbol (as it's field data, not file)
            const cardIndex = cardsData.findIndex(c => c.id === currentCardId);
            if (cardIndex !== -1) {
                cardsData[cardIndex].symbol = symbol;
                // If it had an image property, we might want to unset it mentally, 
                // but strictly speaking we only delete it if we upload a new config. 
                // For now, let's keep it simple: Symbol update overrides image display locally.
                // But cloud sync logic might need to know "Delete Image"? 
                // Complexity: If user wants to revert to Emoji, we should probably nullify 'image' 
                // in data.
                delete cardsData[cardIndex].image; // Tentatively remove image reference
            }

            renderCards(cardsData, searchInput.value);
            saveCurrentCard();
            imageUploadModal.classList.add('hidden');
            return;
        }

        // If nothing entered
        // Just Update Symbol if it was cleared? Or do nothing?
        // Let's assume cancel if nothing change.
        imageUploadModal.classList.add('hidden');
    }

    function showPreviewImage(src) {
        // CRITICAL: Clear container first to prevent ghosting
        const container = imagePreviewBox.container;
        container.innerHTML = `<img src="${src}" class="preview-img" alt="Card Image">`;
    }

    function showPreviewSymbol(char) {
        // CRITICAL: Clear container first to prevent ghosting
        const container = imagePreviewBox.container;
        container.innerHTML = `<span class="placeholder-emoji">${char}</span>`;
    }

    function saveCurrentCard() {
        if (currentCardId === null) return;
        const cardIndex = cardsData.findIndex(c => c.id === currentCardId);
        if (cardIndex === -1) return;

        const splitKw = (str) => str.split(/[、,，]+/).map(k => k.trim()).filter(k => k);

        // Note: We don't overwrite symbol/image here directly from main inputs anymore
        // because they are handled via modal.
        // We only update text fields.

        cardsData[cardIndex] = {
            ...cardsData[cardIndex],
            name: inputs.name.value,
            nameEn: inputs.nameEn.value,
            // symbol: preserved from handleModalConfirm or existing
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
        renderCards(cardsData, searchInput.value);

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
            const hasPendingImage = pendingUploads.has(card.id);

            // Check content diff OR pending image
            if (JSON.stringify(card) !== JSON.stringify(original) || hasPendingImage) {
                const diffs = [];
                if (hasPendingImage) diffs.push('圖片更新');
                if (card.name !== original.name) diffs.push('名稱');
                if (card.symbol !== original.symbol) diffs.push('圖示');
                if (card.image !== original.image) diffs.push('圖片連結變更'); // Detect reverted image
                if (JSON.stringify(card.upright) !== JSON.stringify(original.upright)) diffs.push('正位解釋');
                if (JSON.stringify(card.reversed) !== JSON.stringify(original.reversed)) diffs.push('逆位解釋');

                changes.push({
                    card: card,
                    diffs: diffs,
                    hasImage: hasPendingImage
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

        const originalText = confirmUploadBtn.textContent;
        confirmUploadBtn.textContent = '⏳ 寫入中...';
        confirmUploadBtn.disabled = true;

        // Build the final dataset based on selection
        const finalData = JSON.parse(JSON.stringify(originalCardsData));

        try {
            // Process uploads for checked items
            for (const cb of checkboxes) {
                const id = parseInt(cb.dataset.id);
                const modifiedCard = cardsData.find(c => c.id === id);
                let finalCard = { ...modifiedCard };

                // 1. Upload Image If Exists
                if (pendingUploads.has(id)) {
                    confirmUploadBtn.textContent = `⏳ 上傳圖片 (ID:${id})...`;
                    const file = pendingUploads.get(id);
                    const ext = file.name.split('.').pop();
                    const fileName = `card_${id}.${ext}`;
                    const filePath = `images/cards/${fileName}`;

                    // Upload file to GitHub
                    await uploadFileToGitHub(config, filePath, file);

                    // Update card image path
                    finalCard.image = filePath;

                    // Clear pending
                    pendingUploads.delete(id);
                }

                // Update final data
                const index = finalData.findIndex(c => c.id === id);
                if (index !== -1) {
                    // Remove temporary display prop
                    delete finalCard.itemImageDisplay;
                    finalData[index] = finalCard;
                }
            }

            confirmUploadBtn.textContent = '⏳ 更新資料庫...';

            // 2. Upload tarot-data.js
            const content = `// 塔羅牌資料庫 - 78張完整塔羅牌（含圖示）
const TAROT_CARDS = ${JSON.stringify(finalData, null, 2)};
`;
            await uploadFileToGitHub(config, 'js/tarot-data.js', content, true);

            reviewModal.classList.add('hidden');
            alert('🎉 更新成功！\nGitHub Pages 將在幾分鐘後自動部署新內容。\n\n您可以使用「🔍 檢查資料」按鈕來確認檔案內容。');

            // Reload page
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert(`錯誤: ${error.message}`);
        } finally {
            confirmUploadBtn.textContent = originalText;
            confirmUploadBtn.disabled = false;
        }
    }

    async function uploadFileToGitHub(config, path, content, isString = false) {
        const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${path}`;

        // Check if exists to get SHA
        let sha = null;
        try {
            const resp = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (resp.ok) {
                const json = await resp.json();
                sha = json.sha;
            }
        } catch (e) { /* ignore */ }

        // Prepare content
        let base64Content;
        if (isString) {
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            base64Content = btoa(String.fromCharCode(...new Uint8Array(data)));
        } else {
            // Convert File to Base64
            base64Content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(content);
            });
        }

        // PUT request
        const putResp = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Update ${path} via Admin Panel`,
                content: base64Content,
                sha: sha
            })
        });

        if (!putResp.ok) {
            const err = await putResp.json();
            throw new Error(`上傳失敗 (${path}): ${err.message}`);
        }
    }

    // --- Settings Functions ---

    function loadConfig() {
        // Check for magic link import via Hash (#auth=...)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#auth=')) {
            const b64 = hash.substring(6); // remove #auth=
            try {
                const json = atob(b64);
                const config = JSON.parse(json);
                localStorage.setItem('tarot_github_config', JSON.stringify(config));

                // Clean URL (Remove hash immediately)
                history.replaceState(null, null, window.location.pathname);

                alert('✅ 設定已成功匯入！\n您現在可以開始管理後台資料了。');
            } catch (e) {
                console.error(e);
                alert('❌ 設定連結無效或已損毀');
            }
        }

        const config = JSON.parse(localStorage.getItem('tarot_github_config'));
        if (config) {
            githubToken.value = config.token;
            githubUser.value = config.user;
            githubRepo.value = config.repo;
            updateCloudButtonVisibility();
        }
    }

    function generateShareLink() {
        const config = {
            token: githubToken.value.trim(),
            user: githubUser.value.trim(),
            repo: githubRepo.value.trim()
        };

        if (!config.token || !config.user || !config.repo) {
            alert('請先填寫完整設定並儲存，才能產生分享連結。');
            return;
        }

        const json = JSON.stringify(config);
        const b64 = btoa(json);
        // Use Hash (#) instead of Query (?) for security
        // Hash values are not sent to the server
        const url = `${window.location.origin}${window.location.pathname}#auth=${b64}`;

        navigator.clipboard.writeText(url).then(() => {
            alert('🔗 安全連結已複製！\n\n此連結使用 Hash 加密傳遞，\n確保 Token 不會留存在伺服器紀錄中。');
        }).catch(() => {
            alert('複製失敗，請手動複製網址：\n' + url);
        });
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
