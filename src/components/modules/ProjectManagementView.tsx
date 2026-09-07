import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useGetProjects, ProjectData } from '../../hooks/useProjectData';
import { Briefcase, Plus, Calendar, CheckCircle2, AlertTriangle, BarChart3, User, Search } from 'lucide-react';
import { PageContainer, PageHeader, Card, CardContent, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Input, Select, PointsChart } from '../ui';

export const ProjectManagementView: React.FC = () => {
  const { currentUser } = useApp();
  const isSuperAdmin = currentUser?.role === 'Master Admin';
  const { data: projects = [], isLoading, error, updateProject, addProject } = useGetProjects();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: '', manager: '', deadline: '', status: 'On Track', actual: 0 });
  
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editForm, setEditForm] = useState({ status: '', actual: 0 });

  const handleOpenEdit = (proj: ProjectData) => {
    setEditingProject(proj);
    setEditForm({ status: proj.status, actual: proj.actual });
  };

  const handleSaveEdit = () => {
    if (editingProject && updateProject) {
      updateProject(editingProject.id, { 
        status: editForm.status as 'On Track' | 'Delayed' | 'At Risk', 
        actual: editForm.actual 
      });
      setEditingProject(null);
    }
  };

  const handleAddNewProject = () => {
    if (addProject && newProjectForm.title && newProjectForm.manager) {
      addProject({
        title: newProjectForm.title,
        manager: newProjectForm.manager,
        deadline: newProjectForm.deadline || new Date().toISOString().split('T')[0],
        status: newProjectForm.status as 'On Track' | 'Delayed' | 'At Risk',
        actual: newProjectForm.actual
      });
      setIsAddingProject(false);
      setNewProjectForm({ title: '', manager: '', deadline: '', status: 'On Track', actual: 0 });
    }
  };
  
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusVariant = (status: string): "success" | "danger" | "warning" | "neutral" => {
    switch(status) {
      case 'On Track': return 'success';
      case 'Delayed': return 'danger';
      case 'At Risk': return 'warning';
      default: return 'neutral';
    }
  };

  const chartData = React.useMemo(() => {
    const trend = (projects.length > 0 && projects[0].trend && projects[0].trend.length > 0) ? projects[0].trend : [];
    
    return trend.map((t, i) => {
      const prevRealisasi = i > 0 ? trend[i-1].realisasi : 0;
      return {
        date: t.label,
        total: t.realisasi,
        change: t.realisasi - prevRealisasi
      };
    });
  }, [projects]);

  if (isLoading) return <div className="p-6">Loading projects...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading projects</div>;

  return (
    <PageContainer>
      <PageHeader
        title="Manajemen Project Lintas Divisi"
        description="Pantau status, timeline, dan pencapaian inisiatif strategis perusahaan."
        badge="PROJECT MANAGEMENT"
        badgeVariant="info"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Cari project..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#18181B] w-full sm:w-64"
              />
            </div>
            {isSuperAdmin && (
              <Button variant="primary" className="gap-2" onClick={() => setIsAddingProject(true)}>
                <Plus size={16} /> Project Baru
              </Button>
            )}
          </div>
        }
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card variant="glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Project</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{projects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">On Track</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{projects.filter(p => p.status === 'On Track').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Delayed</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{projects.filter(p => p.status === 'Delayed').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Avg Progress</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {Math.round(projects.reduce((sum, p) => sum + p.actual, 0) / (projects.length || 1))}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PROJECT LIST */}
      <Card variant="glass" className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Daftar Inisiatif & Project</h3>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Project</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length > 0 ? filteredProjects.map(proj => (
              <TableRow key={proj.id}>
                <TableCell>
                  <p className="font-semibold text-slate-800 dark:text-white">{proj.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">ID: {proj.id}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400">
                      <User size={12} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-200">{proj.manager}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-300">
                    <Calendar size={12} className="text-slate-400 dark:text-gray-500" />
                    {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(proj.status)}>
                    {proj.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden w-24">
                      <div 
                        className={`h-full rounded-full ${proj.actual >= 80 ? 'bg-emerald-500' : proj.actual >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${proj.actual}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-gray-200 w-8 text-right">{proj.actual}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {(isSuperAdmin || proj.manager === currentUser?.name) && (
                    <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400" onClick={() => handleOpenEdit(proj)}>
                      Update
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-slate-500 dark:text-gray-400">
                  Tidak ada project yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      {/* BURN-UP CHART */}
      <Card variant="glass">
        <CardContent className="p-6">
          <PointsChart 
            data={chartData} 
            title="Trend Penyelesaian Keseluruhan Project (Burn-up)" 
            headerRight={<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Kumulatif Progress Mingguan</p>}
          />
        </CardContent>
      </Card>
      
      {/* EDIT MODAL */}
      <Modal 
        isOpen={!!editingProject} 
        onClose={() => setEditingProject(null)} 
        title="Update Progress Project"
      >
        {editingProject && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{editingProject.title}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">ID: {editingProject.id}</p>
            </div>
            
            <Select
              label="Status Project"
              value={editForm.status}
              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="On Track">On Track</option>
              <option value="Delayed">Delayed</option>
              <option value="At Risk">At Risk</option>
            </Select>
            
            <Input
              label="Actual Progress (%)"
              type="number"
              min={0}
              max={100}
              value={editForm.actual}
              onChange={(e) => setEditForm(prev => ({ ...prev, actual: Number(e.target.value) }))}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
              <Button variant="outline" onClick={() => setEditingProject(null)}>Batal</Button>
              <Button variant="primary" onClick={handleSaveEdit}>Simpan Perubahan</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD MODAL */}
      <Modal 
        isOpen={isAddingProject} 
        onClose={() => setIsAddingProject(false)} 
        title="Tambah Project Baru"
      >
        <div className="space-y-4">
          <Input
            label="Nama Project"
            value={newProjectForm.title}
            onChange={(e) => setNewProjectForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Cth: Pengembangan Fitur X"
          />
          <Input
            label="Manager / PIC"
            value={newProjectForm.manager}
            onChange={(e) => setNewProjectForm(prev => ({ ...prev, manager: e.target.value }))}
            placeholder="Cth: Budi Santoso"
          />
          <Input
            label="Deadline"
            type="date"
            value={newProjectForm.deadline}
            onChange={(e) => setNewProjectForm(prev => ({ ...prev, deadline: e.target.value }))}
          />
          
          <Select
            label="Status Awal"
            value={newProjectForm.status}
            onChange={(e) => setNewProjectForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
            <option value="At Risk">At Risk</option>
          </Select>
          
          <Input
            label="Progress Awal (%)"
            type="number"
            min={0}
            max={100}
            value={newProjectForm.actual}
            onChange={(e) => setNewProjectForm(prev => ({ ...prev, actual: Number(e.target.value) }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsAddingProject(false)}>Batal</Button>
            <Button variant="primary" onClick={handleAddNewProject} disabled={!newProjectForm.title || !newProjectForm.manager}>Buat Project</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
