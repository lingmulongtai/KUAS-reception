# KUAS Reception アプリ

[English README](README_EN.md)

## コンセプト
- 京都先端科学大学 工学部オープンキャンパスの受付と配席業務をブラウザだけで完結するシングルページアプリ
- 名簿インポートから受付、プログラム割り当て、進行管理、エクスポートまでをローカル優先で実行
- ネットワークに接続できる場合は Firebase（Auth / Firestore / Data Connect β）と連携可能

## 基本機能
- 予約者・当日参加者の受付と検索（氏名、学校、学年、同伴者情報）
- 第1〜第3希望が選べるプログラム選択 UI と満員判定
- 自動割り当て、待機リスト管理、色分けストラップ案内表示
- 管理画面でのプログラム編集、名簿プレビュー、ステータス可視化
- Excel（`reception_status.xlsx`）および PDF へのエクスポート
- 日本語/英語 UI 切り替え、ライト/ダークテーマ切り替え、IndexedDB・localStorage による自動保存

## システム要件
- ブラウザ: 最新の Microsoft Edge または Google Chrome（Windows で検証済み）
- OS: Windows 10/11 推奨。macOS でも動作
- ネットワーク: オンラインを推奨（フォント・アイコン・主要ライブラリを CDN から取得）
- オプション: Firebase を利用する場合は該当サービスの有効化が必要

## セットアップ
### ローカルで試す
1. 本リポジトリを任意の場所に配置
2. そのまま `index.html` をブラウザで開くか、任意のローカルサーバーを起動
   - PowerShell: `py -m http.server 8080`
   - Node.js: `npx serve -l 8080`
3. 初回起動時は名簿未読込みの通知が表示されるので、管理画面から名簿を読み込む

### Firebase 連携（任意）
1. Firebase プロジェクトを作成し、Authentication（Email/Password）と Cloud Firestore を有効化
2. ルートに `firebase-config.js` を作成し、`window.firebaseConfig = { ... }` を定義
3. `index.html` をホスティングまたはローカルサーバー経由で開き、管理画面からメール/パスワードでサインイン
4. `firestore.rules` を参考に権限を調整。Data Connect β を使う場合は `dataconnect/` 配下の設定を更新

## 当日の運用フロー
1. **事前準備**: PC・ブラウザの更新、名簿ファイルの最新版を用意、ポップアップ許可
2. **名簿インポート**: 管理画面 → 「ファイル読み込み」で予約者名簿、説明会名簿（どちらも xlsx）を読み込み。列マッピングを設定
3. **受付**
   - 予約者: 氏名で照合 → 内容確認 → 同伴者人数を含めて確定
   - 当日参加: 氏名/学校/学年/同伴者を入力 → 希望選択 → 確定
4. **自動割り当て**: 設定タブで「予約者優先」「学年優先（当日）」を切り替え、待機者を一括割り当て
5. **進行管理**: 受付状況タブでカード/表表示を切り替え、プログラム別の人数や待機者を確認
6. **エクスポート**: Excel / PDF 出力を実行し、最終状態を保存

## データ仕様
### Excel 名簿
| ファイル | 必須列 (例) | 読み込み時のフィールド |
| --- | --- | --- |
| ミニキャップストーン体験 予約者名簿 | No, 姓, 名, フリガナ, 第1〜第3希望, (任意) 同伴者 | `name`, `furigana`, `choices[]`, `companions` |
| 工学部説明会 参加者名簿 | No, 時間, 姓, 名, フリガナ, (任意) 同伴者 | `name`, `furigana`, `time`, `companions` |

### ローカル保存
- IndexedDB: フォーム入力、受付ステータス、名簿データ、プログラム設定を保存
- localStorage: テーマ、言語設定など軽量データを保存
- 管理画面の「受付データをリセット」で両方のストアを削除可能

## ディレクトリ構成（主要）
- `index.html` / `script.js` / `style.css`: メインアプリと UI ロジック
- `language-loader.js` と `locales/*.json`: 多言語リソースの遅延読み込み
- `public/`: 画像や Firebase Hosting 用サンプル
- `register_of_names/`: サンプル名簿（xlsx）
- `firebase-init.js`, `firebase-config.js`: Firebase 設定（任意）
- `dataconnect/`, `dataconnect-generated/`: Firebase Data Connect β 関連テンプレート

## トラブルシュート
- **予約が見つからない**: 名簿インポートを再確認し、氏名のスペースや表記揺れをチェック
- **プログラムが定員超過**: 待機リストへ回し、後で「待機者を一括割り当て」を実行
- **表示崩れやリセット**: 管理画面のリセットを実行 → ページ再読み込み
- **アイコンが表示されない**: ネットワーク接続と CDN 読み込みを確認
- **Firebase 書き込みが失敗**: 認証状態と Firestore ルールを確認

## 開発メモ
- プログラム定義や各種ステータス管理は `script.js` 内に実装
- UI テキストは `locales/ja.json` と `locales/en.json` で管理。新言語を追加する場合は同じキー構成で JSON を用意
- ブラウザ履歴に依存しないナビゲーションのため、セクション表示は `showSection()` を経由
- Excel 読み込みは SheetJS、ドラッグ&ドロップは SortableJS、アイコンは Phosphor Icons を利用

---

© KUAS Reception App Team. All rights reserved.

