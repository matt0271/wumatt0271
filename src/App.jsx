import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList
} from 'lucide-react';

// --- ngrok API 設定 ---
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 

const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
};

// --- 全域常數設定 ---
const ADMIN_TITLES = ["總經理", "協理", "經理", "副理"];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

const LEAVE_CATEGORIES = [
  { id: 'annual', label: '特別休假' },
  { id: 'personal', label: '事假' },
  { id: 'sick', label: '病假' },
  { id: 'marriage', label: '婚假' },
  { id: 'bereavement', label: '喪假' },
  { id: 'maternity', label: '產假 / 陪產假' },
];

// --- Helper: Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100"
  };
  const labels = { approved: "已核准", rejected: "已駁回", pending: "待簽核" };
  const currentStyle = styles[status] || styles.pending;
  const currentLabel = labels[status] || labels.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${currentStyle}`}>
      {currentLabel}
    </span>
  );
};

// --- View: Login ---
const LoginView = ({ employees, onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const user = employees.find(
        emp => emp.name === identifier.trim() || emp.empId === identifier.trim()
      );
      const validPassword = (user?.password && user.password !== "") ? user.password : user?.empId;

      if (user && validPassword === password.trim()) {
        onLogin(user);
      } else {
        setError('身分驗證失敗：憑證或密碼不正確。');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-sky-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-inner relative z-10 text-white">
            <UserCheck size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight relative z-10">系統登入</h1>
          <p className="text-sky-100 mt-2 opacity-90 text-sm relative z-10 font-medium">員工服務平台 v3.0</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-left">
              <AlertTriangle size={18} className="shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">員工姓名或編號</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                <input 
                  type="text" required 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900" 
                  placeholder="輸入姓名或員編"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">登入密碼</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} required 
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900" 
                  placeholder="預設為員工編號"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-600 shadow-xl shadow-sky-100 hover:bg-sky-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} className="text-white" />}
            {loading ? '正在驗證...' : '確認登入'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Overtime Application ---
const OvertimeView = ({ currentSerialId, onRefresh, records, setNotification, userSession }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null); 
  const [withdrawing, setWithdrawing] = useState(false);

  const initialFormState = {
    name: userSession.name, empId: userSession.empId, category: 'regular', compensationType: 'leave',
    startDate: '', startHour: '', startMin: '00', endDate: '', endHour: '', endMin: '00', reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const recentSubmissions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(new Date().getDate() - 30);
    return records.filter(r => r.formType === '加班' && r.empId === userSession.empId && new Date(r.createdAt) >= thirtyDaysAgo).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, userSession.empId]);

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours === "" || totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST', headers: fetchOptions.headers,
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (response.ok) {
        setFormData({ ...initialFormState, startDate: '', endDate: '', reason: '' });
        setNotification({ type: 'success', text: '加班申請已成功提交' });
        onRefresh();
      }
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-left">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要抽單？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button>
              <button onClick={async () => {
                setWithdrawing(true);
                const res = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers });
                if (res.ok) { setWithdrawTarget(null); setNotification({ type: 'success', text: '單據已成功抽回' }); onRefresh(); }
                setWithdrawing(false);
              }} disabled={withdrawing} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl flex items-center justify-center gap-2">
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} 確認
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans text-slate-900">
        <div className="bg-sky-500 px-8 py-10 text-white relative">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-bold text-[10px] font-mono text-white">{currentSerialId}</div>
          <h1 className="text-2xl font-black">加班申請單</h1>
          <div className="mt-6 flex bg-white/20 p-1 rounded-xl w-fit">
            <button type="button" onClick={() => setAppType('pre')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-sky-600 shadow' : 'text-white/80 hover:text-white'}`}>事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-sky-600 shadow' : 'text-white/80 hover:text-white'}`}>事後補報</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">員編</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-mono font-bold text-slate-400 text-left" value={formData.empId} /></div>
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">姓名</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-400 text-left" value={formData.name} /></div>
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400 text-left">類別</label><select className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 text-left" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400 text-left">補償方式</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center text-left">
                <button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='leave'?'bg-sky-500 text-white shadow':'text-slate-500'}`}>換補休</button>
                <button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='pay'?'bg-sky-500 text-white shadow':'text-slate-500'}`}>計薪</button>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end font-sans text-left text-slate-900">
            <div className="space-y-2 lg:col-span-5"><label className="text-xs font-bold text-sky-600 flex items-center gap-2 font-black"><Plus size={14} />開始時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 text-left" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} />
                <div className="flex gap-1 shrink-0">
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-5 text-left text-slate-900"><label className="text-xs font-bold text-rose-400 flex items-center gap-2 font-black text-left"><ArrowRight size={14} />結束時間</label>
              <div className="flex gap-2 text-left">
                <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 text-left" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
                <div className="flex gap-1 shrink-0">
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-left" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-left" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="bg-sky-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center shadow-lg lg:col-span-2 min-h-[66px] text-center">
              <span className="text-[9px] font-black uppercase opacity-80">預計時數</span>
              <div className="flex items-baseline gap-1 font-sans font-black text-white"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px] opacity-70">HR</span></div>
            </div>
          </div>
          <div className="space-y-2 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">加班原因與進度</label><textarea required rows="3" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white transition-all text-slate-900 font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-left text-white ${totalHours <= 0 || submitting ? 'bg-slate-300':'bg-sky-500 hover:bg-sky-600 shadow-sky-100'}`}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />} 送出加班申請
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Leave Application ---
const LeaveApplyView = ({ currentSerialId, onRefresh, setNotification, userSession }) => {
  const [submitting, setSubmitting] = useState(false);
  const initialFormState = {
    name: userSession.name, empId: userSession.empId, category: 'annual', startDate: '', startHour: '', startMin: '00', endDate: '', endHour: '', endMin: '00', reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
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
      const res = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST', headers: fetchOptions.headers,
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (res.ok) { setNotification({ type: 'success', text: '請假申請已提交' }); setFormData({ ...initialFormState, startDate: '', endDate: '', reason: '' }); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '提交失敗' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans text-slate-900">
        <div className="bg-emerald-500 px-8 py-10 text-white relative">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-bold text-[10px] font-mono text-white">{currentSerialId}</div>
          <h1 className="text-2xl font-black">請假申請單</h1>
          <p className="mt-2 text-emerald-100 text-sm opacity-90">請填寫請假時段與具體理由</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">申請人</label><div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-500">{userSession.empId} - {userSession.name}</div></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">假別類型</label>
              <select className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                {LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="bg-emerald-500 rounded-2xl p-4 text-white flex flex-col justify-center items-center shadow-lg font-black">
              <span className="text-[10px] uppercase opacity-80">申請總時數</span>
              <div className="flex items-baseline gap-1"><span className="text-2xl">{totalHours || "0"}</span><span className="text-[10px] opacity-70">HR</span></div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <div className="space-y-3 text-left"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14} />開始時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} />
                <select required className="p-4 w-24 rounded-2xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-4 w-24 rounded-2xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
            <div className="space-y-3 text-left"><label className="text-xs font-bold text-rose-500 flex items-center gap-2"><ArrowRight size={14} />結束時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 p-4 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
                <select required className="p-4 w-24 rounded-2xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-4 w-24 rounded-2xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">請假事由</label><textarea required rows="3" placeholder="請詳細描述請假原因..." className="w-full p-5 rounded-2xl border border-slate-200 bg-white text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-900 font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}>
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <CalendarPlus size={20} />} {submitting ? '傳送中...' : '送出申請'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Integrated Inquiry ---
const InquiryView = ({ records, userSession }) => {
  const myRecords = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(new Date().getDate() - 30);
    return records
      .filter(r => (r.formType === '請假' || r.formType === '加班') && r.empId === userSession.empId && new Date(r.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, userSession.empId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans text-slate-900">
        <div className="bg-amber-400 px-8 py-10 text-white flex justify-between items-center">
          <div className="text-left text-white"><h1 className="text-2xl font-black">單據申請查詢</h1><p className="text-sm opacity-90 italic font-medium">追蹤最近 30 天內加班與請假單狀態</p></div>
          <ClipboardList size={40} className="opacity-40" />
        </div>
        <div className="p-8">
          {myRecords.length > 0 ? (
            <div className="space-y-4">
              {myRecords.map(r => (
                <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-6 hover:border-amber-300 transition-all shadow-sm">
                  <div className="flex items-center gap-8">
                    <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">類型</p><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{r.formType}</span></div>
                    <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">單號</p><p className="font-mono font-black text-amber-600">{r.serialId}</p></div>
                    <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">時數</p><p className="font-black text-slate-700">{r.totalHours} HR</p></div>
                    <div className="space-y-1 hidden md:block text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">期間</p><p className="text-xs font-bold text-slate-500">{r.startDate} ~ {r.endDate}</p></div>
                  </div>
                  <div className="flex items-center gap-4"><StatusBadge status={r.status} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-300 italic font-bold">目前無單據紀錄</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- View: Change Password (Violet) ---
const ChangePasswordView = ({ userSession, onRefresh, setNotification }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
  const [shows, setShows] = useState({ cur: false, new: false, con: false });

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.new !== formData.confirm) return setNotification({ type: 'error', text: '新密碼與確認不符' });
    const expectedOld = userSession.password || userSession.empId;
    if (formData.current !== expectedOld) return setNotification({ type: 'error', text: '目前的密碼不正確' });

    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { 
        method: 'PUT', headers: fetchOptions.headers, 
        body: JSON.stringify({ ...userSession, password: formData.new.trim() }) 
      });
      if (res.ok) { setNotification({ type: 'success', text: '個人密碼修改成功' }); setFormData({ current: '', new: '', confirm: '' }); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };

  const PassInput = ({ label, value, field, showKey, Icon }) => (
    <div className="space-y-1 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={18} />
        <input 
          type={shows[showKey] ? 'text' : 'password'} required 
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-left" 
          value={value} onChange={e=>setFormData({...formData, [field]: e.target.value})} 
        />
        <button type="button" onClick={()=>setShows({...shows, [showKey]: !shows[showKey]})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
          {shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-violet-500 px-8 py-10 text-white flex justify-between items-center text-white">
          <div className="text-left text-white"><h1 className="text-2xl font-black">帳號安全設定</h1><p className="text-sm opacity-90 italic font-medium">建議定期更換密碼以維護帳號安全</p></div>
          <KeyRound size={40} className="opacity-40" />
        </div>
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6">
            <PassInput label="目前登入密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} />
            <PassInput label="再次確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-2xl font-black text-white bg-violet-500 hover:bg-violet-600 shadow-xl shadow-violet-100 transition-all active:scale-95 flex items-center justify-center gap-3">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <Check size={20} />} 更新密碼
          </button>
        </form>
      </div>
    </div>
  );
};

// --- View: Supervisor Approval ---
const ApprovalView = ({ records, onRefresh, setNotification }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);
  const pendingRecords = useMemo(() => records.filter(r => r.status === 'pending'), [records]);
  
  const updateStatus = async (status) => {
    if (!selectedId) return;
    if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '駁回原因為必填' });
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) });
      if (res.ok) { setNotification({ type: 'success', text: '簽核作業已完成' }); setSelectedId(null); setOpinion(''); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); } finally { setUpdating(false); }
  };

  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div className="text-left text-white"><h1 className="text-2xl font-black">主管審核中心</h1><p className="text-sm opacity-90 font-medium italic text-white">審核員工提交之加班或請假申請單</p></div><ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-left">
              <tr><th className="px-8 py-4">選擇</th><th className="px-4 py-4 text-slate-400">類型</th><th className="px-4 py-4 text-slate-400">單號</th><th className="px-4 py-4 text-slate-400">申請人</th><th className="px-4 py-4 text-slate-400">期間</th><th className="px-4 py-4 min-w-[200px] text-slate-400">事由</th><th className="px-8 py-4 text-right text-slate-400">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingRecords.length > 0 ? pendingRecords.map(r => (
                <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`transition-all cursor-pointer ${selectedId === r.id ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-200' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-5 text-left"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white" />}</div></td>
                  <td className="px-4 py-5"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>{r.formType}</span></td>
                  <td className="px-4 py-5 font-mono font-bold text-slate-900">{r.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{r.name}<div className="text-[10px] text-slate-400 font-bold">{r.empId}</div></td>
                  <td className="px-4 py-5 text-xs font-bold text-slate-500">{r.startDate}<br/>{r.endDate}</td>
                  <td className="px-4 py-5"><p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" title={r.reason}>{r.reason}</p></td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={r.status} /></td>
                </tr>
              )) : (<tr><td colSpan="7" className="px-8 py-24 text-center text-slate-300 italic font-bold">目前無待簽核申請單</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`bg-white rounded-3xl shadow-xl border p-8 transition-all duration-500 ${selectedId ? 'border-indigo-200 opacity-100' : 'border-slate-100 opacity-50 grayscale pointer-events-none translate-y-4'}`}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 簽核意見 <span className="text-rose-400 font-bold text-[10px] ml-1">* 駁回為必填</span></div>
            <textarea placeholder="請填寫簽核具體原因或指示..." className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-sm h-24 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900 text-left" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">選取單據：<span className="text-indigo-600 font-bold">{selectedRecord?.serialId || '---'}</span></p>
            <div className="grid grid-cols-2 gap-3 text-white">
              <button disabled={!selectedId || updating} onClick={() => updateStatus('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group active:scale-95"><XCircle size={24}/><span className="text-[11px] font-black uppercase">駁回</span></button>
              <button disabled={!selectedId || updating} onClick={() => updateStatus('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group active:scale-95">{updating ? <Loader2 size={24} className="animate-spin text-white" /> : <CheckCircle2 size={24} />}<span className="text-[11px] font-black uppercase">核准</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Personnel Management (Slate Gray) ---
const PersonnelManagement = ({ employees, onRefresh, setNotification }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [pwdTarget, setPwdTarget] = useState(null); 

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(formData) });
      if (res.ok) { setNotification({ type: 'success', text: '人員維護完成' }); setFormData({ name:'', empId:'', jobTitle:'', dept:'' }); setEditingId(null); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '操作失敗' }); } finally { setLoading(false); }
  };

  const handleResetPassword = async (emp) => {
    if (!window.confirm(`確定將 ${emp.name} 的密碼還原成員編 (${emp.empId}) 嗎？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...emp, password: emp.empId }) });
      if (res.ok) { setNotification({ type: 'success', text: '密碼已還原成功' }); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '重設失敗' }); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      {pwdTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <RotateCcw size={48} className="text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-1">還原員工密碼</h3>
            <p className="text-xs text-slate-400 mb-8 font-bold">為 {pwdTarget.name} 還原為員工編號碼</p>
            <div className="flex gap-3">
              <button onClick={()=>setPwdTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button>
              <button onClick={() => { handleResetPassword(pwdTarget); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-slate-600 rounded-xl">確認還原</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-slate-600 p-8 text-white flex justify-between items-center text-white">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-white text-left">人員管理中心</h1><p className="text-sm opacity-90 italic font-medium text-white text-left">維護企業內部人員資料庫與登入憑證</p></div><Users size={40} className="opacity-40 text-white text-left" />
        </div>
        <div className="px-8 pt-6 flex gap-3">
          <button onClick={() => {
            const data = employees.map(emp => ({ "姓名": emp.name, "員工編號": emp.empId, "職稱": emp.jobTitle, "單位": emp.dept }));
            const ws = window.XLSX.utils.json_to_sheet(data);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "員工名單");
            window.XLSX.writeFile(wb, `員工名單_${new Date().toISOString().split('T')[0]}.xlsx`);
          }} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 border border-emerald-100 transition-colors"><FileSpreadsheet size={16}/> 匯出 Excel</button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-100 border border-sky-100 transition-colors"><Upload size={16}/> 匯入 Excel</button>
          <input type="file" ref={fileInputRef} onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (evt) => {
              const bstr = evt.target.result;
              const wb = window.XLSX.read(bstr, { type: 'binary' });
              const jsonData = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
              setLoading(true);
              for (const row of jsonData) {
                const payload = { name: row["姓名"], empId: row["員工編號"]?.toString(), jobTitle: row["職稱"] || "", dept: row["單位"] || "" };
                if (payload.name && payload.empId) await fetch(`${NGROK_URL}/api/employees`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify(payload) });
              }
              onRefresh(); setNotification({ type: 'success', text: 'Excel 批次匯入完成' });
              setLoading(false); e.target.value = "";
            };
            reader.readAsBinaryString(file);
          }} accept=".xlsx, .xls" className="hidden" />
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">員編</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-4 focus:ring-slate-500/10 font-mono font-bold text-slate-900 outline-none text-left" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} /></div>
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">姓名</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-4 focus:ring-slate-500/10 font-bold text-slate-900 outline-none text-left" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} /></div>
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">職稱</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-4 focus:ring-slate-500/10 font-bold text-slate-900 outline-none text-left" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} /></div>
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">單位</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-4 focus:ring-slate-500/10 font-bold text-slate-900 outline-none text-left" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} /></div>
          </div>
          <div className="flex gap-3 text-left">
            <button type="button" onClick={()=>{setFormData({name:'',empId:'',jobTitle:'',dept:''});setEditingId(null);}} className="px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 border flex items-center justify-center gap-2 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"><RotateCcw size={18} /> 重設</button>
            <button disabled={loading} className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${editingId ? 'bg-orange-500 shadow-orange-100':'bg-slate-600 shadow-slate-100'}`}>{loading ? <Loader2 size={18} className="animate-spin" /> : editingId ? <Edit2 size={18} /> : <UserPlus size={18} />} {editingId ? '更新資料' : '新增人員'}</button>
          </div>
        </form>
        <div className="overflow-x-auto border-t text-left">
          <table className="w-full text-left border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-left">
              <tr><th className="px-8 py-4">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-slate-900 text-left text-slate-900">職稱 / 單位</th><th className="px-4 py-4 text-slate-900 text-left text-slate-900">登入密碼</th><th className="px-8 py-4 text-right text-slate-900 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-left">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-all text-left">
                  <td className="px-8 py-5 font-mono font-bold text-slate-600 text-left text-slate-600">{emp.empId}</td>
                  <td className="px-4 py-5 font-black text-slate-800 text-left text-slate-800">{emp.name}</td>
                  <td className="px-4 py-5 text-left text-slate-900">
                    <div className="font-bold text-slate-900 text-left">{emp.jobTitle}</div>
                    <div className="text-[10px] text-slate-400 font-bold text-left">{emp.dept}</div>
                  </td>
                  <td className="px-4 py-5 text-left text-slate-900">
                    <div className="flex items-center gap-3 text-left">
                      {(emp.password && emp.password !== emp.empId) && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 text-left">
                          已自訂
                        </span>
                      )}
                      <button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 flex items-center gap-1 text-left text-slate-500" ><RotateCcw size={12} /> 還原員編</button>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900 text-right"><button onClick={()=>{setEditingId(emp.id);setFormData(emp);window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-300 hover:text-slate-600 transition-colors text-slate-300"><Edit2 size={16} /></button><button onClick={() => { if(window.confirm("確定刪除此員工？")) { fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'DELETE', headers: fetchOptions.headers }).then(onRefresh); } }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors text-slate-300"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- App Main Component ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      const [resEmp, resRec] = await Promise.all([
        fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()),
        fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json())
      ]);
      setEmployees(Array.isArray(resEmp) ? resEmp : []);
      setRecords(Array.isArray(resRec) ? resRec : []);
      setLoading(false);
    } catch (err) { console.error("Fetch error:", err); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const isAdmin = useMemo(() => userSession && ADMIN_TITLES.includes(userSession.jobTitle), [userSession]);

  const otSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId?.startsWith(dateStr) && r.formType === '加班').length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records]);

  const leaveSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId?.startsWith(dateStr) && r.formType === '請假').length;
    return `${dateStr}-LV${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-sky-500 w-12 h-12" /></div>;
  if (!userSession) return <LoginView employees={employees} onLogin={u=>{setUserSession(u);setNotification({type:'success',text:`${u.name} 您好，歡迎登入。`});}} />;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900 overflow-hidden">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border text-left ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="font-bold text-sm text-slate-700">{notification.text}</span>
        </div>
      )}

      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm shrink-0">
        <div className="flex items-center gap-4 mb-10 text-sky-500">
            <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-100 text-white"><LayoutDashboard size={24} /></div>
            <h2 className="font-black text-xl tracking-tight">員工服務平台</h2>
        </div>
        <nav className="space-y-2 flex-grow overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-sky-50 text-sky-600 border-sky-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'integrated-query' ? 'bg-amber-50 text-amber-500 border-amber-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ClipboardList size={20} /> 單據查詢</button>
          <button onClick={() => setActiveMenu('change-password')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'change-password' ? 'bg-violet-50 text-violet-600 border-violet-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><KeyRound size={20} /> 修改密碼</button>
          
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2 text-left">管理功能</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-slate-100 text-slate-600 border-slate-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3">
            <div className="px-2 min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 shadow-inner text-[10px] whitespace-nowrap overflow-hidden text-sky-600">{userSession.dept || '部門'}</div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-black truncate text-slate-900">{userSession.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter text-slate-400">{userSession.empId}</p>
            </div>
          </div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 uppercase tracking-widest text-xs active:scale-95 text-left text-rose-500">
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto bg-slate-50 text-left">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} onRefresh={fetchData} setNotification={setNotification} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} />}
        </div>
      </main>
    </div>
  );
};

export default App;