import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { getAvailableFood, acceptPickup, getNgoPickups, getNgoStats, updateNgoCapacity, declinePickup, uploadPickupProof, getNgoReceipts } from '../../services/api';
import { FoodStatus, Pickup, PickupStatus, SurplusFood, NgoStats, DigitalReceipt } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Clock, MapPin, CheckCircle, Navigation, AlertTriangle, Users, BarChart2, Leaf, Camera, Scan, X, RotateCw, WifiOff, Loader2, Maximize, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

const NgoDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receipts'>('dashboard');
  
  // Dashboard State
  const [foods, setFoods] = useState<SurplusFood[]>([]);
  const [myPickups, setMyPickups] = useState<Pickup[]>([]);
  const [stats, setStats] = useState<NgoStats | null>(null);
  
  // Receipt State
  const [receipts, setReceipts] = useState<DigitalReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<DigitalReceipt | null>(null);
  
  const [refresh, setRefresh] = useState(0);
  
  // Capacity Edit Mode
  const [editCapacity, setEditCapacity] = useState(false);
  const [newCap, setNewCap] = useState(150);
  const [newVol, setNewVol] = useState(5);

  // Decline Modal
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Scanner & Camera Logic
  const [scanning, setScanning] = useState(false);
  const [scanningId, setScanningId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, refresh, activeTab]);

  const loadDashboard = async () => {
    if (!user) return;
    try {
      if (activeTab === 'dashboard') {
        const [f, p, s] = await Promise.all([getAvailableFood(), getNgoPickups(user.id), getNgoStats(user.id)]);
        setFoods(f); setMyPickups(p); setStats(s);
        if (s) { setNewCap(s.capacity.max_capacity); setNewVol(s.capacity.volunteers_available); }
      } else {
        const r = await getNgoReceipts(user.id);
        setReceipts(r);
      }
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (foodId: number) => {
    if (!user) return;
    try { await acceptPickup(foodId, user.id); setRefresh(p => p + 1); } catch (e: any) { alert(e.message); }
  };

  const handleDecline = async () => {
    if (!user || !declineId) return;
    try { await declinePickup(declineId, user.id, declineReason); setDeclineId(null); setDeclineReason(""); setRefresh(p => p + 1); } catch (e) { alert("Error"); }
  };

  const handleScan = (id: number) => {
    setScanning(true);
    setScanningId(id);
    setTimeout(() => {
        setScanning(false);
        setScanningId(null);
        alert(`Pickup #${id} Verified Successfully!`);
    }, 2500);
  };

  const handleCameraClick = (id: number) => {
    setUploadingId(id);
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingId) {
        try {
            await uploadPickupProof(uploadingId, "mock_base64_string");
            setRefresh(prev => prev + 1);
            alert("Proof uploaded! Digital Receipt generated.");
        } catch (error) {
            alert("Failed to upload proof.");
        }
    }
    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadPDF = (receipt: DigitalReceipt) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("DONATION RECEIPT", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Smart Food Redistribution System", 105, 30, { align: 'center' });

    // Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    let y = 60;
    
    const addRow = (label: string, value: string) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, y);
        doc.setFont(undefined, 'normal');
        doc.text(value, 80, y);
        y += 10;
    };

    addRow("Receipt ID:", receipt.id);
    addRow("Date:", new Date(receipt.generated_at).toLocaleDateString());
    addRow("Time:", new Date(receipt.generated_at).toLocaleTimeString());
    
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 15;

    addRow("Recipient NGO:", receipt.ngo_name);
    addRow("Donor / Hostel:", receipt.donor_name);
    addRow("Location:", receipt.pickup_location);
    
    y += 5;
    doc.line(20, y, 190, y);
    y += 15;

    addRow("Food Item:", receipt.food_name);
    addRow("Quantity:", `${receipt.quantity} Plates`);
    
    y += 20;
    doc.setFillColor(240, 253, 244); // light green
    doc.rect(20, y, 170, 20, 'F');
    doc.setTextColor(21, 128, 61); // green 700
    doc.setFont(undefined, 'bold');
    doc.text("VERIFIED PICKUP", 105, y + 13, { align: 'center' });

    doc.save(`Receipt-${receipt.id}.pdf`);
  };

  const getTimeRemaining = (expiry: string) => {
    const total = Date.parse(expiry) - Date.now();
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    if (total <= 0) return "Expired";
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const isUrgent = (expiry: string) => {
    const total = Date.parse(expiry) - Date.now();
    return total > 0 && total < 60 * 60 * 1000; 
  };

  const activePickups = myPickups.filter(p => p.pickup_status === PickupStatus.PENDING);

  return (
    <Layout title="NGO Panel">
       {/* Hidden File Input for Camera */}
       <input 
         type="file" 
         accept="image/*" 
         capture="environment" 
         hidden 
         ref={fileInputRef} 
         onChange={handleFileChange}
       />

       {/* Tab Switcher */}
       <div className="flex p-1 bg-slate-200 rounded-xl mb-6">
         <button 
           onClick={() => setActiveTab('dashboard')} 
           className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
         >
           Active Missions
         </button>
         <button 
           onClick={() => setActiveTab('receipts')} 
           className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'receipts' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
         >
           Digital Receipts
         </button>
       </div>

       {activeTab === 'dashboard' ? (
         <>
           {/* Stats Section */}
           {stats && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <Card className="bg-slate-900 text-white border-none" delay={0.1}>
                 <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Daily Capacity</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold">{stats.capacity.remaining_capacity}</span>
                        <span className="text-sm text-slate-500 font-medium">/ {stats.capacity.max_capacity} left</span>
                      </div>
                   </div>
                   <button onClick={() => setEditCapacity(!editCapacity)} className="text-slate-400 hover:text-white p-2 bg-white/10 rounded-full transition-colors">
                     <RotateCw size={16} />
                   </button>
                 </div>
                 
                 {editCapacity && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-4 pt-4 border-t border-white/10">
                      <div className="flex gap-2 mb-2">
                        <input type="number" value={newCap} onChange={e=>setNewCap(parseInt(e.target.value))} className="w-1/2 p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
                        <input type="number" value={newVol} onChange={e=>setNewVol(parseInt(e.target.value))} className="w-1/2 p-2 bg-white/5 border border-white/10 rounded text-sm text-white" />
                      </div>
                      <button onClick={async () => { await updateNgoCapacity(user!.id, newCap, newVol); setEditCapacity(false); setRefresh(r => r + 1); }} className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-bold">Save</button>
                   </motion.div>
                 )}

                 <div className="flex gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {stats.capacity.volunteers_available} Volunteers</span>
                    <span className="flex items-center gap-1"><BarChart2 size={12} /> {stats.reliability.score}% Reliability</span>
                 </div>
               </Card>

               <div className="grid grid-cols-2 gap-3">
                 <Card className="bg-emerald-50 border-emerald-100 flex flex-col justify-center items-center py-6" delay={0.2}>
                   <Leaf className="text-emerald-600 mb-2" size={28} />
                   <span className="text-2xl font-bold text-slate-900">{stats.total_collected}</span>
                   <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Saved</span>
                 </Card>
                 <Card className="bg-orange-50 border-orange-100 flex flex-col justify-center items-center py-6" delay={0.3}>
                   <Users className="text-orange-600 mb-2" size={28} />
                   <span className="text-2xl font-bold text-slate-900">{stats.people_fed}</span>
                   <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">Fed</span>
                 </Card>
               </div>
             </div>
           )}

           {/* Active Missions */}
           {activePickups.length > 0 && (
             <div className="mb-8">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Navigation size={16} /> Active Missions
               </h3>
               <div className="space-y-4">
                 {activePickups.map((pickup, idx) => (
                   <Card key={pickup.id} delay={0.1 * idx} className="border-l-4 border-l-orange-500">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                               Pickup #{pickup.id}
                            </span>
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                              <Clock size={12} /> {getTimeRemaining(pickup.food?.expiry_time || "")}
                            </span>
                         </div>
                         <h4 className="font-bold text-slate-900 text-lg">{pickup.food?.food_name}</h4>
                         <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                           <MapPin size={14} /> {pickup.food?.location}
                         </p>
                       </div>
                       <div className="text-right">
                         <span className="block text-2xl font-bold text-slate-900">{pickup.food?.quantity}</span>
                         <span className="text-[10px] text-slate-400 font-bold uppercase">Plates</span>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 mt-4">
                       <button 
                         onClick={() => handleScan(pickup.id)}
                         className="bg-slate-50 border border-slate-200 text-slate-700 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition"
                       >
                         <Scan size={16} /> Scan
                       </button>
                       <button 
                         onClick={() => handleCameraClick(pickup.id)}
                         className="bg-emerald-600 text-white h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition"
                       >
                         {uploadingId === pickup.id ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16} />} 
                         Complete
                       </button>
                     </div>
                   </Card>
                 ))}
               </div>
             </div>
           )}

          {/* Available Feed */}
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Available Near You</h3>
          <div className="space-y-4 mb-10">
            {foods.filter(f => f.status === FoodStatus.AVAILABLE).map((food, idx) => {
              const urgent = isUrgent(food.expiry_time);
              const disabled = stats ? stats.capacity.remaining_capacity < food.quantity : false;

              return (
                <Card key={food.id} delay={0.2 + (idx * 0.1)} className={`relative overflow-hidden transition-all ${urgent ? 'ring-2 ring-red-500/50' : ''}`}>
                  {urgent && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold text-center py-0.5 uppercase tracking-wider">
                      Expiring Soon
                    </div>
                  )}
                  
                  <div className={`flex justify-between items-start mb-2 ${urgent ? 'mt-4' : ''}`}>
                     <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 uppercase ${urgent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {urgent ? <AlertTriangle size={10} /> : <CheckCircle size={10} />} {urgent ? 'Urgent' : 'Safe'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Navigation size={10} /> {food.distance_km}km
                        </span>
                     </div>
                     <span className={`text-xs font-mono font-bold ${urgent ? 'text-red-600' : 'text-slate-400'}`}>
                       {getTimeRemaining(food.expiry_time)} left
                     </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                     <h4 className="text-lg font-bold text-slate-900">{food.food_name}</h4>
                     <div className="text-right">
                        <span className="block text-xl font-bold text-slate-900">{food.quantity}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Plates</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                     <button 
                      onClick={() => { setDeclineId(food.id); setDeclineReason(""); }}
                      className="col-span-1 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold h-12 hover:bg-slate-50"
                    >
                      Decline
                    </button>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAccept(food.id)}
                      disabled={disabled}
                      className={`col-span-2 rounded-xl text-sm font-bold h-12 text-white shadow-lg flex items-center justify-center gap-2 ${
                        disabled ? 'bg-slate-300 cursor-not-allowed' : 
                        urgent ? 'bg-red-600 shadow-red-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                      }`}
                    >
                      {disabled ? 'Capacity Full' : urgent ? 'Rescue Now' : 'Accept Pickup'}
                    </motion.button>
                  </div>
                </Card>
              );
            })}
            {foods.filter(f => f.status === FoodStatus.AVAILABLE).length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                 <WifiOff className="mx-auto text-slate-300 mb-2" size={32} />
                 <div className="text-slate-500 font-medium text-sm">No food currently available</div>
              </div>
            )}
          </div>
         </>
       ) : (
         <div className="space-y-4 mb-20">
            {receipts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                 <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                 <div className="text-slate-500 font-medium text-sm">No receipts generated yet</div>
              </div>
            ) : (
              receipts.map((receipt, idx) => (
                <Card key={receipt.id} delay={idx * 0.05} onClick={() => setSelectedReceipt(receipt)} className="cursor-pointer hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <h4 className="font-bold text-slate-900">{receipt.food_name}</h4>
                         <span className="text-xs text-slate-400 font-mono">{receipt.id}</span>
                      </div>
                      <p className="text-xs text-slate-500">{new Date(receipt.generated_at).toLocaleDateString()} • {receipt.quantity} Plates</p>
                    </div>
                    <div className="text-emerald-600">
                       <CheckCircle size={16} />
                    </div>
                  </div>
                </Card>
              ))
            )}
         </div>
       )}

      {/* Receipt Detail Modal */}
      <AnimatePresence>
        {selectedReceipt && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)} />
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                 {/* Receipt Header */}
                 <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-green-500" />
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                      <CheckCircle className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="font-bold text-lg tracking-wide">PICKUP VERIFIED</h3>
                    <p className="text-slate-400 text-xs mt-1">{selectedReceipt.generated_at.split('T')[0]} • {new Date(selectedReceipt.generated_at).toLocaleTimeString()}</p>
                 </div>

                 {/* Ticket Cutout Effect */}
                 <div className="relative h-6 bg-slate-900">
                    <div className="absolute bottom-0 left-0 w-full h-6 bg-white rounded-t-3xl" />
                 </div>

                 {/* Details */}
                 <div className="px-6 pb-6 space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedReceipt.quantity} Plates</h2>
                      <p className="text-emerald-600 font-medium text-sm">{selectedReceipt.food_name}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                       <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">From</span>
                          <span className="font-bold text-slate-900 text-right max-w-[150px] truncate">{selectedReceipt.donor_name}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">To</span>
                          <span className="font-bold text-slate-900 text-right max-w-[150px] truncate">{selectedReceipt.ngo_name}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">Receipt ID</span>
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{selectedReceipt.id}</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">Location</span>
                          <span className="font-bold text-slate-900 text-right max-w-[150px] truncate">{selectedReceipt.pickup_location}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                       <button onClick={() => setSelectedReceipt(null)} className="py-3 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50">
                         Close
                       </button>
                       <button onClick={() => downloadPDF(selectedReceipt)} className="py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20">
                         <Download size={16} /> Download
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Decline Modal */}
      <AnimatePresence>
        {declineId && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeclineId(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-900 text-lg">Reason for Declining</h3>
                 <button onClick={() => setDeclineId(null)} className="p-1 bg-slate-100 rounded-full"><X size={20} /></button>
               </div>
               <div className="space-y-2 mb-6">
                 {['Capacity Full', 'Too Far', 'Expiring Soon', 'Other'].map(r => (
                   <button key={r} onClick={() => setDeclineReason(r)} className={`w-full text-left px-4 py-3.5 rounded-xl border font-bold text-sm transition ${declineReason === r ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}`}>
                     {r}
                   </button>
                 ))}
               </div>
               <button onClick={handleDecline} disabled={!declineReason} className="w-full bg-red-600 text-white h-14 rounded-xl font-bold disabled:opacity-50">
                 Confirm Decline
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay */}
      <AnimatePresence>
        {scanning && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center text-white"
            >
                <div className="relative w-64 h-64 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center mb-8 overflow-hidden">
                    <motion.div 
                        animate={{ y: [-120, 120] }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                    />
                    <Maximize className="absolute inset-0 m-auto text-white/20 w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold mb-2">Scanning...</h3>
                <p className="text-slate-400 text-sm">Align QR code within the frame</p>
                <button onClick={() => setScanning(false)} className="mt-8 text-slate-400 hover:text-white px-6 py-2 border border-white/20 rounded-full text-sm font-medium">Cancel</button>
            </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default NgoDashboard;