import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { navigationConfig } from '../../config/navigationConfig';

interface SidebarProps {
  onOpenCalendarSync?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenCalendarSync,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { currentUser, ewsAlerts, creditApplications, ptpRecords, flowTasks } = useApp();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const pendingApprovalsCount = creditApplications.filter((a) => a.currentStage === 'CREDIT_COMMITTEE').length;
  const redEwsCount = ewsAlerts.filter((a) => a.severity === 'RED' && a.status !== 'RESOLVED').length;
  const duePtpCount = ptpRecords.filter((p) => p.status === 'DUE' || p.status === 'PROMISED').length;
  const openTasksCount = flowTasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  const getBadgeCount = (type?: string) => {
    switch (type) {
      case 'APPROVALS': return pendingApprovalsCount;
      case 'EWS': return redEwsCount;
      case 'PTP': return duePtpCount;
      case 'TASKS': return openTasksCount;
      default: return 0;
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const sidebarContent = (
    <aside className="fixed lg:static top-0 bottom-0 left-0 z-50 w-[260px] bg-primary-navy border-r border-primary-navy flex flex-col h-full select-none shrink-0 transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none">
      {/* Header Branding */}
      <div className="flex items-center mb-6 mt-8 px-6 justify-between">
        <h1 className="text-2xl font-bold font-sans text-white tracking-tight">
          BPR ARA
        </h1>
        {isMobileOpen && (
          <button onClick={onMobileClose} className="lg:hidden p-2 text-white/70 hover:text-white">
            &times;
          </button>
        )}
      </div>

      {/* Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {navigationConfig.map((group, groupIndex) => {
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || item.allowedRoles.includes(currentUser.role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIndex}>
              <h3 className="px-3 text-[10px] font-bold text-primary-light/60 uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const badgeCount = getBadgeCount(item.badgeType);
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedGroups.includes(item.id);
                  const isChildActive = hasChildren && item.children?.some(child => child.path && location.pathname.startsWith(child.path));

                  if (hasChildren) {
                    return (
                      <div key={item.id} className="mb-1">
                        <button
                          onClick={() => toggleGroup(item.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] transition-all group ` +
                            (isChildActive
                              ? 'bg-white/10 text-white font-medium shadow-sm'
                              : 'text-white/70 hover:text-white hover:bg-white/10')
                          }
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              strokeWidth={1.5}
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isChildActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded || isChildActive ? 'rotate-90 text-white/70' : 'text-white/40 group-hover:text-white/70'
                              }`}
                            />
                          </div>
                        </button>
                        
                        {/* Render Children */}
                        {(isExpanded || isChildActive) && (
                          <div className="mt-1 space-y-1">
                            {item.children?.map(child => {
                              const ChildIcon = child.icon;
                              const childBadgeCount = getBadgeCount(child.badgeType);
                              if (child.allowedRoles && !child.allowedRoles.includes(currentUser.role)) return null;

                              return (
                                <NavLink
                                  key={child.id}
                                  to={child.path!}
                                  onClick={onMobileClose}
                                  className={({ isActive }) =>
                                    `w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13px] transition-all group pl-10 ` +
                                    (isActive
                                      ? 'bg-primary text-white font-medium'
                                      : 'text-white/60 hover:text-white hover:bg-white/5')
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <ChildIcon
                                          strokeWidth={1.5}
                                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                            isActive ? 'text-white' : 'text-white/50 group-hover:text-white'
                                          }`}
                                        />
                                        <span className="truncate">{child.title}</span>
                                      </div>
                                      {childBadgeCount > 0 && (
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                            child.badgeColor || 'bg-info text-white'
                                          }`}
                                        >
                                          {childBadgeCount}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path!}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] transition-all mb-1 group ` +
                        (isActive
                          ? 'bg-primary text-white font-medium shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              strokeWidth={1.5}
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {badgeCount > 0 && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                  item.badgeColor || 'bg-info text-white'
                                }`}
                              >
                                {badgeCount}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                                isActive ? 'opacity-100 text-white/50' : 'text-white/40'
                              }`}
                            />
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}
      
      {/* Desktop/Mobile Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </div>
    </>
  );
};
