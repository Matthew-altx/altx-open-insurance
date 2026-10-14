export const LIMITS = Object.freeze({
  policies: 3,
  travellers: 1,
  clients: 10,
});
export const TITLES = {
  guard: "守護卡",
  travel: "旅遊保險守護卡",
  reminders: "生日／保單週年提醒",
};
export const policy = () => ({
  company: "",
  plan: "",
  number: "",
  hotline: "",
});
export const blankCard = () => ({
  name: "",
  agent: "",
  agentPhone: "",
  contacts: [
    { name: "", phone: "" },
    { name: "", phone: "" },
  ],
  policies: [policy()],
  health: "",
  destination: "",
  departure: "",
  returnDate: "",
  company: "",
  plan: "",
  number: "",
  hotline: "",
  medical: "",
  currency: "HKD",
  reviewed: "",
  example: false,
});
export const blankClient = () => ({
  id: crypto.randomUUID(),
  name: "",
  birthday: "",
  anniversary: "",
  sequence: 0,
});
export function exampleCard(kind) {
  return {
    ...blankCard(),
    name: "陳小明（虛構）",
    agent: "示例顧問",
    destination: "日本・東京",
    departure: "2026-12-01",
    returnDate: "2026-12-07",
    company: "示例保險公司（虛構）",
    plan: "旅遊計劃（示例）",
    number: "DEMO-001",
    policies: [
      {
        company: "示例保險公司（虛構）",
        plan: "醫療保障計劃（示例）",
        number: "DEMO-001",
        hotline: "",
      },
    ],
    example: true,
  };
}
export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (y < 1900 || y > 2200) return false;
  const v = new Date(Date.UTC(y, m - 1, d));
  return (
    v.getUTCFullYear() === y &&
    v.getUTCMonth() === m - 1 &&
    v.getUTCDate() === d
  );
}
export function validMonthDay(s) {
  return /^\d{2}-\d{2}$/.test(s) && validDate(`2000-${s}`);
}
export function validateCard(d, kind) {
  const errors = [];
  if (!d.name.trim()) errors.push("請填寫客戶／旅客稱呼。");
  if (kind === "travel") {
    if (!d.destination.trim()) errors.push("請填寫目的地。");
    if (!validDate(d.departure) || !validDate(d.returnDate))
      errors.push("請輸入有效出發及回程日期（1900–2200 年）。");
    else if (d.departure > d.returnDate)
      errors.push("回程日期不可早於出發日期。");
    if (!d.company.trim()) errors.push("請填寫保險公司。");
    if (!d.hotline.trim())
      errors.push("請按保單填寫支援熱線，並核對是否適用旅遊目的地。");
    if (
      d.medical !== "" &&
      (!Number.isFinite(Number(d.medical)) || Number(d.medical) < 0)
    )
      errors.push("醫療保額須為非負數；未知請留空。");
  } else {
    if (d.policies.length < 1 || d.policies.length > LIMITS.policies)
      errors.push("每張守護卡需有 1–3 張保單。");
    d.policies.forEach((p, i) => {
      if (!p.company.trim()) errors.push(`保單 ${i + 1}：請填寫保險公司。`);
      if (!p.hotline.trim())
        errors.push(`保單 ${i + 1}：請按保單填寫支援熱線。`);
    });
  }
  if (!validDate(d.reviewed)) errors.push("請填寫實際核對保單／熱線嘅日期。");
  return errors;
}
export function validateClients(clients) {
  const e = [];
  if (!clients.length) e.push("請先新增客戶。");
  if (clients.length > LIMITS.clients) e.push("免費版最多 10 位客戶。");
  clients.forEach((c, i) => {
    if (!c.name.trim()) e.push(`客戶 ${i + 1}：請填寫暱稱。`);
    if (!c.birthday && !c.anniversary)
      e.push(`客戶 ${i + 1}：請填寫生日或保單週年，亦可兩者都填。`);
    for (const [k, label] of [
      ["birthday", "生日"],
      ["anniversary", "週年"],
    ])
      if (c[k] && !validMonthDay(c[k]))
        e.push(`客戶 ${i + 1}：${label}請用有效月日，例如 03-21。`);
  });
  return e;
}
export function occurrence(md, year) {
  const [m, d] = md.split("-").map(Number);
  const day =
    m === 2 && d === 29 ? new Date(Date.UTC(year, 2, 0)).getUTCDate() : d;
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function hkToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function nextOccurrence(md, today = hkToday()) {
  const year = Number(today.slice(0, 4));
  const date = occurrence(md, year);
  return date >= today ? date : occurrence(md, year + 1);
}
export function upcoming(clients, today = hkToday()) {
  return clients
    .flatMap((c) =>
      ["birthday", "anniversary"]
        .filter((k) => validMonthDay(c[k]))
        .map((k) => ({
          id: c.id + k,
          name: c.name || "未命名",
          label: k === "birthday" ? "生日" : "保單週年",
          date: nextOccurrence(c[k], today),
        })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function escapeIcs(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
export function foldLine(s) {
  let output = "",
    line = "",
    bytes = 0;
  for (const c of s) {
    const n = new TextEncoder().encode(c).length;
    if (bytes + n > 75) {
      output += line + "\r\n";
      line = " ";
      bytes = 1;
    }
    line += c;
    bytes += n;
  }
  return output + line;
}
export function makeIcs(clients, now = new Date()) {
  const errors = validateClients(clients);
  if (errors.length) throw new Error(errors.join("\n"));
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ALTX//Open Insurance//ZH-HK",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:ALTX 客戶重要日子",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Hong_Kong",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0800",
    "TZOFFSETTO:+0800",
    "TZNAME:HKT",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const c of clients) {
    for (const k of ["birthday", "anniversary"]) {
      if (!c[k]) continue;
      const [m, d] = c[k].split("-").map(Number);
      const date = nextOccurrence(c[k], hkToday(now)).replace(/-/g, "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${c.id}-${k}@altx-open-insurance`,
        `DTSTAMP:${stamp}`,
        `SEQUENCE:${c.sequence || 0}`,
        `DTSTART;TZID=Asia/Hong_Kong:${date}T090000`,
        `DTEND;TZID=Asia/Hong_Kong:${date}T091500`,
        `RRULE:FREQ=YEARLY;BYMONTH=${m};BYMONTHDAY=${m === 2 && d === 29 ? -1 : d}`,
        `SUMMARY:${escapeIcs(c.name)}・${k === "birthday" ? "生日" : "保單週年"}`,
        "DESCRIPTION:本機匯出快照；請自行確認日曆通知設定。",
        "BEGIN:VALARM",
        "TRIGGER:PT0S",
        "ACTION:DISPLAY",
        "DESCRIPTION:客戶重要日子",
        "END:VALARM",
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
export function telephone(value) {
  const v = value.trim();
  return /^\+?[\d ()-]{5,30}$/.test(v)
    ? "tel:" + v.replace(/[^+\d]/g, "")
    : null;
}
export function cardSections(d, kind) {
  const sections = [
    {
      title:
        kind === "travel" ? "旅客及行程 Traveller & trip" : "客戶資料 Client",
      rows: [
        ["稱呼", d.name],
        ...(kind === "travel"
          ? [
              ["目的地", d.destination],
              [
                "行程",
                `${d.departure || "待確認"} → ${d.returnDate || "待確認"}`,
              ],
            ]
          : []),
      ],
    },
  ];
  const ps = kind === "travel" ? [d] : d.policies;
  ps.forEach((p, i) =>
    sections.push({
      title: `${kind === "travel" ? "旅遊保障" : "保單 " + (i + 1)} Policy`,
      rows: [
        ["保險公司", p.company],
        ["計劃", p.plan],
        ["保單識別", p.number],
        ["支援熱線", p.hotline, telephone(p.hotline)],
        ...(kind === "travel"
          ? [
              [
                "醫療保額",
                d.medical !== "" ? `${d.currency} ${d.medical}` : "未提供",
              ],
            ]
          : []),
      ],
    }),
  );
  sections.push(
    {
      title: "緊急聯絡人 Emergency contacts",
      rows: d.contacts.map((c, i) => [
        `聯絡人 ${i + 1}`,
        `${c.name || "未提供"}${c.phone ? " · " + c.phone : ""}`,
        telephone(c.phone),
      ]),
    },
    {
      title: "服務顧問 Advisor",
      rows: [
        ["顧問", d.agent],
        ["聯絡電話", d.agentPhone, telephone(d.agentPhone)],
      ],
    },
  );
  if (kind === "guard" && d.health)
    sections.push({
      title: "使用者提供的健康備註",
      rows: [
        ["備註", d.health],
        ["說明", "未經醫療核實，不可作診斷或治療依據；未填不等於沒有敏感。"],
      ],
    });
  sections.push({
    title: "核對與使用說明",
    rows: [
      ["資料核對日期", d.reviewed || "待確認"],
      [
        "重要說明",
        "本卡只作資料整理，並非保單或保障證明。保障及求助安排以實際保單條款及保險公司確認為準。請自行核對熱線及保單資料。",
      ],
      ...(kind === "travel"
        ? [
            [
              "旅途中",
              "如需求助，聯絡當地緊急服務及保險公司；保留相關文件，實際所需文件按保單及保險公司指示。",
            ],
          ]
        : []),
    ],
  });
  return sections;
}
