
CREATE POLICY "campusgram_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'campusgram');
CREATE POLICY "campusgram_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campusgram' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "campusgram_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'campusgram' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "campusgram_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'campusgram' AND auth.uid()::text = (storage.foldername(name))[1]);
