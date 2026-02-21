// Supabase Edge Function example - returns list of homestays from the same
// Postgres database. This can be deployed with `supabase functions deploy`.
// Keep the code lean to stay within the free-tier execution limit.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The URL/KEY environment variables are injected by Supabase at runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // simple cache header so CDNs can reuse responses for a few seconds
  const headers = new Headers({ 'cache-control': 's-maxage=30, stale-while-revalidate=60' });

  const { data, error } = await supabase
    .from('homestays')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('supabase error', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify(data), { headers });
});
