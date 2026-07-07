import { Match } from "./types";
import { ROUND_JA } from "./constants";

const LINE_API = "https://api.line.me/v2/bot/message/broadcast";
const SERVICE_NAME = "W杯速報 2026";

function getSiteUrl(): string {
  return process.env.SITE_URL ?? "https://worldcup2026.vercel.app";
}

function getToken(): string | null {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN is not set, skipping notification");
    return null;
  }
  return token;
}

async function sendBroadcast(token: string, message: Record<string, unknown>): Promise<void> {
  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: [message] }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[LINE] Broadcast failed: ${res.status} ${body}`);
    throw new Error(`LINE broadcast failed: ${res.status}`);
  }
}

function buildFlexMessage({
  headerText,
  headerColor,
  altText,
  match,
}: {
  headerText: string;
  headerColor: string;
  altText: string;
  match: Match;
}): Record<string, unknown> {
  const homeName = match.home?.n ?? "未定";
  const awayName = match.away?.n ?? "未定";
  const homeFlag = match.home?.f ?? "🏳️";
  const awayFlag = match.away?.f ?? "🏳️";
  const hs = match.hs ?? 0;
  const as = match.as ?? 0;
  const roundLabel = ROUND_JA[match.round];
  const showScore = match.status !== "scheduled";

  return {
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
            text: headerText,
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
        backgroundColor: headerColor,
        paddingAll: "lg",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
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
              ...(showScore
                ? [
                    {
                      type: "text",
                      text: String(hs),
                      size: "xl",
                      weight: "bold",
                      align: "end",
                      flex: 1,
                    },
                  ]
                : []),
            ],
          },
          {
            type: "text",
            text: "VS",
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "sm",
          },
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
              ...(showScore
                ? [
                    {
                      type: "text",
                      text: String(as),
                      size: "xl",
                      weight: "bold",
                      align: "end",
                      flex: 1,
                    },
                  ]
                : []),
            ],
            margin: "sm",
          },
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
              uri: getSiteUrl(),
            },
            style: "primary",
            color: headerColor,
          },
        ],
        paddingAll: "md",
      },
    },
  };
}

/**
 * 得点変化時に LINE ブロードキャストで全友だちに通知する
 */
export async function broadcastGoalNotification(match: Match): Promise<void> {
  const token = getToken();
  if (!token) return;

  const homeName = match.home?.n ?? "未定";
  const awayName = match.away?.n ?? "未定";
  const hs = match.hs ?? 0;
  const as = match.as ?? 0;
  const roundLabel = ROUND_JA[match.round];
  const altText = `⚽ ${homeName} ${hs} - ${as} ${awayName} (${roundLabel})`;

  const message = buildFlexMessage({
    headerText: "⚽ GOAL!",
    headerColor: "#1B5E20",
    altText,
    match,
  });

  await sendBroadcast(token, message);
  console.log(`[LINE] Broadcast sent: ${altText}`);
}

/**
 * 試合開始時に LINE ブロードキャスト通知
 */
export async function broadcastMatchStart(match: Match): Promise<void> {
  const token = getToken();
  if (!token) return;

  const homeName = match.home?.n ?? "未定";
  const awayName = match.away?.n ?? "未定";
  const roundLabel = ROUND_JA[match.round];
  const altText = `🏟️ キックオフ！${homeName} vs ${awayName}（${roundLabel}）`;

  const message = buildFlexMessage({
    headerText: "🏟️ キックオフ！",
    headerColor: "#0D47A1",
    altText,
    match,
  });

  await sendBroadcast(token, message);
  console.log(`[LINE] Broadcast sent: ${altText}`);
}

/**
 * 試合終了時に LINE ブロードキャスト通知
 */
export async function broadcastMatchEnd(match: Match): Promise<void> {
  const token = getToken();
  if (!token) return;

  const homeName = match.home?.n ?? "未定";
  const awayName = match.away?.n ?? "未定";
  const hs = match.hs ?? 0;
  const as = match.as ?? 0;
  const roundLabel = ROUND_JA[match.round];
  const altText = `🏁 試合終了！${homeName} ${hs} - ${as} ${awayName}（${roundLabel}）`;

  const message = buildFlexMessage({
    headerText: "🏁 試合終了！",
    headerColor: "#B71C1C",
    altText,
    match,
  });

  await sendBroadcast(token, message);
  console.log(`[LINE] Broadcast sent: ${altText}`);
}
