// 觸發重新編譯以解決環境快取問題
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList, HelpCircle, Timer, Sparkles, ChevronDown, ChevronUp, Megaphone,
  Paperclip, UploadCloud, Activity, GitBranch
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
  { id: 'shared_doc', label: '單據共享', colorClass: 'bg-sky-100 text-sky-700' },
];

// --- Helpers ---
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
      if (m < 0 || (m === 0 && today.getDate() < hireDate.getDate())) {
        years--;
      }

      let days = 0;
      if (years >= 10) {
        days = 15 + (years - 9);
        if (days > 30) days = 30;
      } else if (years >= 5) {
        days = 15;
      } else if (years >= 3) {
        days = 14;
      } else if (years >= 2) {
        days = 10;
      } else if (years >= 1) {
        days = 7;
      } else {
        const sixMonthsLater = new Date(hireDate);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        if (today >= sixMonthsLater) {
          days = 3;
        }
      }
      totalAnnualHours = days * 8; 
    }
  }

  return {
    totalAnnual: totalAnnualHours,
    usedAnnual: usedAnn,
    remainAnnual: Math.max(0, totalAnnualHours - usedAnn),
    earnedComp: earnedCmp,
    usedComp: usedCmp,
    remainComp: Math.max(0, earnedCmp - usedCmp)
  };
};

const canManagerApproveRecord = (userSession, r, employees) => {
  if (!userSession) return false;
  if (userSession.empId === 'root') return true;
  if (r.empId === userSession.empId) return false;

  if (r.status === 'pending_assignment') return userSession.empId === '9002';
  if (r.status === 'pending_gm') return userSession.empId === '9001' || userSession.jobTitle === '總經理';

  if (r.status === 'pending_director') {
    if (userSession.jobTitle !== '協理') return false;
    if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(r.dept);
    if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(r.dept);
    return r.dept === userSession.dept;
  }

  if (r.status === 'pending_manager' || r.status === 'pending') {
    if (!["經理", "副理"].includes(userSession.jobTitle)) return false;
    return r.dept === userSession.dept;
  }
  return false;
};

