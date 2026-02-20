// Database types for Conecte Escalas

export type UserRole = "admin" | "leader" | "volunteer" | "member";

export type VolunteerStatus = "scheduled" | "declined" | "absent";

export type NotificationType = "info" | "warning" | "success" | "error";

export interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  church_id?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  church?: Church;
}

export interface Ministry {
  id: string;
  name: string;
  description?: string;
  color: string;
  church_id: string;
  leader_id?: string;
  created_at: string;
  updated_at: string;
  leader?: Profile;
  members?: Profile[];
}

export interface UserMinistry {
  id: string;
  user_id: string;
  ministry_id: string;
  joined_at: string;
  user?: Profile;
  ministry?: Ministry;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  church_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  ministries?: Ministry[];
  volunteer_slots?: VolunteerSlot[];
}

export interface EventMinistry {
  id: string;
  event_id: string;
  ministry_id: string;
  event?: Event;
  ministry?: Ministry;
}

export interface VolunteerSlot {
  id: string;
  event_id: string;
  ministry_id: string;
  user_id: string;
  status: VolunteerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  event?: Event;
  ministry?: Ministry;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  sent_via?: "app" | "whatsapp" | "email" | null;
  created_at: string;
}

// Dashboard statistics
export interface DashboardStats {
  upcomingEvents: number;
  scheduledVolunteers: number;
  absences: number;
  activeMinistries: number;
}

// Form types
export interface CreateMinistryForm {
  name: string;
  description?: string;
  color: string;
  leader_id?: string;
}

export interface CreateEventForm {
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  ministry_ids: string[];
}

export interface VolunteerApplicationForm {
  event_id: string;
  ministry_id: string;
}

// Ministry leadership
export interface MinistryLeader {
  id: string;
  ministry_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
  ministry?: Ministry;
}

// User permissions context
export interface UserPermissions {
  isAdmin: boolean;
  isLeader: boolean;
  ledMinistryIds: string[];
}

// Helper to check if user can manage a specific ministry
export function canManageMinistry(
  permissions: UserPermissions,
  ministryId: string,
): boolean {
  return permissions.isAdmin || permissions.ledMinistryIds.includes(ministryId);
}

// Helper to check if user can add volunteers to an event for a specific ministry
export function canAddVolunteerToMinistry(
  permissions: UserPermissions,
  ministryId: string,
): boolean {
  return permissions.isAdmin || permissions.ledMinistryIds.includes(ministryId);
}
