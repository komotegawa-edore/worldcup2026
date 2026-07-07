import { Match } from "./types";
import { ROUND_JA } from "./constants";

const LINE_API = "https://api.line.me/v2/bot/message/broadcast";
const SERVICE_NAME = "W杯速報 2026";

/**
 * 得点変化時に LINE ブロードキャストで全友だちに通知する
 */
export async function broadcastGoalNotification(match: Match): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set, skipping notification");
    return;
  }

  const homeName = match.home?.n ?? "未定";
  const awayName = match.away?.n ?? "未定";
  const homeFlag = match.home?.f ?? "🏳️";
  const awayFlag = match.away?.f ?? "🏳️";
  const hs = match.hs ?? 0;
  const as = match.as ?? 0;
  const roundLabel = ROUND_JA[match.round];

  const altText = `⚽ ${homeName} ${hs} - ${as} ${awayName} (${roundLabel})`;

  const siteUrl = process.env.SITE_URL ?? "https://worldcup2026.vercel.app";

  const flexMessage = {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚽ GOAL!",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: SERVICE_NAME,
            size: "xs",
            color: "#FFFFFFCC",
          },
        ],
        backgroundColor: "#1B5E20",
        paddingAll: "lg",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // ホームチーム
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `${homeFlag} ${homeName}`,
                size: "md",
                flex: 3,
              },
              {
                type: "text",
                text: String(hs),
                size: "xl",
                weight: "bold",
                align: "end",
                flex: 1,
              },
            ],
          },
          // VS
          {
            type: "text",
            text: "VS",
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "sm",
          },
          // アウェイチーム
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `${awayFlag} ${awayName}`,
                size: "md",
                flex: 3,
              },
              {
                type: "text",
                text: String(as),
                size: "xl",
                weight: "bold",
                align: "end",
                flex: 1,
              },
            ],
            margin: "sm",
          },
          // ラウンド情報
          {
            type: "text",
            text: roundLabel,
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "lg",
          },
        ],
        paddingAll: "xl",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "速報サイトで詳しく見る →",
              uri: siteUrl,
            },
            style: "primary",
            color: "#1B5E20",
          },
        ],
        paddingAll: "md",
      },
    },
  };

  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: [flexMessage] }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[LINE] Broadcast failed: ${res.status} ${body}`);
    throw new Error(`LINE broadcast failed: ${res.status}`);
  }

  console.log(`[LINE] Broadcast sent: ${altText}`);
}
