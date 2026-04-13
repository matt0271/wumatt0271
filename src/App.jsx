import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X,
  ShieldCheck, Check, XCircle, MessageSquare, AlertTriangle,
  Search, Filter, BarChart3, MousePointerClick, Building2, Briefcase,
  Users, UserPlus, Wifi, WifiOff, HelpCircle, Edit2, CalendarSearch,
  Download, Upload, FileSpreadsheet, Plus, ArrowRight
} from 'lucide-react';

// --- XAMPP / 本地 API 設定區 ---
// 請確保您的 XAMPP PHP 檔案路徑正確，且已設定 CORS Header
const API_BASE_URL = 'http://localhost/api'; 

const API_HEADERS = {
  'Content-Type': 'application/json'
};

// --- Constants ---
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

const LEAVE_TYPES = [
  { id: 'annual', label: '特休假' }, { id: 'compensatory', label: '補休' },
  { id: 'personal', label: '事假' }, { id: 'sick', label: '病假' },
  { id: 'hospitalized', label: '病假(連續住院)' }, { id: 'marriage', label: '婚假' },
  { id: 'official', label: '公假' }, { id: 'maternity', label: '產假' },
  { id: 'paternity', label: '陪產假' }, { id: 'prenatal', label: '產檢假' },
  { id: 'bereavement', label: '喪假' }, { id: 'benefit', label: '福利假' },
  { id: 'family_care', label: '家庭照顧假' }, { id: 'parental_leave', label: '育嬰留停' },
];

const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

// --- Helper: Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200"
  };
  const labels = { approved: "已核准", rejected: "已駁回", pending: "待簽核" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || labels.pending}
    </span>
  );
};

// --- View: Overtime Application ---
const OvertimeView = ({ currentSerialId, today, refreshData }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', jobTitle: '', dept: '',
    category: 'regular', compensationType: 'leave',
    startDate: today, startHour: '09', startMin: '00',
    endDate: today, endHour: '18', endMin: '00',
    reason: '',
  });

  const totalHours = useMemo(() => {
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/records.php`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          ...formData,
          serialId: currentSerialId,
          formType: '加班',
          appType,
          totalHours,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      });
      if (response.ok) {
        setFormData(prev => ({ ...prev, reason: '' }));
        alert('加班申請已提交');
        refreshData();
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (err) {
      console.error(err);
      alert('提交失敗，請檢查 XAMPP 連線與資料庫設定');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 text-left">
      <div className="bg-indigo-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black">加班申請單 <span className="text-sm font-normal opacity-70 ml-2">({appType === 'pre' ? '事前' : '事後'})</span></h1>
        <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
          <button onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
          <button onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'jobTitle', 'dept'].map((f) => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
                value={formData[f]} 
                onChange={e => setFormData({...formData, [f]: e.target.value})} 
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班類別</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm font-bold"
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">補償方式</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm font-bold"
              value={formData.compensationType} 
              onChange={e => setFormData({...formData, compensationType: e.target.value})}
            >
              <option value="leave">換取補休</option>
              <option value="pay">申領加班費</option>
            </select>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-2 text-left"><Plus size={14}/> 開始時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-rose-600 flex items-center gap-2 text-left"><ArrowRight size={14}/> 結束時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <span className="text-[10px] font-bold uppercase">總時數</span>
            <span className="text-2xl font-black">{totalHours} <span className="text-xs">HR</span></span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班詳細事由</label>
          <textarea 
            required 
            rows="3" 
            placeholder="請描述加班期間預計完成之工作內容..."
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white"
            value={formData.reason} 
            onChange={e => setFormData({...formData, reason: e.target.value})}
          />
        </div>

        <button 
          disabled={totalHours <= 0 || submitting} 
          className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          {submitting ? '提交中...' : '提交申請'}
        </button>
      </form>
    </div>
  );
};

// --- View: Leave Application ---
const LeaveView = ({ currentSerialId, today, refreshData }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', jobTitle: '', dept: '',
    type: 'annual', proxy: '',
    startDate: today, startHour: '09', startMin: '00',
    endDate: today, endHour: '18', endMin: '00',
    reason: '',
  });

  const totalHours = useMemo(() => {
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/records.php`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          ...formData,
          serialId: currentSerialId,
          formType: '請假',
          totalHours,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      });
      if (response.ok) {
        setFormData(prev => ({ ...prev, reason: '', proxy: '' }));
        alert('請假申請已提交');
        refreshData();
      }