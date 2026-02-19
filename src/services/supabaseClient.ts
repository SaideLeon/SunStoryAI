import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/schema';

// Utilizando NEXT_PUBLIC_ para garantir acesso no client Next.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggbksyobxoucupljlerw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_R875Aw2rIUXn6HFQqlLCOQ_Eiu2Exyl';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);