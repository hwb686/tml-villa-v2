import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // service role needed for administrative queries
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const headers = new Headers({ 'cache-control': 's-maxage=60, stale-while-revalidate=120' });

  // for simplicity we return all users; in production you would add auth checks
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, status, createdAt')
    .order('createdAt', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify(data), { headers });
});