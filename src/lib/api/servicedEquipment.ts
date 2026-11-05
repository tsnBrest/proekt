import { supabase } from '@/lib/supabase';
import type { ServicedEquipment, ServicedEquipmentInput } from '@/types/directory';

export async function fetchServicedEquipment(): Promise<ServicedEquipment[]> {
  const { data, error } = await supabase
    .from('serviced_equipment')
    .select('id, model, serial_number, software_version, client_id, client:clients(name)')
    .order('model');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ServicedEquipment[];
}

export async function createServicedEquipment(input: ServicedEquipmentInput): Promise<void> {
  const { error } = await supabase.from('serviced_equipment').insert(input);
  if (error) throw error;
}

export async function updateServicedEquipment(
  id: string,
  input: ServicedEquipmentInput,
): Promise<void> {
  const { error } = await supabase
    .from('serviced_equipment')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteServicedEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('serviced_equipment').delete().eq('id', id);
  if (error) throw error;
}
