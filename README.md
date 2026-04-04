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

> **コーナーストーンプロジェクト：**  
> 本システムは京都先端科学大学 工学部の **コーナーストーンプロジェクト** として、学生チーム5名が開発・運用しています。  
> 計画書・システム設計の詳細はこちら → [📄 コーナーストーン計画書](docs/cornerstone-proposal.md)

---

## プロジェクト概要

来場者・受付スタッフ・管理者が **一つの UI** でオープンキャンパスの受付をスムーズに運営するための Web アプリです。現在は開発・制作段階にあり、**2026年6月のオープンキャンパスでデモ稼働、8月に本番稼働開始** を目指しています。

- **来場者**は事前に届いたQRコードをかざすだけで受付完了（代替として名前・学年入力も可能）
- **受付スタッフ**はリアルタイムで座席割当・待機者管理を行えます
- **管理者**はダッシュボードで統計確認・プログラム設定・受付の開閉を制御できます

React 19 + TypeScript SPA と Firebase Cloud Functions（Node.js 20）で構成し、Firestore トランザクションによる **スレッドセーフな席割当** を実現しています。

---

## 対象ユーザーと価値

| ユーザー | 提供価値 |
|----------|----------|
| **来場者** | QRコードをかざすだけの0秒受付。受付後すぐにプログラム・会場情報がメールで届く |
| **受付スタッフ** | 照合ミスゼロ。待機者リストと手動割当・キャンセル繰り上げを1画面で管理 |
| **管理者** | KPI ダッシュボード・Excel名簿インポート・振り分けモード切り替えを認証付きパネルで操作 |
| **入学センター** | リピーター来場者の参加履歴が自動蓄積され、オープンキャンパス改善のためのデータとして活用可能 |

---

## 主要機能

### 現在実装済み

```
[受付開始] → [名前・学年入力] → [プログラム選択（最大3つ）] → [確認・送信] → [割当結果表示]
```

| カテゴリ | 機能 |
|----------|------|
| **来場者受付** | 4ステップ受付フロー・先着順自動割当・ウェイティングリスト & 繰り上がり |
| **管理者** | KPIダッシュボード・手動割当・プログラムCRUD・受付開閉設定 |
| **システム** | Firestoreトランザクション・Firebase Auth・多言語対応（日本語・英語） |
| **インフラ** | GitHub Actions CI/CD 自動デプロイ・Firebase Hosting + Cloud Functions |

### 開発中（今後追加予定）

| 機能 | 概要 |
|------|------|
| **Excel インポート** | 大学から受け取った参加者名簿（.xlsx）をアップロードするだけで自動処理 |
| **QRコード自動送信** | 参加者全員に固有QRコード付きの受付案内メールを一括送信 |
| **QRスキャン受付** | iPad でQRをかざすだけで受付完了。代替として名前・学年入力にも対応 |
| **2タイプ振り分けモード** | タイプ1（先着順）/ タイプ2（一括振り分け）を管理者設定で切り替え |
| **受付完了メール** | 担当教員・会場・スケジュールをまとめたメールを受付直後に自動送信 |
| **リピーター履歴蓄積** | 来場者のオープンキャンパス参加履歴を蓄積。タイプ2振り分けの優先度にも活用 |

> 詳細な設計・スケジュールは [📄 コーナーストーン計画書](docs/cornerstone-proposal.md) を参照してください。

---

## システムアーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                      Firebase Hosting                         │
│               React 19 SPA (Vite 7 + TypeScript)             │
│  ┌──────────────────────┐    ┌──────────────────────────────┐ │
│  │  来場者受付フロー     │    │  管理者ダッシュボード         │ │
│  │  - QRスキャン        │    │  - KPI / 統計               │ │
│  │  - 名前・学年入力    │    │  - 割当ボード                │ │
│  │  - プログラム選択    │    │  - プログラム管理             │ │
│  │  - 確認・完了        │    │  - Excel インポート           │ │
│  └──────────┬───────────┘    └──────────┬───────────────────┘ │
└─────────────┼──────────────────────────┼─────────────────────┘
              │ HTTP (Bearer Token)       │ Firestore onSnapshot
              ▼                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Node.js 20)            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌────────┐  │
│  │ /programs  │  │ /receptions │  │ /import  │  │  /qr   │  │
│  │ /assign... │  │ /stats      │  │ /email   │  │        │  │
│  └────────────┘  └─────────────┘  └──────────┘  └────────┘  │
│              ┌──────────────────────────┐                     │
│              │   Firestore Transaction   │                     │
│              │   (スレッドセーフ割当)    │                     │
│              └──────────────────────────┘                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
           ┌──────────────────────────────┐
           │       Cloud Firestore         │
           │  programs / receptions        │
           │  assignments / settings       │
           │  participants / visitHistory  │  ← 新規追加予定
           └──────────────────────────────┘
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
├── docs/
│   └── cornerstone-proposal.md    # コーナーストーン計画書
├── firestore.rules                 # Firestore セキュリティルール
├── firestore.indexes.json          # 複合インデックス定義
└── firebase.json                   # Firebase 設定
```

---

## データ構造 (Firestore)

### 現在のコレクション

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

### 追加予定のコレクション

```
participants/{id}                   # Excel インポートで生成
  ├── name / furigana / school / prefecture / grade
  ├── email: string                 # QRコード送信先 & visitHistory のキー
  ├── companions: number
  ├── selections: string[]          # CS第一〜第三希望
  ├── listType: "capstone" | "intro" | "both"
  ├── introTimeSlot: "am" | "pm"   # 工学部紹介の時間枠
  ├── qrCode: string               # QRコードデータURL
  ├── qrSentAt: timestamp
  └── eventId: string

visitHistory/{email}               # リピーター来場履歴
  ├── email / name / school: string
  ├── totalVisits: number          # 累計来場回数
  └── visits: [{eventId, eventName, eventDate, programId, grade, checkedInAt}]
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
| Excel 解析（予定） | exceljs |
| メール送信（予定） | @sendgrid/mail |
| QRコード生成（予定） | qrcode |

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

### 管理者専用（Firebase ID Token 必須）

| メソッド | パス | 説明 | 状態 |
|---------|------|------|------|
| `PATCH` | `/programs/:id` | プログラム更新 | ✅ 実装済 |
| `POST` | `/assignments/manual` | 手動割当 | ✅ 実装済 |
| `POST` | `/assignments/:id/cancel` | キャンセル＆繰り上げ | ✅ 実装済 |
| `POST` | `/import/participants` | Excel名簿インポート | 🔜 開発予定 |
| `POST` | `/participants/:id/send-qr` | QRコードメール送信 | 🔜 開発予定 |
| `POST` | `/assignments/batch` | タイプ2一括振り分け | 🔜 開発予定 |

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

- ブラウザの言語設定を自動検出し、対応言語に切り替えます
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
| `docs/cornerstone-proposal.md` | コーナーストーンプロジェクト計画書 |

---

## 更新履歴

| バージョン | 日付 | 主な変更点 |
|-----------|------|------------|
| **v0.8.0** | 2026-03-27 | セキュリティ修正：status注入脆弱性の解消、バックエンドバリデーション強化、モックデータフォールバック削除、統計カウントバグ修正 |
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
