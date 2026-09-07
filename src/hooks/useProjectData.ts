import { useState } from 'react';

export interface ProjectTrend {
  label: string;
  realisasi: number;
}

export interface ProjectData {
  id: string;
  title: string;
  manager: string;
  deadline: string;
  status: 'On Track' | 'Delayed' | 'At Risk';
  actual: number;
  trend?: ProjectTrend[];
}

export function useGetProjects() {
  const [data, setData] = useState<ProjectData[]>([]);

  const updateProject = (id: string, updates: Partial<ProjectData>) => {
    setData(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addProject = (project: Omit<ProjectData, 'id' | 'trend'>) => {
    const newId = `PRJ-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, '0')}`;
    const newProject: ProjectData = {
      ...project,
      id: newId,
      trend: [{ label: 'Bulan 1', realisasi: project.actual }]
    };
    setData(prev => [newProject, ...prev]);
  };

  return {
    data,
    updateProject,
    addProject,
    isLoading: false,
    error: null
  };
}
