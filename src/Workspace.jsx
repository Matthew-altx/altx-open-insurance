import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Plane,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  LockKeyhole,
  Download,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  FileCheck2,
  Eye,
  Info,
  HardDrive,
  HeartHandshake,
  LoaderCircle,
} from "lucide-react";
import { get, set, del } from "idb-keyval";
import {
  LIMITS,
  TITLES,
  blankCard,
  blankClient,
  exampleCard,
  policy,
  validateCard,
  validateClients,
  makeIcs,
  upcoming,
  cardSections,
  hkToday,
} from "./core.js";
import { paths, tools } from "./tools.js";
import { usePageMotion } from "./motion.js";
import "./workspace.css";
function download(bytes, name, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function useDraft(kind, initial) {
  const [data, update] = useState(initial);
  const [remember, rememberSet] = useState(false);
  const [ready, readySet] = useState(false);
  const [storageError, errorSet] = useState("");
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    get("altx-open-v1-" + kind)
      .then((v) => {
        if (active && v?.version === 1) {
          update(v.data);
          rememberSet(true);
        }
      })
      .catch(() => errorSet("此瀏覽器無法讀取本機草稿，仍可使用及匯出。"))
      .finally(() => {
        if (active) readySet(true);
      });
    return () => {
      active = false;
    };
  }, [kind]);
  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current
      .catch(() => {})
      .then(() =>
        remember
          ? set("altx-open-v1-" + kind, { version: 1, data })
          : del("altx-open-v1-" + kind),
      )
      .catch(() => errorSet("本機保存失敗；請先匯出資料，避免遺失。"));
  }, [data, remember, ready, kind]);
  return { data, update, remember, rememberSet, ready, storageError };
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required = false,
  maxLength = 160,
  ...rest
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input
        type={type}
        value={value}
        onInput={type === "date" ? (e) => onChange(e.target.value) : undefined}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        {...rest}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export default function Workspace({ kind, link, reduced }) {
  const draft = useDraft(
    kind,
    kind === "reminders" ? { clients: [] } : blankCard(),
  );
  const { data, update, remember, rememberSet, ready, storageError } = draft;
  usePageMotion(paths[kind], reduced, ready);
  const tool = tools.find((item) => item.id === kind);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportStage, setExportStage] = useState("");
  const [confirm, setConfirm] = useState(null);
  const errorsRef = useRef();
  const changed = (next) => {
    update(next);
    setStatus("");
    setErrors([]);
  };
  const patch = (key, value) => changed({ ...data, [key]: value });
  const showErrors = (e) => {
    setErrors(e);
    setTimeout(() => errorsRef.current?.focus(), 0);
  };
  async function exportFile() {
    if (busy) return;
    const e =
      kind === "reminders"
        ? validateClients(data.clients)
        : validateCard(data, kind);
    if (e.length) {
      showErrors(e);
      return;
    }
    setBusy(true);
    setExportStage("正在準備文件…");
    setStatus("");
    try {
      if (kind === "reminders") {
        download(
          makeIcs(data.clients),
          "altx-reminders.ics",
          "text/calendar;charset=utf-8",
        );
        setStatus("日曆檔已產生。請匯入日曆並確認通知設定。");
      } else {
        setExportStage("正在準備中文字型…");
        const [{ makePdf }, font] = await Promise.all([
          import("./pdf.js"),
          import("./pdf-assets.js").then(({ loadPdfFont }) =>
            loadPdfFont(data, kind),
          ),
        ]);
        setExportStage("正在本機製作 PDF…");
        // Let the browser paint the progress message before font embedding.
        await new Promise((resolve) => setTimeout(resolve, 0));
        const bytes = await makePdf(data, kind, font);
        download(bytes, `altx-${kind}-card.pdf`, "application/pdf");
        setStatus("PDF 已產生。請打開核對後，再自行分享。");
      }
    } catch (e) {
      showErrors([e.message || "匯出失敗，資料仍保留，請稍後重試。"]);
    } finally {
      setBusy(false);
    }
  }
  const confirmAction = (title, action) => setConfirm({ title, action });
  if (!ready)
    return (
      <div className="route-loading" role="status">
        <span />
        正在檢查本機草稿…
      </div>
    );
  return (
    <div className={"workspace workspace-" + kind}>
      <div className="workspace-topbar">
        <a className="back" href="/" onClick={link("/")}>
          <ChevronLeft size={17} /> 工具庫
        </a>
        <nav className="tool-switcher" aria-label="切換工具">
          {tools.map((item) => (
            <a
              key={item.id}
              href={paths[item.id]}
              onClick={link(paths[item.id])}
              aria-current={item.id === kind ? "page" : undefined}
            >
              <item.icon size={17} />
              <span>
                {item.id === "guard"
                  ? "守護卡"
                  : item.id === "travel"
                    ? "旅遊卡"
                    : "日曆提醒"}
              </span>
            </a>
          ))}
        </nav>
      </div>
      <section className="workspace-hero" data-ambient>
        <div className="workspace-heading" data-reveal="still">
          <div className="eyebrow">
            <span className="workspace-status-dot" /> FREE TOOL /{" "}
            {kind === "guard" ? "01" : kind === "travel" ? "02" : "03"}
            <span className="workspace-kicker">{tool.kicker}</span>
          </div>
          <h1>{TITLES[kind]}</h1>
          <p>
            {kind === "reminders"
              ? "每個重要日子，都值得一份準備。"
              : kind === "travel"
                ? "將求助資料整好，帶住安心出發。"
                : "將重要資料整理好，關心就多一份準備。"}
          </p>
          <div className="workspace-benefits">
            <span>
              <LockKeyhole size={15} /> 資料只在本機處理
            </span>
            <span>
              <Check size={15} /> 免費 · 毋須登入
            </span>
          </div>
        </div>
        <div className="workspace-emblem" aria-hidden="true">
          <span className="emblem-orbit" />
          <span className="emblem-orbit orbit-offset" />
          <div className="emblem-tile">
            <tool.icon size={63} strokeWidth={1.1} />
            <span>
              {kind === "guard"
                ? "READY TO CARE"
                : kind === "travel"
                  ? "READY TO GO"
                  : "ALWAYS REMEMBER"}
            </span>
          </div>
          <i className="emblem-spark" />
        </div>
        <div className="workspace-steps" data-reveal="still">
          <a href="#editor">
            <span>01</span> 填寫資料 <ArrowRight size={15} />
          </a>
          <a href="#preview">
            <span>02</span> 預覽與核對 <ArrowRight size={15} />
          </a>
          <a href="#export">
            <span>03</span> 匯出帶走 <Download size={15} />
          </a>
        </div>
      </section>
      <div className="workspace-mobile-jump" aria-label="頁面快捷連結">
        <a href="#editor">
          <FileCheck2 size={17} />
          填寫資料
        </a>
        <a href="#preview">
          <Eye size={17} />
          查看預覽 <ArrowRight size={15} />
        </a>
      </div>
      <div className="workspace-grid">
        <div className="editor" id="editor" tabIndex={-1} data-reveal="still">
          <div className="editor-toolbar">
            <span>
              <FileCheck2 size={18} /> 01 · 填寫資料
            </span>
            <button
              className="text-button"
              onClick={() =>
                confirmAction("載入虛構範例會取代目前內容。確定載入？", () =>
                  changed(
                    kind === "reminders"
                      ? {
                          clients: [
                            {
                              ...blankClient(),
                              name: "小明（虛構）",
                              birthday: "02-29",
                              anniversary: "12-01",
                            },
                          ],
                        }
                      : exampleCard(kind),
                  ),
                )
              }
            >
              載入虛構範例
            </button>
          </div>
          {data.example && (
            <div className="notice">
              目前係虛構範例。請改為真實資料、填寫正確熱線後，取消以下範例標記。
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={data.example}
                  onChange={(e) => patch("example", e.target.checked)}
                />
                在文件顯示「虛構範例」
              </label>
            </div>
          )}
          {kind === "reminders" ? (
            <ReminderEditor
              data={data}
              changed={changed}
              confirmAction={confirmAction}
              setStatus={setStatus}
            />
          ) : (
            <CardEditor
              kind={kind}
              data={data}
              patch={patch}
              setStatus={setStatus}
            />
          )}
          <section className="save-panel">
            <label className="check-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => rememberSet(e.target.checked)}
              />
              <span>
                <strong>記住此裝置</strong>
                <small>
                  選擇後自動保存本工具 1
                  份本機草稿。取消選擇會刪除已保存草稿，畫面內容仍保留。共用裝置請勿開啟。
                </small>
              </span>
            </label>
            <p>
              清除瀏覽器資料、使用私密模式或換裝置，均可能無法取回。請自行保管下載檔案。
            </p>
            {storageError && (
              <p role="alert" className="error-text">
                {storageError}
              </p>
            )}
            <div className="save-actions">
              <button
                className="text-button"
                onClick={() =>
                  download(
                    JSON.stringify(
                      { schemaVersion: 1, tool: kind, data },
                      null,
                      2,
                    ),
                    `altx-${kind}-data.json`,
                    "application/json",
                  )
                }
              >
                取回原始資料
              </button>
              <button
                className="text-button danger"
                onClick={() =>
                  confirmAction(
                    "清除本工具目前內容及已保存草稿？此操作不能復原；已下載的檔案不受影響。",
                    () => {
                      rememberSet(false);
                      changed(
                        kind === "reminders" ? { clients: [] } : blankCard(),
                      );
                    },
                  )
                }
              >
                <Trash2 size={15} /> 清除此工具資料
              </button>
            </div>
          </section>
        </div>
        <aside
          className="preview-panel"
          id="preview"
          tabIndex={-1}
          aria-label="文件預覽與匯出"
          data-reveal="still"
        >
          <div className="preview-heading">
            <span>
              <Eye size={18} /> 02 · 預覽與核對
            </span>
            <span>
              <i />
              隨輸入更新
            </span>
          </div>
          <div
            className="preview-document"
            tabIndex={0}
            role="region"
            aria-label="文件內容預覽，可上下捲動"
          >
            {kind === "reminders" ? (
              <ReminderPreview clients={data.clients} />
            ) : (
              <CardPreview data={data} kind={kind} />
            )}
          </div>
          <div className="preview-footnote">
            <LockKeyhole size={13} /> 預覽及文件都在你的裝置製作
          </div>
          <div className="export-panel" id="export" tabIndex={-1}>
            <div className="export-heading">
              <span>03 /</span>
              <strong>核對好，就可以帶走。</strong>
            </div>
            {errors.length > 0 && (
              <div
                className="error-box"
                ref={errorsRef}
                tabIndex="-1"
                role="alert"
              >
                <strong>請先修正以下資料</strong>
                <ul>
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="button primary export"
              disabled={busy}
              aria-busy={busy}
              onClick={exportFile}
            >
              {busy ? (
                <LoaderCircle className="export-spinner" size={20} />
              ) : (
                <Download size={20} />
              )}
              {busy
                ? exportStage
                : kind === "reminders"
                  ? "下載日曆檔 .ics"
                  : "下載 PDF"}
            </button>
            <small>
              {kind === "reminders"
                ? "匯入日曆後先確認通知權限。網站不會自動寄信。"
                : "中文字型按需要載入，之後會重用。匯出前請核對所有資料。"}
            </small>
            <p className="status" role="status">
              {status}
            </p>
          </div>
        </aside>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="modal"
            onKeyDown={(e) => {
              if (e.key === "Escape") setConfirm(null);
              if (e.key === "Tab") {
                const buttons = e.currentTarget.querySelectorAll("button");
                if (e.shiftKey && document.activeElement === buttons[0]) {
                  e.preventDefault();
                  buttons[1].focus();
                } else if (
                  !e.shiftKey &&
                  document.activeElement === buttons[1]
                ) {
                  e.preventDefault();
                  buttons[0].focus();
                }
              }
            }}
          >
            <Info />
            <h2 id="confirm-title">{confirm.title}</h2>
            <div>
              <button
                className="button secondary"
                autoFocus
                onClick={() => setConfirm(null)}
              >
                取消
              </button>
              <button
                className="button primary"
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function CardEditor({ kind, data, patch, setStatus }) {
  const contact = (i, k, v) =>
    patch(
      "contacts",
      data.contacts.map((c, n) => (n === i ? { ...c, [k]: v } : c)),
    );
  return (
    <>
      <section className="form-section">
        <h2>{kind === "travel" ? "旅客與行程" : "客戶資料"}</h2>
        <Field
          label={kind === "travel" ? "旅客稱呼" : "客戶稱呼"}
          required
          value={data.name}
          onChange={(v) => patch("name", v)}
          placeholder="例如：陳先生"
        />
        {kind === "travel" && (
          <>
            <Field
              label="目的地"
              required
              value={data.destination}
              onChange={(v) => patch("destination", v)}
              placeholder="例如：日本東京"
            />
            <div className="field-grid">
              <Field
                label="出發日期"
                required
                type="date"
                min="1900-01-01"
                max="2200-12-31"
                value={data.departure}
                onChange={(v) => patch("departure", v)}
              />
              <Field
                label="回程日期"
                required
                type="date"
                min="1900-01-01"
                max="2200-12-31"
                value={data.returnDate}
                onChange={(v) => patch("returnDate", v)}
              />
            </div>
            <p className="helper">免費版每張卡供 1 位旅客使用。</p>
          </>
        )}
      </section>
      <section className="form-section">
        <div className="section-inline">
          <h2>保單資料</h2>
          <span>
            {kind === "guard"
              ? `${data.policies.length} / ${LIMITS.policies} 張`
              : "1 份保單"}
          </span>
        </div>
        <p className="helper">請按實際保單核對。未提供嘅保額不會當作 0。</p>
        {(kind === "guard" ? data.policies : [data]).map((p, i) => {
          const update = (k, v) =>
            kind === "guard"
              ? patch(
                  "policies",
                  data.policies.map((x, n) => (n === i ? { ...x, [k]: v } : x)),
                )
              : patch(k, v);
          return (
            <div className="policy" key={i}>
              {kind === "guard" && (
                <div className="section-inline">
                  <h3>保單 {i + 1}</h3>
                  {data.policies.length > 1 && (
                    <button
                      className="text-button danger"
                      aria-label={`刪除保單 ${i + 1}`}
                      onClick={() =>
                        patch(
                          "policies",
                          data.policies.filter((_, n) => n !== i),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
              <Field
                label="保險公司"
                required
                value={p.company}
                onChange={(v) => update("company", v)}
              />
              <Field
                label="計劃名稱（選填）"
                value={p.plan}
                onChange={(v) => update("plan", v)}
              />
              <Field
                label="保單識別（選填）"
                value={p.number}
                onChange={(v) => update("number", v)}
                hint="可填末幾位作識別；不需要身份證／護照號碼。"
              />
              <Field
                label="保險公司支援熱線"
                required
                value={p.hotline}
                type="tel"
                onChange={(v) => update("hotline", v)}
                hint="請填寫實際保單提供嘅電話；海外求助請連國際區號一併核對。"
              />
              {kind === "travel" && (
                <div className="field-grid">
                  <Field
                    label="醫療保額（選填）"
                    type="number"
                    min="0"
                    value={data.medical}
                    onChange={(v) => patch("medical", v)}
                    placeholder="未知請留空"
                  />
                  <label className="field">
                    <span>幣種</span>
                    <select
                      value={data.currency}
                      onChange={(e) => patch("currency", e.target.value)}
                    >
                      {[
                        "HKD",
                        "USD",
                        "CNY",
                        "JPY",
                        "EUR",
                        "GBP",
                        "AUD",
                        "CAD",
                        "SGD",
                        "TWD",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          );
        })}
        {kind === "guard" && (
          <button
            className="button secondary full"
            onClick={() =>
              data.policies.length < LIMITS.policies
                ? patch("policies", [...data.policies, policy()])
                : setStatus(
                    "免費版每卡最多 3 張保單。現有資料已保留；進階版尚未開放。",
                  )
            }
          >
            <Plus size={17} /> 加入保單
          </button>
        )}
      </section>
      <section className="form-section">
        <h2>
          緊急聯絡人 <small>選填 · 最多 2 位</small>
        </h2>
        {data.contacts.map((c, i) => (
          <div className="field-grid" key={i}>
            <Field
              label={`聯絡人 ${i + 1} 稱呼`}
              value={c.name}
              onChange={(v) => contact(i, "name", v)}
            />
            <Field
              label={`聯絡人 ${i + 1} 電話`}
              type="tel"
              value={c.phone}
              onChange={(v) => contact(i, "phone", v)}
            />
          </div>
        ))}
      </section>
      <section className="form-section">
        <h2>
          服務顧問 <small>選填</small>
        </h2>
        <div className="field-grid">
          <Field
            label="顧問名稱"
            value={data.agent}
            onChange={(v) => patch("agent", v)}
          />
          <Field
            label="顧問電話"
            type="tel"
            value={data.agentPhone}
            onChange={(v) => patch("agentPhone", v)}
          />
        </div>
      </section>
      {kind === "guard" && (
        <section className="form-section">
          <h2>
            健康備註 <small>選填</small>
          </h2>
          <label className="field">
            <span>只記錄獲准提供嘅必要資料</span>
            <textarea
              value={data.health}
              maxLength={1500}
              rows={3}
              onChange={(e) => patch("health", e.target.value)}
              placeholder="例如：使用者提供嘅藥物敏感資料"
            />
            <small>
              由使用者提供，未作醫療核實；不可作診斷或治療依據。未填不等於沒有敏感。
            </small>
          </label>
        </section>
      )}
      <section className="form-section">
        <h2>最後核對</h2>
        <Field
          label="實際核對資料日期"
          required
          type="date"
          min="1900-01-01"
          max="2200-12-31"
          value={data.reviewed}
          onChange={(v) => patch("reviewed", v)}
          hint="請核對保單版本、熱線及內容後填寫；文件產生日期會另外記錄。"
        />
      </section>
    </>
  );
}
function CardPreview({ data, kind }) {
  return (
    <div className="document-preview">
      <div className="document-header">
        <span>ALTX / {kind === "guard" ? "GUARD CARD" : "TRAVEL CARD"}</span>
        {kind === "guard" ? <ShieldCheck /> : <Plane />}
        <h2>{TITLES[kind]}</h2>
        <p>{data.name || "客戶／旅客稱呼"}</p>
      </div>
      <div className="document-body">
        {data.example && (
          <strong className="example-badge">虛構範例 · 不作真實使用</strong>
        )}
        {cardSections(data, kind).map((s, i) => (
          <section key={i}>
            <h3>{s.title}</h3>
            <dl>
              {s.rows.map(([k, v], n) => (
                <div key={n}>
                  <dt>{k}</dt>
                  <dd>{v || "未提供"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="document-footer">
          ALTX 工具製作 · 預覽會隨輸入更新
          <br />
          PDF 會按內容自動分頁
        </p>
      </div>
    </div>
  );
}
function ReminderEditor({ data, changed, confirmAction, setStatus }) {
  const changeClient = (i, key, v) =>
    changed({
      ...data,
      clients: data.clients.map((c, n) =>
        n === i ? { ...c, [key]: v, sequence: c.sequence + 1 } : c,
      ),
    });
  return (
    <>
      <section className="form-section">
        <div className="section-inline">
          <h2>客戶重要日子</h2>
          <span>{data.clients.length} / 10 位</span>
        </div>
        <p className="helper">
          生日及週年只填月日，例如 03-21；毋須出生年份或完整保單號碼。
        </p>
        {data.clients.length === 0 && (
          <div className="empty-state">
            <CalendarDays size={30} />
            <h3>由第一位客戶開始</h3>
            <p>只記低暱稱同重要月日，減少不必要資料。</p>
          </div>
        )}
        {data.clients.map((c, i) => (
          <div className="policy" key={c.id}>
            <div className="section-inline">
              <h3>客戶 {i + 1}</h3>
              <button
                className="text-button danger"
                aria-label={`刪除客戶 ${i + 1}`}
                onClick={() =>
                  confirmAction(
                    "刪除此客戶嘅本機提醒？已匯入嘅日曆事件需另行刪除。",
                    () =>
                      changed({
                        ...data,
                        clients: data.clients.filter((x) => x.id !== c.id),
                      }),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Field
              label="客戶暱稱"
              required
              value={c.name}
              maxLength={80}
              onChange={(v) => changeClient(i, "name", v)}
            />
            <div className="field-grid">
              <Field
                label="生日（月-日）"
                value={c.birthday}
                maxLength={5}
                placeholder="例如 03-21"
                onChange={(v) => changeClient(i, "birthday", v)}
              />
              <Field
                label="保單週年（月-日）"
                value={c.anniversary}
                maxLength={5}
                placeholder="例如 12-01"
                onChange={(v) => changeClient(i, "anniversary", v)}
              />
            </div>
          </div>
        ))}
        <button
          className="button secondary full"
          onClick={() =>
            data.clients.length < 10
              ? changed({ ...data, clients: [...data.clients, blankClient()] })
              : setStatus("免費版最多 10 位客戶，名單已保留。進階版尚未開放。")
          }
        >
          <Plus size={18} /> 新增客戶
        </button>
      </section>
      <section className="form-section">
        <h2>提醒安排</h2>
        <div className="notice">
          <strong>每年重複 · 香港時間 09:00</strong>
          <p>
            2 月 29 日會喺非閏年改為 2
            月最後一日。每位客戶可同時有生日及一個保單週年。
          </p>
        </div>
        <h3>點樣加入日曆？</h3>
        <ol className="instructions">
          <li>下載 .ics，先在日曆建立獨立嘅「客戶提醒」日曆。</li>
          <li>
            Google Calendar 可在桌面版「設定 → 匯入及匯出」匯入；Apple Calendar
            可開啟 .ics；Outlook 可從「新增日曆 → 從檔案上傳」匯入。
          </li>
          <li>
            核對事件時間、每年重複及通知權限。不同日曆可能忽略檔案內嘅提醒設定。
          </li>
        </ol>
        <p className="helper">
          此檔係匯出當刻嘅快照，網站修改不會自動同步；重新匯入可能重複。請先檢查舊事件，再決定是否取代。網站本身唔會寄
          Email 或 WhatsApp。
        </p>
      </section>
    </>
  );
}
function ReminderPreview({ clients }) {
  const events = upcoming(clients);
  return (
    <div className="reminder-preview">
      <span className="tool-icon">
        <CalendarDays size={28} />
      </span>
      <h2>下一個值得記住嘅日子</h2>
      <p>按香港日期排序 · 當日 09:00</p>
      {events.length ? (
        events.map((e) => (
          <div className="event-row" key={e.id}>
            <div className="event-date">
              <strong>{e.date.slice(8)}</strong>
              <span>{Number(e.date.slice(5, 7))} 月</span>
            </div>
            <div>
              <h3>{e.name}</h3>
              <span>
                {e.label} · {e.date.slice(0, 4)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <p>
            填入有效月日後，
            <br />
            下一次提醒會出現喺呢度。
          </p>
        </div>
      )}
    </div>
  );
}
