import { supabase } from '@/lib/supabase';
import { fetchTokens } from '@/lib/api/tokens';
import { fetchCloudCashRegisters } from '@/lib/api/cloudCashRegisters';
import type { ServicedEquipment, ServicedEquipmentInput } from '@/types/directory';

export async function fetchServicedEquipment(): Promise<ServicedEquipment[]> {
  const [manualItems, tokens, cloudRegisters] = await Promise.all([
    fetchManualServicedEquipment(),
    fetchTokens().catch(() => []),
    fetchCloudCashRegisters().catch(() => []),
  ]);

  const aggregated: ServicedEquipment[] = [];

  for (const item of manualItems) {
    aggregated.push(item);
  }

  for (const token of tokens) {
    aggregated.push({
      id: `token-${token.id}`,
      model: token.pc_model,
      serial_number: token.equipment_serial_number,
      software_version: token.pc_software_version,
      client_id: token.client_id,
      source: `Токен ${token.operator_type === 'cpi' ? 'ЦПИ' : 'iKassa'}`,
      client: token.client,
    });
  }

  for (const reg of cloudRegisters) {
    aggregated.push({
      id: `cloud-${reg.id}`,
      model: reg.pc_model,
      serial_number: reg.equipment_serial_number,
      software_version: reg.pc_software_version,
      client_id: reg.client_id,
      source: 'Облачная касса',
      client: reg.client,
    });
  }

  aggregated.sort((a, b) => a.model.localeCompare(b.model));
  return aggregated;
}

async function fetchManualServicedEquipment(): Promise<ServicedEquipment[]> {
  const { data, error } = await supabase
    .from('serviced_equipment')
    .select('id, model, serial_number, software_version, client_id, client:clients(name)')
    .order('model');
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    ...(item as unknown as ServicedEquipment),
    source: 'Ручной ввод',
  }));
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
