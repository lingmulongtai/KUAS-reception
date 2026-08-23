# KUAS Reception アプリ

[English README](README_EN.md)

## コンセプト
- 京都先端科学大学 工学部オープンキャンパスの受付と配席業務をブラウザだけで完結するシングルページアプリ
- 名簿インポートから受付、プログラム割り当て、進行管理、エクスポートまでを **完全ローカル** で実行
- 外部サービスへの通信は一切行わない。会場に回線が無くても動く

> **オンライン版について**
> Firebase（Auth / Firestore / Cloud Functions）を使う構成は `backup/firebase-main`
> ブランチに残してある。本ブランチはそこからクラウド依存を取り除いたローカル専用版。

## 基本機能
- **あいまい照合による受付** — 姓だけ・名だけ・ひらがな・カタカナ・ローマ字・メールアドレス・
  濁点の打ち漏れまで拾い、入力しながら候補を出す（`name-match.js`）
- 第1〜第3希望が選べるプログラム選択 UI、定員バー（空きあり／残りわずか／満席）と満員判定
- 4つの割り当て方法（先着順 / 予約者優先 / 学年優先 / リピーター優先）と待機リスト管理
- 色分けストラップ案内表示
- 管理画面でのプログラム編集、名簿プレビュー、ステータス可視化
- Excel（`reception_status.xlsx`）および PDF へのエクスポート
- 多言語 UI 切り替え（日本語 / English / 한국어 / 中文 / español / हिन्दी / नेपाली / العربية / Indonesia）
- ライト / ダーク / Liquid Glass テーマ、IndexedDB・localStorage による自動保存

## システム要件
- ブラウザ: 最新の Microsoft Edge、Google Chrome、Safari
- OS: Windows 10/11、macOS、iPadOS
- Node.js 18 以降（同梱のローカルサーバーを使う場合のみ）
- ネットワーク: **不要**。フォント・アイコン・ライブラリはすべてリポジトリに同梱

## セットアップ

```bash
npm start
```

`http://127.0.0.1:5173` を開く。iPad など同じ LAN の端末からも使う場合は:

```bash
npm run start:lan
```

表示された LAN アドレスに各端末からアクセスする。

> `index.html` を直接ダブルクリックしても動かない。多言語リソースを
> `fetch` で読み込むため、`file://` ではブラウザにブロックされる。
> `npm start` か任意のローカルサーバー（`py -m http.server 8080` など）を経由すること。

管理画面へは画面右上のアイコンから入る。パスワードの既定値は `admin`
（`script.js` の `ADMIN_PASSWORD` 定数）。

## 当日の運用フロー
1. **事前準備**: PC・ブラウザの更新、名簿ファイルの最新版を用意、ポップアップ許可
2. **名簿インポート**: 管理画面 → 「ファイル読み込み」で予約者名簿、説明会名簿（どちらも xlsx）を読み込み。列マッピングを設定
3. **受付**
   - 予約者: 氏名の一部を入力 → 候補から選択 → 内容確認 → 同伴者人数を含めて確定
   - 当日参加: 氏名/フリガナ/学校/学年/同伴者を入力 → 希望選択 → 確定
4. **割り当て**: 設定タブで割り当て方法（先着順 / 予約者優先 / 学年優先 / リピーター優先）を選ぶ。
   先着順以外は全員の受付後に「受付状況」タブの「待機者を一括割り当て」を実行
5. **進行管理**: 受付状況タブでカード/表表示を切り替え、プログラム別の人数や待機者を確認
6. **エクスポート**: Excel / PDF 出力を実行し、最終状態を保存

## データ仕様
### Excel 名簿
| ファイル | 必須列 (例) | 読み込み時のフィールド |
| --- | --- | --- |
| ミニキャップストーン体験 予約者名簿 | No, 姓, 名, フリガナ, 第1〜第3希望, (任意) メールアドレス・参加回数・同伴者 | `name`, `furigana`, `email`, `visits`, `choices[]`, `companions` |
| 工学部説明会 参加者名簿 | No, 時間, 姓, 名, フリガナ, (任意) メールアドレス・同伴者 | `name`, `furigana`, `email`, `time`, `companions` |

列は見出しから自動検出する。外したときだけ列対応モーダルが開くので手動で指定する。
メールアドレスは照合の手がかりとして、参加回数はリピーター優先の並べ替えに使う。

### ローカル保存
すべて `local-store.js`（`window.LocalStore`）経由で localStorage に保存する。
`kuas.reception.v1.*` を名前空間として使う。

| キー | 内容 |
| --- | --- |
| `kuas.reception.v1.programs` | プログラム定義 |
| `kuas.reception.v1.reservations` | 予約者名簿 |
| `kuas.reception.v1.briefings` | 説明会参加者名簿 |
| `kuas.reception.v1.participants` | 受付済みの来場者 |

- 同一ブラウザの複数タブ間は `storage` イベントでリアルタイムに同期する
- IndexedDB は入力途中のフォーム内容の退避に使用
- 管理画面の「受付データをリセット」で全ストアを削除できる

> **注意:** データはブラウザのプロファイルに紐づく。別の PC・別ブラウザとは共有されない。
> 複数台で受付を分担する場合は、各端末のデータを Excel 出力してから手動で統合する。

## ディレクトリ構成（主要）
- `index.html` / `script.js` / `style.css`: メインアプリと UI ロジック
- `local-store.js`: localStorage ベースのデータ層
- `name-match.js`: 来場者の照合エンジン（かな・ローマ字・メール対応）
- `tests/name-match.test.js`: 照合のテスト。`npm test` で走る
- `serve.js`: 依存なしのローカル配信サーバー
- `language-loader.js` と `locales/*.json`: 多言語リソースの遅延読み込み
- `assets/fonts/`: 同梱フォント（Inter / Noto Sans JP / Zen Maru Gothic）
- `vendor/`: 同梱ライブラリ（Phosphor Icons / SortableJS / SheetJS）
- `public/`: 画像
- `public/programs/`: プログラムカードのサムネイル画像（置き場所は同ディレクトリの README 参照）
- `register_of_names/`: サンプル名簿（xlsx）
- `docs/design-proposal.html`: UI・機能のデザイン提案書

## トラブルシュート
- **予約が見つからない**: 名簿インポートを再確認し、氏名のスペースや表記揺れをチェック
- **プログラムが定員超過**: 待機リストへ回し、後で「待機者を一括割り当て」を実行
- **表示崩れやリセット**: 管理画面のリセットを実行 → ページ再読み込み
- **画面が真っ白 / 文言が出ない**: `file://` で開いていないか確認。`npm start` 経由で開く
- **データが消えた**: ブラウザのシークレットモードや履歴削除でも消える。本番前に必ず Excel 出力で控えを取る

## 開発メモ

```bash
npm test
```

- 照合の取りこぼしを見つけたら、まず `tests/name-match.test.js` にケースを足してから直す
- プログラム定義や各種ステータス管理は `script.js` 内に実装
- `confirmedAttendees` / `waitingList` / `programEnrollment` は `allParticipants` からの導出値。
  直接書き換えず `syncDerivedLists()` を経由する
- UI テキストは `locales/*.json` で管理。新言語を追加する場合は同じキー構成で JSON を用意し、
  未定義キーは自動的に英語へフォールバックする
- ブラウザ履歴に依存しないナビゲーションのため、セクション表示は `navigateTo()` を経由
- Excel 読み込みは SheetJS、ドラッグ&ドロップは SortableJS、アイコンは Phosphor Icons を利用

---

© KUAS Reception App Team. All rights reserved.
