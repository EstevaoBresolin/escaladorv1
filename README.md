# Escalador de Ministérios

Sistema de gerenciamento de escalas para ministérios de igrejas, desenvolvido com Next.js e Supabase.

## 🚀 Funcionalidades

- 👤 Autenticação de usuários
- 📅 Gerenciamento de eventos
- 🙏 Gerenciamento de ministérios
- 👥 Controle de voluntários
- 🔔 Sistema de notificações
- 📊 Dashboard administrativo

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Deploy**: Vercel

## 📦 Instalação

\`\`\`bash

# Clone o repositório

git clone https://github.com/EstevaoBresolin/escaladorv1.git

# Entre na pasta

cd escaladorv1

# Instale as dependências

npm install

# ou

npm install

# Configure as variáveis de ambiente

cp .env.example .env.local

# Execute o projeto em desenvolvimento

npm dev

# ou

npm run dev
\`\`\`

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_supabase_anon_key
UPSTASH_REDIS_REST_URL=sua_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=seu_upstash_redis_rest_token
\`\`\`

Obtenha essas credenciais no [Supabase Dashboard](https://supabase.com/dashboard).

Obtenha as credenciais do Redis no [Upstash Console](https://console.upstash.com/) e configure-as na Vercel para o rate limit distribuido de login.

## 🗄️ Configuração do Banco de Dados

Execute os scripts SQL na seguinte ordem no Supabase SQL Editor:

1. `scripts/001_create_tables.sql` - Cria as tabelas
2. `scripts/002_profile_trigger.sql` - Cria triggers de perfil
3. `scripts/003_fix_rls_policies.sql` - Configura políticas RLS
4. `scripts/004_fix_profile_trigger.sql` - Ajusta triggers
5. `scripts/005_update_church_policies.sql` até `scripts/013_update_unavailability_periods.sql` - Atualizações incrementais
6. `scripts/014_security_hardening.sql` - Endurecimento de segurança (RLS + proteção anti-escalada em profiles)

## 🌐 Deploy na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EstevaoBresolin/escaladorv1)

### Passos para Deploy:

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe o repositório: `EstevaoBresolin/escaladorv1`
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em "Deploy"

## 📝 Licença

Este projeto está sob a licença MIT.
