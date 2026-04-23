// Firebase 共通設定
const firebaseConfig = {
  apiKey: "AIzaSyBqp86LCsX3vGoA3Ug1aBnZbA_oQIVW614",
  authDomain: "quziopus.firebaseapp.com",
  projectId: "quziopus",
  messagingSenderId: "61719920613",
  appId: "1:61719920613:web:a7002a7378c171f98d790c",
  measurementId: "G-FFP3YGKFDT",
  databaseURL: "https://quziopus-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Firebase SDK初期化
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  // Anonymous Auth: ユーザーには見えないが、セキュリティルールで auth != null を満たす
  firebase.auth().signInAnonymously().catch(e => console.warn('Anonymous auth failed:', e));
}


// セッション管理ヘルパー（localStorageベースに統一）
const session = {
  get(key) { return localStorage.getItem(key); },
  set(key, val) { localStorage.setItem(key, val); },
  clear() {
    const projectId = localStorage.getItem('projectId');
    ['projectId', 'scorer_name', 'scorer_role', 'secretHash', 'adminHash', 'privateKeyJwk'].forEach(k => localStorage.removeItem(k));
    // masterData キャッシュも削除
    if (projectId) localStorage.removeItem(`masterData_${projectId}`);
  },
  get projectId() { return this.get('projectId'); },
  get scorerName() { return this.get('scorer_name'); },
  get scorerRole() { return this.get('scorer_role'); }
};

// メール通知設定 (AWS SES via Lambda)
// AWS セットアップ完了後に endpoint と apiKey を記入する
const EMAIL_CONFIG = {
  endpoint: '',  // 例: 'https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/send-email'
  apiKey: '',    // Lambda の API_SECRET_KEY と一致させる
};
if (typeof CIQEmail !== 'undefined' && EMAIL_CONFIG.endpoint) {
  CIQEmail.configure(EMAIL_CONFIG);
}
