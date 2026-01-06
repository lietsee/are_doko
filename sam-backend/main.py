"""
SAM (Segment Anything Model) Backend Server
are_doko アプリ用のセグメンテーションAPI
"""

import base64
import io
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from PIL import Image

from sam_service import SAMService

app = FastAPI(
    title="are_doko SAM API",
    description="Segment Anything Model API for are_doko app",
    version="1.0.0",
)

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SAMサービスのインスタンス（遅延初期化）
sam_service: Optional[SAMService] = None


def get_sam_service() -> SAMService:
    """SAMサービスのシングルトンを取得"""
    global sam_service
    if sam_service is None:
        sam_service = SAMService()
    return sam_service


class SegmentRequest(BaseModel):
    """セグメンテーションリクエスト"""
    image_base64: str  # Base64エンコードされた画像（data:prefix除く）
    click_x: int  # クリックX座標（元画像ピクセル座標）
    click_y: int  # クリックY座標（元画像ピクセル座標）


class Position(BaseModel):
    """座標"""
    x: float
    y: float


class BoundingBox(BaseModel):
    """バウンディングボックス"""
    x: float
    y: float
    width: float
    height: float


class SegmentResponse(BaseModel):
    """セグメンテーションレスポンス"""
    polygon: list[Position]  # ポリゴン頂点リスト
    bounding_box: BoundingBox  # バウンディングボックス


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    error: str
    code: str


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "ok", "message": "SAM API is running"}


@app.get("/health")
async def health_check():
    """詳細ヘルスチェック"""
    service = get_sam_service()
    return {
        "status": "ok",
        "model_loaded": service.is_loaded(),
        "model_type": service.model_type,
    }


@app.post("/api/segment", response_model=SegmentResponse)
async def segment(request: SegmentRequest):
    """
    画像上のクリック点からオブジェクト領域を検出

    - image_base64: Base64エンコードされた画像（data:prefix除く）
    - click_x: クリックX座標（元画像ピクセル座標）
    - click_y: クリックY座標（元画像ピクセル座標）
    """
    try:
        # Base64デコード
        try:
            # data:image/...;base64, プレフィックスがある場合は除去
            image_data = request.image_base64
            if "," in image_data:
                image_data = image_data.split(",")[1]

            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            # RGBに変換（PNGのアルファチャンネル対応）
            if image.mode != "RGB":
                image = image.convert("RGB")

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={"error": "画像のデコードに失敗しました", "code": "INVALID_FORMAT"},
            )

        # 画像サイズチェック
        width, height = image.size
        if width > 4096 or height > 4096:
            raise HTTPException(
                status_code=400,
                detail={"error": "画像サイズが大きすぎます（最大4096x4096）", "code": "IMAGE_TOO_LARGE"},
            )

        # クリック座標の検証
        if request.click_x < 0 or request.click_x >= width:
            raise HTTPException(
                status_code=400,
                detail={"error": "クリックX座標が画像範囲外です", "code": "INVALID_COORDINATES"},
            )
        if request.click_y < 0 or request.click_y >= height:
            raise HTTPException(
                status_code=400,
                detail={"error": "クリックY座標が画像範囲外です", "code": "INVALID_COORDINATES"},
            )

        # SAMでセグメンテーション
        service = get_sam_service()
        result = service.segment(
            image=np.array(image),
            click_point=(request.click_x, request.click_y),
        )

        if result is None:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "オブジェクトが検出できませんでした。別の場所をクリックしてください",
                    "code": "NO_OBJECT_FOUND",
                },
            )

        return SegmentResponse(
            polygon=[Position(x=p[0], y=p[1]) for p in result["polygon"]],
            bounding_box=BoundingBox(
                x=result["bounding_box"][0],
                y=result["bounding_box"][1],
                width=result["bounding_box"][2],
                height=result["bounding_box"][3],
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Segmentation error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "サーバーエラーが発生しました", "code": "SERVER_ERROR"},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
