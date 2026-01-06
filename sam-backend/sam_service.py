"""
SAM (Segment Anything Model) Service
モデルのロードとセグメンテーション処理を担当
"""

import os
from typing import Optional
import numpy as np

# SAMのインポート（インストールされていない場合はダミーモード）
try:
    import torch
    from segment_anything import sam_model_registry, SamPredictor
    SAM_AVAILABLE = True
except ImportError:
    SAM_AVAILABLE = False
    print("Warning: SAM not available. Running in dummy mode.")


class SAMService:
    """SAMモデルのラッパーサービス"""

    # サポートするモデルタイプ
    MODEL_TYPES = {
        "vit_h": "sam_vit_h_4b8939.pth",  # 大きい、高精度
        "vit_l": "sam_vit_l_0b3195.pth",  # 中間
        "vit_b": "sam_vit_b_01ec64.pth",  # 小さい、高速
    }

    def __init__(self, model_type: str = "vit_b", checkpoint_path: Optional[str] = None):
        """
        SAMサービスを初期化

        Args:
            model_type: モデルタイプ（vit_h, vit_l, vit_b）
            checkpoint_path: モデルチェックポイントのパス（Noneの場合は自動検出）
        """
        self.model_type = model_type
        self.predictor: Optional["SamPredictor"] = None
        self._current_image: Optional[np.ndarray] = None

        if not SAM_AVAILABLE:
            print("SAM is not available. Using dummy mode.")
            return

        # チェックポイントパスの決定
        if checkpoint_path is None:
            # デフォルトのパスを探す
            checkpoint_name = self.MODEL_TYPES.get(model_type)
            if checkpoint_name is None:
                raise ValueError(f"Unknown model type: {model_type}")

            # 候補パス
            candidate_paths = [
                os.path.join(os.path.dirname(__file__), "checkpoints", checkpoint_name),
                os.path.join(os.path.expanduser("~"), ".cache", "sam", checkpoint_name),
                os.path.join("/tmp", checkpoint_name),
            ]

            for path in candidate_paths:
                if os.path.exists(path):
                    checkpoint_path = path
                    break

        if checkpoint_path and os.path.exists(checkpoint_path):
            self._load_model(checkpoint_path)
        else:
            print(f"Warning: Checkpoint not found. SAM will run in dummy mode.")
            print(f"Please download the checkpoint and place it in one of:")
            print(f"  - ./checkpoints/{self.MODEL_TYPES.get(model_type)}")
            print(f"  - ~/.cache/sam/{self.MODEL_TYPES.get(model_type)}")

    def _load_model(self, checkpoint_path: str):
        """モデルをロード"""
        if not SAM_AVAILABLE:
            return

        print(f"Loading SAM model from {checkpoint_path}...")

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")

        sam = sam_model_registry[self.model_type](checkpoint=checkpoint_path)
        sam.to(device=device)

        self.predictor = SamPredictor(sam)
        print("SAM model loaded successfully!")

    def is_loaded(self) -> bool:
        """モデルがロードされているか"""
        return self.predictor is not None

    def segment(
        self,
        image: np.ndarray,
        click_point: tuple[int, int],
    ) -> Optional[dict]:
        """
        クリック点からオブジェクト領域を検出

        Args:
            image: RGB画像（H, W, 3）
            click_point: クリック座標 (x, y)

        Returns:
            {
                "polygon": [(x1, y1), (x2, y2), ...],
                "bounding_box": (x, y, width, height),
            }
            または None（検出失敗時）
        """
        if not SAM_AVAILABLE or self.predictor is None:
            # ダミーモード: クリック点を中心とした矩形を返す
            return self._dummy_segment(image, click_point)

        # 画像をセット（同じ画像なら再利用）
        if self._current_image is None or not np.array_equal(self._current_image, image):
            self.predictor.set_image(image)
            self._current_image = image.copy()

        # クリック点でセグメンテーション
        input_point = np.array([[click_point[0], click_point[1]]])
        input_label = np.array([1])  # 1 = foreground

        masks, scores, _ = self.predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=True,
        )

        # スコア閾値を満たす中で最大面積のマスクを選択
        # （部分的な高スコアより全体を優先）
        MIN_SCORE_THRESHOLD = 0.5
        valid_indices = [i for i, s in enumerate(scores) if s >= MIN_SCORE_THRESHOLD]

        if not valid_indices:
            # フォールバック: 閾値を満たすマスクがない場合は最高スコアを選択
            best_idx = np.argmax(scores)
        else:
            # 閾値を満たすマスクの中で最大面積を選択
            areas = [masks[i].sum() for i in valid_indices]
            best_idx = valid_indices[np.argmax(areas)]

        mask = masks[best_idx]

        # マスクが空の場合
        if not mask.any():
            return None

        # マスクからポリゴンとバウンディングボックスを抽出
        return self._mask_to_result(mask)

    def _dummy_segment(
        self,
        image: np.ndarray,
        click_point: tuple[int, int],
    ) -> dict:
        """ダミーのセグメンテーション（SAMなしの場合）"""
        h, w = image.shape[:2]
        cx, cy = click_point

        # クリック点を中心とした矩形（画像の10%程度のサイズ）
        size = min(w, h) // 10
        half = size // 2

        x1 = max(0, cx - half)
        y1 = max(0, cy - half)
        x2 = min(w, cx + half)
        y2 = min(h, cy + half)

        return {
            "polygon": [
                (x1, y1),
                (x2, y1),
                (x2, y2),
                (x1, y2),
            ],
            "bounding_box": (x1, y1, x2 - x1, y2 - y1),
        }

    def _mask_to_result(self, mask: np.ndarray) -> dict:
        """マスクからポリゴンとバウンディングボックスを抽出"""
        import cv2

        # マスクをuint8に変換
        mask_uint8 = (mask * 255).astype(np.uint8)

        # 輪郭を検出
        contours, _ = cv2.findContours(
            mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return None

        # 最大の輪郭を取得
        largest_contour = max(contours, key=cv2.contourArea)

        # 輪郭を簡略化
        epsilon = 0.005 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)

        # ポリゴン座標
        polygon = [(int(p[0][0]), int(p[0][1])) for p in approx]

        # バウンディングボックス
        x, y, w, h = cv2.boundingRect(largest_contour)

        return {
            "polygon": polygon,
            "bounding_box": (x, y, w, h),
        }
