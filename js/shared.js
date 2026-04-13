/**
 * QuizOpus 共通ユーティリティ (shared.js)
 * 
 * 全ページで使い回す関数・定数を集約。
 * config.js, crypto.js の後に読み込むこと。
 *
 * === Zero-Cost Scale Architecture ===
 * すべてのデータベース通信を REST API (fetch) で行い、
 * WebSocket 接続数 (Spark: 100) の制限を完全に回避する。
 */

// ============================================
//  定数
// ============================================

// Firebase REST API ベースURL
const FIREBASE_REST_BASE = 'https://quziopus-default-rtdb.asia-southeast1.firebasedatabase.app';

// firebase.database.ServerValue.TIMESTAMP の REST 版
const SERVER_TIMESTAMP = { ".sv": "timestamp" };

// ============================================
//  REST API ヘルパー
// ============================================

/**
 * データ取得 (GET)
 * @param {string} path - 例: 'projects/xxx/publicSettings'
 * @returns {Promise<any>} data or null
 */
async function dbGet(path) {
    const res = await fetch(`${FIREBASE_REST_BASE}/${path}.json`);
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) { showDbAuthError(); throw new Error('PERMISSION_DENIED'); }
        throw new Error(`dbGet(${path}) failed: ${res.status}`);
    }
    return await res.json();
}

/**
 * データセット (PUT) — パス全体を上書き
 */
async function dbSet(path, data) {
    const res = await fetch(`${FIREBASE_REST_BASE}/${path}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) { showDbAuthError(); throw new Error('PERMISSION_DENIED'); }
        throw new Error(`dbSet(${path}) failed: ${res.status}`);
    }
    return await res.json();
}

/**
 * データ更新 (PATCH) — 既存データにマージ
 */
async function dbUpdate(path, data) {
    const res = await fetch(`${FIREBASE_REST_BASE}/${path}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) { showDbAuthError(); throw new Error('PERMISSION_DENIED'); }
        throw new Error(`dbUpdate(${path}) failed: ${res.status}`);
    }
    return await res.json();
}

/**
 * データ削除 (DELETE)
 */
async function dbRemove(path) {
    const res = await fetch(`${FIREBASE_REST_BASE}/${path}.json`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`dbRemove(${path}) failed: ${res.status}`);
}

/**
 * シャロー読み取り (キーのみ高速取得)
 */
async function dbShallow(path) {
    const res = await fetch(`${FIREBASE_REST_BASE}/${path}.json?shallow=true`);
    if (!res.ok) throw new Error(`dbShallow(${path}) failed: ${res.status}`);
    return await res.json();
}

/**
 * クエリ (orderByChild + equalTo)
 */
