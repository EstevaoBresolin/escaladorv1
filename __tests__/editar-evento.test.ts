import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Editar Evento', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('atualiza o título do evento', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'event-1', title: 'Culto Especial de Louvor' }] }),
    })

    const result = await dbQuery<{ id: string; title: string }[]>({
      table: 'events',
      action: 'update',
      values: { title: 'Culto Especial de Louvor' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'event-1' }],
    })

    expect(result[0].title).toBe('Culto Especial de Louvor')
  })

  it('atualiza data, hora de início e local', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'event-1', date: '2024-07-20', start_time: '18:00:00', location: 'Salão Principal' }],
      }),
    })

    const result = await dbQuery<{ date: string; start_time: string; location: string }[]>({
      table: 'events',
      action: 'update',
      values: { date: '2024-07-20', start_time: '18:00:00', location: 'Salão Principal' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'event-1' }],
    })

    expect(result[0].date).toBe('2024-07-20')
    expect(result[0].start_time).toBe('18:00:00')
    expect(result[0].location).toBe('Salão Principal')
  })

  it('atualiza a descrição do evento', async () => {
    const novaDescricao = 'Culto com participação especial do coral'

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'event-1', description: novaDescricao }] }),
    })

    const result = await dbQuery<{ id: string; description: string }[]>({
      table: 'events',
      action: 'update',
      values: { description: novaDescricao },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'event-1' }],
    })

    expect(result[0].description).toBe(novaDescricao)
  })

  it('rejeita update sem filtros (proteção contra edição em massa)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Update/Delete exige ao menos um filtro por seguranca.' }),
    })

    await expect(
      dbQuery({
        table: 'events',
        action: 'update',
        values: { title: 'Novo Título' },
      })
    ).rejects.toThrow('Update/Delete exige ao menos um filtro por seguranca.')
  })

  it('envia o payload correto ao editar', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    await dbQuery({
      table: 'events',
      action: 'update',
      values: { title: 'Culto Especial', description: 'Descrição atualizada' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'event-1' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.table).toBe('events')
    expect(body.action).toBe('update')
    expect(body.values).toMatchObject({ title: 'Culto Especial', description: 'Descrição atualizada' })
    expect(body.filters[0]).toMatchObject({ field: 'id', value: 'event-1' })
  })
})
