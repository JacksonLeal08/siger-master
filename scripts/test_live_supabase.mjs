import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://katqbezpcssrmicgnshg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdHFiZXpwY3Nzcm1pY2duc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjUxNjIsImV4cCI6MjEwNTA0MTE2Mn0.9fcuMRiJDARMqHjCQ8IyLIK0YRSk3CmaqmfBKbmFI-Y';

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdHFiZXpwY3Nzcm1pY2duc2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ2NTE2MiwiZXhwIjoyMTA1MDQxMTYyfQ.GR-vQm52h9P0EgvuDoovbb9fseAKy9XBCbe53eU0SVA';
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function testSupabase() {
  console.log('Checking ativos_extintores count...');
  try {
    const { count, error } = await adminSupabase.from('ativos_extintores').select('*', { count: 'exact', head: true });
    console.log('Total in ativos_extintores:', { count, error });
  } catch (e) {
    console.error('Exception:', e);
  }
}

testSupabase();
