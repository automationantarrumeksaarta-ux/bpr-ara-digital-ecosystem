"use client";

import { useState } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import {
  Bell,
  GitMerge,
  FileText,
  ClipboardCheck,
  Mail,
  MessageSquareQuote,
  AlertCircle,
  LucideIcon,
  Calendar
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NotificationItem } from "../../types";

const getIconForModule = (module: string): LucideIcon => {
  switch (module) {
    case 'EWS':
      return AlertCircle;
    case 'APPROVAL':
      return ClipboardCheck;
    case 'COLLECTION':
      return FileText;
    case 'SYSTEM':
      return Calendar;
    default:
      return Bell;
  }
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
};

export function NotificationInboxPopover() {
  const { notifications, markNotificationAsRead, setActiveModule, currentUser } = useApp();
  
  const myNotifications = notifications.filter(n => 
    !n.userId || 
    n.userId === 'all' || 
    n.userId === currentUser?.id || 
    n.userId === currentUser?.username || 
    n.userId === currentUser?.role
  );

  const unreadCount = myNotifications.filter((n) => !n.read).length;
  const [tab, setTab] = useState("all");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = tab === "unread" ? myNotifications.filter((n) => !n.read) : myNotifications;

  const markAllAsRead = () => {
    myNotifications.forEach(n => {
      if (!n.read) {
        markNotificationAsRead(n.id);
      }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="relative h-10 w-10 rounded-full bg-white dark:bg-[#18181B] border-slate-200 dark:border-slate-800" aria-label="Open notifications">
          <Bell size={18} strokeWidth={2} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 min-w-5 h-5 flex items-center justify-center px-1 text-[10px] bg-red-500 hover:bg-red-600 border-none shadow-sm shadow-red-500/20">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 mr-4 mt-2 shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181B] rounded-2xl overflow-hidden">
        {/* Header with Tabs + Mark All */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 bg-slate-50/50 dark:bg-black/20">
            <TabsList className="bg-transparent space-x-1">
              <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-slate-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Semua</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs font-semibold px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-slate-500 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
                Belum Dibaca {unreadCount > 0 && <Badge className="ml-1.5 px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-none text-[10px]">{unreadCount}</Badge>}
              </TabsTrigger>
            </TabsList>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-all"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <Bell size={24} className="opacity-20 mb-1" />
                <p className="text-xs font-medium">Tidak ada pemberitahuan</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = getIconForModule(n.module);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationAsRead(n.id);
                      if (n.module === 'EWS') setActiveModule('EWS_RISK');
                      else if (n.module === 'APPROVAL') setActiveModule('CREDIT_APPROVAL');
                      else if (n.module === 'COLLECTION') setActiveModule('PTP_TRACKER');
                      else if (n.module === 'SYSTEM') setActiveModule('CALENDAR_VIEW' as any);
                      else setActiveModule(n.module as any);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 dark:border-slate-800/40 px-4 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0 pr-2">
                      <p
                        className={`text-[13px] leading-tight ${
                          !n.read ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className={`text-xs line-clamp-2 ${!n.read ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">
                        {formatTime(n.timestamp)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-2 shrink-0 inline-block size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-black/30 border-t border-slate-100 dark:border-slate-800/60 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 dark:hover:text-white">
            Lihat semua notifikasi
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
