
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggbksyobxoucupljlerw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_R875Aw2rIUXn6HFQqlLCOQ_Eiu2Exyl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
