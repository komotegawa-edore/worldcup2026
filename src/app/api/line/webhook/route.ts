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

/** バックグラウンドで Claude を呼んで push message で返信 */
async function handleMessage(
  userId: string,
  userText: string,
  client: messagingApi.MessagingApiClient,
  anthropicKey: string,
) {
  // 試合データをコンテキストとして取得
  let matchContext = "";
  try {
    const matches = await fetchMatches();
    matchContext = buildMatchContext(matches);
  } catch (e) {
    console.error("[line/webhook] Failed to fetch match data:", e);
    matchContext = "（試合データの取得に失敗しました）";
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system: `${SYSTEM_PROMPT}\n\n【現在の大会データ】\n${matchContext}`,
      messages: [{ role: "user", content: userText }],
    });

    const reply =
      response.content[0].type === "text"
        ? response.content[0].text
        : "ごめん、うまく答えられなかった！";

    await client.pushMessage({
      to: userId,
      messages: [{ type: "text", text: reply }],
    });
  } catch (e) {
    console.error("[line/webhook] Claude/Push error:", e);
    try {
      await client.pushMessage({
        to: userId,
        messages: [{ type: "text", text: "ちょっとエラーが起きた。もう一回聞いてみて！" }],
      });
    } catch {
      // push also failed
    }
  }
}

export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!channelSecret || !channelAccessToken || !anthropicKey) {
    console.error("[line/webhook] Missing env vars");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // 署名検証
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!validateSignature(body, channelSecret, signature)) {
    console.error("[line/webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const parsed: webhook.CallbackRequest = JSON.parse(body);
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });

  // 各イベントをバックグラウンドで処理（即座に 200 を返す）
  for (const event of parsed.events ?? []) {
    if (event.type !== "message") continue;
    const msgEvent = event as webhook.MessageEvent;
    if (msgEvent.message.type !== "text") continue;

    const userId = msgEvent.source?.userId;
    if (!userId) continue;

    const userText = (msgEvent.message as webhook.TextMessageContent).text;

    // waitUntil が使える環境なら使う、なければ fire-and-forget
    handleMessage(userId, userText, client, anthropicKey);
  }

  // LINE には即座に 200 を返す
  return NextResponse.json({ status: "ok" });
}
