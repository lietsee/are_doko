"""
Supabase Storage操作ユーティリティ

セキュリティ設計:
- バケットは常にPrivate設定（認証なしではアクセス不可）
- 画像URLは署名付きURL（Signed URL）を使用
- 署名付きURLは一定時間のみ有効（デフォルト1時間）
- 本番・開発環境どちらも同じセキュリティレベル

詳細は docs/storage-security.md を参照
"""

import base64
import re
from database import get_supabase_client

BUCKET_NAME = "aredoko-images"

# 署名付きURLの有効期限（秒）
# 1時間 = 3600秒（長時間の作業にも対応）
SIGNED_URL_EXPIRY_SECONDS = 3600

# バケット作成済みフラグ
_bucket_ensured = False


def ensure_bucket_exists() -> None:
    """
    バケットが存在しない場合は作成する

    セキュリティ: バケットは常にPrivate設定
    - 認証なしでの直接アクセスを防止
    - 画像へのアクセスは署名付きURLを使用
    """
    global _bucket_ensured
    if _bucket_ensured:
        return

    client = get_supabase_client()
    try:
        # バケット一覧を取得
        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]

        if BUCKET_NAME not in bucket_names:
            # バケットを作成（private=デフォルト）
            client.storage.create_bucket(BUCKET_NAME, options={"public": False})
            print(f"Created private bucket: {BUCKET_NAME}")
        else:
            # 既存バケットがpublicの場合はprivateに更新（セキュリティ強化）
            bucket = next((b for b in buckets if b.name == BUCKET_NAME), None)
            if bucket and bucket.public:
                client.storage.update_bucket(BUCKET_NAME, options={"public": False})
                print(f"Updated bucket to private: {BUCKET_NAME}")

        _bucket_ensured = True
    except Exception as e:
        print(f"Error ensuring bucket: {e}")


def upload_image(path: str, data_url: str) -> str:
    """
    base64データURLをStorageにアップロード

    Args:
        path: Storage内のパス (例: "photos/xxx.jpg")
        data_url: base64エンコードされたデータURL

    Returns:
        アップロードされたパス
    """
    # バケットが存在することを確認
    ensure_bucket_exists()

    # data:image/jpeg;base64,... 形式をパース
    match = re.match(r"data:image/(\w+);base64,(.+)", data_url)
    if not match:
        raise ValueError("Invalid data URL format")

    image_type = match.group(1)
    base64_data = match.group(2)

    # base64をバイナリに変換
    image_bytes = base64.b64decode(base64_data)

    # Content-Typeを設定
    content_type = f"image/{image_type}"
    if image_type == "jpg":
        content_type = "image/jpeg"

    # アップロード
    client = get_supabase_client()
    client.storage.from_(BUCKET_NAME).upload(
        path,
        image_bytes,
        {"content-type": content_type}
    )

    return path


def delete_image(path: str) -> None:
    """
    Storageから画像を削除

    Args:
        path: Storage内のパス
    """
    client = get_supabase_client()
    client.storage.from_(BUCKET_NAME).remove([path])


def get_image_url(path: str) -> str:
    """
    画像の署名付きURLを取得

    セキュリティ:
    - 署名付きURLは一定時間のみ有効（SIGNED_URL_EXPIRY_SECONDS）
    - URLを知っていても期限切れ後はアクセス不可
    - バックエンド経由でのみURL取得可能（認証必須）

    Args:
        path: Storage内のパス

    Returns:
        署名付きURL（有効期限付き）
    """
    client = get_supabase_client()
    result = client.storage.from_(BUCKET_NAME).create_signed_url(
        path,
        SIGNED_URL_EXPIRY_SECONDS
    )
    return result["signedURL"]
