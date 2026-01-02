import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { getHistory, getPrediction, getFoodForAdmin, getAdminPickups, getActivePoll } from '../../services/api';
import { AttendanceRecord, PredictionResult, SurplusFood, Pickup, Poll } from '../../types';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, Utensils, Truck, AlertTriangle, Activity, ThumbsUp, HelpCircle, ThumbsDown, Plus, Vote, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Helper components moved outside to prevent re-rendering issues
const CountUp: React.FC<{ value: number, label: string }> = ({ value, label }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
        setCount(end);
        return;
    }
    
    // Simple easing logic
    const duration = 1000;
    const stepTime = Math.abs(Math.floor(duration / (end - start)));
    let timer: any;
    let fallback: any;
    
    timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, Math.max(stepTime, 10));
    
    // Fail-safe
    fallback = setTimeout(() => setCount(end), duration + 100);

    return () => {
        clearInterval(timer);
        clearTimeout(fallback);
    };
  }, [value]);

  return (
    <div>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{count}</h3>
      <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  color: { bg: string; text: string; border: string };
  value?: number;
  label: string;
  sub?: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, color, value, label, sub, delay }) => (
  <Card className={`border-b-4 ${color.border}`} delay={delay}>
    <div className="flex justify-between items-start">
      <CountUp value={value || 0} label={label} />
      <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
        <Icon size={24} />
      </div>
    </div>
    {sub && <div className="mt-4">{sub}</div>}
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [activeFoods, setActiveFoods] = useState<SurplusFood[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [hist, pred, foods, pick, pollData] = await Promise.all([
            getHistory(user.id),
            getPrediction(user.id),
            getFoodForAdmin(user.id),
            getAdminPickups(user.id),
            getActivePoll()
          ]);
          setHistory(hist);
          setPrediction(pred);
          setActiveFoods(foods);
          setPickups(pick);
          if (pollData) setActivePoll(pollData.poll);
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setIsRefreshing(false);
        }
      };

      fetchData();
      // Poll every 15 seconds for live updates
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Trigger effect by briefly invalidating user or just calling fetch if extracted. 
    // Since we put fetch inside useEffect, we can just reload window or better yet, refactor.
    // For MVP, we will let the polling handle it or force a re-render.
    // Re-triggering via a separate call:
    if(user) {
        Promise.all([
            getHistory(user.id),
            getPrediction(user.id),
            getFoodForAdmin(user.id),
            getAdminPickups(user.id),
            getActivePoll()
          ]).then(([hist, pred, foods, pick, pollData]) => {
            setHistory(hist);
            setPrediction(pred);
            setActiveFoods(foods);
            setPickups(pick);
            if (pollData) setActivePoll(pollData.poll);
            setIsRefreshing(false);
          });
    }
  };

  const chartData = history.map(h => ({
    name: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }),
    expected: h.expected_count,
    actual: h.actual_count
  }));

  const votes = prediction?.vote_summary;

  return (
    <Layout title="Dashboard">
      {/* Header Actions */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleManualRefresh}
          className={`flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Calendar} 
          color={{ bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500' }}
          value={prediction?.predicted_count} 
          label="Predicted Attendance"
          delay={0.1}
        />
        <StatCard 
          icon={Utensils} 
          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' }}
          value={prediction?.recommended_food_quantity} 
          label="Meals to Prepare"
          delay={0.2}
        />
        <StatCard 
          icon={AlertTriangle} 
          color={{ bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500' }}
          value={activeFoods.filter(f => f.status === 'AVAILABLE').length} 
          label="Active Surplus Listings"
          delay={0.3}
          sub={
             <Link to="/admin/add-food" className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline">
               <Plus size={12} /> Add New
             </Link>
          }
        />
        <StatCard 
          icon={Truck} 
          color={{ bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' }}
          value={pickups.filter(p => p.pickup_status !== 'DELIVERED').length} 
          label="Active Pickups"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Pulse */}
          {votes && (
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none" delay={0.5}>
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Activity size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Live Student Pulse</h3>
                    <p className="text-xs text-slate-400">Real-time voting data for today</p>
                  </div>
                  <span className="ml-auto text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/5">
                    {votes.total} votes
                  </span>
               </div>
               
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Eating', val: votes.yes, icon: ThumbsUp, color: 'text-emerald-400' },
                    { label: 'Maybe', val: votes.maybe, icon: HelpCircle, color: 'text-orange-400' },
                    { label: 'Skipping', val: votes.no, icon: ThumbsDown, color: 'text-slate-400' }
                  ].map(v => (
                    <div key={v.label} className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                       <v.icon size={20} className={`mx-auto mb-2 ${v.color}`} />
                       <div className="text-2xl font-bold">{v.val}</div>
                       <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{v.label}</div>
                    </div>
                  ))}
               </div>
            </Card>
          )}

          {/* Chart */}
          <Card delay={0.6}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Attendance Trends</h3>
              <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none">
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}
                  />
                  <Bar dataKey="expected" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Expected" />
                  <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card delay={0.7} className="h-full">
            <h3 className="font-bold text-slate-900 mb-4">Active Listings</h3>
            <div className="space-y-3">
              {activeFoods.filter(f => f.status === 'AVAILABLE').map(food => (
                <div key={food.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{food.food_name}</h4>
                    <StatusBadge status={food.status} />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-slate-500">{food.quantity} plates</span>
                    <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                       <AlertTriangle size={10} /> {new Date(food.expiry_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              {activeFoods.filter(f => f.status === 'AVAILABLE').length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400 font-medium">No active listings</p>
                </div>
              )}
              
              <Link to="/admin/add-food">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 bg-emerald-600 text-white h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Surplus Food
                </motion.button>
              </Link>
            </div>
          </Card>

          {/* COMMUNITY POLL RESULTS CARD */}
          {activePoll && (
            <Card delay={0.8} className="bg-indigo-50 border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                 <div className="p-1.5 bg-indigo-200 rounded text-indigo-700">
                   <Vote size={16} />
                 </div>
                 <h3 className="font-bold text-slate-900 text-sm">Community Poll</h3>
              </div>
              <p className="text-xs font-medium text-slate-600 mb-3">{activePoll.question}</p>
              
              <div className="space-y-3">
                {activePoll.options.map(opt => {
                  const totalVotes = activePoll.options.reduce((a, b) => a + b.count, 0);
                  const percent = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={opt.id}>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-700">{opt.label}</span>
                        <span className="text-slate-500">{percent}% ({opt.count})</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-indigo-100 text-center">
                 <p className="text-[10px] text-indigo-400 font-medium flex items-center justify-center gap-1">
                   <Activity size={10} className="animate-pulse" /> Updating Live
                 </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;