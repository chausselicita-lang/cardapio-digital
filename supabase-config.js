// ===== SUPABASE CONFIG — Cardápio Digital =====

const SUPA_URL  = 'https://zigghtvlmftgjlohuhla.supabase.co';
const SUPA_KEY  = 'sb_publishable_o5ibiwWTvnZ8gXfdJQkFqA_jKZhTiGU';
const BASE_URL  = 'https://chausselicita-lang.github.io/cardapio-digital';

// ID único deste restaurante — usado em todas as operações Supabase
const SUPA_RID  = 'a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789';

const db = supabase.createClient(SUPA_URL, SUPA_KEY);