// --- 共用組件 ---
const StatusBadge = ({ status }) => {
  if (['approved', 'rejected', 'canceled'].includes(status)) {
    let stampConfig = { color: '', icon: null, label: '' };
    if (status === 'approved') stampConfig = { color: 'text-emerald-600 border-emerald-600', icon: Check, label: '已核准' };
    else if (status === 'rejected') stampConfig = { color: 'text-rose-600 border-rose-600', icon: X, label: '已駁回' };
    else if (status === 'canceled') stampConfig = { color: 'text-slate-400 border-slate-400', icon: RotateCcw, label: '已撤銷' };

    const IconComponent = stampConfig.icon;
    return (
      <div className={`w-11 h-11 rounded-full border-[1.5px] flex flex-col items-center justify-center -rotate-[15deg] ${stampConfig.color} bg-transparent shrink-0 opacity-80 relative mx-1`}>
        <div className={`absolute inset-[2px] rounded-full border ${stampConfig.color} opacity-40`}></div>
        <IconComponent size={14} strokeWidth={4} className="mb-0.5" />
        <span className="text-[8px] font-black leading-none">{stampConfig.label}</span>
      </div>
    );
  }

  const dynamicStyles = {
    pending_substitute: "bg-amber-50 text-amber-600 border-transparent",
    pending_manager: "bg-indigo-50 text-indigo-600 border-transparent",
    pending_director: "bg-fuchsia-50 text-fuchsia-600 border-transparent",
    pending_gm: "bg-rose-50 text-rose-600 border-transparent",
    pending_assignment: "bg-purple-50 text-purple-600 border-purple-200", 
    pending: "bg-slate-50 text-slate-600 border-transparent"
  };

  const labels = { 
    pending_substitute: "待代理", pending_manager: "待經副理", pending_director: "待協理",
    pending_gm: "待總經理", pending_assignment: "待交辦(9002)", pending: "待簽核" 
  };
  
  const currentStyle = dynamicStyles[status] || dynamicStyles.pending;
  const currentLabel = labels[status] || labels.pending;
  
  return <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${currentStyle} whitespace-nowrap shadow-sm`}>{currentLabel}</span>;
};

const PassInput = ({ label, value, field, showKey, Icon, shows, onToggle, onChange }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors"><Icon size={18} /></div>
      <input type={shows[showKey] ? 'text' : 'password'} required className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 transition-all text-left [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={value} onChange={e => onChange(field, e.target.value)} />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
        {shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

// --- 流程細節 Modal 組件 ---
const WorkflowModal = ({ record, employees, onClose }) => {
  const applicant = useMemo(() => employees.find(e => e.empId === record.empId), [record, employees]);
  
  const workflowSteps = useMemo(() => {
    const steps = [];
    const isUnitManager = ["經理", "副理"].includes(applicant?.jobTitle);
    const isDirector = applicant?.jobTitle === '協理';
    const isGM = applicant?.jobTitle === '總經理';

    steps.push({ id: 'submitted', label: '提交申請', desc: `${record.name} 已送出單據`, icon: FileText, isPast: true });

    if (record.formType === '請假') {
      const isPast = !['pending_substitute'].includes(record.status);
      const isCurrent = record.status === 'pending_substitute';
      steps.push({ id: 'pending_substitute', label: '職務代理確認', desc: `代理人：${record.substitute}`, icon: UserCheck, isPast, isCurrent });
    }

    const skipManager = isUnitManager || isDirector || isGM;
    if (!skipManager) {
      const isPast = !['pending_substitute', 'pending_manager', 'pending'].includes(record.status);
      const isCurrent = record.status === 'pending_manager' || record.status === 'pending';
      steps.push({ id: 'pending_manager', label: '單位經副理簽核', desc: '審核 3 日(含)以下單據', icon: ShieldCheck, isPast, isCurrent });
    }

    const skipDirector = isDirector || isGM;
    if (!skipDirector) {
      const isPast = !['pending_substitute', 'pending_manager', 'pending', 'pending_director'].includes(record.status);
      const isCurrent = record.status === 'pending_director';
      steps.push({ id: 'pending_director', label: '單位協理簽核', desc: '審核 5 日(含)以下單據', icon: ShieldCheck, isPast, isCurrent });
    }

    const skipGMOnOT = isGM && record.formType === '加班'; 
    if (!skipGMOnOT) {
      const isPast = record.status === 'pending_assignment' || record.status === 'approved';
      const isCurrent = record.status === 'pending_gm';
      steps.push({ id: 'pending_gm', label: '總經理核定', desc: '審核 5 日以上或主管單據', icon: ShieldCheck, isPast, isCurrent });
    }

    const isAssignPast = record.status === 'approved';
    const isAssignCurrent = record.status === 'pending_assignment';
    steps.push({ id: 'pending_assignment', label: '財務行政/專員(9002)', desc: '最終結案登記與交辦執行', icon: ClipboardCheck, isPast: isAssignPast, isCurrent: isAssignCurrent });

    if (record.status === 'rejected') {
      steps.push({ id: 'rejected', label: '簽核駁回', desc: '單據已被主管退回', icon: XCircle, isCurrent: true });
    } else if (record.status === 'canceled') {
      steps.push({ id: 'canceled', label: '申請撤銷', desc: '單據已由申請人撤銷', icon: RotateCcw, isCurrent: true });
    } else {
      steps.push({ id: 'approved', label: '核准結案', desc: '流程完畢，記錄生效', icon: CheckCircle2, isPast: record.status === 'approved', isCurrent: record.status === 'approved' });
    }

    return steps;
  }, [record, applicant]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/10 rounded-lg"><GitBranch size={20} /></div>
            <div>
              <h2 className="text-lg font-black leading-tight">簽核路徑追蹤</h2>
              <p className="text-[10px] opacity-60 font-mono tracking-widest uppercase">{record.serialId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/30">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">申請項目</p>
              <p className="font-bold text-slate-800">{record.formType} - {record.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === record.category)?.label) : '加班'}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">總計時數</p>
              <p className="font-black text-slate-900 text-lg">{record.totalHours} HR</p>
            </div>
          </div>

          <div className="relative space-y-0 pl-1">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === workflowSteps.length - 1;

              return (
                <div key={idx} className="relative group">
                  {!isLast && (
                    <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 transition-colors duration-500 ${step.isPast ? 'bg-indigo-500' : 'bg-slate-200 border-dashed'}`}></div>
                  )}
                  
                  <div className="flex gap-6 pb-10">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      step.isCurrent ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] scale-110' : 
                      step.isPast ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.isPast && !step.isCurrent ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                      {step.isCurrent && <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/30"></div>}
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-black transition-colors ${step.isCurrent ? 'text-indigo-600' : 'text-slate-700'}`}>{step.label}</h4>
                        {step.isCurrent && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded-md uppercase tracking-widest animate-pulse">目前階段</span>}
                      </div>
                      <p className={`text-xs mt-0.5 font-bold ${step.isCurrent ? 'text-slate-500' : 'text-slate-400'} leading-relaxed`}>{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
          <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black text-sm shadow-lg hover:bg-slate-900 transition-all active:scale-95">關閉檢視</button>
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

const WelcomeView = ({ userSession, records, onRefresh, setActiveMenu, isAdmin, announcements, employees, readAnns, markAnnAsRead }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const currentDate = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const substituteCount = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name).length, [records, userSession.name]);
  const managerCount = useMemo(() => { if (!isAdmin) return 0; return records.filter(r => canManagerApproveRecord(userSession, r, employees)).length; }, [records, userSession, isAdmin, employees]);
  const processingOtCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '加班' && ['pending', 'pending_manager', 'pending_director', 'pending_gm', 'pending_assignment'].includes(r.status)), [records, userSession.empId]);
  const processingLvCount = useMemo(() => records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '請假' && ['pending', 'pending_substitute', 'pending_manager', 'pending_director', 'pending_gm', 'pending_assignment'].includes(r.status)), [records, userSession.empId]);
  const { totalAnnual, remainAnnual, usedAnnual, remainComp, earnedComp, usedComp } = useMemo(() => calculatePTOStats(userSession.empId, userSession.hireDate, records), [records, userSession.empId, userSession.hireDate]);

  const userWarningStatus = useMemo(() => {
    if (!userSession.hireDate) return null;
    const nextAnniv = getNextAnniversary(userSession.hireDate);
    if (!nextAnniv) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = getDaysDiff(today, nextAnniv);
    const projectedNewPTO = getProjectedPTO(userSession.hireDate, nextAnniv);
    const projectedTotal = remainAnnual + projectedNewPTO;
    if (projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0) return { active: true, daysLeft, projectedTotal, overHours: projectedTotal - 240, nextAnnivStr: nextAnniv.toISOString().split('T')[0] };
    return null;
  }, [userSession.hireDate, remainAnnual]);

  const teamWatchlist = useMemo(() => {
    if (!isAdmin) return [];
    const team = employees.filter(emp => {
      if (emp.empId === userSession.empId) return false; 
      if (userSession.empId === 'root') return true;
      const isEmpManager = ["協理", "經理", "副理"].includes(emp.jobTitle);
      const isSameDept = emp.dept === userSession.dept;
      if (userSession.empId === '9001' || userSession.jobTitle === '總經理') return isSameDept || isEmpManager;
      if (userSession.jobTitle === '協理') {
        if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(emp.dept);
        if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept);
      }
      return emp.dept === userSession.dept;
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    return team.map(emp => {
      const stats = calculatePTOStats(emp.empId, emp.hireDate, records);
      const nextAnniv = getNextAnniversary(emp.hireDate);
      if (!nextAnniv) return null;
      const daysLeft = getDaysDiff(today, nextAnniv);
      const projectedNew = getProjectedPTO(emp.hireDate, nextAnniv);
      const projectedTotal = stats.remainAnnual + projectedNew;
      if (projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0) {
        return { ...emp, remainAnnual: stats.remainAnnual, projectedTotal, daysLeft, nextAnnivStr: nextAnniv.toISOString().split('T')[0], overHours: projectedTotal - 240 };
      }
      return null;
    }).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [isAdmin, employees, records, userSession]);

  const activeAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return announcements.filter(ann => !ann.endDate || ann.endDate >= todayStr);
  }, [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 relative">
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass || ANNOUNCEMENT_TYPES[0].colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}</span>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date} 發布</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6">{selectedAnnouncement.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedAnnouncement.content || '無詳細內文。'}</div>
            </div>
          </div>
        </div>
      )}

      {userWarningStatus && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-2xl shadow-sm flex items-start gap-4">
          <div className="p-2 bg-rose-100 rounded-full shrink-0 animate-pulse mt-0.5"><AlertTriangle className="text-rose-600" size={24} /></div>
          <div>
            <h3 className="text-rose-800 font-black text-lg flex items-center gap-2">特休時數超標預警 <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">倒數 {userWarningStatus.daysLeft} 天</span></h3>
            <p className="text-rose-700 mt-1.5 text-sm font-medium leading-relaxed">您的到職週年日 (<span className="font-bold">{userWarningStatus.nextAnnivStr}</span>) 即將到來。預計發放新特休後將達 <span className="font-bold">{userWarningStatus.projectedTotal} 小時</span>，超過 240 小時之規定上限。<strong className="block mt-1 text-rose-900 bg-rose-200/50 inline-block px-2 py-0.5 rounded">屆時超過之 {userWarningStatus.overHours} 小時將自動歸零，請盡速安排休假。</strong></p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl shadow-xl overflow-hidden text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-300/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        <div className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-sky-50 border border-white/10"><Sparkles size={14} /> 今天是 {currentDate}</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">歡迎回來，{userSession.name}！</h1>
            <p className="text-sky-100 text-sm md:text-base font-medium opacity-90 max-w-lg leading-relaxed">這裡是您的專屬員工服務中心。您可以在此快速進行各項表單申請、進度查詢與資料管理。</p>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner min-w-[200px]">
            <div className="text-sm font-bold text-sky-100 mb-1">{userSession.dept || '所屬部門'}</div>
            <div className="text-2xl font-black">{userSession.jobTitle || '員工'}</div>
            <div className="text-xs font-mono mt-2 bg-white/20 px-3 py-1 rounded-full text-white">{userSession.empId}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-100 p-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3"><Bell size={20} className="text-rose-500" /><h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">最新公告</h2></div>
          {activeAnnouncements.length > 5 && (<button onClick={() => setActiveMenu('announcement-list')} className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 transition-colors">查看全部 <ArrowRight size={12} /></button>)}
        </div>
        <div className="divide-y divide-slate-100">
          {activeAnnouncements.slice(0, 5).map(ann => {
            const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
            return (
            <div key={ann.id} onClick={() => { setSelectedAnnouncement(ann); markAnnAsRead(ann.id); }} className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 w-full sm:w-auto"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>{typeInfo.label}</span>{ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}</div>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-sky-600 transition-colors truncate flex items-center gap-2">{!readAnns.includes(ann.id) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>}{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date} 發布</span>
            </div>
            );
          })}
          {activeAnnouncements.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold italic">目前無最新公告</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CalendarDays size={28} /></div>
            <div><div className="flex items-center gap-2 mb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特休餘額</p>{userWarningStatus && <AlertTriangle size={14} className="text-rose-500 animate-bounce" />}</div><div className="flex items-baseline gap-1"><span className={`text-3xl font-black ${userWarningStatus ? 'text-rose-600' : 'text-slate-800'}`}>{userSession.hireDate ? remainAnnual : '-'}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div>
          </div>
          <div className="text-right flex flex-col gap-1.5"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${userSession.hireDate ? 'text-slate-500 bg-slate-100' : 'text-rose-500 bg-rose-50'}`}>{userSession.hireDate ? `總額度 ${totalAnnual} HR` : '請先設定到職日'}</span>{userSession.hireDate && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">已休 {usedAnnual} HR</span>}</div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Timer size={28} /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">補休餘額</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{remainComp}</span><span className="text-sm font-bold text-slate-500">HR</span></div></div>
          </div>
          <div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">總累計 {earnedComp} HR</span><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">已用 {usedComp} HR</span></div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-6`}>
        <div onClick={() => setActiveMenu('substitute')} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer h-full">
          <div className="flex items-center gap-5"><div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><UserCheck size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">待代理確認</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{substituteCount}</span><span className="text-sm font-bold text-slate-500">件</span></div></div></div>
          <div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"><ArrowRight size={12}/> 前往確認</span></div>
        </div>

        {isAdmin && (
          <div onClick={() => setActiveMenu('approval')} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-5"><div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl"><ShieldCheck size={28} /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{userSession.empId === '9002' ? '待交辦審核' : '待主管簽核'}</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{managerCount}</span><span className="text-sm font-bold text-slate-500">件</span></div></div></div>
            <div className="text-right flex flex-col gap-1.5"><span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"><ArrowRight size={12}/> {userSession.empId === '9002' ? '前往交辦審核' : '前往簽核'}</span></div>
          </div>
        )}

        <div className={`bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 sm:gap-6 hover:shadow-md transition-shadow h-full ${!isAdmin ? 'md:col-span-1' : ''}`}>
          <div className="flex flex-col items-center justify-center gap-3 shrink-0 sm:pr-6 sm:border-r border-slate-100"><div className="p-4 bg-slate-100 text-slate-500 rounded-2xl"><FileText size={28} /></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">進度查詢</p></div>
          <div className="flex flex-col gap-3 flex-1 w-full">
            <div onClick={() => setActiveMenu('overtime')} className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl py-3 px-5 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.98]"><span className="text-xs font-bold text-slate-500 flex items-center gap-1 group-hover:text-blue-600">加班處理中 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-1"/></span><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-800 group-hover:text-blue-600">{processingOtCount.length}</span><span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-500">件</span></div></div>
            <div onClick={() => setActiveMenu('leave-apply')} className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-2xl py-3 px-5 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.98]"><span className="text-xs font-bold text-slate-500 flex items-center gap-1 group-hover:text-emerald-600">請假處理中 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-1"/></span><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-800 group-hover:text-emerald-600">{processingLvCount.length}</span><span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">件</span></div></div>
          </div>
        </div>
      </div>

      {isAdmin && teamWatchlist.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl border border-rose-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-rose-50 border-b border-rose-100 p-5 sm:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><div className="p-2 bg-rose-500 rounded-xl text-white shadow-sm"><AlertTriangle size={20} /></div><div><h2 className="text-sm font-black text-rose-900 uppercase tracking-widest">團隊特休超標關注名單</h2><p className="text-xs text-rose-600 mt-0.5 font-bold">未來 90 天內即將發放特休且預估超標之人員，請盡速督促排休</p></div></div>
            <span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">需關注 {teamWatchlist.length} 人</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest"><tr><th className="p-4 px-8">員工姓名 / 單位</th><th className="p-4">發放日 / 倒數</th><th className="p-4 text-right">目前結餘</th><th className="p-4 text-right">預測總計</th><th className="p-4 text-right px-8">預計歸零</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{teamWatchlist.map(emp => (
                <tr key={emp.id} className="hover:bg-rose-50/50 transition-colors">
                  <td className="p-4 px-8"><div className="font-bold text-slate-800">{emp.name} <span className="font-mono text-[11px] text-slate-400 ml-1 font-medium">({emp.empId})</span></div><div className="text-[10px] text-slate-500 font-bold">{emp.dept} / {emp.jobTitle}</div></td>
                  <td className="p-4"><div className="font-bold text-slate-700">{emp.nextAnnivStr}</div><div className={`text-[10px] font-bold mt-0.5 ${emp.daysLeft <= 30 ? 'text-rose-600' : 'text-amber-600'}`}>倒數 {emp.daysLeft} 天</div></td>
                  <td className="p-4 text-right font-bold text-slate-600">{emp.remainAnnual} HR</td>
                  <td className="p-4 text-right font-black text-rose-600">{emp.projectedTotal} HR</td>
                  <td className="p-4 px-8 text-right"><span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm border border-rose-200">-{emp.overHours} HR</span></td>
                </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementListView = ({ announcements, readAnns, markAnnAsRead }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const activeAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return announcements.filter(ann => !ann.endDate || ann.endDate >= todayStr);
  }, [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass || ANNOUNCEMENT_TYPES[0].colorClass}`}>{ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}</span>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date} 發布</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6 leading-snug">{selectedAnnouncement.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{selectedAnnouncement.content || '此公告目前沒有詳細內文。'}</div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-yellow-300 px-8 py-10 text-yellow-950 flex justify-between items-center"><div><h1 className="text-2xl font-black text-yellow-950">資訊公告</h1><p className="text-sm opacity-80 italic text-yellow-900">查看公司所有最新與歷史公告</p></div><Bell size={40} className="opacity-40 text-yellow-700" /></div>
        <div className="divide-y divide-slate-100">
          {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => {
            const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
            return (
            <div key={ann.id} onClick={() => { setSelectedAnnouncement(ann); markAnnAsRead(ann.id); }} className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 w-full sm:w-auto"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>{typeInfo.label}</span>{ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}</div>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-yellow-600 transition-colors truncate flex items-center gap-2">{!readAnns.includes(ann.id) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="未讀"></span>}{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date} 發布</span>
            </div>
            );
          }) : (<div className="p-16 text-center text-slate-400 text-sm font-bold italic">目前無任何公告資料</div>)}
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ employees, onLogin, apiError, onLogAction }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (identifier.trim() === 'root') {
      const today = new Date();
      const minguoYear = today.getFullYear() - 1911;
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dynamicPassword = `${minguoYear}${month}${day}`;
      
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      
      if (password.trim() === dynamicPassword) {
        const rootUser = { id: 'root', empId: 'root', name: '系統管理員', jobTitle: '最高管理員', dept: '系統維護部', hireDate: fiveYearsAgo.toISOString() };
        await onLogAction(rootUser, '登入/登出', '系統管理員登入成功');
        onLogin(rootUser);
      } else { setError('帳號或密碼不正確'); }
      setLoading(false);
      return;
    }
    
    if (employees.length === 0) {
      setError('目前無法連線到資料庫，請確認後端伺服器已啟動。');
      setLoading(false); return;
    }

    try {
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      const validPassword = (user?.password && user.password !== "") ? user.password : user?.empId;
      if (user && validPassword === password.trim()) {
        await onLogAction(user, '登入/登出', '使用者登入成功');
        onLogin(user);
      } else { setError('帳號或密碼不正確'); }
    } catch (err) { setError('登入處理發生系統錯誤，請重試'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-sky-500 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <UserCheck size={44} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-black tracking-tight relative z-10">員工服務平台</h1>
          <p className="text-sky-100 mt-2 opacity-90 text-sm relative z-10 font-medium">系統登入驗證</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {apiError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-700 text-xs font-bold"><AlertTriangle size={18} className="shrink-0" /> 後端連線異常，目前為離線狀態。<br/>請確認 server.js 是否已執行。</div>}
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2"><AlertTriangle size={18} /> {error}</div>}
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest">員編或姓名</label><input type="text" required className="w-full p-4 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={identifier} onChange={e => setIdentifier(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-widest">密碼</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} required className="w-full p-4 pr-12 rounded-2xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-500 shadow-xl hover:bg-sky-600 active:scale-95 flex items-center justify-center gap-3 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />} 確認登入
          </button>
        </form>
      </div>
    </div>
  );
};

const OvertimeView = ({ currentSerialId, onRefresh, records, employees, setNotification, userSession, availableDepts, onLogAction, onShowFlow }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [appType, setAppType] = useState('pre');
  const [shareDept, setShareDept] = useState('');
  const [shareEmp, setShareEmp] = useState('');
  const [formData, setFormData] = useState({ 
    name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', category: 'regular', compensationType: 'leave', 
    startDate: '', startHour: '18', startMin: '00', endDate: '', endHour: '20', endMin: '00', reason: '', sharedWith: [] 
  });

  const recentSubmissions = useMemo(() => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter(r => r.formType === '加班' && (userSession.empId === 'root' || r.empId === userSession.empId) && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, userSession.empId]);

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const calculatedCompensation = useMemo(() => {
    if (totalHours <= 0) return { leave: 0, payStr: '0' };
    let payHours = 0; const h = Number(totalHours);
    if (formData.category === 'rest') { if (h <= 2) payHours = h * 1.34; else if (h <= 8) payHours = 2 * 1.34 + (h - 2) * 1.67; else payHours = 2 * 1.34 + 6 * 1.67 + (h - 8) * 2.67; } 
    else if (formData.category === 'holiday') { if (h <= 8) payHours = 8; else if (h <= 10) payHours = 8 + (h - 8) * 1.34; else payHours = 8 + 2 * 1.34 + (h - 10) * 1.67; } 
    else { if (h <= 2) payHours = h * 1.34; else payHours = 2 * 1.34 + (h - 2) * 1.67; }
    return { leave: h, payStr: payHours > 0 ? (Math.round(payHours * 100) / 100).toFixed(2) : '0' };
  }, [totalHours, formData.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    let initialStatus = 'pending_manager';
    if (userSession.jobTitle === '總經理') initialStatus = 'pending_assignment';
    else if (userSession.jobTitle === '協理') initialStatus = 'pending_gm';
    else if (["經理", "副理"].includes(userSession.jobTitle)) initialStatus = 'pending_director';

    try {
      const res = await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, sharedWith: formData.sharedWith.join(','), serialId: currentSerialId, formType: '加班', appType, totalHours, status: initialStatus, createdAt: new Date().toISOString() }) });
      if(!res.ok) throw new Error('API Error');
      await onLogAction(userSession, '表單申請', `送出加班申請單 (${currentSerialId})`);
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '', sharedWith: [] })); setShareDept(''); setShareEmp('');
      setNotification({ type: 'success', text: '加班申請已送出' }); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '送出失敗，請檢查網路連線' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要刪除申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { try { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); await onLogAction(userSession, '單據撤銷', `刪除加班申請單 (${withdrawTarget.serialId})`); setNotification({ type: 'success', text: '已成功刪除單據' }); setWithdrawTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '刪除失敗' }); } }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認刪除</button></div>
          </div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Undo2 size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要抽單 (撤銷核准)？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{cancelTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">返回</button><button onClick={async () => { try { await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行抽單撤銷' }) }); await onLogAction(userSession, '單據撤銷', `抽單撤銷加班申請 (${cancelTarget.serialId})`); setNotification({ type: 'success', text: '已成功撤銷單據' }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '撤銷失敗' }); } }} className="flex-1 py-3 font-black text-white bg-slate-700 rounded-xl text-white">確認撤銷</button></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
        <div className={`${appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500'} px-8 py-10 text-white relative transition-colors duration-500`}>
          <div className="absolute top-6 right-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full font-bold text-[11px] font-mono shadow-sm"><span className="opacity-70 mr-1">NO.</span>{currentSerialId}</div>
          <h1 className="text-2xl font-black text-white">加班申請單</h1>
          <p className="mt-1 text-sm opacity-90 font-medium text-white">{appType === 'pre' ? '事前申請' : '事後補報'}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setAppType('pre')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'pre' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><Timer size={20} />事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'post' ? 'bg-white text-orange-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><History size={20} />事後補報</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold" value={formData.empId} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.name} readOnly /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">部門</label>
              <select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}><option value="" disabled>請選擇部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">類別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">補償方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-12"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='leave'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>換補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='pay'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>計薪</button></div></div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-4"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">開始時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold bg-white" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-4"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">結束時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold bg-white" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className={`${appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500'} rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black`}><span className="text-[9px] uppercase opacity-70">時數</span><div className="flex items-baseline gap-1"><span className="text-xl text-white">{totalHours || "0"}</span><span className="text-[9px] text-white">HR</span></div></div>
            <div className="bg-slate-200 rounded-2xl p-3 text-slate-600 flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black shadow-inner"><span className="text-[9px] uppercase opacity-70">{formData.compensationType === 'leave' ? '預計補休' : '預計加班費'}</span><div className="flex items-baseline gap-1"><span className="text-xl text-slate-700">{formData.compensationType === 'leave' ? calculatedCompensation.leave : calculatedCompensation.payStr}</span><span className="text-[9px] text-slate-500">{formData.compensationType === 'leave' ? 'HR' : '倍時薪'}</span></div></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">原因說明</label><textarea required rows="2" placeholder="請描述加班具體工作內容..." className="w-full p-4 rounded-xl border bg-white font-bold" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={12}/> 開放檢視權限給特定同仁 (選填)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select className="flex-1 p-3 rounded-xl border bg-white font-bold text-sm" value={shareDept} onChange={e => { setShareDept(e.target.value); setShareEmp(''); }}><option value="">-- 選擇部門 --</option>{availableDepts.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select className="flex-1 p-3 rounded-xl border bg-white font-bold text-sm" value={shareEmp} onChange={e => setShareEmp(e.target.value)} disabled={!shareDept}><option value="">-- 選擇員工 --</option>{employees.filter(emp => emp.dept === shareDept && emp.empId !== userSession.empId).map(emp => (<option key={emp.empId} value={emp.empId}>{emp.name} ({emp.empId})</option>))}</select>
                <button type="button" onClick={() => { if (shareEmp && !formData.sharedWith.includes(shareEmp)) { setFormData({...formData, sharedWith: [...formData.sharedWith, shareEmp]}); setShareEmp(''); } }} disabled={!shareEmp} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm disabled:bg-slate-300">加入分享</button>
              </div>
              {formData.sharedWith.length > 0 && (<div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">{formData.sharedWith.map(id => { const emp = employees.find(e => e.empId === id); return (<span key={id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-700 shadow-sm">{emp ? `${emp.name} (${emp.dept})` : id}<button type="button" onClick={() => setFormData({...formData, sharedWith: formData.sharedWith.filter(v => v !== id)})} className="text-slate-400 hover:text-rose-500 ml-1"><X size={14} /></button></span>); })}</div>)}
            </div>
          </div>

          <button disabled={totalHours <= 0 || submitting} type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${totalHours <= 0 || submitting ? 'bg-slate-300 cursor-not-allowed' : (appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500')}`}>
            {submitting ? '提交中...' : `送出加班申請 (${appType === 'pre' ? '事前' : '事後'})`}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近 10 筆加班紀錄</h3></div>
        {recentSubmissions.length > 0 ? (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left whitespace-nowrap border-separate" style={{ borderSpacing: 0 }}>
              <thead><tr><th className="bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-l-2xl border-y border-l">單號</th><th className="bg-slate-50 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y">部門</th><th className="bg-slate-50 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y">類型</th><th className="bg-slate-50 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y">類別</th><th className="bg-slate-50 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y">時間</th><th className="bg-slate-50 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y">時數</th><th className="bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-r-2xl border-y border-r text-right">狀態/操作</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="h-2"></tr>
                {recentSubmissions.slice(0, 10).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 border-b">{r.serialId}</td>
                    <td className="px-4 py-4 font-bold text-slate-700 border-b">{r.dept || '未設定'}</td>
                    <td className="px-4 py-4 border-b"><span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest ${r.appType === 'pre' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{r.appType === 'pre' ? '事前' : '事後'}</span></td>
                    <td className="px-4 py-4 font-black text-[11px] text-slate-700 border-b">{OT_CATEGORIES.find(c => c.id === r.category)?.label || '未設定'}</td>
                    <td className="px-4 py-4 font-bold text-[11px] text-slate-600 border-b">{r.startDate === r.endDate ? `${r.startDate} ${r.startHour}:${r.startMin}` : `${r.startDate} ${r.startHour}:${r.startMin} ~ ${r.endDate} ${r.endHour}:${r.endMin}`}</td>
                    <td className="px-4 py-4 font-black text-slate-900 border-b">{r.totalHours}H</td>
                    <td className="px-6 py-4 border-b text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StatusBadge status={r.status} />
                        {['pending', 'pending_manager', 'pending_director', 'pending_gm'].includes(r.status) && (<button onClick={() => setWithdrawTarget(r)} className="px-3 py-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-md text-[10px] font-black transition-colors">刪除</button>)}
                        {r.status === 'approved' && (<button onClick={() => setCancelTarget(r)} className="px-3 py-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-md text-[10px] font-black transition-colors">抽單</button>)}
                        <button onClick={() => onShowFlow(r)} className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors"><Eye size={14}/> 檢視</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (<div className="py-12 text-center text-slate-300 italic font-bold">目前無近期的加班紀錄</div>)}
      </div>
    </div>
  );
};

const LeaveApplyView = ({ currentSerialId, onRefresh, employees, setNotification, userSession, records, availableDepts, onLogAction, onShowFlow }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [shareDept, setShareDept] = useState('');
  const [shareEmp, setShareEmp] = useState('');
  const [formData, setFormData] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', jobTitle: userSession.jobTitle || '', substitute: '', category: 'annual', startDate: '', startHour: '09', startMin: '00', endDate: '', endHour: '18', endMin: '00', reason: '', attachmentName: '', attachmentData: null, sharedWith: [] });

  const handleEmpIdChange = (id) => { const matched = employees.find(e => e.empId === id); setFormData(prev => ({ ...prev, empId: id, name: matched ? matched.name : prev.name, dept: matched ? matched.dept : prev.dept, jobTitle: matched ? matched.jobTitle : prev.jobTitle, substitute: '' })); };
  const handleNameChange = (name) => { const matched = employees.find(e => e.name === name); setFormData(prev => ({ ...prev, name: name, empId: matched ? matched.empId : prev.empId, dept: matched ? matched.dept : prev.dept, jobTitle: matched ? matched.jobTitle : prev.jobTitle, substitute: '' })); };
  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { setNotification({ type: 'error', text: '檔案大小不能超過 5MB' }); e.target.value = ''; return; } const reader = new FileReader(); reader.onloadend = () => { setFormData(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result })); }; reader.readAsDataURL(file); } };
  const availableSubstitutes = useMemo(() => { if (!formData.dept) return []; return employees.filter(emp => emp.dept === formData.dept && emp.empId !== formData.empId); }, [employees, formData.dept, formData.empId]);
  const recentSubmissions = useMemo(() => { const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); return records.filter(r => r.formType === '請假' && (userSession.empId === 'root' || r.empId === userSession.empId) && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }, [records, userSession.empId]);

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    
    let totalValidMs = 0; let currentDay = new Date(start); currentDay.setHours(0, 0, 0, 0); const endDay = new Date(end); endDay.setHours(0, 0, 0, 0);
    const holidays = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-10-10'];

    while (currentDay <= endDay) {
      const dayOfWeek = currentDay.getDay();
      const localDateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(localDateStr)) {
        const workStart = new Date(currentDay); workStart.setHours(9, 0, 0, 0);
        const workEnd = new Date(currentDay); workEnd.setHours(18, 0, 0, 0);
        const overlapStart = Math.max(start.getTime(), workStart.getTime());
        const overlapEnd = Math.min(end.getTime(), workEnd.getTime());
        if (overlapEnd > overlapStart) {
          let dailyValidMs = overlapEnd - overlapStart;
          const lunchStart = new Date(currentDay); lunchStart.setHours(12, 30, 0, 0);
          const lunchEnd = new Date(currentDay); lunchEnd.setHours(13, 30, 0, 0);
          const lunchOverlapStart = Math.max(overlapStart, lunchStart.getTime());
          const lunchOverlapEnd = Math.min(overlapEnd, lunchEnd.getTime());
          if (lunchOverlapEnd > lunchOverlapStart) dailyValidMs -= (lunchOverlapEnd - lunchOverlapStart);
          totalValidMs += dailyValidMs;
        }
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return Math.max(0, Math.round((totalValidMs / (1000 * 60 * 60)) * 10) / 10);
  }, [formData.startDate, formData.endDate, formData.startHour, formData.startMin, formData.endHour, formData.endMin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, sharedWith: formData.sharedWith.join(','), serialId: currentSerialId, formType: '請假', totalHours, status: 'pending_substitute', createdAt: new Date().toISOString() }) });
      if(!res.ok) throw new Error('API error');
      await onLogAction(userSession, '表單申請', `送出請假申請單 (${currentSerialId})`);
      setNotification({ type: 'success', text: '請假申請已提交代理人確認' });
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '', attachmentName: '', attachmentData: null, sharedWith: [] }));
      setShareDept(''); setShareEmp('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '送出失敗，請檢查網路連線' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要刪除申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { try { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); await onLogAction(userSession, '單據撤銷', `刪除請假單 (${withdrawTarget.serialId})`); setNotification({ type: 'success', text: '已成功刪除' }); setWithdrawTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '刪除失敗' }); } }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認刪除</button></div>
          </div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Undo2 size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要辦理銷假？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{cancelTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">返回</button><button onClick={async () => { try { await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行銷假' }) }); await onLogAction(userSession, '單據撤銷', `撤銷請假申請 (${cancelTarget.serialId})`); setNotification({ type: 'success', text: '已成功銷假' }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '銷假失敗' }); } }} className="flex-1 py-3 font-black text-white bg-slate-700 rounded-xl text-white">確認銷假</button></div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-emerald-500 px-8 py-10 text-white relative flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white">請假申請單</h1><p className="text-sm opacity-80">填寫申請時段與具體理由</p></div>
          <div className="bg-white/10 px-4 py-2 rounded-full font-mono font-bold text-xs"><span className="opacity-70 mr-1">NO.</span>{currentSerialId}</div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">員編</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">姓名</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">部門</label><select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value, substitute: ''})}><option value="" disabled>選擇部門</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">職稱</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">假別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">代理人</label><select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={formData.substitute} onChange={e=>setFormData({...formData, substitute:e.target.value})}><option value="" disabled>選擇代理人</option>{availableSubstitutes.map(emp => (<option key={emp.empId} value={emp.name}>{emp.name}</option>))}</select></div>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5"><label className="text-xs font-bold text-emerald-600 mb-2 font-black">開始時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5"><label className="text-xs font-bold text-rose-500 mb-2 font-black">結束時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 w-16 sm:w-20 rounded-xl border font-bold bg-white" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-emerald-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black"><span className="text-[9px] opacity-80 uppercase">總時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">請假理由</label><textarea required rows="3" className="w-full p-4 rounded-xl border bg-white font-bold focus:ring-4 focus:ring-emerald-50" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={12}/> 開放檢視權限 (選填)</label>
              <div className="flex gap-2">
                <select className="flex-1 p-3 rounded-xl border bg-white font-bold text-sm" value={shareDept} onChange={e => { setShareDept(e.target.value); setShareEmp(''); }}><option value="">-- 部門 --</option>{availableDepts.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select className="flex-1 p-3 rounded-xl border bg-white font-bold text-sm" value={shareEmp} onChange={e => setShareEmp(e.target.value)} disabled={!shareDept}><option value="">-- 員工 --</option>{employees.filter(emp => emp.dept === shareDept && emp.empId !== userSession.empId).map(emp => (<option key={emp.empId} value={emp.empId}>{emp.name}</option>))}</select>
                <button type="button" onClick={() => { if (shareEmp && !formData.sharedWith.includes(shareEmp)) { setFormData({...formData, sharedWith: [...formData.sharedWith, shareEmp]}); setShareEmp(''); } }} disabled={!shareEmp} className="px-6 bg-slate-800 text-white rounded-xl font-bold text-sm">加入</button>
              </div>
              {formData.sharedWith.length > 0 && (<div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 border rounded-xl">{formData.sharedWith.map(id => { const emp = employees.find(e => e.empId === id); return (<span key={id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold shadow-sm">{emp ? emp.name : id}<button type="button" onClick={() => setFormData({...formData, sharedWith: formData.sharedWith.filter(v => v !== id)})} className="text-slate-400 hover:text-rose-500 ml-1"><X size={14} /></button></span>); })}</div>)}
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">證明文件</label><div onClick={() => fileInputRef.current?.click()} className="w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer"><UploadCloud size={24} className="text-slate-400" /><span className="font-bold text-sm">{formData.attachmentName || '點擊上傳'}</span><input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" /></div></div>
          </div>
          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>

      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近 10 筆請假紀錄</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-left whitespace-nowrap"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500"><tr><th className="p-4 px-6">單號</th><th className="p-4">部門</th><th className="p-4">假別</th><th className="p-4">時段</th><th className="p-4">時數</th><th className="p-4 text-right">狀態/操作</th></tr></thead><tbody className="divide-y divide-slate-100">
          {recentSubmissions.slice(0, 10).map(r => (<tr key={r.id} className="hover:bg-slate-50">
            <td className="p-4 px-6 font-mono font-bold text-slate-600">{r.serialId}</td>
            <td className="p-4 font-bold text-slate-700">{r.dept}</td>
            <td className="p-4 font-black text-[11px] text-slate-700">{LEAVE_CATEGORIES.find(c => c.id === r.category)?.label}</td>
            <td className="p-4 font-bold text-[11px] text-slate-600">{r.startDate}</td>
            <td className="p-4 font-black text-slate-900">{r.totalHours}H</td>
            <td className="p-4 text-right flex justify-end items-center gap-2">
              <StatusBadge status={r.status} />
              {r.status.startsWith('pending') && (<button onClick={() => setWithdrawTarget(r)} className="px-3 py-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-md text-[10px] font-black transition-colors">刪除</button>)}
              {r.status === 'approved' && (<button onClick={() => setCancelTarget(r)} className="px-3 py-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-md text-[10px] font-black transition-colors">抽單</button>)}
              <button onClick={() => onShowFlow(r)} className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors"><Eye size={14}/> 檢視</button>
            </td>
          </tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
};

const InquiryView = ({ records, userSession, onShowFlow }) => {
  const [filters, setFilters] = useState({ formType: '', serialId: '', status: '', startDate: '', endDate: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const results = records.filter(r => {
      const isApplicant = r.empId === userSession.empId;
      const isRoot = userSession.empId === 'root';
      const isSharedWithMe = r.sharedWith && r.sharedWith.split(',').includes(userSession.empId);
      if (!isRoot && !isApplicant && !isSharedWithMe) return false;
      if (filters.formType && r.formType !== filters.formType) return false;
      if (filters.serialId && r.serialId && !r.serialId.toLowerCase().includes(filters.serialId.toLowerCase())) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.startDate && r.startDate < filters.startDate) return false;
      if (filters.endDate && r.startDate > filters.endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setSearchResults(results); setHasSearched(true);
  };

  const handleReset = () => { setFilters({ formType: '', serialId: '', status: '', startDate: '', endDate: '' }); setSearchResults([]); setHasSearched(false); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-fuchsia-500 px-8 py-10 text-white flex justify-between items-center"><div><h1 className="text-2xl font-black">申請單據查詢</h1><p className="text-sm opacity-90 italic">設定條件查詢單據</p></div><Search size={40} className="opacity-30" /></div>
        <form onSubmit={handleSearch} className="p-8 border-b bg-slate-50/50 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">類型</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={filters.formType} onChange={e => setFilters({...filters, formType: e.target.value})}><option value="">全部</option><option value="加班">加班</option><option value="請假">請假</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">單號包含</label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={filters.serialId} onChange={e => setFilters({...filters, serialId: e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">狀態</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="">全部</option><option value="approved">已核准</option><option value="pending">簽核中</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">起</label><input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">迄</label><input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={handleReset} className="px-6 py-3 rounded-xl font-bold bg-slate-200">清除重設</button><button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-fuchsia-500 shadow-md">查詢</button></div>
        </form>
        <div className="p-8 space-y-4">
          {!hasSearched ? <div className="py-24 text-center text-slate-400 font-bold">請點擊查詢</div> : searchResults.length > 0 ? searchResults.map(r => (
            <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border flex items-center justify-between">
              <div><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{r.formType}</span><p className="font-bold mt-1">{r.name}</p><p className="font-mono font-bold text-fuchsia-600">{r.serialId}</p></div>
              <div className="flex gap-2 items-center">
                <StatusBadge status={r.status} />
                <button onClick={() => onShowFlow(r)} className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors"><Eye size={14}/> 檢視</button>
              </div>
            </div>
          )) : <div className="py-24 text-center text-slate-400 italic font-bold">查無單據</div>}
        </div>
      </div>
    </div>
  );
};

const ChangePasswordView = ({ userSession, setNotification, onLogout, onRefresh, onLogAction }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
  const [shows, setShows] = useState({ cur: false, new: false, con: false });
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (userSession.empId === 'root') return setNotification({ type: 'error', text: '管理員無法修改' });
    if (formData.new !== formData.confirm) return setNotification({ type: 'error', text: '密碼不符' });
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PATCH', headers: fetchOptions.headers, body: JSON.stringify({ password: formData.new.trim() }) });
      if (res.ok) { await onLogAction(userSession, '密碼變更', '變更密碼'); setNotification({ type: 'success', text: '更新成功，登出中...' }); setTimeout(onLogout, 2000); }
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-6 text-left font-sans">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden"><div className="bg-slate-700 p-8 text-white flex justify-between items-center"><div><h1 className="text-2xl font-black">密碼變更</h1></div><KeyRound size={40} className="opacity-30" /></div>
        <form onSubmit={handleUpdate} className="p-10 space-y-6 max-w-lg mx-auto py-16">
          <PassInput label="原密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
          <PassInput label="新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
          <PassInput label="確認密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={(k)=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
          <button disabled={loading} className="w-full py-5 bg-slate-700 text-white rounded-2xl font-black shadow-xl">儲存</button>
        </form>
      </div>
    </div>
  );
};

const SubstituteView = ({ records, onRefresh, setNotification, userSession, onLogAction, employees, onShowFlow }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const pendingRecords = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name), [records, userSession.name]);
  const handleUpdate = async (status) => {
    if (!selectedId) return;
    const selectedRecord = pendingRecords.find(r => r.id === selectedId);
    let targetStatus = status;
    if (status === 'pending_manager') {
        const applicant = employees.find(emp => emp.empId === selectedRecord.empId);
        if (applicant?.jobTitle === '總經理') targetStatus = 'pending_assignment';
        else if (applicant?.jobTitle === '協理') targetStatus = 'pending_gm';
        else if (["經理", "副理"].includes(applicant?.jobTitle)) targetStatus = 'pending_director';
        else targetStatus = 'pending_manager';
    }
    try {
      await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: targetStatus, opinion }) });
      await onLogAction(userSession, '代理確認', `處理單據`); setNotification({ type: 'success', text: '完成' }); setSelectedId(null); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '異常' }); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden text-left">
        <div className="bg-amber-500 p-8 text-white flex justify-between items-center text-left"><div><h1 className="text-2xl font-black">代理確認中心</h1></div><UserCheck size={40} className="opacity-30" /></div>
        <div className="p-8 space-y-4 text-left">
          {pendingRecords.map(r => (
            <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-5 rounded-2xl border cursor-pointer ${selectedId === r.id ? 'bg-amber-50 border-amber-300' : 'bg-slate-50'}`}>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 ${selectedId === r.id ? 'bg-amber-600 border-amber-600' : 'border-slate-300'}`}></div>
                <div><p className="text-[10px] font-black text-slate-400">申請人</p><p className="font-black text-slate-800">{r.name}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">單號</p><p className="font-mono text-xs">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">時間</p><p className="font-bold text-xs">{r.startDate}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">時數</p><p className="font-black">{r.totalHours} HR</p></div>
                <div className="flex gap-2 items-center">
                  <StatusBadge status={r.status} />
                  <button onClick={(e) => { e.stopPropagation(); onShowFlow(r); }} className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors"><Eye size={14}/> 檢視</button>
                </div>
              </div>
            </div>
          ))}
          {pendingRecords.length === 0 && <div className="py-12 text-center text-slate-300 italic">目前無待確認任務</div>}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 p-8 flex gap-8 text-left">
          <div className="flex-1 space-y-4"><div className="text-amber-600 font-black text-sm">代理人回覆</div><textarea className="w-full p-5 bg-slate-50 rounded-xl" value={opinion} onChange={(e) => setOpinion(e.target.value)} /></div>
          <div className="w-72 flex flex-col justify-end gap-3"><div className="grid grid-cols-2 gap-3"><button onClick={() => handleUpdate('rejected')} className="py-4 bg-rose-50 text-rose-600 rounded-xl font-black">拒絕</button><button onClick={() => handleUpdate('pending_manager')} className="py-4 bg-emerald-50 text-emerald-600 rounded-xl font-black">同意</button></div></div>
        </div>
      )}
    </div>
  );
};

