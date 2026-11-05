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

export async function createClient(input: ClientInput): Promise<void> {
  const { error } = await supabase.from('clients').insert(input);
  if (error) throw error;
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
