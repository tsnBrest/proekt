import { supabase } from '@/lib/supabase';
import type { EquipmentModel, EquipmentModelInput } from '@/types/directory';

export const DUPLICATE_ERROR_CODE = '23505';

export async function fetchEquipmentModels(): Promise<EquipmentModel[]> {
  const { data, error } = await supabase
    .from('equipment_models')
    .select('id, model, software_version')
    .order('model');
  if (error) throw new Error(error.message);
  return (data ?? []) as EquipmentModel[];
}

export async function createEquipmentModel(input: EquipmentModelInput): Promise<void> {
  const { error } = await supabase.from('equipment_models').insert(input);
  if (error) throw error;
}

export async function updateEquipmentModel(id: string, input: EquipmentModelInput): Promise<void> {
  const { error } = await supabase
    .from('equipment_models')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEquipmentModel(id: string): Promise<void> {
  const { error } = await supabase.from('equipment_models').delete().eq('id', id);
  if (error) throw error;
}
