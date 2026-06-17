// Supabase bağlantı bilgileri.
// publishable (anon) anahtarı tarayıcıda açıkta bulunması güvenlidir;
// veriye erişim veritabanındaki RLS politikalarıyla kontrol edilir.
const SUPABASE_URL = "https://soimpgjkcpxfkbmdtzry.supabase.co";
const SUPABASE_KEY = "sb_publishable_7vPfzMYurkcKgVb8J9gFEw_2iTyBhNU";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
