import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dbQuery } from '../lib/api/db-client'

describe('Atualizar Status da Escala', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('marca voluntário como ausente (absent)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'slot-1', status: 'absent' }] }),
    })

    const result = await dbQuery<{ id: string; status: string }[]>({
      table: 'volunteer_slots',
      action: 'update',
      values: { status: 'absent' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'slot-1' }],
    })

    expect(result[0].status).toBe('absent')
  })

  it('marca voluntário como recusado (declined)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'slot-1', status: 'declined' }] }),
    })

    const result = await dbQuery<{ id: string; status: string }[]>({
      table: 'volunteer_slots',
      action: 'update',
      values: { status: 'declined' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'slot-1' }],
    })

    expect(result[0].status).toBe('declined')
  })

  it('reativa voluntário de ausente para agendado (scheduled)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'slot-1', status: 'scheduled' }] }),
    })

    const result = await dbQuery<{ id: string; status: string }[]>({
      table: 'volunteer_slots',
      action: 'update',
      values: { status: 'scheduled' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'slot-1' }],
    })

    expect(result[0].status).toBe('scheduled')
  })

  it('adiciona observação ao slot da escala', async () => {
    const nota = 'Chegará 30min antes para setup do som'

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'slot-1', notes: nota }] }),
    })

    const result = await dbQuery<{ id: string; notes: string }[]>({
      table: 'volunteer_slots',
      action: 'update',
      values: { notes: nota },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'slot-1' }],
    })

    expect(result[0].notes).toBe(nota)
  })

  it('rejeita update sem filtros (proteção contra alteração em massa)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Update/Delete exige ao menos um filtro por seguranca.' }),
    })

    await expect(
      dbQuery({
        table: 'volunteer_slots',
        action: 'update',
        values: { status: 'absent' },
      })
    ).rejects.toThrow('Update/Delete exige ao menos um filtro por seguranca.')
  })

  it('envia o payload correto ao atualizar status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    await dbQuery({
      table: 'volunteer_slots',
      action: 'update',
      values: { status: 'absent' },
      filters: [{ field: 'id', operator: 'eq' as const, value: 'slot-42' }],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.table).toBe('volunteer_slots')
    expect(body.action).toBe('update')
    expect(body.values.status).toBe('absent')
    expect(body.filters[0]).toMatchObject({ field: 'id', value: 'slot-42' })
  })
})
