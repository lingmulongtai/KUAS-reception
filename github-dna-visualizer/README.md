# 🧬 GitHub DNA Visualizer

GitHubユーザー名を入力すると、その開発者のGitHub活動データを美しく可視化する Web アプリケーションです。「DNA」の比喩で、その人の開発スタイル・個性が一目でわかるビジュアルを生成します。

## 機能

- 🔬 **言語DNA**: 全リポジトリのコード行数を言語別に集計し、ドーナツチャートで表示
- 📊 **活動リズム**: 過去1年間のコントリビューションをGitHub風ヒートマップで表示
- ⭐ **スター分布**: スター数Top10リポジトリを横棒グラフで表示
- 🎯 **パーソナリティスコア**: 5軸（Creator/Collaborator/Communicator/Maintainer/Explorer）をレーダーチャートで表示
- 📈 **開発タイムライン**: 年別リポジトリ作成数・スター獲得数の推移グラフ
- 🖼️ **シェアカード生成**: SVGカードをダウンロード
- 📄 **README自動生成**: プロフィールREADME.md を生成
- 🔗 **URLシェア**: `/?user=torvalds` 形式でURLからユーザーを読み込み
- ⚖️ **比較モード**: `/compare?a=user1&b=user2` で2人を並べて比較
- 🌍 **多言語対応**: 日本語・英語の切り替え

## ディレクトリ構成

```
github-dna-visualizer/
├── frontend/          # React + Vite + TypeScript フロントエンド
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── utils/        # ユーティリティ
│   │   ├── i18n.ts       # 多言語定義
│   │   ├── types.ts      # 型定義
│   │   └── App.tsx       # メインアプリ
│   └── package.json
├── backend/           # Node.js + Express バックエンドAPI
│   ├── src/
│   │   ├── routes/       # APIルート
│   │   ├── services/     # GitHub API・カード生成
│   │   └── index.ts      # エントリーポイント
│   └── package.json
└── README.md
```

## セットアップ

### 前提条件

- Node.js 18+
- GitHub Personal Access Token（GraphQL API・レート制限対策に推奨）

### バックエンドの起動

```bash
cd backend
cp .env.example .env
# .env に GITHUB_TOKEN を設定（オプションだが推奨）
npm install
npm run dev
```

バックエンドは http://localhost:3001 で起動します。

### フロントエンドの起動

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:5173 で起動します（API は自動的にバックエンドにプロキシされます）。

## 環境変数

### backend/.env

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx  # GitHub Personal Access Token（推奨）
PORT=3001
```

GitHub Token なしでも動作しますが、GitHub API のレート制限（60 req/h）に引っかかりやすくなります。Token あり: 5000 req/h。

## API エンドポイント

| メソッド | エンドポイント | 説明 |
|--------|-------------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/user/:username` | ユーザーデータ取得（REST + GraphQL統合） |
| POST | `/api/card/generate` | カードデータ生成 |

### レート制限対策

- サーバー側でインメモリキャッシュを実装（TTL: 10分）
- フロントエンドにレート制限残数インジケーターを表示

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Framer Motion（アニメーション）
- Recharts（チャート）
- React Router Dom 6

### バックエンド
- Node.js + Express
- TypeScript
- node-fetch（GitHub API呼び出し）
- インメモリキャッシュ

## スクリーンショット

アプリを起動すると：
1. メイン画面でGitHubユーザー名を入力
2. DNAらせんローディングアニメーションが表示される
3. 解析結果が6セクションで表示される
4. 「カードを生成」ボタンでSVGカードをダウンロード可能
5. `/compare?a=user1&b=user2` で2ユーザーを並べて比較
