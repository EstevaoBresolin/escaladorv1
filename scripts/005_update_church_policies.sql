-- Script para atualizar as políticas de acesso às igrejas
-- Permite que todos os usuários autenticados vejam todas as igrejas disponíveis

-- Remover política antiga que limitava visualização apenas à própria igreja
drop policy if exists "Users can view their own church" on public.churches;

-- Nova política: usuários autenticados podem ver todas as igrejas
create policy "Authenticated users can view all churches" on public.churches
  for select using (auth.role() = 'authenticated');

-- Manter a política de atualização apenas para admins da própria igreja
-- (política já existe, mas vamos recriar para garantir)
drop policy if exists "Admins can update their church" on public.churches;

create policy "Admins can update their church" on public.churches
  for update using (
    id in (select church_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Permitir criação de novas igrejas por qualquer usuário autenticado
create policy "Authenticated users can create churches" on public.churches
  for insert with check (auth.role() = 'authenticated');

-- Comentário: 
-- Agora qualquer usuário autenticado pode:
-- 1. Ver todas as igrejas cadastradas
-- 2. Criar uma nova igreja
-- 3. Atualizar apenas se for admin da igreja
