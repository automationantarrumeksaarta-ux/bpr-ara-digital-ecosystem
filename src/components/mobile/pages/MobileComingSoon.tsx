import React from 'react';
import { Activity, Wallet } from 'lucide-react';
import { AppBar, Card, EmptyState, Screen, Stack } from '../ui/primitives';
import { ink, text } from '../ui/tokens';

/**
 * Layar untuk modul yang sudah punya tempat di navigasi tapi datanya belum
 * tersedia.
 *
 * Sengaja jujur, bukan diisi angka contoh. Menampilkan slip gaji palsu atau
 * grafik aktivitas karangan justru berbahaya di aplikasi perbankan — pengguna
 * tidak punya cara membedakannya dari data sungguhan.
 */
const ComingSoon: React.FC<{
  judul: string;
  icon: React.ElementType;
  keterangan: string;
}> = ({ judul, icon, keterangan }) => (
  <Screen>
    <AppBar title={judul} back />
    <Stack>
      <Card flush>
        <EmptyState icon={icon} title="Belum tersedia" description={keterangan} />
      </Card>
      <p className={`${text.caption} ${ink.faint} text-center px-6`}>
        Modul ini hanya ada di aplikasi mobile dan sedang disiapkan.
      </p>
    </Stack>
  </Screen>
);

export const MobileActivities: React.FC = () => (
  <ComingSoon
    judul="Activities"
    icon={Activity}
    keterangan="Ringkasan aktivitas harian Anda akan tampil di sini setelah sumber datanya terhubung."
  />
);

export const MobileInfoGaji: React.FC = () => (
  <ComingSoon
    judul="Info Gaji"
    icon={Wallet}
    keterangan="Slip gaji dan rincian komponen penghasilan akan tampil di sini setelah terhubung ke data payroll."
  />
);
