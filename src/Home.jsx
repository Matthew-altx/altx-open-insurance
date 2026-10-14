import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Check,
  LockKeyhole,
  ShieldCheck,
  Plane,
  CalendarDays,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { paths, tools } from "./tools.js";
import { usePageMotion } from "./motion.js";
import "./motion.css";
export default function Home({ link, reduced }) {
  usePageMotion("/", reduced);
  return (
    <div className="home">
      <section className="hero" data-ambient>
        <div className="hero-glow glow-one" aria-hidden="true" />
        <div className="hero-glow glow-two" aria-hidden="true" />
        <span className="hero-watermark" aria-hidden="true">
          CARE.
        </span>
        <div className="hero-copy">
          <div className="eyebrow" data-reveal>
            <span className="dot" /> 免費使用 · 開源共享
          </div>
          <h1>
            <span className="headline-line" data-reveal data-delay="90">
              關心客戶，
            </span>
            <span className="headline-line" data-reveal data-delay="180">
              由<span className="underline">小事做好。</span>
            </span>
          </h1>
          <p className="hero-description" data-reveal data-delay="260">
            整好守護卡，記低重要日子。
            <br />
            三個簡單工具，讓每次服務更有準備。
          </p>
          <div className="hero-action" data-reveal data-delay="340">
            <a className="button primary hero-cta" href="#tools">
              揀一個工具開始{" "}
              <span>
                <ArrowUpRight size={22} />
              </span>
            </a>
          </div>
          <div className="hero-trust" data-reveal data-delay="410">
            <span>
              <Check size={15} /> 毋須登入
            </span>
            <span>
              <Check size={15} /> 本機處理
            </span>
            <span>
              <Check size={15} /> 無限次匯出
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-hidden="true"
          data-reveal
          data-delay="220"
        >
          <div className="art-parallax">
            <div className="art-stage" data-tilt>
              <div className="art-halo" />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <span className="orbit-spark spark-one" />
              <span className="orbit-spark spark-two" />
              <div className="floating-tag">
                <span className="mini-lock">
                  <LockKeyhole size={16} />
                </span>
                資料留喺你嘅裝置
              </div>
              <div className="travel-ticket">
                <Plane size={21} />
                <span>
                  HKG <span className="ticket-route">· · · · ·</span> WORLD
                </span>
                <small>帶住安心出發</small>
              </div>
              <div className="sample-card">
                <div className="sample-top">
                  <span>
                    ALTX <small>守護卡</small>
                  </span>
                  <ShieldCheck size={32} />
                </div>
                <div className="sample-body">
                  <div className="sample-label">一份準備，多一份安心</div>
                  <h3>
                    重要資料，
                    <br />
                    好好整理。
                  </h3>
                  <div className="sample-line">
                    <span />
                    <i />
                  </div>
                  <div className="sample-line shorter">
                    <span />
                    <i />
                  </div>
                  <div className="sample-bottom">
                    <HeartHandshake size={23} />
                    <span>為每一位你關心嘅人</span>
                  </div>
                </div>
              </div>
              <div className="date-card">
                <div className="date-icon">
                  <CalendarDays size={25} />
                </div>
                <div>
                  <strong>重要日子，記住咗。</strong>
                  <small>生日 · 保單週年</small>
                </div>
                <span className="date-check">
                  <Check size={15} />
                </span>
              </div>
              <span className="art-note">FOR PEOPLE. WITH CARE.</span>
            </div>
          </div>
        </div>
        <div className="hero-bottom" data-reveal data-delay="480">
          <span>
            <i /> DESIGNED AROUND PEOPLE
          </span>
          <a href="#tools">
            探索三個免費工具 <ArrowDown size={16} />
          </a>
          <span className="hero-edition">ALTX / OPEN TO EVERYONE</span>
        </div>
      </section>
      <section id="tools" className="tools-section">
        <div className="section-heading" data-reveal>
          <div>
            <div className="eyebrow subtle">
              <span className="section-index">01 /</span> THE EVERYDAY TOOLKIT
            </div>
            <h2>你今日想做好邊件事？</h2>
          </div>
          <p>由填寫到匯出，自己就做得到。</p>
        </div>
        <div className="tool-grid">
          {tools.map((t, i) => (
            <a
              className={"tool-card tool-" + t.id}
              key={t.id}
              href={paths[t.id]}
              onClick={link(paths[t.id])}
              onPointerEnter={() => import("./Workspace.jsx").catch(() => {})}
              onFocus={() => import("./Workspace.jsx").catch(() => {})}
              data-reveal
              data-delay={i * 100}
              data-tilt
            >
              <div className="tool-card-top">
                <span className="tool-icon">
                  <t.icon size={28} strokeWidth={1.65} />
                </span>
                <span className="tool-number">0{i + 1}</span>
              </div>
              <div className={"tool-visual visual-" + t.id} aria-hidden="true">
                {t.id === "guard" ? (
                  <div className="mini-guard">
                    <ShieldCheck size={25} />
                    <span />
                    <span />
                    <i />
                  </div>
                ) : t.id === "travel" ? (
                  <div className="mini-journey">
                    <span>HKG</span>
                    <i />
                    <Plane size={30} />
                    <i />
                    <span>世界</span>
                  </div>
                ) : (
                  <div className="mini-calendar">
                    <span>每一個重要日子</span>
                    <div>
                      {Array.from({ length: 14 }, (_, n) => (
                        <i key={n} className={n === 9 ? "calendar-day" : ""}>
                          {n === 9 ? <HeartHandshake size={14} /> : ""}
                        </i>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="tool-kicker">{t.kicker}</span>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <div className="tool-limit">
                <span />
                {t.limit} · 免費
              </div>
              <div className="tool-cta">
                {t.action}
                <ArrowUpRight size={22} />
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="privacy-band" data-reveal>
        <div className="privacy-symbol">
          <LockKeyhole size={32} strokeWidth={1.4} />
        </div>
        <div data-reveal>
          <h2>客戶資料，由你保管。</h2>
          <p>
            表單內容只喺瀏覽器處理。只有你選擇「記住此裝置」，先會保存本機草稿。
            <br className="desktop" />
            無需上傳保單，亦唔會將資料用作銷售名單。
          </p>
        </div>
        <a href="/privacy" onClick={link("/privacy")}>
          了解資料處理 <ArrowRight size={18} />
        </a>
      </section>
      <section className="how">
        <div data-reveal>
          <span className="eyebrow subtle">
            <span className="section-index">02 /</span> SIMPLE BY DESIGN
          </span>
          <h2>
            少啲步驟，
            <br />
            多啲時間照顧人。
          </h2>
        </div>
        <div className="steps">
          {[
            ["01", "填寫資料", "只填今次需要嘅資訊，亦可先睇虛構範例。"],
            ["02", "預覽與核對", "核對保單、熱線同日期，確認內容清楚。"],
            ["03", "匯出帶走", "下載 PDF 或日曆檔，由你自行保存及分享。"],
          ].map(([n, t, d]) => (
            <div key={n} data-reveal data-delay={(Number(n) - 1) * 110}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="open-strip" data-reveal>
        <Sparkles size={24} />
        <span>好用嘅工具，值得共享。原始碼以 MIT 授權公開下載。</span>
        <a href="/open-source" onClick={link("/open-source")}>
          查看開源計劃 <ArrowUpRight size={17} />
        </a>
      </div>
    </div>
  );
}
