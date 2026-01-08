"""
写真APIルーター
"""

import uuid
from fastapi import APIRouter, HTTPException
from database import get_supabase_client
from models import Photo, PhotoCreate, PhotoUpdate
from utils import upload_image, delete_image, get_image_url

router = APIRouter(prefix="/api", tags=["photos"])


def _to_photo_response(data: dict) -> dict:
    """DBレコードをAPIレスポンス用に変換（image_path → image_url）"""
    result = {**data}
    if "image_path" in result:
        result["image_url"] = get_image_url(result.pop("image_path"))
    return result


@router.get("/warehouses/{warehouse_id}/photos", response_model=list[Photo])
async def list_photos(warehouse_id: str):
    """倉庫内の写真一覧を取得"""
    client = get_supabase_client()
    response = client.table("aredoko_photos").select("*").eq("warehouse_id", warehouse_id).order("display_order").execute()
    return [_to_photo_response(p) for p in response.data]


@router.get("/photos/{photo_id}", response_model=Photo)
async def get_photo(photo_id: str):
    """写真を取得"""
    client = get_supabase_client()
    response = client.table("aredoko_photos").select("*").eq("id", photo_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Photo not found")
    return _to_photo_response(response.data)


@router.post("/warehouses/{warehouse_id}/photos", response_model=Photo, status_code=201)
async def create_photo(warehouse_id: str, data: PhotoCreate):
    """写真を作成"""
    client = get_supabase_client()

    # display_orderを取得
    existing = client.table("aredoko_photos").select("display_order").eq("warehouse_id", warehouse_id).order("display_order", desc=True).limit(1).execute()
    next_order = (existing.data[0]["display_order"] + 1) if existing.data else 0

    # 画像をStorageにアップロード
    photo_id = str(uuid.uuid4())
    image_path = f"photos/{photo_id}.jpg"
    upload_image(image_path, data.image_data_url)

    # DBに保存
    response = client.table("aredoko_photos").insert({
        "id": photo_id,
        "warehouse_id": warehouse_id,
        "name": data.name,
        "image_path": image_path,
        "width": data.width,
        "height": data.height,
        "display_order": next_order,
    }).execute()
    return _to_photo_response(response.data[0])


@router.put("/photos/{photo_id}", response_model=Photo)
async def update_photo(photo_id: str, data: PhotoUpdate):
    """写真を更新（楽観的ロック付き）"""
    client = get_supabase_client()

    # 現在のバージョンを確認
    current = client.table("aredoko_photos").select("*").eq("id", photo_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    if current.data["version"] != data.version:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "VERSION_CONFLICT",
                "message": "データが他で更新されました",
                "server_data": current.data,
            }
        )

    # 更新
    response = client.table("aredoko_photos").update({
        "name": data.name,
    }).eq("id", photo_id).execute()
    return _to_photo_response(response.data[0])


@router.delete("/photos/{photo_id}", status_code=204)
async def delete_photo(photo_id: str):
    """写真を削除"""
    client = get_supabase_client()

    # 画像パスを取得
    photo = client.table("aredoko_photos").select("image_path").eq("id", photo_id).single().execute()
    if photo.data:
        # Storageから画像を削除
        delete_image(photo.data["image_path"])

    # DBから削除
    client.table("aredoko_photos").delete().eq("id", photo_id).execute()
