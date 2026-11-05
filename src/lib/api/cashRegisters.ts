import { supabase } from '@/lib/supabase';
import type { CashRegister, CashRegisterInput } from '@/types/directory';

export async function fetchCashRegisters(): Promise<CashRegister[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('id, model, serial_number, software_version, client_id, installation_address, client:clients(name)')
    .order('model');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CashRegister[];
}

export async function createCashRegister(input: CashRegisterInput): Promise<void> {
  const { error } = await supabase.from('equipment').insert(input);
  if (error) throw error;
}

export async function updateCashRegister(id: string, input: CashRegisterInput): Promise<void> {
  const { error } = await supabase
    .from('equipment')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCashRegister(id: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}
