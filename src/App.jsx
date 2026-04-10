import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, addDoc, 
  onSnapshot, query, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
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

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'employee-portal-v1';

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
const OvertimeView = ({ user, currentSerialId, today }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', dept: '', jobTitle: '',
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
    if (!user || totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'records'), {
        ...formData,
        userId: user.uid,
        serialId: currentSerialId,
        formType: '加班',
        appType,
        totalHours,
        status: 'pending',
        comment: '',
        createdAt: new Date().toISOString()
      });
      setFormData(prev => ({ ...prev, reason: '' }));
    } catch (err) {
      console.error(err);
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
          {['name', 'empId', 'dept', 'jobTitle'].map((f) => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f==='name'?'姓名':f==='empId'?'員編':f==='dept'?'單位':'職稱'}</label>
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
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
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
const LeaveView = ({ user, currentSerialId, today }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', dept: '', jobTitle: '',
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
    if (!user || totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'records'), {
        ...formData,
        userId: user.uid,
        serialId: currentSerialId,
        formType: '請假',
        totalHours,
        status: 'pending',
        comment: '',
        createdAt: new Date().toISOString()
      });
      setFormData(prev => ({ ...prev, reason: '', proxy: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 text-left">
      <div className="bg-teal-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black">請假申請單</h1>
        <p className="text-sm opacity-80 mt-1 italic">請詳細填寫請假類別與職務代理人</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'dept', 'jobTitle'].map((f) => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f==='name'?'姓名':f==='empId'?'員編':f==='dept'?'單位':'職稱'}</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                value={formData[f]} 
                onChange={e => setFormData({...formData, [f]: e.target.value})} 
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">假別</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold"
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">職務代理人</label>
            <input 
              type="text" 
              required 
              placeholder="請輸入代理人姓名"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={formData.proxy} 
              onChange={e => setFormData({...formData, proxy: e.target.value})} 
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-600">開始日期</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-rose-600">結束日期</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-teal-600 rounded-xl p-4 text-white flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase">計算時數</span>
            <span className="text-2xl font-black">{totalHours} <span className="text-xs">HR</span></span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">請假理由</label>
          <textarea 
            required 
            rows="3" 
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            value={formData.reason} 
            onChange={e => setFormData({...formData, reason: e.target.value})}
          />
        </div>

        <button 
          disabled={totalHours <= 0 || submitting} 
          className="w-full py-4 rounded-2xl font-black text-white bg-teal-600 hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:bg-slate-300"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          提交請假申請
        </button>
      </form>
    </div>
  );
};

// --- View: Approval Center ---
const ApprovalCenter = ({ records, user }) => {
  const [activeTab, setActiveTab] = useState('加班');
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [processing, setProcessing] = useState(false);

  const pendingItems = records.filter(r => r.formType === activeTab && r.status === 'pending');
  const selectedItem = records.find(r => r.id === selectedId);

  const handleAction = async (status) => {
    if (!selectedId || !user || processing) return;
    if (status === 'rejected' && !opinion.trim()) {
      alert('請填寫駁回理由');
      return;
    }
    setProcessing(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'records', selectedId);
      await updateDoc(docRef, {
        status,
        comment: opinion,
        processedBy: user.uid,
        processedAt: new Date().toISOString()
      });
      setSelectedId(null);
      setOpinion('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-rose-600 px-8 py-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">主管簽核中心</h1>
            <p className="text-sm opacity-80 italic">處理待簽核之申請案件</p>
          </div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>

        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-8">
            <button onClick={() => setActiveTab('加班')} className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === '加班' ? 'bg-white text-rose-600 shadow' : 'text-slate-500'}`}>加班案件 ({records.filter(r=>r.formType==='加班' && r.status==='pending').length})</button>
            <button onClick={() => setActiveTab('請假')} className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === '請假' ? 'bg-white text-rose-600 shadow' : 'text-slate-500'}`}>請假案件 ({records.filter(r=>r.formType==='請假' && r.status==='pending').length})</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">待處理清單 <ListChecks size={14}/></h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingItems.length > 0 ? pendingItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === item.id ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-100 hover:bg-slate-50 bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-black text-rose-600">{item.serialId}</span>
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{item.totalHours} HR</span>
                    </div>
                    <div className="font-black text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.dept} / {item.jobTitle}</div>
                    <div className="mt-2 text-xs text-slate-500 line-clamp-1 italic">"{item.reason}"</div>
                  </button>
                )) : (
                  <div className="py-20 text-center text-slate-300 font-bold italic opacity-50">尚無待處理案件</div>
                )}
              </div>
            </div>

            <div className={`space-y-6 transition-opacity duration-300 ${!selectedId ? 'opacity-20 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">案件詳情與處理 <Edit2 size={14}/></h3>
              {selectedItem && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">申請人</div>
                        <div className="font-bold">{selectedItem.name} ({selectedItem.empId})</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">申請時間</div>
                        <div className="font-bold">{new Date(selectedItem.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">事由內容</div>
                      <div className="font-medium text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 mt-1">{selectedItem.reason}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">審核意見 / 駁回理由</label>
                    <textarea 
                      rows="3" 
                      className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-rose-50 text-sm"
                      placeholder="請輸入意見..."
                      value={opinion}
                      onChange={e => setOpinion(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction('approved')} 
                      disabled={processing}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="animate-spin" /> : <Check size={20} />} 核准通過
                    </button>
                    <button 
                      onClick={() => handleAction('rejected')} 
                      disabled={processing}
                      className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="animate-spin" /> : <X size={20} />} 駁回申請
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, refresh, user }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', dept: '', jobTitle: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || loading) return;
    setLoading(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'employees', editingId);
        await updateDoc(docRef, { ...formData, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setFormData({ name: '', empId: '', dept: '', jobTitle: '' });
      setEditingId(null);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', id));
      refresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">人員管理中心</h1>
            <p className="text-sm opacity-80 italic">維護企業員工基本資料庫</p>
          </div>
          <Users size={40} className="opacity-40" />
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 更新順序：姓名 -> 員編 -> 職稱 -> 單位 */}
            {['name', 'empId', 'jobTitle', 'dept'].map(f => (
              <div key={f} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f==='name'?'姓名':f==='empId'?'員編':f==='dept'?'單位':'職稱'}</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm"
                  value={formData[f]} 
                  onChange={e => setFormData({...formData, [f]: e.target.value})} 
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button 
              disabled={loading}
              className={`flex-grow py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}
              {editingId ? '更新資料' : '新增人員'}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFormData({name:'',empId:'',dept:'',jobTitle:''}); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">取消</button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">員編</th>
                <th className="px-4 py-4">姓名</th>
                {/* 欄位對換 */}
                <th className="px-4 py-4">職稱</th>
                <th className="px-4 py-4">單位</th>
                <th className="px-8 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                  {/* 欄位內容對換 */}
                  <td className="px-4 py-5 text-slate-500">{emp.jobTitle}</td>
                  <td className="px-4 py-5 text-slate-500">{emp.dept}</td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditingId(emp.id); setFormData(emp); }} className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- View: Query / Search ---