const ApprovalView = ({ records, onRefresh, setNotification, userSession, employees, onLogAction, onShowFlow }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const pendingRecords = useMemo(() => records.filter(r => canManagerApproveRecord(userSession, r, employees)), [records, userSession, employees]);

  const handleUpdate = async (status) => {
    if (!selectedId) return;
    let targetStatus = status;
    if (status === 'approved') {
        const r = pendingRecords.find(x=>x.id===selectedId);
        const applicant = employees.find(emp => emp.empId === r.empId);
        const days = (parseFloat(r.totalHours) || 0) / 8;
        const isUnitManager = ["經理", "副理"].includes(applicant?.jobTitle);
        if (r.formType === '請假') {
            if (r.status === 'pending_manager' || r.status === 'pending') { if (days > 3) targetStatus = 'pending_director'; else targetStatus = 'pending_assignment'; }
            else if (r.status === 'pending_director') { if (isUnitManager && days >= 1) targetStatus = 'pending_gm'; else if (days > 5) targetStatus = 'pending_gm'; else targetStatus = 'pending_assignment'; }
            else if (r.status === 'pending_gm') { targetStatus = 'pending_assignment'; }
            else if (r.status === 'pending_assignment') { targetStatus = 'approved'; }
        } else {
            if (['pending', 'pending_manager', 'pending_director', 'pending_gm'].includes(r.status)) targetStatus = 'pending_assignment';
            else if (r.status === 'pending_assignment') targetStatus = 'approved';
        }
    }
    try {
      await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: targetStatus, opinion }) });
      await onLogAction(userSession, '主管簽核', `核准單據`); setNotification({ type: 'success', text: '簽核完成' }); setSelectedId(null); setOpinion(''); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); }
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden"><div className="bg-indigo-600 p-8 text-white flex justify-between"><div><h1 className="text-2xl font-black">審核中心</h1></div><ShieldCheck size={40} className="opacity-40" /></div>
        <div className="p-8 space-y-4">
          {pendingRecords.map(r => (
            <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-5 rounded-2xl border cursor-pointer ${selectedId === r.id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50'}`}>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 ${selectedId === r.id ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}></div>
                <div><p className="text-[10px] font-black text-slate-400">申請人</p><p className="font-black text-slate-800">{r.name}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">單號</p><p className="font-mono text-xs">{r.serialId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">時間</p><p className="font-bold text-xs">{r.startDate}</p></div>
                <div><p className="text-[10px] font-black text-slate-400">時數</p><p className="font-black">{r.totalHours} HR</p></div>
                <div className="flex gap-2 items-center">
                  <StatusBadge status={r.status} />
                  <button onClick={(e) => { e.stopPropagation(); onShowFlow(r); }} className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors"><Eye size={14}/> 檢視</button>
                </div>
              </div>
            </div>
          ))}
          {pendingRecords.length === 0 && <div className="py-12 text-center text-slate-300 italic">目前無待簽核申請單</div>}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-200 p-8 flex gap-8 text-left">
          <div className="flex-1 space-y-4"><div className="text-indigo-600 font-black text-sm">簽核意見</div><textarea className="w-full p-5 rounded-2xl bg-slate-50" value={opinion} onChange={(e) => setOpinion(e.target.value)} /></div>
          <div className="w-72 flex flex-col justify-end gap-3"><div className="grid grid-cols-2 gap-3"><button onClick={() => handleUpdate('rejected')} className="py-4 bg-rose-50 text-rose-600 rounded-xl font-black">駁回</button><button onClick={() => handleUpdate('approved')} className="py-4 bg-emerald-50 text-emerald-600 rounded-xl font-black">核准</button></div></div>
        </div>
      )}
    </div>
  );
};

