import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  User,
  Phone,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Apple,
  Facebook,
  Chrome,
  ShieldCheck,
  Send
} from 'lucide-react';
import { VaultProfile, UserProfile } from '../types';

interface LoginViewProps {
  onLogin: (userAccount?: UserProfile) => void;
  profiles: VaultProfile[];
  userEmail?: string;
  userName?: string;
}

type AuthStep = 'login' | 'signup' | 'phone-otp' | 'email-verify';
type OtpChannel = 'sms' | 'whatsapp';

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  profiles,
  userEmail = '',
  userName = '',
}) => {
  // Navigation & Mode
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('whatsapp');

  // Input Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification Codes
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('742918');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(60);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);

  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('528140');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const [emailResentToast, setEmailResentToast] = useState(false);

  // Status & Notifications
  const [error, setError] = useState('');
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);

  // Countdown timer for Phone OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authStep === 'phone-otp' && phoneOtpTimer > 0) {
      interval = setInterval(() => {
        setPhoneOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, phoneOtpTimer]);

  // Countdown timer for Email OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authStep === 'email-verify' && emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, emailOtpTimer]);

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-700' };
    if (pwd.length < 6) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (pwd.length < 9) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    }
    return { score: 75, label: 'Good', color: 'bg-blue-500' };
  };

  const strength = getPasswordStrength(password);

  // Generate random 6-digit OTP
  const generateNewOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Handle Sign In submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !username.trim()) {
      setError('Please enter your username, email, or phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    const newPhoneCode = generateNewOtp();
    setGeneratedPhoneOtp(newPhoneCode);
    setPhoneOtpInput('');
    setPhoneOtpTimer(60);
    setAuthStep('phone-otp');
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!password) {
      setError('Please create a password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    setError('');
    const newPhoneCode = generateNewOtp();
    setGeneratedPhoneOtp(newPhoneCode);
    setPhoneOtpInput('');
    setPhoneOtpTimer(60);
    setAuthStep('phone-otp');
  };

  // Handle Phone OTP Verification
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtpInput.trim() !== generatedPhoneOtp && phoneOtpInput.trim() !== '123456') {
      setError(`Invalid OTP. Please enter ${generatedPhoneOtp} or click auto-fill.`);
      return;
    }

    setError('');
    setPhoneOtpVerified(true);
    const newEmailCode = generateNewOtp();
    setGeneratedEmailOtp(newEmailCode);
    setEmailOtpInput('');
    setEmailOtpTimer(60);
    setAuthStep('email-verify');
  };

  // Resend Phone OTP
  const handleResendPhoneOtp = (channel?: OtpChannel) => {
    const selectedChan = channel || otpChannel;
    setOtpChannel(selectedChan);
    const newCode = generateNewOtp();
    setGeneratedPhoneOtp(newCode);
    setPhoneOtpTimer(60);
    setError('');
  };

  // Resend Email Verification Code
  const handleResendEmailOtp = () => {
    const newCode = generateNewOtp();
    setGeneratedEmailOtp(newCode);
    setEmailOtpTimer(60);
    setEmailResentToast(true);
    setTimeout(() => setEmailResentToast(false), 4000);
    setError('');
  };

  // Final Authentication & Login
  const handleCompleteAuthentication = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (emailOtpInput.trim() && emailOtpInput.trim() !== generatedEmailOtp && emailOtpInput.trim() !== '123456') {
      setError(`Invalid verification code. Enter ${generatedEmailOtp} or click auto-fill.`);
      return;
    }

    // Build the user profile with the exact entered credentials
    const displayName = username.trim() || email.split('@')[0] || 'User';
    const cleanEmail = email.trim() || `${displayName.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const cleanPhone = phone.trim() || '+1 (555) 234-5678';

    const authenticatedUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      age: 32,
      gender: 'Preferred not to say',
      bloodGroup: 'O Positive (O+)',
      dob: '1994-06-15',
      address: '742 Evergreen Terrace, San Francisco, CA',
      bio: 'Personal Health & Document Vault Account',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      securityPin: '1234',
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family Member',
        phone: cleanPhone,
      },
      medicalProfile: {
        allergies: ['Penicillin'],
        chronicConditions: ['None'],
        medications: ['Daily Multivitamin'],
        primaryDoctor: 'Dr. Evelyn Vance, MD',
        hospitalPreference: 'City Memorial Hospital',
        insurancePolicyNo: 'POL-CARE-2026',
      },
      securitySettings: {
        twoFactorEnabled: false,
        biometricEnabled: false,
        loginAlerts: true,
        autoLockMinutes: 15,
        lastPasswordChange: new Date().toISOString().split('T')[0],
        trustedDevicesCount: 1,
      },
    };

    onLogin(authenticatedUser);
  };

  // Handle Social Login (Google, Apple, Facebook)
  const handleSocialAuth = (provider: 'Google' | 'Apple' | 'Facebook') => {
    setActiveSocialProvider(provider);
    setError('');

    let socialName = '';
    let socialEmail = '';
    let socialAvatar = '';

    if (provider === 'Google') {
      socialName = 'Google Account User';
      socialEmail = 'alex.google@gmail.com';
      socialAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    } else if (provider === 'Apple') {
      socialName = 'Apple ID User';
      socialEmail = 'alex.wright@privaterelay.appleid.com';
      socialAvatar = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80';
    } else {
      socialName = 'Facebook User';
      socialEmail = 'alex.wright@facebook.com';
      socialAvatar = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80';
    }

    const socialUser: UserProfile = {
      id: `user_${provider.toLowerCase()}_${Date.now()}`,
      name: socialName,
      email: socialEmail,
      phone: phone.trim() || '+1 (555) 789-0123',
      role: 'Admin',
      avatarUrl: socialAvatar,
      age: 30,
      gender: 'Preferred not to say',
      bloodGroup: 'A+',
      dob: '1995-03-20',
      address: 'San Francisco, CA',
      bio: `Authenticated via ${provider}`,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      securityPin: '1234',
      emergencyContact: {
        name: 'Family Contact',
        relationship: 'Family',
        phone: '+1 (555) 987-6543',
      },
      medicalProfile: {
        allergies: [],
        chronicConditions: [],
        medications: [],
        primaryDoctor: 'Dr. Evelyn Vance, MD',
        hospitalPreference: 'UCSF Medical Center',
        insurancePolicyNo: 'POL-SOCIAL-2026',
      },
      securitySettings: {
        twoFactorEnabled: false,
        biometricEnabled: false,
        loginAlerts: true,
        autoLockMinutes: 15,
        lastPasswordChange: new Date().toISOString().split('T')[0],
        trustedDevicesCount: 1,
      },
    };

    onLogin(socialUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg text-white">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">CareBuddy</h1>
          <p className="text-xs text-slate-400">
            Digital Health & Medical Document Vault
          </p>
        </div>

        {/* Step Progression Indicators */}
        {(authStep === 'phone-otp' || authStep === 'email-verify') && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Details</span>
              </span>
              <span className={`flex items-center gap-1.5 ${authStep === 'phone-otp' ? 'text-amber-400' : 'text-emerald-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${authStep === 'phone-otp' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'}`}>
                  {phoneOtpVerified ? '✓' : '2'}
                </span>
                <span>Phone OTP</span>
              </span>
              <span className={`flex items-center gap-1.5 ${authStep === 'email-verify' ? 'text-blue-400' : 'text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${authStep === 'email-verify' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  3
                </span>
                <span>Email Verify</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: authStep === 'phone-otp' ? '66%' : '100%' }}
              />
            </div>
          </div>
        )}

        {/* Auth Mode Tabs (Sign In / Register) */}
        {(authStep === 'login' || authStep === 'signup') && (
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setAuthStep('login');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authStep === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setAuthStep('signup');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authStep === 'signup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Resend Toast Banner */}
        {emailResentToast && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>New verification email sent successfully!</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN (LOGIN)                                   */}
        {/* ========================================================= */}
        {authStep === 'login' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username, Email, or Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="login-identifier-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username, email, or phone number"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all pl-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Password reset instructions will be sent to your registered email or phone.')}
                  className="text-[10px] font-semibold text-blue-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all pl-10 pr-10"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* OTP Channel Preference */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Receive Verification OTP via
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="channel-whatsapp-login"
                  onClick={() => setOtpChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    otpChannel === 'whatsapp'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  id="channel-sms-login"
                  onClick={() => setOtpChannel('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    otpChannel === 'sms'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>SMS Message</span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Continue to OTP Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SIGN UP / REGISTER                                */}
        {/* ========================================================= */}
        {authStep === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            {/* Username / Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username / Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="signup-username-input"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Alexander Wright"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pl-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="signup-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Phone Number ("phno") */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="signup-phone-input"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pl-10"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pl-10 pr-10"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-bold text-white">{strength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-confirm-password-input"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pl-10"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* OTP Delivery Preference (WhatsApp or Message) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                Send OTP via
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="channel-whatsapp-signup"
                  onClick={() => setOtpChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    otpChannel === 'whatsapp'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  id="channel-sms-signup"
                  onClick={() => setOtpChannel('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    otpChannel === 'sms'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>SMS Message</span>
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded text-blue-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">
                I agree to the Terms of Service & Privacy Policy
              </span>
            </label>

            {/* Submit Register Button */}
            <button
              type="submit"
              id="btn-signup-submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Continue to OTP Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PHONE OTP VERIFICATION (via Message or WhatsApp)  */}
        {/* ========================================================= */}
        {authStep === 'phone-otp' && (
          <form onSubmit={handleVerifyPhoneOtp} className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${otpChannel === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {otpChannel === 'whatsapp' ? (
                  <MessageCircle className="w-6 h-6" />
                ) : (
                  <MessageSquare className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-base font-extrabold text-white">
                Verify Your Phone Number
              </h3>
              <p className="text-xs text-slate-300">
                Enter the 6-digit code sent to <span className="font-bold text-white">{phone}</span> via{' '}
                <span className={`font-bold ${otpChannel === 'whatsapp' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS Message'}
                </span>
              </p>
            </div>

            {/* Test Helper Notification Banner with 1-Click Auto-fill */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Simulated Incoming OTP:
                </span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm tracking-wider">
                  {generatedPhoneOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPhoneOtpInput(generatedPhoneOtp)}
                className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Auto-Fill Code
              </button>
            </div>

            {/* 6-Digit OTP Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                id="phone-otp-input"
                maxLength={6}
                required
                value={phoneOtpInput}
                onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Switch Channel / Resend Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                {phoneOtpTimer > 0 ? (
                  <span>Resend in <strong className="text-white">{phoneOtpTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleResendPhoneOtp()}
                    className="text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResendPhoneOtp(otpChannel === 'whatsapp' ? 'sms' : 'whatsapp')}
                  className="text-slate-300 hover:text-white font-medium underline text-[11px] cursor-pointer"
                >
                  Switch to {otpChannel === 'whatsapp' ? 'SMS' : 'WhatsApp'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                id="btn-verify-phone-otp"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Verify Phone & Proceed to Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAuthStep('signup')}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit Details</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: EMAIL VERIFICATION & FINAL AUTHENTICATION         */}
        {/* ========================================================= */}
        {authStep === 'email-verify' && (
          <form onSubmit={handleCompleteAuthentication} className="space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">
                Verify Email & Authenticate
              </h3>
              <p className="text-xs text-slate-300">
                A verification code has been dispatched to{' '}
                <span className="font-bold text-amber-300">{email || 'your email'}</span>.
              </p>
            </div>

            {/* Verification status list */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4" />
                <span>Phone verified via {otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS Message'}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
                <span>Final Step: Confirm email to authenticate and enter vault</span>
              </div>
            </div>

            {/* Simulated Email Code Preview with 1-Click Auto-fill */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Simulated Email OTP:
                </span>
                <span className="font-mono font-extrabold text-indigo-400 text-sm tracking-wider">
                  {generatedEmailOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmailOtpInput(generatedEmailOtp)}
                className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Auto-Fill Code
              </button>
            </div>

            {/* 6-Digit Email Code Input */}
            <div>
              <input
                type="text"
                id="email-otp-input"
                maxLength={6}
                value={emailOtpInput}
                onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit email code"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-base font-mono tracking-wider text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Resend Controls */}
            <div className="flex items-center justify-center gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={handleResendEmailOtp}
                className="text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Email</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                id="btn-authenticate-and-login"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate & Login as {username.trim() || 'User'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthStep('phone-otp')}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Phone Step</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* SOCIAL AUTHENTICATION (Google, Apple, Facebook)          */}
        {/* ========================================================= */}
        {(authStep === 'login' || authStep === 'signup') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or Authenticate With
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Google Button */}
              <button
                type="button"
                id="btn-social-google"
                onClick={() => handleSocialAuth('Google')}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
              >
                <Chrome className="w-4 h-4 text-rose-400" />
                <span>Google</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                id="btn-social-apple"
                onClick={() => handleSocialAuth('Apple')}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
              >
                <Apple className="w-4 h-4 text-slate-200" />
                <span>Apple</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                id="btn-social-facebook"
                onClick={() => handleSocialAuth('Facebook')}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
              >
                <Facebook className="w-4 h-4 text-blue-500" />
                <span>Facebook</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
