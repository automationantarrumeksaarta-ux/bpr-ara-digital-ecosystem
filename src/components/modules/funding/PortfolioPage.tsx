import React, { useState } from 'react';
import { useData } from '../../../context/FundingContext';
import { formatRupiah, formatDateIndo } from '../../../utils/funding/formatters';
import { Layers, Plus, Search, Trash2, Building2 } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../ui/Table';

interface PortfolioPageProps {
  onOpenAddModal: () => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ onOpenAddModal }) => {
  const { filteredActivePortfolio, selectedDate, deletePortfolioItem, selectedKasOffice, setSelectedKasOffice } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const displayList = filteredActivePortfolio.filter((item) => {
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        item.nama_sumber.toLowerCase().includes(q) ||
        item.kantor_kas.toLowerCase().includes(q) ||
        item.kategori_sumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Portofolio Berjalan (Snapshot)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Menampilkan posisi penghimpunan CASA & Deposito aktif per tanggal {formatDateIndo(selectedDate, 'long')}
          </p>
        </div>

        <Button onClick={onOpenAddModal} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Update Portofolio
        </Button>
      </Card>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            type="text"
            placeholder="Cari sumber/pasar/kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">Kantor Kas:</span>
          <Select
            value={selectedKasOffice}
            onChange={(e) => setSelectedKasOffice(e.target.value)}
            className="w-40"
          >
            <option value="All">Semua Kas</option>
            <option value="Matesih">Matesih</option>
            <option value="Klodran">Klodran</option>
            <option value="Jumapolo">Jumapolo</option>
            <option value="Kantor Pusat">Kantor Pusat</option>

          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Snapshot</TableHead>
                <TableHead>Kantor Kas</TableHead>
                <TableHead>Nama Sumber</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">NOA</TableHead>
                <TableHead className="text-right">Volume Nominal</TableHead>
                <TableHead>Jadwal / Ket.</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayList.length > 0 ? (
                displayList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-slate-500 dark:text-slate-400">
                      {formatDateIndo(item.tanggal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        {item.kantor_kas}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      {item.nama_sumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{item.kategori_sumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.produk === 'Tabungan' ? 'success' : 'info'}>
                        {item.produk}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.noa}
                    </TableCell>
                    <TableCell className="text-right font-black">
                      {formatRupiah(item.volume)}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-500">
                      {item.jadwal || item.keterangan || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => deletePortfolioItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 h-auto"
                        title="Hapus data snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada data portofolio snapshot untuk filter ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
