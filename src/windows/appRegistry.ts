import {
  ClipboardList,
  FolderOpen,
  Mail,
  MessageSquare,
  Monitor,
  Ticket,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AppMeta {
  appId: string;
  title: string;
  icon: LucideIcon;
  tileClass: string;
}

export const APPS: readonly AppMeta[] = [
  {
    appId: 'ticket',
    title: 'Ticket',
    icon: Ticket,
    tileClass: 'bg-gradient-to-br from-[#3A6AB0] to-[#1C407A]',
  },
  {
    appId: 'chat',
    title: 'Chat',
    icon: MessageSquare,
    tileClass: 'bg-gradient-to-br from-[#34A878] to-[#1B6B4A]',
  },
  {
    appId: 'mail',
    title: 'Mail',
    icon: Mail,
    tileClass: 'bg-gradient-to-br from-[#4F8FD8] to-[#2A5FA8]',
  },
  {
    appId: 'log',
    title: 'Log',
    icon: ClipboardList,
    tileClass: 'bg-gradient-to-br from-[#8A6FD0] to-[#533A98]',
  },
  {
    appId: 'files',
    title: 'Files',
    icon: FolderOpen,
    tileClass: 'bg-gradient-to-br from-[#E0A030] to-[#A56A10]',
  },
  {
    appId: 'remote',
    title: 'Remote',
    icon: Monitor,
    tileClass: 'bg-gradient-to-br from-[#4A5568] to-[#2D3748]',
  },
  {
    appId: 'directory',
    title: 'Directory',
    icon: Users,
    tileClass: 'bg-gradient-to-br from-[#D0605A] to-[#963430]',
  },
];

export function getAppMeta(appId: string): AppMeta | undefined {
  return APPS.find((a) => a.appId === appId);
}