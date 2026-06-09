import { describe, it, expect } from 'vitest'
import { canManageMinistry, canAddVolunteerToMinistry } from '../lib/types'
import type { UserPermissions } from '../lib/types'

describe('Permissões de Acesso', () => {
  describe('canManageMinistry', () => {
    it('admin pode gerenciar qualquer ministério', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: true,
        isLeader: false,
        ledMinistryIds: [],
      }
      expect(canManageMinistry(permissoes, 'qualquer-id')).toBe(true)
    })

    it('superadmin pode gerenciar qualquer ministério', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: true,
        isAdmin: true,
        isLeader: false,
        ledMinistryIds: [],
      }
      expect(canManageMinistry(permissoes, 'qualquer-id')).toBe(true)
    })

    it('líder gerencia apenas os próprios ministérios', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: true,
        ledMinistryIds: ['ministry-1', 'ministry-2'],
      }
      expect(canManageMinistry(permissoes, 'ministry-1')).toBe(true)
      expect(canManageMinistry(permissoes, 'ministry-2')).toBe(true)
      expect(canManageMinistry(permissoes, 'ministry-3')).toBe(false)
    })

    it('voluntário sem liderança não pode gerenciar ministérios', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: false,
        ledMinistryIds: [],
      }
      expect(canManageMinistry(permissoes, 'qualquer-id')).toBe(false)
    })

    it('lista de ministérios liderados vazia não concede acesso', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: true,
        ledMinistryIds: [],
      }
      expect(canManageMinistry(permissoes, 'ministry-1')).toBe(false)
    })
  })

  describe('canAddVolunteerToMinistry', () => {
    it('admin pode adicionar voluntários em qualquer ministério', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: true,
        isLeader: false,
        ledMinistryIds: [],
      }
      expect(canAddVolunteerToMinistry(permissoes, 'qualquer-id')).toBe(true)
    })

    it('líder adiciona voluntários apenas nos seus ministérios', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: true,
        ledMinistryIds: ['ministry-1'],
      }
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-1')).toBe(true)
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-2')).toBe(false)
    })

    it('voluntário comum não pode adicionar outros voluntários', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: false,
        ledMinistryIds: [],
      }
      expect(canAddVolunteerToMinistry(permissoes, 'qualquer-id')).toBe(false)
    })

    it('líder com múltiplos ministérios tem acesso correto a cada um', () => {
      const permissoes: UserPermissions = {
        isSuperAdmin: false,
        isAdmin: false,
        isLeader: true,
        ledMinistryIds: ['ministry-A', 'ministry-B', 'ministry-C'],
      }
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-A')).toBe(true)
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-B')).toBe(true)
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-C')).toBe(true)
      expect(canAddVolunteerToMinistry(permissoes, 'ministry-D')).toBe(false)
    })
  })
})