async function dbQuery(path, orderBy, equalTo) {
    const eqParam = typeof equalTo === 'string' ? `"${equalTo}"` : equalTo;
    const url = `${FIREBASE_REST_BASE}/${path}.json?orderBy="${orderBy}"&equalTo=${eqParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`dbQuery(${path}) failed: ${res.status}`);
    return await res.json();
}

/**
 * ETag ベースのトランザクション（排他制御付き読み書き）
 * WebSocket 接続なしでアトミックな更新を実現する。
 * 4人目の滑り込み防止や受付番号の連番管理に使用。
 *
 * @param {string} path
 * @param {function} updateFn - 現在の値を受け取り新しい値を返す。undefined で中止。
 * @param {number} maxRetries
 * @returns {Promise<{committed: boolean, value: any}>}
 */
async function dbTransaction(path, updateFn, maxRetries = 15) {
    const url = `${FIREBASE_REST_BASE}/${path}.json`;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const res = await fetch(url, { headers: { 'X-Firebase-ETag': 'true' } });
        if (!res.ok) throw new Error(`dbTransaction GET failed: ${res.status}`);
        const etag = res.headers.get('ETag');
        const currentVal = await res.json();
        const newVal = updateFn(currentVal);
        if (newVal === undefined) return { committed: false, value: currentVal };

        const putRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'if-match': etag },
            body: JSON.stringify(newVal)
        });
        if (putRes.ok) {
            return { committed: true, value: newVal };
        }
        if (putRes.status === 412) {
            // 別の人が先に書き込んだ → ランダム待機してリトライ
            await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
            continue;
        }
        throw new Error(`dbTransaction PUT failed: ${putRes.status}`);
    }
    throw new Error('dbTransaction: リトライ回数超過');
}

// ============================================
//  ポーリング（リアルタイム同期の代替）
//  3〜5秒間隔でデータを取得し、WebSocket 接続ゼロを実現
// ============================================

class Poller {
    /**
     * @param {string} path - Firebase パス
     * @param {function} callback - データ受信時のコールバック
     * @param {number} intervalMs - ポーリング間隔 (デフォルト 3000ms)
     */
    constructor(path, callback, intervalMs = 3000) {
        this.path = path;
        this.callback = callback;
        this.intervalMs = intervalMs;
        this._timerId = null;
        this._active = false;
    }

    async _tick() {
        if (!this._active) return;
        try {
            const data = await dbGet(this.path);
            this.callback(data);
        } catch (e) {
            console.error(`Poller(${this.path}):`, e);
        }
        if (this._active) {
            this._timerId = setTimeout(() => this._tick(), this.intervalMs);
        }
    }

    start() {
        if (this._active) return this;
        this._active = true;
        this._tick(); // 初回は即座に取得
        return this;
    }

    stop() {
        this._active = false;
        if (this._timerId) { clearTimeout(this._timerId); this._timerId = null; }
        return this;
    }

    restart() { this.stop(); this.start(); return this; }
}

// ============================================
//  アイドル監視 & 通信管理
//  無操作時にポーリングを停止して帯域を節約
// ============================================

const IdleManager = {
    _pollers: [],
    _idleTimer: null,
    _visTimer: null,
    _paused: false,
    IDLE_MS: 10 * 60 * 1000, // 10分無操作で通信停止

    register(poller) { this._pollers.push(poller); },

    init() {
        // タブ切替監視
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._visTimer = setTimeout(() => {
                    if (document.hidden) this.pause();
                }, 60000); // 裏に回って60秒後に停止
            } else {
                clearTimeout(this._visTimer);
                if (this._paused) this.resume();
                this.resetIdle();
            }
        });
        // ユーザー操作監視
        ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, () => {
                if (this._paused) this.resume();
                this.resetIdle();
            }, { passive: true });
        });
        this.resetIdle();
    },

    resetIdle() {
        if (this._idleTimer) clearTimeout(this._idleTimer);
        this._idleTimer = setTimeout(() => this.pause(), this.IDLE_MS);
    },

    pause() {
        if (this._paused) return;
        this._paused = true;
        this._pollers.forEach(p => p.stop());
        showToast('無操作のため通信を一時停止しました。画面を操作すると再開します。', 'info', 15000);
    },

    resume() {
        if (!this._paused) return;
        this._paused = false;
        this._pollers.forEach(p => p.start());
    }
};

// ============================================
//  共通UIユーティリティ
// ============================================

/**
 * データベース認証エラー表示
 * PERMISSION_DENIED 時に呼び出す共通オーバーレイ
 */
function showDbAuthError() {
    const div = document.createElement('div');
    div.className = 'error-overlay';
    div.innerHTML = `
        <div class="error-dialog">
            <h2><i class="fa-solid fa-triangle-exclamation"></i> データベース通信拒否</h2>
            <p>データベースへの接続が拒否されました。<br><br><br>運営者にお問い合わせください。</p>
            <button class="btn danger" onclick="location.href='index.html'"><i class="fa-solid fa-arrow-left"></i> ログイン画面へ戻る</button>
        </div>
    `;
    document.body.appendChild(div);
}

/**
 * PERMISSION_DENIED の自動ハンドリング
 */
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('PERMISSION_DENIED')) {
        event.preventDefault();
        document.body.innerHTML = '';
        showDbAuthError();
    }
});

/**
 * ログアウト — セッションを破棄してトップへ
 */
function logout() {
    session.clear();
    location.href = 'index.html';
}

/**
 * masterData をローカルストレージから取得
 * @param {string} projectId
 * @returns {Object} { [entryNumber]: { name, affiliation?, grade? } }
 */
function getMasterData(projectId) {
    try {
        return JSON.parse(localStorage.getItem(`masterData_${projectId}`) || '{}');
    } catch (e) {
        return {};
    }
}

/**
 * 答案画像プレビューオーバーレイ (REST版)
 * question.html / conflict.html で共通利用
 */
async function showPreview(projectId, secretHash, entryNum) {
    let overlay = document.getElementById('preview-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'preview-overlay';
        overlay.className = 'preview-overlay';
        document.body.appendChild(overlay);
    }
    const masterData = getMasterData(projectId);
    const name = masterData[entryNum]?.name || `受付番号 ${entryNum}`;

    overlay.innerHTML = `
        <div class="preview-header">
            <h2><i class="fa-solid fa-file-image"></i> ${name} の解答用紙</h2>
            <button class="preview-close" onclick="document.getElementById('preview-overlay').style.display='none'">✕ 閉じる</button>
        </div>
        <div id="preview-content" style="text-align:center">
            <div style="color:#aaa"><i class="fa-solid fa-spinner fa-spin"></i> 読み込み中...</div>
        </div>`;
    overlay.style.display = 'block';

    const answerData = await dbGet(`projects/${projectId}/protected/${secretHash}/answers/${entryNum}`);
    const pc = document.getElementById('preview-content');
    // Storage URL 優先、旧 Base64 フォールバック
    const imageUrl = answerData?.pageImageUrl || answerData?.pageImage;
    if (imageUrl) {
        pc.innerHTML = `<img src="${imageUrl}" alt="${name}" style="max-width:100%;max-height:85vh;border-radius:8px;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.5)">`;
    } else {
        pc.innerHTML = '<div style="color:#aaa;padding:40px">ページ画像が保存されていません。管理画面から答案を再読み込みしてください。</div>';
    }
}

// Escキーでプレビュー/メニューを閉じる
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const o = document.getElementById('preview-overlay');
        if (o) o.style.display = 'none';
        const panel = document.getElementById('menu-panel');
        if (panel && panel.classList.contains('open')) toggleMenu();
    }
});

/**
 * スライドパネルメニューの開閉
 */
function toggleMenu() {
    const panel = document.getElementById('menu-panel');
    const backdrop = document.getElementById('menu-backdrop');
    if (!panel || !backdrop) return;
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    backdrop.classList.toggle('active', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
}

/**
 * 認証チェック。セッション不正なら index.html へリダイレクト。
 * @param {Object} opts
 * @param {boolean} [opts.requireAdmin=false] - admin ロール必須か
 * @returns {{ projectId, secretHash, scorerName, scorerRole }} セッション情報
 */
function requireAuth(opts = {}) {
    const projectId = session.projectId;
    const secretHash = session.get('secretHash');
    const scorerName = session.scorerName;
    const scorerRole = session.scorerRole;

    if (!projectId || !scorerName) {
        location.href = 'index.html';
        return null;
    }
    if (opts.requireAdmin && scorerRole !== 'admin') {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;font-weight:bold;">管理者としてプロジェクトに入室してください。3秒後にトップページへ戻ります。</div>';
        setTimeout(() => location.href = 'index.html', 3000);
        return null;
    }
    return { projectId, secretHash, scorerName, scorerRole };
}

/**
 * 統一トースト通知
 * @param {string} msg - 表示メッセージ
 * @param {'success'|'error'|'info'} [type='info'] - 通知タイプ
 * @param {number} [duration=3000] - 表示時間(ms)
 */
function showToast(msg, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

/**
 * 統一確認ダイアログ
 * @param {string} message - 確認メッセージ
 * @param {string} [confirmText='削除する'] - 確認ボタンテキスト
 * @returns {Promise<boolean>}
 */
function showConfirm(message, confirmText = '削除する') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        overlay.innerHTML = `
            <div class="confirm-dialog glass-panel">
                <i class="fa-solid fa-triangle-exclamation confirm-icon"></i>
                <div class="confirm-message">${message}</div>
                <div class="confirm-actions">
                    <button class="btn secondary confirm-cancel">キャンセル</button>
                    <button class="btn danger confirm-ok">${confirmText}</button>
                </div>
            </div>
        `;

        overlay.querySelector('.confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector('.confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
        overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
        document.body.appendChild(overlay);
        overlay.querySelector('.confirm-ok').focus();
    });
}
