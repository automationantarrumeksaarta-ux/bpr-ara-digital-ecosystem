import React from 'react';
import { TaskItem } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface BEISAnalyticsProps {
  tasks: TaskItem[];
}

export const BEISAnalytics: React.FC<BEISAnalyticsProps> = ({ tasks }) => {
  // Calculate stats
  const totalTasks = tasks.length;
  const inProgress = tasks.filter(t => t.status !== 'Selesai' && t.status !== 'Validated Closed' && t.status !== 'Accepted').length;
  const closed = tasks.filter(t => t.status === 'Validated Closed' || t.status === 'Accepted' || t.status === 'Selesai').length;
  
  const overdue = tasks.filter(t => {
    if (!t.deadline || t.status === 'Selesai' || t.status === 'Validated Closed' || t.status === 'Accepted') return false;
    return new Date(t.deadline) < new Date();
  }).length;

  // Prepare data for Domain Chart
  const domains = ['ADM', 'OPS', 'CRD', 'COL', 'FND', 'MKT', 'HCM', 'CRK', 'ITD', 'EXE', 'LGL', 'KIM'];
  const domainData = domains.map(d => ({
    name: d,
    count: tasks.filter(t => t.beisDomain === d || (t.taskId && t.taskId.includes(`-${d}-`))).length
  }));

  // Prepare data for Status Pie Chart
  const statusData = [
    { name: 'Selesai', value: closed },
    { name: 'Dalam Proses', value: inProgress },
    { name: 'Overdue', value: overdue }
  ].filter(d => d.value > 0);
  
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Dokumen</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalTasks}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-blue-400/80 uppercase tracking-wider">Sedang Proses</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{inProgress}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-emerald-400/80 uppercase tracking-wider">Selesai / Validated</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{closed}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-red-400/80 uppercase tracking-wider">Overdue (Lewat SLA)</p>
          <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{overdue}</p>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Sebaran Dokumen per Domain</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#18181B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Status Keseluruhan</h3>
          <div className="h-64 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#fff', borderRadius: '8px' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-sm">Belum ada data</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
