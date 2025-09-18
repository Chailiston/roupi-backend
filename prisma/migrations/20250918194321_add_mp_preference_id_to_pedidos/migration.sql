-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" VARCHAR(20),
    "perfil" VARCHAR(20) DEFAULT 'admin',
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes_loja" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "nota" INTEGER,
    "comentario" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'pending',
    "resposta_loja" TEXT,

    CONSTRAINT "avaliacoes_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes_produto" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "nota" INTEGER,
    "comentario" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'pending',
    "resposta_loja" TEXT,

    CONSTRAINT "avaliacoes_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamados" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_loja" INTEGER,
    "assunto" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'aberto',
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(20),
    "cpf" VARCHAR(14),
    "senha_hash" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "foto_url" TEXT,
    "senha_temporaria" BOOLEAN DEFAULT false,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_bancarios_loja" (
    "id" SERIAL NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "banco" VARCHAR(100),
    "agencia" VARCHAR(20),
    "conta" VARCHAR(30),
    "tipo_conta" VARCHAR(20),
    "titular" VARCHAR(100),
    "documento_titular" VARCHAR(20),
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "pagamento_fornecedor" VARCHAR(30),
    "pagamento_account_id" VARCHAR(100),

    CONSTRAINT "dados_bancarios_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos_cliente" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "apelido" VARCHAR(30),
    "rua" VARCHAR(100),
    "numero" VARCHAR(10),
    "complemento" VARCHAR(50),
    "bairro" VARCHAR(50),
    "cidade" VARCHAR(50),
    "estado" VARCHAR(2),
    "cep" VARCHAR(10),
    "padrao" BOOLEAN DEFAULT false,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ativo" BOOLEAN DEFAULT true,

    CONSTRAINT "enderecos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_variacao" (
    "id" SERIAL NOT NULL,
    "id_variacao_produto" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "minimo_critico" INTEGER NOT NULL DEFAULT 0,
    "lead_time_dias" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estoque_variacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "id_variacao" INTEGER,
    "nome_produto" VARCHAR(100),
    "tamanho" VARCHAR(10),
    "cor" VARCHAR(30),
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_admin" (
    "id" SERIAL NOT NULL,
    "id_admin" INTEGER,
    "acao" TEXT NOT NULL,
    "tabela_afetada" VARCHAR(50),
    "id_registro" INTEGER,
    "data_hora" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loja_payment_settings" (
    "id" SERIAL NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "api_key" TEXT NOT NULL,
    "webhook_secret" TEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "connected_account_id" VARCHAR,
    "application_fee_percent" DECIMAL(5,2),

    CONSTRAINT "loja_payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lojas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cnpj" VARCHAR(18),
    "email" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(20),
    "endereco_rua" VARCHAR(100),
    "endereco_numero" VARCHAR(10),
    "endereco_bairro" VARCHAR(50),
    "endereco_cidade" VARCHAR(50),
    "endereco_estado" VARCHAR(2),
    "endereco_cep" VARCHAR(10),
    "logo_url" TEXT,
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "senha_hash" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "banner_url" TEXT,
    "tempo_entrega_estimado" VARCHAR(50),
    "taxa_entrega" DECIMAL(10,2) DEFAULT 0.00,
    "aceita_entrega_expressa" BOOLEAN DEFAULT false,
    "raio_entrega_km" DECIMAL(5,2) DEFAULT 5.0,
    "taxa_entrega_fixa" DECIMAL(10,2) DEFAULT 0.00,
    "taxa_entrega_por_km" DECIMAL(10,2) DEFAULT 0.00,
    "tempo_preparo_minutos" INTEGER DEFAULT 30,
    "horario_funcionamento" JSONB,
    "pedido_minimo_entrega" DECIMAL(10,2) DEFAULT 0.00,
    "frete_gratis_acima_de" DECIMAL(10,2),
    "aceitando_pedidos_online" BOOLEAN DEFAULT true,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_chamado" (
    "id" SERIAL NOT NULL,
    "id_chamado" INTEGER NOT NULL,
    "origem" VARCHAR(20) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "enviado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "titulo" VARCHAR(100),
    "mensagem" TEXT,
    "lida" BOOLEAN DEFAULT false,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "metodo_pagamento" VARCHAR(30),
    "status_pagamento" VARCHAR(30),
    "url_pagamento" TEXT,
    "qr_code" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "provider_payment_id" VARCHAR,
    "provider_charge_id" VARCHAR,
    "provider_fee_amount" DECIMAL(12,2),
    "platform_fee_amount" DECIMAL(12,2),
    "transfer_id" VARCHAR,
    "paid_at" TIMESTAMPTZ(6),
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_client_secret" VARCHAR(255),

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "id_endereco_entrega" INTEGER,
    "status" VARCHAR(20) DEFAULT 'pendente',
    "forma_pagamento" VARCHAR(30),
    "valor_total" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "previsao_entrega" TIMESTAMP(6),
    "valor_frete" DECIMAL DEFAULT 0.00,
    "mp_preference_id" TEXT,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preco_historico" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "preco_antigo" DECIMAL NOT NULL,
    "preco_novo" DECIMAL NOT NULL,
    "alterado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preco_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precos_promocao" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "preco_promocional" DECIMAL NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,

    CONSTRAINT "precos_promocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_tags" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "tag" VARCHAR(100) NOT NULL,

    CONSTRAINT "produto_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "categoria" VARCHAR(50),
    "preco_base" DECIMAL(10,2) NOT NULL,
    "imagem_url" TEXT,
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "slug" VARCHAR(255),

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_imagens" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" SMALLINT NOT NULL DEFAULT 0,
    "storage_path" TEXT,

    CONSTRAINT "produtos_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocao_produtos" (
    "id" SERIAL NOT NULL,
    "id_promocao" INTEGER NOT NULL,
    "id_produto" INTEGER NOT NULL,

    CONSTRAINT "promocao_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocoes" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(10,2),
    "data_inicio" TIMESTAMP(6) NOT NULL,
    "data_fim" TIMESTAMP(6) NOT NULL,
    "estoque_maximo" INTEGER,
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promocoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_push" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER,
    "fcm_token" TEXT NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_push_loja" (
    "id" SERIAL NOT NULL,
    "id_loja" INTEGER NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_push_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variacoes_produto" (
    "id" SERIAL NOT NULL,
    "id_produto" INTEGER NOT NULL,
    "tamanho" VARCHAR(10),
    "cor" VARCHAR(30),
    "sku" VARCHAR(50),
    "preco" DECIMAL(10,2),
    "estoque" INTEGER DEFAULT 0,
    "ativo" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "preco_extra" DECIMAL DEFAULT 0,
    "peso" DECIMAL,
    "imagem_url" TEXT,

    CONSTRAINT "variacoes_produto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_loja_id_cliente" ON "avaliacoes_loja"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_loja_id_loja" ON "avaliacoes_loja"("id_loja");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_produto_id_cliente" ON "avaliacoes_produto"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_produto_id_produto" ON "avaliacoes_produto"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE INDEX "idx_clientes_cpf" ON "clientes"("cpf");

-- CreateIndex
CREATE INDEX "idx_clientes_email" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "idx_enderecos_cliente_id_cliente" ON "enderecos_cliente"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_favoritos_id_cliente" ON "favoritos"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_favoritos_id_produto" ON "favoritos"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_id_cliente_id_produto_key" ON "favoritos"("id_cliente", "id_produto");

-- CreateIndex
CREATE INDEX "idx_itens_pedido_id_pedido" ON "itens_pedido"("id_pedido");

-- CreateIndex
CREATE INDEX "idx_itens_pedido_id_produto" ON "itens_pedido"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "lojas_cnpj_key" ON "lojas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "lojas_email_key" ON "lojas"("email");

-- CreateIndex
CREATE INDEX "idx_lojas_ativo" ON "lojas"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_pedidos_id_cliente" ON "pedidos"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_pedidos_id_loja" ON "pedidos"("id_loja");

-- CreateIndex
CREATE INDEX "idx_pedidos_status" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "idx_precos_promocao_datas" ON "precos_promocao"("data_inicio", "data_fim");

-- CreateIndex
CREATE INDEX "idx_precos_promocao_id_produto" ON "precos_promocao"("id_produto");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_slug_key" ON "produtos"("slug");

-- CreateIndex
CREATE INDEX "idx_produtos_ativo" ON "produtos"("ativo");

-- CreateIndex
CREATE INDEX "idx_produtos_categoria" ON "produtos"("categoria");

-- CreateIndex
CREATE INDEX "idx_produtos_id_loja" ON "produtos"("id_loja");

-- CreateIndex
CREATE UNIQUE INDEX "variacoes_produto_sku_key" ON "variacoes_produto"("sku");

-- CreateIndex
CREATE INDEX "idx_variacoes_produto_id_produto" ON "variacoes_produto"("id_produto");

-- AddForeignKey
ALTER TABLE "avaliacoes_loja" ADD CONSTRAINT "avaliacoes_loja_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes_loja" ADD CONSTRAINT "avaliacoes_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes_produto" ADD CONSTRAINT "avaliacoes_produto_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacoes_produto" ADD CONSTRAINT "avaliacoes_produto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dados_bancarios_loja" ADD CONSTRAINT "dados_bancarios_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enderecos_cliente" ADD CONSTRAINT "enderecos_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estoque_variacao" ADD CONSTRAINT "estoque_variacao_id_variacao_produto_fkey" FOREIGN KEY ("id_variacao_produto") REFERENCES "variacoes_produto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_variacao_fkey" FOREIGN KEY ("id_variacao") REFERENCES "variacoes_produto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs_admin" ADD CONSTRAINT "logs_admin_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loja_payment_settings" ADD CONSTRAINT "loja_payment_settings_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mensagens_chamado" ADD CONSTRAINT "mensagens_chamado_id_chamado_fkey" FOREIGN KEY ("id_chamado") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_endereco_entrega_fkey" FOREIGN KEY ("id_endereco_entrega") REFERENCES "enderecos_cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preco_historico" ADD CONSTRAINT "preco_historico_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "precos_promocao" ADD CONSTRAINT "precos_promocao_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produto_tags" ADD CONSTRAINT "produto_tags_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produtos_imagens" ADD CONSTRAINT "produtos_imagens_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promocao_produtos" ADD CONSTRAINT "promocao_produtos_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promocao_produtos" ADD CONSTRAINT "promocao_produtos_id_promocao_fkey" FOREIGN KEY ("id_promocao") REFERENCES "promocoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tokens_push" ADD CONSTRAINT "tokens_push_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tokens_push_loja" ADD CONSTRAINT "tokens_push_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "lojas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "variacoes_produto" ADD CONSTRAINT "variacoes_produto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
