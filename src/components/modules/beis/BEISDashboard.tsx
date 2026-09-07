import React, { useState } from 'react';
import { User, TaskItem } from '../../../types';
import { BEISAnalytics } from './BEISAnalytics';
import { BEISRepository } from './BEISRepository';
import { BEISTaxonomy } from './BEISTaxonomy';
import { BEISValidator } from './BEISValidator';
import { Database, BarChart2, FolderTree, Tags, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BEISDashboardProps {
  currentUser: User;
  tasks: TaskItem[];
}

type SubTab = 'analytics' | 'repository' | 'taxonomy' | 'validator';

export const BEISDashboard: React.FC<BEISDashboardProps> = ({ currentUser, tasks }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('analytics');

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#121214]">
      {/* Header */}
      <div className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 px-6 py-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          BEIS Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Business Engineering Information System - Monitoring & Taxonomy
        </p>

        {/* Sub-navigation */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analytics
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('repository')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'repository'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Repository Map
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'taxonomy'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Tags className="w-4 h-4" />
            Taksonomi
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'validator'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Peta Validator
          </motion.button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'analytics' && <BEISAnalytics tasks={tasks} />}
            {activeTab === 'repository' && <BEISRepository tasks={tasks} />}
            {activeTab === 'taxonomy' && <BEISTaxonomy currentUser={currentUser} />}
            {activeTab === 'validator' && <BEISValidator currentUser={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
