import { TaskItem, BEISUserProfile as UserProfile, BEISNotificationItem as NotificationItem } from '../types';

export const TEAM_MEMBERS = [
  'REKAP PUSAT',
  'GHAUST',
  'LILIS',
  'SUNARTI',
  'WIDI',
  'LINA',
  'MEMET',
  'NADA',
  'ANIK',
  'AGUNG',
  'IWAN',
  'TIARA',
  'EGI',
  'AJI',
  'TITOES',
  'RIDHO',
  'DANANG'
] as const;

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-della',
    name: 'Della (PMO)',
    email: 'della@bprara.co.id',
    username: 'della',
    password: '123',
    role: 'Super Admin',
    roleTier: 'Super Admin',
    unit: 'PMO',
    assignedMemberTab: 'DELLA',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    twoFactorEnabled: true,
    emailNotifications: true,
    calendarConnected: true
  }
];

export const INITIAL_TASKS: TaskItem[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
