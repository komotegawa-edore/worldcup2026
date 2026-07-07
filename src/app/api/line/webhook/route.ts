import { NextRequest, NextResponse } from "next/server";
import { validateSignature, messagingApi, webhook } from "@line/bot-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { fetchMatches } from "@/lib/api-football";
import { buildMatchContext } from "@/lib/match-context";

const SYSTEM_PROMPT = `あなたは2026 FIFA ワールドカップの物知りアシスタントです。
LINEのチャットボットとして、ユーザーの質問に日本語で答えてください。

ルール:
- 3行以内で簡潔に返す。友達に話すようなカジュアルな口調で。
- 試合結果、注目選手、次の試合予定、大会の豆知識など幅広く対応。
- 最新の試合データが提供されるので、それを参考にして回答する。
- わからないことは正直に「ちょっとわからん！」と言う。
- 絵文字は使わない。`;

// ---------- 試合データキャッシュ (5分) ----------
let cachedContext = "";
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getMatchContext(): Promise<string> {
  if (cachedContext && Date.now() - cachedAt < CACHE_TTL) {
    return cachedContext;
  }
  try {
    const matches = await fetchMatches();
    cachedContext = buildMatchContext(matches);
    cachedAt = Date.now();
  } catch (e) {
    console.error("[line/webhook] Failed to fetch match data:", e);
    if (!cachedContext) cachedContext = "（試合データの取得に失敗しました）";
  }
  return cachedContext;
}

export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!channelSecret || !channelAccessToken || !anthropicKey) {
    console.error("[line/webhook] Missing env vars");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const parsed: webhook.CallbackRequest = JSON.parse(body);
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // キャッシュ済みコンテキストを取得（高速）
  const matchContext = await getMatchContext();

  for (const event of parsed.events ?? []) {
    if (event.type !== "message") continue;
    const msgEvent = event as webhook.MessageEvent;
    if (msgEvent.message.type !== "text" || !msgEvent.replyToken) continue;

    const userText = (msgEvent.message as webhook.TextMessageContent).text;

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 256,
        system: `${SYSTEM_PROMPT}\n\n【現在の大会データ】\n${matchContext}`,
        messages: [{ role: "user", content: userText }],
      });

      const reply =
        response.content[0].type === "text"
          ? response.content[0].text
          : "ごめん、うまく答えられなかった！";

      await client.replyMessage({
        replyToken: msgEvent.replyToken,
        messages: [{ type: "text", text: reply }],
      });
    } catch (e) {
      console.error("[line/webhook] error:", e);
      try {
        await client.replyMessage({
          replyToken: msgEvent.replyToken,
          messages: [{ type: "text", text: "ちょっとエラーが起きた。もう一回聞いてみて！" }],
        });
      } catch {
        // token expired
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
