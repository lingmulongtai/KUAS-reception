# KUAS Reception アプリ

[English README](README_EN.md)

## 概要
- 京都先端科学大学 工学部オープンキャンパスの受付業務を「受付スタッフ」「来場者」「管理者」が共通で利用できるモダンウェブアプリに再構築
- React + TypeScript + Vite をベースとした SPA（`apps/reception-web/`）と Firebase Functions で構成
- オフラインでも運用できるローカル優先設計。オンライン時は Firebase（Auth / Firestore / Cloud Functions）とシームレスに連携
- デザインテーマはライト/ダーク＋リキッドグラス（Liquid Glass）をサポート

## 主な機能
- **受付フロー**: 予約/当日来場を選択 → 参加者情報入力 → プログラム第1〜3希望の選択 → 内容確認・受付確定
- **プログラム管理**: リアルタイム残席表示、待機者・割り当て状況の可視化
- **翻訳**: DeepL API を利用した `/api/translate` エンドポイント（キー未設定時は簡易ルールベースでフォールバック）
- **テーマ/言語**: ライト/ダーク切り替え、日本語/英語 UI 切り替えをパーソナル設定として保存

## システム構成
```
KUAS Reception app/
├─ apps/
│  └─ reception-web/        # Web クライアント（React + Vite）
│     ├─ public/            # アプリで使用する画像などのアセット
│     ├─ src/
│     │  ├─ components/     # 共通レイアウト・UIコンポーネント
│     │  ├─ features/
│     │  │  ├─ reception/   # 受付フローに関わる画面/ロジック
│     │  │  └─ admin/       # 管理ダッシュボード関連
│     │  ├─ services/       # API/Firebase 通信まわり
│     │  ├─ theme/          # テーマトークン、スタイル
│     │  └─ hooks/ types/   # 再利用フックと型定義
│     ├─ package.json       # Web アプリ用依存関係
│     └─ vite.config.ts     # Vite 設定（別名 @ を src に割り当て）
├─ functions/               # Firebase Functions（Node.js）
│  ├─ index.js              # API エンドポイント実装
│  └─ package.json
└─ legacy/                  # 旧来の HTML/JS 実装や資料（バックアップ）
```

## セットアップ
### 1. リポジトリを取得
```bash
npm install
```
- ルート `package.json` は legacy バックアップ用です。モダン SPA は `apps/reception-web/` 内で管理されています。

### 2. Web クライアントを準備
```bash
cd apps/reception-web
npm install
```
- Tailwind CSS / React Query / React Hook Form / Firebase SDK 等の依存関係がインストールされます。

### 3. 環境変数を設定
`apps/reception-web/.env` を作成して以下を設定（必要に応じて）
```
VITE_API_BASE_URL=http://localhost:5001/kuas-reception/us-central1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=true
```
- Firebase プロジェクトを利用しない場合は `VITE_API_BASE_URL` を左記のローカル Functions URL に設定し、エミュレータを使用します。

### 4. Firebase Functions を準備
```bash
cd functions
npm install
```
- DeepL API を利用する場合は Functions の環境変数に `DEEPL_API_KEY` を設定してください。

### 5. ローカル開発の起動
#### Web アプリ（Vite）
```bash
cd apps/reception-web
npm run dev -- --host
```
- VS Code の Live Server を利用する場合、`apps/reception-web/index.html` を右クリック → "Open with Live Server" で SPA バンドルを確認できます。

#### Firebase Functions エミュレータ
```bash
firebase emulators:start --only functions
```
- エンドポイント例
  - `GET http://localhost:5001/.../getPrograms`
  - `POST http://localhost:5001/.../addReceptionRecord`
  - `GET http://localhost:5001/.../getReceptionStats`
  - `POST http://localhost:5001/.../translateText`

## Firebase Hosting へのデプロイ
本番/プレビュー環境へのデプロイには、Firebase CLI (`firebase-tools`) を使用します。

1. Firebase CLI へログイン
  ```bash
  npx firebase login
  ```

2. ビルドとデプロイ（ルートディレクトリで実行）
  ```bash
  npm run deploy:reception-web
  ```
  - `apps/reception-web` のビルドを実行後、Hosting ターゲット `reception-web`（サイト ID: `kuas-reception`）にデプロイします。

3. プレビュー用チャネルを作成したい場合（任意）
  ```bash
  npm run build:reception-web
  npx firebase hosting:channel:deploy preview --only hosting:reception-web
  ```
  - 一時 URL が生成されるため、レビュー用途の共有に便利です。

## ディレクトリの詳細
- `apps/reception-web/src/components`: Glass UI に対応した `AppShell`, `Button`, `Badge` など共通コンポーネント
- `apps/reception-web/src/features/reception`: 受付ワークフロー（Landing → Form → Program → Confirmation）
- `apps/reception-web/src/features/admin`: 管理用ダッシュボード（残席やメトリクスの表示）
- `apps/reception-web/src/services/api.ts`: Functions と通信するための API クライアント
- `apps/reception-web/src/services/firebase.ts`: Firestore 監視/書き込みのユーティリティ
- `functions/index.js`: Cloud Functions で提供する REST 風 API。CORS 対応済み
- `legacy/`: 旧版の HTML、Firebase Hosting 設定、Data Connect の設定など

## 旧来資産について
- 旧 `script.js` / `style.css` / `index.html` は `legacy/` フォルダーに退避しています。
- 過去資料やサンプル名簿（`register_of_names/`）も同フォルダーに移動済みで、必要に応じて参照・復旧できます。

## 翻訳機能
- Functions の `/translateText` を経由して DeepL API を呼び出し、多言語表示を提供
- API キー未設定時や失敗時には簡易的なルールベース翻訳でフォールバック

## 今後の拡張例
- Firestore 実データとフロント UI のリアルタイム同期
- 管理画面での編集、エクスポート機能のアップデート
- Firebase Auth を利用したスタッフ権限管理

## ライセンス
© KUAS Reception App Team

