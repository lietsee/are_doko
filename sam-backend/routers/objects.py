"""
オブジェクトAPIルーター
"""

import uuid
from fastapi import APIRouter, HTTPException
from database import get_supabase_client
from models import StorageObject, StorageObjectCreate, StorageObjectUpdate
from utils import upload_image, delete_image, get_image_url

router = APIRouter(prefix="/api", tags=["objects"])


def _to_object_response(data: dict) -> dict:
    """DBレコードをAPIレスポンス用に変換（clipped_image_path → clipped_image_url）"""
    result = {**data}
    if "clipped_image_path" in result:
        result["clipped_image_url"] = get_image_url(result.pop("clipped_image_path"))
    return result


@router.get("/photos/{photo_id}/objects", response_model=list[StorageObject])
async def list_objects(photo_id: str):
    """写真内のオブジェクト一覧を取得"""
    client = get_supabase_client()
    response = client.table("aredoko_objects").select("*").eq("photo_id", photo_id).order("display_order").execute()
    return [_to_object_response(o) for o in response.data]


@router.get("/objects/{object_id}", response_model=StorageObject)
async def get_object(object_id: str):
    """オブジェクトを取得"""
    client = get_supabase_client()
    response = client.table("aredoko_objects").select("*").eq("id", object_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Object not found")
    return _to_object_response(response.data)


@router.post("/photos/{photo_id}/objects", response_model=StorageObject, status_code=201)
async def create_object(photo_id: str, data: StorageObjectCreate):
    """オブジェクトを作成"""
    client = get_supabase_client()

    # display_orderを取得
    existing = client.table("aredoko_objects").select("display_order").eq("photo_id", photo_id).order("display_order", desc=True).limit(1).execute()
    next_order = (existing.data[0]["display_order"] + 1) if existing.data else 0

    # クリップ画像をStorageにアップロード
    object_id = str(uuid.uuid4())
    image_path = f"objects/{object_id}.png"
    upload_image(image_path, data.clipped_image_data_url)

    # DBに保存
    response = client.table("aredoko_objects").insert({
        "id": object_id,
        "photo_id": photo_id,
        "name": data.name,
        "memo": data.memo,
        "clipped_image_path": image_path,
        "mask_type": data.mask_type,
        "mask_data": data.mask_data,
        "click_point": {"x": data.click_point.x, "y": data.click_point.y},
        "display_order": next_order,
    }).execute()
    return _to_object_response(response.data[0])


@router.put("/objects/{object_id}", response_model=StorageObject)
async def update_object(object_id: str, data: StorageObjectUpdate):
    """オブジェクトを更新（楽観的ロック付き）"""
    client = get_supabase_client()

    # 現在のバージョンを確認
    current = client.table("aredoko_objects").select("*").eq("id", object_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Object not found")

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
    response = client.table("aredoko_objects").update({
        "name": data.name,
        "memo": data.memo,
    }).eq("id", object_id).execute()
    return _to_object_response(response.data[0])


@router.delete("/objects/{object_id}", status_code=204)
async def delete_object(object_id: str):
    """オブジェクトを削除"""
    client = get_supabase_client()

    # 画像パスを取得
    obj = client.table("aredoko_objects").select("clipped_image_path").eq("id", object_id).single().execute()
    if obj.data:
        # Storageから画像を削除
        delete_image(obj.data["clipped_image_path"])

    # DBから削除
    client.table("aredoko_objects").delete().eq("id", object_id).execute()
