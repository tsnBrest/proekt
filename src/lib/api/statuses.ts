import { supabase } from '@/lib/supabase';
import type { Status, StatusCategory, StatusInput } from '@/types/directory';

export async function fetchStatusesByCategory(category: StatusCategory): Promise<Status[]> {
  const { data, error } = await supabase
    .from('statuses')
    .select('id, name, category')
    .eq('category', category)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Status[];
}

export async function fetchAllStatuses(): Promise<Status[]> {
  const { data, error } = await supabase
    .from('statuses')
    .select('id, name, category')
    .order('category, name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Status[];
}

export async function createStatus(input: StatusInput): Promise<void> {
  const { error } = await supabase.from('statuses').insert(input);
  if (error) throw error;
}

export async function updateStatus(id: string, input: StatusInput): Promise<void> {
  const { error } = await supabase
    .from('statuses')
    .update({ ...input, created_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteStatus(id: string): Promise<void> {
  const { error } = await supabase.from('statuses').delete().eq('id', id);
  if (error) throw error;
}
