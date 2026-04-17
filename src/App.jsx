import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList, HelpCircle, Timer, Sparkles, ChevronDown, ChevronUp, Megaphone,
  Paperclip, UploadCloud
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
  { id: 'comp', label: '補休' },
  { id: 'personal', label: '事假' },
  { id: 'sick', label: '病假' },
  { id: 'sick_hospital', label: '病假(連續住院)' },
  { id: 'marriage', label: '婚假' },
  { id: 'bereavement', label: '喪假' },
  { id: 'official', label: '公假' },
  { id: 'occupational_sickness', label: '公傷假' },
  { id: 'maternity_leave', label: '產假' },
  { id: 'paternity_leave', label: '陪產假' },
  { id: 'prenatal_checkup', label: '產檢假' },
  { id: 'welfare', label: '福利假' },
  { id: 'family_care', label: '家庭照顧假' },
  { id: 'parental_leave', label: '育嬰留停假' },
];

const ANNOUNCEMENT_TYPES = [
  { id: 'policy', label: '政策更新', colorClass: 'bg-violet-50 text-violet-600' },
  { id: 'system', label: '系統維護', colorClass: 'bg-rose-50 text-rose-600' },
  { id: 'personnel', label: '人事通報', colorClass: 'bg-indigo-50 text-indigo-600' },
  { id: 'reward', label: '獎懲公告', colorClass: 'bg-amber-50 text-amber-600' },
  { id: 'training', label: '教育訓練通知', colorClass: 'bg-cyan-50 text-cyan-600' },
  { id: 'welfare', label: '福利與補助', colorClass: 'bg-emerald-50 text-emerald-600' },
  { id: 'safety', label: '安全健康提醒', colorClass: 'bg-orange-50 text-orange-600' },
  { id: 'event', label: '節日與活動', colorClass: 'bg-fuchsia-50 text-fuchsia-600' },
  { id: 'finance', label: '財務相關公告', colorClass: 'bg-blue-50 text-blue-600' },
];

// --- 特休計算 Helpers ---
const getNextAnniversary = (hireDateStr) => {
  if (!hireDateStr) return null;
  const hireDate = new Date(hireDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  let nextAnniv = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
  if (nextAnniv < today) {
    nextAnniv.setFullYear(today.getFullYear() + 1);
  }
  return nextAnniv;
};

const getDaysDiff = (date1, date2) => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getProjectedPTO = (hireDateStr, nextAnniversaryDate) => {
  if (!hireDateStr || !nextAnniversaryDate) return 0;
  const hireDate = new Date(hireDateStr);
  const years = nextAnniversaryDate.getFullYear() - hireDate.getFullYear();
  let days = 0;
  if (years >= 10) days = 15 + (years - 9);
  else if (years >= 5) days = 15;
  else if (years >= 3) days = 14;
  else if (years >= 2) days = 10;
  else if (years >= 1) days = 7;
  else days = 3;
  if (days > 30) days = 30;
  return days * 8; 
};

const calculatePTOStats = (empId, hireDateStr, records) => {
  let usedAnn = 0;
  let earnedCmp = 0;
  let usedCmp = 0;
  records.forEach(r => {
    if (r.empId === empId && r.status === 'approved') {
      if (r.formType === '請假' && r.category === 'annual') usedAnn += (parseFloat(r.totalHours) || 0);
      if (r.formType === '加班' && r.compensationType === 'leave') earnedCmp += (parseFloat(r.totalHours) || 0);
      if (r.formType === '請假' && r.category === 'comp') usedCmp += (parseFloat(r.totalHours) || 0);
    }
  });
  let totalAnnualHours = 0;
  if (hireDateStr) {
    const hireDate = new Date(hireDateStr);
    const today = new Date();
    if (!isNaN(hireDate.getTime())) {
      let years = today.getFullYear() - hireDate.getFullYear();
      let m = today.getMonth() - hireDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < hireDate.getDate())) years--;
      let days = 0;
      if (years >= 10) { days = 15 + (years - 9); if (days > 30) days = 30; }
      else if (years >= 5) days = 15;
      else if (years >= 3) days = 14;
      else if (years >= 2) days = 10;
      else if (years >= 1) days = 7;
      else { const sixM = new Date(hireDate); sixM.setMonth(sixM.getMonth() + 6); if (today >= sixM) days = 3; }
      totalAnnualHours = days * 8; 
    }
  }
  return { totalAnnual: totalAnnualHours, usedAnnual: usedAnn, remainAnnual: Math.max(0, totalAnnualHours - usedAnn), earnedComp: earnedCmp, usedComp: usedCmp, remainComp: Math.max(0, earnedCmp - usedCmp) };
};

