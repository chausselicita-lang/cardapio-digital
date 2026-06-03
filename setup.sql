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
