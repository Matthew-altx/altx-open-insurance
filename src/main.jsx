import React, { Component, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUpRight, Code2, Menu, X, Pause, Play } from "lucide-react";
import { paths, tools } from "./tools.js";
import { useMotionPreference } from "./motion.js";
import "./style.css";
import "./shell.css";
const Home = lazy(() => import("./Home.jsx"));
const Workspace = lazy(() => import("./Workspace.jsx"));
const InfoPage = lazy(() => import("./InfoPage.jsx"));
class RouteBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="route-loading" role="alert">
        <p>暫時未能載入頁面，請檢查網絡後重試。</p>
        <button className="button primary" onClick={() => location.reload()}>
          重新載入
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [path, setPath] = useState(location.pathname.replace(/\/$/, "") || "/");
  const [menu, setMenu] = useState(false);
  const { reduced, systemReduced, toggle } = useMotionPreference();
  useEffect(() => {
    const f = () => setPath(location.pathname.replace(/\/$/, "") || "/");
    window.addEventListener("popstate", f);
    return () => window.removeEventListener("popstate", f);
  }, []);
  function navigate(e, to) {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e?.preventDefault();
    history.pushState({}, "", to);
    setPath(to);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const kind = Object.keys(paths).find((k) => paths[k] === path);
  useEffect(() => {
    document.title =
      (kind ? tools.find((tool) => tool.id === kind).title + "｜" : "") +
      "ALTX Open Insurance｜免費客戶服務工具";
  }, [path]);
  const link = (to) => (e) => navigate(e, to);
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要內容
      </a>
      <header className="header">
        <div className="reading-progress" aria-hidden="true" />
        <a
          href="/"
          onClick={link("/")}
          className="brand"
          aria-label="ALTX Open Insurance 首頁"
        >
          <span className="brand-mark">
            alt<span>X</span>
            <i />
          </span>
          <span className="brand-sub">OPEN INSURANCE</span>
        </a>
        <div className="header-actions">
          <button
            className="motion-toggle"
            onClick={toggle}
            aria-pressed={reduced}
            disabled={systemReduced}
            aria-label={systemReduced ? "已跟隨系統減少動畫" : "減少動畫"}
            title={
              systemReduced
                ? "已跟隨系統減少動畫設定"
                : reduced
                  ? "開啟動畫"
                  : "減少動畫"
            }
          >
            {reduced ? <Play size={14} /> : <Pause size={14} />}
            <span>{reduced ? "動畫已減少" : "減少動畫"}</span>
          </button>
          <button
            className="mobile-menu icon-button"
            aria-label="開關導覽"
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        <nav
          id="main-nav"
          className={menu ? "nav open" : "nav"}
          aria-label="主要導覽"
        >
          <a
            className={path === "/" || kind ? "active" : ""}
            href="/"
            onClick={link("/")}
          >
            免費工具
          </a>
          <a href="/privacy" onClick={link("/privacy")}>
            資料與私隱
          </a>
          <a
            className="nav-source"
            href="/open-source"
            onClick={link("/open-source")}
          >
            <Code2 size={18} /> 開源計劃 <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <RouteBoundary key={path}>
          <Suspense
            fallback={
              <div className="route-loading" role="status">
                <span />
                正在開啟工具…
              </div>
            }
          >
            {path === "/" ? (
              <Home link={link} reduced={reduced} />
            ) : kind ? (
              <Workspace key={kind} kind={kind} link={link} reduced={reduced} />
            ) : (
              <InfoPage path={path} link={link} />
            )}
          </Suspense>
        </RouteBoundary>
      </main>
      <footer>
        <a className="footer-brand" href="/" onClick={link("/")}>
          altX <span>OPEN INSURANCE</span>
        </a>
        <p>讓每一份關心，都有實用嘅工具。</p>
        <div>
          <a href="/privacy" onClick={link("/privacy")}>
            私隱與使用說明
          </a>
          <a href="/open-source" onClick={link("/open-source")}>
            開源 · MIT
          </a>
          <span>© {new Date().getFullYear()} ALTX</span>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
