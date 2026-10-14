import { ShieldCheck, Plane, CalendarDays } from "lucide-react";
export const paths = {
  guard: "/tools/guard-card",
  travel: "/tools/travel-card",
  reminders: "/tools/reminders",
};
export const tools = [
  {
    id: "guard",
    icon: ShieldCheck,
    kicker: "保障整理",
    title: "守護卡",
    description: "保單、熱線、緊急聯絡人。重要資料，一張卡好好收起。",
    limit: "每卡 3 張保單",
    action: "製作守護卡",
  },
  {
    id: "travel",
    icon: Plane,
    kicker: "安心出發",
    title: "旅遊保險守護卡",
    description: "出發前整好保障及求助資料，旅途中需要時，即刻搵到。",
    limit: "每卡 1 位旅客",
    action: "製作旅遊卡",
  },
  {
    id: "reminders",
    icon: CalendarDays,
    kicker: "用心跟進",
    title: "生日／保單週年提醒",
    description: "記低值得關心嘅日子，加入你嘅日曆，留返時間畀客戶。",
    limit: "最多 10 位客戶",
    action: "建立日曆提醒",
  },
];