const canManagerApproveRecord = (userSession, r, employees) => {
  if (r.status !== 'pending_manager' && r.status !== 'pending') return false;
  if (!userSession) return false;
  if (userSession.empId === 'root') return true;
  const applicant = employees.find(emp => emp.empId === r.empId);
  if (r.formType === '請假') {
    const days = (parseFloat(r.totalHours) || 0) / 8;
    const isApplicantManager = ["協理", "經理", "副理"].includes(applicant?.jobTitle);
    let targetLevel = '';
    if (isApplicantManager && days >= 1) targetLevel = '總經理'; 
    else if (days > 5) targetLevel = '總經理'; 
    else if (days > 3 && days <= 5) targetLevel = '協理'; 
    else targetLevel = '經副理'; 
    if (targetLevel === '總經理') return userSession.jobTitle === '總經理';
    if (targetLevel === '協理') {
      if (userSession.jobTitle !== '協理') return false;
      if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(r.dept);
      if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(r.dept);
      return r.dept === userSession.dept;
    }
    if (targetLevel === '經副理') {
      if (!["經理", "副理"].includes(userSession.jobTitle)) return false;
      return r.dept === userSession.dept;
    }
    return false;
  } else {
    if (userSession.jobTitle === '總經理') return applicant?.jobTitle === '協理';
    if (userSession.jobTitle === '協理') {
      if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(r.dept);
      if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(r.dept);
      return r.dept === userSession.dept;
    }
    return r.dept === userSession.dept;
  }
};

// --- Helper Components ---

