import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList, HelpCircle
} from 'lucide-react';

// --- API 設定 ---
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 
const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
};

// --- 全域常數 ---
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

// --- Helper Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100"
  };
  const labels = { approved: "已核准", rejected: "已駁回", pending: "待簽核" };
  const currentStyle = styles[status] || styles.pending;
  const currentLabel = labels[status] || labels.pending;
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${currentStyle}`}>{currentLabel}</span>;
};

const PassInput = ({ label, value, field, showKey, Icon, shows, onToggle, onChange }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={shows[showKey] ? 'text' : 'password'} 
        required 
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-left" 
        value={value} 
        onChange={e => onChange(field, e.target.value)} 
      />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
        {shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

// --- Sub-Views ---

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
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      const validPassword = (user?.password && user.password !== "") ? user.password : user?.empId;
      if (user && validPassword === password.trim()) onLogin(user);
      else { setError('帳號或密碼不正確'); setLoading(false); }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-sky-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <UserCheck size={44} className="mx-auto mb-4 opacity-90 text-white" />
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-center text-white">身分驗證</h1>
          <p className="text-sky-100 mt-2 opacity-90 text-sm relative z-10 text-center">員工服務平台 v3.8</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-left text-slate-900"><AlertTriangle size={18} /> {error}</div>}
          <div className="space-y-4 text-left">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest text-left">員編或姓名</label><input type="text" required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold" value={identifier} onChange={e => setIdentifier(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest text-left">密碼</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-600 shadow-xl hover:bg-sky-700 active:scale-95 flex items-center justify-center gap-3">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />} 進入系統
          </button>
        </form>
      </div>
    </div>
  );
};

const OvertimeView = ({ currentSerialId, onRefresh, records, employees, setNotification, userSession }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, category: 'regular', compensationType: 'leave', startDate: '', startHour: '', startMin: '00', endDate: '', endHour: '', endMin: '00', reason: '' });

  // 連動邏輯：員編找姓名
  const handleEmpIdChange = (id) => {
    const matched = employees.find(e => e.empId === id);
    setFormData(prev => ({
      ...prev,
      empId: id,
      name: matched ? matched.name : prev.name
    }));
  };

  // 連動邏輯：姓名找員編
  const handleNameChange = (name) => {
    const matched = employees.find(e => e.name === name);
    setFormData(prev => ({
      ...prev,
      name: name,
      empId: matched ? matched.empId : prev.empId
    }));
  };

  const recentRecords = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter(r => r.formType === '加班' && r.empId === userSession.empId && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', totalHours, status: 'pending', createdAt: new Date().toISOString() }) });
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      setNotification({ type: 'success', text: '加班申請已送出' });
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '連線失敗' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2">確定要撤回申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl">確認</button></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
        <div className="bg-sky-500 px-8 py-10 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black">加班申請單</h1><p className="text-sm opacity-80">{currentSerialId}</p></div>
          <Clock size={40} className="opacity-30" />
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">員編 <HelpCircle size={10} className="text-sky-400" title="輸入同仁員編可自動帶出姓名" /></label><input type="text" className="w-full p-3 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">姓名 <HelpCircle size={10} className="text-sky-400" title="輸入同仁姓名可自動帶出員編" /></label><input type="text" className="w-full p-3 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">加班類別</label><select className="w-full p-3 rounded-xl border bg-white font-bold text-slate-900" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 text-left">補償方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-[46px]"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='leave'?'bg-sky-500 text-white shadow':'text-slate-500'}`}>換補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='pay'?'bg-sky-500 text-white shadow':'text-slate-500'}`}>計薪</button></div></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5"><label className="text-xs font-bold text-sky-600 flex items-center gap-2 mb-2"><Plus size={14} />開始</label><div className="flex gap-2 text-slate-900"><input type="date" required className="flex-1 p-3 rounded-xl border" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="p-3 w-20 rounded-xl border font-bold" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="p-3 w-20 rounded-xl border font-bold" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5"><label className="text-xs font-bold text-rose-400 flex items-center gap-2 mb-2"><ArrowRight size={14} />結束</label><div className="flex gap-2 text-slate-900"><input type="date" required className="flex-1 p-3 rounded-xl border" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="p-3 w-20 rounded-xl border font-bold" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="p-3 w-20 rounded-xl border font-bold" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-sky-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 min-h-[66px] font-black"><span className="text-[9px] uppercase opacity-70">時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">原因說明</label><textarea required rows="2" className="w-full p-4 rounded-xl border bg-white font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl text-[11px] font-bold text-amber-900 space-y-1">
            <h4 className="flex items-center gap-2 text-amber-700 font-black mb-1 text-sm"><Info size={14}/> 備註：</h4>
            <p>A. 加班申請須事前由直屬主管核准，始得進行加班。</p>
            <p>B. 此單於加班後七個工作日內交至財務行政部辦理，逾期不受理。</p>
            <p>C. 此加班工時將依比率換算為補休時數或薪資。</p>
            <p>D. 每月加班時數上限不得超過 46 小時。</p>
          </div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-sky-500 hover:bg-sky-600'}`}>提交加班申請單</button>
        </form>
      </div>
      {recentRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-sky-600 font-black"><History size={24} /><h3>最近 30 天個人加班紀錄</h3></div>
          <div className="space-y-4">{recentRecords.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border flex items-center justify-between hover:bg-white transition-all text-slate-900">
              <div className="flex items-center gap-8">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">單號</p><p className="font-mono font-bold text-sky-600 text-left">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 text-left">時數</p><p className="font-black text-left">{r.totalHours} HR</p></div>
              </div>
              <div className="flex items-center gap-3"><StatusBadge status={r.status} />{r.status === 'pending' && <button onClick={() => setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl"><Undo2 size={16}/></button>}</div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
};

const LeaveApplyView = ({ currentSerialId, onRefresh, employees, setNotification, userSession }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, category: 'annual', startDate: '', startHour: '', startMin: '00', endDate: '', endHour: '', endMin: '00', reason: '' });
  
  const handleEmpIdChange = (id) => {
    const matched = employees.find(e => e.empId === id);
    setFormData(prev => ({ ...prev, empId: id, name: matched ? matched.name : prev.name }));
  };

  const handleNameChange = (name) => {
    const matched = employees.find(e => e.name === name);
    setFormData(prev => ({ ...prev, name: name, empId: matched ? matched.empId : prev.empId }));
  };

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
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending', createdAt: new Date().toISOString() }) });
      setNotification({ type: 'success', text: '請假申請已提交' });
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '提交失敗' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-emerald-500 px-8 py-10 text-white flex justify-between items-center text-left">
          <div><h1 className="text-2xl font-black text-white text-left">請假申請單</h1><p className="text-sm opacity-80 text-left">{currentSerialId}</p></div>
          <CalendarPlus size={40} className="opacity-30" />
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1">員編 <HelpCircle size={10} className="text-emerald-400" /></label><input type="text" className="w-full p-3 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1">姓名 <HelpCircle size={10} className="text-emerald-400" /></label><input type="text" className="w-full p-3 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1 text-slate-900 text-left"><label className="text-[10px] font-black text-slate-400 text-left">假別</label><select className="w-full p-3 rounded-xl border bg-white font-bold text-slate-900 text-left" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="bg-emerald-500 rounded-2xl p-4 text-white flex flex-col justify-center items-center shadow-lg font-black"><span className="text-[10px] opacity-80 uppercase">時數</span><div className="flex items-baseline gap-1"><span className="text-2xl">{totalHours || "0"}</span><span className="text-[10px]">HR</span></div></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-2 gap-8 items-end text-left">
            <div><label className="text-xs font-bold text-emerald-600 flex items-center gap-2 mb-2"><Plus size={14} />開始</label><div className="flex gap-2 text-slate-900"><input type="date" required className="flex-1 p-4 rounded-2xl border" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="p-4 w-24 rounded-2xl border font-bold bg-white text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="p-4 w-24 rounded-2xl border font-bold bg-white text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div><label className="text-xs font-bold text-rose-500 flex items-center gap-2 mb-2"><ArrowRight size={14} />結束</label><div className="flex gap-2 text-slate-900"><input type="date" required className="flex-1 p-4 rounded-2xl border" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="p-4 w-24 rounded-2xl border font-bold bg-white text-slate-900" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="p-4 w-24 rounded-2xl border font-bold bg-white text-slate-900" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400">原因說明</label><textarea required rows="3" className="w-full p-4 rounded-xl border bg-white font-bold text-slate-900 outline-none" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>
    </div>
  );
};

