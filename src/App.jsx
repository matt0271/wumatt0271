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

// --- Helper Functions ---
const getNextAnniversary = (hireDateStr) => {
  if (!hireDateStr) return null;
  const hireDate = new Date(hireDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  let nextAnniv = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
  if (nextAnniv < today) nextAnniv.setFullYear(today.getFullYear() + 1);
  return nextAnniv;
};

const getDaysDiff = (date1, date2) => Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

const getProjectedPTO = (hireDateStr, nextAnniversaryDate) => {
  if (!hireDateStr || !nextAnniversaryDate) return 0;
  const hireDate = new Date(hireDateStr);
  const years = nextAnniversaryDate.getFullYear() - hireDate.getFullYear();
  let days = years >= 10 ? Math.min(30, 15 + (years - 9)) : (years >= 5 ? 15 : (years >= 3 ? 14 : (years >= 2 ? 10 : (years >= 1 ? 7 : 0))));
  return days * 8; 
};

const calculatePTOStats = (empId, hireDateStr, records) => {
  let usedAnn = 0, earnedCmp = 0, usedCmp = 0;
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
      let days = years >= 10 ? Math.min(30, 15 + (years - 9)) : (years >= 5 ? 15 : (years >= 3 ? 14 : (years >= 2 ? 10 : (years >= 1 ? 7 : 0))));
      if (days === 0) {
        const sixM = new Date(hireDate); sixM.setMonth(sixM.getMonth() + 6);
        if (today >= sixM) days = 3;
      }
      totalAnnualHours = days * 8; 
    }
  }
  return { remainAnnual: Math.max(0, totalAnnualHours - usedAnn), totalAnnual: totalAnnualHours, usedAnnual: usedAnn, remainComp: Math.max(0, earnedCmp - usedCmp), earnedComp: earnedCmp, usedComp: usedCmp };
};

const canManagerApproveRecord = (userSession, r, employees) => {
  if (r.status !== 'pending_manager' && r.status !== 'pending') return false;
  if (!userSession) return false;
  if (userSession.empId === 'root') return true;
  const applicant = employees.find(emp => emp.empId === r.empId);
  if (r.formType === '請假') {
    const days = (parseFloat(r.totalHours) || 0) / 8;
    const isApplicantManager = ["協理", "經理", "副理"].includes(applicant?.jobTitle);
    let targetLevel = (isApplicantManager && days >= 1) || days > 5 ? '總經理' : (days > 3 ? '協理' : '經副理');
    if (targetLevel === '總經理') return userSession.jobTitle === '總經理';
    if (targetLevel === '協理') {
      if (userSession.jobTitle !== '協理') return false;
      if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(r.dept);
      if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(r.dept);
      return r.dept === userSession.dept;
    }
    return ["經理", "副理"].includes(userSession.jobTitle) && r.dept === userSession.dept;
  }
  return r.dept === userSession.dept || userSession.jobTitle === '總經理' || userSession.jobTitle === '協理';
};

// --- UI Helper Components ---

