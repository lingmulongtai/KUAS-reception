# KUAS Reception アプリ

[English README](README_EN.md)

## 目次
- [プロジェクト概要](#プロジェクト概要)
- [ターゲットと提供価値](#ターゲットと提供価値)
- [システムアーキテクチャ](#システムアーキテクチャ)
- [主要機能](#主要機能)
- [技術スタック](#技術スタック)
- [セットアップ手順](#セットアップ手順)
- [開発フロー](#開発フロー)
- [品質チェック](#品質チェック)
- [翻訳と多言語対応](#翻訳と多言語対応)
- [AI 調査・評価プロンプト](#ai-調査評価プロンプト)
- [ディレクトリガイド](#ディレクトリガイド)
- [更新履歴](#更新履歴)
- [ライセンス](#ライセンス)

## プロジェクト概要
- 京都先端科学大学 工学部オープンキャンパスにおける来場受付を、スタッフ・来場者・管理者が共通 UI で扱えるよう再構築したモダン Web アプリです。
- React 19 + TypeScript + Vite による SPA（`apps/reception-web/`）と Firebase Functions（Node.js 20）で構成し、オンライン/オフライン両対応のハイブリッド運用を実現します。
- オフライン時はローカルストレージとキャッシュを利用し、オンライン復帰時に Firestore## 🚀 開発ステータス (2026/03 最新アップデート)

本プロジェクトは現在、アーキテクチャの大幅な刷新とバックエンドエンジンの強化（Phase 1 & 2）が完了しています。

**最近の実装完了機能:**
- **Firestore Transactions**: スレッドセーフなプログラム自動割当エンジン、手動割当、およびキャンセル時のウェイティングリスト（待機者）自動繰り上げ機能の実装。
- **Firebase Authentication**: Express製APIにFirebase Authベースの検証ミドルウェア（Bearer token）を導入し、エンドポイントの保護を実現。
- **Firestore Security Rules**: コレクション単位での包括的なRead/Write制御を実装。
- **管理者ダッシュボード**: 割当ボード（Assignment Board）を新設し、プログラムごとの空き状況や待機者の状態を視覚的に管理可能に。
- **単体テスト**: Jestによる堅牢なバックエンド割当ロジックのテストと、Vitestによるフロントエンド型のスキーマ検証を実装。

---

## 🌟 主な機能

### 参加者（ゲスト）向け機能
- **事前予約・当日受付両対応**: 状況に応じたスムーズなエントリー。
- **直感的なプログラム選択**: 第1希望から第3希望まで、混雑状況（残り席数）を見ながら選択可能。定員オーバーの場合は自動的に待機者（Waiting）として登録されます。
- **リアルタイム確定通知**: トランザクション処理により、瞬時に座席を確保し結果をフィードバック。
- **多言語対応 (i18n)**: 英語と日本語によるUIの切り替え。

### 管理者スタッフ向け機能
- **リアルタイムダッシュボード**: 来場者数や割当状況のKPI、プログラム毎の定員と残席数を一覧化。
- **予約・割当管理 (Assignment Board)**:
  - 待機中ユーザーのリストアップと「手動割当」による強制アサイン。
  - 欠席等によるキャンセルの実行と、次点待機者の「自動繰り上げ処理」。
- **プログラム管理**: プログラム名、説明、定員数の即時設定。
- **受付設定制御**: 受付の全体的な開始・停止、選択可能なプログラム最大数の設定。

---

## 📚 データ構造 (Firestore)

主要なコレクションとそのスキーマ（Zodによる厳密な型定義あり）:

- `programs`: セッションごとの定員(`capacity`)と現在の空き(`remaining`)を管理。
- `receptions`: 当日の受付（参加者情報、同伴者数、希望プログラムの配列）。`status` (`waiting`, `assigned`, `completed`, `cancelled`) を保持。
- `assignments`: 実際に座席が確保された確約データ。
- `settings`: 受付の稼働状況などのグローバルステータス。
- `users`: Firebase Authentication と連携し、管理者やスタッフの権限を管理。

---

## ターゲットと提供価値
- **受付スタッフ**: 来場者のチェックイン、残席管理、プログラム割当を素早く実施。
- **来場者**: 予約/当日受付を問わず、スムーズに情報入力・プログラム選択が可能。
- **管理者**: ダッシュボードで参加者状況のリアルタイム把握、翻訳やコンテンツ更新をコントロール。

## システムアーキテクチャ
```
KUAS-reception/
├─ apps/
│  └─ reception-web/        # SPA クライアント (React + Vite)
│     ├─ public/            # 静的アセット・マニフェスト類
│     ├─ src/
│     │  ├─ components/     # レイアウト / UI パターン
│     │  ├─ features/       # reception・admin 各機能モジュール
│     │  ├─ services/       # API クライアント / Firebase ラッパー
│     │  ├─ hooks/          # 共通カスタムフック
│     │  ├─ i18n/           # i18next 設定と辞書
│     │  ├─ theme/          # Light/Dark + Liquid Glass テーマトークン
│     │  └─ types/          # 共通型定義
│     └─ vite.config.ts     # Vite 7 設定（`@` エイリアスなど）
├─ functions/               # Firebase Functions (Node.js 20)
│  ├─ index.js              # Cloud Functions エントリ
│  └─ package.json
└─ legacy/                  # 旧来の HTML/JS 実装・資料アーカイブ
```

## 主要機能
- **受付フロー**: 予約/当日選択 → 参加情報入力 → プログラム第1〜3希望選択 → 内容確認と確定処理。
- **プログラム管理**: Firestore 連携による残席表示、待機者の繰り上げ、割当状況の可視化。
- **多言語 UI**: i18next による日・英を標準サポート、追加言語データは `apps/reception-web/src/i18n/locales/` に配置。
- **テーマ設定**: ライト/ダーク/リキッドグラスを個人単位で保存。Theme Sync Hook により OS 設定にも追従。
- **翻訳 API**: DeepL API を利用する `/translateText` Functions。キー未設定時はルールベースによるフォールバック翻訳を提供。
- **オフライン対応**: Service Worker とローカルキャッシュで接続断でも使用継続可能。復帰後は差分同期。

## 技術スタック
- **フロントエンド**: React 19 / React Router 6 / TanStack Query 5 / React Hook Form 7 / Zod / Tailwind CSS 3 / Lucide Icons。
- **状態・データ**: TanStack Query によるフェッチ & キャッシュ、Firestore SDK とのストリーム連携。
- **多言語**: i18next / react-i18next / i18next-browser-languagedetector。
- **ビルド・開発**: Vite 7, TypeScript 5, ESLint 9, PostCSS + Autoprefixer。
- **バックエンド**: Firebase Cloud Functions (node-fetch, deepl-node, firebase-admin, langchain ほかユーティリティ)。
- **ホスティング**: Firebase Hosting + Emulator Suite、デプロイ自動化ワークフローを整備。

## セットアップ手順
### 前提条件
- Node.js 20 系、npm 10 系を推奨。
- Firebase CLI (`firebase-tools`) をグローバルインストール済みであること。
- DeepL API キー（翻訳を本番運用する場合）。

### 1. ルート依存関係の取得
```bash
npm install
```
- ルート `package.json` はワークスペース管理とエミュレータ用スクリプトを提供します。

### 2. Web クライアントのセットアップ
```bash
cd apps/reception-web
npm install
```
- Tailwind、TanStack Query、Firebase SDK など SPA 用依存関係をインストールします。

### 3. SPA 用環境変数
`apps/reception-web/.env` を作成し、必要な値を設定します。
```
VITE_API_BASE_URL=http://localhost:5001/kuas-reception/us-central1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATOR=true
```
- Firebase プロジェクト未接続で検証する場合は、上記の Functions Emulator URL を利用します。

### 4. Firebase Functions のセットアップ
```bash
cd functions
npm install
```
- DeepL を利用する場合は、以下のコマンドで環境変数を登録します。
```bash
firebase functions:config:set deepl.apikey="YOUR_API_KEY"
```
- エミュレータ利用時は `.runtimeconfig.json` に同様のキーを記述できます。

## 開発フロー
### クイックスタート（推奨）
プロジェクトルートから以下のコマンドで開発サーバーを起動できます：
```bash
npm run dev
```
- ルートから実行すると自動的に `apps/reception-web` の Vite 開発サーバーが起動します。
- デフォルトで `http://localhost:5173` でアクセス可能です。

### その他の便利なコマンド
```bash
# ビルド
npm run build

# プレビュー（ビルド後の確認）
npm run preview

# Lint チェック
npm run lint

# 型チェック
npm run typecheck

# Firebase へデプロイ
npm run deploy

# Firebase Functions のみデプロイ
npm run deploy:functions

# すべてをデプロイ（Hosting + Functions）
npm run deploy:all

# Firebase エミュレータ起動
npm run emulators
```

### Web アプリ (Vite) - 直接起動
```bash
cd apps/reception-web
npm run dev -- --host
```
- LAN 内端末からの動作確認にも対応させるため `--host` 指定を推奨しています。

### Firebase Emulator Suite
```bash
firebase emulators:start --only functions
```
- 必要に応じて Firestore / Auth を追加する場合は `--only functions,firestore,auth` のように指定してください。
- 主なエンドポイント
  - `GET http://localhost:5001/kuas-reception/us-central1/getPrograms`
  - `POST http://localhost:5001/kuas-reception/us-central1/addReceptionRecord`
  - `GET http://localhost:5001/kuas-reception/us-central1/getReceptionStats`
  - `POST http://localhost:5001/kuas-reception/us-central1/translateText`

### Firebase Hosting へのデプロイ
```bash
npx firebase login
npm run deploy:reception-web
```
- 本番とは別にプレビュー用チャネルを作成する場合は次を実行します。
```bash
npm run build:reception-web
npx firebase hosting:channel:deploy preview --only hosting:reception-web
```

## 品質チェック
- `npm run lint`（`apps/reception-web` 内）で ESLint による静的解析を実行。
- `npm run typecheck` で TypeScript プロジェクト参照による型検証を実行。
- UI レグレッションを抑えるため、Playwright による E2E テスト（`apps/reception-web/e2e/`）を導入しています。
- `cd apps/reception-web && npm run test:e2e` で主要フローの E2E テストを実行できます。
- Pull Request 時は GitHub Actions によるデプロイ検証（`.github/workflows/firebase-deploy.yml`）を通過する構成です。

## 翻訳と多言語対応
- 既定言語は `ja`、ブラウザ検出により `en` へ自動切替。辞書は `apps/reception-web/src/i18n/locales/` 配下に JSON として配置します。
- DeepL API を利用する自動翻訳は `/translateText` Functions を経由。API キーが無い場合はシンプルなフレーズ辞書でフォールバックします。
- 固有名詞や学部固有ワードは `customGlossary` を活用し、必要に応じて辞書を追加してください。

## AI 調査・評価プロンプト
- 現状把握と次アクション整理を AI に依頼する場合は `docs/ai-investigation-prompt.md` を利用してください。

## ディレクトリガイド
- `apps/reception-web/src/components/layout`: AppShell / Sidebar / Status Bar などの共通レイアウト。
- `apps/reception-web/src/components/ui`: Button / Card / GlassField などの UI Primitive。
- `apps/reception-web/src/features/reception`: 受付フロー画面・ステート管理。
- `apps/reception-web/src/features/admin`: 管理ダッシュボードと統計ビュー。
- `apps/reception-web/src/services/api.ts`: Cloud Functions 呼び出し用クライアント。
- `apps/reception-web/src/services/firebase.ts`: Firestore / Auth ユーティリティ。
- `functions/index.js`: HTTP Cloud Functions のエントリ。CORS/認証ヘッダー処理を実装済み。
- `legacy/`: 旧版 HTML/JS、DataConnect 設定、移行用資料のアーカイブ。

## 更新履歴
| バージョン | 日付 | 主な変更点 |
|-----------|------|------------|
| v0.7.0 | 2025-10-28 | Firebase デプロイワークフロー整備、最新構成への README 更新、全体の設定整理 |
| v0.6.0 | 2025-10-09 | DeepL 連携強化、デプロイパイプラインの安定化、言語切替改善 |
| v0.5.0 | 2025-10-02 | モバイル最適化拡張、iPad 表示のバグ修正、Functions 調整 |
| v0.4.0 | 2025-09-30 | Liquid Glass テーマ改良、マルチリンガル対応拡張（Arabic追加）、自動デプロイ実験 |
| v0.3.0 | 2025-09-07 | スマートフォン/タブレット最適化、Firebase 設定アップデート、軽微なバグ修正 |
| v0.2.0 | 2025-08-23 | 受付フロー拡張、同伴者情報・待機表導入、成功画面改善 |
| v0.1.0 | 2025-08-16 | SPA 初期リリース、オフライン対応・セキュリティ強化、初期 README 整備 |

## ライセンス
© KUAS OC improvement committee
