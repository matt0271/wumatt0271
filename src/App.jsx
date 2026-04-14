import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList, HelpCircle, Timer, Sparkles
} from 'lucide-react';

// --- API 設定 ---
// 請確認此 NGROK 網址是您目前最新開啟的通道
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={shows[showKey] ? 'text' : 'password'} 
        required 
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-left [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
        value={value} 
        onChange={e => onChange(field, e.target.value)} 
      />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
        {shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

// --- View Components ---

const WelcomeView = ({ userSession, setActiveMenu }) => {
  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-left font-sans">
      <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl shadow-xl overflow-hidden text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-sky-50 border border-white/10">
              <Sparkles size={14} /> 今天是 {currentDate}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              歡迎回來，{userSession.name}！
            </h1>
            <p className="text-sky-100 text-sm md:text-base font-medium opacity-90 max-w-lg leading-relaxed">
              這裡是您的專屬員工服務中心。您可以在此快速進行各項表單申請、進度查詢與資料管理。祝您有美好的一天！
            </p>
          </div>
          
          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner min-w-[200px]">
            <div className="text-sm font-bold text-sky-100 mb-1">{userSession.dept || '所屬部門'}</div>
            <div className="text-2xl font-black">{userSession.jobTitle || '員工'}</div>
            <div className="text-xs font-mono mt-2 bg-white/20 px-3 py-1 rounded-full text-white">{userSession.empId}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ employees, onLogin, apiError }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (employees.length === 0) {
      setTimeout(() => {
        setError('目前無法連線到資料庫，請確認後端伺服器已啟動。');
        setLoading(false);
      }, 500);
      return;
    }

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
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-center text-white">員工服務平台</h1>
          <p className="text-sky-100 mt-2 opacity-90 text-sm relative z-10 font-medium text-center">系統登入驗證</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {apiError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-700 text-xs font-bold text-left"><AlertTriangle size={18} className="shrink-0" /> 後端連線異常，目前為離線狀態。<br/>請確認 server.js 是否已執行。</div>}
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-left"><AlertTriangle size={18} /> {error}</div>}
          <div className="space-y-4">
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest text-left">員編或姓名</label><input type="text" required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={identifier} onChange={e => setIdentifier(e.target.value)} /></div>
            <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest text-left">密碼</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} required className="w-full p-4 pr-12 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-600 shadow-xl hover:bg-sky-700 active:scale-95 flex items-center justify-center gap-3 text-white transition-all">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />} 確認登入
          </button>
        </form>
      </div>
    </div>
  );
};

const OvertimeView = ({ currentSerialId, onRefresh, records, employees, setNotification, userSession }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [appType, setAppType] = useState('pre'); // pre=事前(Sky), post=事後(Rose)
  const [formData, setFormData] = useState({ 
    name: userSession.name, 
    empId: userSession.empId, 
    dept: userSession.dept || '', 
    category: 'regular', 
    compensationType: 'leave', 
    startDate: '', 
    startHour: '', 
    startMin: '00', 
    endDate: '', 
    endHour: '', 
    endMin: '00', 
    reason: '' 
  });

  const handleEmpIdChange = (id) => {
    const matched = employees.find(e => e.empId === id);
    setFormData(prev => ({ ...prev, empId: id, name: matched ? matched.name : prev.name, dept: matched ? matched.dept : prev.dept }));
  };

  const handleNameChange = (name) => {
    const matched = employees.find(e => e.name === name);
    setFormData(prev => ({ ...prev, name: name, empId: matched ? matched.empId : prev.empId, dept: matched ? matched.dept : prev.dept }));
  };

  const recentSubmissions = useMemo(() => {
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
      const res = await fetch(`${NGROK_URL}/api/records`, { 
        method: 'POST', 
        headers: fetchOptions.headers, 
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending', createdAt: new Date().toISOString() }) 
      });
      if(!res.ok) throw new Error('API Error');
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      setNotification({ type: 'success', text: '加班申請已送出' });
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '連線失敗，請檢查後端' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要撤回申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認</button></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
        <div className={`${appType === 'pre' ? 'bg-sky-500' : 'bg-rose-500'} px-8 py-10 text-white relative transition-colors duration-500`}>
          <div className="absolute top-6 right-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-bold text-[11px] font-mono shadow-sm">
            <span className="opacity-70 mr-1">NO.</span>{currentSerialId}
          </div>
          <h1 className="text-2xl font-black text-white">加班申請單</h1>
          <p className="mt-1 text-sm opacity-90 font-medium text-white">
            {appType === 'pre' ? '事前申請' : '事後補報'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left text-slate-900">
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setAppType('pre')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'pre' ? 'bg-white text-sky-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><Timer size={20} />事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'post' ? 'bg-white text-rose-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><History size={20} />事後補報</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-left">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">員編 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">姓名 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">部門 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" placeholder="手動填寫或帶入" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">類別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">補償方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-12"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='leave'?(appType==='pre'?'bg-sky-500':'bg-rose-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>換補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='pay'?(appType==='pre'?'bg-sky-500':'bg-rose-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>計薪</button></div></div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left text-slate-900">
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">開始時間</label><div className="flex gap-2 text-slate-900 text-left"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-sky-500 bg-white" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">結束時間</label><div className="flex gap-2 text-slate-900 text-left"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-sky-500 bg-white" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-sky-500" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className={`${appType === 'pre' ? 'bg-sky-500' : 'bg-rose-500'} rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black transition-colors duration-500`}><span className="text-[9px] uppercase opacity-70">時數</span><div className="flex items-baseline gap-1"><span className="text-xl text-white">{totalHours || "0"}</span><span className="text-[9px] text-white">HR</span></div></div>
          </div>

          <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase">原因說明</label><textarea required rows="2" placeholder="請描述加班具體工作內容..." className="w-full p-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-100" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          
          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-2xl text-[11px] font-bold text-amber-800 space-y-1 text-left shadow-sm">
            <h4 className="flex items-center gap-2 text-amber-900 font-black mb-1 text-sm"><Info size={16} className="text-amber-600"/> 備註：</h4>
            <p>A. 加班申請須事前由直屬主管核准，始得進行加班。</p>
            <p>B. 此單於加班後七個工作日內交至財務行政部辦理，逾期不受理。</p>
            <p>C. 此加班工時將依比率換算為補休時數或薪資。</p>
            <p>D. 每月加班時數上限不得超過 46 小時。</p>
          </div>
          <button disabled={totalHours <= 0 || submitting} type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${totalHours <= 0 || submitting ? 'bg-slate-300' : (appType === 'pre' ? 'bg-sky-500 hover:bg-sky-600' : 'bg-rose-500 hover:bg-rose-600')}`}>
            {submitting ? '提交中...' : `送出加班申請 (${appType === 'pre' ? '事前' : '事後'})`}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近 30 天個人加班紀錄</h3></div>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-4">{recentSubmissions.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border hover:bg-white transition-all text-slate-900">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1.5fr_1fr_1fr_1.5fr_2.5fr_1fr_auto] gap-4 items-center w-full">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">單號</p><p className="font-mono font-bold text-slate-600 truncate">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">部門</p><p className="font-bold text-slate-700 truncate">{r.dept || '未設定'}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">類型</p><p className={`font-black text-xs ${r.appType === 'pre' ? 'text-sky-600' : 'text-rose-600'}`}>{r.appType === 'pre' ? '事前' : '事後'}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">類別</p><p className="font-black text-xs text-slate-700 truncate">{OT_CATEGORIES.find(c => c.id === r.category)?.label || '未設定'}</p></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">時間</p>
                  {r.startDate === r.endDate ? (
                    <p className="font-bold text-xs text-slate-600">{r.startDate} {r.startHour}:{r.startMin}~{r.endHour}:{r.endMin}</p>
                  ) : (
                    <div className="font-bold text-[11px] text-slate-600 flex flex-col leading-tight gap-0.5">
                      <span>{r.startDate} {r.startHour}:{r.startMin} ~</span>
                      <span>{r.endDate} {r.endHour}:{r.endMin}</span>
                    </div>
                  )}
                </div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">時數</p><p className="font-black">{r.totalHours} HR</p></div>
                <div className="flex justify-end items-center gap-3 col-span-2 sm:col-span-3 md:col-span-1">
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && <button onClick={() => setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={16}/></button>}
                </div>
              </div>
            </div>
          ))}</div>
        ) : (
          <div className="py-12 text-center text-slate-300 italic font-bold">目前無近期的加班紀錄</div>
        )}
      </div>
    </div>
  );
};

const LeaveApplyView = ({ currentSerialId, onRefresh, employees, setNotification, userSession, records }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [formData, setFormData] = useState({ 
    name: userSession.name, 
    empId: userSession.empId, 
    dept: userSession.dept || '', // 新增部門欄位
    category: 'annual', 
    startDate: '', 
    startHour: '', 
    startMin: '00', 
    endDate: '', 
    endHour: '', 
    endMin: '00', 
    reason: '' 
  });

  const handleEmpIdChange = (id) => {
    const matched = employees.find(e => e.empId === id);
    setFormData(prev => ({ ...prev, empId: id, name: matched ? matched.name : prev.name, dept: matched ? matched.dept : prev.dept }));
  };

  const handleNameChange = (name) => {
    const matched = employees.find(e => e.name === name);
    setFormData(prev => ({ ...prev, name: name, empId: matched ? matched.empId : prev.empId, dept: matched ? matched.dept : prev.dept }));
  };

  const recentSubmissions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter(r => r.formType === '請假' && r.empId === userSession.empId && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      const res = await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending', createdAt: new Date().toISOString() }) });
      if(!res.ok) throw new Error('API error');
      setNotification({ type: 'success', text: '請假申請已提交' });
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '提交失敗' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要撤回申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認</button></div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left text-slate-900">
        <div className="bg-emerald-500 px-8 py-10 text-white relative flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white text-left">請假申請單</h1><p className="text-sm opacity-80 text-left">填寫申請時段與具體理由</p></div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-mono font-bold text-xs shadow-sm text-white">
            <span className="opacity-70 mr-1">NO.</span>{currentSerialId}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">員編 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">姓名 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">部門 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" placeholder="手動填寫或帶入" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">假別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="bg-emerald-500 rounded-2xl p-4 text-white flex flex-col justify-center items-center shadow-lg font-black"><span className="text-[10px] opacity-80 uppercase">總時數</span><div className="flex items-baseline gap-1"><span className="text-2xl">{totalHours || "0"}</span><span className="text-[10px]">HR</span></div></div>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left">
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2 mb-2 font-black">開始時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-rose-500 flex items-center gap-2 mb-2 font-black">結束時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-emerald-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black shadow-lg"><span className="text-[9px] opacity-80 uppercase">總時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase">請假理由</label><textarea required rows="3" className="w-full p-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50" placeholder="請輸入詳細請假原因..." value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.95] ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近 30 天個人請假紀錄</h3></div>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-4">{recentSubmissions.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border hover:bg-white transition-all text-slate-900">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1.5fr_1fr_1.5fr_2.5fr_1fr_auto] gap-4 items-center w-full">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">單號</p><p className="font-mono font-bold text-slate-600 truncate">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">部門</p><p className="font-bold text-slate-700 truncate">{r.dept || '未設定'}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">假別</p><p className="font-black text-xs text-slate-700 truncate">{LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || '未設定'}</p></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">時間</p>
                  {r.startDate === r.endDate ? (
                    <p className="font-bold text-xs text-slate-600">{r.startDate} {r.startHour}:{r.startMin}~{r.endHour}:{r.endMin}</p>
                  ) : (
                    <div className="font-bold text-[11px] text-slate-600 flex flex-col leading-tight gap-0.5">
                      <span>{r.startDate} {r.startHour}:{r.startMin} ~</span>
                      <span>{r.endDate} {r.endHour}:{r.endMin}</span>
                    </div>
                  )}
                </div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">時數</p><p className="font-black">{r.totalHours} HR</p></div>
                <div className="flex justify-end items-center gap-3 col-span-2 sm:col-span-3 md:col-span-1">
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && <button onClick={() => setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={16}/></button>}
                </div>
              </div>
            </div>
          ))}</div>
        ) : (
          <div className="py-12 text-center text-slate-300 italic font-bold">目前無近期的請假紀錄</div>
        )}
      </div>
    </div>
  );
};

const InquiryView = ({ records, userSession }) => {
  const [filters, setFilters] = useState({
    formType: '',
    serialId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    const results = records.filter(r => {
      // 1. 僅顯示當前登入者的單據
      if (r.empId !== userSession.empId) return false;
      
      // 2. 類型篩選
      if (filters.formType && r.formType !== filters.formType) return false;
      
      // 3. 單號模糊篩選 (忽略大小寫)
      if (filters.serialId && r.serialId && !r.serialId.toLowerCase().includes(filters.serialId.toLowerCase())) return false;
      
      // 4. 狀態篩選
      if (filters.status && r.status !== filters.status) return false;
      
      // 5. 日期區間篩選 (以單據起始日為主)
      if (filters.startDate && r.startDate < filters.startDate) return false;
      if (filters.endDate && r.startDate > filters.endDate) return false;
      
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleReset = () => {
    setFilters({ formType: '', serialId: '', status: '', startDate: '', endDate: '' });
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-amber-400 px-8 py-10 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white text-left">申請單據查詢</h1><p className="text-sm opacity-90 italic text-white text-left">設定條件查詢您的歷史單據</p></div><Search size={40} className="opacity-30" />
        </div>
        
        <form onSubmit={handleSearch} className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">單據類型</label>
              <select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={filters.formType} onChange={e => setFilters({...filters, formType: e.target.value})}>
                <option value="">全部</option>
                <option value="加班">加班申請</option>
                <option value="請假">請假申請</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">單號包含 (模糊搜尋)</label>
              <input type="text" placeholder="例如: OT001" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={filters.serialId} onChange={e => setFilters({...filters, serialId: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">簽核狀態</label>
              <select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">全部</option>
                <option value="pending">待簽核</option>
                <option value="approved">已核准</option>
                <option value="rejected">已駁回</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">起始日期 (從)</label>
              <input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">結束日期 (至)</label>
              <input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={handleReset} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors">清除重設</button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-colors flex items-center gap-2"><Search size={18}/> 執行查詢</button>
          </div>
        </form>

        <div className="p-8 space-y-4 text-left">
          {!hasSearched ? (
            <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
              <Search size={48} className="opacity-20 mb-2" />
              <p>請設定上方查詢條件，並點擊「執行查詢」查看單據</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(r => (
              <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border hover:border-amber-300 transition-all shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1.5fr_1fr_2.5fr_1fr_auto] gap-4 items-center w-full">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">類型</p><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{r.formType}</span></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">單號</p><p className="font-mono font-bold text-amber-600">{r.serialId}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">部門</p><p className="font-bold text-slate-700 truncate">{r.dept || '未設定'}</p></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">時間</p>
                    {r.startDate === r.endDate ? (
                      <p className="font-bold text-xs text-slate-600">{r.startDate} {r.startHour}:{r.startMin}~{r.endHour}:{r.endMin}</p>
                    ) : (
                      <div className="font-bold text-[11px] text-slate-600 flex flex-col leading-tight gap-0.5">
                        <span>{r.startDate} {r.startHour}:{r.startMin} ~</span>
                        <span>{r.endDate} {r.endHour}:{r.endMin}</span>
                      </div>
                    )}
                  </div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">時數</p><p className="font-black text-slate-900">{r.totalHours} HR</p></div>
                  <div className="flex justify-end col-span-2 sm:col-span-3 md:col-span-1">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center text-slate-400 italic font-bold">查無符合條件的單據</div>
          )}
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
    if (formData.current !== (userSession.password || userSession.empId)) return setNotification({ type: 'error', text: '舊密碼錯誤' });
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...userSession, password: formData.new.trim() }) });
      if (res.ok) { setNotification({ type: 'success', text: '密碼更新成功，即將登出...' }); setTimeout(() => onLogout(), 2000); }
      else throw new Error('API error');
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };
  const handleChange = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const handleToggle = (k) => setShows(p => ({ ...p, [k]: !p[k] }));
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-violet-500 px-8 py-10 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white">帳號安全設定</h1><p className="text-sm opacity-90 italic text-white">變更後將強制登出以確認生效</p></div><KeyRound size={40} className="opacity-30" />
        </div>
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6">
            <PassInput label="目前登入密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={handleToggle} onChange={handleChange} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={handleToggle} onChange={handleChange} />
            <PassInput label="再次確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={handleToggle} onChange={handleChange} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-2xl font-black text-white bg-violet-500 hover:bg-violet-600 shadow-xl active:scale-95 flex items-center justify-center gap-3 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />} 儲存變更
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
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) });
      if(!res.ok) throw new Error('API error');
      setNotification({ type: 'success', text: '簽核作業完成' });
      setSelectedId(null); setOpinion(''); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); } finally { setUpdating(false); }
  };
  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);
  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center text-left">
          <div className="space-y-1 text-left text-white">
            <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider text-white">待審核名單</span></div>
            <h1 className="text-2xl font-black text-white">主管審核中心</h1>
            <p className="text-sm opacity-90 font-medium italic text-white">審核員工提交之加班或請假申請單</p>
          </div>
          <ShieldCheck size={40} className="opacity-40 text-white" />
        </div>
        <div className="p-8 space-y-4 text-left">
          {pendingRecords.length > 0 ? pendingRecords.map(r => (
            <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${selectedId === r.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-inset ring-indigo-200' : 'bg-slate-50 hover:bg-white hover:border-indigo-200 border-slate-100'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[auto_1fr_1.5fr_1.5fr_3fr_1fr_auto] gap-4 items-center w-full">
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white text-white" />}</div>
                </div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">類型</p><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{r.formType}</span></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">單號</p><p className="font-mono font-bold text-slate-600 truncate">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">申請人</p><p className="font-black text-slate-800 truncate">{r.name}</p><p className="text-[10px] text-slate-400 font-bold truncate">{r.dept || '未設定'} / {r.empId}</p></div>
                <div className="min-w-0"><p className="text-[10px] font-black text-slate-400 uppercase">事由</p><p className="font-bold text-xs text-slate-700 line-clamp-3" title={r.reason}>{r.reason}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">時數</p><p className="font-black">{r.totalHours} HR</p></div>
                <div className="flex justify-end items-center col-span-2 sm:col-span-3 md:col-span-1">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center text-slate-300 italic font-bold">目前無待簽核申請單</div>
          )}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-200 p-8 flex flex-col md:flex-row gap-8 text-left">
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} className="text-indigo-600" /> 簽核意見 <span className="text-rose-400 font-bold text-[10px] ml-1 uppercase tracking-widest">* 駁回為必填</span></div>
            <textarea placeholder="填寫具體簽核意見或指示..." className="w-full p-5 rounded-2xl border bg-slate-50 outline-none text-sm font-bold text-slate-900" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase px-1">選取單據：<span className="text-indigo-600 font-bold">{selectedRecord?.serialId}</span></p>
            <div className="grid grid-cols-2 gap-3 text-white">
              <button disabled={updating} onClick={() => handleUpdate('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 active:scale-95 text-[11px] font-black uppercase text-center hover:text-white transition-all"><XCircle size={24}/><span className="text-center">駁回</span></button>
              <button disabled={updating} onClick={() => handleUpdate('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 active:scale-95 text-[11px] font-black uppercase text-center hover:text-white transition-all">{updating ? <Loader2 size={24} className="animate-spin text-center" /> : <CheckCircle2 size={24} className="text-center" /> }<span className="text-center">核准</span></button>
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
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      {pwdTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center text-slate-900">
            <RotateCcw size={48} className="text-slate-500 mx-auto mb-4 text-center" />
            <h3 className="text-xl font-black mb-1 text-slate-900 text-center">重設密碼？</h3>
            <p className="text-xs text-slate-400 mb-8 font-bold text-center">為 {pwdTarget.name} 還原為員編密碼</p>
            <div className="flex gap-3 text-left">
              <button onClick={()=>setPwdTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900 text-center">取消</button>
              <button onClick={() => { fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...pwdTarget, password: pwdTarget.empId }) }).then(onRefresh); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-slate-600 rounded-xl text-white text-center">確認</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-slate-600 p-8 text-white flex justify-between items-center text-left">
          <div><h1 className="text-2xl font-black text-white text-left">人員管理中心</h1><p className="text-sm opacity-90 italic text-white text-left">維護同仁資料與 Excel 工具</p></div><Users size={40} className="opacity-40" />
        </div>
        <div className="px-8 pt-6 flex gap-3 text-left">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 transition-colors"><FileSpreadsheet size={16}/> 匯出 Excel</button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold border border-sky-100 transition-colors"><Upload size={16}/> 匯入 Excel</button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
        </div>
        <form onSubmit={e=>{e.preventDefault(); const url=editingId?`${NGROK_URL}/api/employees/${editingId}`:`${NGROK_URL}/api/employees`; fetch(url,{method:editingId?'PUT':'POST',headers:fetchOptions.headers,body:JSON.stringify(formData)}).then(()=>{onRefresh(); setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:''});});}} className="p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <input type="text" placeholder="員編" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-slate-500" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
            <input type="text" placeholder="姓名" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-slate-500" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
            <input type="text" placeholder="職稱" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-slate-500" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} />
            <input type="text" placeholder="單位" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-slate-500" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} />
          </div>
          <button className="w-full py-4 bg-slate-600 text-white rounded-2xl font-black text-center hover:bg-slate-700 transition-colors"> {editingId ? '更新資料' : '新增人員'} </button>
        </form>
        <div className="overflow-x-auto border-t text-left">
          <table className="w-full border-collapse text-sm text-left text-slate-900">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left">職稱 / 單位</th><th className="px-4 py-4 text-left">登入密碼</th><th className="px-8 py-4 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 font-mono font-bold text-slate-600">{emp.empId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                  <td className="px-4 py-5 text-left"><div className="font-bold text-slate-900">{emp.jobTitle}</div><div className="text-[10px] text-slate-400 font-bold">{emp.dept}</div></td>
                  <td className="px-4 py-5 text-left"><div className="flex items-center gap-3">{(emp.password && emp.password !== emp.empId) && (<span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700">已自訂</span>)}<button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"><RotateCcw size={12}/>還原</button></div></td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900">
                    <button onClick={()=>{setEditingId(emp.id);setFormData(emp);window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => { if(window.confirm("確定刪除？")) fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'DELETE', headers: fetchOptions.headers }).then(onRefresh); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
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
  const [activeMenu, setActiveMenu] = useState('welcome');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => { if (notification) { const timer = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(timer); } }, [notification]);
  
  const fetchData = async () => { 
    try { 
      setLoading(true);
      setApiError(false);
      // 🔥 加入 5 秒連線逾時機制，防止瀏覽器死等
      const fetchWithTimeout = (url, options, timeout = 5000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('連線逾時')), timeout))
        ]);
      };

      const [resEmp, resRec] = await Promise.all([ 
        fetchWithTimeout(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.ok ? r.json() : []), 
        fetchWithTimeout(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.ok ? r.json() : []) 
      ]); 
      
      setEmployees(Array.isArray(resEmp) ? resEmp : []); 
      setRecords(Array.isArray(resRec) ? resRec : []); 
    } catch (err) { 
      console.error('資料庫連線失敗:', err);
      setApiError(true);
      setEmployees([]); 
      setRecords([]);
    } finally {
      // 🔥 無論成功或失敗，這行一定會執行，確保解除轉圈圈狀態
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchData(); }, []);
  const isAdmin = useMemo(() => userSession && ADMIN_TITLES.includes(userSession.jobTitle), [userSession]);

  const otSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysRecords = records.filter(r => r.serialId?.startsWith(dateStr) && r.formType === '加班');
    let maxCount = 0;
    todaysRecords.forEach(r => {
      if (r.serialId) {
        const match = r.serialId.match(/-OT(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxCount) maxCount = num;
        }
      }
    });
    return `${dateStr}-OT${String(maxCount + 1).padStart(3, '0')}`;
  }, [records]);

  const leaveSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysRecords = records.filter(r => r.serialId?.startsWith(dateStr) && r.formType === '請假');
    let maxCount = 0;
    todaysRecords.forEach(r => {
      if (r.serialId) {
        const match = r.serialId.match(/-LV(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxCount) maxCount = num;
        }
      }
    });
    return `${dateStr}-LV${String(maxCount + 1).padStart(3, '0')}`;
  }, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-sky-500"><Loader2 className="animate-spin w-12 h-12" /><span className="ml-4 font-bold text-slate-500">系統連線中...</span></div>;
  if (!userSession) return <LoginView employees={employees} apiError={apiError} onLogin={u=>{setUserSession(u);setNotification({type:'success',text:`${u.name} 登入成功`});}} />;

  return (
    <div className="h-screen w-full bg-slate-50 flex text-left font-sans text-slate-900 overflow-hidden">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border text-slate-900 ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="font-bold text-sm text-slate-700">{notification.text}</span>
        </div>
      )}
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col h-full shadow-sm shrink-0 text-left z-20">
        <div 
          onClick={() => setActiveMenu('welcome')} 
          className="flex items-center gap-4 mb-10 text-sky-500 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="p-3 bg-sky-500 rounded-2xl shadow-lg text-white"><LayoutDashboard size={24} /></div>
          <h2 className="font-black text-xl tracking-tight text-sky-600">員工服務平台</h2>
        </div>
        <nav className="space-y-2 flex-grow overflow-y-auto text-left text-slate-900">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 text-left">主要服務項目</p>
          <button onClick={() => setActiveMenu('welcome')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'welcome' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Sparkles size={20} /> 首頁總覽</button>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'overtime' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'integrated-query' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ClipboardList size={20} /> 單據查詢</button>
          <button onClick={() => setActiveMenu('change-password')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'change-password' ? 'bg-violet-50 text-violet-600 border-violet-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><KeyRound size={20} /> 修改密碼</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2 text-left">管理功能區</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'personnel' ? 'bg-slate-100 text-slate-600 border-slate-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3 text-left text-slate-900">
            <div className="px-2 min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 shadow-inner text-[10px]">{userSession.dept || '部門'}</div>
            <div className="overflow-hidden text-left text-slate-900">
              <p className="text-xs font-black truncate">{userSession.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{userSession.empId}</p>
            </div>
          </div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 active:scale-95 text-left text-rose-500">
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>
      <main className="flex-grow h-full p-10 overflow-y-auto bg-slate-50 text-left text-slate-900">
        <div className="max-w-7xl mx-auto space-y-12 text-left text-slate-900">
          {activeMenu === 'welcome' && <WelcomeView userSession={userSession} setActiveMenu={setActiveMenu} />}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} records={records} />}
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