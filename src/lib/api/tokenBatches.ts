import { supabase } from '@/lib/supabase';
import type { TokenBatch, TokenBatchInput, TokenBatchOperatorLabel } from '@/types/directory';

const BATCH_FIELDS = 'id, operator_label, start_number, end_number, created_at, arrival_date';

export async function fetchTokenBatches(): Promise<TokenBatch[]> {
  const { data, error } = await supabase
    .from('token_batches')
    .select(BATCH_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TokenBatch[];
}

export async function createTokenBatch(input: TokenBatchInput): Promise<void> {
  const { error } = await supabase.from('token_batches').insert(input);
  if (error) throw error;
}

export async function deleteTokenBatch(id: string): Promise<void> {
  const { error } = await supabase.from('token_batches').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteTokenBatchByNumber(
  operatorLabel: TokenBatchOperatorLabel,
  number: string,
): Promise<void> {
  const { error } = await supabase
    .from('token_batches')
    .delete()
    .eq('operator_label', operatorLabel)
    .eq('start_number', number)
    .eq('end_number', number);
  if (error) throw error;
}

export async function fetchTokenBatchesByOperator(
  operatorLabel: TokenBatchOperatorLabel,
): Promise<TokenBatch[]> {
  const { data, error } = await supabase
    .from('token_batches')
    .select(BATCH_FIELDS)
    .eq('operator_label', operatorLabel)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TokenBatch[];
}

export function expandBatch(
  startNumber: string,
  endNumber: string,
  operatorLabel: TokenBatchOperatorLabel,
): TokenBatchInput[] {
  const startNum = parseInt(startNumber, 10);
  const endNum = parseInt(endNumber, 10);
  if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) return [];
  const today = new Date().toISOString().slice(0, 10);
  const batches: TokenBatchInput[] = [];
  for (let n = startNum; n <= endNum; n++) {
    batches.push({
      operator_label: operatorLabel,
      start_number: String(n),
      end_number: String(n),
      arrival_date: today,
    });
  }
  return batches;
}
