import { supabase } from '@/lib/supabase';
import type { Contract, ContractInput } from '@/types/directory';

export async function fetchContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, number, client_id, client:clients(name)')
    .order('number');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Contract[];
}

export async function createContract(input: ContractInput): Promise<void> {
  const { error } = await supabase.from('contracts').insert(input);
  if (error) throw error;
}

export async function updateContract(id: string, input: ContractInput): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
}
