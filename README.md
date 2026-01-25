# 🔮 塔羅牌占卜 PWA

一個精美的塔羅牌占卜 Progressive Web App，支援離線使用並可安裝到手機主畫面。

## ✨ 功能特色

- 🎴 **完整 78 張塔羅牌** - 22 張大阿爾克那 + 56 張小阿爾克那
- ⬆️⬇️ **正逆位解讀** - 每張牌包含正位與逆位的詳細解釋
- 🎯 **兩種抽牌模式** - 單張抽牌 / 三張牌陣（過去・現在・未來）
- 🌙 **精美介面** - 神秘深色星空主題 + 流暢翻牌動畫
- 📥 **儲存與分享** - 可截圖儲存或分享到社群媒體
- 📱 **PWA 支援** - 可安裝到 Android/iOS 主畫面，支援離線使用
- 🌏 **繁體中文** - 全繁體中文介面與牌義解說

## 🚀 線上體驗

👉 [點擊這裡開始占卜](https://你的用戶名.github.io/tarot-pwa/)

## 📱 安裝到手機

### Android
1. 用 Chrome 開啟網頁
2. 點擊瀏覽器選單 (⋮)
3. 選擇「新增至主畫面」或「安裝應用程式」

### iOS
1. 用 Safari 開啟網頁
2. 點擊分享按鈕
3. 選擇「加入主畫面」

## 🛠️ 本機開發

```bash
# 複製專案
git clone https://github.com/你的用戶名/tarot-pwa.git
cd tarot-pwa

# 啟動本機伺服器
python -m http.server 8080

# 開啟瀏覽器
# http://localhost:8080
```

## 📁 專案結構

```
tarot-pwa/
├── index.html          # 主頁面
├── manifest.json       # PWA 設定
├── sw.js              # Service Worker
├── css/
│   └── style.css      # 樣式表
├── js/
│   ├── app.js         # 應用程式邏輯
│   └── tarot-data.js  # 78張塔羅牌資料
└── icons/
    ├── icon-192.svg   # 小圖示
    └── icon-512.svg   # 大圖示
```

## 📄 授權

MIT License
