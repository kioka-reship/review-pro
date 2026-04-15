# 🚀 Review Pro デプロイ手順書
## ゼロから本番URLを発行するまでの完全ガイド

---

## 全体の流れ（合計30〜45分）

```
① GitHub にコードをアップ（5分）
      ↓
② Supabase でDBを作る（10分）
      ↓
③ Anthropic でAPIキーを取得（5分）
      ↓
④ Vercel にデプロイ（10分）
      ↓
⑤ 本番URLが発行される 🎉
```

---

## ① GitHubにコードをアップ

### 1-1. GitHubアカウントを作る
https://github.com にアクセスして無料登録（すでにある場合はスキップ）

### 1-2. 新しいリポジトリを作る
1. GitHub右上の「＋」→「New repository」
2. Repository name: `review-pro`
3. Private（非公開）を選択 ← 重要！コードを守るため
4. 「Create repository」をクリック

### 1-3. コードをアップロード
```bash
# ターミナルで実行（Macはターミナル.app、WindowsはGit Bash）
cd review-pro        # プロジェクトフォルダに移動
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/review-pro.git
git push -u origin main
```

---

## ② Supabaseでデータベースを作る

### 2-1. Supabaseアカウントを作る
https://supabase.com にアクセスして無料登録

### 2-2. 新しいプロジェクトを作る
1. 「New project」をクリック
2. Name: `review-pro`
3. Database Password: 安全なパスワードを設定（メモしておく）
4. Region: `Northeast Asia (Tokyo)` を選択
5. 「Create new project」をクリック（2〜3分待つ）

### 2-3. データベースを初期化する
1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. `supabase_schema.sql` の中身を全部コピーして貼り付け
4. 「Run」ボタンをクリック → 「Success」が出ればOK

### 2-4. 接続情報をメモする
左サイドバーの「Settings」→「API」を開いて以下をメモ：
- `Project URL` → NEXT_PUBLIC_SUPABASE_URL に使う
- `anon public` キー → NEXT_PUBLIC_SUPABASE_ANON_KEY に使う

---

## ③ Anthropic APIキーを取得

1. https://console.anthropic.com にアクセス
2. 「API Keys」→「Create Key」
3. 名前: `review-pro-production`
4. 発行されたキー（`sk-ant-...`）をメモ ← 一度しか表示されない！

※ 無料クレジット$5分がもらえます（最初はこれで十分）

---

## ④ Vercelにデプロイ

### 4-1. Vercelアカウントを作る
https://vercel.com にアクセスして「GitHubでログイン」

### 4-2. プロジェクトをインポート
1. 「Add New Project」をクリック
2. GitHubの `review-pro` リポジトリを選択
3. 「Import」をクリック

### 4-3. 環境変数を設定する ← ここが重要！
「Environment Variables」セクションで以下を1つずつ追加：

| 変数名 | 値 |
|--------|-----|
| `ANTHROPIC_API_KEY` | `sk-ant-...`（③でメモしたもの） |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | （デプロイ後のURLを後で追加） |

### 4-4. デプロイ実行
「Deploy」ボタンをクリック → 2〜3分待つ

### 4-5. 完了！
🎉 `https://review-pro-xxxx.vercel.app` のようなURLが発行されます

---

## ⑤ 独自ドメインを設定する（任意）

### ドメインを買う
お名前.com（https://www.onamae.com）で年額100円〜

例: `review-pro.jp`、`kutikomi-navi.com` など

### Vercelに設定する
1. Vercelのプロジェクト →「Settings」→「Domains」
2. 買ったドメインを入力して「Add」
3. 表示されるDNS設定をお名前.comに登録
4. 反映まで数分〜数時間

---

## ⑥ 店舗ごとのURLを発行する仕組み

デプロイ後、各店舗へのURLはこの形式になります：

```
https://あなたのドメイン/review/店舗ID
```

例:
- https://review-pro.jp/review/store-001  ← 田中さんの店
- https://review-pro.jp/review/store-002  ← 佐藤さんの店

新規契約時にSupabaseで店舗を追加するだけで、
自動的にURLが有効になります。

---

## ⑦ QRコードを作る（無料）

URLが決まったら以下で即作成できます：
https://qr.quel.jp

1. URLを貼り付ける
2. デザインを選ぶ
3. ダウンロード → 店舗に渡すだけ

---

## トラブルシューティング

| 症状 | 対処法 |
|------|--------|
| デプロイが失敗する | Vercelのログを確認。環境変数の設定ミスが多い |
| AIが生成されない | ANTHROPIC_API_KEYが正しいか確認 |
| データが保存されない | Supabaseの接続情報を確認 |
| URLが404になる | Next.jsのルーティング設定を確認 |

---

## 月々のコスト（まとめ）

| サービス | プラン | 月額 |
|---------|--------|------|
| Vercel | 無料（Hobby） | ¥0 |
| Supabase | 無料（Free） | ¥0 |
| Anthropic API | 従量課金 | ¥1〜3/生成 |
| ドメイン | お名前.com | 約¥100 |
| **合計** | | **¥100〜** |

10店舗契約で月¥59,800 → 原価¥1,000以下 → **利益率98%**

---

## 次のステップ

デプロイが完了したら：

1. ✅ 自分でテスト（実際に口コミを生成してみる）
2. ✅ 知人の店舗で無料トライアルを実施
3. ✅ Stripeを設定して課金を有効化
4. ✅ 営業開始 🚀

何か詰まったらClaudeに聞いてください！