const PersonnelManagement = ({ employees, onRefresh, setNotification, userSession, availableDepts, onLogAction }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '', gender: '', birthDate: '', hireDate: '' });
  const [editingId, setEditingId] = useState(null);
  const handleExport = () => { if (window.XLSX) { const ws = window.XLSX.utils.json_to_sheet(employees); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Employees"); window.XLSX.writeFile(wb, `employees.xlsx`); } };
  return (
    <div className="bg-white rounded-3xl shadow-xl border overflow-hidden font-sans">
      <div className="bg-teal-600 p-8 text-white flex justify-between"><div><h1 className="text-2xl font-black">人員管理</h1></div><Users size={40} className="opacity-40" /></div>
      <div className="p-8"><button onClick={handleExport} className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded">匯出</button></div>
      <div className="p-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 font-black"><tr><th className="p-4">員編</th><th className="p-4">姓名</th><th className="p-4">部門</th></tr></thead><tbody>{employees.map(e=>(<tr key={e.id} className="border-t"><td className="p-4">{e.empId}</td><td className="p-4">{e.name}</td><td className="p-4">{e.dept}</td></tr>))}</tbody></table></div>
    </div>
  );
};

const AnnouncementManagement = ({ announcements, setAnnouncements, setNotification, userSession, onLogAction }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border overflow-hidden font-sans">
      <div className="bg-rose-500 p-8 text-white flex justify-between"><div><h1 className="text-2xl font-black">公告維護</h1></div><Megaphone size={40} className="opacity-40" /></div>
      <div className="p-8"><div className="divide-y">{announcements.map(a=>(<div key={a.id} className="p-4"><p className="font-bold">{a.title}</p></div>))}</div></div>
    </div>
  );
};