const StatusBadge = ({ status }) => {
  const labels = { approved: "已核准", rejected: "已駁回", pending_substitute: "待代理", pending_manager: "待簽核", pending: "待簽核", canceled: "已撤銷" };
  const currentLabel = labels[status] || labels.pending;
  const finalized = ['approved', 'rejected', 'canceled'].includes(status);
  if (finalized) {
    const stampConfig = {
      approved: { color: "border-emerald-600 text-emerald-900", icon: <Check size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 opacity-40" /> },
      rejected: { color: "border-rose-600 text-rose-900", icon: <X size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-400 opacity-40" /> },
      canceled: { color: "border-slate-500 text-slate-900", icon: <RotateCcw size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 opacity-40" /> }
    };
    const cfg = stampConfig[status];
    return (
      <div className="w-[72px] h-[40px] flex items-center justify-center shrink-0">
        <div className={`relative w-[36px] h-[36px] flex flex-col items-center justify-center border-[2px] rounded-full font-black text-[8px] leading-none bg-white/60 outline outline-1 outline-offset-2 ${cfg.color} shadow-sm overflow-hidden`}>
          {cfg.icon}<span className="relative z-10">{currentLabel.substring(0, 1)}</span><span className="relative z-10">{currentLabel.substring(1)}</span>
        </div>
      </div>
    );
  }
  const styles = { pending_substitute: "bg-amber-50 text-amber-700 border-amber-200", pending_manager: "bg-indigo-50 text-indigo-700 border-indigo-200", pending: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  return (
    <div className="w-[72px] h-[40px] flex items-center justify-center shrink-0">
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles[status] || styles.pending} whitespace-nowrap shadow-sm`}>{currentLabel}</span>
    </div>
  );
};

// --- View Components ---

const WelcomeView = ({ userSession, records, setActiveMenu, isAdmin, announcements, employees }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const currentDate = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  
  const substituteCount = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name).length, [records, userSession.name]);
  const managerCount = useMemo(() => isAdmin ? records.filter(r => canManagerApproveRecord(userSession, r, employees)).length : 0, [records, userSession, isAdmin, employees]);
  const processingOtCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '加班' && (r.status === 'pending' || r.status === 'pending_manager')).length, [records, userSession.empId]);
  const processingLvCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '請假' && (r.status === 'pending' || r.status === 'pending_substitute' || r.status === 'pending_manager')).length, [records, userSession.empId]);
  
  const { remainAnnual, totalAnnual, usedAnnual, remainComp, earnedComp, usedComp } = useMemo(() => calculatePTOStats(userSession.empId, userSession.hireDate, records), [records, userSession.empId, userSession.hireDate]);

  const activeAnnouncements = useMemo(() => announcements.filter(ann => !ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]), [announcements]);

  const userWarningStatus = useMemo(() => {
    if (!userSession.hireDate) return null;
    const nextAnniv = getNextAnniversary(userSession.hireDate);
    if (!nextAnniv) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const dLeft = getDaysDiff(today, nextAnniv);
    const pPTO = getProjectedPTO(userSession.hireDate, nextAnniv);
    const pTotal = remainAnnual + pPTO;
    if (pTotal > 240 && dLeft <= 90 && dLeft > 0) return { dLeft, pTotal, overH: pTotal - 240, nAnniv: nextAnniv.toISOString().split('T')[0] };
    return null;
  }, [userSession.hireDate, remainAnnual]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-left font-sans relative">
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b shrink-0 text-left">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}</span>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date} 發布</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto text-left">
              <h2 className="text-2xl font-black text-slate-800 mb-6">{selectedAnnouncement.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedAnnouncement.content || '目前無詳細內容。'}</div>
            </div>
          </div>
        </div>
      )}

      {userWarningStatus && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-sm flex items-start gap-4">
          <AlertTriangle className="text-rose-600 animate-pulse mt-0.5" size={28} />
          <div>
            <h3 className="text-rose-800 font-black text-lg text-left">特休超標預警 <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">倒數 {userWarningStatus.dLeft} 天</span></h3>
            <p className="text-rose-700 mt-1.5 text-sm text-left">週年日 ({userWarningStatus.nAnniv}) 屆時特休將達 {userWarningStatus.pTotal}H，超過之 {userWarningStatus.overH}H 將自動歸零。</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl shadow-xl overflow-hidden text-white relative">
        <div className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-left text-white">
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white"><Sparkles size={14} /> 今天是 {currentDate}</div>
            <h1 className="text-3xl md:text-4xl font-black text-white">歡迎回來，{userSession.name}！</h1>
            <p className="text-sky-100 text-sm md:text-base font-medium opacity-90 max-w-lg leading-relaxed text-white">這裡是您的專屬員工服務中心。祝您有美好的一天！</p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[200px]">
            <div className="text-sm font-bold text-sky-100 mb-1">{userSession.dept}</div>
            <div className="text-2xl font-black text-white">{userSession.jobTitle}</div>
            <div className="text-xs font-mono mt-2 bg-white/20 px-3 py-1 rounded-full text-white">{userSession.empId}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><Bell size={20} className="text-rose-500" /><h2 className="text-sm font-black uppercase tracking-widest text-slate-800 text-left">最新公告</h2></div>
          <button onClick={() => setActiveMenu('announcement-list')} className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 transition-colors">查看全部 <ArrowRight size={12} /></button>
        </div>
        <div className="divide-y divide-slate-100">
          {activeAnnouncements.slice(0, 5).map(ann => {
            const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
            return (
              <div key={ann.id} onClick={() => setSelectedAnnouncement(ann)} className="p-4 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group text-left">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>{typeInfo.label}</span>
                <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-sky-600 transition-colors truncate text-left">{ann.title}</p>
                <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date}</span>
              </div>
            );
          })}
          {activeAnnouncements.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold italic">目前無最新公告</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-5 text-left"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CalendarDays size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">特休餘額</p><div className="flex items-baseline gap-1 text-left"><span className="text-3xl font-black text-slate-800">{userSession.hireDate ? remainAnnual : '-'}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div></div>
          <div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{userSession.hireDate ? `總額度 ${totalAnnual} HR` : '未設定到職日'}</span>{userSession.hireDate && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">已休 ${usedAnnual} HR</span>}</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-5 text-left"><div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Timer size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">補休餘額</p><div className="flex items-baseline gap-1 text-left"><span className="text-3xl font-black text-slate-800">{remainComp}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div></div>
          <div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">累計 ${earnedComp} HR</span><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">已用 ${usedComp} HR</span></div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-6 text-left`}>
        <div onClick={() => setActiveMenu('substitute')} className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:border-amber-300 transition-all cursor-pointer group text-left">
          <div className="flex items-center gap-5 text-left"><div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><UserCheck size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">待代理確認</p><div className="flex items-baseline gap-1 text-left"><span className="text-3xl font-black text-slate-800 text-left">{substituteCount}</span><span className="text-sm font-bold text-slate-500 text-left">件</span></div></div></div>
          <ArrowRight className="text-slate-200 group-hover:text-amber-500 transition-colors" size={24}/>
        </div>
        {isAdmin && (
          <div onClick={() => setActiveMenu('approval')} className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center justify-between hover:border-indigo-300 transition-all cursor-pointer group text-left">
            <div className="flex items-center gap-5 text-left"><div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl"><ShieldCheck size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">待簽核單據</p><div className="flex items-baseline gap-1 text-left"><span className="text-3xl font-black text-slate-800 text-left">{managerCount}</span><span className="text-sm font-bold text-slate-500 text-left">件</span></div></div></div>
            <ArrowRight className="text-slate-200 group-hover:text-indigo-500 transition-colors" size={24}/>
          </div>
        )}
        <div className={`bg-white p-6 md:p-8 rounded-3xl border shadow-sm flex items-center gap-6 ${!isAdmin ? 'md:col-span-1' : ''} text-left`}>
          <div className="flex flex-col items-center justify-center gap-2 border-r pr-6 border-slate-100 text-left"><div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><FileText size={24} /></div><p className="text-[10px] font-black text-slate-400 uppercase text-center">進度</p></div>
          <div className="flex flex-col gap-2 flex-1 text-left">
            <div onClick={() => setActiveMenu('overtime')} className="flex justify-between items-center hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer text-left"><span className="text-xs font-bold text-slate-500 text-left">加班處理中</span><span className="text-lg font-black text-blue-600 text-left">{processingOtCount}</span></div>
            <div onClick={() => setActiveMenu('leave-apply')} className="flex justify-between items-center hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer text-left"><span className="text-xs font-bold text-slate-500 text-left">請假處理中</span><span className="text-lg font-black text-emerald-600 text-left">{processingLvCount}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnnouncementListView = ({ announcements }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const activeAnnouncements = useMemo(() => announcements.filter(ann => !ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]), [announcements]);
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-800">
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 text-left">
            <div className="flex items-center justify-between p-6 border-b shrink-0 text-left text-slate-800"><div className="flex items-center gap-3"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}</span><span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date}</span></div><button onClick={() => setSelectedAnnouncement(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button></div>
            <div className="p-8 overflow-y-auto text-left text-slate-800"><h2 className="text-2xl font-black text-slate-800 mb-6 text-left">{selectedAnnouncement.title}</h2><div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-left">{selectedAnnouncement.content}</div></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left text-slate-800">
        <div className="bg-yellow-300 px-8 py-10 flex justify-between items-center text-yellow-950 text-left text-yellow-950"><div><h1 className="text-2xl font-black text-left text-yellow-950">資訊公告</h1><p className="text-sm opacity-80 italic text-left text-yellow-900">所有最新與歷史公告</p></div><Bell size={40} className="opacity-40 text-yellow-700" /></div>
        <div className="divide-y divide-slate-100 text-left">
          {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => (
            <div key={ann.id} onClick={() => setSelectedAnnouncement(ann)} className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group text-left text-slate-800">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label}</span>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-yellow-600 truncate text-left text-slate-700">{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 text-slate-400">{ann.date}</span>
            </div>
          )) : <div className="p-16 text-center text-slate-400 text-sm font-bold italic text-left">目前無資料</div>}
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
    e.preventDefault(); setLoading(true); setError('');
    setTimeout(() => {
      if (identifier.trim() === 'root') {
        const today = new Date(); const dynPass = `${today.getFullYear()-1911}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
        if (password.trim() === dynPass) { onLogin({ id: 'root', empId: 'root', name: '系統管理員', jobTitle: '最高管理員', dept: '系統維護部', hireDate: '2020-01-01' }); return; }
        else { setError('密碼錯誤'); setLoading(false); return; }
      }
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      const validPass = (user?.password && user.password !== "") ? user.password : user?.empId;
      if (user && validPass === password.trim()) onLogin(user);
      else { setError('帳號或密碼不正確'); setLoading(false); }
    }, 800);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95">
        <div className="bg-sky-500 p-12 text-white text-center relative overflow-hidden text-white"><UserCheck size={44} className="mx-auto mb-4 opacity-90 text-white" /><h1 className="text-3xl font-black text-white text-center">員工服務平台</h1><p className="text-sky-100 mt-2 opacity-90 text-sm text-center">登入系統驗證</p></div>
        <form onSubmit={handleLogin} className="p-10 space-y-6 text-left">
          {apiError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-bold text-left">連線異常，目前為離線狀態。</div>}
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-in fade-in text-left">{error}</div>}
          <div className="space-y-4 text-left">
            <div className="space-y-1 text-left text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-left text-slate-400">帳號 (員編或姓名)</label><input type="text" required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500 text-left text-slate-900" value={identifier} onChange={e => setIdentifier(e.target.value)} /></div>
            <div className="space-y-1 text-left text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-left text-slate-400">密碼</label>
              <div className="relative text-left"><input type={showPassword ? 'text' : 'password'} required className="w-full p-4 pr-12 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500 text-left text-slate-900" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-500 shadow-xl hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center gap-3 text-white">{loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />} 確認登入</button>
        </form>
      </div>
    </div>
  );
};

const OvertimeView = ({ currentSerialId, onRefresh, records, employees, setNotification, userSession, availableDepts }) => {
  const [submitting, setSubmitting] = useState(false);
  const [appType, setAppType] = useState('pre');
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', category: 'regular', compensationType: 'leave', startDate: '', startHour: '18', startMin: '30', endDate: '', endHour: '20', endMin: '30', reason: '' });
  
  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    return (isNaN(start.getTime()) || end <= start) ? 0 : Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); if (totalHours <= 0 || submitting) return; setSubmitting(true);
    try { await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', totalHours, status: 'pending_manager', createdAt: new Date().toISOString() }) }); setNotification({ type: 'success', text: '申請已送出' }); onRefresh(); }
    catch (e) { setNotification({ type: 'error', text: '失敗' }); } finally { setSubmitting(false); }
  };
  const recent = useMemo(() => records.filter(r => r.formType === '加班' && (userSession.empId === 'root' || r.empId === userSession.empId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 10), [records, userSession.empId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-slate-800 text-center text-slate-800 text-center"><AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-2 text-slate-800 text-center text-slate-800">確定刪除？</h3><div className="flex gap-3 mt-8 text-center text-slate-800 text-center"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-800 text-center text-slate-800">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white text-center text-white text-white">確認刪除</button></div></div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-slate-800 text-center text-slate-800 text-center text-slate-800"><Undo2 size={48} className="text-indigo-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-2 text-slate-800 text-center text-slate-800 text-center">確定撤銷？</h3><div className="flex gap-3 mt-8 text-center text-slate-800 text-center text-slate-800"><button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-800 text-center text-slate-800">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行撤銷' }) }); setCancelTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-indigo-600 rounded-xl text-white text-center text-white text-white text-white">確認撤銷</button></div></div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left text-slate-800">
        <div className="bg-blue-500 px-8 py-10 text-white relative flex justify-between items-center text-left text-white text-white text-white"><h1 className="text-2xl font-black text-left text-white text-white text-white">加班申請單</h1><div className="font-mono text-xs opacity-80 text-white text-white text-white text-white">NO.{currentSerialId}</div></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left text-slate-900 text-slate-900">
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl text-left text-slate-900">
            <button type="button" onClick={() => setAppType('pre')} className={`py-4 rounded-xl text-sm font-black transition-all ${appType === 'pre' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`py-4 rounded-xl text-sm font-black transition-all ${appType === 'post' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>事後補報</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-left text-slate-900 text-slate-900">
            <div className="space-y-1.5 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border font-mono font-bold text-left text-slate-900" value={formData.empId} readOnly /></div>
            <div className="space-y-1.5 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900" value={formData.name} readOnly /></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">部門</label><select required className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">類別</label><select className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-12 text-left text-slate-900"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='leave'?'bg-blue-500 text-white':'text-slate-500'}`}>補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black ${formData.compensationType==='pay'?'bg-blue-500 text-white':'text-slate-500'}`}>計薪</button></div></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left text-slate-900 text-slate-900">
            <div className="lg:col-span-5 text-left text-slate-900"><label className="text-xs font-bold text-slate-500 mb-2 font-black text-left text-slate-500">開始</label><div className="flex gap-2 text-left text-slate-900"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold text-left text-slate-900" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left text-slate-900"><label className="text-xs font-bold text-slate-500 mb-2 font-black text-left text-slate-500">結束</label><div className="flex gap-2 text-left text-slate-900"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold text-left text-slate-900" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-slate-200 rounded-2xl p-3 flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black text-left text-slate-900"><span className="text-[9px] uppercase opacity-70 text-left text-slate-500">時數</span><div className="flex items-baseline gap-1 font-black text-left text-slate-800"><span className="text-xl text-left text-slate-800">{totalHours || "0"}</span><span className="text-[9px] text-slate-500 text-left">HR</span></div></div>
          </div>
          <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400">原因說明</label><textarea required rows="2" className="w-full p-4 rounded-xl border bg-white font-bold text-left text-slate-900" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          <button disabled={totalHours <= 0 || submitting} type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-xl text-white text-white ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-blue-500 hover:bg-blue-600'}`}>{submitting ? '提交中...' : '送出申請'}</button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-8 shadow-sm text-left text-slate-800">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800"><History size={24} className="text-slate-400" /><h3 className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">最近加班紀錄</h3></div>
        <div className="space-y-2 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.6fr_1fr_2.5fr_0.6fr_2.2fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">
            <div>單號</div><div>部門</div><div>類型</div><div>類別</div><div>時間</div><div>時數</div><div className="text-right pr-6 text-slate-400 text-slate-400 text-slate-400 text-slate-400">狀態/操作</div>
          </div>
          {recent.map(r => (
            <div key={r.id} className="p-4 md:px-6 md:py-2 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all group text-left text-slate-800 text-slate-800 text-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1fr_0.6fr_1fr_2.5fr_0.6fr_2.2fr] gap-2 md:gap-4 items-center text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                <div className="font-mono font-bold text-slate-500 text-xs truncate text-left text-slate-500 text-slate-500 text-slate-500">{r.serialId}</div>
                <div className="font-bold text-slate-700 text-xs truncate text-left text-slate-700 text-slate-700 text-slate-700">{r.dept}</div>
                <div className={`font-black text-[10px] ${r.appType === 'pre' ? 'text-blue-600' : 'text-orange-600'} text-left text-slate-800 text-slate-800 text-slate-800`}>加班</div>
                <div className="font-bold text-[11px] text-slate-600 truncate text-left text-slate-600 text-slate-600 text-slate-600">{OT_CATEGORIES.find(c => c.id === r.category)?.label}</div>
                <div className="font-bold text-[10px] text-slate-600 truncate text-left text-slate-600 text-slate-600 text-slate-600 whitespace-nowrap">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                <div className="font-black text-xs text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">{r.totalHours}H</div>
                <div className="flex justify-end items-center gap-1 min-w-[160px] text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                  <StatusBadge status={r.status} />
                  <div className="flex items-center justify-end gap-1 w-24 shrink-0 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                    {['pending', 'pending_manager'].includes(r.status) && <button onClick={() => setWithdrawTarget(r)} className="px-2 py-1 flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition-all text-rose-600 text-rose-600 text-rose-600">刪除</button>}
                    {r.status === 'approved' && <button onClick={() => setCancelTarget(r)} className="px-2 py-1 flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-50 hover:bg-slate-700 hover:text-white rounded transition-all text-slate-600 text-slate-600 text-slate-600">抽單</button>}
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
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', jobTitle: userSession.jobTitle || '', substitute: '', category: 'annual', startDate: '', startHour: '09', startMin: '00', endDate: '', endHour: '18', endMin: '00', reason: '', attachmentName: '', attachmentData: null });
  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    let totalMs = 0; let curr = new Date(start); curr.setHours(0,0,0,0);
    const holidays = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-10-10'];
    while (curr <= end) {
      const dStr = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
      if (curr.getDay() !== 0 && curr.getDay() !== 6 && !holidays.includes(dStr)) {
        const wS = new Date(curr).setHours(9,0,0,0), wE = new Date(curr).setHours(18,0,0,0);
        const oS = Math.max(start.getTime(), wS), oE = Math.min(end.getTime(), wE);
        if (oE > oS) {
          let daily = oE - oS;
          const lS = new Date(curr).setHours(12,30,0,0), lE = new Date(curr).setHours(13,30,0,0);
          const loS = Math.max(oS, lS), loE = Math.min(oE, lE);
          if (loE > loS) daily -= (loE - loS);
          totalMs += daily;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
    return Math.max(0, Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10);
  }, [formData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setNotification({ type: 'error', text: '限制 5MB' }); return; }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(p => ({ ...p, attachmentName: file.name, attachmentData: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (totalHours <= 0 || submitting) return; setSubmitting(true);
    try {
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending_substitute', createdAt: new Date().toISOString() }) });
      setNotification({ type: 'success', text: '申請已送出' }); onRefresh(); setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '', attachmentName: '', attachmentData: null }));
    } catch (e) { setNotification({ type: 'error', text: '失敗' }); } finally { setSubmitting(false); }
  };
  const recent = useMemo(() => records.filter(r => r.formType === '請假' && (userSession.empId === 'root' || r.empId === userSession.empId)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 10), [records, userSession.empId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900 font-sans text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center text-slate-800"><AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-2 text-slate-800 text-center text-slate-800 text-center text-slate-800">確定刪除？</h3><div className="flex gap-3 mt-8 text-center text-slate-800 text-center text-slate-800 text-center"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-800 text-center text-slate-800 text-center">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); setWithdrawTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white text-center text-white text-white text-white text-white text-white">確認刪除</button></div></div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center text-slate-800"><Undo2 size={48} className="text-emerald-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-2 text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center">確定銷假？</h3><div className="flex gap-3 mt-8 text-center text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center text-slate-800"><button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center">取消</button><button onClick={async () => { await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行銷假' }) }); setCancelTarget(null); onRefresh(); }} className="flex-1 py-3 font-black text-white bg-emerald-600 rounded-xl text-white text-center text-white text-white text-white text-white text-white text-white text-white text-white">確認銷假</button></div></div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
        <div className="bg-emerald-500 px-8 py-10 text-white relative flex justify-between items-center text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white"><h1 className="text-2xl font-black text-white text-left text-white text-white text-white text-white text-white text-white text-white">請假申請單</h1><div className="font-mono text-xs opacity-80 text-white text-white text-white text-white text-white text-white">NO.{currentSerialId}</div></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900">
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border font-mono font-bold text-left text-slate-900 text-slate-900" value={formData.empId} readOnly /></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900" value={formData.name} readOnly /></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400">部門</label><select required className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400">職稱</label><input type="text" className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900" value={formData.jobTitle} readOnly /></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400">假別</label><select className="w-full h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">代理</label><select required className="w-full h-12 px-4 rounded-xl border text-left text-slate-900 text-slate-900" value={formData.substitute} onChange={e=>setFormData({...formData, substitute:e.target.value})}><option value="" disabled>代理人</option>{employees.filter(e=>e.dept===formData.dept && e.empId!==formData.empId).map(e=>(<option key={e.empId} value={e.name}>{e.name}</option>))}</select></div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900">
            <div className="lg:col-span-5 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-xs font-bold text-emerald-600 mb-2 font-black text-left text-emerald-600 text-emerald-600 text-emerald-600 text-emerald-600 text-emerald-600 text-emerald-600">開始</label><div className="flex gap-2 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-xs font-bold text-rose-500 mb-2 font-black text-left text-rose-500 text-rose-500 text-rose-500 text-rose-500 text-rose-500 text-rose-500">結束</label><div className="flex gap-2 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-20 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-emerald-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white"><span className="text-[9px] opacity-80 uppercase text-left text-white text-white text-white text-white text-white text-white text-white">時數</span><div className="flex items-baseline gap-1 font-black text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white"><span className="text-xl text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white">{totalHours || "0"}</span><span className="text-[9px] text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white">HR</span></div></div>
          </div>
          <div className="space-y-4 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900">
            <div className="space-y-1 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">原因</label><textarea required rows="2" className="w-full p-4 rounded-xl border font-bold text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
            <div className="space-y-1 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900 text-slate-900">
              <label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">證明文件</label>
              <div onClick={() => fileInputRef.current?.click()} className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${formData.attachmentName ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500'}`}>
                <UploadCloud size={24} className="text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400" /><span className="text-xs font-bold text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">{formData.attachmentName || '點擊上傳檔案 (5MB內)'}</span>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
              </div>
            </div>
          </div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-8 shadow-sm text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><History size={24} className="text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400" /><h3 className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">最近請假紀錄</h3></div>
        <div className="space-y-2 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1.2fr_2.5fr_0.6fr_2.2fr] gap-4 px-6 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">
            <div>單號 / 附件</div><div>部門</div><div>假別</div><div>時段</div><div>時數</div><div className="text-right pr-6 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">狀態/操作</div>
          </div>
          {recent.map(r => (
            <div key={r.id} className="p-4 md:px-6 md:py-2 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 transition-all group text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1.2fr_2.5fr_0.6fr_2.2fr] gap-2 md:gap-4 items-center text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                <div className="flex flex-col text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><div className="font-mono font-bold text-slate-500 text-xs truncate text-left text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500 text-slate-500">{r.serialId}</div>{r.attachmentName && <a href={r.attachmentData} download={r.attachmentName} className="text-[9px] text-sky-600 font-bold flex items-center gap-1 text-left text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600"><Paperclip size={10} />附件</a>}</div>
                <div className="font-bold text-slate-700 text-xs truncate text-left text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700 text-slate-700">{r.dept}</div>
                <div className="font-bold text-[11px] text-slate-600 truncate text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600">{LEAVE_CATEGORIES.find(c => c.id === r.category)?.label}</div>
                <div className="font-bold text-[10px] text-slate-600 truncate text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 whitespace-nowrap">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate}~${r.endDate}`}</div>
                <div className="font-black text-xs text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">{r.totalHours}H</div>
                <div className="flex justify-end items-center gap-1 min-w-[160px] text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                  <StatusBadge status={r.status} />
                  <div className="flex items-center justify-end gap-1 w-24 shrink-0 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                    {['pending', 'pending_substitute', 'pending_manager'].includes(r.status) && <button onClick={() => setWithdrawTarget(r)} className="px-2 py-1 flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition-all text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600 text-rose-600">刪除</button>}
                    {r.status === 'approved' && <button onClick={() => setCancelTarget(r)} className="px-2 py-1 flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-50 hover:bg-slate-700 hover:text-white rounded transition-all text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600">銷假</button>}
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

const AnnouncementManagement = ({ announcements, setAnnouncements, setNotification }) => {
  const [formData, setFormData] = useState({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });
  const [editingId, setEditingId] = useState(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) { setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...formData, id: editingId } : a)); setNotification({ type: 'success', text: '更新成功' }); } 
    else { setAnnouncements(prev => [{ ...formData, id: Date.now() }, ...prev]); setNotification({ type: 'success', text: '新增成功' }); }
    setFormData({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' }); setEditingId(null);
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-800 text-slate-800 text-slate-800">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left text-slate-800 text-slate-800 text-slate-800">
        <div className="bg-rose-500 p-8 text-white flex justify-between items-center text-left text-white text-white text-white text-white text-white"><div><h1 className="text-2xl font-black text-white text-left text-white text-white text-white text-white text-white text-white text-white">公告維護中心</h1><p className="text-sm opacity-90 italic text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white">發布與管理首頁資訊</p></div><Megaphone size={40} className="opacity-40 text-white text-white text-white text-white text-white text-white text-white text-white" /></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left border-b bg-slate-50/30 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
            <div className="md:col-span-2 space-y-1.5 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400">公告標題</label><input type="text" required className="w-full p-3 rounded-xl border font-bold text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} /></div>
            <div className="space-y-1.5 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">類型</label><select className="w-full h-[46px] px-3 rounded-xl border font-bold text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.type} onChange={e=>setFormData({...formData, type:e.target.value})}>{ANNOUNCEMENT_TYPES.map(t=>(<option key={t.id} value={t.id}>{t.label}</option>))}</select></div>
            <div className="space-y-1.5 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">發布日期</label><input type="date" required className="w-full p-3 rounded-xl border font-bold text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} /></div>
            <div className="space-y-1.5 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">下架日期</label><input type="date" className="w-full p-3 rounded-xl border font-bold text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /></div>
            <button type="submit" className="h-[46px] px-6 py-3 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-md text-white text-white text-white text-white text-white text-white text-white text-white">{editingId ? '更新' : '發布'}</button>
          </div>
          <div className="flex items-center gap-4 text-left">
            <label className="flex items-center gap-2 cursor-pointer text-left"><input type="checkbox" className="w-4 h-4 rounded text-rose-500" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew:e.target.checked})} /><span className="text-xs font-bold text-slate-600 text-left">標示為 <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black uppercase">New</span> 新訊</span></label>
          </div>
          <textarea placeholder="詳細內容..." rows="3" className="w-full p-4 rounded-xl border font-bold text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.content} onChange={e=>setFormData({...formData, content:e.target.value})} />
        </form>
        <div className="p-8 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <div className="divide-y text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
            {announcements.map(ann => (
              <div key={ann.id} className="py-4 flex items-center justify-between group text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                <div className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800"><span className="text-xs font-black text-slate-400 mr-4 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400">{ann.date}</span><span className="font-bold text-slate-700 text-left text-slate-700 text-slate-700 text-slate-700">{ann.title}</span></div>
                <div className="flex gap-2 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><button onClick={()=>setFormData(ann)} className="p-2 text-slate-300 hover:text-slate-600 text-left text-slate-300 text-slate-300 text-slate-300"><Edit2 size={16}/></button><button onClick={()=>setAnnouncements(prev=>prev.filter(a=>a.id!==ann.id))} className="p-2 text-slate-300 hover:text-rose-600 text-left text-slate-300 text-slate-300 text-slate-300"><Trash2 size={16}/></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonnelManagement = ({ employees, onRefresh, setNotification, userSession, availableDepts }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '', gender: '', birthDate: '', hireDate: '' });
  const [editingId, setEditingId] = useState(null);
  const [pwdTarget, setPwdTarget] = useState(null); 
  const [isCustomDept, setIsCustomDept] = useState(false);
  
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.async = true; document.head.appendChild(script);
    }
  }, []);

  const handleExport = () => {
    if (!window.XLSX) return;
    const ws = window.XLSX.utils.json_to_sheet(employees.map(e => ({ "姓名": e.name, "員編": e.empId, "部門": e.dept, "職稱": e.jobTitle, "到職日": e.hireDate || '' })));
    const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Employees");
    window.XLSX.writeFile(wb, "員工名單.xlsx");
  };

  const filtered = useMemo(() => {
    if (!userSession) return [];
    if (userSession.empId === 'root' || userSession.jobTitle === '總經理') return employees;
    if (userSession.jobTitle === '協理') {
      if (userSession.dept === '工程組') return employees.filter(emp => ['工程組', '系統組'].includes(emp.dept));
      if (userSession.dept === '北區營業組') return employees.filter(emp => ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept));
    }
    return employees.filter(e => e.dept === userSession.dept);
  }, [employees, userSession]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
      {pwdTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl text-slate-800 text-center text-slate-800 text-center text-slate-800 text-center text-slate-800"><RotateCcw size={48} className="text-slate-500 mx-auto mb-4" /><h3 className="text-xl font-black mb-1 text-slate-800 text-center text-slate-800 text-center">重設密碼？</h3><div className="flex gap-3 mt-8 text-center text-slate-800 text-center text-slate-800 text-center"><button onClick={()=>setPwdTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-800 text-center text-slate-800 text-center text-slate-800">取消</button><button onClick={() => { fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ ...pwdTarget, password: pwdTarget.empId }) }).then(onRefresh); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-teal-600 rounded-xl text-white text-center text-white text-white text-white text-white text-white text-white">確認</button></div></div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
        <div className="bg-teal-600 p-8 text-white flex justify-between items-center text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white"><div><h1 className="text-2xl font-black text-white text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white">人員管理中心</h1><p className="text-sm opacity-90 italic text-left text-white text-white text-white text-white text-white text-white text-white text-white text-white">維護員工資料</p></div><Users size={40} className="opacity-40 text-white text-white text-white text-white text-white text-white text-white text-white text-white" /></div>
        <div className="px-8 pt-6 flex gap-3 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 transition-colors text-left text-emerald-600 text-emerald-600"><FileSpreadsheet size={16}/> 匯出 Excel</button>
        </div>
        <form onSubmit={async e => {
          e.preventDefault(); const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
          await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(formData) });
          onRefresh(); setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''}); setIsCustomDept(false);
        }} className="p-8 space-y-6 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
            <input type="text" placeholder="員編" required className="p-3 rounded-xl border bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
            <input type="text" placeholder="姓名" required className="p-3 rounded-xl border bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
            <input type="text" placeholder="職稱" required className="p-3 rounded-xl border bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} />
            {isCustomDept ? <input type="text" placeholder="輸入新部門" className="p-3 rounded-xl border bg-white text-left text-slate-800 text-slate-800 text-slate-800" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} onBlur={()=>!formData.dept && setIsCustomDept(false)}/> :
            <select required className="p-3 rounded-xl border bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800" value={formData.dept} onChange={e=>{if(e.target.value==='_custom'){setIsCustomDept(true);setFormData({...formData,dept:''})} else setFormData({...formData,dept:e.target.value})}}><option value="" disabled>單位</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}<option value="_custom">+ 新增單位</option></select>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
             <div className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">性別</label><select className="w-full p-2.5 rounded-xl border mt-1 text-left text-slate-800 text-slate-800 text-slate-800" value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="">請選擇</option><option value="男">男</option><option value="女">女</option></select></div>
             <div className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">到職日</label><input type="date" className="w-full p-2 rounded-xl border mt-1 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.hireDate} onChange={e=>setFormData({...formData, hireDate:e.target.value})} /></div>
             <div className="text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">生日</label><input type="date" className="w-full p-2 rounded-xl border mt-1 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800" value={formData.birthDate} onChange={e=>setFormData({...formData, birthDate:e.target.value})} /></div>
          </div>
          <div className="flex gap-4 pt-2 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800"><button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white text-white">{editingId ? '更新資料' : '新增人員'}</button></div>
        </form>
        <div className="overflow-x-auto border-t text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          <table className="w-full text-sm text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400"><tr><th className="px-8 py-4 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">員編</th><th className="px-4 py-4 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">姓名</th><th className="px-4 py-4 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">職稱/單位</th><th className="px-4 py-4 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">帳號</th><th className="px-8 py-4 text-right text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800 text-slate-800">
                  <td className="px-8 py-4 font-mono font-bold text-slate-600 text-left text-slate-600 text-left text-slate-600 text-left text-slate-600 text-left text-slate-600 text-left text-slate-600 text-left text-slate-600">{emp.empId}</td>
                  <td className="px-4 py-4 font-black text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800">{emp.name}</td>
                  <td className="px-4 py-4 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800"><div className="font-bold text-left text-slate-800 text-left text-slate-800 text-left text-slate-800">{emp.jobTitle}</div><div className="text-[10px] text-slate-400 text-left text-slate-400 text-left text-slate-400 text-left text-slate-400">{emp.dept}</div></td>
                  <td className="px-4 py-4 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800"><button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 text-left text-slate-500 text-left text-slate-500 text-left text-slate-500 text-left text-slate-500">重設密碼</button></td>
                  <td className="px-8 py-4 text-right flex justify-end gap-2 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800 text-left text-slate-800"><button onClick={()=>{setEditingId(emp.id);setFormData(emp);}} className="p-2 text-slate-300 hover:text-slate-600 text-left text-slate-300 text-left text-slate-300 text-left text-slate-300 text-left text-slate-300"><Edit2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 補齊：代理確認畫面
const SubstituteView = ({ records, onRefresh, setNotification, userSession }) => {
  const pendingRecords = records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name);

  const handleProcess = async (record, action) => {
    try {
      const newStatus = action === 'approve' ? 'pending_manager' : 'rejected';
      await fetch(`${NGROK_URL}/api/records/${record.id}`, {
        method: 'PUT',
        headers: fetchOptions.headers,
        body: JSON.stringify({ ...record, status: newStatus })
      });
      setNotification({ type: 'success', text: action === 'approve' ? '已同意代理' : '已拒絕代理' });
      onRefresh();
    } catch (e) {
      setNotification({ type: 'error', text: '處理失敗' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-800">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-amber-500 px-8 py-10 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">代理確認</h1>
            <p className="text-sm opacity-90 italic mt-1">需由您確認代理的請假單</p>
          </div>
          <UserCheck size={40} className="opacity-40" />
        </div>
        <div className="p-8">
          {pendingRecords.length === 0 ? (
            <div className="text-center text-slate-400 py-10 font-bold">目前沒有需要您代理的單據</div>
          ) : (
            <div className="space-y-4">
              {pendingRecords.map(r => (
                <div key={r.id} className="p-4 border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{r.serialId}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600">{r.name}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      {r.startDate} {r.startHour}:{r.startMin} ~ {r.endDate} {r.endHour}:{r.endMin} ({r.totalHours}H)
                    </div>
                    <div className="text-xs text-slate-500 mt-1">事由: {r.reason}</div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => handleProcess(r, 'reject')} className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors">婉拒</button>
                    <button onClick={() => handleProcess(r, 'approve')} className="flex-1 md:flex-none px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">同意代理</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 補齊：主管簽核畫面
const ApprovalView = ({ records, onRefresh, setNotification, userSession, employees }) => {
  const pendingRecords = records.filter(r => canManagerApproveRecord(userSession, r, employees));

  const handleProcess = async (record, action) => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await fetch(`${NGROK_URL}/api/records/${record.id}`, {
        method: 'PUT',
        headers: fetchOptions.headers,
        body: JSON.stringify({ ...record, status: newStatus })
      });
      setNotification({ type: 'success', text: action === 'approve' ? '已核准' : '已駁回' });
      onRefresh();
    } catch (e) {
      setNotification({ type: 'error', text: '處理失敗' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-800">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">主管簽核</h1>
            <p className="text-sm opacity-90 italic mt-1">待您審核的各項申請單</p>
          </div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="p-8">
          {pendingRecords.length === 0 ? (
            <div className="text-center text-slate-400 py-10 font-bold">目前沒有需要簽核的單據</div>
          ) : (
            <div className="space-y-4">
              {pendingRecords.map(r => (
                <div key={r.id} className="p-4 border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{r.serialId}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{r.formType}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">{r.name} ({r.dept})</span>
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      {r.startDate} {r.startHour}:{r.startMin} ~ {r.endDate} {r.endHour}:{r.endMin} ({r.totalHours}H)
                    </div>
                    <div className="text-xs text-slate-500 mt-1">事由: {r.reason}</div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => handleProcess(r, 'reject')} className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors">駁回</button>
                    <button onClick={() => handleProcess(r, 'approve')} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">核准</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 補齊：單據查詢畫面
const InquiryView = ({ records, userSession }) => {
  const myRecords = records.filter(r => userSession.empId === 'root' || r.empId === userSession.empId).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-800">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-fuchsia-600 px-8 py-10 text-white flex items-center justify-between">
          <div><h1 className="text-2xl font-black">單據查詢</h1></div>
          <ClipboardList size={40} className="opacity-40" />
        </div>
        <div className="p-8">
          <div className="space-y-4">
            {myRecords.length === 0 ? (
               <div className="text-center text-slate-400 py-10 font-bold">無單據紀錄</div>
            ) : myRecords.map(r => (
              <div key={r.id} className="p-4 border rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-500">{r.serialId}</div>
                  <div className="font-bold">{r.formType} - {r.totalHours}H</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 補齊：修改密碼畫面
const ChangePasswordView = ({ userSession, setNotification, onLogout }) => {
  const [pwd, setPwd] = useState({ new: '', confirm: '' });
  const handleSubmit = async (e) => {
     e.preventDefault();
     if(pwd.new !== pwd.confirm) return setNotification({type:'error', text:'新密碼不一致'});
     try {
       await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, {
         method: 'PUT',
         headers: fetchOptions.headers,
         body: JSON.stringify({ ...userSession, password: pwd.new })
       });
       setNotification({type:'success', text:'密碼修改成功，請重新登入'});
       onLogout();
     } catch(e) { setNotification({type:'error', text:'修改失敗'}); }
  };
  return (
    <div className="bg-white rounded-3xl shadow-xl border p-8 max-w-lg mx-auto mt-10">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound size={28} className="text-slate-400"/>
        <h2 className="text-2xl font-black">修改密碼</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
         <input type="password" placeholder="新密碼" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={pwd.new} onChange={e=>setPwd({...pwd, new:e.target.value})} />
         <input type="password" placeholder="確認新密碼" required className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={pwd.confirm} onChange={e=>setPwd({...pwd, confirm:e.target.value})} />
         <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700">確認修改</button>
      </form>
    </div>
  );
};

// --- App Component ---

const App = () => {
  const [activeMenu, setActiveMenu] = useState('welcome');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([
    { id: 1, type: 'policy', title: '2026年員工旅遊補助辦法更新', date: '2026-04-15', isNew: true, content: '年度員工旅遊補助辦法已更新。' },
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
      const [resE, resR] = await Promise.all([ 
        fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()), 
        fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json()) 
      ]); 
      setEmployees(Array.isArray(resE) ? resE : []); setRecords(Array.isArray(resR) ? resR : []); 
    } catch (e) { setApiError(true); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const availableDepts = useMemo(() => [...new Set(employees.map(e => e.dept).filter(Boolean))], [employees]);
  const isAdmin = useMemo(() => userSession && (userSession.empId === 'root' || ADMIN_TITLES.includes(userSession.jobTitle)), [userSession]);
  const otSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g,'')}-OT${String(records.filter(r=>r.serialId?.includes('OT')).length + 1).padStart(3,'0')}`, [records]);
  const leaveSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g,'')}-LV${String(records.filter(r=>r.serialId?.includes('LV')).length + 1).padStart(3,'0')}`, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-sky-500 font-sans text-left"><Loader2 className="animate-spin w-12 h-12" /><span className="ml-4 font-bold text-slate-500 text-left">載入中...</span></div>;
  if (!userSession) return <LoginView employees={employees} apiError={apiError} onLogin={u=>{ setUserSession(u); setActiveMenu('welcome'); setNotification({type:'success',text:`${u.name} 登入成功`}); }} />;

  return (
    <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden text-left">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right border ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="font-bold text-sm text-slate-800 text-left">{notification.text}</span>
        </div>
      )}
      <aside className="w-80 bg-white border-r p-8 flex flex-col h-full shadow-sm shrink-0 z-20 text-left">
        <div onClick={() => setActiveMenu('welcome')} className="flex items-center gap-4 mb-10 text-sky-500 cursor-pointer hover:opacity-80 transition-opacity text-left"><div className="p-3 bg-sky-500 rounded-2xl shadow-lg text-white text-white text-white text-white text-white text-white text-white text-white text-white"><LayoutDashboard size={24} /></div><h2 className="font-black text-xl tracking-tight text-sky-600 text-left text-sky-600 text-sky-600 text-sky-600 text-sky-600 text-sky-600">員工服務平台</h2></div>
        <nav className="space-y-2 flex-grow overflow-y-auto text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">主要服務</p>
          <button onClick={() => setActiveMenu('welcome')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'welcome' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><Sparkles size={20} /> 首頁總覽</button>
          <button onClick={() => setActiveMenu('announcement-list')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'announcement-list' ? 'bg-yellow-50 text-yellow-600 border-yellow-500' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><Bell size={20} /> 資訊公告</button>
          <button onClick={() => setActiveMenu('substitute')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'substitute' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><UserCheck size={20} /> 代理確認</button>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-blue-50 text-blue-600 border-blue-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'integrated-query' ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><ClipboardList size={20} /> 單據查詢</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2 text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400 text-slate-400">管理區域</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><ShieldCheck size={20} /> 主管審核</button>
              <button onClick={() => setActiveMenu('announcement')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'announcement' ? 'bg-rose-50 text-rose-600 border-rose-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><Megaphone size={20} /> 公告維護</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-teal-50 text-teal-600 border-teal-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600 text-slate-600`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto space-y-4 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900">
          <div className="p-4 bg-slate-50 rounded-3xl border flex items-center gap-3 text-left text-slate-900 text-slate-900 text-slate-900 text-slate-900"><div className="px-2 min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 text-[10px] text-sky-600 text-sky-600 text-sky-600 text-sky-600">{typeof userSession.dept === 'string' ? userSession.dept.substring(0, 2) : '部'}</div><div className="overflow-hidden text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800"><p className="text-xs font-black truncate text-left text-slate-800 text-slate-800 text-slate-800">{userSession.name}</p><p className="text-[10px] text-slate-400 font-mono text-left text-slate-400 text-slate-400 text-slate-400 text-slate-400">{userSession.empId}</p></div></div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all text-left text-rose-500 text-rose-500 text-rose-500 text-rose-500 text-rose-500 text-rose-500"><LogOut size={20} /> 登出系統</button>
        </div>
      </aside>
      <main className="flex-grow h-full p-10 overflow-y-auto bg-slate-50 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">
        <div className="max-w-7xl mx-auto space-y-12 text-left text-slate-800 text-slate-800 text-slate-800 text-slate-800">
          {activeMenu === 'welcome' && <WelcomeView userSession={userSession} records={records} setActiveMenu={setActiveMenu} isAdmin={isAdmin} announcements={announcements} employees={employees} />}
          {activeMenu === 'announcement-list' && <AnnouncementListView announcements={announcements} />}
          {activeMenu === 'substitute' && <SubstituteView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} records={records} availableDepts={availableDepts} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} setNotification={setNotification} onLogout={() => setUserSession(null)} onRefresh={fetchData} />}
          {activeMenu === 'announcement' && isAdmin && <AnnouncementManagement announcements={announcements} setAnnouncements={setAnnouncements} setNotification={setNotification} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} employees={employees} />}
        </div>
      </main>
    </div>
  );
};

export default App;