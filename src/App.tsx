import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Target, 
  RotateCcw, 
  ChevronRight,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, isToday, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { AppData, UserSettings, DailyProgress } from './types';
import { 
  calculateTotalDays, 
  generateInitialLogs, 
  getStatus, 
  getStatusColor,
  calculateDynamicTarget 
} from './utils/calculations';

// --- Components ---

const SetupForm = ({ onComplete }: { onComplete: (data: AppData) => void }) => {
  const [username, setUsername] = useState('');
  const [startDate, setStartDate] = useState('2026-02-19');
  const [endDate, setEndDate] = useState('2026-03-22');
  const [targetKhatam, setTargetKhatam] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: UserSettings = { username, startDate, endDate, targetKhatam };
    const initialLogs = generateInitialLogs(settings);
    onComplete({ settings, dailyLogs: initialLogs });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100 p-8"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="text-emerald-600 w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-emerald-900">Ramadan Tilawah Tracker</h1>
        <p className="text-emerald-600/70 mt-2">Atur target tilawah Anda untuk bulan suci</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <User size={16} /> Nama Pengguna
          </label>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            placeholder="Masukkan nama Anda"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Mulai
            </label>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Selesai
            </label>
            <input
              required
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <Target size={16} /> Target Khatam
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={targetKhatam}
              onChange={(e) => setTargetKhatam(parseInt(e.target.value))}
              className="flex-1 accent-emerald-600"
            />
            <span className="text-lg font-bold text-emerald-700 w-12">{targetKhatam}x</span>
          </div>
          <p className="text-xs text-emerald-600/60 mt-2 italic">
            Total {targetKhatam * 30} Juz ({targetKhatam * 30 * 20} Halaman)
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
        >
          Mulai Tracking <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </motion.div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('ramadan_tilawah_data');
    return saved ? JSON.parse(saved) : { settings: null, dailyLogs: [] };
  });

  useEffect(() => {
    localStorage.setItem('ramadan_tilawah_data', JSON.stringify(data));
  }, [data]);

  const handleSetupComplete = (newData: AppData) => {
    setData(newData);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data progress?')) {
      setData({ settings: null, dailyLogs: [] });
    }
  };

  const updateJuzRead = (dayNumber: number, value: string) => {
    const juz = parseFloat(value) || 0;
    const newLogs = data.dailyLogs.map(log => 
      log.dayNumber === dayNumber ? { ...log, juzRead: juz } : log
    );
    setData(prev => ({ ...prev, dailyLogs: newLogs }));
  };

  if (!data.settings) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] py-12 px-4 font-sans">
        <SetupForm onComplete={handleSetupComplete} />
      </div>
    );
  }

  // --- Calculations ---
  const totalJuzTarget = data.settings.targetKhatam * 30;
  const totalJuzRead = data.dailyLogs.reduce((acc, log) => acc + log.juzRead, 0);
  const progressPercent = Math.min(100, (totalJuzRead / totalJuzTarget) * 100);
  
  const today = startOfDay(new Date());
  const startDate = startOfDay(parseISO(data.settings.startDate));
  const endDate = startOfDay(parseISO(data.settings.endDate));
  
  let currentDayNumber = 0;
  let daysPassed = 0;
  
  if (isBefore(today, startDate)) {
    currentDayNumber = 0;
    daysPassed = 0;
  } else if (isAfter(today, endDate)) {
    currentDayNumber = data.dailyLogs.length;
    daysPassed = data.dailyLogs.length;
  } else {
    const currentDayIndex = data.dailyLogs.findIndex(log => startOfDay(parseISO(log.date)).getTime() === today.getTime());
    currentDayNumber = currentDayIndex !== -1 ? currentDayIndex + 1 : 0;
    daysPassed = currentDayNumber;
  }
  
  const totalDays = data.dailyLogs.length;
  let remainingDays = 0;
  
  if (isBefore(today, startDate)) {
    remainingDays = totalDays;
  } else if (isAfter(today, endDate)) {
    remainingDays = 0;
  } else {
    remainingDays = Math.max(0, totalDays - currentDayNumber + 1);
  }
  
  const dynamicTargetPerDay = calculateDynamicTarget(totalJuzTarget, totalJuzRead, remainingDays);
  
  // Cumulative data for chart
  let cumulativeTarget = 0;
  let cumulativeRead = 0;
  const chartData = data.dailyLogs.map((log, i) => {
    cumulativeTarget += log.targetJuz;
    cumulativeRead += log.juzRead;
    return {
      day: `H${log.dayNumber}`,
      target: parseFloat(cumulativeTarget.toFixed(2)),
      actual: parseFloat(cumulativeRead.toFixed(2)),
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-emerald-950 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-emerald-900 leading-tight">Tilawah Tracker</h1>
              <p className="text-xs text-emerald-600/70">Ramadan 1447H / 2026M</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-emerald-900">{data.settings.username}</p>
              <p className="text-xs text-emerald-600/60">Target: {data.settings.targetKhatam} Khatam</p>
            </div>
            <button 
              onClick={handleReset}
              className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
              title="Reset Data"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-emerald-600" /> Progress Keseluruhan
              </h2>
              <span className="text-3xl font-black text-emerald-600">{progressPercent.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-emerald-50 h-4 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-emerald-600 rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Juz</p>
                <p className="text-xl font-bold">{totalJuzRead.toFixed(1)} <span className="text-sm font-normal text-emerald-600/60">/ {totalJuzTarget}</span></p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Sisa Juz</p>
                <p className="text-xl font-bold">{(totalJuzTarget - totalJuzRead).toFixed(1)}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Hari Ke</p>
                <p className="text-xl font-bold">{currentDayNumber} <span className="text-sm font-normal text-emerald-600/60">/ {totalDays}</span></p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Sisa Hari</p>
                <p className="text-xl font-bold">{remainingDays}</p>
              </div>
            </div>
          </motion.div>

          {/* Dynamic Target Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-emerald-900 text-white rounded-3xl p-8 shadow-xl shadow-emerald-900/20 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Target className="text-emerald-400" /> Target Harian Baru
              </h2>
              <div className="mb-8">
                <p className="text-5xl font-black text-emerald-400 mb-2">
                  {dynamicTargetPerDay.toFixed(2)}
                </p>
                <p className="text-emerald-100/70 text-sm">Juz per hari untuk mencapai target khatam.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-emerald-100/80">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Target Awal: {(totalJuzTarget / totalDays).toFixed(2)} Juz/hari</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-emerald-100/80">
                  <AlertCircle size={16} className="text-emerald-400" />
                  <span>Status: {getStatus(totalJuzRead, (totalJuzTarget / totalDays) * daysPassed)}</span>
                </div>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-800 rounded-full opacity-50 blur-3xl" />
          </motion.div>
        </div>

        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm"
        >
          <h2 className="text-lg font-bold mb-8 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" /> Grafik Perkembangan
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  interval={Math.floor(totalDays / 10)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#059669" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  name="Total Dibaca"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94a3b8" 
                  strokeDasharray="5 5" 
                  dot={false}
                  name="Target Kumulatif"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-emerald-50">
            <h2 className="text-lg font-bold">Log Harian Tilawah</h2>
            <p className="text-sm text-emerald-600/60">Input jumlah juz yang Anda baca setiap hari</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Hari</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Target Juz</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Juz Dibaca</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Total Terkumpul</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-900 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {data.dailyLogs.map((log, index) => {
                  const cumulativeTarget = (totalJuzTarget / totalDays) * log.dayNumber;
                  const cumulativeRead = data.dailyLogs.slice(0, index + 1).reduce((sum, l) => sum + l.juzRead, 0);
                  const status = getStatus(cumulativeRead, cumulativeTarget);
                  const isTodayLog = isToday(parseISO(log.date));

                  return (
                    <tr key={log.dayNumber} className={`${isTodayLog ? 'bg-emerald-50/30' : ''} hover:bg-emerald-50/10 transition-colors`}>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-900">H{log.dayNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{format(parseISO(log.date), 'dd MMM yyyy')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-emerald-600 font-medium">{log.targetJuz.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={log.juzRead || ''}
                          onChange={(e) => updateJuzRead(log.dayNumber, e.target.value)}
                          className="w-20 px-3 py-1.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-emerald-900">{cumulativeRead.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
