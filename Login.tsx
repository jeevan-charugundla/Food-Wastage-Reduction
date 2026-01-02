import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hostel.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email);
    } catch (err) {
      setError('Invalid email or user not found');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { label: 'Admin', email: 'admin@hostel.com', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { label: 'NGO', email: 'ngo@help.org', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { label: 'Student', email: 'student@college.edu', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-emerald-600 transform -skew-y-6 origin-top-left translate-y-[-50%] z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/10 p-8 border border-slate-100">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
            >
              <Leaf size={32} className="text-white" fill="currentColor" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Sign in to Smart Food Redistribution</p>
          </div>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 flex items-center justify-center font-medium border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                placeholder="name@example.com"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 font-medium mb-4 uppercase tracking-wider">Quick Login (Demo)</p>
            <div className="flex gap-2 justify-center">
              {roles.map((role) => (
                <button 
                  key={role.label}
                  onClick={() => setEmail(role.email)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-transform active:scale-95 ${role.color}`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          Reducing hunger, one meal at a time.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;