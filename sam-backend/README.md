# SAM Backend for are_doko

Segment Anything Model (SAM) を使用したセグメンテーションAPIサーバー。

## セットアップ

### 1. Python環境の作成

```bash
cd sam-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. SAMチェックポイントのダウンロード

以下のいずれかのモデルをダウンロードし、`checkpoints/` フォルダに配置:

| モデル | サイズ | 精度 | ダウンロード |
|--------|--------|------|--------------|
| vit_b | 375MB | 標準 | [sam_vit_b_01ec64.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth) |
| vit_l | 1.2GB | 高 | [sam_vit_l_0b3195.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth) |
| vit_h | 2.4GB | 最高 | [sam_vit_h_4b8939.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth) |

```bash
mkdir -p checkpoints
cd checkpoints
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth
```

### 4. サーバー起動

```bash
python main.py
# または
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

サーバーは http://localhost:8000 で起動します。

## API

### ヘルスチェック

```
GET /
GET /health
```

### セグメンテーション

```
POST /api/segment
Content-Type: application/json

{
  "image_base64": "...",  // Base64画像（data:prefix含む可）
  "click_x": 150,         // クリックX座標
  "click_y": 200          // クリックY座標
}
```

レスポンス:

```json
{
  "polygon": [
    {"x": 100, "y": 150},
    {"x": 200, "y": 150},
    {"x": 200, "y": 250},
    {"x": 100, "y": 250}
  ],
  "bounding_box": {
    "x": 100,
    "y": 150,
    "width": 100,
    "height": 100
  }
}
```

## ダミーモード

SAMチェックポイントがない場合、サーバーはダミーモードで動作します。
クリック点を中心とした矩形を返します（開発・テスト用）。

## GPU対応

CUDA対応GPUが利用可能な場合、自動的にGPUを使用します。

```bash
# GPU使用状況の確認
python -c "import torch; print(torch.cuda.is_available())"
```
