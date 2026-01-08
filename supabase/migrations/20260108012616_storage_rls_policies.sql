-- Storage RLSポリシー設定
-- aredoko-images バケット用

-- バケットの確認/作成（存在しない場合）
INSERT INTO storage.buckets (id, name, public)
VALUES ('aredoko-images', 'aredoko-images', false)
ON CONFLICT (id) DO NOTHING;

-- 認証済みユーザーのみアップロード可能
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aredoko-images'
  AND auth.role() = 'authenticated'
);

-- 認証済みユーザーのみ閲覧可能
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'aredoko-images'
  AND auth.role() = 'authenticated'
);

-- 認証済みユーザーのみ更新可能
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'aredoko-images'
  AND auth.role() = 'authenticated'
);

-- 認証済みユーザーのみ削除可能
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'aredoko-images'
  AND auth.role() = 'authenticated'
);
