import { supabase } from '@/lib/supabase';
import type { PriceListItem, PriceListItemInput } from '@/types/directory';

export async function fetchPriceList(): Promise<PriceListItem[]> {
  const { data, error } = await supabase
    .from('price_list')
    .select('id, work_name, price, coefficient')
    .order('work_name');
  if (error) throw new Error(error.message);
  return (data ?? []) as PriceListItem[];
}

export async function createPriceListItem(input: PriceListItemInput): Promise<void> {
  const { error } = await supabase.from('price_list').insert(input);
  if (error) throw error;
}

export async function updatePriceListItem(id: string, input: PriceListItemInput): Promise<void> {
  const { error } = await supabase
    .from('price_list')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePriceListItem(id: string): Promise<void> {
  const { error } = await supabase.from('price_list').delete().eq('id', id);
  if (error) throw error;
}