const InquiryView = ({ records, userSession }) => {
  const myRecords = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter(r => r.empId === userSession.empId && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, userSession.empId]);
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left text-slate-900">
        <div className="bg-amber-400 px-8 py-10 text-white flex justify-between items-center text-left text-white">
          <div><h1 className="text-2xl font-black text-white text-left">申請單據查詢</h1><p className="text-sm opacity-90 italic text-white text-left">查看近 30 天內所有單據狀態</p></div><ClipboardList size={40} className="opacity-30" />
        </div>
        <div className="p-8 space-y-4 text-left text-slate-900">
          {myRecords.length > 0 ? myRecords.map(r => (
            <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border flex items-center justify-between hover:border-amber-300 transition-all shadow-sm text-left text-slate-900">
              <div className="flex items-center gap-8 text-left text-slate-900">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">類型</p><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{r.formType}</span></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase text-left">單號</p><p className="font-mono font-bold text-amber-600 text-left">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 text-left">時數</p><p className="font-black text-slate-700 text-left">{r.totalHours} HR</p></div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          )) : <div className="py-24 text-center text-slate-300 italic font-bold">目前無單據紀錄</div>}
        </div>
      </div>
    </div>
  );
};

const ChangePasswordView = ({ userSession, setNotification, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
  const [shows, setShows] = useState({ cur: false, new: false, con: false });
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.new !== formData.confirm) return setNotification({ type: 'error', text: '確認密碼不符' });
    if (formData.current !== (userSession.password || userSession.empId)) return setNotification({ type: 'error', text: '目前的密碼錯誤' });
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...userSession, password: formData.new.trim() }) });
      if (res.ok) { setNotification({ type: 'success', text: '密碼更新成功，系統即將登出...' }); setTimeout(() => onLogout(), 2000); }
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-violet-500 px-8 py-10 text-white flex justify-between items-center text-white text-left">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-white text-left">密碼更換設定</h1><p className="text-sm opacity-90 italic text-white text-left">完成後系統將強制登出以啟用新密碼</p></div><KeyRound size={40} className="opacity-30" />
        </div>
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6 text-left">
            <PassInput label="目前登入密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
            <PassInput label="再次確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-2xl font-black text-white bg-violet-500 shadow-xl active:scale-95 flex items-center justify-center gap-3 text-white text-center">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />} 儲存並重新登入
          </button>
        </form>
      </div>
    </div>
  );
};

