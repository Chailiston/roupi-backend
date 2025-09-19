-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "foto_url" TEXT,
ADD COLUMN     "senha_temporaria" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "enderecos_cliente" ADD COLUMN     "ativo" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "loja_payment_settings" ALTER COLUMN "connected_account_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "stripe_client_secret" VARCHAR(255),
ADD COLUMN     "stripe_payment_intent_id" VARCHAR(255),
ALTER COLUMN "provider_payment_id" SET DATA TYPE TEXT,
ALTER COLUMN "provider_charge_id" SET DATA TYPE TEXT,
ALTER COLUMN "transfer_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "mp_preference_id" TEXT,
ADD COLUMN     "valor_frete" DECIMAL(10,2) DEFAULT 0.00;

-- AlterTable
ALTER TABLE "preco_historico" ALTER COLUMN "preco_antigo" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "preco_novo" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "precos_promocao" ALTER COLUMN "preco_promocional" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "variacoes_produto" ALTER COLUMN "preco_extra" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "peso" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "idx_avaliacoes_loja_id_cliente" ON "avaliacoes_loja"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_loja_id_loja" ON "avaliacoes_loja"("id_loja");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_produto_id_cliente" ON "avaliacoes_produto"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_avaliacoes_produto_id_produto" ON "avaliacoes_produto"("id_produto");

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
CREATE INDEX "idx_itens_pedido_id_pedido" ON "itens_pedido"("id_pedido");

-- CreateIndex
CREATE INDEX "idx_itens_pedido_id_produto" ON "itens_pedido"("id_produto");

-- CreateIndex
CREATE INDEX "idx_lojas_ativo" ON "lojas"("ativo");

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
CREATE INDEX "idx_produtos_ativo" ON "produtos"("ativo");

-- CreateIndex
CREATE INDEX "idx_produtos_categoria" ON "produtos"("categoria");

-- CreateIndex
CREATE INDEX "idx_produtos_id_loja" ON "produtos"("id_loja");

-- CreateIndex
CREATE INDEX "idx_variacoes_produto_id_produto" ON "variacoes_produto"("id_produto");
