import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Adicionar Usuário a um Ministério', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('insere o usuário no ministério com sucesso', async () => {
    const expectedData = {
      id: 'um-1',
      user_id: 'user-1',
      ministry_id: 'ministry-1',
      joined_at: '2024-01-01T00:00:00Z',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedData }),
    })

    const result = await dbQuery({
      table: 'user_ministries',
      action: 'insert',
      values: {
        user_id: 'user-1',
        ministry_id: 'ministry-1',
      },
    })

    expect(result).toEqual(expectedData)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('envia o payload correto para a API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'um-1' } }),
    })

    await dbQuery({
      table: 'user_ministries',
      action: 'insert',
      values: { user_id: 'user-42', ministry_id: 'ministry-99' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/db/query',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'user_ministries',
          action: 'insert',
          values: { user_id: 'user-42', ministry_id: 'ministry-99' },
        }),
      })
    )
  })

  it('rejeita quando o user_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: user_id' }),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'insert',
        values: { ministry_id: 'ministry-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: user_id')
  })

  it('rejeita quando o ministry_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: ministry_id' }),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'insert',
        values: { user_id: 'user-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: ministry_id')
  })

  it('rejeita quando o usuário já pertence ao ministério (duplicata)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'duplicate key value violates unique constraint "user_ministries_user_id_ministry_id_key"',
      }),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'insert',
        values: { user_id: 'user-1', ministry_id: 'ministry-1' },
      })
    ).rejects.toThrow()
  })

  it('lança erro genérico quando a API retorna falha sem mensagem específica', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })

    await expect(
      dbQuery({
        table: 'user_ministries',
        action: 'insert',
        values: { user_id: 'user-1', ministry_id: 'ministry-1' },
      })
    ).rejects.toThrow('Falha ao executar operacao no backend')
  })
})