const StatusBadge = ({ status }) => {
  const labels = { 
    approved: "已核准", rejected: "已駁回", pending_substitute: "待代理", pending_manager: "待簽核", pending: "待簽核", canceled: "已撤銷"
  };
  const currentLabel = labels[status] || labels.pending;
  const finalized = ['approved', 'rejected', 'canceled'].includes(status);

  if (finalized) {
    const stampConfig = {
      approved: { color: "border-emerald-600 text-emerald-900 outline-emerald-600", rotate: "-rotate-6", icon: <Check size={32} strokeWidth={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 opacity-40" /> },
      rejected: { color: "border-rose-600 text-rose-900 outline-rose-600", rotate: "rotate-6", icon: <X size={32} strokeWidth={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-400 opacity-40" /> },
      canceled: { color: "border-slate-500 text-slate-900 outline-slate-500", rotate: "-rotate-3", icon: <RotateCcw size={24} strokeWidth={4} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 opacity-40" /> }
    };
    const config = stampConfig[status];
    return (
      <div className="w-[72px] h-[40px] flex items-center justify-center shrink-0">
        <div className={`relative inline-flex items-center justify-center ${config.rotate} opacity-90 pointer-events-none select-none`}>
          <div className={`w-[36px] h-[36px] relative flex flex-col items-center justify-center border-[2px] rounded-full font-black text-[8px] leading-none bg-white/60 backdrop-blur-sm outline outline-1 outline-offset-2 ${config.color} shadow-sm overflow-hidden`}>
            {config.icon}
            <span className="relative z-10">{currentLabel.substring(0, 1)}</span>
            <span className="relative z-10">{currentLabel.substring(1)}</span>
          </div>
        </div>
      </div>
    );
  }

  const styles = { pending_substitute: "bg-amber-50 text-amber-700 border-amber-200", pending_manager: "bg-indigo-50 text-indigo-700 border-indigo-200", pending: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  const currentStyle = styles[status] || styles.pending;
  return (
    <div className="w-[72px] h-[40px] flex items-center justify-center shrink-0">
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${currentStyle} whitespace-nowrap shadow-sm`}>{currentLabel}</span>
    </div>
  );
};

const PassInput = ({ label, value, field, showKey, Icon, shows, onToggle, onChange }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors"><Icon size={18} /></div>
      <input type={shows[showKey] ? 'text' : 'password'} required className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 transition-all text-left [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={value} onChange={e => onChange(field, e.target.value)} />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  </div>
);

// --- View Components ---

const WelcomeView = ({ userSession, records, onRefresh, setActiveMenu, isAdmin, announcements, employees }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const currentDate = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const substituteCount = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name).length, [records, userSession.name]);
  const managerCount = useMemo(() => isAdmin ? records.filter(r => canManagerApproveRecord(userSession, r, employees)).length : 0, [records, userSession, isAdmin, employees]);
  const processingOtCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '加班' && (r.status === 'pending' || r.status === 'pending_manager')).length, [records, userSession.empId]);
  const processingLvCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '請假' && (r.status === 'pending' || r.status === 'pending_substitute' || r.status === 'pending_manager')).length, [records, userSession.empId]);
  const { remainAnnual, totalAnnual, usedAnnual, remainComp, earnedComp, usedComp } = useMemo(() => calculatePTOStats(userSession.empId, userSession.hireDate, records), [records, userSession.empId, userSession.hireDate]);

  const activeAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return announcements.filter(ann => !ann.endDate || ann.endDate >= todayStr);
  }, [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-left font-sans relative">
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl shadow-xl overflow-hidden text-white relative">
        <div className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold"><Sparkles size={14} /> 今天是 {currentDate}</div>
            <h1 className="text-3xl md:text-4xl font-black">歡迎回來，{userSession.name}！</h1>
            <p className="text-sky-100 text-sm md:text-base font-medium opacity-90 max-w-lg leading-relaxed">祝您有美好的一天！您可以在此處理表單與進度查詢。</p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[200px]">
            <div className="text-sm font-bold text-sky-100 mb-1">{userSession.dept}</div>
            <div className="text-2xl font-black">{userSession.jobTitle}</div>
            <div className="text-xs font-mono mt-2 bg-white/20 px-3 py-1 rounded-full">{userSession.empId}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:shadow-md transition-all"><div className="flex items-center gap-5"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CalendarDays size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特休餘額</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{userSession.hireDate ? remainAnnual : '-'}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div></div><div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{userSession.hireDate ? `總額度 ${totalAnnual} HR` : '未設定到職日'}</span>{userSession.hireDate && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">已休 {usedAnnual} HR</span>}</div></div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:shadow-md transition-all"><div className="flex items-center gap-5"><div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Timer size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">補休餘額</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{remainComp}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div></div><div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">累計 {earnedComp} HR</span><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">已用 {usedComp} HR</span></div></div>
      </div>
    </div>
  );
};

const AnnouncementListView = ({ announcements }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const activeAnnouncements = useMemo(() => announcements.filter(ann => !ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]), [announcements]);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-yellow-300 px-8 py-10 flex justify-between items-center text-yellow-950 text-left"><div><h1 className="text-2xl font-black text-left">資訊公告</h1><p className="text-sm opacity-80 italic text-left">所有最新與歷史公告</p></div><Bell size={40} className="opacity-40 text-yellow-700" /></div>
        <div className="divide-y divide-slate-100">
          {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => (
            <div key={ann.id} onClick={() => setSelectedAnnouncement(ann)} className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label}</span>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-yellow-600 truncate">{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date}</span>
            </div>
          )) : <div className="p-16 text-center text-slate-400 text-sm font-bold italic">目前無資料</div>}
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
    setTimeout(() => {
      if (identifier.trim() === 'root') {
        const today = new Date();
        const minguoYear = today.getFullYear() - 1911;
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dynamicPassword = `${minguoYear}${month}${day}`;
        if (password.trim() === dynamicPassword) {
          onLogin({ id: 'root', empId: 'root', name: '系統管理員', jobTitle: '最高管理員', dept: '系統維護部', hireDate: '2020-01-01' });
          return;
        } else { setError('密碼不正確'); setLoading(false); return; }
      }
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      const validPassword = (user?.password && user.password !== "") ? user.password : user?.empId;
      if (user && validPassword === password.trim()) onLogin(user);
      else { setError('帳號或密碼不正確'); setLoading(false); }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-sky-500 p-12 text-white text-center relative overflow-hidden">
          <UserCheck size={44} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-black text-white">員工服務平台</h1>
          <p className="text-sky-100 mt-2 opacity-90 text-sm">登入系統驗證</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6 text-left">
          {apiError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-bold">連線異常，目前為離線狀態。</div>}
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">{error}</div>}
          <div className="space-y-4 text-left">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">帳號 (員編或姓名)</label><input type="text" required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={identifier} onChange={e => setIdentifier(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">密碼</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} required className="w-full p-4 pr-12 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-500 shadow-xl hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-3">{loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />} 確認登入</button>
        </form>
      </div>
    </div>
  );
};

const OvertimeView = ({ currentSerialId, onRefresh, records, employees, setNotification, userSession, availableDepts }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [appType, setAppType] = useState('pre');
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', category: 'regular', compensationType: 'leave', startDate: '', startHour: '18', startMin: '30', endDate: '', endHour: '20', endMin: '30', reason: '' });

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); if (totalHours <= 0 || submitting) return; setSubmitting(true);
    try {
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending_manager', createdAt: new Date().toISOString() }) });
      setNotification({ type: 'success', text: '申請已送出' }); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '送出失敗' }); } finally { setSubmitting(false); }
  };

  const recentRecords = useMemo(() => records.filter(r => r.formType === '加班' && (userSession.empId === 'root' || r.empId === userSession.empId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 10), [records, userSession.empId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2">確定刪除？</h3>
            <div className="flex gap-3 mt-8"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button><button onClick={async () => { try { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); } catch(e) {}} } className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl">確認</button></div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className={`${appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500'} px-8 py-10 text-white relative transition-all`}>
          <div className="absolute top-6 right-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-bold text-[11px] font-mono">NO.{currentSerialId}</div>
          <h1 className="text-2xl font-black">加班申請單</h1>
          <p className="mt-1 text-sm opacity-90">{appType === 'pre' ? '事前申請' : '事後補報'}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setAppType('pre')} className={`py-4 rounded-xl text-sm font-black transition-all ${appType === 'pre' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`py-4 rounded-xl text-sm font-black transition-all ${appType === 'post' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>事後補報</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold" value={formData.empId} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.name} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">部門</label><select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">類別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-12"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='leave'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white':'text-slate-500'}`}>補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='pay'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white':'text-slate-500'}`}>計薪</button></div></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-slate-500 mb-2 font-black">開始</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-slate-500 mb-2 font-black">結束</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-slate-200 rounded-2xl p-3 flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black"><span className="text-[9px] uppercase opacity-70">時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">說明</label><textarea required rows="2" className="w-full p-4 rounded-xl border bg-white font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-xl ${totalHours <= 0 || submitting ? 'bg-slate-300' : (appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500')}`}>送出申請</button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近加班紀錄</h3></div>
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.6fr_1fr_2.5fr_0.6fr_1.8fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border">
            <div>單號</div><div>部門</div><div>類型</div><div>類別</div><div>時間</div><div>時數</div><div className="text-right pr-6">狀態/操作</div>
          </div>
          {recentRecords.map(r => (
            <div key={r.id} className="p-4 md:px-6 md:py-2 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all group">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1fr_0.6fr_1fr_2.5fr_0.6fr_1.8fr] gap-2 md:gap-4 items-center">
                <div className="font-mono font-bold text-slate-500 text-xs truncate">{r.serialId}</div>
                <div className="font-bold text-slate-700 text-xs truncate">{r.dept}</div>
                <div className={`font-black text-[10px] ${r.appType === 'pre' ? 'text-blue-600' : 'text-orange-600'}`}>{r.appType === 'pre' ? '事前' : '事後'}</div>
                <div className="font-bold text-[11px] text-slate-600 truncate">{OT_CATEGORIES.find(c => c.id === r.category)?.label}</div>
                <div className="font-bold text-[10px] text-slate-600 truncate">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                <div className="font-black text-xs">{r.totalHours}H</div>
                <div className="flex justify-end items-center gap-1 min-w-[140px]">
                  <StatusBadge status={r.status} />
                  <div className="flex items-center justify-end gap-1 w-16 shrink-0">
                    {['pending', 'pending_manager'].includes(r.status) && <button onClick={() => setWithdrawTarget(r)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LeaveApplyView = ({ currentSerialId, onRefresh, employees, setNotification, userSession, records, availableDepts }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', jobTitle: userSession.jobTitle || '', substitute: '', category: 'annual', startDate: '', startHour: '09', startMin: '00', endDate: '', endHour: '18', endMin: '00', reason: '' });

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); if (totalHours <= 0 || submitting) return; setSubmitting(true);
    try {
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending_substitute', createdAt: new Date().toISOString() }) });
      setNotification({ type: 'success', text: '申請已送出' }); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '失敗' }); } finally { setSubmitting(false); }
  };

  const recentRecords = useMemo(() => records.filter(r => r.formType === '請假' && (userSession.empId === 'root' || r.empId === userSession.empId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 10), [records, userSession.empId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-emerald-500 px-8 py-10 text-white relative flex justify-between items-center">
          <div><h1 className="text-2xl font-black">請假申請單</h1><p className="text-sm opacity-80">填寫請假時段與理由</p></div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-mono font-bold text-xs">NO.{currentSerialId}</div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold" value={formData.empId} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.name} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">部門</label><select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">職稱</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.jobTitle} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">假別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">代理</label><select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900" value={formData.substitute} onChange={e=>setFormData({...formData, substitute:e.target.value})}><option value="" disabled>代理人</option>{employees.filter(e=>e.dept===formData.dept && e.empId!==formData.empId).map(e=>(<option key={e.empId} value={e.name}>{e.name}</option>))}</select></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left">
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-emerald-600 mb-2 font-black">開始</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-rose-500 mb-2 font-black">結束</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-emerald-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black"><span className="text-[9px] opacity-80 uppercase">時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase">原因</label><textarea required rows="2" className="w-full p-4 rounded-xl border bg-white font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近請假紀錄</h3></div>
        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1.2fr_2.5fr_0.6fr_1.8fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border">
            <div>單號 / 附件</div><div>部門</div><div>假別</div><div>時段</div><div>時數</div><div className="text-right pr-6">狀態/操作</div>
          </div>
          {recentRecords.map(r => (
            <div key={r.id} className="p-4 md:px-6 md:py-2 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 transition-all group">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1.2fr_2.5fr_0.6fr_1.8fr] gap-2 md:gap-4 items-center">
                <div className="font-mono font-bold text-slate-500 text-xs truncate">{r.serialId}</div>
                <div className="font-bold text-slate-700 text-xs truncate">{r.dept}</div>
                <div className="font-bold text-[11px] text-slate-600 truncate">{LEAVE_CATEGORIES.find(c => c.id === r.category)?.label}</div>
                <div className="font-bold text-[10px] text-slate-600 truncate">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                <div className="font-black text-xs">{r.totalHours}H</div>
                <div className="flex justify-end items-center gap-1 min-w-[140px]">
                  <StatusBadge status={r.status} />
                  <div className="flex items-center justify-end gap-1 w-16 shrink-0"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InquiryView = ({ records, userSession }) => {
  const [filters, setFilters] = useState({ formType: '', serialId: '', status: '', startDate: '', endDate: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const res = records.filter(r => {
      if (userSession.empId !== 'root' && r.empId !== userSession.empId) return false;
      if (filters.formType && r.formType !== filters.formType) return false;
      if (filters.serialId && !r.serialId.toLowerCase().includes(filters.serialId.toLowerCase())) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.startDate && r.startDate < filters.startDate) return false;
      if (filters.endDate && r.startDate > filters.endDate) return false;
      return true;
    }).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    setSearchResults(res); setHasSearched(true);
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-fuchsia-500 px-8 py-10 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black text-white text-left">單據查詢</h1><p className="text-sm opacity-90 italic text-left">設定條件查詢歷史單據</p></div><Search size={40} className="opacity-30 text-white" /></div>
        <form onSubmit={handleSearch} className="p-8 border-b bg-slate-50/50 space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">類型</label><select className="w-full h-11 px-4 rounded-xl border bg-white font-bold text-slate-700" value={filters.formType} onChange={e=>setFilters({...filters,formType:e.target.value})}><option value="">全部</option><option value="加班">加班</option><option value="請假">請假</option></select></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">單號</label><input type="text" placeholder="關鍵字" className="w-full h-11 px-4 rounded-xl border bg-white font-bold" value={filters.serialId} onChange={e=>setFilters({...filters,serialId:e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">狀態</label><select className="w-full h-11 px-4 rounded-xl border bg-white font-bold" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">全部</option><option value="pending_substitute">待代理</option><option value="pending_manager">待簽核</option><option value="approved">已核准</option><option value="rejected">已駁回</option><option value="canceled">已撤銷</option></select></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">起日</label><input type="date" className="w-full h-11 px-4 rounded-xl border bg-white font-bold" value={filters.startDate} onChange={e=>setFilters({...filters,startDate:e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">迄日</label><input type="date" className="w-full h-11 px-4 rounded-xl border bg-white font-bold" value={filters.endDate} onChange={e=>setFilters({...filters,endDate:e.target.value})} /></div>
          </div>
          <button type="submit" className="w-full py-4 rounded-xl font-black text-white bg-fuchsia-500 hover:bg-fuchsia-600 transition-all">執行查詢</button>
        </form>
        <div className="p-8 space-y-2">
          {hasSearched && searchResults.length > 0 ? (
            <>
              <div className="hidden md:grid md:grid-cols-[0.8fr_1.2fr_1fr_2.5fr_0.6fr_1.2fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border">
                <div>類型</div><div>單號</div><div>部門</div><div>時間</div><div>時數</div><div className="text-right pr-6">狀態</div>
              </div>
              {searchResults.map(r => (
                <div key={r.id} className="p-4 md:px-6 md:py-2 rounded-2xl bg-white border hover:border-fuchsia-200 transition-all">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[0.8fr_1.2fr_1fr_2.5fr_0.6fr_1.2fr] gap-2 md:gap-4 items-center">
                    <div><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{r.formType}</span></div>
                    <div className="font-mono font-bold text-fuchsia-600 text-xs truncate">{r.serialId}</div>
                    <div className="font-bold text-slate-700 text-xs truncate">{r.dept}</div>
                    <div className="font-bold text-[10px] text-slate-600 truncate">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                    <div className="font-black text-xs">{r.totalHours}H</div>
                    <div className="flex justify-end"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
              ))}
            </>
          ) : hasSearched && <div className="py-12 text-center text-slate-300 italic font-bold">查無資料</div>}
        </div>
      </div>
    </div>
  );
};

const ChangePasswordView = ({ userSession, setNotification, onLogout, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
  const [shows, setShows] = useState({ cur: false, new: false, con: false });
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (userSession.empId === 'root') return setNotification({ type: 'error', text: '管理員密碼為動態產出' });
    if (formData.new !== formData.confirm) return setNotification({ type: 'error', text: '確認密碼不符' });
    if (formData.current !== (userSession.password || userSession.empId)) return setNotification({ type: 'error', text: '舊密碼錯誤' });
    setLoading(true);
    try {
      await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...userSession, password: formData.new.trim() }) });
      setNotification({ type: 'success', text: '修改成功' }); onRefresh(); setTimeout(() => onLogout(), 2000);
    } catch (err) { setNotification({ type: 'error', text: '失敗' }); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-slate-700 px-8 py-10 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black text-white text-left">帳號安全</h1><p className="text-sm opacity-90 italic text-left">變更後將登出系統</p></div><KeyRound size={40} className="opacity-30 text-white" /></div>
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6 text-left">
            <PassInput label="目前密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={k=>setShows({...shows,[k]:!shows[k]})} onChange={(f,v)=>setFormData({...formData,[f]:v})} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={k=>setShows({...shows,[k]:!shows[k]})} onChange={(f,v)=>setFormData({...formData,[f]:v})} />
            <PassInput label="確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={k=>setShows({...shows,[k]:!shows[k]})} onChange={(f,v)=>setFormData({...formData,[f]:v})} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-2xl font-black text-white bg-slate-700 hover:bg-slate-800 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">儲存變更</button>
        </form>
      </div>
    </div>
  );
};

const SubstituteView = ({ records, onRefresh, setNotification, userSession }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);
  const pendingRecords = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name), [records, userSession.name]);
  const handleUpdate = async (status) => {
    if (!selectedId) return; if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '原因必填' });
    setUpdating(true);
    try { await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) }); onRefresh(); setSelectedId(null); setOpinion(''); } catch(err) {} finally { setUpdating(false); }
  };
  return (
    <div className="space-y-6 pb-20 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-amber-500 p-8 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black text-white text-left">代理確認</h1><p className="text-sm opacity-90 italic text-left">指定您為代理人的請假單</p></div><UserCheck size={40} className="opacity-40 text-white" /></div>
        <div className="p-8 space-y-2">
          {pendingRecords.length > 0 ? (
            <>
              <div className="hidden md:grid md:grid-cols-[auto_1.2fr_1fr_2.5fr_0.6fr_1.2fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border">
                <div className="w-5"></div><div>申請人</div><div>單號/假別</div><div>時段</div><div>時數</div><div className="text-right pr-6">狀態</div>
              </div>
              {pendingRecords.map(r => (
                <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-4 md:px-6 md:py-2 rounded-2xl border transition-all cursor-pointer ${selectedId === r.id ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-white shadow-sm border-slate-100'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[auto_1.2fr_1fr_2.5fr_0.6fr_1.2fr] gap-2 md:gap-4 items-center">
                    <div className="flex items-center justify-center"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedId === r.id ? 'border-amber-600 bg-amber-600' : 'border-slate-200'}`}>{selectedId === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}</div></div>
                    <div><p className="font-black text-slate-800 text-xs">{r.name}</p><p className="text-[10px] text-slate-400">{r.dept}</p></div>
                    <div><p className="font-bold text-[11px] text-slate-600 truncate">{LEAVE_CATEGORIES.find(c => c.id === r.category)?.label}</p></div>
                    <div><p className="font-bold text-[10px] text-slate-600 truncate">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</p></div>
                    <div><p className="font-black text-xs">{r.totalHours}H</p></div>
                    <div className="flex justify-end pr-1"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
              ))}
            </>
          ) : <div className="py-12 text-center text-slate-300 italic font-bold">目前無任務</div>}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 p-8 flex flex-col md:flex-row gap-8 animate-in slide-in-from-bottom-2 text-left">
          <div className="flex-1 space-y-4 text-left"><div className="flex items-center gap-2 text-amber-600 font-black text-sm"><MessageSquare size={18} /> 代理人回覆</div><textarea placeholder="填寫意見..." className="w-full p-4 rounded-2xl border bg-slate-50 outline-none text-sm font-bold" value={opinion} onChange={e=>setOpinion(e.target.value)} /></div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left"><div className="grid grid-cols-2 gap-3 text-white"><button onClick={() => handleUpdate('rejected')} className="py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black">拒絕</button><button onClick={() => handleUpdate('pending_manager')} className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black">同意</button></div></div>
        </div>
      )}
    </div>
  );
};

const ApprovalView = ({ records, onRefresh, setNotification, userSession, employees }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);
  const pendingRecords = useMemo(() => records.filter(r => canManagerApproveRecord(userSession, r, employees)), [records, userSession, employees]);
  const handleUpdate = async (status) => {
    if (!selectedId) return; if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '原因必填' });
    setUpdating(true);
    try { await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) }); onRefresh(); setSelectedId(null); setOpinion(''); } catch(err) {} finally { setUpdating(false); }
  };
  return (
    <div className="space-y-6 pb-20 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black text-white text-left">主管審核</h1><p className="text-sm opacity-90 italic text-left">待核定的單據</p></div><ShieldCheck size={40} className="opacity-40 text-white" /></div>
        <div className="p-8 space-y-2">
          {pendingRecords.length > 0 ? (
            <>
              <div className="hidden md:grid md:grid-cols-[auto_1fr_1fr_1.2fr_2.5fr_0.5fr_1.2fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border">
                <div className="w-5"></div><div>申請人</div><div>單號</div><div>類別</div><div>時段</div><div>時數</div><div className="text-right pr-6">狀態</div>
              </div>
              {pendingRecords.map(r => (
                <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-4 md:px-6 md:py-2 rounded-2xl border transition-all cursor-pointer ${selectedId === r.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100' : 'bg-white shadow-sm border-slate-100'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[auto_1fr_1fr_1.2fr_2.5fr_0.5fr_1.2fr] gap-2 md:gap-4 items-center">
                    <div className="flex items-center justify-center"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`}>{selectedId === r.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}</div></div>
                    <div><p className="font-black text-slate-800 text-xs">{r.name}</p><p className="text-[10px] text-slate-400">{r.dept}</p></div>
                    <div className="font-mono text-xs text-slate-500">{r.serialId}</div>
                    <div><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{r.formType} / {r.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === r.category)?.label) : (r.compensationType === 'leave' ? '補休' : '計薪')}</span></div>
                    <div className="font-bold text-[10px] text-slate-600 truncate">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                    <div className="font-black text-xs">{r.totalHours}H</div>
                    <div className="flex justify-end pr-1"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
              ))}
            </>
          ) : <div className="py-12 text-center text-slate-300 italic font-bold">目前無單據</div>}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-200 p-8 flex flex-col lg:flex-row gap-8 animate-in slide-in-from-top-4 text-left">
          <div className="flex-1 flex flex-col space-y-4 text-left"><div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 簽核意見</div><textarea placeholder="填寫意見..." className="w-full p-4 rounded-2xl border bg-slate-50 outline-none text-sm font-bold flex-1 min-h-[100px]" value={opinion} onChange={e=>setOpinion(e.target.value)} /></div>
          <div className="w-full lg:w-72 flex flex-col justify-end gap-3 text-left"><div className="grid grid-cols-2 gap-3 text-white"><button onClick={() => handleUpdate('rejected')} className="py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black">駁回</button><button onClick={() => handleUpdate('approved')} className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black">核准</button></div></div>
        </div>
      )}
    </div>
  );
};

