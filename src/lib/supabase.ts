import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://intkcrhsinezswldmokr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludGtjcmhzaW5lenN3bGRtb2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDQ0NjgsImV4cCI6MjA5ODIyMDQ2OH0.62P8wqp[...]

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const SUPABASE_ANON_KEY = supabaseAnonKey;
