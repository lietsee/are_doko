"""
オブジェクト（保管物）モデル
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Any


class Position(BaseModel):
    x: float
    y: float


class StorageObjectBase(BaseModel):
    name: str
    memo: str = ""


class StorageObjectCreate(StorageObjectBase):
    clipped_image_data_url: str  # base64エンコードされたクリップ画像
    mask_type: str  # 'polygon' or 'rect'
    mask_data: dict[str, Any]  # マスク情報
    click_point: Position


class StorageObjectUpdate(StorageObjectBase):
    version: int  # 楽観的ロック用


class StorageObject(StorageObjectBase):
    id: str
    photo_id: str
    clipped_image_url: str  # Storage URL
    mask_type: str
    mask_data: dict[str, Any]
    click_point: Position
    display_order: int
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True
