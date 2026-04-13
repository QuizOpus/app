// cancel.js — キャンセル処理（完全REST版・WebSocket接続ゼロ）

const params = new URLSearchParams(location.search);
    let projectId = params.get('pid');

    if (!projectId) {
        document.getElementById('form-card').innerHTML = '<p style="text-align:center;color:#ef4444;font-weight:600;">プロジェクトIDが不明です。正しいURLからアクセスしてください。</p>';
        throw new Error('No Project ID');
    }

    // 大会名を取得して表示
    (async () => {
        if (!projectId) return;
        try {
            const pName = await dbGet(`projects/${projectId}/publicSettings/projectName`);
            document.getElementById('cancel-title').textContent = pName || 'キャンセルフォーム';
            document.title = (pName || 'キャンセルフォーム') + ' - キャンセルフォーム';
        } catch(e) {
            document.getElementById('cancel-title').textContent = 'キャンセルフォーム';
        }
    })();

    function showStatus(msg, type) {
        const sm = document.getElementById('status-msg');
        sm.innerHTML = msg;
        sm.className = `page-msg ${type}`;
        sm.style.display = 'block';
    }

    async function processCancel() {
        const numStr = document.getElementById('f-number').value.trim();
        const email = document.getElementById('f-email').value.trim();
        const pw = document.getElementById('f-password').value.trim();

        if (!numStr || !email || !pw) {
            showStatus('すべての項目を入力してください。', 'error');
            return;
        }

        const entryNum = parseInt(numStr, 10);

        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = '認証中...';
        showStatus('データを確認しています...', '');

        try {
            // 受付番号で検索 (REST query)
            const entriesData = await dbQuery(`projects/${projectId}/entries`, 'entryNumber', entryNum);

            if (!entriesData || Object.keys(entriesData).length === 0) {
                showStatus('指定された受付番号が見つかりません。', 'error');
                btn.disabled = false; btn.textContent = 'キャンセルを確定する';
                return;
            }

            let targetKey = null;
            let targetData = null;
            let matched = false;

            const pwHash = await AppCrypto.hashPassword(pw);

            for (const [key, data] of Object.entries(entriesData)) {
                if (data.email === email && (data.disclosurePw === pwHash || data.disclosurePw === pw)) {
                    targetKey = key;
                    targetData = data;
                    matched = true;
                }
            }

            if (!matched) {
                showStatus('メールアドレスまたはパスワードが正しくありません。', 'error');
                btn.disabled = false; btn.textContent = 'キャンセルを確定する';
                return;
            }

            if (targetData.status === 'canceled') {
                showStatus('このエントリーは既にキャンセルされています。', 'error');
                btn.disabled = false; btn.textContent = 'キャンセルを確定する';
                return;
            }

            // 更新処理 (REST)
            await dbUpdate(`projects/${projectId}/entries/${targetKey}`, {
                status: 'canceled',
                canceledAt: SERVER_TIMESTAMP
            });

            document.getElementById('form-card').innerHTML = `
                <div style="text-align:center;">
                    <h2 style="color:#ef5350;margin-bottom:16px;">キャンセル完了</h2>
                    <p style="color:#8e8ea0;line-height:1.6;">
                        受付番号 ${entryNum} (${targetData.entryName} 様) の<br>エントリーキャンセルを受け付けました。<br>
                        ご利用ありがとうございました。
                    </p>
                </div>
            `;

        } catch (err) {
            showStatus('システムエラーが発生しました。', 'error');
            btn.disabled = false; btn.textContent = 'キャンセルを確定する';
        }
    }