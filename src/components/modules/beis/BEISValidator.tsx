import React, { useState, useEffect } from 'react';
import { User, BEISValidatorItem } from '../../../types';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';

interface BEISValidatorProps {
  currentUser: User;
}

export const BEISValidator: React.FC<BEISValidatorProps> = ({ currentUser }) => {
  const [validators, setValidators] = useState<BEISValidatorItem[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<BEISValidatorItem>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser.role === 'Super Admin' || currentUser.unit === 'PMO';

  useEffect(() => {
    loadValidators();
  }, []);

  const loadValidators = () => {
    try {
      const saved = localStorage.getItem('beis_validators');
      if (saved) {
        setValidators(JSON.parse(saved));
      } else {
        setValidators([]);
      }
    } catch (e) {
      console.error('Failed to load validators', e);
      setValidators([]);
    }
  };

  const saveValidators = (newValidators: BEISValidatorItem[]) => {
    localStorage.setItem('beis_validators', JSON.stringify(newValidators));
    setValidators(newValidators);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({ domain: 'L01 - Administrative', pic: '', validator: '', trigger: '' });
  };

  const handleEdit = (val: BEISValidatorItem) => {
    setIsEditing(val.id);
    setIsCreating(false);
    setFormData(val);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.pic || !formData.validator || !formData.trigger) {
      alert("Semua field harus diisi!");
      return;
    }

    if (isCreating) {
      const newVal: BEISValidatorItem = {
        ...(formData as BEISValidatorItem),
        id: `val-${Date.now()}`
      };
      saveValidators([...validators, newVal]);
    } else if (isEditing) {
      const updated = validators.map(v => v.id === isEditing ? { ...v, ...formData } as BEISValidatorItem : v);
      saveValidators(updated);
    }
    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus peta validator ini?')) {
      const updated = validators.filter(v => v.id !== id);
      saveValidators(updated);
    }
  };

  const filtered = validators.filter(v => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return v.domain.toLowerCase().includes(q) || v.pic.toLowerCase().includes(q) || v.validator.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari validator..."
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
            Tambah Validator
          </button>
        )}
      </div>

      {(isCreating || isEditing) ? (
        <div className="bg-white dark:bg-[#18181B] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {isCreating ? 'Tambah Peta Validator' : 'Edit Peta Validator'}
          </h3>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
              <select
                value={formData.domain || 'L01 - Administrative'}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
              >
                {[
                  'L01 - Administrative', 'L02 - Operational', 'L03 - Credit', 'L04 - Collection',
                  'L05 - Funding', 'L06 - Marketing', 'L07 - Human Capital', 'L08 - Compliance & Risk',
                  'L09 - IT & Digital', 'L10 - Executive', 'L11 - Legal', 'L12 - Knowledge'
                ].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">PIC (Pembuat/Staff)</label>
                <input
                  type="text"
                  value={formData.pic || ''}
                  onChange={(e) => setFormData({...formData, pic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
                  placeholder="Contoh: Staff Operasional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Validator (Atasan)</label>
                <input
                  type="text"
                  value={formData.validator || ''}
                  onChange={(e) => setFormData({...formData, validator: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
                  placeholder="Contoh: Kepala Operasional"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger (Pemicu Workflow)</label>
              <input
                type="text"
                value={formData.trigger || ''}
                onChange={(e) => setFormData({...formData, trigger: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
                placeholder="Contoh: Setiap transaksi harian"
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
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">PIC</th>
                <th className="px-6 py-3">Validator</th>
                <th className="px-6 py-3">Trigger Workflow</th>
                {isAdmin && <th className="px-6 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filtered.length > 0 ? (
                filtered.map(val => (
                  <tr key={val.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-3 font-medium">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {val.domain}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-800 dark:text-gray-200">{val.pic}</td>
                    <td className="px-6 py-3 font-medium text-blue-600 dark:text-blue-400">{val.validator}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{val.trigger}</td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(val)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(val.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
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
                    Belum ada data peta validator.
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
