import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kirsjemjkstvnuqpwian.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcnNqZW1qa3N0dm51cXB3aWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTI0OTMsImV4cCI6MjEwNzcyODQ5M30.him1fOnfpPlCg6DC7dqeVRsr_aOYCmRQ3FpGqK_rygA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);