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
 *
 * 【重要】databaseURL について:
 * データベースの作成リージョンによって URL の形式が異なります。
 *
 * ■ アメリカ（デフォルト）の場合:
 *   "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
 *
 * ■ シンガポール（asia-southeast1）など米国外の場合:
 *   "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app"
 *
 * 正確な URL は Firebase コンソールの Realtime Database の「データ」タブ上部に表示されます。
 * その値をそのままコピーして databaseURL に設定してください。
 */
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // データベースを米国外（シンガポール等）に作成した場合は、リージョンを含む URL を使用してください。
  // 例（シンガポール）: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app"
  // 例（アメリカ）:      "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
  // 正確な URL は Firebase コンソール → Realtime Database → データ タブで確認できます。
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
