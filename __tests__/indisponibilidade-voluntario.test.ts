import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Registrar Indisponibilidade de Voluntário', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registra indisponibilidade com os campos obrigatórios', async () => {
    const expectedData = {
      id: 'unav-1',
      user_id: 'user-1',
      unavailable_date: '2024-06-15',
      period: 'morning',
      reason: null,
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedData }),
    })

    const result = await dbQuery({
      table: 'volunteer_unavailability',
      action: 'insert',
      values: {
        user_id: 'user-1',
        unavailable_date: '2024-06-15',
        period: 'morning',
      },
    })

    expect(result).toEqual(expectedData)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('registra indisponibilidade com motivo opcional', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'unav-2',
          user_id: 'user-1',
          unavailable_date: '2024-06-22',
          period: 'allday',
          reason: 'Viagem de trabalho',
        },
      }),
    })

    const result = await dbQuery<{ reason: string }>({
      table: 'volunteer_unavailability',
      action: 'insert',
      values: {
        user_id: 'user-1',
        unavailable_date: '2024-06-22',
        period: 'allday',
        reason: 'Viagem de trabalho',
      },
    })

    expect(result.reason).toBe('Viagem de trabalho')
  })

  it('rejeita quando user_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: user_id' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_unavailability',
        action: 'insert',
        values: { unavailable_date: '2024-06-15' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: user_id')
  })

  it('rejeita quando unavailable_date está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: unavailable_date' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_unavailability',
        action: 'insert',
        values: { user_id: 'user-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: unavailable_date')
  })

  it('consulta indisponibilidades de um voluntário', async () => {
    const expectedData = [
      { id: 'unav-1', user_id: 'user-1', unavailable_date: '2024-06-15', period: 'morning' },
      { id: 'unav-2', user_id: 'user-1', unavailable_date: '2024-06-22', period: 'allday' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedData }),
    })

    const result = await dbQuery({
      table: 'volunteer_unavailability',
      action: 'select',
      filters: [{ field: 'user_id', operator: 'eq' as const, value: 'user-1' }],
    })

    expect(result).toHaveLength(2)
    expect(result).toEqual(expectedData)
  })

  it('remove um registro de indisponibilidade', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const result = await dbQuery({
      table: 'volunteer_unavailability',
      action: 'delete',
      filters: [{ field: 'id', operator: 'eq' as const, value: 'unav-1' }],
    })

    expect(result).toBeUndefined()
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.action).toBe('delete')
    expect(body.filters[0]).toMatchObject({ field: 'id', value: 'unav-1' })
  })
})
