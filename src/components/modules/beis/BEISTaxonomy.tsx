import React, { useState, useEffect } from 'react';
import { User, BEISCategoryItem } from '../../../types';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';

interface BEISTaxonomyProps {
  currentUser: User;
}

export const BEISTaxonomy: React.FC<BEISTaxonomyProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<BEISCategoryItem[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<BEISCategoryItem>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser.role === 'Super Admin' || currentUser.unit === 'PMO';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      const saved = localStorage.getItem('beis_categories');
      if (saved) {
        setCategories(JSON.parse(saved));
      } else {
        setCategories([]);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
      setCategories([]);
    }
  };

  const saveCategories = (newCategories: BEISCategoryItem[]) => {
    localStorage.setItem('beis_categories', JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({ level: 'L01', domain: 'ADM', code: '', name: '' });
  };

  const handleEdit = (cat: BEISCategoryItem) => {
    setIsEditing(cat.id);
    setIsCreating(false);
    setFormData(cat);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      alert("Kode dan Nama harus diisi!");
      return;
    }

    if (isCreating) {
      const newCat: BEISCategoryItem = {
        ...(formData as BEISCategoryItem),
        id: `cat-${Date.now()}`
      };
      saveCategories([...categories, newCat]);
    } else if (isEditing) {
      const updated = categories.map(c => c.id === isEditing ? { ...c, ...formData } as BEISCategoryItem : c);
      saveCategories(updated);
    }
    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
      const updated = categories.filter(c => c.id !== id);
      saveCategories(updated);
    }
  };

  const filtered = categories.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        {isAdmin && !isCreating && !isEditing && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {(isCreating || isEditing) ? (
        <div className="bg-white dark:bg-[#18181B] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {isCreating ? 'Tambah Kategori Taksonomi' : 'Edit Kategori'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select
                value={formData.level || 'L01'}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
              >
                {Array.from({length: 12}).map((_, i) => {
                  const lvl = `L${(i+1).toString().padStart(2, '0')}`;
                  return <option key={lvl} value={lvl}>{lvl}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
              <select
                value={formData.domain || 'ADM'}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
              >
                {['ADM','OPS','CRD','COL','FND','MKT','HCM','CRK','ITD','EXE','LGL','KIM'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Dokumen</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white uppercase"
                placeholder="Contoh: SOP"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Taksonomi</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
                placeholder="Contoh: Standar Operasional Prosedur"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3">Level</th>
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">Kode Dokumen</th>
                <th className="px-6 py-3 w-full">Nama Taksonomi</th>
                {isAdmin && <th className="px-6 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filtered.length > 0 ? (
                filtered.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-medium">{cat.level}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {cat.domain}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-blue-600 dark:text-blue-400">{cat.code}</td>
                    <td className="px-6 py-3">{cat.name}</td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada data taksonomi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
