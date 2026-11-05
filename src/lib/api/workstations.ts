import { supabase } from '@/lib/supabase';
import type { Workstation, WorkstationInput } from '@/types/directory';

export async function fetchWorkstations(): Promise<Workstation[]> {
  const { data, error } = await supabase
    .from('workstations')
    .select('id, token_number, model, software_version, client_id, installation_address, client:clients(name)')
    .order('model');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Workstation[];
}

export async function createWorkstation(input: WorkstationInput): Promise<void> {
  const { error } = await supabase.from('workstations').insert(input);
  if (error) throw error;
}

export async function updateWorkstation(id: string, input: WorkstationInput): Promise<void> {
  const { error } = await supabase
    .from('workstations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWorkstation(id: string): Promise<void> {
  const { error } = await supabase.from('workstations').delete().eq('id', id);
  if (error) throw error;
}
