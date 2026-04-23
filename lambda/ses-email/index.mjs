// CIQ Email Notification — AWS Lambda + SES
// デプロイ先: AWS Lambda (Node.js 20.x ランタイム)
// トリガー: API Gateway (HTTP API) POST /send-email
//
// 環境変数:
//   SES_FROM_ADDRESS  — 検証済みの送信元メールアドレス (例: ciq.info@gmail.com)
//   API_SECRET_KEY    — フロントエンドからの呼び出し認証用シークレット
//   AWS_REGION        — SESリージョン (デフォルト: ap-northeast-1)

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "ap-northeast-1" });
const FROM = process.env.SES_FROM_ADDRESS;
const API_KEY = process.env.API_SECRET_KEY;

// ── テンプレート ──────────────────────────────────

const templates = {
  // エントリー完了通知
  entry_confirmation: ({ projectName, entryNumber, password, familyName, firstName, status }) => ({
    subject: `【${projectName}】エントリー受付完了（No.${entryNumber}）`,
    body: [
      `${familyName} ${firstName} 様`,
      ``,
      `${projectName} へのエントリーを受け付けました。`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `受付番号: ${entryNumber}`,
      `パスワード: ${password}`,
      status === 'waitlist' ? `状態: キャンセル待ち` : `状態: 登録完了`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `※ 受付番号とパスワードは成績照合・キャンセル時に必要です。`,
      `  このメールを大切に保管してください。`,
      ``,
      status === 'waitlist'
        ? `現在定員に達しているため、キャンセル待ちとして登録されています。\nキャンセルが出た場合は自動的に繰り上がります。`
        : ``,
      `──────────────────────`,
      `CIQ — このメールは自動送信されています。`,
    ].filter(Boolean).join('\n'),
  }),

  // キャンセル完了通知
  entry_cancelled: ({ projectName, entryNumber, familyName, firstName }) => ({
    subject: `【${projectName}】エントリーキャンセル完了（No.${entryNumber}）`,
    body: [
      `${familyName} ${firstName} 様`,
      ``,
      `${projectName} のエントリーをキャンセルしました。`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `受付番号: ${entryNumber}`,
      `状態: キャンセル済み`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `ご参加をお待ちしております。`,
      ``,
      `──────────────────────`,
      `CIQ — このメールは自動送信されています。`,
    ].join('\n'),
  }),
};

// ── ハンドラー ──────────────────────────────────

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // API Key 認証
    const reqKey = event.headers?.["x-api-key"] || body.apiKey;
    if (reqKey !== API_KEY) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
    }

    const { type, to, data } = body;

    if (!type || !to || !data) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields: type, to, data" }) };
    }

    const templateFn = templates[type];
    if (!templateFn) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown template type: ${type}` }) };
    }

    const { subject, body: textBody } = templateFn(data);

    const command = new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Text: { Data: textBody, Charset: "UTF-8" } },
      },
    });

    await ses.send(command);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("SES send error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
