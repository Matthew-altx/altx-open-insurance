import React from "react";
import { ChevronLeft, Download } from "lucide-react";
export default function InfoPage({ path, link }) {
  return (
    <article className="info-page">
      <a className="back" href="/" onClick={link("/")}>
        <ChevronLeft size={17} /> 返回工具庫
      </a>
      {path === "/privacy" ? (
        <>
          <div className="eyebrow subtle">YOUR DATA, YOUR DEVICE</div>
          <h1>資料與私隱</h1>
          <p className="lead">你輸入嘅客戶資料，只喺瀏覽器本機處理。</p>
          <h2>會保存啲乜？</h2>
          <p>
            表單資料預設只保留喺當前頁面記憶體。選擇「記住此裝置」後，該工具嘅內容會保存到本機
            IndexedDB，直到你取消選擇、清除本工具資料，或清除瀏覽器網站資料。草稿並無額外密碼加密；共用裝置請勿保存。
          </p>
          <p>
            「減少動畫」選擇會保存在此瀏覽器，方便下次沿用；只記錄動畫開關，不包含表單或客戶資料。網站亦會自動跟隨裝置嘅減少動態效果設定。
          </p>
          <h2>有冇資料上傳？</h2>
          <p>
            表單、保單、聯絡人、健康備註及提醒名單不會由本工具上傳。PDF
            及日曆檔於本機製作。本網站會下載同站程式及中文字型，網站託管服務
            Cloudflare 會接收一般連線資料（例如 IP
            及請求時間）；這並非零網絡請求或完全離線服務。此版本沒有分析追蹤、廣告像素或畫面錄影。
          </p>
          <h2>你可以點控制資料？</h2>
          <p>
            每個工具都可以匯出原始
            JSON、下載成果及清除本機草稿。下載檔案、已分享文件及已匯入日曆嘅內容，由你自行管理，網站不能撤回。使用私密模式、轉用另一裝置或清除網站資料，可能無法取回草稿。
          </p>
          <h2>使用說明</h2>
          <p>
            請先取得適當授權，並遵守你所屬機構嘅資料處理規則，只輸入必要資料。工具只協助整理資訊，不提供保險建議、核保、理賠或醫療判斷。保障範圍以實際保單及保險公司確認為準。
          </p>
          <p>
            日曆通知依賴你嘅日曆及裝置設定；本網站不提供雲端提醒或保證通知送達。請先核對下載內容再分享。
          </p>
        </>
      ) : path === "/open-source" ? (
        <>
          <div className="eyebrow subtle">BUILT TO BE SHARED</div>
          <h1>免費使用，開源共享。</h1>
          <p className="lead">三個本機工具。原始碼可以閱讀、修改及自行部署。</p>
          <a
            className="button primary"
            href="/altx-open-insurance-source.zip"
            download
          >
            <Download size={20} /> 下載完整原始碼
          </a>
          <h2>MIT 授權</h2>
          <p>
            應用程式原始碼以 MIT
            授權提供，可作商業及非商業用途，重用時請保留授權及版權聲明。軟件按現狀提供，不作保證；第三方套件及中文字型沿用各自授權。
          </p>
          <h2>你會收到甚麼？</h2>
          <p>
            React / Vite 原始碼、PDF 及 iCalendar
            匯出模組、日期與資料驗證測試、Cloudflare Pages 設定及部署
            README。Noto CJK 字型採 SIL Open Font
            License，字型及授權均包含喺套件內。
          </p>
          <h2>本次版本範圍</h2>
          <p>
            守護卡每卡最多 3 張保單、旅遊卡 1 位旅客、提醒名單最多 10
            位客戶。本機匯出不限次數。以上係介面限制，開源原始碼可自行修改。Pro、登入、雲端保存、付費及自動寄信尚未開放。
          </p>
          <p>
            本下載包即為此網站版本嘅可重建原始碼。目前未設公開 GitHub 倉庫。
          </p>
        </>
      ) : (
        <>
          <h1>搵唔到呢一頁</h1>
          <p>請返回工具庫，選擇你需要嘅工具。</p>
        </>
      )}
    </article>
  );
}