const FormQueryView = ({ records }) => {
  const [search, setSearch] = useState('');
  const filtered = records.filter(r => 
    r.serialId.toLowerCase().includes(search.toLowerCase()) ||
    r.name.includes(search) ||
    r.empId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500 text-left">
      <div className="bg-amber-600 px-8 py-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">表單綜合查詢</h1>
          <p className="text-sm opacity-80 italic">檢索與追蹤所有歷史申請案件</p>
        </div>
        <Search size={40} className="opacity-40" />
      </div>
      <div className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋單號、姓名、員工編號..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold text-sm transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">單號/類別</th>
                <th className="px-4 py-4">申請人</th>
                <th className="px-4 py-4">事由</th>
                <th className="px-4 py-4 text-center">時數</th>
                <th className="px-6 py-4 text-right">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-5">
                    <div className="font-mono font-black text-slate-700">{r.serialId}</div>
                    <div className={`text-[10px] font-black uppercase inline-block px-2 py-0.5 rounded mt-1 ${r.formType === '加班' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>{r.formType}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-slate-800">{r.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{r.empId}</div>
                  </td>
                  <td className="px-4 py-5 max-w-[200px] truncate italic text-slate-500">"{r.reason}"</td>
                  <td className="px-4 py-5 text-center font-black text-slate-700">{r.totalHours} HR</td>
                  <td className="px-6 py-5 text-right"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---
const App = () => {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth failed", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const recordsQuery = collection(db, 'artifacts', appId, 'public', 'data', 'records');
    const unsubRecords = onSnapshot(recordsQuery, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }, (err) => console.error(err));

    const employeesQuery = collection(db, 'artifacts', appId, 'public', 'data', 'employees');
    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error(err));

    return () => { unsubRecords(); unsubEmployees(); };
  }, [user]);

  const otSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '加班' && r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const leaveSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '請假' && r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-LV${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const navItems = [
    { id: 'overtime', label: '加班申請', icon: Clock, color: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-600' },
    { id: 'leave', label: '請假申請', icon: CalendarDays, color: 'text-teal-600', activeBg: 'bg-teal-50', activeBorder: 'border-teal-600' },
    { id: 'approval', label: '主管簽核', icon: ShieldCheck, color: 'text-rose-600', activeBg: 'bg-rose-50', activeBorder: 'border-rose-600', badge: records.filter(r=>r.status==='pending').length },
    { id: 'query', label: '綜合查詢', icon: BarChart3, color: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-600' },
    { id: 'personnel', label: '人員管理', icon: Users, color: 'text-sky-600', activeBg: 'bg-sky-50', activeBorder: 'border-sky-600' },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">正在連線至雲端資料庫...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 text-left">
      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-indigo-600" />
          <span className="font-black">員工服務平台</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-slate-100 text-slate-600">
          {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-[60] transform transition-transform duration-300 shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden lg:flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">員工服務平台</h2>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                雲端連線正常
              </div>
            </div>
          </div>

          <nav className="flex-grow space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">主選單</p>
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === item.id ? `${item.activeBg} ${item.color} ${item.activeBorder}` : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}
              >
                <item.icon size={20} />
                <span className="flex-grow text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="w-6 h-6 flex items-center justify-center bg-rose-500 text-white text-[10px] rounded-full shadow-lg shadow-rose-100 animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-6 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User size={20} />
              </div>
              <div className="truncate">
                <p className="text-xs font-black text-slate-800">當前存取帳號</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.uid}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-grow pt-24 lg:pt-10 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          {activeMenu === 'overtime' && <OvertimeView user={user} currentSerialId={otSerialId} today={today} />}
          {activeMenu === 'leave' && <LeaveView user={user} currentSerialId={leaveSerialId} today={today} />}
          {activeMenu === 'approval' && <ApprovalCenter records={records} user={user} />}
          {activeMenu === 'query' && <FormQueryView records={records} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} refresh={() => {}} user={user} />}

          {/* Quick History List (Shared for Overtime and Leave) */}
          {(activeMenu === 'overtime' || activeMenu === 'leave') && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 text-left">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-3"><History className="text-slate-400" /> 近期申請紀錄</h3>
                <button onClick={() => setActiveMenu('query')} className="text-xs font-bold text-indigo-600 hover:underline">查看全部單據</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="py-4">單號</th>
                      <th className="py-4">姓名</th>
                      <th className="py-4 text-center">數量</th>
                      <th className="py-4 text-right">處理狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.filter(r => (activeMenu === 'overtime' ? r.formType === '加班' : r.formType === '請假')).slice(0, 5).map(r => (
                      <tr key={r.id} className="text-sm font-medium">
                        <td className="py-5">
                          <div className="font-mono font-bold text-slate-700">{r.serialId}</div>
                          <div className="text-[10px] text-slate-400">{r.startDate}</div>
                        </td>
                        <td className="py-5 font-black">{r.name}</td>
                        <td className="py-5 text-center">{r.totalHours} HR</td>
                        <td className="py-5 text-right"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr><td colSpan="4" className="py-10 text-center text-slate-300 italic">無紀錄</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Background Overlay for mobile sidebar */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"></div>}
    </div>
  );
};

export default App;