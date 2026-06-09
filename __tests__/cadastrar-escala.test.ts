import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Cadastrar Usuário em uma Escala', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const baseSlot = {
    event_id: 'event-1',
    ministry_id: 'ministry-1',
    user_id: 'user-1',
  }

  it('cadastra o usuário na escala com sucesso', async () => {
    const expectedSlot = {
      id: 'slot-1',
      ...baseSlot,
      status: 'scheduled',
      notes: null,
      function_id: null,
      created_at: '2024-06-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedSlot }),
    })

    const result = await dbQuery({
      table: 'volunteer_slots',
      action: 'insert',
      values: baseSlot,
    })

    expect(result).toEqual(expectedSlot)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('cadastra o usuário com função e observações específicas', async () => {
    const slotCompleto = {
      ...baseSlot,
      function_id: 'function-1',
      notes: 'Responsável pela sonorização',
      status: 'scheduled',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'slot-2', ...slotCompleto } }),
    })

    const result = await dbQuery<typeof slotCompleto & { id: string }>({
      table: 'volunteer_slots',
      action: 'insert',
      values: slotCompleto,
    })

    expect(result.notes).toBe('Responsável pela sonorização')
    expect(result.function_id).toBe('function-1')
  })

  it('envia o payload correto para a API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'slot-1' } }),
    })

    await dbQuery({
      table: 'volunteer_slots',
      action: 'insert',
      values: baseSlot,
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.table).toBe('volunteer_slots')
    expect(body.action).toBe('insert')
    expect(body.values).toEqual(baseSlot)
  })

  it('rejeita quando o event_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: event_id' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_slots',
        action: 'insert',
        values: { ministry_id: 'ministry-1', user_id: 'user-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: event_id')
  })

  it('rejeita quando o ministry_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: ministry_id' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_slots',
        action: 'insert',
        values: { event_id: 'event-1', user_id: 'user-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: ministry_id')
  })

  it('rejeita quando o user_id está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: user_id' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_slots',
        action: 'insert',
        values: { event_id: 'event-1', ministry_id: 'ministry-1' },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: user_id')
  })

  it('consulta os slots da escala com dados relacionados', async () => {
    const expectedSlots = [
      {
        id: 'slot-1',
        ...baseSlot,
        status: 'scheduled',
        profiles: { id: 'user-1', name: 'João Silva', email: 'joao@exemplo.com' },
        ministries: { id: 'ministry-1', name: 'Louvor', color: '#6366f1' },
        ministry_functions: null,
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedSlots }),
    })

    const result = await dbQuery({
      table: 'volunteer_slots',
      action: 'select',
      select: '*, profiles(id, name, email), ministries(id, name, color), ministry_functions(id, name)',
      filters: [{ field: 'event_id', operator: 'eq' as const, value: 'event-1' }],
    })

    expect(result).toEqual(expectedSlots)
  })

  it('consulta slots de um usuário específico em todos os eventos', async () => {
    const expectedSlots = [
      { id: 'slot-1', event_id: 'event-1', user_id: 'user-1', status: 'scheduled' },
      { id: 'slot-2', event_id: 'event-2', user_id: 'user-1', status: 'scheduled' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedSlots }),
    })

    const result = await dbQuery({
      table: 'volunteer_slots',
      action: 'select',
      filters: [{ field: 'user_id', operator: 'eq' as const, value: 'user-1' }],
    })

    expect(result).toHaveLength(2)
    expect(result).toEqual(expectedSlots)
  })
})
