import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Globe, HelpCircle, Lock, LogOut, Monitor, User,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Avatar, AppBar, Badge, Card, ListGroup, ListRow, Screen, Section, Stack } from '../ui/primitives';
import { ink, radius, text, tone } from '../ui/tokens';

const MobileProfile: React.FC = () => {
  const { currentUser, setIsAuthenticated, setCurrentUser } = useApp();
  const navigate = useNavigate();

  const keluar = () => {
    // Token wajib dibuang. Versi sebelumnya hanya mengosongkan state React,
    // sehingga auth_token tetap tersimpan dan sesi hidup lagi setelah refresh.
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/', { replace: true });
  };

  const nama = currentUser?.name || 'Pengguna';

  return (
    <Screen>
      <AppBar title="Profil" />

      <Stack>
        <Card className="flex items-center gap-3.5">
          <Avatar name={nama} size={56} />
          <div className="min-w-0 flex-1">
            <p className={`${text.headline} ${ink.strong} truncate`}>{nama}</p>
            <p className={`${text.footnote} ${ink.muted} truncate mt-0.5`}>
              {currentUser?.email ?? '—'}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {currentUser?.role && <Badge toneName="primary">{currentUser.role}</Badge>}
              {currentUser?.unit && <Badge>{currentUser.unit}</Badge>}
            </div>
          </div>
        </Card>

        <Section title="Akun">
          <ListGroup>
            <ListRow icon={User} title="Informasi pribadi" subtitle="Nama, NIK, no. HP, email" onClick={() => {}} />
            <ListRow icon={Briefcase} title="Data kepegawaian" subtitle="Unit, jabatan, status" onClick={() => {}} />
            <ListRow icon={Lock} title="Ubah kata sandi" onClick={() => {}} />
          </ListGroup>
        </Section>

        <Section title="Aplikasi">
          <ListGroup>
            <ListRow icon={Globe} title="Bahasa" value="Indonesia" onClick={() => {}} />
            <ListRow
              icon={Monitor}
              title="Buka versi web"
              subtitle="Akses seluruh modul di layar penuh"
              onClick={() => navigate('/dashboard')}
            />
            <ListRow icon={HelpCircle} title="Bantuan & FAQ" onClick={() => {}} />
          </ListGroup>
        </Section>

        <button
          type="button"
          onClick={keluar}
          className={`min-h-[48px] ${radius.control} ${tone.danger.bgSoft} ${tone.danger.text} ${text.body} font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Keluar
        </button>

        <p className={`${text.caption} ${ink.faint} text-center`}>
          BPR ARA Digital Ecosystem
        </p>

        <div className="h-2" />
      </Stack>
    </Screen>
  );
};

export default MobileProfile;
