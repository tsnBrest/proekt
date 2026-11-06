import { supabase } from '@/lib/supabase';
import type { CloudCashRegister, CloudCashRegisterInput } from '@/types/directory';

const FIELDS =
  'id, client_id, pc_model, pc_software_version, equipment_model, equipment_serial_number, equipment_name, equipment_status, installation_name, pc_installation_address, working_hours, gln, to_type, to_name, contract_number, register_status, itp_price, client:clients(name)';

const FIELDS_NO_JOIN =
  'id, client_id, pc_model, pc_software_version, equipment_model, equipment_serial_number, equipment_name, equipment_status, installation_name, pc_installation_address, working_hours, gln, to_type, to_name, contract_number, register_status, itp_price';

export async function fetchCloudCashRegisters(): Promise<CloudCashRegister[]> {
  const { data, error } = await supabase
    .from('cloud_cash_registers')
    .select(FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CloudCashRegister[];
}

export async function fetchCloudCashRegistersByClient(clientId: string): Promise<CloudCashRegister[]> {
  const { data, error } = await supabase
    .from('cloud_cash_registers')
    .select(FIELDS_NO_JOIN)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CloudCashRegister[];
}

export async function createCloudCashRegister(input: CloudCashRegisterInput): Promise<void> {
  const { error } = await supabase.from('cloud_cash_registers').insert(input);
  if (error) throw error;
}

export async function updateCloudCashRegister(id: string, input: CloudCashRegisterInput): Promise<void> {
  const { error } = await supabase
    .from('cloud_cash_registers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCloudCashRegister(id: string): Promise<void> {
  const { error } = await supabase.from('cloud_cash_registers').delete().eq('id', id);
  if (error) throw error;
}

export async function updateCloudCashRegisterStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('cloud_cash_registers')
    .update({ register_status: status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
