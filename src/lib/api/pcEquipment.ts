import { supabase } from '@/lib/supabase';
import type { PcEquipment, PcEquipmentInput } from '@/types/directory';

const FIELDS = 'id, name, serial_number, status, supplier';

export async function fetchPcEquipment(): Promise<PcEquipment[]> {
  const { data, error } = await supabase
    .from('pc_equipment')
    .select(FIELDS)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as PcEquipment[];
}

export async function createPcEquipment(input: PcEquipmentInput): Promise<void> {
  const { error } = await supabase.from('pc_equipment').insert(input);
  if (error) throw error;
}

export async function updatePcEquipment(id: string, input: PcEquipmentInput): Promise<void> {
  const { error } = await supabase
    .from('pc_equipment')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePcEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('pc_equipment').delete().eq('id', id);
  if (error) throw error;
}
