import { supabase } from '@/lib/supabase';
import type { Token, TokenInput, TokenOperatorType } from '@/types/directory';

export const DUPLICATE_ERROR_CODE = '23505';

export const TOKEN_STATUSES = [
  'присвоен',
  'зарегистрирован',
  'пауза',
  'блокировка',
  'снят с регистрации',
] as const;

const TOKEN_FIELDS =
  'id, number, operator_type, client_id, pc_model, pc_software_version, equipment_model, equipment_serial_number, equipment_name, equipment_status, installation_name, pc_installation_address, working_hours, gln, to_type, to_name, contract_number, status, itp_price, client:clients(name)';

export async function fetchTokens(operatorType?: TokenOperatorType): Promise<Token[]> {
  let query = supabase
    .from('tokens')
    .select(TOKEN_FIELDS)
    .order('number');
  if (operatorType) {
    query = query.eq('operator_type', operatorType);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Token[];
}

export async function fetchUnassignedTokens(
  operatorType: TokenOperatorType,
  assignedTokenNumbers: string[],
): Promise<Token[]> {
  const all = await fetchTokens(operatorType);
  const assigned = new Set(assignedTokenNumbers.map((n) => n.trim()).filter(Boolean));
  return all.filter((t) => !assigned.has(t.number));
}

export async function fetchTokensByClient(
  clientId: string,
  assignedTokenNumbers: string[],
): Promise<Token[]> {
  const { data, error } = await supabase
    .from('tokens')
    .select(TOKEN_FIELDS)
    .eq('client_id', clientId)
    .order('number');
  if (error) throw new Error(error.message);
  const all = (data ?? []) as unknown as Token[];
  const assigned = new Set(assignedTokenNumbers.map((n) => n.trim()).filter(Boolean));
  return all.filter((t) => !assigned.has(t.number));
}

export async function createToken(input: TokenInput): Promise<void> {
  const { error } = await supabase.from('tokens').insert(input);
  if (error) throw error;
}

export async function updateToken(id: string, input: TokenInput): Promise<void> {
  const { error } = await supabase
    .from('tokens')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteToken(id: string): Promise<void> {
  const { error } = await supabase.from('tokens').delete().eq('id', id);
  if (error) throw error;
}