const SystemLogView = ({ sysLogs }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border overflow-hidden font-sans">
      <div className="bg-slate-800 p-8 text-white flex justify-between"><div><h1 className="text-2xl font-black">操作日誌</h1></div><Activity size={40} className="opacity-40" /></div>
      <div className="p-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 font-black"><tr><th className="p-4">時間</th><th className="p-4">操作者</th><th className="p-4">內容</th></tr></thead><tbody>{sysLogs.map(l=>(<tr key={l.id} className="border-t"><td className="p-4">{new Date(l.createdAt).toLocaleString()}</td><td className="p-4">{l.name}</td><td className="p-4">{l.details}</td></tr>))}</tbody></table></div>
    </div>
  );
};

// --- App Component ---

const App = () => {
  const [activeMenu, setActiveMenu] = useState('welcome');
  const [records, setRecords] = useState([]);
  const [sysLogs, setSysLogs] = useState([]); 
  const [employees, setEmployees] = useState([]);
  const [viewingFlow, setViewingFlow] = useState(null); 
  const [announcements, setAnnouncements] = useState([
    { id: 1, type: 'policy', title: '2026年員工旅遊補助辦法', date: '2026-04-15', endDate: '2026-05-15', isNew: true, content: '最新旅遊補助已發布。' }
  ]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(() => JSON.parse(sessionStorage.getItem('docflow_user_session') || 'null'));
  const [readAnns, setReadAnns] = useState([]);

  useEffect(() => {
    if (userSession) { sessionStorage.setItem('docflow_user_session', JSON.stringify(userSession)); setReadAnns(JSON.parse(localStorage.getItem(`readAnns_${userSession.empId}`) || '[]')); }
    else { sessionStorage.removeItem('docflow_user_session'); }
  }, [userSession]);

  const markAnnAsRead = (annId) => { if (!userSession) return; setReadAnns(prev => { if (prev.includes(annId)) return prev; const next = [...prev, annId]; localStorage.setItem(`readAnns_${userSession.empId}`, JSON.stringify(next)); return next; }); };

  const handleLogAction = async (user, type, details) => {
    if (!user?.empId) return;
    try { await fetch(`${NGROK_URL}/api/logs`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ serialId: `LOG-${Date.now()}`, formType: '系統日誌', empId: user.empId, name: user.name, dept: user.dept || '系統', actionType: type, details: details, createdAt: new Date().toISOString() }) }); }
    catch (e) { console.warn('Log error'); }
  };

  const fetchData = async () => { 
    try { 
      setLoading(true); setApiError(false);
      const [resEmp, resRec, resLogs] = await Promise.all([ 
        fetch(`${NGROK_URL}/api/employees?_t=${Date.now()}`, { ...fetchOptions, cache: 'no-store' }).then(r => r.ok ? r.json() : []), 
        fetch(`${NGROK_URL}/api/records?_t=${Date.now()}`, { ...fetchOptions, cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        fetch(`${NGROK_URL}/api/logs?_t=${Date.now()}`, { ...fetchOptions, cache: 'no-store' }).then(r => r.ok ? r.json() : []) 
      ]); 
      
      setEmployees(resEmp); setRecords(resRec); setSysLogs(resLogs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
    } catch (err) { setApiError(true); } finally { setLoading(false); }
  };
  
  useEffect(() => { fetchData(); }, []);

  const availableDepts = useMemo(() => [...new Set(employees.map(e => e.dept).filter(Boolean))], [employees]);
  const isAdmin = useMemo(() => userSession && (userSession.empId === 'root' || userSession.empId === '9002' || ADMIN_TITLES.includes(userSession.jobTitle)), [userSession]);
  
  const otSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g, '')}-OT${String(records.filter(r=>r.serialId?.includes('OT')).length + 1).padStart(3, '0')}`, [records]);
  const leaveSerialId = useMemo(() => `${new Date().toISOString().split('T')[0].replace(/-/g, '')}-LV${String(records.filter(r=>r.serialId?.includes('LV')).length + 1).padStart(3, '0')}`, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-12 h-12 text-sky-500" /></div>;
  if (!userSession) return <LoginView employees={employees} apiError={apiError} onLogAction={handleLogAction} onLogin={u=>{ setUserSession(u); setActiveMenu('welcome'); fetchData(); }} />;

  return (
    <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden text-left">
      {notification && (<div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border bg-white ${notification.type==='success'?'border-emerald-200 text-emerald-700':'border-rose-200 text-rose-700'}`}>{notification.text}</div>)}
      {viewingFlow && <WorkflowModal record={viewingFlow} employees={employees} onClose={() => setViewingFlow(null)} />}
      
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col shadow-sm shrink-0 z-20 text-left">
        <div onClick={() => setActiveMenu('welcome')} className="flex items-center gap-4 mb-10 text-sky-500 cursor-pointer"><div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20"><LayoutDashboard size={24} /></div><h2 className="font-black text-xl tracking-tight">員工服務平台</h2></div>
        <nav className="space-y-2 flex-grow overflow-y-auto text-left">
          <button onClick={() => setActiveMenu('welcome')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'welcome' ? 'bg-sky-50 text-sky-600 border-l-4 border-sky-600' : 'text-slate-400 hover:bg-slate-50'}`}><Sparkles size={20} /> 首頁總覽</button>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'overtime' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600' : 'text-slate-400 hover:bg-slate-50'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('substitute')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'substitute' ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}><UserCheck size={20} /> 代理確認</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'integrated-query' ? 'bg-fuchsia-50 text-fuchsia-600 border-l-4 border-fuchsia-600' : 'text-slate-400 hover:bg-slate-50'}`}><ClipboardList size={20} /> 單據查詢</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2">管理功能</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><ShieldCheck size={20} /> 簽核中心</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-left ${activeMenu === 'personnel' ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}><Users size={20} /> 人員管理</button>
            </>
          )}
        </nav>
        <div className="mt-auto pt-6 border-t space-y-4">
          <div className="p-4 bg-slate-50 rounded-3xl border flex items-center gap-3">
            <div className="min-w-[40px] h-10 bg-sky-100 rounded-2xl flex items-center justify-center font-black text-sky-600 text-[10px] uppercase">{userSession.dept?.substring(0,2)}</div>
            <div className="overflow-hidden text-left"><p className="text-xs font-black truncate">{userSession.name}</p><p className="text-[10px] text-slate-400 font-mono font-bold">{userSession.empId}</p></div>
          </div>
          <button onClick={() => setUserSession(null)} className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"><LogOut size={20} /> 登出</button>
        </div>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto bg-slate-50 text-left">
        <div className="max-w-7xl mx-auto space-y-12 text-left">
          {activeMenu === 'welcome' && <WelcomeView userSession={userSession} records={records} onRefresh={fetchData} setActiveMenu={setActiveMenu} isAdmin={isAdmin} announcements={announcements} employees={employees} readAnns={readAnns} markAnnAsRead={markAnnAsRead} onShowFlow={setViewingFlow} />}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} onLogAction={handleLogAction} onShowFlow={setViewingFlow} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} records={records} availableDepts={availableDepts} onLogAction={handleLogAction} onShowFlow={setViewingFlow} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} onShowFlow={setViewingFlow} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} employees={employees} onLogAction={handleLogAction} onShowFlow={setViewingFlow} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} onLogAction={handleLogAction} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} setNotification={setNotification} onLogout={()=>setUserSession(null)} onRefresh={fetchData} onLogAction={handleLogAction} />}
          {activeMenu === 'substitute' && <SubstituteView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} onLogAction={handleLogAction} employees={employees} onShowFlow={setViewingFlow} />}
        </div>
      </main>
    </div>
  );
};

export default App;