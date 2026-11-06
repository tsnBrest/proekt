import { supabase } from '@/lib/supabase';

export interface DisconnectedPc {
  id: string;
  original_table: string;
  original_id: string | null;
  operator_type: string;
  number: string;
  pc_model: string;
  pc_software_version: string;
  client_id: string | null;
  equipment_model: string;
  equipment_serial_number: string;
  equipment_name: string;
  installation_name: string;
  pc_installation_address: string;
  working_hours: string;
  gln: string;
  to_type: string;
  to_name: string;
  contract_number: string;
  itp_price: number;
  previous_status: string;
  disconnect_reason: string;
  disconnect_date: string;
  created_at: string;
  client: { name: string } | null;
}

export interface DisconnectedPcInput {
  original_table: string;
  original_id: string | null;
  operator_type: string;
  number: string;
  pc_model: string;
  pc_software_version: string;
  client_id: string | null;
  equipment_model: string;
  equipment_serial_number: string;
  equipment_name: string;
  installation_name: string;
  pc_installation_address: string;
  working_hours: string;
  gln: string;
  to_type: string;
  to_name: string;
  contract_number: string;
  itp_price: number;
  previous_status: string;
  disconnect_reason: string;
  disconnect_date: string;
}

const FIELDS =
  'id, original_table, original_id, operator_type, number, pc_model, pc_software_version, client_id, equipment_model, equipment_serial_number, equipment_name, installation_name, pc_installation_address, working_hours, gln, to_type, to_name, contract_number, itp_price, previous_status, disconnect_reason, disconnect_date, created_at, client:clients(name)';

export async function fetchDisconnectedPcs(): Promise<DisconnectedPc[]> {
  const { data, error } = await supabase
    .from('disconnected_pcs')
    .select(FIELDS)
    .order('disconnect_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DisconnectedPc[];
}

export async function createDisconnectedPc(input: DisconnectedPcInput): Promise<void> {
  const { error } = await supabase.from('disconnected_pcs').insert(input);
  if (error) throw error;
}

export async function deleteDisconnectedPc(id: string): Promise<void> {
  const { error } = await supabase.from('disconnected_pcs').delete().eq('id', id);
  if (error) throw error;
}
