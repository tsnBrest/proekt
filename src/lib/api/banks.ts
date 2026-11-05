import { supabase } from '@/lib/supabase';
import type { Bank, BankInput } from '@/types/directory';

export const DUPLICATE_ERROR_CODE = '23505';

export async function fetchBanks(): Promise<Bank[]> {
  const { data, error } = await supabase
    .from('banks')
    .select('id, name, address')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Bank[];
}

export async function createBank(input: BankInput): Promise<void> {
  const { error } = await supabase.from('banks').insert(input);
  if (error) throw error;
}

export async function updateBank(id: string, input: BankInput): Promise<void> {
  const { error } = await supabase.from('banks').update(input).eq('id', id);
  if (error) throw error;
}
