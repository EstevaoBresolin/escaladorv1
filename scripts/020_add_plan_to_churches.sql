-- Adiciona a coluna 'plan' à tabela 'churches' para controle de plano de notificações
ALTER TABLE public.churches ADD COLUMN plan integer NOT NULL DEFAULT 0;