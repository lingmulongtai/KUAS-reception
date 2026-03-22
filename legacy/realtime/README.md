# KUAS Reception – Firebase Realtime Database 版

## ファイル構成

| ファイル | 役割 |
|---|---|
| `firebase-config.js` | Firebase プロジェクト設定（APIキー等） |
| `style.css` | 共通スタイルシート（KUASブランドカラー） |
| `app.js` | Firebase Realtime DB 同期ロジック共通モジュール |
| `index.html` | **iPad 受付専用画面**（管理機能なし） |
| `admin.html` | **PC 管理画面**（リアルタイム監視・割り当て） |
| `database.rules.json` | Firebase Realtime Database セキュリティルール |

---

## セットアップ手順

### 1. Firebase プロジェクトの作成

1. [Firebase コンソール](https://console.firebase.google.com) でプロジェクトを作成
2. 「ウェブアプリを追加」し、`firebaseConfig` の値をコピー
3. `firebase-config.js` を開き、プレースホルダーを実際の値に置き換える

```js
window.firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "your-project.firebaseapp.com",
  databaseURL:       "https://your-project-default-rtdb.firebaseio.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:123...:web:abc..."
};
```

### 2. Realtime Database の有効化

1. Firebase コンソール → **Realtime Database** → 「データベースを作成」
2. ロケーション: `asia-southeast1`（シンガポール）を推奨
3. 初期セキュリティルールは「ロックモード（拒否）」を選択

### 3. セキュリティルールの設定

Firebase コンソール → Realtime Database → **ルール** タブを開き、
`database.rules.json` の内容をコピー＆ペーストして「公開」をクリック。

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "programs": {
      ".read": true,
      ".write": "auth != null"
    },
    "waitingList": {
      ".read": "auth != null",
      "$uid": {
        ".write": true,
        ".validate": "..."
      }
    },
    "confirmedAttendees": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

> **注意:** `waitingList.$uid.write: true` は iPad（未ログイン）からの書き込みを許可するためです。
> 本番運用では IP 制限やカスタム認証トークンでさらに保護することを推奨します。

### 4. Authentication の設定（管理画面用・任意）

管理画面（`admin.html`）を認証で保護したい場合:

1. Firebase コンソール → **Authentication** → 「メール/パスワード」を有効化
2. ユーザーを追加（運営スタッフのメールアドレス）
3. `admin.html` に Firebase Auth のサインインフォームを追加（任意の追加改修）

---

## データ構造（Firebase Realtime Database）

```
/ (root)
├── programs/
│   └── {programId}/
│       ├── title:       "AIロボットプログラミング"
│       ├── description: "センサーと機械学習でロボットを動かす体験"
│       ├── capacity:    20
│       ├── order:       1
│       └── createdAt:   1700000000000
│
├── waitingList/
│   └── {entryId}/
│       ├── name:       "山田 太郎"
│       ├── furigana:   "ヤマダ タロウ"
│       ├── school:     "〇〇高等学校"
│       ├── grade:      "高校2年生"
│       ├── companions: 1
│       ├── choices:    ["prog1", "prog2", "prog3"]
│       ├── type:       "walkin" | "reserved" | "briefing_only"
│       └── createdAt:  1700000000000
│
├── confirmedAttendees/
│   └── {entryId}/
│       ├── (同上 + assignedProgram, confirmedAt)
│       ├── assignedProgram: "prog1" | null
│       └── confirmedAt:     1700000000000
│
└── settings/
    ├── prioritizeReservations: false
    └── resetAt: 1700000000000
```

---

## 当日の運用フロー

### 1. iPad 受付フロー（`index.html`）

1. iPad で `index.html` を開く
2. 来場者が「予約あり」または「予約なし」を選択
3. フォームに氏名・学年・同伴者数を入力
4. 希望プログラムを最大3つ選択（残席数がリアルタイムで表示）
5. 内容確認 → 「受付を確定する」ボタンを押す
6. Firebase の `waitingList` にデータが保存される
7. **受付完了画面が5秒後に自動的に初期画面へ戻る**

### 2. 管理PC フロー（`admin.html`）

1. PC で `admin.html` を開く
2. **「概要」タブ**で受付状況をリアルタイムに把握
3. **「待機リスト」タブ**で待機者を確認
4. 「待機者を一括割り当て」ボタンで残席に基づき自動割り当て
   - 第1希望 → 第2希望 → 第3希望の順で空席を探して割り当て
   - アトミックな multiPath update で確実に同期
5. **「確定者一覧」タブ**で割り当て結果を確認
6. **「プログラム管理」タブ**で定員・プログラム情報を編集
7. **「JSONバックアップ」**ボタンで全データをダウンロード

---

## 主要機能

### iPad（`index.html`）

- ✅ 予約あり・予約なし の2フロー
- ✅ プログラム残席のリアルタイム表示（Firebase `onValue`）
- ✅ 受付データを `waitingList` へ `push()`
- ✅ 受付完了後、5秒で自動的に初期画面へ戻る
- ✅ ネットワーク状態バナー
- ✅ リロード・F5・Ctrl+R を無効化（誤操作防止）

### 管理PC（`admin.html`）

- ✅ `waitingList` / `confirmedAttendees` のリアルタイム監視（`onValue`）
- ✅ 待機者を一括割り当て（アトミック multiPath update）
- ✅ プログラムの追加・編集・削除
- ✅ データリセット（全削除 + デフォルトプログラム再投入）
- ✅ JSON バックアップのダウンロード
- ✅ 予約者優先割り当て設定
- ✅ 個別待機者の削除
- ✅ リロード防止

---

## ブランドカラー

| 用途 | カラー |
|---|---|
| メイングリーン | `#0F8C52` |
| ライトグリーン | `#46A679` |
| アクセントグリーン | `#8DBF21` |
| テキストグレー | `#595554` |
| 背景グレー | `#F2F2F2` |

---

## よくあるトラブル

| 症状 | 対処法 |
|---|---|
| 画面が真っ白で「Firebase の設定が完了していません」と表示される | `firebase-config.js` の値を正しく設定してください |
| プログラムが表示されない | 管理画面の「デフォルトを初期化」ボタン、またはプログラム追加フォームからプログラムを登録してください |
| 待機者が割り当てられない | 全プログラムが満員の可能性があります。プログラム管理タブで定員を確認してください |
| データが表示されない | Firebase コンソールでセキュリティルールを確認してください |
