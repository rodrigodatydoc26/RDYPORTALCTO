-- SCHEMA.sql - Portal CTO
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categorias de ferramentas
CREATE TABLE IF NOT EXISTS categorias (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome       TEXT NOT NULL UNIQUE,
    ordem      INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ferramentas / links do portal
CREATE TABLE IF NOT EXISTS ferramentas (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo       TEXT NOT NULL,
    descricao    TEXT,
    url          TEXT NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    icone        TEXT DEFAULT 'link',
    tag          TEXT,
    ordem        INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_url CHECK (url ~* '^https?://')
);

-- POPs (Procedimentos Operacionais Padrão)
CREATE TABLE IF NOT EXISTS pops (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo     TEXT NOT NULL,
    categoria  TEXT NOT NULL,
    objetivo   TEXT,
    conteudo   TEXT,
    ativo      BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de RESMAS / suprimentos
CREATE TABLE IF NOT EXISTS resmas (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_registro  DATE NOT NULL DEFAULT CURRENT_DATE,
    equipamento    TEXT NOT NULL,
    operador       TEXT NOT NULL,
    quantidade     INTEGER NOT NULL CHECK (quantidade > 0),
    status         TEXT NOT NULL DEFAULT 'pendente'
                       CHECK (status IN ('pendente', 'entregue', 'cancelado')),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pops        ENABLE ROW LEVEL SECURITY;
ALTER TABLE resmas      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica_categorias"  ON categorias  FOR SELECT USING (true);
CREATE POLICY "escrita_auth_categorias"     ON categorias  FOR ALL    USING (auth.role() = 'authenticated');

CREATE POLICY "leitura_publica_ferramentas" ON ferramentas FOR SELECT USING (true);
CREATE POLICY "escrita_auth_ferramentas"    ON ferramentas FOR ALL    USING (auth.role() = 'authenticated');

CREATE POLICY "leitura_publica_pops"        ON pops        FOR SELECT USING (true);
CREATE POLICY "escrita_auth_pops"           ON pops        FOR ALL    USING (auth.role() = 'authenticated');

CREATE POLICY "leitura_publica_resmas"      ON resmas      FOR SELECT USING (true);
CREATE POLICY "escrita_auth_resmas"         ON resmas      FOR ALL    USING (auth.role() = 'authenticated');
