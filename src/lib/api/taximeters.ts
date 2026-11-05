import { supabase } from '@/lib/supabase';
import type { Taximeter, TaximeterInput } from '@/types/directory';

export async function fetchTaximeters(): Promise<Taximeter[]> {
  const { data, error } = await supabase
    .from('taximeters')
    .select('id, number, model, software_version, client_id, car, client:clients(name)')
    .order('number');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Taximeter[];
}

export async function createTaximeter(input: TaximeterInput): Promise<void> {
  const { error } = await supabase.from('taximeters').insert(input);
  if (error) throw error;
}

export async function updateTaximeter(id: string, input: TaximeterInput): Promise<void> {
  const { error } = await supabase
    .from('taximeters')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTaximeter(id: string): Promise<void> {
  const { error } = await supabase.from('taximeters').delete().eq('id', id);
  if (error) throw error;
}
