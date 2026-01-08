# Storage セキュリティ設計

## 概要

are_dokoアプリでは、倉庫写真やオブジェクト切り抜き画像をSupabase Storageに保存します。
本ドキュメントでは、これらの画像データを安全に管理するためのセキュリティ設計を説明します。

## セキュリティ方針

### バケット設定: Private

```
[storage.buckets.aredoko-images]
public = false  # 重要: 常にPrivate
```

**理由:**
- Public設定だとURLを知っていれば誰でもアクセス可能
- 倉庫内の写真は機密情報を含む可能性がある
- 認証済みユーザーのみにアクセスを制限する必要がある

### アクセス方式: 署名付きURL（Signed URL）

画像へのアクセスには**署名付きURL**を使用します。

```
通常URL（Public）:
http://127.0.0.1:54521/storage/v1/object/public/aredoko-images/photos/xxx.jpg
↓
署名付きURL（Private）:
http://127.0.0.1:54521/storage/v1/object/sign/aredoko-images/photos/xxx.jpg?token=eyJhbG...
```

## 署名付きURLの仕組み

### 1. URL生成フロー

```
┌─────────┐    ①認証済みリクエスト    ┌──────────┐
│ブラウザ │ ─────────────────────────► │バックエンド│
└─────────┘                           └──────────┘
                                            │
                                            │ ②署名付きURL生成
                                            ▼
                                      ┌──────────┐
                                      │ Supabase │
                                      │ Storage  │
                                      └──────────┘
                                            │
                                            │ ③署名付きURL返却
                                            ▼
┌─────────┐    ④画像取得              ┌──────────┐
│ブラウザ │ ◄───────────────────────── │バックエンド│
└─────────┘                           └──────────┘
     │
     │ ⑤署名付きURLで画像リクエスト
     ▼
┌──────────┐
│ Supabase │ ⑥トークン検証 → 画像返却
│ Storage  │
└──────────┘
```

### 2. トークンの構造

署名付きURLのtokenパラメータはJWT形式:

```json
{
  "url": "aredoko-images/photos/xxx.jpg",  // 対象ファイルパス
  "iat": 1767840040,                        // 発行時刻
  "exp": 1767843640                         // 有効期限（iat + 3600秒）
}
```

### 3. 有効期限

```python
# sam-backend/utils/storage.py
SIGNED_URL_EXPIRY_SECONDS = 3600  # 1時間
```

**1時間に設定した理由:**
- 短すぎると作業中に期限切れになる
- 長すぎるとURLが漏洩した場合のリスクが増大
- 1時間は妥当なバランス

## セキュリティ特性

### 保護される攻撃

| 攻撃 | 対策 |
|------|------|
| URLの推測 | UUIDによるランダムなファイル名 |
| URL漏洩後のアクセス | 有効期限切れで自動的に無効化 |
| 認証バイパス | バックエンド経由でのみURL取得可能 |
| ブルートフォース | JWTトークンの推測は計算量的に不可能 |

### 注意点

1. **トークンの共有禁止**
   - 署名付きURLを他人と共有すると、有効期限内はアクセス可能
   - ただし1時間で自動失効

2. **ブラウザキャッシュ**
   - ブラウザが画像をキャッシュするため、期限切れ後もローカルで表示される可能性
   - セキュリティ上は問題なし（新規取得には新しいトークンが必要）

3. **ログ出力注意**
   - 署名付きURLをログに出力しないこと
   - 出力する場合はトークン部分をマスク

## 実装箇所

### バックエンド

```
sam-backend/
├── utils/
│   └── storage.py        # get_image_url() - 署名付きURL生成
├── routers/
│   ├── photos.py         # _to_photo_response() - image_url変換
│   └── objects.py        # _to_object_response() - clipped_image_url変換
└── main.py               # startup_event - バケット初期化
```

### 設定

```
supabase/
└── config.toml           # [storage.buckets.aredoko-images] public=false
```

## 本番環境での追加考慮事項

### 1. RLS（Row Level Security）

本番Supabaseでは、Storage用のRLSポリシーも設定推奨:

```sql
-- 認証済みユーザーのみファイル操作可能
CREATE POLICY "Authenticated users can manage files"
ON storage.objects
FOR ALL
USING (auth.role() = 'authenticated');
```

### 2. 有効期限の調整

環境変数で調整可能にする場合:

```python
import os
SIGNED_URL_EXPIRY_SECONDS = int(os.getenv("STORAGE_URL_EXPIRY", "3600"))
```

### 3. 監査ログ

本番では画像アクセスログの収集を検討:
- 誰が、いつ、どの画像にアクセスしたか
- 不正アクセスの検知

## トラブルシューティング

### 画像が表示されない

1. **「Bucket not found」エラー**
   - Supabase再起動後にバケットが消えている可能性
   - バックエンドを再起動するとバケットが自動作成される

2. **「Token expired」エラー**
   - ページを再読み込みして新しい署名付きURLを取得

3. **「Invalid token」エラー**
   - バックエンドとSupabaseのJWTシークレットが一致しているか確認

## CORS（クロスオリジン）対応

### 問題

フロントエンド（localhost:5173）とSupabase Storage（127.0.0.1:54521）は異なるオリジンです。
CanvasでStorage画像を操作しようとすると「Tainted canvas」エラーが発生します。

```
SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement':
Tainted canvases may not be exported.
```

### 解決方法

画像読み込み時に `crossOrigin = "anonymous"` を指定:

```tsx
// Image オブジェクト
const img = new Image()
img.crossOrigin = 'anonymous'
img.src = imageUrl

// img タグ
<img src={imageUrl} crossOrigin="anonymous" />
```

### 対応箇所

| ファイル | 対応内容 |
|----------|----------|
| `src/utils/imageUtils.ts` | clipImage, clipImageWithPolygon |
| `src/components/PolygonSelector/PolygonSelector.tsx` | 画像ロード |
| `src/components/RectSelector/RectSelector.tsx` | img タグ |
| `src/components/PhotoViewer/PhotoViewer.tsx` | img タグ |

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-01-08 | 初版作成。Public→Private+署名付きURL方式に変更 |
| 2026-01-08 | CORS対応（crossOrigin属性追加）を追記 |
