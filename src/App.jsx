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

// --- 常數設定 ---
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
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200"
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
        setError('驗證失敗：帳號或密碼不正確。');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500 text-left">
        <div className="bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-inner relative z-10 text-white">
            <UserCheck size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight relative z-10">身分驗證</h1>
          <p className="text-indigo-100 mt-2 opacity-80 text-sm relative z-10 font-bold">請輸入憑證與密碼進入平台</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-left">
              <AlertTriangle size={18} className="shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">員工姓名或編號</label>
              <div className="relative group text-left">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" required 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900" 
                  placeholder="輸入姓名或員編"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 text-left">登入密碼</label>
              <div className="relative group text-left text-slate-900">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} required 
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900" 
                  placeholder="輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} className="text-white" />}
            {loading ? '驗證中...' : '登入系統'}
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
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST', headers: fetchOptions.headers,
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (res.ok) {
        setFormData({ ...initialFormState, startDate: '', endDate: '', reason: '' });
        setNotification({ type: 'success', text: '加班申請已提交' });
        onRefresh();
      }
    } catch (err) { setNotification({ type: 'error', text: '連線失敗' }); } finally { setSubmitting(false); }
  };

  const handleWithdrawAction = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (res.ok) { setWithdrawTarget(null); setNotification({ type: 'success', text: '單據已抽回' }); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '連線失敗' }); } finally { setWithdrawing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-left">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要抽單？</h3>
            <p className="text-sm text-slate-500 mb-8 text-slate-900">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button>
              <button onClick={handleWithdrawAction} disabled={withdrawing} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl flex items-center justify-center gap-2">
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} 確認
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left font-sans text-slate-900">
        <div className="bg-indigo-600 px-8 py-10 text-white relative text-white">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-left text-white font-bold"><Fingerprint className="w-4 h-4" />{currentSerialId}</div>
          <h1 className="text-2xl font-black text-left">加班申請單</h1>
          <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
            <button onClick={() => setAppType('pre')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70'}`}>事後補報</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">員編</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm opacity-60 font-mono font-bold text-slate-900" value={formData.empId} /></div>
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">姓名</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm opacity-60 font-bold text-slate-900" value={formData.name} /></div>
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">類別</label><select className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400 text-left">補償方式</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center text-left">
                <button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='leave'?'bg-indigo-600 text-white shadow':'text-slate-500'}`}>換補休</button>
                <button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='pay'?'bg-indigo-600 text-white shadow':'text-slate-500'}`}>計薪</button>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end font-sans text-left text-slate-900">
            <div className="space-y-2 lg:col-span-5 text-left text-slate-900"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14} />開始時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} />
                <div className="flex gap-1 shrink-0">
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-5 text-left text-slate-900"><label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14} />結束時間</label>
              <div className="flex gap-2 text-left">
                <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
                <div className="flex gap-1 shrink-0 text-left">
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 rounded-2xl p-3 text-white flex flex-col justify-center items-center shadow-lg lg:col-span-2 min-h-[66px]">
              <span className="text-[9px] font-black uppercase opacity-70">預計時數</span>
              <div className="flex items-baseline gap-1"><span className="text-xl font-black">{totalHours || "0"}</span><span className="text-[9px] font-bold opacity-60">HR</span></div>
            </div>
          </div>
          <div className="space-y-2 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">加班詳細事由</label><textarea required rows="3" placeholder="請填寫工作內容原因..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white transition-all text-slate-900 font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${totalHours <= 0 || submitting ? 'bg-slate-300':'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
            {submitting ? <Loader2 size={18} className="animate-spin text-white" /> : <ClipboardCheck size={18} className="text-white" />} {submitting ? '處理中...' : '提交加班申請'}
          </button>
        </form>
      </div>
      {recentSubmissions.length > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-8 text-left text-slate-900">
          <div className="flex items-center gap-3 mb-6 text-indigo-600 text-left"><FileText size={24}/><h3 className="font-black text-lg text-left text-slate-900">最近 30 天單據紀錄</h3></div>
          <div className="space-y-4">
            {recentSubmissions.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4 shadow-sm text-left">
                <div className="flex items-center gap-6 text-left">
                  <div className="text-left text-slate-900"><p className="text-[10px] font-black text-slate-400 text-left">單號</p><p className="font-mono font-black text-indigo-600 text-left">{r.serialId}</p></div>
                  <div className="text-left text-slate-900"><p className="text-[10px] font-black text-slate-400 text-left">時數</p><p className="font-black text-slate-800 text-left">{r.totalHours} HR</p></div>
                  <div className="text-left hidden md:block text-slate-900"><p className="text-[10px] font-black text-slate-400 text-left">提交時間</p><p className="text-xs font-bold text-slate-500 text-left">{new Date(r.createdAt).toLocaleString('zh-TW', { hour12: false })}</p></div>
                </div>
                <div className="flex items-center gap-4 text-left"><StatusBadge status={r.status} /><button onClick={()=>setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Undo2 size={18}/></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left font-sans text-slate-900">
        <div className="bg-sky-600 px-8 py-10 text-white relative text-white">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-left text-white font-bold"><Fingerprint className="w-4 h-4" />{currentSerialId}</div>
          <h1 className="text-2xl font-black text-left">請假申請單</h1>
          <p className="mt-2 text-sky-100 text-sm opacity-80 text-left">填寫請假時段與理由</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">申請人</label><div className="p-3 bg-slate-50 border rounded-xl text-sm font-bold text-slate-500">{userSession.empId} - {userSession.name}</div></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">假別類型</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                {LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="bg-sky-600 rounded-2xl p-3 text-white flex flex-col justify-center items-center shadow-lg">
              <span className="text-[9px] font-black uppercase opacity-70">總時數</span>
              <div className="flex items-baseline gap-1"><span className="text-xl font-black">{totalHours || "0"}</span><span className="text-[9px] font-bold opacity-60">HR</span></div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-6 items-end font-sans text-slate-900 text-left">
            <div className="space-y-2 text-left"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14} />開始時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 text-slate-900" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} />
                <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
            <div className="space-y-2 text-left text-slate-900 text-left"><label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14} />結束時間</label>
              <div className="flex gap-2 text-left text-slate-900">
                <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 text-slate-900" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
                <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 text-left" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}><option value="">時</option>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-3 w-20 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 text-left" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">請假事由</label><textarea required rows="3" placeholder="說明請假理由..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white text-slate-900 font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-left ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-100'}`}>
            {submitting ? <Loader2 size={18} className="animate-spin text-left text-white" /> : <CalendarPlus size={18} />} {submitting ? '提交中...' : '送出請假申請'}
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
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left font-sans text-slate-900">
        <div className="bg-sky-700 px-8 py-8 text-white flex justify-between items-center text-left text-white">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-left text-white">單據查詢</h1><p className="text-sm opacity-80 italic font-bold text-left text-white">追蹤最近 30 天內所有的申請進度</p></div>
          <ClipboardList size={40} className="opacity-40 text-left text-white" />
        </div>
        <div className="p-8">
          {myRecords.length > 0 ? (
            <div className="space-y-4">
              {myRecords.map(r => (
                <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-6 hover:border-sky-300 transition-all shadow-sm text-left text-slate-900">
                  <div className="flex items-center gap-8 text-left text-slate-900">
                    <div className="space-y-1 text-left text-slate-900"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">類型</p><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.formType}</span></div>
                    <div className="space-y-1 text-left text-slate-900"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">單號</p><p className="font-mono font-black text-sky-600 text-sm text-left">{r.serialId}</p></div>
                    <div className="space-y-1 text-left text-slate-900"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">時數</p><p className="font-black text-indigo-600 text-sm text-left">{r.totalHours} HR</p></div>
                    <div className="space-y-1 hidden md:block text-left text-slate-900 text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">時間</p><p className="text-xs font-bold text-slate-600 text-left">{r.startDate} ~ {r.endDate}</p></div>
                  </div>
                  <div className="flex items-center gap-4 text-left"><StatusBadge status={r.status} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 italic font-bold">目前無近 30 天單據紀錄</div>
          )}
        </div>
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
  const recentProcessed = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(new Date().getDate() - 30);
    return records.filter(r => r.status !== 'pending' && new Date(r.createdAt) >= thirtyDaysAgo).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  const updateStatus = async (status) => {
    if (!selectedId) return;
    if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '駁回必填意見' });
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) });
      if (res.ok) { setNotification({ type: 'success', text: '簽核完成' }); setSelectedId(null); setOpinion(''); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '網路異常' }); } finally { setUpdating(false); }
  };

  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left text-slate-900 text-left">
        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center text-left text-white">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-left text-white">主管簽核</h1><p className="text-sm opacity-80 italic font-bold text-left text-white text-left">審核員工申請紀錄 (加班/請假)</p></div><ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b text-left text-slate-400">
              <tr className="text-left border-b"><th className="px-8 py-4 text-left">選擇</th><th className="px-4 py-4 text-left">類型</th><th className="px-4 py-4 text-left">單號</th><th className="px-4 py-4 text-left">申請人</th><th className="px-4 py-4 text-left">期間</th><th className="px-4 py-4 text-left min-w-[200px]">事由</th><th className="px-8 py-4 text-right text-left">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-left text-slate-900 text-left">
              {pendingRecords.length > 0 ? pendingRecords.map(r => (
                <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`transition-all cursor-pointer text-left text-slate-900 ${selectedId === r.id ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20 text-left' : 'hover:bg-slate-50 text-left'}`}>
                  <td className="px-8 py-5 text-left text-slate-900"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-left text-slate-900 ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600 text-left' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white text-left" />}</div></td>
                  <td className="px-4 py-5 text-left text-slate-900 text-left"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.formType}</span></td>
                  <td className="px-4 py-5 font-mono text-indigo-600 font-bold text-left">{r.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800 text-left text-slate-900">{r.name}<div className="text-[10px] text-indigo-600 font-bold text-left">{r.empId}</div></td>
                  <td className="px-4 py-5 text-xs font-bold text-slate-700 text-left text-slate-900">{r.startDate}<br/>{r.endDate}</td>
                  <td className="px-4 py-5 text-left text-slate-900 text-left"><p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-bold text-left text-slate-900" title={r.reason}>{r.reason}</p></td>
                  <td className="px-8 py-5 text-right text-left text-slate-900 text-left"><StatusBadge status={r.status} /></td>
                </tr>
              )) : (<tr><td colSpan="7" className="px-8 py-10 text-center text-slate-400 italic font-bold text-left">尚無待處理申請</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`bg-white rounded-3xl shadow-xl border p-8 transition-all duration-500 text-left ${selectedId ? 'border-indigo-200 opacity-100' : 'border-slate-100 opacity-50 grayscale pointer-events-none translate-y-4'}`}>
        <div className="flex flex-col md:flex-row gap-8 text-left text-slate-900">
          <div className="flex-1 space-y-4 text-left text-slate-900">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm text-left"><MessageSquare size={18} /> 簽核意見 <span className="text-rose-500 font-bold text-[10px] ml-1 uppercase tracking-widest text-left">* 駁回為必填</span></div>
            <textarea placeholder="請輸入意見..." className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm h-24 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 text-left" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-left text-slate-900">目前選取：<span className="text-indigo-600 text-left text-indigo-600">{selectedRecord?.serialId || '未選取'}</span></p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <button disabled={!selectedId || updating} onClick={() => updateStatus('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group font-black active:scale-95 text-left text-rose-600"><XCircle size={24}/><span className="text-[11px] uppercase tracking-widest text-left">駁回申請</span></button>
              <button disabled={!selectedId || updating} onClick={() => updateStatus('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group font-black active:scale-95 text-left text-emerald-600">{updating ? <Loader2 size={24} className="animate-spin text-left" /> : <CheckCircle2 size={24} />}<span className="text-[11px] uppercase tracking-widest text-left">核准加班</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, onRefresh, setNotification }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(formData) });
      if (res.ok) { setNotification({ type: 'success', text: '人員資料已更新' }); setFormData({ name:'', empId:'', jobTitle:'', dept:'' }); setEditingId(null); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '連線失敗' }); } finally { setLoading(false); }
  };

  const handleResetPassword = async (emp) => {
    if (!window.confirm(`確定將 ${emp.name} 的密碼還原成員工編號 (${emp.empId}) 嗎？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...emp, password: emp.empId }) });
      if (res.ok) { setNotification({ type: 'success', text: `${emp.name} 的密碼已成功重設` }); onRefresh(); }
    } catch (err) { setNotification({ type: 'error', text: '重設失敗' }); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (res.ok) { setNotification({ type: 'success', text: '人員已移除' }); onRefresh(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500 font-sans text-slate-900">
      <div className="bg-sky-600 p-8 text-white flex justify-between items-center text-left text-white">
        <div className="text-left text-white text-left text-white"><h1 className="text-2xl font-black text-left text-white text-left text-white">人員管理</h1><p className="text-sm opacity-80 italic font-bold text-left text-white text-left text-white">維護企業員工基本資料庫</p></div><Users size={40} className="opacity-40 text-left text-white" />
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">員編</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-mono font-bold text-slate-900 text-left" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} /></div>
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">姓名</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-900 text-left" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} /></div>
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">職稱</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-900 text-left" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} /></div>
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left text-slate-400">單位</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-900 text-left" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} /></div>
        </div>
        <div className="flex gap-3 text-left">
          <button type="button" onClick={()=>{setFormData({name:'',empId:'',jobTitle:'',dept:''});setEditingId(null);}} className="px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 border flex items-center justify-center gap-2 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs active:scale-95 text-left text-slate-500 text-left"><RotateCcw size={18} className="text-left text-slate-400" /> 重設</button>
          <button disabled={loading} className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs active:scale-95 text-left text-white ${editingId ? 'bg-orange-500 shadow-orange-100':'bg-sky-600 shadow-sky-100'}`}>{loading ? <Loader2 size={18} className="animate-spin text-left text-white text-left" /> : editingId ? <Edit2 size={18} className="text-left text-white text-left" /> : <UserPlus size={18} className="text-left text-white text-left" />} {editingId ? '確認更新' : '新增人員'}</button>
        </div>
      </form>
      <div className="overflow-x-auto border-t text-left">
        <table className="w-full text-left border-collapse text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b text-left text-slate-400">
            <tr className="text-left border-b text-left text-slate-400"><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left text-slate-900 text-left">職稱 / 單位</th><th className="px-4 py-4 text-left text-slate-900 text-left">登入密碼</th><th className="px-8 py-4 text-right text-left text-slate-900 text-left">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-left text-slate-900 text-left">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all text-left text-slate-900 text-left">
                <td className="px-8 py-5 font-mono font-bold text-sky-600 text-left text-sky-600 text-left">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800 text-left text-slate-800 text-left">{emp.name}</td>
                <td className="px-4 py-5 text-left text-slate-900 text-left">
                  <div className="font-bold text-left text-slate-900">{emp.jobTitle}</div>
                  <div className="text-[10px] text-slate-400 text-left font-bold text-slate-400">{emp.dept}</div>
                </td>
                <td className="px-4 py-5 text-left text-slate-900 text-left">
                  <div className="flex items-center gap-3 text-left text-slate-900 text-left">
                    {(emp.password && emp.password !== emp.empId) && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 text-left text-emerald-700">
                        已自訂
                      </span>
                    )}
                    <button onClick={()=>handleResetPassword(emp)} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-left text-indigo-600 text-left" ><RotateCcw size={12} className="text-left text-indigo-600" /> 重設密碼</button>
                  </div>
                </td>
                <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900 text-left text-slate-900 text-left"><button onClick={()=>{setEditingId(emp.id);setFormData(emp);window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-300 hover:text-sky-600 transition-colors text-left text-slate-300 text-left"><Edit2 size={16} className="text-left text-slate-300" /></button><button onClick={()=>deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors text-left text-slate-300 text-left"><Trash2 size={16} className="text-left text-slate-300" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App Component ---
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-left"><Loader2 className="animate-spin text-indigo-600 w-12 h-12 text-left" /></div>;

  if (!userSession) return <LoginView employees={employees} onLogin={(u)=>{setUserSession(u);setNotification({type:'success',text:`${u.name} 登入成功`});}} />;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900 overflow-hidden text-left text-slate-900">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border text-left text-slate-900 ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-left text-emerald-600" /> : <AlertTriangle size={20} className="text-left text-rose-600" />}
          <span className="font-bold text-sm text-left text-slate-700">{notification.text}</span>
        </div>
      )}

      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm text-left shrink-0 text-left text-slate-900">
        <div className="flex items-center gap-4 mb-10 text-indigo-600 text-left text-indigo-600 text-left">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 text-left text-indigo-600 text-left"><LayoutDashboard className="text-white text-left" size={24} /></div>
            <h2 className="font-black text-xl tracking-tight text-left text-indigo-600 text-left">員工服務平台</h2>
        </div>
        <nav className="space-y-2 flex-grow text-left text-slate-900 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 text-left text-slate-400 text-left">服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm text-left text-indigo-600' : 'text-slate-400 hover:bg-slate-50 border-transparent text-left text-slate-400'}`}><Clock size={20} className="text-left text-slate-400" /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 ${activeMenu === 'leave-apply' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm text-left text-sky-600' : 'text-slate-400 hover:bg-slate-50 border-transparent text-left text-slate-400'}`}><CalendarPlus size={20} className="text-left text-slate-400" /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 ${activeMenu === 'integrated-query' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm text-left text-sky-600' : 'text-slate-400 hover:bg-slate-50 border-transparent text-left text-slate-400'}`}><ClipboardList size={20} className="text-left text-slate-400" /> 單據查詢</button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 ${activeMenu === 'approval' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm text-left text-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-transparent text-left text-slate-400'}`}><ShieldCheck size={20} className="text-left text-slate-400" /> 主管簽核</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm text-left text-sky-600' : 'text-slate-400 hover:bg-slate-50 border-transparent text-left text-slate-400'}`}><Users size={20} className="text-left text-slate-400" /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-4 text-left text-slate-900 text-left">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3 text-left text-slate-900 text-left">
            <div className="px-2 min-w-[40px] h-10 bg-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-inner text-[10px] whitespace-nowrap overflow-hidden text-left text-indigo-600 text-left">{userSession.dept || '部門'}</div>
            <div className="overflow-hidden text-left text-slate-900 text-left">
              <p className="text-xs font-black truncate text-left text-slate-900 text-left">{userSession.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter text-left text-slate-400 text-left text-slate-400">{userSession.empId}</p>
            </div>
          </div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 uppercase tracking-widest text-xs active:scale-95 text-left text-rose-500 text-left">
            <LogOut size={20} className="text-left text-rose-500 text-left" /> 登出系統
          </button>
        </div>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto bg-slate-50 text-left text-slate-900 text-left">
        <div className="max-w-7xl mx-auto space-y-12 text-left text-slate-900 text-left">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} />}
        </div>
      </main>
    </div>
  );
};

export default App;