import React, { useState, useEffect } from 'react';
import { INITIAL_USERS } from '../../mock/initialData';
import { navigationConfig } from '../../config/navigationConfig';
import { 
  ShieldAlert, Users, Network, Save, Search, Filter,
  CheckCircle2, AlertCircle, UserCog, Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer, PageHeader } from '../ui/PageContainer';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Modal } from '../ui/Modal';

export const SuperAdminView: React.FC = () => {
  const { rolePermissions, updateRolePermissions } = useApp();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real users from database
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDbUsers(data.users || []);
        }
      } catch (e) {
        console.error('Failed to fetch users from DB:', e);
      }
    };
    fetchUsers();
  }, []);
  
  
  // Permissions Edit State
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  
  // Mock manual routing state (Mapping UserId -> SupervisorId)
  const [taskRoutes, setTaskRoutes] = useState<Record<string, string>>({});
  
  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map((u: any) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleRouteUpdate = (userId: string, supervisorId: string) => {
    setTaskRoutes(prev => ({
      ...prev,
      [userId]: supervisorId
    }));
  };

  const getAccessibleMenus = (role: string) => {
    if (role === 'Master Admin') return ['Semua Modul / Akses Penuh'];
    
    // Read from dynamic permissions first
    if (rolePermissions && rolePermissions[role] && rolePermissions[role].length > 0) {
      return rolePermissions[role];
    }
    
    // Fallback to static config
    const menus: string[] = [];
    navigationConfig.forEach(group => {
      group.items.forEach(item => {
        if (!item.allowedRoles || (item.allowedRoles as string[]).includes(role)) {
          menus.push(item.title);
        }
      });
    });
    return menus;
  };

  const handleEditAccessClick = (role: string) => {
    setEditingRole(role);
    setEditingPermissions(getAccessibleMenus(role));
  };

  const handleTogglePermission = (menuTitle: string) => {
    setEditingPermissions(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(p => p !== menuTitle)
        : [...prev, menuTitle]
    );
  };

  const handleSavePermissions = () => {
    if (editingRole) {
      updateRolePermissions(editingRole, editingPermissions);
      setEditingRole(null);
    }
  };

  const handleSave = () => {
    alert("Konfigurasi sistem berhasil disimpan!");
  };

  // Merge mock users with real DB users
  const allUsers = (() => {
    const mockIds = new Set(users.map((u: any) => u.id));
    const dbMapped = dbUsers
      .filter(u => !mockIds.has(u.id))
      .map(u => ({
        id: u.id,
        name: u.name || u.username,
        username: u.username,
        email: u.email,
        role: u.role || 'User',
        roleTier: u.roleTier || 'LOW',
        roleTitle: u.role || 'User',
        branchId: u.unit || 'PMO',
        unit: u.unit || 'PMO',
        status: u.status || 'active',
        avatarColor: '#6366f1',
        created_at: u.created_at,
      }));
    return [...users, ...dbMapped];
  })();

  const filteredUsers = allUsers.filter((u: any) => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.branchId || u.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <PageHeader
        title="Super Admin & Pengaturan Sistem"
        description="Pusat kendali akses akun dan rute penugasan (FlowTask) seluruh ekosistem."
        badge="RESTRICTED ACCESS"
        badgeVariant="danger"
      >
        <Button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="w-4 h-4" /> Simpan Perubahan
        </Button>
      </PageHeader>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari user, NIP, atau jabatan..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      <Tabs defaultValue="akun" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="akun" className="flex items-center gap-2 px-6">
            <UserCog className="w-4 h-4" /> Manajemen Akun & Role
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2 px-6">
            <Network className="w-4 h-4" /> Routing Manual FlowTask
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MANAJEMEN AKUN */}
        <TabsContent value="akun">
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Nama Pegawai</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Hak Akses (Role) Saat Ini</th>
                    <th className="px-6 py-4">Akses Modul Terbuka</th>
                    <th className="px-6 py-4 text-center">Edit Akses</th>
                    <th className="px-6 py-4">Ubah Role</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{user.nip}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{user.branchId}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'Master Admin' ? 'danger' : 'primary'}>{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {getAccessibleMenus(user.role).slice(0, 4).map((m, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              {m}
                            </span>
                          ))}
                          {getAccessibleMenus(user.role).length > 4 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded border border-blue-100 dark:border-blue-800">
                              +{getAccessibleMenus(user.role).length - 4} modul lain
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs py-1 h-auto"
                          onClick={() => handleEditAccessClick(user.role)}
                          disabled={user.role === 'Master Admin'}
                        >
                          Atur Akses
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="w-full max-w-[180px] text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="Komisaris Utama">Komisaris Utama</option>
                          <option value="Komisaris">Komisaris</option>
                          <option value="Direktur Utama">Direktur Utama</option>
                          <option value="Direktur YMFK">Direktur YMFK</option>
                          <option value="PE Audit Intern & Strategi Anti Fraud">PE Audit Intern & Strategi Anti Fraud</option>
                          <option value="PE Kepatuhan, Manrisk, APU PPT">PE Kepatuhan, Manrisk, APU PPT</option>
                          <option value="PE Literasi & Edukasi, PE Bisnis & Collection">PE Literasi & Edukasi, PE Bisnis & Collection</option>
                          <option value="TEKNOLOGI INFORMASI (TI)">TEKNOLOGI INFORMASI (TI)</option>
                          <option value="CRM & DIGITALISASI">CRM & DIGITALISASI</option>
                          <option value="ADMIN - SDM - LEGAL">ADMIN - SDM - LEGAL</option>
                          <option value="PENGEMBANGAN SDM">PENGEMBANGAN SDM</option>
                          <option value="ACCOUNTING">ACCOUNTING</option>
                          <option value="ANALIS KREDIT">ANALIS KREDIT</option>
                          <option value="BAGIAN UMUM">BAGIAN UMUM</option>
                          <option value="CUSTOMER SERVICE">CUSTOMER SERVICE</option>
                          <option value="Teller">Teller</option>
                          <option value="Marketing Dana">Marketing Dana</option>
                          <option value="Kepala Kas">Kepala Kas</option>
                          <option value="KOORDINATOR COLLECTION">KOORDINATOR COLLECTION</option>
                          <option value="STAFF COLLECTION">STAFF COLLECTION</option>
                          <option value="Account Officer">Account Officer</option>
                          <option value="Kepala Cabang">Kepala Cabang</option>
                          <option value="Surveyor">Surveyor</option>
                          <option value="Master Admin">Master Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: ROUTING MANUAL FLOWTASK */}
        <TabsContent value="routing">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300">Konfigurasi Routing Arahan (Manual)</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Tentukan secara spesifik kepada siapa seorang pegawai harus melaporkan atau meneruskan (assign) sebuah *FlowTask* secara default. Karena atasan setiap orang bisa berbeda (tidak bisa digeneralisir hanya dari *role*), gunakan matriks di bawah ini.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Pegawai (Pembuat Task)</th>
                    <th className="px-6 py-4">Jabatan</th>
                    <th className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> 
                        Lapor / Arahkan Task Ke (Atasan Langsung)
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.filter((u: any) => u.role !== 'Master Admin' && u.role !== 'Direktur Utama').map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.branchId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="w-full max-w-[300px] text-xs p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                          value={taskRoutes[user.id] || ""}
                          onChange={(e) => handleRouteUpdate(user.id, e.target.value)}
                        >
                          <option value="">-- Pilih Atasan / Penerima Task Default --</option>
                          {users
                            .filter((u: any) => u.id !== user.id) // Cannot assign to self
                            .map((supervisor: any) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {supervisor.name} ({supervisor.role} - {supervisor.branchId})
                            </option>
                          ))}
                        </select>
                        {!taskRoutes[user.id] && (
                          <div className="mt-2 text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3" /> Belum diatur (Task akan menggantung)
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL EDIT AKSES ROLE */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Atur Hak Akses: ${editingRole}`}
        size="lg"
      >
        <div className="p-1 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4">
            Centang menu yang boleh diakses oleh pegawai dengan jabatan <strong>{editingRole}</strong>.
          </p>
          <div className="space-y-6">
            {navigationConfig.map(group => (
              <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">{group.label}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.items.map(item => (
                    <label key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={editingPermissions.includes(item.title)}
                        onChange={() => handleTogglePermission(item.title)}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.title}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={() => setEditingRole(null)}>Batal</Button>
          <Button onClick={handleSavePermissions} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan Akses</Button>
        </div>
      </Modal>

    </PageContainer>
  );
};