const ApprovalView = ({ records, onRefresh, setNotification }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);
  const pendingRecords = useMemo(() => records.filter(r => r.status === 'pending'), [records]);
  const handleUpdate = async (status) => {
    if (!selectedId) return;
    if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '駁回原因為必填' });
    setUpdating(true);
    try {
      await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) });
      setNotification({ type: 'success', text: '簽核作業完成' });
      setSelectedId(null); setOpinion(''); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '網路異常' }); } finally { setUpdating(false); }
  };
  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);
  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center text-white text-left">
          <div className="text-left text-white text-left text-white text-left"><h1 className="text-2xl font-black text-white text-left">主管審核中心</h1><p className="text-sm opacity-90 font-medium italic text-white text-left text-white text-left">審核員工提交之加班或請假申請單</p></div><ShieldCheck size={40} className="opacity-40 text-white" />
        </div>
        <div className="overflow-x-auto text-left text-slate-900">
          <table className="w-full text-left border-collapse text-sm text-slate-900 text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-left">
              <tr><th className="px-8 py-4 text-left">選擇</th><th className="px-4 py-4 text-left text-slate-900">類型</th><th className="px-4 py-4 text-left text-slate-900">單號</th><th className="px-4 py-4 text-left text-slate-900">申請人</th><th className="px-4 py-4 text-center">時數</th><th className="px-4 py-4 min-w-[200px] text-left text-slate-900">事由</th><th className="px-8 py-4 text-right text-slate-900">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left">
              {pendingRecords.length > 0 ? pendingRecords.map(r => (
                <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`transition-all cursor-pointer text-left ${selectedId === r.id ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-200 text-left' : 'hover:bg-slate-50 text-left'}`}>
                  <td className="px-8 py-5 text-left"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-left ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white text-left" />}</div></td>
                  <td className="px-4 py-5 text-left"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{r.formType}</span></td>
                  <td className="px-4 py-5 font-mono font-bold text-left">{r.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800 text-left">{r.name}<div className="text-[10px] text-slate-400 font-bold text-left">{r.empId}</div></td>
                  <td className="px-4 py-5 text-center font-bold text-left">{r.totalHours}</td>
                  <td className="px-4 py-5 text-left text-slate-900 text-xs text-left"><p className="line-clamp-2 text-left" title={r.reason}>{r.reason}</p></td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={r.status} /></td>
                </tr>
              )) : (<tr><td colSpan="7" className="px-8 py-24 text-center text-slate-300 italic font-bold">目前無待簽核申請單</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-200 p-8 flex flex-col md:flex-row gap-8 text-left">
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm text-left"><MessageSquare size={18} className="text-indigo-600 text-left" /> 簽核意見 <span className="text-rose-400 font-bold text-[10px] ml-1 uppercase tracking-widest text-left">* 駁回為必填</span></div>
            <textarea placeholder="填寫簽核意見..." className="w-full p-5 rounded-2xl border bg-slate-50 outline-none text-sm font-bold text-slate-900 text-left" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase px-1 text-left">選取單據：<span className="text-indigo-600 font-bold text-left">{selectedRecord?.serialId}</span></p>
            <div className="grid grid-cols-2 gap-3 text-white text-left">
              <button disabled={updating} onClick={() => handleUpdate('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 active:scale-95 text-[11px] font-black uppercase text-center"><XCircle size={24}/><span className="text-rose-600 text-center">駁回</span></button>
              <button disabled={updating} onClick={() => handleUpdate('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 active:scale-95 text-[11px] font-black uppercase text-center">{updating ? <Loader2 size={24} className="animate-spin text-emerald-600 text-center" /> : <CheckCircle2 size={24} className="text-center" />}<span className="text-emerald-600 text-center">核准</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PersonnelManagement = ({ employees, onRefresh, setNotification }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [pwdTarget, setPwdTarget] = useState(null); 
  useEffect(() => { if (!window.XLSX) { const script = document.createElement('script'); script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"; script.async = true; document.head.appendChild(script); } }, []);
  const handleExport = () => { if (!window.XLSX) return; const data = employees.map(emp => ({ "姓名": emp.name, "員編": emp.empId, "職稱": emp.jobTitle, "單位": emp.dept })); const ws = window.XLSX.utils.json_to_sheet(data); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "員工名單"); window.XLSX.writeFile(wb, `員工清單_${new Date().toISOString().split('T')[0]}.xlsx`); };
  const handleImport = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (evt) => { const bstr = evt.target.result; const wb = window.XLSX.read(bstr, { type: 'binary' }); const jsonData = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); setLoading(true); for (const row of jsonData) { const payload = { name: row["姓名"], empId: row["員編"]?.toString(), jobTitle: row["職稱"] || "", dept: row["單位"] || "" }; if (payload.name && payload.empId) await fetch(`${NGROK_URL}/api/employees`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify(payload) }); } onRefresh(); setNotification({ type: 'success', text: '匯入完成' }); setLoading(false); e.target.value = ""; }; reader.readAsBinaryString(file); };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900 text-left">
      {pwdTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center text-slate-900">
            <RotateCcw size={48} className="text-slate-500 mx-auto mb-4 text-slate-500 text-center" />
            <h3 className="text-xl font-black mb-1 text-slate-900 text-center">還原密碼？</h3>
            <p className="text-xs text-slate-400 mb-8 font-bold text-center text-slate-400">為 {pwdTarget.name} 還原為員編密碼</p>
            <div className="flex gap-3 text-left">
              <button onClick={()=>setPwdTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900 text-center">取消</button>
              <button onClick={() => { fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...pwdTarget, password: pwdTarget.empId }) }).then(onRefresh); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-slate-600 rounded-xl text-white text-center">確認</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-slate-600 p-8 text-white flex justify-between items-center text-white text-left text-white text-left text-white">
          <div><h1 className="text-2xl font-black text-white text-left">人員管理中心</h1><p className="text-sm opacity-90 italic text-white text-left">管理內部同仁資料與 Excel 匯入出功能</p></div><Users size={40} className="opacity-40 text-white" />
        </div>
        <div className="px-8 pt-6 flex gap-3 text-left">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 transition-colors text-emerald-600 text-left"><FileSpreadsheet size={16}/> 匯出</button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold border border-sky-100 transition-colors text-sky-600 text-left"><Upload size={16}/> 匯入</button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
        </div>
        <form onSubmit={e=>{e.preventDefault(); const url=editingId?`${NGROK_URL}/api/employees/${editingId}`:`${NGROK_URL}/api/employees`; fetch(url,{method:editingId?'PUT':'POST',headers:fetchOptions.headers,body:JSON.stringify(formData)}).then(()=>{onRefresh(); setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:''});});}} className="p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <input type="text" placeholder="員編" required className="p-3 rounded-xl border bg-slate-50 outline-none text-left" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
            <input type="text" placeholder="姓名" required className="p-3 rounded-xl border bg-slate-50 outline-none text-left" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
            <input type="text" placeholder="職稱" required className="p-3 rounded-xl border bg-slate-50 outline-none text-left" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} />
            <input type="text" placeholder="單位" required className="p-3 rounded-xl border bg-slate-50 outline-none text-left" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} />
          </div>
          <button className="w-full py-4 bg-slate-600 text-white rounded-2xl font-black text-center text-white"> {editingId ? '更新資料' : '新增人員'} </button>
        </form>
        <div className="overflow-x-auto border-t text-left">
          <table className="w-full text-left border-collapse text-sm text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-left">
              <tr><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left text-slate-900">姓名</th><th className="px-4 py-4 text-slate-900 text-left">職稱 / 單位</th><th className="px-4 py-4 text-slate-900 text-left">登入密碼</th><th className="px-8 py-4 text-right text-slate-900 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left text-slate-900">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 text-left">
                  <td className="px-8 py-5 font-mono font-bold text-slate-600 text-left">{emp.empId}</td>
                  <td className="px-4 py-5 font-black text-slate-800 text-left">{emp.name}</td>
                  <td className="px-4 py-5 text-left text-slate-900"><div className="font-bold text-slate-900 text-left">{emp.jobTitle}</div><div className="text-[10px] text-slate-400 font-bold text-left">{emp.dept}</div></td>
                  <td className="px-4 py-5 text-left text-slate-900 text-left"><div className="flex items-center gap-3 text-left">{(emp.password && emp.password !== emp.empId) && (<span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 text-left">已自訂</span>)}<button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 flex items-center gap-1 text-left"><RotateCcw size={12}/>還原</button></div></td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900 text-right">
                    <button onClick={()=>{setEditingId(emp.id);setFormData(emp);window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-300 hover:text-slate-600"><Edit2 size={16} /></button>
                    <button onClick={() => { if(window.confirm("確定刪除？")) fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'DELETE', headers: fetchOptions.headers }).then(onRefresh); }} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>
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

// --- App Component ---

const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => { if (notification) { const timer = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(timer); } }, [notification]);
  
  const fetchData = async () => { 
    try { 
      const [resEmp, resRec] = await Promise.all([ fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()), fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json()) ]); 
      setEmployees(Array.isArray(resEmp) ? resEmp : []); 
      setRecords(Array.isArray(resRec) ? resRec : []); 
      setLoading(false); 
    } catch (err) { setLoading(false); } 
  };
  
  useEffect(() => { fetchData(); }, []);
  const isAdmin = useMemo(() => userSession && ADMIN_TITLES.includes(userSession.jobTitle), [userSession]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-sky-500"><Loader2 className="animate-spin w-12 h-12" /></div>;
  if (!userSession) return <LoginView employees={employees} onLogin={u=>{setUserSession(u);setNotification({type:'success',text:`${u.name} 登入成功`});}} />;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900 overflow-hidden text-left text-slate-900 text-left">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border text-left text-slate-900 text-left ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-600 text-left text-emerald-600 text-left" /> : <AlertTriangle size={20} className="text-rose-600 text-left text-rose-600 text-left" />}
          <span className="font-bold text-sm text-left text-slate-700 text-left text-slate-700 text-left">{notification.text}</span>
        </div>
      )}
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm shrink-0 text-left text-slate-900 text-left">
        <div className="flex items-center gap-4 mb-10 text-sky-500 text-left text-sky-500 text-left text-sky-500 text-left"><div className="p-3 bg-sky-500 rounded-2xl shadow-lg text-white text-left text-white text-left"><LayoutDashboard size={24} /></div><h2 className="font-black text-xl tracking-tight text-left text-sky-500 text-left">員工服務平台</h2></div>
        <nav className="space-y-2 flex-grow overflow-y-auto text-left text-slate-900 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 text-left text-slate-400 text-left">主要服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'overtime' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'integrated-query' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ClipboardList size={20} /> 單據查詢</button>
          <button onClick={() => setActiveMenu('change-password')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'change-password' ? 'bg-violet-50 text-violet-600 border-violet-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><KeyRound size={20} /> 修改密碼</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2 text-left text-slate-400 text-left">管理功能區</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left text-slate-900 text-left ${activeMenu === 'personnel' ? 'bg-slate-100 text-slate-600 border-slate-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-4 text-left text-slate-900 text-left text-slate-900">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3 text-left text-slate-900 text-left">
            <div className="px-2 min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 shadow-inner text-[10px] text-left text-sky-600 text-left">{userSession.dept || '部門'}</div>
            <div className="overflow-hidden text-left text-slate-900 text-left text-slate-900">
              <p className="text-xs font-black truncate text-left text-slate-900 text-left text-slate-900">{userSession.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter text-left text-slate-400 text-left text-slate-400">{userSession.empId}</p>
            </div>
          </div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 uppercase tracking-widest text-xs active:scale-95 text-left text-rose-500 text-left text-rose-500">
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>
      <main className="flex-grow p-10 overflow-y-auto bg-slate-50 text-left text-slate-900 text-left text-slate-900">
        <div className="max-w-7xl mx-auto space-y-12 text-left text-slate-900 text-left text-slate-900">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={userSession.empId.substring(0,2) + "-OT001"} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={userSession.empId.substring(0,2) + "-LV001"} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} setNotification={setNotification} onLogout={() => setUserSession(null)} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} />}
        </div>
      </main>
    </div>
  );
};

export default App;