import { describe, it, expect } from 'vitest'
import { DB_TABLE_POLICIES, IMMUTABLE_FIELDS } from '../lib/db/policies'

describe('Políticas de Tabela (DB_TABLE_POLICIES)', () => {
  describe('Campos imutáveis', () => {
    it('id nunca pode ser alterado', () => {
      expect(IMMUTABLE_FIELDS.has('id')).toBe(true)
    })

    it('created_at nunca pode ser alterado', () => {
      expect(IMMUTABLE_FIELDS.has('created_at')).toBe(true)
    })

    it('updated_at nunca pode ser alterado', () => {
      expect(IMMUTABLE_FIELDS.has('updated_at')).toBe(true)
    })
  })

  describe('user_ministries', () => {
    const policy = DB_TABLE_POLICIES.user_ministries

    it('exige user_id e ministry_id como campos obrigatórios', () => {
      expect(policy.nonNullableFields).toContain('user_id')
      expect(policy.nonNullableFields).toContain('ministry_id')
    })

    it('permite filtrar por user_id e ministry_id', () => {
      expect(policy.filterableFields).toContain('user_id')
      expect(policy.filterableFields).toContain('ministry_id')
    })

    it('não permite gravar o campo id diretamente', () => {
      expect(policy.writableFields).not.toContain('id')
    })
  })

  describe('events', () => {
    const policy = DB_TABLE_POLICIES.events

    it('exige church_id, title, date, start_time e description', () => {
      expect(policy.nonNullableFields).toContain('church_id')
      expect(policy.nonNullableFields).toContain('title')
      expect(policy.nonNullableFields).toContain('date')
      expect(policy.nonNullableFields).toContain('start_time')
      expect(policy.nonNullableFields).toContain('description')
    })

    it('permite gravar campos opcionais location e end_time', () => {
      expect(policy.writableFields).toContain('location')
      expect(policy.writableFields).toContain('end_time')
    })

    it('invalida cache de event_ministries e volunteer_slots ao alterar', () => {
      expect(policy.invalidateTables).toContain('event_ministries')
      expect(policy.invalidateTables).toContain('volunteer_slots')
    })

    it('permite filtrar por church_id e date', () => {
      expect(policy.filterableFields).toContain('church_id')
      expect(policy.filterableFields).toContain('date')
    })
  })

  describe('volunteer_slots', () => {
    const policy = DB_TABLE_POLICIES.volunteer_slots

    it('exige event_id, ministry_id e user_id', () => {
      expect(policy.nonNullableFields).toContain('event_id')
      expect(policy.nonNullableFields).toContain('ministry_id')
      expect(policy.nonNullableFields).toContain('user_id')
    })

    it('permite gravar status, notes e function_id', () => {
      expect(policy.writableFields).toContain('status')
      expect(policy.writableFields).toContain('notes')
      expect(policy.writableFields).toContain('function_id')
    })

    it('invalida cache de events ao alterar', () => {
      expect(policy.invalidateTables).toContain('events')
    })

    it('permite filtrar por event_id, ministry_id e user_id', () => {
      expect(policy.filterableFields).toContain('event_id')
      expect(policy.filterableFields).toContain('ministry_id')
      expect(policy.filterableFields).toContain('user_id')
    })
  })

  describe('ministries', () => {
    const policy = DB_TABLE_POLICIES.ministries

    it('exige name e color', () => {
      expect(policy.nonNullableFields).toContain('name')
      expect(policy.nonNullableFields).toContain('color')
    })

    it('invalida cache das tabelas relacionadas ao alterar', () => {
      expect(policy.invalidateTables).toContain('user_ministries')
      expect(policy.invalidateTables).toContain('ministry_leaders')
      expect(policy.invalidateTables).toContain('ministry_functions')
    })

    it('não permite gravar church_id (definido pelo servidor via perfil do usuário)', () => {
      expect(policy.writableFields).not.toContain('church_id')
    })
  })

  describe('Invariantes de todas as tabelas', () => {
    it('todas as tabelas têm cacheTtlSeconds maior que zero', () => {
      for (const [table, policy] of Object.entries(DB_TABLE_POLICIES)) {
        expect(policy.cacheTtlSeconds, `${table} deve ter cacheTtlSeconds > 0`).toBeGreaterThan(0)
      }
    })

    it('todas as tabelas têm ao menos um campo filtrável', () => {
      for (const [table, policy] of Object.entries(DB_TABLE_POLICIES)) {
        expect(
          policy.filterableFields.length,
          `${table} deve ter ao menos um filterableField`
        ).toBeGreaterThan(0)
      }
    })

    it('nenhuma tabela permite gravar campos imutáveis', () => {
      for (const [table, policy] of Object.entries(DB_TABLE_POLICIES)) {
        for (const campo of IMMUTABLE_FIELDS) {
          expect(
            policy.writableFields,
            `${table}.writableFields não deve conter '${campo}'`
          ).not.toContain(campo)
        }
      }
    })

    it('todas as tabelas têm ao menos um campo gravável', () => {
      for (const [table, policy] of Object.entries(DB_TABLE_POLICIES)) {
        expect(
          policy.writableFields.length,
          `${table} deve ter ao menos um writableField`
        ).toBeGreaterThan(0)
      }
    })
  })
})
