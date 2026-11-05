import { supabase } from '@/lib/supabase';
import type {
  CashRegisterOperation,
  CashRegisterOperationInput,
  CashRegisterOperationType,
} from '@/types/directory';

export async function fetchOperations(
  operationType?: CashRegisterOperationType,
): Promise<CashRegisterOperation[]> {
  let query = supabase
    .from('cash_register_operations')
    .select('id, equipment_id, operation_type, operation_date, address, notes, equipment:equipment(model, serial_number)')
    .order('operation_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (operationType) {
    query = query.eq('operation_type', operationType);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CashRegisterOperation[];
}

export async function createOperation(input: CashRegisterOperationInput): Promise<void> {
  const { error } = await supabase.from('cash_register_operations').insert(input);
  if (error) throw error;
}

export async function updateOperation(id: string, input: CashRegisterOperationInput): Promise<void> {
  const { error } = await supabase
    .from('cash_register_operations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOperation(id: string): Promise<void> {
  const { error } = await supabase.from('cash_register_operations').delete().eq('id', id);
  if (error) throw error;
}
