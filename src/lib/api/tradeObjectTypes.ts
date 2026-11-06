import { supabase } from '@/lib/supabase';
import type { TradeObjectType, TradeObjectTypeInput } from '@/types/directory';

export const DUPLICATE_ERROR_CODE = '23505';

export async function fetchTradeObjectTypes(): Promise<TradeObjectType[]> {
  const { data, error } = await supabase
    .from('trade_object_types')
    .select('id, name')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as TradeObjectType[];
}

export async function createTradeObjectType(input: TradeObjectTypeInput): Promise<void> {
  const { error } = await supabase.from('trade_object_types').insert(input);
  if (error) throw error;
}

export async function updateTradeObjectType(id: string, input: TradeObjectTypeInput): Promise<void> {
  const { error } = await supabase
    .from('trade_object_types')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTradeObjectType(id: string): Promise<void> {
  const { error } = await supabase.from('trade_object_types').delete().eq('id', id);
  if (error) throw error;
}
