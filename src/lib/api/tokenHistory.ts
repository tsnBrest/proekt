import { supabase } from '@/lib/supabase';
import type { TokenHistoryEntry, TokenHistoryInput } from '@/types/directory';

export async function fetchTokenHistory(tokenId: string): Promise<TokenHistoryEntry[]> {
  const { data, error } = await supabase
    .from('token_history')
    .select('id, token_id, action, action_date, details, address, created_at')
    .eq('token_id', tokenId)
    .order('action_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TokenHistoryEntry[];
}

export async function createTokenHistoryEntry(input: TokenHistoryInput): Promise<void> {
  const { error } = await supabase.from('token_history').insert(input);
  if (error) throw error;
}

export async function deleteTokenHistoryByToken(tokenId: string): Promise<void> {
  const { error } = await supabase.from('token_history').delete().eq('token_id', tokenId);
  if (error) throw error;
}
