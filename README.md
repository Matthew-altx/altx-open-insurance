# ALTX Open Insurance

免費開源客戶服務工具，React + Vite，可自行部署到 Cloudflare Pages。

## 本機開發與檢查

使用 Node.js 22（`.nvmrc`）及 npm。建置原始碼 ZIP 需要系統 `zip` 指令；macOS 通常已附帶，Ubuntu 可安裝 `zip`，Windows 建議使用 WSL。日常建置不需要 Python、Cloudflare 登入或任何密鑰。

```sh
npm ci
npm run dev
```

交付前檢查：

```sh
npm run format:check
npm run check
```

`check` 會執行測試及建置。輸出為 `dist/`，測試生成的虛構 PDF 位於 `artifacts/`，兩者均不提交。`private: true` 只防止誤發佈到 npm，不影響公開 GitHub 倉庫或 MIT 授權。

## Cloudflare Pages

GitHub Actions 的 Build workflow 只執行格式檢查、測試及建置，不部署、不使用 Cloudflare secrets，也不發佈 GitHub Pages。

如要啟用 Cloudflare 自動部署，另外建立 **Pages Git integration** 項目並連接自己的倉庫：

| 設定 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | 倉庫根目錄（留空） |
| Framework preset | React (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION=22` |

先將 `wrangler.toml` 的 `your-pages-project` 改成自己的 Pages 項目名稱。靜態站沒有 D1、Functions、API keys 或必要的 runtime secrets。`public/_headers` 會隨建置保留安全標頭。連接 Git integration 後，符合分支設定的 push 會觸發 Cloudflare 部署；GitHub 的 Build workflow 並非部署核准關卡。

如採用手動 Direct Upload，先建立自己的 Pages 項目，再於本機執行：

```sh
npx wrangler login
npx wrangler pages project create
npm run check
npm run deploy -- --project-name YOUR_PAGES_PROJECT --branch main
```

以上部署指令需由操作者自行執行。不要將 API token、帳戶設定或 `.wrangler/` 放入倉庫。現有 Direct Upload 項目不能直接轉為 Git integration；如要改用 Git 自動部署，需建立新 Pages 項目。

官方說明：[Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)、[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 公開檔案範圍

`PUBLIC_FILES.json` 是逐檔白名單。`scripts/source.mjs` 只將清單內的普通檔案打包成 `dist/altx-open-insurance-source.zip`，拒絕符號連結及越界路徑。新增公開檔案時，須同步更新清單。

包含應用原始碼、字型及授權、測試、建置腳本、lockfile、公開文件及 CI。私人規劃、交接文件、部署紀錄、客戶資料、環境變數、影片及素材、Git 歷史、依賴與測試產物均不屬公開內容。測試中的姓名、電話及備註為虛構示例。白名單與 `.gitignore` 不能替代提交前人工檢查；不要在公開路徑加入真實客戶資料。

## 功能

- 守護卡：1 位客戶、3 張保單、2 位緊急聯絡人、顧問及選填健康備註。
- 旅遊卡：1 位旅客、行程、保單、手動核對熱線、醫療保額及幣種。
- 提醒：10 位客戶，每人生日及 1 個保單週年；可編輯、刪除及匯出 ICS。
- PDF 以 pdf-lib + fontkit 本機產生，嵌入 Noto CJK 繁中字型，文字可選、自動換行分頁、電話連結。不能顯示的字元會清楚報錯，不靜默遺失內容。
- ICS 為香港 09:00 每年重複事件，含時區、VALARM、UTF-8 折行、穩定隨機 UID 及 SEQUENCE。2 月 29 日採 2 月最後一日規則。
- 只有勾選「記住此裝置」才保存 IndexedDB；無後端、帳戶、付款、雲端寄信或追蹤。取消勾選刪除草稿；每工具可取回原始 JSON。
- 首頁動畫使用 CSS、Web Animations API 及 IntersectionObserver，沒有額外動畫套件。尊重系統 reduced-motion；「減少動畫」開關只保存本機 localStorage 偏好。離屏／背景分頁暫停裝飾動畫，精確指標裝置才啟用卡片傾斜。

## 邊界

此倉庫提供免費開源版，以 Cloudflare Pages 靜態站為部署方式。無 Pro 或雲端功能，亦無伺服器權益設定。產品配額集中在 `src/core.js`，屬可修改的介面限制。未使用內部工具原始碼、Logo 或保險公司素材。

表單內容不上傳，但載入網站會有一般 HTTPS 連線，首次 PDF 按文字需要下載同站字型：常用繁中字型約 2.32 MB，罕用字採用完整字型後備，同一分頁跨工具重用。選字判斷完全在裝置內進行。IndexedDB 不提供額外密碼加密。清除瀏覽器資料可能遺失草稿，下載及分享後的檔案由使用者管理。資料核對日期由使用者輸入，不冒充來源庫核實日期。

日曆檔是快照，無雙向同步；重新匯入可能重複，通知依賴各日曆設定。本次驗證以獨立 ical.js parser、recurrence 及瀏覽器下載為準；Google/Apple/Outlook 真實帳戶匯入尚未全部測試。

## 授權與依賴

應用原始碼：MIT（LICENSE）。NotoSansCJKtc-Regular.otf：SIL Open Font License（public/fonts/OFL.txt），來源 https://github.com/notofonts/noto-cjk 。其他套件按其自身授權，詳見 lockfile 及 THIRD_PARTY.md。

規格參考：
- https://pdf-lib.js.org/
- https://datatracker.ietf.org/doc/html/rfc5545
- https://developers.cloudflare.com/pages/platform/limits/

無付費 API 依賴；Cloudflare 帳戶配額、政策及未來價格仍由 Cloudflare 決定。

## 畫面與載入

首頁與工具頁的程式及樣式分開載入，直接開啟工具頁會預載該頁資產。PDF 程式及字型只在匯出時下載。三個工具沿用首頁深綠、橙及暖金視覺，提供手機快捷跳轉、桌面固定預覽、減少動畫設定；輸入欄位不做傾斜或位移動畫。

PDF 字型以 TrueType 輪廓嵌入，保留原字寬及完整字元後備。重建字型需要獨立 Python 環境及 `fonttools[woff]==4.60.2 brotli==1.2.0`，執行 `python scripts/build-pdf-font.py` 後檢查 manifest、測試及 PDF 實際渲染（可用 `sh scripts/check-pdf-render.sh`，另需 Poppler）。日常 npm build 使用已附帶字型，不需要 Python。
