import React, { useState } from 'react';
import {
  Coins,
  GraduationCap,
  Users,
  TrendingUp,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

export const AuthPage: React.FC = () => {
  const { login, register, adminLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regYear, setRegYear] = useState('Freshman');
  const [regAllowance, setRegAllowance] = useState('');
  const [regGoal, setRegGoal] = useState('');

  // Admin login form state
  const [adminEmail, setAdminEmail] = useState('admin@campuscoin.edu');
  const [adminPassword, setAdminPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Name, email, and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        academic_year: regYear,
        monthly_allowance_baseline: parseFloat(regAllowance) || 0,
        monthly_savings_goal: parseFloat(regGoal) || 0
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin({ email: adminEmail, password: adminPassword });
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col">
      {/* Navigation Bar */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-white text-lg">Campus Coin</span>
            <span className="text-[10px] ml-2 text-indigo-300 font-mono">NextGen BudgetBee</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI-Powered Student Finance Tracker</span>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Features Column */}
          <div className="text-white space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 backdrop-blur-sm mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smarter Student Finance — End-to-End Solution</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tighter">
                Manage Your Campus Life
                <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Budget & Savings
                </span>
                with AI Insights
              </h1>
              <p className="text-white/60 text-sm leading-relaxed mt-3">
                The NextGen intelligent spending tracker built for modern students — track allowances, dorm rent, canteen meals, and reach your financial goals effortlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: TrendingUp, title: 'Real-Time Spending Breakdown', desc: 'Category-wise monthly dashboards with progress bars & budget alerts' },
                { icon: Sparkles, title: 'AI Category Predictor', desc: 'Self-learning assistant assigns categories from your typing patterns' },
                { icon: GraduationCap, title: 'Student-Focused Templates', desc: 'Allowance, hostel rent, canteen, academic and subscription defaults' },
                { icon: Users, title: 'Admin System Control Panel', desc: 'Full user, category, and announcement management portal' }
              ].map(({ icon: Icon, title, desc }, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{title}</h4>
                    <p className="text-[11px] text-white/50 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth Forms */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Tab Navigation */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 m-2 rounded-2xl">
              {[
                { id: 'login', label: 'Student Login', icon: User },
                { id: 'register', label: 'Register', icon: GraduationCap },
                { id: 'admin', label: 'Admin', icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setError(''); }}
                    className={`py-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs border border-rose-200 dark:border-rose-900">
                  {error}
                </div>
              )}

              {/* Student Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Welcome Back!</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to your Campus Coin student account</p>
                    <div className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Demo: alex@campus.edu / password123
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Student Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="e.g. alex@campus.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Signing In...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* Student Registration Form */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="text-center pb-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Your Account</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Join Campus Coin as a new student member</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Academic Year</label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option>Freshman</option>
                        <option>Sophomore</option>
                        <option>Junior</option>
                        <option>Senior</option>
                        <option>Graduate</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="studentname@campus.edu"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Set a strong password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Monthly Allowance ($)</label>
                      <input
                        type="number"
                        step="10"
                        placeholder="e.g. 600"
                        value={regAllowance}
                        onChange={(e) => setRegAllowance(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Savings Goal ($/mo)</label>
                      <input
                        type="number"
                        step="10"
                        placeholder="e.g. 100"
                        value={regGoal}
                        onChange={(e) => setRegGoal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Creating Account...' : <>Create Student Account <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* Admin Login Form */}
              {activeTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="p-3 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-xl inline-block mb-2">
                      <Shield className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Administrator Access</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Direct admin portal for system management</p>
                    <div className="mt-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      Demo: admin@campuscoin.edu / admin123
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Admin Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Admin Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Administrator password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Signing In...' : <>Access Admin Panel <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </div>
  );
};
