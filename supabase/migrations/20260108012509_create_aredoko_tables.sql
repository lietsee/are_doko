-- are_doko テーブル作成マイグレーション
-- 全社員で同じデータを共有（user_id不要）

-- ========================================
-- 1. テーブル作成
-- ========================================

-- 倉庫テーブル
CREATE TABLE aredoko_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  memo TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- 写真テーブル
CREATE TABLE aredoko_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES aredoko_warehouses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  image_path VARCHAR(1024) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- オブジェクトテーブル
CREATE TABLE aredoko_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES aredoko_photos(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  memo TEXT DEFAULT '',
  clipped_image_path VARCHAR(1024) NOT NULL,
  mask_type VARCHAR(20) NOT NULL CHECK (mask_type IN ('polygon', 'rect')),
  mask_data JSONB NOT NULL,
  click_point JSONB NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- ========================================
-- 2. インデックス
-- ========================================

CREATE INDEX idx_aredoko_photos_warehouse ON aredoko_photos(warehouse_id);
CREATE INDEX idx_aredoko_photos_display_order ON aredoko_photos(warehouse_id, display_order);
CREATE INDEX idx_aredoko_objects_photo ON aredoko_objects(photo_id);
CREATE INDEX idx_aredoko_objects_display_order ON aredoko_objects(photo_id, display_order);

-- ========================================
-- 3. RLSポリシー（認証済みユーザーのみアクセス可能）
-- ========================================

-- 倉庫
ALTER TABLE aredoko_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view warehouses"
  ON aredoko_warehouses FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert warehouses"
  ON aredoko_warehouses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update warehouses"
  ON aredoko_warehouses FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete warehouses"
  ON aredoko_warehouses FOR DELETE
  USING (auth.role() = 'authenticated');

-- 写真
ALTER TABLE aredoko_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view photos"
  ON aredoko_photos FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert photos"
  ON aredoko_photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update photos"
  ON aredoko_photos FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete photos"
  ON aredoko_photos FOR DELETE
  USING (auth.role() = 'authenticated');

-- オブジェクト
ALTER TABLE aredoko_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view objects"
  ON aredoko_objects FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert objects"
  ON aredoko_objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update objects"
  ON aredoko_objects FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete objects"
  ON aredoko_objects FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========================================
-- 4. バージョン自動更新トリガー（楽観的ロック用）
-- ========================================

CREATE OR REPLACE FUNCTION aredoko_update_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_aredoko_warehouses_version
  BEFORE UPDATE ON aredoko_warehouses
  FOR EACH ROW EXECUTE FUNCTION aredoko_update_version();

CREATE TRIGGER tr_aredoko_photos_version
  BEFORE UPDATE ON aredoko_photos
  FOR EACH ROW EXECUTE FUNCTION aredoko_update_version();

CREATE TRIGGER tr_aredoko_objects_version
  BEFORE UPDATE ON aredoko_objects
  FOR EACH ROW EXECUTE FUNCTION aredoko_update_version();
