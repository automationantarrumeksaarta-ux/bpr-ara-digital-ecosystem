import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Shield } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onBack: () => void;
  onSuccessComplete?: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerify, onBack, onSuccessComplete }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'typing' | 'verifying' | 'success' | 'error'>('idle');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setStatus('typing');
    }

    // Check if complete
    if (newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
      setStatus('typing');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
      setStatus('typing');
    } else if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (code: string) => {
    setStatus('verifying');
    // Blur active input
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      const isValid = await onVerify(code);
      if (isValid) {
        setStatus('success');
        setTimeout(() => {
          if (onSuccessComplete) onSuccessComplete();
        }, 1200); // Wait for success animation
      } else {
        setStatus('error');
        setTimeout(() => {
          setOtp(['', '', '', '', '', '']);
          setStatus('idle');
          inputRefs.current[0]?.focus();
        }, 800); // Wait for shake
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: status === 'success' ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto relative flex flex-col h-full"
    >
      <button 
        type="button" 
        onClick={onBack}
        disabled={status === 'verifying' || status === 'success'}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 disabled:opacity-0 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="relative overflow-hidden p-8 sm:p-10 bg-white/60 dark:bg-[#18181A]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl">
        {/* Subtle animated background gradient during verifying */}
        <AnimatePresence>
          {status === 'verifying' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-50/50 dark:from-white/5 dark:to-transparent animate-pulse"
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center">
          
          <motion.div 
             animate={status === 'success' ? { scale: 0, opacity: 0, height: 0 } : { scale: 1, opacity: 1, height: 'auto' }}
             className="flex flex-col items-center text-center space-y-3 mb-8"
          >
             <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-2 shadow-inner border border-gray-200 dark:border-gray-700">
               <Shield className="w-6 h-6 text-gray-700 dark:text-gray-300" />
             </div>
             <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Verifikasi Identitas</h2>
             <p className="text-xs text-gray-500 font-medium px-4">
               Masukkan 6 digit kode yang dikirim ke <br/>
               <strong className="text-gray-900 dark:text-white mt-1 block">{email}</strong>
             </p>
          </motion.div>

          {/* SUCCESS STATE OVERLAY */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="absolute inset-0 flex flex-col items-center justify-center py-10"
              >
                 <div className="w-20 h-20 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center shadow-2xl mb-6">
                   <Check className="w-10 h-10 text-white dark:text-gray-900" strokeWidth={3} />
                 </div>
                 <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Terverifikasi!</h3>
                 <p className="text-xs text-gray-500 font-medium mt-2">Masuk ke sistem...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP INPUTS */}
          <motion.div 
             animate={status === 'success' ? { opacity: 0, y: 20, scale: 0.9 } : status === 'error' ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0, scale: 1 }}
             transition={status === 'error' ? { duration: 0.4 } : { duration: 0.3 }}
             className="flex gap-2 sm:gap-3 mb-6 relative"
          >
            {otp.map((digit, index) => (
              <motion.div
                key={index}
                animate={{
                   scale: digit ? 1 : 0.95,
                   y: status === 'verifying' ? [0, -5, 0] : 0
                }}
                transition={{
                   y: { repeat: Infinity, duration: 1, delay: index * 0.1 }
                }}
              >
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  disabled={status === 'verifying' || status === 'success'}
                  className={`w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-extrabold bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-all shadow-sm
                    ${status === 'error' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' : 
                      digit ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white shadow-md' : 
                      'border-gray-200 dark:border-gray-800 focus:border-gray-400 dark:focus:border-gray-500 text-gray-900 dark:text-white'}
                  `}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            animate={status === 'success' ? { opacity: 0 } : { opacity: 1 }}
            className="h-6 flex items-center justify-center mt-2"
          >
             {status === 'verifying' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-500 dark:border-gray-400 border-t-transparent animate-spin" />
                  Memverifikasi...
                </div>
             ) : status === 'error' ? (
                <span className="text-xs font-bold text-red-500">Kode salah, coba lagi!</span>
             ) : (
                <div className="text-[10px] font-bold text-gray-300 dark:text-gray-700 tracking-[0.5em] ml-2">●●●●●●</div>
             )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
