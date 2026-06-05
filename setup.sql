-- ============================================================
-- CARDÁPIO DIGITAL — SQL para rodar no Supabase SQL Editor
-- ============================================================

-- 1. Restaurantes cadastrados
CREATE TABLE IF NOT EXISTS restaurantes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_restaurante TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  telefone         TEXT NOT NULL,
  email            TEXT,
  endereco         TEXT,
  tipo             TEXT DEFAULT 'restaurante',
  horario          TEXT,
  num_mesas        INTEGER,
  plano            TEXT,
  senha_admin      TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Itens do cardápio por restaurante
CREATE TABLE IF NOT EXISTS cardapio_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id  UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  categoria       TEXT NOT NULL,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  preco           DECIMAL(10,2) NOT NULL,
  foto_url        TEXT,
  disponivel      BOOLEAN DEFAULT true,
  ordem           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pedidos recebidos por restaurante
CREATE TABLE IF NOT EXISTS cardapio_pedidos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id   UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  mesa             TEXT,
  itens            JSONB NOT NULL,
  total            DECIMAL(10,2) NOT NULL,
  forma_pagamento  TEXT,
  status           TEXT DEFAULT 'novo',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS — permite leitura e escrita pública (ajuste conforme necessário)
-- ============================================================

ALTER TABLE restaurantes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio_pedidos  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurantes_insert" ON restaurantes FOR INSERT WITH CHECK (true);
CREATE POLICY "restaurantes_select" ON restaurantes FOR SELECT USING (true);

CREATE POLICY "items_all"    ON cardapio_items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pedidos_all"  ON cardapio_pedidos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- MIGRAÇÃO — rodar se as tabelas já existem
-- ============================================================

-- Adiciona coluna tag (badge: popular, novo, chef)
ALTER TABLE cardapio_items ADD COLUMN IF NOT EXISTS tag TEXT;

-- Remove FK obrigatória (modo standalone sem tabela restaurantes)
ALTER TABLE cardapio_items   DROP CONSTRAINT IF EXISTS cardapio_items_restaurante_id_fkey;
ALTER TABLE cardapio_items   ALTER COLUMN restaurante_id DROP NOT NULL;

ALTER TABLE cardapio_pedidos DROP CONSTRAINT IF EXISTS cardapio_pedidos_restaurante_id_fkey;
ALTER TABLE cardapio_pedidos ALTER COLUMN restaurante_id DROP NOT NULL;

-- ============================================================
-- PAGAMENTO — rastreamento de confirmação pelo dono
-- ============================================================

-- Adiciona coluna de status de pagamento
ALTER TABLE cardapio_pedidos ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pendente';

-- Marca pedidos presenciais existentes como confirmados automaticamente
UPDATE cardapio_pedidos
SET payment_status = 'presencial'
WHERE forma_pagamento IN ('Dinheiro', 'Vale Refeição')
  AND (payment_status IS NULL OR payment_status = 'pendente');
