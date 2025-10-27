# Copilot Instructions

## 1. 前提条件
- 回答は必ず日本語で記述してください。
- 200行以上の大規模なコード変更やファイル生成を行う場合は、作業前に変更計画を提示して承認を得てから着手してください。

## 2. アプリの概要
- 京都先端科学大学工学部オープンキャンパスの受付業務を、受付スタッフ・来場者・管理者が共通で利用できるモダンな Web アプリとして再構築したプロジェクトです。
- React + TypeScript + Vite で構築した SPA と Firebase Functions を組み合わせ、オフライン運用を前提としつつオンライン時は Firebase（Auth / Firestore / Cloud Functions）とシームレスに連携します。
- ライト/ダークテーマとリキッドグラス（Liquid Glass）スタイル、日英多言語 UI、DeepL API を利用した翻訳などの体験を提供します。

## 3. 技術スタック（エコシステム）
### フロントエンド
- React 19 / React DOM 19
- TypeScript 5 系 & Vite 7 を利用したモダン SPA 開発環境
- Tailwind CSS 3 系 + PostCSS + Autoprefixer によるスタイリング
- React Router Dom 6 によるルーティング
- TanStack Query 5 によるデータフェッチとキャッシュ管理
- React Hook Form 7 + Zod によるフォームバリデーション
- i18next / react-i18next / i18next-browser-languagedetector による多言語対応
- lucide-react, clsx などの UI ユーティリティ

### バックエンド / インフラ
- Firebase Cloud Functions（Node.js 20 ランタイム）
- firebase-admin / firebase-functions による Firebase サービス連携
- deepl-node を用いた翻訳 API 連携
- LangChain, node-fetch 等のユーティリティライブラリ
- Firebase Hosting / Firestore / Auth とエミュレータ環境

### 開発体験
- ESLint 9（@eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh）による静的解析
- TypeScript プロジェクト参照（`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`）
- Tailwind, PostCSS, Vite 設定による DX 最適化

## 4. ディレクトリ構成
```
KUAS-reception/
├─ apps/
│  └─ reception-web/                # フロントエンド SPA 本体
│     ├─ public/                    # 静的アセット
│     ├─ src/
│     │  ├─ components/
│     │  │  ├─ layout/             # AppShell, Sidebar などのレイアウト
│     │  │  └─ ui/                 # Button, Card などの UI パーツ
│     │  ├─ features/
│     │  │  ├─ reception/          # 受付フロー関連ロジック/画面
│     │  │  └─ admin/              # 管理ダッシュボード関連
│     │  ├─ hooks/                 # 共通カスタムフック
│     │  ├─ i18n/                  # 多言語設定とロケール
│     │  ├─ services/              # API クライアント・Firebase ラッパー
│     │  ├─ styles/                # Tailwind などスタイル関連
│     │  ├─ theme/                 # テーマトークンとモード設定
│     │  └─ types/                 # 型定義
│     ├─ vite.config.ts            # Vite 設定（`@` エイリアスなど）
│     └─ package.json              # フロントエンド依存関係
├─ functions/                       # Firebase Functions（REST 風 API 等）
│  ├─ index.js
│  └─ package.json
├─ legacy/                          # 旧来の HTML/JS 実装と関連資料
├─ public/                          # 共有アセット（ロゴ等）
└─ README.md                        # プロジェクト概要
```
