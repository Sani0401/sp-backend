import { createClient } from '@supabase/supabase-js'
import { config as configDotenv } from 'dotenv';
configDotenv();

let projectURL = process.env.supabase_project_url;
let anonKey =  process.env.supabase_anon_key;
const supabase = createClient(projectURL, anonKey)
export default supabase;