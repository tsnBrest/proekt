import { supabase } from '@/lib/supabase';
import type {
  WorkstationOperation,
  WorkstationOperationInput,
  WorkstationOperationType,
} from '@/types/directory';

export async function fetchWorkstationOperations(
  operationType?: WorkstationOperationType,
): Promise<WorkstationOperation[]> {
  let query = supabase
    .from('workstation_operations')
    .select(
      'id, workstation_id, operation_type, operation_date, client_id, address, is_cloud, token_number, notes, workstation:workstations!left(model, token_number), client:clients(name)',
    )
    .order('operation_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (operationType) {
    query = query.eq('operation_type', operationType);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WorkstationOperation[];
}

export async function createWorkstationOperation(input: WorkstationOperationInput): Promise<void> {
  const { error } = await supabase.from('workstation_operations').insert(input);
  if (error) throw error;
}

export async function updateWorkstationOperation(
  id: string,
  input: WorkstationOperationInput,
): Promise<void> {
  const { error } = await supabase
    .from('workstation_operations')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWorkstationOperation(id: string): Promise<void> {
  const { error } = await supabase.from('workstation_operations').delete().eq('id', id);
  if (error) throw error;
}
