/**
 * KUAS Reception - Firebase 設定ファイル
 *
 * Firebase コンソール（https://console.firebase.google.com）でプロジェクトを作成し、
 * 以下の値をプロジェクトの設定から取得して置き換えてください。
 *
 * 手順:
 * 1. Firebase コンソール → プロジェクト設定 → 全般 → マイアプリ → ウェブアプリを追加
 * 2. 表示された firebaseConfig の各値をコピーして以下に貼り付け
 * 3. Firebase コンソール → Realtime Database → データベースを作成（本番モードを選択）
 * 4. セキュリティルールは database.rules.json を参照
 */
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
