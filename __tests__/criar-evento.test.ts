import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Criar Evento', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const basePayload = {
    church_id: 'church-1',
    title: 'Culto de Domingo',
    description: 'Culto dominical semanal',
    date: '2024-06-15',
    start_time: '09:00:00',
  }

  it('cria um evento com os campos obrigatórios', async () => {
    const expectedEvent = {
      id: 'event-1',
      ...basePayload,
      location: null,
      end_time: null,
      created_at: '2024-06-01T00:00:00Z',
      updated_at: '2024-06-01T00:00:00Z',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: expectedEvent }),
    })

    const result = await dbQuery({
      table: 'events',
      action: 'insert',
      values: basePayload,
      select: '*',
      single: true,
    })

    expect(result).toEqual(expectedEvent)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('cria evento com localização e horário de término opcionais', async () => {
    const payloadCompleto = {
      ...basePayload,
      end_time: '12:00:00',
      location: 'Templo Principal',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'event-2', ...payloadCompleto } }),
    })

    const result = await dbQuery<{ id: string; location: string; end_time: string }>({
      table: 'events',
      action: 'insert',
      values: payloadCompleto,
    })

    expect(result.location).toBe('Templo Principal')
    expect(result.end_time).toBe('12:00:00')
  })

  it('envia o payload correto para a API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'event-1' } }),
    })

    await dbQuery({
      table: 'events',
      action: 'insert',
      values: basePayload,
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.table).toBe('events')
    expect(body.action).toBe('insert')
    expect(body.values).toMatchObject(basePayload)
  })

  it('rejeita quando o título está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: title' }),
    })

    await expect(
      dbQuery({
        table: 'events',
        action: 'insert',
        values: {
          church_id: 'church-1',
          description: 'Culto dominical',
          date: '2024-06-15',
          start_time: '09:00:00',
        },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: title')
  })

  it('rejeita quando a data está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: date' }),
    })

    await expect(
      dbQuery({
        table: 'events',
        action: 'insert',
        values: {
          church_id: 'church-1',
          title: 'Culto',
          description: 'Culto dominical',
          start_time: '09:00:00',
        },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: date')
  })

  it('rejeita quando o horário de início está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: start_time' }),
    })

    await expect(
      dbQuery({
        table: 'events',
        action: 'insert',
        values: {
          church_id: 'church-1',
          title: 'Culto',
          description: 'Culto dominical',
          date: '2024-06-15',
        },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: start_time')
  })

  it('rejeita quando a descrição está ausente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Campo obrigatorio ausente ou nulo: description' }),
    })

    await expect(
      dbQuery({
        table: 'events',
        action: 'insert',
        values: {
          church_id: 'church-1',
          title: 'Culto',
          date: '2024-06-15',
          start_time: '09:00:00',
        },
      })
    ).rejects.toThrow('Campo obrigatorio ausente ou nulo: description')
  })

  it('associa ministérios ao evento após a criação', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'event-1', ...basePayload } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'em-1', event_id: 'event-1', ministry_id: 'ministry-1' },
        }),
      })

    const evento = await dbQuery<{ id: string }>({
      table: 'events',
      action: 'insert',
      values: basePayload,
    })

    const associacao = await dbQuery({
      table: 'event_ministries',
      action: 'insert',
      values: { event_id: evento.id, ministry_id: 'ministry-1' },
    })

    expect(evento.id).toBe('event-1')
    expect(associacao).toMatchObject({ event_id: 'event-1', ministry_id: 'ministry-1' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('associa múltiplos ministérios ao evento criado', async () => {
    const eventId = 'event-1'
    const ministryIds = ['ministry-1', 'ministry-2', 'ministry-3']

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: eventId, ...basePayload } }),
      })

    for (const ministryId of ministryIds) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: `em-${ministryId}`, event_id: eventId, ministry_id: ministryId },
        }),
      })
    }

    const evento = await dbQuery<{ id: string }>({
      table: 'events',
      action: 'insert',
      values: basePayload,
    })

    for (const ministryId of ministryIds) {
      await dbQuery({
        table: 'event_ministries',
        action: 'insert',
        values: { event_id: evento.id, ministry_id: ministryId },
      })
    }

    // 1 chamada para criar o evento + 3 para associar ministérios
    expect(mockFetch).toHaveBeenCalledTimes(1 + ministryIds.length)
  })
})
