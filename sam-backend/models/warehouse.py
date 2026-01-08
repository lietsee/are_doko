"""
倉庫モデル
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WarehouseBase(BaseModel):
    name: str
    memo: str = ""


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(WarehouseBase):
    version: int  # 楽観的ロック用


class Warehouse(WarehouseBase):
    id: str
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True
