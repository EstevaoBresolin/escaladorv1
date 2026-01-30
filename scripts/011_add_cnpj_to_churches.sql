-- Add CNPJ column to churches table
alter table public.churches
add column if not exists cnpj text unique;

-- Add comment to document the CNPJ field
comment on column public.churches.cnpj is 'CNPJ da Igreja - não editável após criação';
