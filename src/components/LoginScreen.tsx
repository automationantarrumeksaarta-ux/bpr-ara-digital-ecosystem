import React, { useState } from 'react';
import { User as UserProfile, RoleTier, UserRole } from '../types';
import { INITIAL_USERS } from '../mock/initialData';
import { BEIS_UNITS } from '../utils/beisUtils';
import { Lock, User, KeyRound, Shield, AlertCircle, ArrowRight, UserPlus, Building, BadgeCheck, Mail, Users, ArrowLeft } from 'lucide-react';
import { OTPVerification } from './OTPVerification';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('123');
  const [regUnit, setRegUnit] = useState<string>('BIS');
  const [regRoleTier, setRegRoleTier] = useState<RoleTier>('LOW');
  
  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [pendingToken, setPendingToken] = useState<string>('');
  const [otpContext, setOtpContext] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState('');

  const TIER_MAP: Record<string, RoleTier> = {
    'High': 'HIGH', 'Mid': 'MID', 'Low': 'LOW',
    'HIGH': 'HIGH', 'MID': 'MID', 'LOW': 'LOW',
    'TOP': 'TOP', 'Super Admin': 'Super Admin'
  };

  const getStoredUsers = (): UserProfile[] => {
    try {
      const saved = localStorage.getItem('flowtask_users_v2');
      let storedUsers: UserProfile[] = [];
      if (saved) {
        storedUsers = (JSON.parse(saved) as UserProfile[]).map(u => ({
          ...u,
          roleTier: TIER_MAP[u.roleTier as string] || 'LOW'
        }));
      } else {
        const oldCustom = localStorage.getItem('flowtask_custom_users');
        const customArray = oldCustom ? JSON.parse(oldCustom) as UserProfile[] : [];
        storedUsers = [...INITIAL_USERS, ...customArray];
      }
      const mergedMap = new Map<string, UserProfile>();
      INITIAL_USERS.forEach(u => mergedMap.set(u.id, u));
      storedUsers.forEach(u => mergedMap.set(u.id, u));
      const merged = Array.from(mergedMap.values());
      localStorage.setItem('flowtask_users_v2', JSON.stringify(merged));
      return merged;
    } catch (e) {
      return INITIAL_USERS;
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const query = identifier.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Harap masukkan Username atau Email.');
      return;
    }

    const allUsers = getStoredUsers();
    const foundUser = allUsers.find(
      (u) => (u.username?.toLowerCase() === query || u.email?.toLowerCase() === query) && (u.password === password || password === '123')
    );

    if (foundUser) {
      setPendingUser(foundUser);
      setPendingToken('mock-token-' + foundUser.id);
      setOtpContext('login');
      setOtpCode('');
      setAuthStep('otp');
    } else {
      setErrorMsg('Login gagal. Periksa username dan password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim()) {
      setErrorMsg('Harap isi Nama Lengkap, Username, dan Email.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase().replace(/\s+/g, '');
    const allUsers = getStoredUsers();
    
    if (allUsers.some(u => u.username?.toLowerCase() === cleanUsername)) {
      setErrorMsg('Username ini sudah terdaftar! Pilih username lain.');
      return;
    }

    const tabName = regName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

    let mappedRole: UserRole = 'Staff / Member';
    if (regRoleTier === 'Super Admin') mappedRole = 'Super Admin';
    else if (regRoleTier === 'TOP' || regRoleTier === 'HIGH' || regRoleTier === 'MID') mappedRole = 'Atasan / Manager';
    
    const newUser = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      username: cleanUsername,
      password: regPassword || '123',
      role: mappedRole,
      roleTier: regRoleTier,
      unit: regUnit,
      assignedMemberTab: tabName,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
      pinCode: '1234',
      twoFactorEnabled: false,
      emailNotifications: true,
      calendarConnected: false
    } as UserProfile;

    setPendingUser(newUser);
    setOtpContext('register');
    setOtpCode('');
    setAuthStep('otp');
  };

  const handleQuickDemo = (user: UserProfile) => {
    setIdentifier(user.username || user.email);
    setPassword(user.password || '123');
    setActiveTab('login');
    setAuthStep('form');
  };

  const allUsersList = getStoredUsers();

  return (
    <div className="min-h-screen w-full flex bg-[#FAF9F6] dark:bg-[#121214]">
      
      {/* Left Panel - Form Area */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 relative py-8 overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-8 mt-auto mb-auto">
          
          {/* Brand Logo & Title */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <img src="/logo.png" alt="Logo BPR ARA" className="w-16 h-16 object-contain" />
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Comfortaa', sans-serif", fontWeight: 900 }}>
                BPR ARA
              </h1>
            </div>
            
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {authStep === 'otp' ? 'Verifikasi Akses' : 'Selamat Datang'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {authStep === 'otp' ? 'Keamanan Dua Tahap (2FA)' : 'Silakan masuk ke akun Anda'}
              </p>
            </div>
          </div>

          {authStep === 'form' ? (
            <>
              {/* Tab Pill Selector */}
              <div className="bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-2xl flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Signup
                </button>
              </div>

              {/* Form Content */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-4">
                    {/* Input: Username */}
                    <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors group shadow-sm hover:border-gray-300 dark:hover:border-gray-600">
                      <div className="pl-4 pr-3 flex items-center justify-center text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 px-4 relative flex flex-col justify-center min-h-[56px]">
                        <input
                          type="text"
                          id="username"
                          value={identifier}
                          onChange={(e) => { setIdentifier(e.target.value); setErrorMsg(''); }}
                          placeholder=" "
                          className="peer w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none pt-4 pb-1 z-10 relative"
                        />
                        <label htmlFor="username" className="absolute left-4 top-1/2 -translate-y-[22px] scale-[0.85] origin-left text-xs font-bold text-gray-400 uppercase tracking-wider transition-transform duration-300 ease-out pointer-events-none peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:-translate-y-[22px] peer-focus:scale-[0.85] z-0">
                          Username / Email
                        </label>
                      </div>
                    </div>

                    {/* Input: Password */}
                    <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors group shadow-sm hover:border-gray-300 dark:hover:border-gray-600">
                      <div className="pl-4 pr-3 flex items-center justify-center text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 px-4 relative flex flex-col justify-center min-h-[56px]">
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                          placeholder=" "
                          className="peer w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none pt-4 pb-1 z-10 relative"
                        />
                        <label htmlFor="password" className="absolute left-4 top-1/2 -translate-y-[22px] scale-[0.85] origin-left text-xs font-bold text-gray-400 uppercase tracking-wider transition-transform duration-300 ease-out pointer-events-none peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:-translate-y-[22px] peer-focus:scale-[0.85] z-0">
                          Password
                        </label>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl shadow-md transition-all hover:shadow-lg"
                  >
                    <span>Continue</span>
                  </button>
                </form>
              ) : (
                /* Register Form (Langkah 1) */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                      <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white"><Mail className="w-5 h-5" /></div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alamat Email</label>
                        <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none" />
                      </div>
                    </div>

                    <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                      <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white"><User className="w-5 h-5" /></div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Nama Lengkap</label>
                        <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Username</label>
                          <input type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none" />
                        </div>
                      </div>
                      <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Password</label>
                          <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Kode Unit</label>
                          <select value={regUnit} onChange={(e) => setRegUnit(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none appearance-none cursor-pointer">
                            {BEIS_UNITS.map(u => <option key={u.code} value={u.code}>{u.code}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="relative flex items-center border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#18181A] overflow-hidden focus-within:border-gray-400 transition-colors group shadow-sm">
                        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Role Tier</label>
                          <select value={regRoleTier} onChange={(e) => setRegRoleTier(e.target.value as RoleTier)} className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none appearance-none cursor-pointer">
                            <option value="LOW">LOW</option>
                            <option value="MID">MID</option>
                            <option value="HIGH">HIGH</option>
                            <option value="TOP">TOP</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl shadow-md transition-all mt-4">
                    Lanjutkan ke Verifikasi Email
                  </button>
                </form>
              )}

              {/* Or Continue With Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atau Coba Akun Demo</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>

              {/* Demo Accounts List */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allUsersList.filter(u => ['usr-dirut', 'usr-kacab', 'usr-ao', 'usr-kolektor', 'usr-analis'].includes(u.id)).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickDemo(user)}
                    className="flex-shrink-0 flex items-center gap-2.5 p-2 pr-4 bg-white dark:bg-[#18181A] border border-gray-200 dark:border-gray-800 rounded-full hover:border-gray-400 dark:hover:border-gray-600 transition-colors group shadow-xs"
                  >
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="text-left">
                      <span className="block text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-black leading-tight">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="block text-[9px] text-gray-500 font-medium leading-tight uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* OTP Verification Step with Framer Motion */
            <div className="w-full flex flex-col h-[400px]">
              <OTPVerification 
                email={pendingUser?.email || pendingUser?.username || ''}
                onBack={() => setAuthStep('form')}
                onVerify={async (code) => {
                  await new Promise(r => setTimeout(r, 1500)); // Simulate network
                  if (code === '123456' || code === '123123') {
                    if (otpContext === 'register' && pendingUser) {
                      try {
                        const saved = localStorage.getItem('flowtask_users_v2');
                        let custom = saved ? JSON.parse(saved) : INITIAL_USERS;
                        localStorage.setItem('flowtask_users_v2', JSON.stringify([...custom, pendingUser]));
                      } catch (e) {
                        console.error('Failed saving user to storage:', e);
                      }
                    } else {
                      if (pendingToken) localStorage.setItem('auth_token', pendingToken);
                    }
                    return true;
                  }
                  return false;
                }}
                onSuccessComplete={() => {
                  if (pendingUser) {
                    onLoginSuccess(pendingUser);
                  }
                }}
              />
            </div>
          )}

          {/* Footer Text */}
          <div className="pt-6 text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
              Join the smart enterprise users who trust BPR ARA to manage their daily operations. Log in to access your personalized dashboard, track your portfolio performance, and make informed decisions.
            </p>
          </div>

        </div>
      </div>

      {/* Right Panel - Visual Background */}
      <div className="hidden lg:flex w-[55%] relative items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
        {/* Solid gradient background for the transparent PNG */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-gray-900 dark:from-gray-900 dark:via-gray-950 dark:to-black"></div>
        <img 
          src="/login-bg.png" 
          alt="BPR ARA Building" 
          className="absolute inset-0 w-full h-full object-contain opacity-90 drop-shadow-2xl translate-y-12"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
        
        {/* Subtle decorative elements */}
        <div className="relative z-10 w-full max-w-lg p-12">
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
             <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white/80" />
             </div>
             <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight tracking-tight">
               Manajemen Tim <br/> Lebih Efisien.
             </h2>
             <p className="text-gray-300 text-sm leading-relaxed font-medium">
               Akses ruang kerja kolaboratif yang terintegrasi dengan struktur Otoritas Hierarki Ganda dan sistem KPI otomatis.
             </p>
          </div>
        </div>
      </div>

    </div>
  );
};
