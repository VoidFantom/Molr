import { createClient } from '@supabase/supabase-js';
import { SUBJECTS } from '../src/data/curriculum.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBucket() {
  console.log("Checking Supabase Storage bucket 'cheatsheets'...");
  const mathSubject = SUBJECTS.find(s => s.id === 'math');
  const pdfKeys = mathSubject ? mathSubject.chapters.map(c => c.pdfKey) : [];

  console.log(`Generated ${pdfKeys.length} Math pdfKeys:`);
  pdfKeys.forEach(k => console.log(`  - ${k}`));

  try {
    const { data, error } = await supabase.storage.from('cheatsheets').list('math');
    if (error) {
      console.log(`[Bucket Check Info] Note: Listing bucket 'cheatsheets/math' returned: ${error.message}`);
      console.log("This occurs when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables are not yet configured with live Supabase credentials in .env.");
      return;
    }

    const remoteFiles = new Set((data || []).map(f => `math/${f.name}`));
    console.log(`Found ${remoteFiles.size} remote files in 'cheatsheets/math':`);
    remoteFiles.forEach(f => console.log(`  - ${f}`));

    const missing = pdfKeys.filter(k => !remoteFiles.has(k));
    const extra = Array.from(remoteFiles).filter(f => !pdfKeys.includes(f));

    console.log("\n--- Audit Results ---");
    if (missing.length === 0) {
      console.log("MATCH SUCCESS: All generated Math pdfKeys match files in Supabase 'cheatsheets' bucket!");
    } else {
      console.log(`MISMATCH DETECTED: ${missing.length} pdfKeys not found in bucket:`);
      missing.forEach(m => console.log(`  [MISSING] ${m}`));
    }
  } catch (err) {
    console.error("Exception during bucket check:", err.message);
  }
}

checkBucket();
