/*
# Create document_templates table and storage bucket

1. New Tables
- `document_templates`
  - `id` (uuid, primary key)
  - `name` (text, not null) — display name for the template
  - `file_path` (text, not null) — path in storage bucket
  - `description` (text, not null, default '') — optional description
  - `created_at` (timestamptz, default now())

2. Storage
- Create bucket 'document_templates' (public read, authenticated write)
- Policies: anon+authenticated can read; anon+authenticated can upload/update/delete

3. Security
- RLS enabled on document_templates
- CRUD granted to anon+authenticated (single-tenant no-auth)
*/

CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON document_templates TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_templates" ON document_templates;
CREATE POLICY "anon_select_templates" ON document_templates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_templates" ON document_templates;
CREATE POLICY "anon_insert_templates" ON document_templates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_templates" ON document_templates;
CREATE POLICY "anon_update_templates" ON document_templates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_templates" ON document_templates;
CREATE POLICY "anon_delete_templates" ON document_templates FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('document_templates', 'document_templates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_template_files" ON storage.objects;
CREATE POLICY "anon_read_template_files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'document_templates');

DROP POLICY IF EXISTS "anon_write_template_files" ON storage.objects;
CREATE POLICY "anon_write_template_files" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'document_templates');

DROP POLICY IF EXISTS "anon_update_template_files" ON storage.objects;
CREATE POLICY "anon_update_template_files" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'document_templates')
  WITH CHECK (bucket_id = 'document_templates');

DROP POLICY IF EXISTS "anon_delete_template_files" ON storage.objects;
CREATE POLICY "anon_delete_template_files" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'document_templates');
