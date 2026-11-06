import { supabase } from '@/lib/supabase';

export interface PcActivation {
  id: string;
  activation_date: string;
  client_id: string | null;
  device_kind: string;
  device_id: string | null;
  device_number: string;
  previous_status: string;
  new_status: string;
  reg_number_skko: string;
  notes: string;
  created_at: string;
  client: { name: string } | null;
}

export interface PcActivationInput {
  activation_date: string;
  client_id: string | null;
  device_kind: string;
  device_id: string | null;
  device_number: string;
  previous_status: string;
  new_status: string;
  reg_number_skko: string;
  notes: string;
}

const FIELDS =
  'id, activation_date, client_id, device_kind, device_id, device_number, previous_status, new_status, reg_number_skko, notes, created_at, client:clients(name)';

export async function fetchPcActivations(): Promise<PcActivation[]> {
  const { data, error } = await supabase
    .from('pc_activations')
    .select(FIELDS)
    .order('activation_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PcActivation[];
}

export async function createPcActivation(input: PcActivationInput): Promise<void> {
  const { error } = await supabase.from('pc_activations').insert(input);
  if (error) throw error;
}

export async function deletePcActivation(id: string): Promise<void> {
  const { error } = await supabase.from('pc_activations').delete().eq('id', id);
  if (error) throw error;
}
