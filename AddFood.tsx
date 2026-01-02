import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { addFood } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, Calendar } from 'lucide-react';

const AddFood: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State for current time to keep the preview live
  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    food_name: '',
    quantity: 0,
    expiry_hours: 4 // Default expiry buffer
  });

  // Update current time every minute so the preview stays accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getExpiryDate = () => {
    return new Date(currentTime.getTime() + formData.expiry_hours * 60 * 60 * 1000);
  };

  const formatExpiryDate = (date: Date) => {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today, ${timeStr}`;
    return `Tomorrow, ${timeStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const cookedTime = new Date();
      // Calculate final expiry based on the exact submission time
      const expiryTime = new Date(cookedTime.getTime() + formData.expiry_hours * 60 * 60 * 1000);

      await addFood({
        admin_id: user.id,
        food_name: formData.food_name,
        quantity: formData.quantity,
        cooked_time: cookedTime.toISOString(),
        expiry_time: expiryTime.toISOString(),
      });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Add Surplus Food">
      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-2">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-orange-100 rounded-full text-orange-600 mt-1">
                    <Utensils size={18} />
                 </div>
                 <div>
                    <h3 className="font-semibold text-orange-900">Reduce Wastage</h3>
                    <p className="text-sm text-orange-800 mt-1">Listing food immediately helps NGOs pick it up while it's fresh.</p>
                 </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Items Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Rice, Dal, and Mixed Veg Curry"
                className="w-full px-4 h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-white"
                value={formData.food_name}
                onChange={e => setFormData({...formData, food_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (Plates)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-white"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Safe for (Hours)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <select 
                    className="w-full pl-10 pr-4 h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none bg-white transition"
                    value={formData.expiry_hours}
                    onChange={e => setFormData({...formData, expiry_hours: parseInt(e.target.value)})}
                  >
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                    <option value="4">4 Hours (Standard)</option>
                    <option value="5">5 Hours</option>
                    <option value="6">6 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Expiry Display */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
               <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Time</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={16} className="text-orange-600" />
                    <span className="text-lg font-bold text-gray-900">{formatExpiryDate(getExpiryDate())}</span>
                  </div>
               </div>
               <div className="text-right">
                 <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 inline-block">Active</div>
               </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
               <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="order-2 sm:order-1 w-full sm:w-1/3 bg-white border border-gray-300 text-gray-700 h-12 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="order-1 sm:order-2 w-full sm:w-2/3 bg-orange-600 text-white h-12 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 shadow-sm active:scale-[0.98]"
              >
                {loading ? 'Listing...' : 'List Surplus Food'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddFood;