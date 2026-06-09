import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Filtros Avançados de Consulta', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('filtra eventos por intervalo de datas (gte + lte)', async () => {
    const expectedEvents = [
      { id: 'event-1', date: '2024-06-10' },
      { id: 'event-2', date: '2024-06-15' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedEvents }),
    })

    const result = await dbQuery({
      table: 'events',
      action: 'select',
      filters: [
        { field: 'date', operator: 'gte' as const, value: '2024-06-01' },
        { field: 'date', operator: 'lte' as const, value: '2024-06-30' },
      ],
    })

    expect(result).toHaveLength(2)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.filters).toHaveLength(2)
    expect(body.filters[0]).toMatchObject({ field: 'date', operator: 'gte', value: '2024-06-01' })
    expect(body.filters[1]).toMatchObject({ field: 'date', operator: 'lte', value: '2024-06-30' })
  })

  it('busca voluntários por nome parcial (ilike)', async () => {
    const expectedProfiles = [
      { id: 'user-1', name: 'João Silva' },
      { id: 'user-2', name: 'João Pereira' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedProfiles }),
    })

    const result = await dbQuery({
      table: 'profiles',
      action: 'select',
      filters: [{ field: 'name', operator: 'ilike' as const, value: '%João%' }],
    })

    expect(result).toHaveLength(2)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.filters[0]).toMatchObject({ field: 'name', operator: 'ilike', value: '%João%' })
  })

  it('filtra slots de múltiplos eventos (in)', async () => {
    const expectedSlots = [
      { id: 'slot-1', event_id: 'event-1' },
      { id: 'slot-2', event_id: 'event-2' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedSlots }),
    })

    const result = await dbQuery({
      table: 'volunteer_slots',
      action: 'select',
      filters: [{ field: 'event_id', operator: 'in' as const, value: ['event-1', 'event-2'] }],
    })

    expect(result).toHaveLength(2)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.filters[0]).toMatchObject({
      field: 'event_id',
      operator: 'in',
      value: ['event-1', 'event-2'],
    })
  })

  it('filtra registros por valor diferente (neq)', async () => {
    const expectedSlots = [
      { id: 'slot-1', status: 'scheduled' },
      { id: 'slot-2', status: 'absent' },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedSlots }),
    })

    await dbQuery({
      table: 'volunteer_slots',
      action: 'select',
      filters: [{ field: 'status', operator: 'neq' as const, value: 'declined' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.filters[0]).toMatchObject({ operator: 'neq', value: 'declined' })
  })

  it('combina múltiplos filtros com ordenação e paginação', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    await dbQuery({
      table: 'events',
      action: 'select',
      filters: [
        { field: 'church_id', operator: 'eq' as const, value: 'church-1' },
        { field: 'date', operator: 'gte' as const, value: '2024-06-01' },
      ],
      orderBy: 'date',
      ascending: true,
      limit: 10,
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.filters).toHaveLength(2)
    expect(body.orderBy).toBe('date')
    expect(body.ascending).toBe(true)
    expect(body.limit).toBe(10)
  })

  it('busca com select de campos específicos (projeção)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'slot-1', status: 'scheduled' }] }),
    })

    await dbQuery({
      table: 'volunteer_slots',
      action: 'select',
      select: 'id, status, user_id',
      filters: [{ field: 'event_id', operator: 'eq' as const, value: 'event-1' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.select).toBe('id, status, user_id')
  })
})