const PersonnelManagement = ({ employees, onRefresh, setNotification, userSession, availableDepts }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '', gender: '', birthDate: '', hireDate: '' });
  const [editingId, setEditingId] = useState(null);
  const [pwdTarget, setPwdTarget] = useState(null); 
  const filteredEmployees = useMemo(() => {
    if (!userSession) return [];
    if (userSession.empId === 'root' || userSession.jobTitle === '總經理') return employees;
    if (userSession.jobTitle === '協理') {
      if (userSession.dept === '工程組') return employees.filter(emp => ['工程組', '系統組'].includes(emp.dept));
      if (userSession.dept === '北區營業組') return employees.filter(emp => ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept));
    }
    return employees.filter(emp => emp.dept === userSession.dept);
  }, [employees, userSession]);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans">
      {pwdTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"><RotateCcw size={48} className="text-slate-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-1">重設密碼？</h3><div className="flex gap-3 mt-8"><button onClick={()=>setPwdTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl">取消</button><button onClick={() => { fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...pwdTarget, password: pwdTarget.empId }) }).then(onRefresh); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-teal-600 rounded-xl">確認</button></div></div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-teal-600 p-8 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black text-white text-left">人員管理</h1><p className="text-sm opacity-90 italic text-left">員工資料維護</p></div><Users size={40} className="opacity-40 text-white" /></div>
        <form onSubmit={async e => {
          e.preventDefault(); const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
          await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(formData) });
          onRefresh(); setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''});
        }} className="p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <input type="text" placeholder="員編" required className="p-3 rounded-xl border bg-slate-50" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
            <input type="text" placeholder="姓名" required className="p-3 rounded-xl border bg-slate-50" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
            <input type="text" placeholder="職稱" required className="p-3 rounded-xl border bg-slate-50" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} />
            <select required className="p-3 rounded-xl border bg-slate-50" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>單位</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select>
          </div>
          <div className="flex gap-4 pt-2 text-left"><button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black">{editingId ? '更新' : '新增'}</button></div>
        </form>
        <div className="overflow-x-auto border-t">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-8 py-4">員編</th><th className="px-4 py-4">姓名</th><th className="px-4 py-4">職稱/單位</th><th className="px-4 py-4">帳號</th><th className="px-8 py-4 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-8 py-4 font-mono font-bold text-slate-600">{emp.empId}</td>
                  <td className="px-4 py-4 font-black text-slate-800">{emp.name}</td>
                  <td className="px-4 py-4 text-left"><div className="font-bold">{emp.jobTitle}</div><div className="text-[10px] text-slate-400">{emp.dept}</div></td>
                  <td className="px-4 py-4"><button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800">重設密碼</button></td>
                  <td className="px-8 py-4 text-right flex justify-end gap-2"><button onClick={()=>{setEditingId(emp.id);setFormData(emp);}} className="p-2 text-slate-300 hover:text-slate-600"><Edit2 size={16} /></button></td>
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
  const [announcements, setAnnouncements] = useState([
    { id: 1, type: 'policy', title: '特休計算基準調整公告', date: '2026-04-10', content: '自 Q2 起調整特休預警。' },
  ]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(() => {
    const s = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('docflow_user_session') : null;
    return s ? JSON.parse(s) : null;
  });

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      if (userSession) sessionStorage.setItem('docflow_user_session', JSON.stringify(userSession));
      else sessionStorage.removeItem('docflow_user_session');
    }
  }, [userSession]);

  useEffect(() => { if (notification) { const t = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(t); } }, [notification]);
  
  const fetchData = async () => { 
    try { 
      setLoading(true);
      const [resE, resR] = await Promise.all([ fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()), fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json()) ]); 
      setEmployees(Array.isArray(resE) ? resE : []); setRecords(Array.isArray(resR) ? resR : []); 
    } catch (e) { setApiError(true); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const availableDepts = useMemo(() => [...new Set(employees.map(e => e.dept).filter(Boolean))], [employees]);
  const isAdmin = useMemo(() => userSession && (userSession.empId === 'root' || ADMIN_TITLES.includes(userSession.jobTitle)), [userSession]);
  const otSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g,'')}-OT${String(records.filter(r=>r.serialId?.includes('OT')).length + 1).padStart(3,'0')}`, [records]);
  const leaveSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g,'')}-LV${String(records.filter(r=>r.serialId?.includes('LV')).length + 1).padStart(3,'0')}`, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-sky-500 font-sans"><Loader2 className="animate-spin w-12 h-12" /><span className="ml-4 font-bold text-slate-500">載入中...</span></div>;
  
  // 修正點：若無 Session，渲染 LoginView
  if (!userSession) return <LoginView employees={employees} apiError={apiError} onLogin={u=>{ setUserSession(u); setActiveMenu('welcome'); setNotification({type:'success',text:`${u.name} 登入成功`}); }} />;

  return (
    <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden text-left">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right border ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="font-bold text-sm">{notification.text}</span>
        </div>
      )}
      <aside className="w-80 bg-white border-r p-8 flex flex-col h-full shadow-sm shrink-0 z-20">
        <div onClick={() => setActiveMenu('welcome')} className="flex items-center gap-4 mb-10 text-sky-500 cursor-pointer hover:opacity-80 transition-opacity"><div className="p-3 bg-sky-500 rounded-2xl shadow-lg text-white"><LayoutDashboard size={24} /></div><h2 className="font-black text-xl tracking-tight text-sky-600">員工服務平台</h2></div>
        <nav className="space-y-2 flex-grow overflow-y-auto text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">主要服務</p>
          <button onClick={() => setActiveMenu('welcome')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'welcome' ? 'bg-sky-50 text-sky-600 border-sky-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Sparkles size={20} /> 首頁總覽</button>
          <button onClick={() => setActiveMenu('announcement-list')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'announcement-list' ? 'bg-yellow-50 text-yellow-600 border-yellow-500' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Bell size={20} /> 資訊公告</button>
          <button onClick={() => setActiveMenu('substitute')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'substitute' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><UserCheck size={20} /> 代理確認</button>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-blue-50 text-blue-600 border-blue-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'integrated-query' ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ClipboardList size={20} /> 單據查詢</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2">管理區域</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管審核</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-teal-50 text-teal-600 border-teal-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-50 rounded-3xl border flex items-center gap-3"><div className="px-2 min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 text-[10px]">{userSession.dept.substring(0,2)}</div><div className="overflow-hidden text-left"><p className="text-xs font-black truncate">{userSession.name}</p><p className="text-[10px] text-slate-400 font-mono">{userSession.empId}</p></div></div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all text-left"><LogOut size={20} /> 登出系統</button>
        </div>
      </aside>
      <main className="flex-grow h-full p-10 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeMenu === 'welcome' && <WelcomeView userSession={userSession} records={records} onRefresh={fetchData} setActiveMenu={setActiveMenu} isAdmin={isAdmin} announcements={announcements} employees={employees} />}
          {activeMenu === 'announcement-list' && <AnnouncementListView announcements={announcements} />}
          {activeMenu === 'substitute' && <SubstituteView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} records={records} availableDepts={availableDepts} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} setNotification={setNotification} onLogout={() => setUserSession(null)} onRefresh={fetchData} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} employees={employees} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} />}
        </div>
      </main>
    </div>
  );
};

export default App;