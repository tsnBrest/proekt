import { supabase } from '@/lib/supabase';
import type { DocumentTemplate, DocumentTemplateInput } from '@/types/directory';

const BUCKET = 'document_templates';

export async function fetchDocumentTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('id, name, file_path, description, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentTemplate[];
}

export async function uploadTemplateFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'docx';
  const fileName = `${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return fileName;
}

export async function createTemplate(input: DocumentTemplateInput): Promise<void> {
  const { error } = await supabase.from('document_templates').insert(input);
  if (error) throw error;
}

export async function deleteTemplate(id: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (storageError) throw new Error(storageError.message);
  const { error } = await supabase.from('document_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function downloadTemplateFile(filePath: string): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) throw new Error(error.message);
  return await data.arrayBuffer();
}
