import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { Card } from '../../components/Card';
import { runFullPrediction } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PredictionMode, AdvancedPredictionResult } from '../../types';
import { Calendar, TrendingUp, Zap, BarChart2, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PredictionDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Form State
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Tomorrow
  const [mode, setMode] = useState<PredictionMode>(PredictionMode.BASIC);
  const [isSpecialEvent, setIsSpecialEvent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Result State
  const [result, setResult] = useState<AdvancedPredictionResult | null>(null);

  const handleRunPrediction = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await runFullPrediction(user.id, date, mode, isSpecialEvent);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Failed to run prediction");
    } finally {
      setLoading(false);
    }
  };

  // Sample data for the chart visualization
  const chartData = [
    { name: 'Day -6', value: 230 },
    { name: 'Day -5', value: 235 },
    { name: 'Day -4', value: 228 },
    { name: 'Day -3', value: 240 },
    { name: 'Day -2', value: 238 },
    { name: 'Yesterday', value: 242 },
    { name: 'Prediction', value: result?.predicted_attendance || 0, isPrediction: true },
  ];

  return (
    <Layout title="Prediction & Planning">
      
      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Configure</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prediction Mode</label>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setMode(PredictionMode.BASIC)}
                    className={`px-4 h-12 rounded-lg text-sm text-left border transition flex items-center ${mode === PredictionMode.BASIC ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    Basic (7-day Average)
                  </button>
                  <button 
                    onClick={() => setMode(PredictionMode.WEIGHTED)}
                    className={`px-4 h-12 rounded-lg text-sm text-left border transition flex items-center ${mode === PredictionMode.WEIGHTED ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    Weighted Trend (Recent focus)
                  </button>
                  <button 
                    onClick={() => setMode(PredictionMode.ADVANCED)}
                    className={`px-4 h-12 rounded-lg text-sm text-left border transition flex items-center ${mode === PredictionMode.ADVANCED ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    Advanced (ML-Ready)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer" onClick={() => setIsSpecialEvent(!isSpecialEvent)}>
                <input 
                  type="checkbox" 
                  id="specialEvent" 
                  checked={isSpecialEvent}
                  onChange={(e) => setIsSpecialEvent(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ml-2"
                />
                <label htmlFor="specialEvent" className="text-sm text-gray-700 font-medium cursor-pointer py-2">Is this a Special Event?</label>
              </div>

              <button 
                onClick={handleRunPrediction}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white h-12 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-70 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? 'Analyzing Data...' : 'Run Prediction'}
              </button>
            </div>
          </Card>

          {result && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Info size={16} className="text-gray-400" /> Analysis Logic
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-200 leading-relaxed">
                  {result.logic_used}
                </div>
                <div className="mt-4 flex items-center gap-2">
                   <span className="text-xs font-semibold text-gray-500 uppercase">Confidence Level:</span>
                   <span className={`text-xs px-2 py-1 rounded font-bold ${result.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                     {result.confidence}
                   </span>
                </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Results Section */}
          {!result ? (
            <div className="h-64 sm:h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
              <BarChart2 size={48} className="mb-4 opacity-50" />
              <p>Configure and run prediction</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-t-4 border-t-blue-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <TrendingUp size={100} />
                   </div>
                   <p className="text-sm font-medium text-gray-500 mb-1">Predicted Attendance</p>
                   <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl font-bold text-gray-900">{result.predicted_attendance}</h2>
                     <span className="text-gray-500">people</span>
                   </div>
                   <div className="mt-4 text-sm text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                     {new Date(date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                   </div>
                </Card>

                <Card className="border-t-4 border-t-emerald-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <CheckCircle size={100} />
                   </div>
                   <p className="text-sm font-medium text-gray-500 mb-1">Recommended Food</p>
                   <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl font-bold text-gray-900">{result.recommended_food}</h2>
                     <span className="text-gray-500">plates</span>
                   </div>
                   <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">
                     <AlertCircle size={14} /> Includes Safety Buffer
                   </div>
                </Card>
              </div>

              <Card>
                <h3 className="font-bold text-gray-900 mb-6">Trend Visualization</h3>
                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} domain={['dataMin - 20', 'dataMax + 20']} tick={{fontSize: 12}} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Historical data vs Predicted</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PredictionDashboard;