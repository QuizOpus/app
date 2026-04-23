// email.js — CIQ メール送信モジュール
// AWS API Gateway + Lambda (SES) 経由でメール通知を送信する。
//
// 使い方:
//   await CIQEmail.sendEntryConfirmation(email, { projectName, entryNumber, ... });
//
// 設定:
//   CIQEmail.configure({ endpoint, apiKey }) を初期化時に呼ぶ。
//   endpoint / apiKey は config.js または環境に応じて注入する。

const CIQEmail = (() => {
    let _endpoint = '';   // API Gateway のURL (例: https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/send-email)
    let _apiKey = '';     // Lambda 側の API_SECRET_KEY と一致させる

    function configure({ endpoint, apiKey }) {
        _endpoint = endpoint;
        _apiKey = apiKey;
    }

    async function _send(type, to, data) {
        if (!_endpoint) {
            console.warn('[CIQEmail] endpoint未設定 — メール送信をスキップ');
            return false;
        }
        try {
            const res = await fetch(_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': _apiKey,
                },
                body: JSON.stringify({ type, to, data }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error('[CIQEmail] 送信失敗:', err);
                return false;
            }
            return true;
        } catch (e) {
            console.error('[CIQEmail] ネットワークエラー:', e);
            return false;
        }
    }

    // エントリー完了メール
    async function sendEntryConfirmation(to, { projectName, entryNumber, password, familyName, firstName, status }) {
        return _send('entry_confirmation', to, {
            projectName, entryNumber, password, familyName, firstName, status,
        });
    }

    // キャンセル完了メール
    async function sendCancellation(to, { projectName, entryNumber, familyName, firstName }) {
        return _send('entry_cancelled', to, {
            projectName, entryNumber, familyName, firstName,
        });
    }

    return { configure, sendEntryConfirmation, sendCancellation };
})();
