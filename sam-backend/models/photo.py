"""
写真モデル
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PhotoBase(BaseModel):
    name: str
    width: int
    height: int


class PhotoCreate(PhotoBase):
    image_data_url: str  # base64エンコードされた画像データ


class PhotoUpdate(BaseModel):
    name: str
    version: int  # 楽観的ロック用


class Photo(PhotoBase):
    id: str
    warehouse_id: str
    image_url: str  # Storage URL
    display_order: int
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True
