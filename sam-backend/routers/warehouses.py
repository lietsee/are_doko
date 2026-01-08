"""
倉庫APIルーター
"""

from fastapi import APIRouter, HTTPException
from database import get_supabase_client
from models import Warehouse, WarehouseCreate, WarehouseUpdate

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=list[Warehouse])
async def list_warehouses():
    """倉庫一覧を取得"""
    client = get_supabase_client()
    response = client.table("aredoko_warehouses").select("*").order("created_at").execute()
    return response.data


@router.get("/{warehouse_id}", response_model=Warehouse)
async def get_warehouse(warehouse_id: str):
    """倉庫を取得"""
    client = get_supabase_client()
    response = client.table("aredoko_warehouses").select("*").eq("id", warehouse_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return response.data


@router.post("", response_model=Warehouse, status_code=201)
async def create_warehouse(data: WarehouseCreate):
    """倉庫を作成"""
    client = get_supabase_client()
    response = client.table("aredoko_warehouses").insert({
        "name": data.name,
        "memo": data.memo,
    }).execute()
    return response.data[0]


@router.put("/{warehouse_id}", response_model=Warehouse)
async def update_warehouse(warehouse_id: str, data: WarehouseUpdate):
    """倉庫を更新（楽観的ロック付き）"""
    client = get_supabase_client()

    # 現在のバージョンを確認
    current = client.table("aredoko_warehouses").select("*").eq("id", warehouse_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Warehouse not found")

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
    response = client.table("aredoko_warehouses").update({
        "name": data.name,
        "memo": data.memo,
    }).eq("id", warehouse_id).execute()
    return response.data[0]


@router.delete("/{warehouse_id}", status_code=204)
async def delete_warehouse(warehouse_id: str):
    """倉庫を削除"""
    client = get_supabase_client()
    client.table("aredoko_warehouses").delete().eq("id", warehouse_id).execute()
