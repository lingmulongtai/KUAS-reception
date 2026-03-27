<div align="center">

# KUAS Reception

**京都先端科学大学 工学部オープンキャンパス 受付管理システム**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Functions%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-KUAS_OC_Committee-green)](#ライセンス)

[🇺🇸 English README](README_EN.md) | [📋 プロジェクト概要](#プロジェクト概要) | [🚀 セットアップ](#セットアップ) | [📖 ドキュメント](#ディレクトリガイド)

</div>

---

## プロジェクト概要

来場者・受付スタッフ・管理者が **一つの UI** でオープンキャンパスの受付をスムーズに運営するための Web アプリです。

- **来場者**はタブレット/スマートフォンから情報入力とプログラム選択を完結できます
- **受付スタッフ**はリアルタイムで座席割当・待機者管理を行えます
- **管理者**はダッシュボードで統計確認・プログラム設定・受付の開閉を制御できます

React 19 + TypeScript SPA と Firebase Cloud Functions（Node.js 20）で構成し、Firestore トランザクションによる **スレッドセーフな席割当** を実現しています。

---

## 対象ユーザーと価値

| ユーザー | 提供価値 |
|----------|----------|
| **来場者** | 予約・当日受付を問わず、第1〜3希望でプログラムを選択し即座に割当結果を確認 |
| **受付スタッフ** | 待機者リストと手動割当・キャンセル繰り上げを1画面で管理 |
| **管理者** | KPI ダッシュボード・プログラム編集・受付の開閉を認証付きパネルで操作 |

---

## 主要機能

### 来場者向け受付フロー

```
[受付開始] → [予約 or 当日] → [参加者情報入力] → [プログラム選択（最大3つ）] → [確認・送信] → [割当結果表示]
```

- 第1〜3希望を順番に指定し、空席があれば最高優先度のプログラムに自動割当
- 全希望が満席の場合はウェイティングリストに自動登録
- 同伴者数を考慮した席数計算（最大10名）
- 日本語 / 英語 UI 対応

### 管理者ダッシュボード

| 機能 | 説明 |
|------|------|
| **KPI ウィジェット** | 総来場者数・割当済・待機中・完了・キャンセル数をリアルタイム表示 |
| **割当ボード** | 待機者を手動で特定プログラムに割当、キャンセル時は次点を自動繰り上げ |
| **プログラム管理** | プログラムの作成・編集・削除、定員設定 |
| **受付設定** | 受付の開閉、最大選択数、イベント名・日時・ウェルカムメッセージ |
| **予約管理** | 全受付レコードをステータスでフィルタリング・閲覧 |

### バックエンド機能

- **Firestore トランザクション**による原子的な席割当（オーバーブッキング防止）
- **Firebase Authentication** + Bearer Token による管理者エンドポイント保護
- **DeepL API** による翻訳（未設定時はルールベースでフォールバック）
- **Firestore Security Rules** によるコレクション単位のアクセス制御

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Firebase Hosting                       │
│              React 19 SPA (Vite 7 + TypeScript)          │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │  受付フロー      │    │  管理者ダッシュボード         │ │
│  │  - 参加者情報入力│    │  - KPI / 統計               │ │
│  │  - プログラム選択│    │  - 割当ボード                │ │
│  │  - 確認・完了   │    │  - プログラム管理             │ │
│  └────────┬────────┘    └──────────┬───────────────────┘ │
└───────────┼──────────────────────┼───────────────────────┘
            │ HTTP (Bearer Token)  │ Firestore onSnapshot
            ▼                      ▼
┌───────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Node.js 20)         │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │  /programs   │  │  /receptions  │  │  /assignments  │  │
│  │  GET (公開)  │  │  POST (公開)  │  │  POST (管理者) │  │
│  └──────────────┘  └───────────────┘  └────────────────┘  │
│              ┌──────────────────────┐                      │
│              │  Firestore Transaction                       │
│              │  (スレッドセーフ割当) │                      │
│              └──────────────────────┘                      │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────┐
            │     Cloud Firestore        │
            │  programs / receptions     │
            │  assignments / settings    │
            └───────────────────────────┘
```

### ディレクトリ構成

```
KUAS-reception/
├── apps/
│   └── reception-web/              # React SPA
│       ├── public/                 # 静的アセット・ロゴ
│       └── src/
│           ├── components/
│           │   ├── layout/         # AppShell・Sidebar・TopStatusBar
│           │   └── ui/             # Button・Card・Badge・GlassField
│           ├── features/
│           │   ├── reception/      # 受付フロー全体
│           │   │   ├── components/ # 各ステップのコンポーネント
│           │   │   ├── hooks/      # usePrograms など
│           │   │   └── types.ts    # Zod スキーマ定義
│           │   └── admin/          # 管理者ダッシュボード
│           │       ├── components/ # 各パネルコンポーネント
│           │       └── hooks/      # useAdmin・useReservations など
│           ├── services/
│           │   ├── api.ts          # HTTP クライアント（Bearer Token付き）
│           │   └── firebase.ts     # Firestore / Auth ラッパー
│           └── i18n/
│               └── locales/        # ja.json / en.json / id.json
├── functions/                      # Cloud Functions
│   ├── app.js                      # Express ルーティング
│   ├── db.js                       # Firestore トランザクションロジック
│   ├── schemas.js                  # Zod バリデーションスキーマ
│   └── middleware/auth.js          # Firebase Token 検証
├── firestore.rules                 # Firestore セキュリティルール
├── firestore.indexes.json          # 複合インデックス定義
└── firebase.json                   # Firebase 設定
```

---

## データ構造 (Firestore)

```
programs/{id}
  ├── title: string
  ├── description: string
  ├── capacity: number        # 総定員数
  ├── remaining: number       # 残席数（トランザクションで更新）
  ├── startTime / endTime: string
  ├── location: string
  ├── isActive: boolean
  └── order: number           # 表示順

receptions/{id}
  ├── attendee
  │   ├── name / furigana / school / grade
  │   ├── companions: number  # 同伴者数
  │   └── reserved: boolean   # 事前予約フラグ
  ├── selections: [{id, title}]  # 第1〜3希望
  ├── assignedProgram: {id, title, priority, assignedBy}
  ├── status: "waiting" | "assigned" | "completed" | "cancelled"
  └── createdAt: string

assignments/{id}
  ├── receptionId / programId
  ├── attendeeName / priority
  ├── status: "confirmed" | "cancelled"
  └── assignedAt / cancelledAt: string

settings/reception-settings
  ├── isOpen: boolean
  ├── maxSelections: number
  ├── eventName / eventDate / welcomeMessage: string
  └── openTime / closeTime: string
```

---

## 技術スタック

### フロントエンド

| カテゴリ | ライブラリ |
|----------|-----------|
| UI フレームワーク | React 19, React Router 6 |
| データフェッチ | TanStack Query 5 |
| フォーム管理 | React Hook Form 7 + Zod |
| スタイリング | Tailwind CSS 3, Lucide Icons |
| 多言語 | i18next 24, react-i18next 15 |
| Firebase | Firebase SDK 12 (Firestore + Auth) |
| ビルド | Vite 7, TypeScript 5 |

### バックエンド

| カテゴリ | ライブラリ |
|----------|-----------|
| HTTP サーバー | Express 5 |
| Firebase | firebase-admin 12, firebase-functions 6 |
| バリデーション | Zod 3 |
| 翻訳 | deepl-node 1 |

### インフラ

| サービス | 用途 |
|----------|------|
| Firebase Hosting | SPA 静的ホスティング |
| Cloud Functions | API サーバー (asia-northeast1) |
| Cloud Firestore | リアルタイムデータベース |
| Firebase Authentication | 管理者認証 |
| GitHub Actions | CI/CD（main ブランチ自動デプロイ） |

---

## API エンドポイント

### パブリック（認証不要）

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/programs` | プログラム一覧取得 |
| `POST` | `/receptions` | 受付登録・自動割当 |
| `GET` | `/receptions/stats` | 統計情報取得 |
| `GET` | `/system/settings` | 受付設定取得 |
| `POST` | `/translate` | テキスト翻訳 |

### 管理者専用（Firebase ID Token 必須）

| メソッド | パス | 説明 |
|---------|------|------|
| `PATCH` | `/programs/:id` | プログラム更新 |
| `POST` | `/assignments/manual` | 手動割当 |
| `POST` | `/assignments/:id/cancel` | キャンセル＆繰り上げ |

---

## セットアップ

### 前提条件

- **Node.js** 20 LTS 以上、**npm** 10 以上
- **Firebase CLI**: `npm install -g firebase-tools`
- Firebase プロジェクト（Firestore・Authentication・Hosting 有効化済み）
- DeepL API キー（翻訳機能を使う場合）

### 1. リポジトリのクローンと依存関係インストール

```bash
git clone <repository-url>
cd KUAS-reception
npm install
cd apps/reception-web && npm install
cd ../../functions && npm install
```

### 2. 環境変数の設定

`apps/reception-web/` に `.env` ファイルを作成してください。

```bash
cp apps/reception-web/.env.example apps/reception-web/.env
```

**必須設定**（Firebase コンソール → プロジェクト設定 → 全般 → マイアプリ から取得）:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

**任意設定**:

```env
# Cloud Functions の URL（開発環境はエミュレータのURLを使用）
VITE_API_BASE_URL=http://localhost:5001/your-project-id/asia-northeast1/api

# Firebase Emulator を使用する場合
VITE_USE_FIREBASE_EMULATOR=true
```

> **注意**: `VITE_FIREBASE_*` の変数が未設定の場合、ブラウザコンソールにエラーが表示され、管理者ログインが使用できません。

### 3. 管理者アカウントの作成

Firebase コンソール → **Authentication** → **Sign-in method** で **Email/Password** を有効化し、
**Users** タブ → **Add user** から管理者アカウントを作成してください。

### 4. DeepL API キーの設定（任意）

```bash
firebase functions:config:set deepl.apikey="YOUR_DEEPL_API_KEY"
```

エミュレータ使用時は `functions/.runtimeconfig.json` に記述してください:

```json
{
  "deepl": {
    "apikey": "YOUR_DEEPL_API_KEY"
  }
}
```

---

## 開発フロー

### 開発サーバーの起動

```bash
# プロジェクトルートから
npm run dev
# → http://localhost:5173 でアクセス可能

# LAN 内の他端末からも接続したい場合
cd apps/reception-web && npm run dev -- --host
```

### Firebase エミュレータの起動

```bash
npm run emulators
# Emulator UI: http://localhost:4000
```

エミュレータを起動した状態で開発サーバーを動かすことで、ローカル環境で完全な動作確認が可能です。

### ビルドとデプロイ

```bash
# ビルドのみ
npm run build

# Hosting のみデプロイ
npm run deploy

# Functions のみデプロイ
npm run deploy:functions

# すべてデプロイ (Hosting + Functions)
npm run deploy:all

# プレビュー（ビルド成果物の確認）
npm run preview
```

---

## 品質チェック

```bash
# 静的解析 (ESLint)
npm run lint

# 型検査 (TypeScript)
npm run typecheck

# ユニットテスト
cd apps/reception-web && npm run test
cd functions && npm test

# E2E テスト (Playwright)
cd apps/reception-web && npm run test:e2e
```

Pull Request 時は GitHub Actions (`.github/workflows/firebase-deploy.yml`) による自動検証が走ります。

---

## 多言語対応

| 言語 | ファイル | ステータス |
|------|---------|-----------|
| 日本語 | `src/i18n/locales/ja.json` | ✅ 完全対応 |
| 英語 | `src/i18n/locales/en.json` | ✅ 完全対応 |
| インドネシア語 | `src/i18n/locales/id.json` | ✅ 基本対応 |

- ブラウザの言語設定を自動検出し、対応言語に切り替えます
- 翻訳は DeepL API 経由（未設定時はフレーズ辞書でフォールバック）
- 新言語の追加は `src/i18n/locales/` に JSON を追加するだけです

---

## ディレクトリガイド

| パス | 役割 |
|------|------|
| `apps/reception-web/src/components/layout/` | AppShell・Sidebar・TopStatusBar・FlowStepper |
| `apps/reception-web/src/components/ui/` | Button・Card・Badge・GlassField・EmptyState |
| `apps/reception-web/src/features/reception/` | 来場者向け受付フロー |
| `apps/reception-web/src/features/admin/` | 管理者ダッシュボード |
| `apps/reception-web/src/services/api.ts` | HTTP クライアント（Bearer Token注入） |
| `apps/reception-web/src/services/firebase.ts` | Firestore・Auth ユーティリティ |
| `functions/app.js` | Express ルーティング（全APIエンドポイント） |
| `functions/db.js` | Firestore トランザクションロジック |
| `functions/schemas.js` | Zod バリデーションスキーマ |
| `firestore.rules` | Firestore セキュリティルール |

---

## 更新履歴

| バージョン | 日付 | 主な変更点 |
|-----------|------|------------|
| **v0.8.0** | 2026-03-27 | セキュリティ修正：status注入脆弱性の解消、バックエンドバリデーション強化（selections min, companions max）、モックデータフォールバック削除、統計カウントバグ修正 |
| v0.7.0 | 2025-10-28 | Firebase デプロイワークフロー整備、README 更新、全体の設定整理 |
| v0.6.0 | 2025-10-09 | DeepL 連携強化、デプロイパイプライン安定化、言語切替改善 |
| v0.5.0 | 2025-10-02 | モバイル最適化、iPad 表示バグ修正、Functions 調整 |
| v0.4.0 | 2025-09-30 | Liquid Glass テーマ改良、多言語対応拡張、自動デプロイ実験 |
| v0.3.0 | 2025-09-07 | スマートフォン/タブレット最適化、Firebase 設定アップデート |
| v0.2.0 | 2025-08-23 | 受付フロー拡張、同伴者情報・待機表導入、成功画面改善 |
| v0.1.0 | 2025-08-16 | SPA 初期リリース、オフライン対応・セキュリティ強化 |

---

## ライセンス

© KUAS OC improvement committee
本リポジトリのコードは KUAS オープンキャンパス改善委員会が管理しています。
