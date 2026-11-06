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

export async function suggestNextContractNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('contracts')
    .select('number')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const last = (data ?? [])[0]?.number;
  if (!last) return '';
  const match = last.match(/^(\d+)/);
  if (!match) return '';
  const nextNum = parseInt(match[1], 10) + 1;
  return String(nextNum);
}
