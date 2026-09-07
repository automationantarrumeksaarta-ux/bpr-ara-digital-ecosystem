import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { navigationConfig } from '../../config/navigationConfig';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Find current group and item based on path
  let currentGroup = null;
  let currentItem = null;

  for (const group of navigationConfig) {
    for (const item of group.items) {
      if (item.path === currentPath) {
        currentGroup = group;
        currentItem = item;
        break;
      }
    }
    if (currentItem) break;
  }

  if (!currentGroup || !currentItem) {
    return null;
  }

  return (
    <nav className="flex items-center text-xs text-slate-500 font-medium">
      <span className="hidden sm:inline">{currentGroup.label}</span>
      <ChevronRight className="hidden sm:block w-3.5 h-3.5 mx-1 text-slate-300" />
      <span className="text-slate-800 dark:text-slate-200">{currentItem.title}</span>
    </nav>
  );
};
