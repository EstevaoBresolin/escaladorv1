import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Remover Usuário de um Ministério', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('remove o usuário do ministério pelo id do vínculo', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const result = await dbQuery({
      table: 'user_ministries',
      action: 'delete',
      filters: [{ field: 'id', operator: 'eq' as const, value: 'um-1' }],
    })

    expect(result).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('envia o payload correto ao remover', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    await dbQuery({
      table: 'user_ministries',
      action: 'delete',
      filters: [{ field: 'id', operator: 'eq' as const, value: 'um-99' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.table).toBe('user_ministries')
    expect(body.action).toBe('delete')
    expect(body.filters[0]).toMatchObject({ field: 'id', operator: 'eq', value: 'um-99' })
  })

  it('rejeita delete sem filtros (proteção contra remoção em massa)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Update/Delete exige ao menos um filtro por seguranca.' }),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'delete',
      })
    ).rejects.toThrow('Update/Delete exige ao menos um filtro por seguranca.')
  })

  it('lança erro quando o registro não existe', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Record not found' }),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'delete',
        filters: [{ field: 'id', operator: 'eq' as const, value: 'id-inexistente' }],
      })
    ).rejects.toThrow('Record not found')
  })
})
