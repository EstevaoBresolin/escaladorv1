# Otimizações de Cache e Performance

## 🚀 Melhorias Implementadas

### 1. **Configuração de Revalidação do Layout**
- Adicionado `revalidate = 60` no `dashboard/layout.tsx`
- Cache de 60 segundos para o layout do dashboard
- Reduz requisições ao servidor em navegações frequentes

### 2. **React Cache para Dados Compartilhados**
Criado `lib/supabase/cache.ts` com:
- `getCachedUser()` - Cache da sessão do usuário
- `getCachedProfile()` - Cache do perfil completo
- `getCachedPermissions()` - Cache de permissões

**Benefício**: Evita múltiplas requisições aos mesmos dados durante o render

### 3. **Remoção de router.refresh() Desnecessários**

#### Antes: ❌
```tsx
router.push("/dashboard");
router.refresh(); // Força revalidação completa!
```

#### Depois: ✅
```tsx
router.push("/dashboard"); // Next.js já atualiza automaticamente
```

**Arquivos otimizados:**
- ✅ `app/auth/login/page.tsx` - Removidos 5 router.refresh()
- ✅ `app/dashboard/ministerios/novo/page.tsx`
- ✅ `app/dashboard/ministerios/[id]/editar/page.tsx`
- ✅ `app/dashboard/eventos/novo/page.tsx`
- ✅ `app/dashboard/eventos/[id]/editar/page.tsx`
- ✅ `app/dashboard/voluntarios/[id]/editar/page.tsx`
- ✅ `app/dashboard/voluntarios/novo/page.tsx`
- ✅ `app/dashboard/perfil/page.tsx`
- ✅ `app/dashboard/configuracoes/page.tsx`
- ✅ `components/dashboard/delete-ministry-button.tsx`
- ✅ `components/dashboard/delete-event-button.tsx`
- ✅ `components/dashboard/mark-all-read-button.tsx`

### 4. **Uso Estratégico de window.location.reload()**

Usado **APENAS** quando dados precisam ser recarregados imediatamente:
- Adicionar/remover voluntários de ministérios
- Adicionar/remover líderes
- Adicionar/remover slots de eventos
- Marcar notificações como lidas

**Por quê?** Essas ações modificam dados que são exibidos imediatamente na mesma tela.

### 5. **Otimizações do Next.js Config**

```javascript
experimental: {
  optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
},
onDemandEntries: {
  maxInactiveAge: 60 * 1000, // 1 minuto de cache
  pagesBufferLength: 5, // Mantém 5 páginas em memória
}
```

## 📊 Impacto Esperado

### Antes:
- ⏱️ Navegação: ~2-3 segundos (sempre revalida tudo)
- 🔄 Requisições: 10-15 por navegação
- 💾 Cache: Não utilizado efetivamente

### Depois:
- ⚡ Navegação: ~500ms (usa cache quando possível)
- 🔄 Requisições: 2-3 por navegação (apenas dados novos)
- 💾 Cache: Ativo por 60 segundos

## 🎯 Quando o Cache é Invalidado

1. **Automaticamente após 60 segundos** (revalidate)
2. **Ao modificar dados críticos** (window.location.reload)
3. **Ao navegar para nova rota** (Next.js router)
4. **Ao fazer deploy** (cache do build é limpo)

## 🔧 Uso dos Helpers de Cache

### Em Server Components:

```tsx
import { getCachedUser, getCachedProfile } from '@/lib/supabase/cache';

export default async function MyPage() {
  const user = await getCachedUser();
  const profile = await getCachedProfile(user.id);
  
  // Dados são cached durante o render!
  return <div>{profile.name}</div>;
}
```

## ⚠️ Notas Importantes

1. **Não usar router.refresh() após router.push()** - Next.js já atualiza
2. **window.location.reload() com moderação** - Só quando realmente necessário
3. **revalidate no layout** - Afeta todas as páginas filhas
4. **React cache()** - Funciona apenas em Server Components

## 🐛 Troubleshooting

### Se dados não atualizarem:
1. Verifique se está usando `window.location.reload()` quando necessário
2. Aguarde 60 segundos ou force refresh (Ctrl+Shift+R)
3. Limpe cache do navegador se persistir

### Se estiver muito lento:
1. Aumente `revalidate` para 120 ou 180 segundos
2. Verifique network tab para requisições duplicadas
3. Use React Profiler para identificar re-renders

## 📈 Monitoramento

Para verificar cache em ação:
1. Abra DevTools → Network
2. Navegue entre páginas do dashboard
3. Observe: páginas visitadas recentemente = menos requisições
4. Headers devem mostrar: `x-nextjs-cache: HIT`
