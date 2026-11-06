import { supabase } from '@/lib/supabase';
import type { Client, ClientInput } from '@/types/directory';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, bank:banks(name)')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function fetchRegisteredByValues(): Promise<string[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('registered_by')
    .neq('registered_by', '')
    .order('registered_by');
  if (error) throw new Error(error.message);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of data ?? []) {
    const value = (row as { registered_by: string }).registered_by;
    if (value && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(input)
    .select('*, bank:banks(name)')
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}
