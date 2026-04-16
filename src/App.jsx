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

// --- 特休計算 Helpers (包含預警計算與動態簽核路由邏輯) ---
const getNextAnniversary = (hireDateStr) => {
  if (!hireDateStr) return null;
  const hireDate = new Date(hireDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 歸零時間以精準比較日期
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
  // 依勞基法規定
  if (years >= 10) days = 15 + (years - 9);
  else if (years >= 5) days = 15;
  else if (years >= 3) days = 14;
  else if (years >= 2) days = 10;
  else if (years >= 1) days = 7;
  else days = 3;
  if (days > 30) days = 30; // 勞基法上限30天
  return days * 8; // 轉換為小時
};

// 計算單一員工的特休與補休結餘
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

// 簽核路由規則引擎：判斷指定單據是否應由目前的主管簽核
const canManagerApproveRecord = (userSession, r, employees) => {
  if (r.status !== 'pending_manager' && r.status !== 'pending') return false;
  if (!userSession) return false;
  if (userSession.empId === 'root') return true;

  const applicant = employees.find(emp => emp.empId === r.empId);

  // 請假申請的層級判斷
  if (r.formType === '請假') {
    const days = (parseFloat(r.totalHours) || 0) / 8;
    const isApplicantManager = ["協理", "經理", "副理"].includes(applicant?.jobTitle);
    let targetLevel = '';

    if (isApplicantManager && days >= 1) {
      targetLevel = '總經理'; // 單位主管一天(含)以上由總經理核定
    } else if (days > 5) {
      targetLevel = '總經理'; // 請假天數5日以上
    } else if (days > 3 && days <= 5) {
      targetLevel = '協理'; // 請假天數5日(含)以下
    } else {
      targetLevel = '經副理'; // 請假天數3日(含)以下
    }

    if (targetLevel === '總經理') {
      return userSession.jobTitle === '總經理';
    }
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
    // 加班及其他單據維持原有的跨部門兼管與部門簽核邏輯
    if (userSession.jobTitle === '總經理') {
      return applicant?.jobTitle === '協理';
    }
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
  const styles = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
    pending_substitute: "bg-amber-50 text-amber-700 border-amber-100",
    pending_manager: "bg-indigo-50 text-indigo-700 border-indigo-100",
    pending: "bg-indigo-50 text-indigo-700 border-indigo-100", // 相容舊資料
    canceled: "bg-slate-100 text-slate-500 border-slate-200"
  };
  const labels = { 
    approved: "已核准", 
    rejected: "已駁回", 
    pending_substitute: "待代理確認",
    pending_manager: "待主管簽核",
    pending: "待簽核",
    canceled: "已撤銷"
  };
  const currentStyle = styles[status] || styles.pending;
  const currentLabel = labels[status] || labels.pending;
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${currentStyle} whitespace-nowrap`}>{currentLabel}</span>;
};

const PassInput = ({ label, value, field, showKey, Icon, shows, onToggle, onChange }) => (
  <div className="space-y-1 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={shows[showKey] ? 'text' : 'password'} 
        required 
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 transition-all text-left [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
        value={value} 
        onChange={e => onChange(field, e.target.value)} 
      />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
        {shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

// --- View Components ---

const WelcomeView = ({ userSession, records, onRefresh, setActiveMenu, isAdmin, announcements, employees }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  const substituteCount = useMemo(() => {
    return records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name).length;
  }, [records, userSession.name]);

  const managerCount = useMemo(() => {
    if (!isAdmin) return 0;
    return records.filter(r => canManagerApproveRecord(userSession, r, employees)).length;
  }, [records, userSession, isAdmin, employees]);

  const processingOtCount = useMemo(() => {
    return records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '加班' && (r.status === 'pending' || r.status === 'pending_manager')).length;
  }, [records, userSession.empId]);

  const processingLvCount = useMemo(() => {
    return records.filter(r => (userSession.empId === 'root' || r.empId === userSession.empId) && r.formType === '請假' && (r.status === 'pending' || r.status === 'pending_substitute' || r.status === 'pending_manager')).length;
  }, [records, userSession.empId]);

  const { totalAnnual, remainAnnual, usedAnnual, remainComp, earnedComp, usedComp } = useMemo(() => {
    return calculatePTOStats(userSession.empId, userSession.hireDate, records);
  }, [records, userSession.empId, userSession.hireDate]);

  const userWarningStatus = useMemo(() => {
    if (!userSession.hireDate) return null;
    const nextAnniv = getNextAnniversary(userSession.hireDate);
    if (!nextAnniv) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = getDaysDiff(today, nextAnniv);
    
    const projectedNewPTO = getProjectedPTO(userSession.hireDate, nextAnniv);
    const projectedTotal = remainAnnual + projectedNewPTO;
    
    if (projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0) {
      return {
        active: true,
        daysLeft,
        projectedTotal,
        overHours: projectedTotal - 240,
        nextAnnivStr: nextAnniv.toISOString().split('T')[0]
      };
    }
    return null;
  }, [userSession.hireDate, remainAnnual]);

  const teamWatchlist = useMemo(() => {
    if (!isAdmin) return [];
    
    const team = employees.filter(emp => {
      if (emp.empId === userSession.empId) return false; 
      if (userSession.empId === 'root') return true;
      if (userSession.jobTitle === '總經理') return emp.jobTitle === '協理';
      if (userSession.jobTitle === '協理') {
        if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(emp.dept);
        if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept);
      }
      return emp.dept === userSession.dept;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return team.map(emp => {
      const stats = calculatePTOStats(emp.empId, emp.hireDate, records);
      const nextAnniv = getNextAnniversary(emp.hireDate);
      if (!nextAnniv) return null;
      
      const daysLeft = getDaysDiff(today, nextAnniv);
      const projectedNew = getProjectedPTO(emp.hireDate, nextAnniv);
      const projectedTotal = stats.remainAnnual + projectedNew;

      if (projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0) {
        return {
          ...emp,
          remainAnnual: stats.remainAnnual,
          projectedTotal,
          daysLeft,
          nextAnnivStr: nextAnniv.toISOString().split('T')[0],
          overHours: projectedTotal - 240
        };
      }
      return null;
    }).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [isAdmin, employees, records, userSession]);

  const activeAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return announcements.filter(ann => !ann.endDate || ann.endDate >= todayStr);
  }, [announcements]);

  const displayAnnouncements = activeAnnouncements.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-left font-sans relative">
      
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass || ANNOUNCEMENT_TYPES[0].colorClass}`}>
                  {ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date} 發布</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6 leading-snug">{selectedAnnouncement.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedAnnouncement.content || '此公告目前沒有詳細內文。'}
              </div>
            </div>
          </div>
        </div>
      )}

      {userWarningStatus && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-2xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-rose-100 rounded-full shrink-0 animate-pulse mt-0.5">
            <AlertTriangle className="text-rose-600" size={24} />
          </div>
          <div>
            <h3 className="text-rose-800 font-black text-lg flex items-center gap-2">
              特休時數超標預警 <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">倒數 {userWarningStatus.daysLeft} 天</span>
            </h3>
            <p className="text-rose-700 mt-1.5 text-sm font-medium leading-relaxed">
              您的到職週年日 (<span className="font-bold">{userWarningStatus.nextAnnivStr}</span>) 即將到來。
              預計發放新特休後將達 <span className="font-bold">{userWarningStatus.projectedTotal} 小時</span>，超過 240 小時之規定上限。
              <strong className="block mt-1 text-rose-900 bg-rose-200/50 inline-block px-2 py-0.5 rounded">屆時超過之 {userWarningStatus.overHours} 小時將自動歸零，請盡速安排休假，以免影響權益。</strong>
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl shadow-xl overflow-hidden text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-300/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="bg-slate-50/80 border-b border-slate-100 p-5 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-rose-500" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">最新公告</h2>
          </div>
          {activeAnnouncements.length > 5 && (
            <button onClick={() => setActiveMenu('announcement-list')} className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight size={12} />
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {displayAnnouncements.length > 0 ? displayAnnouncements.map(ann => {
            const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
            return (
            <div 
              key={ann.id} 
              onClick={() => setSelectedAnnouncement(ann)}
              className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>
                  {typeInfo.label}
                </span>
                {ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}
              </div>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-sky-600 transition-colors truncate">{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date} 發布</span>
            </div>
            );
          }) : (
            <div className="p-8 text-center text-slate-400 text-sm font-bold italic">目前無最新公告</div>
          )}
          {activeAnnouncements.length > 5 && (
            <div 
              onClick={() => setActiveMenu('announcement-list')} 
              className="p-4 bg-slate-50/50 hover:bg-yellow-50 transition-colors cursor-pointer text-center group border-t border-slate-100"
            >
              <span className="text-xs font-bold text-slate-500 group-hover:text-yellow-600 flex items-center justify-center gap-1.5">
                前往資訊公告查看全部 {activeAnnouncements.length} 則公告 <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CalendarDays size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特休餘額</p>
                {userWarningStatus && <AlertTriangle size={14} className="text-rose-500 animate-bounce" title="即遇到期" />}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${userWarningStatus ? 'text-rose-600' : 'text-slate-800'}`}>
                  {userSession.hireDate ? remainAnnual : '-'}
                </span>
                <span className="text-sm font-bold text-slate-500">HR</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${userSession.hireDate ? 'text-slate-500 bg-slate-100' : 'text-rose-500 bg-rose-50'}`}>
              {userSession.hireDate ? `總額度 ${totalAnnual} HR` : '請先設定到職日'}
            </span>
            {userSession.hireDate && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">已休 {usedAnnual} HR</span>}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <Timer size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">補休餘額</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800">{remainComp}</span>
                <span className="text-sm font-bold text-slate-500">HR</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">總累計 {earnedComp} HR</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">已用 {usedComp} HR</span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-6`}>
        
        <div 
          onClick={() => setActiveMenu && setActiveMenu('substitute')}
          className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer active:scale-[0.98] h-full"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
              <UserCheck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">待代理確認</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800">{substituteCount}</span>
                <span className="text-sm font-bold text-slate-500">件</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"><ArrowRight size={12}/> 前往確認</span>
          </div>
        </div>

        {isAdmin && (
          <div 
            onClick={() => setActiveMenu && setActiveMenu('approval')}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.98] h-full"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">待主管簽核</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-800">{managerCount}</span>
                  <span className="text-sm font-bold text-slate-500">件</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1"><ArrowRight size={12}/> 前往簽核</span>
            </div>
          </div>
        )}

        <div className={`bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 sm:gap-6 hover:shadow-md transition-shadow h-full ${!isAdmin ? 'md:col-span-1' : ''}`}>
          <div className="flex flex-col items-center justify-center gap-3 shrink-0 sm:pr-6 sm:border-r border-slate-100">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl">
              <FileText size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">進度查詢</p>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 w-full">
            <div 
              onClick={() => setActiveMenu && setActiveMenu('overtime')}
              className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl py-3 px-5 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.98]"
            >
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 group-hover:text-blue-600">
                加班處理中 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-1"/>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800 group-hover:text-blue-600">{processingOtCount}</span>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-500">件</span>
              </div>
            </div>
            <div 
              onClick={() => setActiveMenu && setActiveMenu('leave-apply')}
              className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-2xl py-3 px-5 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.98]"
            >
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 group-hover:text-emerald-600">
                請假處理中 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-1"/>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800 group-hover:text-emerald-600">{processingLvCount}</span>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增：主管專屬團隊特休預警清單 */}
      {isAdmin && teamWatchlist.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl border border-rose-200 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-rose-50 border-b border-rose-100 p-5 sm:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 rounded-xl text-white shadow-sm">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-rose-900 uppercase tracking-widest">團隊特休超標關注名單</h2>
                <p className="text-xs text-rose-600 mt-0.5 font-bold">未來 90 天內即將發放特休且預估超標之人員，請盡速督促排休</p>
              </div>
            </div>
            <span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
              需關注 {teamWatchlist.length} 人
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-4 px-8">員工姓名 / 單位</th>
                  <th className="p-4">發放日 / 倒數</th>
                  <th className="p-4 text-right">目前結餘</th>
                  <th className="p-4 text-right">預測總計</th>
                  <th className="p-4 text-right px-8">預計歸零</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamWatchlist.map(emp => (
                  <tr key={emp.id} className="hover:bg-rose-50/50 transition-colors">
                    <td className="p-4 px-8">
                      <div className="font-bold text-slate-800">{emp.name} <span className="font-mono text-[11px] text-slate-400 ml-1 font-medium">({emp.empId})</span></div>
                      <div className="text-[10px] text-slate-500 font-bold">{emp.dept} / {emp.jobTitle}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{emp.nextAnnivStr}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${emp.daysLeft <= 30 ? 'text-rose-600' : 'text-amber-600'}`}>
                        倒數 {emp.daysLeft} 天
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-600">{emp.remainAnnual} HR</td>
                    <td className="p-4 text-right font-black text-rose-600">{emp.projectedTotal} HR</td>
                    <td className="p-4 px-8 text-right">
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm border border-rose-200">
                        -{emp.overHours} HR
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementListView = ({ announcements }) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const activeAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return announcements.filter(ann => !ann.endDate || ann.endDate >= todayStr);
  }, [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans relative">
      
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.colorClass || ANNOUNCEMENT_TYPES[0].colorClass}`}>
                  {ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedAnnouncement.date} 發布</span>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl font-black text-slate-800 mb-6 leading-snug">{selectedAnnouncement.title}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedAnnouncement.content || '此公告目前沒有詳細內文。'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-yellow-300 px-8 py-10 text-yellow-950 flex justify-between items-center text-left">
          <div>
            <h1 className="text-2xl font-black text-yellow-950 text-left">資訊公告</h1>
            <p className="text-sm opacity-80 italic text-yellow-900 text-left">查看公司所有最新與歷史公告</p>
          </div>
          <Bell size={40} className="opacity-40 text-yellow-700" />
        </div>
        
        <div className="divide-y divide-slate-100">
          {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => {
            const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
            return (
            <div 
              key={ann.id} 
              onClick={() => setSelectedAnnouncement(ann)}
              className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>
                  {typeInfo.label}
                </span>
                {ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}
              </div>
              <p className="text-sm font-bold text-slate-700 flex-1 group-hover:text-yellow-600 transition-colors truncate">{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">{ann.date} 發布</span>
            </div>
            );
          }) : (
            <div className="p-16 text-center text-slate-400 text-sm font-bold italic">目前無任何公告資料</div>
          )}
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
        onLogin({
          id: 'root',
          empId: 'root',
          name: '系統管理員',
          jobTitle: '最高管理員',
          dept: '系統維護部',
          hireDate: fiveYearsAgo.toISOString() 
        });
      } else {
        setError('帳號或密碼不正確');
      }
      setLoading(false);
      return;
    }
    
    if (employees.length === 0) {
      setError('目前無法連線到資料庫，請確認後端伺服器已啟動。');
      setLoading(false);
      return;
    }

    try {
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      const validPassword = (user?.password && user.password !== "") ? user.password : user?.empId;
      
      if (user && validPassword === password.trim()) {
        // --- 登入成功：產生新的 sessionToken ---
        const newToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        try {
          // 為了避免 PATCH 被阻擋，改用最標準的 PUT 來更新整筆員工資料
          const updatedUser = { ...user, sessionToken: newToken };
          const res = await fetch(`${NGROK_URL}/api/employees/${user.id}`, {
            method: 'PATCH',
            headers: fetchOptions.headers,
            body: JSON.stringify({ sessionToken: newToken })
          });
          
          // 如果 PATCH 失敗，退回使用 PUT
          if (!res.ok) {
             await fetch(`${NGROK_URL}/api/employees/${user.id}`, {
               method: 'PUT',
               headers: fetchOptions.headers,
               body: JSON.stringify(updatedUser)
             });
          }
        } catch (postErr) {
          console.warn("SSO Token 寫入失敗，但已強制放行登入", postErr);
        }

        // 將 Token 綁定到當前 Session 狀態中
        onLogin({ ...user, sessionToken: newToken });
      } else { 
        setError('帳號或密碼不正確'); 
      }
    } catch (err) {
      setError('登入處理發生系統錯誤，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-sky-500 p-12 text-white text-center relative overflow-hidden">
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
          <button disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-sky-500 shadow-xl hover:bg-sky-600 active:scale-95 flex items-center justify-center gap-3 text-white transition-all">
            {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <CheckCircle size={20} />} 確認登入
          </button>
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
    let payHours = 0;
    const h = Number(totalHours);
    if (formData.category === 'rest') { // 休息日
      if (h <= 2) payHours = h * 1.34;
      else if (h <= 8) payHours = 2 * 1.34 + (h - 2) * 1.67;
      else payHours = 2 * 1.34 + 6 * 1.67 + (h - 8) * 2.67;
    } else if (formData.category === 'holiday') { // 國定假日
      if (h <= 8) payHours = 8;
      else if (h <= 10) payHours = 8 + (h - 8) * 1.34;
      else payHours = 8 + 2 * 1.34 + (h - 10) * 1.67;
    } else { // 一般上班日、出差
      if (h <= 2) payHours = h * 1.34;
      else payHours = 2 * 1.34 + (h - 2) * 1.67;
    }

    return {
      leave: h, 
      payStr: payHours > 0 ? (Math.round(payHours * 100) / 100).toFixed(2) : '0'
    };
  }, [totalHours, formData.category]);

  // 新增：計算當月已核准加班時數與防呆邏輯
  const currentMonthOTHours = useMemo(() => {
    if (!formData.startDate) return 0;
    const targetMonth = formData.startDate.substring(0, 7); // 取得 YYYY-MM 格式
    return records
      .filter(r => 
        r.formType === '加班' && 
        r.empId === formData.empId && 
        r.status === 'approved' && // 僅計算已核准的時數
        r.startDate && 
        r.startDate.substring(0, 7) === targetMonth
      )
      .reduce((sum, r) => sum + (parseFloat(r.totalHours) || 0), 0);
  }, [records, formData.startDate, formData.empId]);

  const projectedTotalHours = currentMonthOTHours + (Number(totalHours) || 0);
  const isOverLimit = projectedTotalHours > 46;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting || isOverLimit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records`, { 
        method: 'POST', 
        headers: fetchOptions.headers, 
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending_manager', createdAt: new Date().toISOString() }) 
      });
      if(!res.ok) throw new Error('API Error');
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '' }));
      setNotification({ type: 'success', text: '加班申請已送出' });
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '送出失敗，請檢查網路連線或後端伺服器' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要刪除申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { try { const res = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); if (!res.ok) throw new Error(); setNotification({ type: 'success', text: '已成功刪除單據' }); setWithdrawTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '刪除失敗，請檢查網路連線' }); } }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認刪除</button></div>
          </div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Undo2 size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要抽單 (撤銷核准)？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{cancelTarget.serialId}</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">返回</button>
              <button onClick={async () => { try { const res = await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行抽單撤銷' }) }); if (!res.ok) throw new Error(); setNotification({ type: 'success', text: '已成功撤銷該單據' }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '撤銷失敗，請檢查網路連線' }); } }} className="flex-1 py-3 font-black text-white bg-slate-700 rounded-xl text-white">確認撤銷</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
        <div className={`${appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500'} px-8 py-10 text-white relative transition-colors duration-500`}>
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
            <button type="button" onClick={() => setAppType('pre')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'pre' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><Timer size={20} />事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all duration-300 ${appType === 'post' ? 'bg-white text-orange-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}><History size={20} />事後補報</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-left">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">員編 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">姓名 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">部門 <HelpCircle size={10} className="text-slate-300" /></label>
              <select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})}>
                <option value="" disabled>請選擇部門</option>
                {availableDepts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">類別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{OT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 h-4">補償方式</label><div className="flex bg-slate-100 p-1 rounded-xl h-12"><button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='leave'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>換補休</button><button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType==='pay'?(appType==='pre'?'bg-blue-500':'bg-orange-500') + ' text-white shadow':'text-slate-500 hover:bg-slate-200'}`}>計薪</button></div></div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left text-slate-900">
            <div className="lg:col-span-4 text-left"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">開始時間</label><div className="flex gap-2 text-slate-900 text-left"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-4 text-left"><label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 font-black">結束時間</label><div className="flex gap-2 text-slate-900 text-left"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className={`${appType === 'pre' ? 'bg-blue-500' : 'bg-orange-500'} rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black transition-colors duration-500`}><span className="text-[9px] uppercase opacity-70">時數</span><div className="flex items-baseline gap-1"><span className="text-xl text-white">{totalHours || "0"}</span><span className="text-[9px] text-white">HR</span></div></div>
            
            <div className="bg-slate-200 rounded-2xl p-3 text-slate-600 flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black transition-colors duration-500 shadow-inner">
              <span className="text-[9px] uppercase opacity-70 whitespace-nowrap">{formData.compensationType === 'leave' ? '預計補休' : '預計加班費'}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl text-slate-700">{formData.compensationType === 'leave' ? calculatedCompensation.leave : calculatedCompensation.payStr}</span>
                <span className="text-[9px] text-slate-500">{formData.compensationType === 'leave' ? 'HR' : '倍時薪'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase">原因說明</label><textarea required rows="2" placeholder="請描述加班具體工作內容..." className="w-full p-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-100" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
          
          <div className={`${appType === 'pre' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-orange-50 border-orange-500 text-orange-800'} border-l-4 p-5 rounded-r-2xl text-[11px] font-bold space-y-1 text-left shadow-sm transition-colors`}>
            <h4 className={`flex items-center gap-2 font-black mb-1 text-sm ${appType === 'pre' ? 'text-blue-900' : 'text-orange-900'}`}><Info size={16} className={appType === 'pre' ? 'text-blue-600' : 'text-orange-600'}/> 備註：</h4>
            <p>A. 加班申請須事前由直屬主管核准，始得進行加班。</p>
            <p>B. 此單於加班後七個工作日內交至財務行政部辦理，逾期不受理。</p>
            <p>C. 加班費將依勞基法規定倍率計算 (平日 1.34/1.67、休息日 1.34/1.67/2.67、國定假日加發一日工資)；補休則依工作時數 1:1 計算。</p>
            <p>D. 每月加班時數上限不得超過 46 小時。</p>
          </div>

          {isOverLimit && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <AlertTriangle size={20} className="shrink-0 text-rose-500" />
              <div>
                送出限制：當月加班時數將超過 46 小時法定上限！
                <div className="text-xs font-medium mt-1 text-rose-600">
                  當月已核准：{currentMonthOTHours} 小時 + 本次申請：{totalHours || 0} 小時 = 預計 {projectedTotalHours} 小時
                </div>
              </div>
            </div>
          )}

          <button disabled={totalHours <= 0 || submitting || isOverLimit} type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${totalHours <= 0 || submitting || isOverLimit ? 'bg-slate-300 cursor-not-allowed' : (appType === 'pre' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600')}`}>
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
                <div><p className="text-[10px] font-black text-slate-400 uppercase">類型</p><p className={`font-black text-xs ${r.appType === 'pre' ? 'text-blue-600' : 'text-orange-600'}`}>{r.appType === 'pre' ? '事前' : '事後'}</p></div>
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
                  {['pending', 'pending_manager'].includes(r.status) && <button onClick={() => setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors" title="刪除單據"><Trash2 size={16}/></button>}
                  {r.status === 'approved' && <button onClick={() => setCancelTarget(r)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors" title="抽單(撤銷)"><Undo2 size={16}/></button>}
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

const LeaveApplyView = ({ currentSerialId, onRefresh, employees, setNotification, userSession, records, availableDepts }) => {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ 
    name: userSession.name, 
    empId: userSession.empId, 
    dept: userSession.dept || '',
    jobTitle: userSession.jobTitle || '',
    substitute: '',
    category: 'annual', 
    startDate: '', 
    startHour: '', 
    startMin: '00', 
    endDate: '', 
    endHour: '', 
    endMin: '00', 
    reason: '',
    attachmentName: '',
    attachmentData: null
  });

  const handleEmpIdChange = (id) => {
    const matched = employees.find(e => e.empId === id);
    setFormData(prev => ({ ...prev, empId: id, name: matched ? matched.name : prev.name, dept: matched ? matched.dept : prev.dept, jobTitle: matched ? matched.jobTitle : prev.jobTitle, substitute: '' }));
  };

  const handleNameChange = (name) => {
    const matched = employees.find(e => e.name === name);
    setFormData(prev => ({ ...prev, name: name, empId: matched ? matched.empId : prev.empId, dept: matched ? matched.dept : prev.dept, jobTitle: matched ? matched.jobTitle : prev.jobTitle, substitute: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({ type: 'error', text: '檔案大小不能超過 5MB' });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const availableSubstitutes = useMemo(() => {
    if (!formData.dept) return [];
    return employees.filter(emp => emp.dept === formData.dept && emp.empId !== formData.empId);
  }, [employees, formData.dept, formData.empId]);

  const recentSubmissions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter(r => r.formType === '請假' && (userSession.empId === 'root' || r.empId === userSession.empId) && new Date(r.createdAt) >= thirtyDaysAgo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records, userSession.empId]);

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    
    let totalValidMs = 0;
    let currentDay = new Date(start);
    currentDay.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    // 模擬：2026年部分國定假日
    const holidays = [
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
      '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-10-10'
    ];

    while (currentDay <= endDay) {
      const dayOfWeek = currentDay.getDay();
      const localDateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(localDateStr);

      // 若非週末且非國定假日，才計入請假時數
      if (!isWeekend && !isHoliday) {
        // 設定每日正常上班時間 09:00 ~ 18:00
        const workStart = new Date(currentDay);
        workStart.setHours(9, 0, 0, 0);
        const workEnd = new Date(currentDay);
        workEnd.setHours(18, 0, 0, 0);

        const overlapStart = Math.max(start.getTime(), workStart.getTime());
        const overlapEnd = Math.min(end.getTime(), workEnd.getTime());

        if (overlapEnd > overlapStart) {
          let dailyValidMs = overlapEnd - overlapStart;

          // 扣除午休 12:30 ~ 13:30
          const lunchStart = new Date(currentDay);
          lunchStart.setHours(12, 30, 0, 0);
          const lunchEnd = new Date(currentDay);
          lunchEnd.setHours(13, 30, 0, 0);

          const lunchOverlapStart = Math.max(overlapStart, lunchStart.getTime());
          const lunchOverlapEnd = Math.min(overlapEnd, lunchEnd.getTime());

          if (lunchOverlapEnd > lunchOverlapStart) {
            dailyValidMs -= (lunchOverlapEnd - lunchOverlapStart);
          }

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
      // --- 防護機制：送單前即時二次驗證餘額 ---
      const freshRes = await fetch(`${NGROK_URL}/api/records?_t=${Date.now()}`, {
        ...fetchOptions,
        cache: 'no-store'
      });
      if (!freshRes.ok) throw new Error('無法驗證最新餘額');
      const freshRecords = await freshRes.json();
      const stats = calculatePTOStats(userSession.empId, userSession.hireDate, freshRecords);

      if (formData.category === 'annual' && totalHours > stats.remainAnnual) {
        setNotification({ type: 'error', text: `特休餘額不足！最新餘額為 ${stats.remainAnnual} 小時` });
        setSubmitting(false);
        onRefresh();
        return;
      }
      if (formData.category === 'comp' && totalHours > stats.remainComp) {
        setNotification({ type: 'error', text: `補休餘額不足！最新餘額為 ${stats.remainComp} 小時` });
        setSubmitting(false);
        onRefresh();
        return;
      }
      // ----------------------------------------

      const res = await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending_substitute', createdAt: new Date().toISOString() }) });
      if(!res.ok) throw new Error('API error');
      setNotification({ type: 'success', text: '請假申請已提交代理人確認' });
      setFormData(prev => ({ ...prev, startDate: '', endDate: '', reason: '', attachmentName: '', attachmentData: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '送出失敗，請檢查網路連線或後端伺服器' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要刪除申請？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3"><button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">取消</button><button onClick={async () => { try { const res = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers }); if (!res.ok) throw new Error(); setNotification({ type: 'success', text: '已成功刪除單據' }); setWithdrawTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '刪除失敗，請檢查網路連線' }); } }} className="flex-1 py-3 font-black text-white bg-rose-500 rounded-xl text-white">確認刪除</button></div>
          </div>
        </div>
      )}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Undo2 size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">確定要辦理銷假 (抽單)？</h3>
            <p className="text-sm text-slate-500 mb-8 font-bold text-center">單號：{cancelTarget.serialId}</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-xl text-slate-900">返回</button>
              <button onClick={async () => { try { const res = await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: 'canceled', opinion: '申請人自行銷假' }) }); if (!res.ok) throw new Error(); setNotification({ type: 'success', text: '已成功完成銷假' }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '銷假失敗，請檢查網路連線' }); } }} className="flex-1 py-3 font-black text-white bg-slate-700 rounded-xl text-white">確認銷假</button>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end text-left">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">員編 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.empId} onChange={e=>handleEmpIdChange(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">姓名 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e=>handleNameChange(e.target.value)} /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">部門 <HelpCircle size={10} className="text-slate-300" /></label>
              <select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value, substitute: ''})}>
                <option value="" disabled>請選擇部門</option>
                {availableDepts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">職稱 <HelpCircle size={10} className="text-slate-300" /></label><input type="text" placeholder="手動填寫或帶入" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase h-4">假別</label><select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>{LEAVE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase h-4">代理人 <span className="text-rose-500">*</span></label>
              <select required className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.substitute} onChange={e=>setFormData({...formData, substitute:e.target.value})}>
                <option value="" disabled>請選擇代理人</option>
                {availableSubstitutes.map(emp => (
                  <option key={emp.empId} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-left">
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2 mb-2 font-black">開始時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startHour} onChange={e=>setFormData({...formData, startHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.startMin} onChange={e=>setFormData({...formData, startMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="lg:col-span-5 text-left"><label className="text-xs font-bold text-rose-500 flex items-center gap-2 mb-2 font-black">結束時間</label><div className="flex gap-2"><input type="date" required className="flex-1 h-12 px-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} /><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endHour} onChange={e=>setFormData({...formData, endHour:e.target.value})} required>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</select><select className="h-12 px-2 sm:px-4 w-16 sm:w-20 rounded-xl border font-bold bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.endMin} onChange={e=>setFormData({...formData, endMin:e.target.value})} required>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></div>
            <div className="bg-emerald-500 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 h-[72px] font-black shadow-lg"><span className="text-[9px] opacity-80 uppercase">總時數</span><div className="flex items-baseline gap-1"><span className="text-xl">{totalHours || "0"}</span><span className="text-[9px]">HR</span></div></div>
          </div>
          <div className="px-2 text-[11px] text-emerald-600 font-bold -mt-2">
             * 系統僅計算工作日 09:00~18:00 (自動扣除午休 12:30~13:30、週末及國定假日)。
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase">請假理由</label><textarea required rows="3" className="w-full p-4 rounded-xl border bg-white font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50" placeholder="請輸入詳細請假原因..." value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} /></div>
            
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase">證明文件 (選填)</label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${formData.attachmentName ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <UploadCloud size={24} className={formData.attachmentName ? 'text-emerald-500' : 'text-slate-400'} />
                <span className="font-bold text-sm text-center">
                  {formData.attachmentName ? formData.attachmentName : '點擊上傳附加檔案 (最大 5MB)'}
                </span>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
              </div>
              {formData.attachmentName && (
                 <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, attachmentName: '', attachmentData: null})); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-xs text-rose-500 font-bold mt-1 hover:underline">移除檔案</button>
              )}
            </div>
          </div>
          
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-2xl text-[11px] font-bold text-emerald-800 space-y-3 text-left shadow-sm">
            <div>
              <h4 className="flex items-center gap-2 text-emerald-900 font-black mb-1 text-sm"><Info size={16} className="text-emerald-600"/> 簽核流程：</h4>
              <p className="leading-relaxed">申請人→經副理(請假天數3日(含)以下)→協理(請假天數5日(含)以下)→總經理(請假天數5日以上)→交辦(財務行政部)。 單位主管一天(含)以上由總經理核定。</p>
            </div>
            <div className="pt-3 border-t border-emerald-200">
              <p className="font-black text-emerald-900 mb-2">連續日期之請假單不可分開簽核，並均須檢附相關證明文件或說明事項：</p>
              <ul className="space-y-1.5">
                <li>一. 婚假：以日為單位，可分次或連續實施，於結婚之日前10日起三個月內休完。檢附結婚證明。</li>
                <li>二. 喪假：以日為單位，可分次或連續實施。檢附訃文。</li>
                <li>三. 普通傷病假：以日或時為單位，請假日數超過一日以上，檢附健保醫院或公立醫院或公司特約醫院診斷證明(附醫囑建議休息天數)。</li>
                <li>四. 事假：以日或時為單位。</li>
                <li>五. 分娩假：以日為單位。檢附診斷證明或出生證明。</li>
                <li>六. 陪產假：以日為單位，於配偶分娩之當日及其前後合計十五日期間內，擇其中之五日請假。檢附診斷證明或出生證明。</li>
                <li>七. 產檢假：以半日或小時為單位，一經選定不得更改。檢附診斷證明或媽媽手冊。</li>
                <li>八. 給假天數均依勞基法辦理。</li>
              </ul>
            </div>
          </div>

          <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.95] ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-emerald-500 hover:bg-emerald-600'}`}>送出請假申請</button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b pb-4"><History size={24} /><h3>最近 30 天個人請假紀錄</h3></div>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-4">{recentSubmissions.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border hover:bg-white transition-all text-slate-900">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1.5fr_1fr_1.5fr_2.5fr_1fr_auto] gap-4 items-center w-full">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">單號</p>
                  <p className="font-mono font-bold text-slate-600 truncate flex flex-col items-start">
                    {r.serialId}
                    {r.attachmentName && (
                      <a href={r.attachmentData} download={r.attachmentName} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded transition-colors">
                        <Paperclip size={10} /> 附件
                      </a>
                    )}
                  </p>
                </div>
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
                  {['pending', 'pending_substitute', 'pending_manager'].includes(r.status) && <button onClick={() => setWithdrawTarget(r)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors" title="刪除單據"><Trash2 size={16}/></button>}
                  {r.status === 'approved' && <button onClick={() => setCancelTarget(r)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors" title="銷假(抽單)"><Undo2 size={16}/></button>}
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
      if (userSession.empId !== 'root' && r.empId !== userSession.empId) return false;
      if (filters.formType && r.formType !== filters.formType) return false;
      if (filters.serialId && r.serialId && !r.serialId.toLowerCase().includes(filters.serialId.toLowerCase())) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.startDate && r.startDate < filters.startDate) return false;
      if (filters.endDate && r.startDate > filters.endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleReset = () => {
    setFilters({ formType: '', serialId: '', status: '', startDate: '', endDate: '' });
    searchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-fuchsia-500 px-8 py-10 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white text-left">申請單據查詢</h1><p className="text-sm opacity-90 italic text-white text-left">設定條件查詢您的歷史單據</p></div><Search size={40} className="opacity-30" />
        </div>
        
        <form onSubmit={handleSearch} className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">單據類型</label>
              <select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500" value={filters.formType} onChange={e => setFilters({...filters, formType: e.target.value})}>
                <option value="">全部</option>
                <option value="加班">加班申請</option>
                <option value="請假">請假申請</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">單號包含 (模糊搜尋)</label>
              <input type="text" placeholder="例如: OT001" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500" value={filters.serialId} onChange={e => setFilters({...filters, serialId: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">簽核狀態</label>
              <select className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">全部</option>
                <option value="pending_substitute">待代理確認</option>
                <option value="pending_manager">待主管簽核</option>
                <option value="approved">已核准</option>
                <option value="rejected">已駁回</option>
                <option value="canceled">已撤銷(銷假)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">起始日期 (從)</label>
              <input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">結束日期 (至)</label>
              <input type="date" className="w-full h-12 px-4 rounded-xl border bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-500" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={handleReset} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors">清除重設</button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-fuchsia-500 hover:bg-fuchsia-600 shadow-md transition-colors flex items-center gap-2"><Search size={18}/> 執行查詢</button>
          </div>
        </form>

        <div className="p-8 space-y-4 text-left">
          {!hasSearched ? (
            <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
              <Search size={48} className="opacity-20 mb-2 text-fuchsia-500" />
              <p>請設定上方查詢條件，並點擊「執行查詢」查看單據</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(r => (
              <div key={r.id} className="bg-slate-50 p-6 rounded-2xl border hover:border-fuchsia-300 transition-all shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[1fr_1.5fr_1fr_2.5fr_1fr_auto] gap-4 items-center w-full">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">類型</p>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : (r.appType === 'post' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700')}`}>
                      {r.formType === '請假' ? '請假申請' : (r.appType === 'post' ? '事後加班' : '事前加班')}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">單號</p>
                    <p className="font-mono font-bold text-fuchsia-600 flex flex-col items-start">
                      {r.serialId}
                      {r.attachmentName && (
                        <a href={r.attachmentData} download={r.attachmentName} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded transition-colors">
                          <Paperclip size={10} /> 附件
                        </a>
                      )}
                    </p>
                  </div>
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

const ChangePasswordView = ({ userSession, setNotification, onLogout, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ current: '', new: '', confirm: '' });
  const [shows, setShows] = useState({ cur: false, new: false, con: false });
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (userSession.empId === 'root') return setNotification({ type: 'error', text: '最高權限管理員無法手動修改動態密碼' });
    if (formData.new !== formData.confirm) return setNotification({ type: 'error', text: '確認密碼不符' });
    if (formData.current !== (userSession.password || userSession.empId)) return setNotification({ type: 'error', text: '舊密碼錯誤' });
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PATCH', headers: fetchOptions.headers, body: JSON.stringify({ password: formData.new.trim() }) });
      if (res.ok) { 
        setNotification({ type: 'success', text: '密碼更新成功，即將登出...' }); 
        onRefresh(); 
        setTimeout(() => onLogout(), 2000); 
      }
      else throw new Error('API error');
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };
  const handleChange = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const handleToggle = (k) => setShows(p => ({ ...p, [k]: !p[k] }));
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-slate-700 px-8 py-10 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black text-white">帳號安全設定</h1><p className="text-sm opacity-90 italic text-white">變更後將強制登出以確認生效</p></div><KeyRound size={40} className="opacity-30" />
        </div>
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6">
            <PassInput label="目前登入密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={handleToggle} onChange={handleChange} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={handleToggle} onChange={handleChange} />
            <PassInput label="再次確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={handleToggle} onChange={handleChange} />
          </div>
          <button disabled={loading} className="w-full py-5 rounded-2xl font-black text-white bg-slate-700 hover:bg-slate-800 shadow-xl active:scale-95 flex items-center justify-center gap-3 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />} 儲存變更
          </button>
        </form>
      </div>
    </div>
  );
};

// 新增：代理人確認中心
const SubstituteView = ({ records, onRefresh, setNotification, userSession }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  const pendingRecords = useMemo(() => {
    return records.filter(r => r.formType === '請假' && r.status === 'pending_substitute' && r.substitute === userSession.name);
  }, [records, userSession.name]);

  const handleUpdate = async (status) => {
    if (!selectedId) return;
    if (status === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '拒絕原因為必填' });
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status, opinion }) });
      if(!res.ok) throw new Error('API error');
      setNotification({ type: 'success', text: status === 'pending_manager' ? '已同意代理，單據送交主管簽核' : '已拒絕代理，單據退回申請人' });
      setSelectedId(null); setOpinion(''); onRefresh();
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); } finally { setUpdating(false); }
  };
  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-amber-500 p-8 text-white flex justify-between items-center text-left">
          <div className="space-y-1 text-left text-white">
            <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider text-white">待您確認的職務代理</span></div>
            <h1 className="text-2xl font-black text-white">代理確認中心</h1>
            <p className="text-sm opacity-90 font-medium italic text-white">確認同仁指定您為代理人的請假申請</p>
          </div>
          <UserCheck size={40} className="opacity-40 text-white" />
        </div>
        <div className="p-8 space-y-4 text-left">
          {pendingRecords.length > 0 ? pendingRecords.map(r => (
            <div key={r.id} onClick={() => setSelectedId(r.id)} className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${selectedId === r.id ? 'bg-amber-50 border-amber-300 ring-2 ring-inset ring-amber-200' : 'bg-slate-50 hover:bg-white hover:border-amber-200 border-slate-100'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[auto_1.5fr_1fr_2fr_1fr_2fr_auto] gap-4 items-center w-full">
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedId === r.id ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white text-white" />}</div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">申請人</p>
                  <p className="font-black text-slate-800 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">{r.dept} / {r.empId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">假別</p>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 inline-block mb-1">
                    {LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || '請假申請'}
                  </span>
                  <p className="font-mono text-[9px] font-bold text-slate-400 truncate">{r.serialId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">時間</p>
                  {r.startDate === r.endDate ? (
                    <p className="font-bold text-xs text-slate-700">{r.startDate} <br/><span className="text-[10px] text-slate-500">{r.startHour}:{r.startMin} ~ {r.endHour}:{r.endMin}</span></p>
                  ) : (
                    <div className="font-bold text-[11px] text-slate-700 flex flex-col leading-tight gap-0.5">
                      <span>{r.startDate} {r.startHour}:{r.startMin} ~</span>
                      <span>{r.endDate} {r.endHour}:{r.endMin}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">時數</p>
                  <p className="font-black text-slate-900">{r.totalHours} HR</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">事由</p>
                  <div className="font-bold text-xs text-slate-600 line-clamp-2" title={r.reason}>
                    {r.reason}
                    {r.attachmentName && (
                      <a href={r.attachmentData} download={r.attachmentName} onClick={e => e.stopPropagation()} className="block mt-1 text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors">
                        <Paperclip size={10} className="inline mr-0.5" /> 附件: {r.attachmentName}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-end items-center col-span-2 sm:col-span-3 md:col-span-1">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center text-slate-300 italic font-bold">目前無待確認的代理任務</div>
          )}
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border border-amber-200 p-8 flex flex-col md:flex-row gap-8 text-left">
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-600 font-black text-sm"><MessageSquare size={18} className="text-amber-600" /> 代理人回覆 <span className="text-rose-400 font-bold text-[10px] ml-1 uppercase tracking-widest">* 拒絕為必填</span></div>
            <textarea placeholder="填寫您拒絕或同意的意見 (選填)..." className="w-full p-5 rounded-2xl border bg-slate-50 outline-none text-sm font-bold text-slate-900" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase px-1">選取單據：<span className="text-amber-600 font-bold">{selectedRecord?.serialId}</span></p>
            <div className="grid grid-cols-2 gap-3 text-white">
              <button disabled={updating} onClick={() => handleUpdate('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 active:scale-95 text-[11px] font-black uppercase text-center hover:text-white transition-all"><XCircle size={24}/><span className="text-center">拒絕代理</span></button>
              <button disabled={updating} onClick={() => handleUpdate('pending_manager')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 active:scale-95 text-[11px] font-black uppercase text-center hover:text-white transition-all">{updating ? <Loader2 size={24} className="animate-spin text-center" /> : <CheckCircle2 size={24} className="text-center" /> }<span className="text-center">同意代理</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const ApprovalView = ({ records, onRefresh, setNotification, userSession, employees }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);
  const pendingRecords = useMemo(() => {
    return records.filter(r => canManagerApproveRecord(userSession, r, employees));
  }, [records, userSession, employees]);
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[auto_1.2fr_0.8fr_1fr_1.5fr_0.5fr_1.5fr_1.5fr_auto] gap-4 items-center w-full">
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedId === r.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>{selectedId === r.id && <div className="w-2 h-2 rounded-full bg-white text-white" />}</div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">申請人</p>
                  <p className="font-black text-slate-800 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold truncate">{r.dept} / {r.empId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">單號</p>
                  <p className="font-mono text-xs font-bold text-slate-600 truncate flex flex-col items-start">
                    {r.serialId}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">單據類型</p>
                  <div className="flex flex-col items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${r.formType === '請假' ? 'bg-emerald-50 text-emerald-700' : (r.appType === 'post' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700')}`}>
                      {r.formType === '請假' ? '請假申請' : (r.appType === 'post' ? '事後加班' : '事前加班')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
                      {r.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || '未設定') : (r.compensationType === 'leave' ? '換補休' : '計薪')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">時間</p>
                  {r.startDate === r.endDate ? (
                    <p className="font-bold text-xs text-slate-700">{r.startDate} <br/><span className="text-[10px] text-slate-500">{r.startHour}:{r.startMin} ~ {r.endHour}:{r.endMin}</span></p>
                  ) : (
                    <div className="font-bold text-[11px] text-slate-700 flex flex-col leading-tight gap-0.5">
                      <span>{r.startDate} {r.startHour}:{r.startMin} ~</span>
                      <span>{r.endDate} {r.endHour}:{r.endMin}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">時數</p>
                  <p className="font-black text-slate-900">{r.totalHours} HR</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">事由</p>
                  <div className="font-bold text-xs text-slate-600 line-clamp-2" title={r.reason}>
                    {r.reason}
                    {r.attachmentName && (
                      <a href={r.attachmentData} download={r.attachmentName} onClick={e => e.stopPropagation()} className="block mt-1 text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors">
                        <Paperclip size={10} className="inline mr-0.5" /> 附件: {r.attachmentName}
                      </a>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">代理人意見</p>
                  {r.formType === '請假' ? (
                    <p className="font-bold text-xs text-slate-600 line-clamp-2" title={r.opinion || '同意代理'}>
                      <span className="text-amber-600 mr-1">[{r.substitute}]</span> {r.opinion || '同意代理'}
                    </p>
                  ) : (
                    <p className="font-bold text-xs text-slate-400">-</p>
                  )}
                </div>
                <div className="flex justify-end items-center col-span-2 sm:col-span-3 lg:col-span-1">
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
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-200 p-8 flex flex-col lg:flex-row gap-8 text-left animate-in fade-in slide-in-from-top-4 duration-300">
          {selectedRecord?.formType === '請假' && (
            <div className="w-full lg:w-64 bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col gap-2 text-left shrink-0">
               <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1.5"><UserCheck size={14}/> 代理人 ({selectedRecord?.substitute}) 意見</p>
               <p className="text-xs font-bold text-amber-900 leading-relaxed whitespace-pre-wrap">{selectedRecord?.opinion || '已同意代理 (無填寫特別意見)'}</p>
            </div>
          )}
          <div className="flex-1 flex flex-col space-y-4 text-left">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm shrink-0"><MessageSquare size={18} className="text-indigo-600" /> 主管簽核意見 <span className="text-rose-400 font-bold text-[10px] ml-1 uppercase tracking-widest">* 駁回為必填</span></div>
            <textarea placeholder="填寫具體簽核意見或指示..." className="w-full p-5 rounded-2xl border bg-slate-50 outline-none text-sm font-bold text-slate-900 flex-1 min-h-[100px]" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full lg:w-72 flex flex-col justify-end gap-3 text-left shrink-0">
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

const PersonnelManagement = ({ employees, onRefresh, setNotification, userSession, availableDepts }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '', gender: '', birthDate: '', hireDate: '' });
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [pwdTarget, setPwdTarget] = useState(null); 
  const [expandedEmpId, setExpandedEmpId] = useState(null);
  const [isCustomDept, setIsCustomDept] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!userSession) return [];
    if (userSession.empId === 'root' || userSession.jobTitle === '總經理') {
      return employees;
    }
    if (userSession.jobTitle === '協理') {
      if (userSession.dept === '工程組') {
        return employees.filter(emp => ['工程組', '系統組'].includes(emp.dept));
      }
      if (userSession.dept === '北區營業組') {
        return employees.filter(emp => ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept));
      }
    }
    return employees.filter(emp => emp.dept === userSession.dept);
  }, [employees, userSession]);

  const availableTitles = useMemo(() => {
    const titles = employees.map(e => e.jobTitle).filter(Boolean);
    return [...new Set(titles)];
  }, [employees]);

  useEffect(() => { if (!window.XLSX) { const script = document.createElement('script'); script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"; script.async = true; document.head.appendChild(script); } }, []);
  const handleExport = () => { if (!window.XLSX) return; const data = filteredEmployees.map(emp => ({ "姓名": emp.name, "員編": emp.empId, "職稱": emp.jobTitle, "單位": emp.dept, "性別": emp.gender || '', "出生年月日": emp.birthDate ? emp.birthDate.split('T')[0] : '', "到職日": emp.hireDate ? emp.hireDate.split('T')[0] : '' })); const ws = window.XLSX.utils.json_to_sheet(data); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "員工名單"); window.XLSX.writeFile(wb, `員工清單_${new Date().toISOString().split('T')[0]}.xlsx`); };
  const handleImport = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (evt) => { const bstr = evt.target.result; const wb = window.XLSX.read(bstr, { type: 'binary' }); const jsonData = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); setLoading(true); for (const row of jsonData) { const payload = { name: row["姓名"], empId: row["員編"]?.toString(), jobTitle: row["職稱"] || "", dept: row["單位"] || "", gender: row["性別"] || "", birthDate: row["出生年月日"] || null, hireDate: row["到職日"] || null }; if (payload.name && payload.empId) await fetch(`${NGROK_URL}/api/employees`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify(payload) }); } onRefresh(); setNotification({ type: 'success', text: '匯入完成' }); setLoading(false); e.target.value = ""; }; reader.readAsBinaryString(file); };
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
              <button onClick={() => { fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PATCH', headers: fetchOptions.headers, body: JSON.stringify({ password: pwdTarget.empId }) }).then(onRefresh); setPwdTarget(null); }} className="flex-1 py-3 font-black text-white bg-teal-600 rounded-xl text-white text-center">確認</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-teal-600 p-8 text-white flex justify-between items-center text-left">
          <div><h1 className="text-2xl font-black text-white text-left">人員管理中心</h1><p className="text-sm opacity-90 italic text-white text-left">維護同仁資料與 Excel 工具</p></div><Users size={40} className="opacity-40" />
        </div>
        <div className="px-8 pt-6 flex gap-3 text-left">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 transition-colors"><FileSpreadsheet size={16}/> 匯出 Excel</button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold border border-sky-100 transition-colors"><Upload size={16}/> 匯入 Excel</button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault(); 
          const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`; 
          
          const payload = {
            ...formData,
            birthDate: formData.birthDate || null,
            hireDate: formData.hireDate || null
          };

          try {
            const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('伺服器更新失敗');
            
            onRefresh(); 
            setEditingId(null); 
            setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''}); 
            setShowDetails(false);
            setIsCustomDept(false);
            setNotification({ type: 'success', text: '人員資料更新成功！' });
          } catch (err) {
            setNotification({ type: 'error', text: '更新失敗！請確認後端 API 是否有重啟' });
          }
        }} className="p-8 space-y-6 text-left">
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <input type="text" placeholder="員編" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
              <input type="text" placeholder="姓名" required className="p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              
              <div>
                <input type="text" list="titles-list" placeholder="職稱" required className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500" value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} />
                <datalist id="titles-list">
                  {availableTitles.map(t=><option key={t} value={t} />)}
                </datalist>
              </div>

              <div>
                {isCustomDept ? (
                  <input type="text" placeholder="請輸入新單位..." required className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-teal-500 shadow-inner font-bold text-teal-700" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} autoFocus onBlur={() => { if(!formData.dept) setIsCustomDept(false); }} />
                ) : (
                  <select required className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-bold" value={formData.dept} onChange={e => { if(e.target.value === '__custom__') { setIsCustomDept(true); setFormData({...formData, dept:''}); } else { setFormData({...formData, dept:e.target.value}); } }}>
                    <option value="" disabled>請選擇單位</option>
                    {availableDepts.map(d=><option key={d} value={d}>{d}</option>)}
                    <option value="__custom__" className="text-teal-600 font-black">+ 新增單位 / 職稱</option>
                  </select>
                )}
              </div>
            </div>

            <div className="text-left pt-2">
              <button type="button" onClick={() => setShowDetails(!showDetails)} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors bg-teal-50 px-3 py-2 rounded-lg">
                {showDetails ? <EyeOff size={14} /> : <Eye size={14} />} {showDetails ? '隱藏進階人事資料' : '填寫進階人事資料 (性別 / 生日 / 到職日)'}
              </button>
            </div>

            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-5 bg-slate-100/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">性別</label><select className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-teal-500" value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="">請選擇</option><option value="男">男</option><option value="女">女</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">出生年月日</label><input type="date" className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-teal-500" value={formData.birthDate} onChange={e=>setFormData({...formData, birthDate:e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">到職日</label><input type="date" className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-teal-500" value={formData.hireDate} onChange={e=>setFormData({...formData, hireDate:e.target.value})} /></div>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 pt-2">
            <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-center hover:bg-teal-700 transition-colors shadow-md"> 
              {editingId ? '更新資料' : '新增人員'} 
            </button>
            <button type="button" onClick={() => {
              setEditingId(null); 
              setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''}); 
              setShowDetails(false);
              setIsCustomDept(false);
            }} className="w-1/3 sm:w-1/4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-center hover:bg-slate-200 transition-colors">
              清除 / 取消
            </button>
          </div>
        </form>
        <div className="overflow-x-auto border-t text-left">
          <table className="w-full border-collapse text-sm text-left text-slate-900">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left">職稱 / 單位</th><th className="px-4 py-4 text-left">登入密碼</th><th className="px-8 py-4 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 font-mono font-bold text-slate-600">{emp.empId}</td>
                  <td className="px-4 py-5">
                    <div 
                      onClick={() => setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id)}
                      className="font-black flex items-center gap-1.5 cursor-pointer text-slate-800 hover:text-teal-600 transition-colors w-fit group"
                    >
                      {emp.name} {emp.gender && <span className="text-[10px] text-slate-400 font-bold group-hover:text-teal-500 transition-colors">({emp.gender})</span>}
                      {(emp.birthDate || emp.hireDate) && (
                        expandedEmpId === emp.id ? <ChevronUp size={14} className="text-teal-600"/> : <ChevronDown size={14} className="text-slate-300 group-hover:text-teal-400 transition-colors"/>
                      )}
                    </div>
                    {expandedEmpId === emp.id && (emp.birthDate || emp.hireDate) && (
                      <div className="mt-2 p-2.5 bg-white border border-slate-100 shadow-sm rounded-xl text-[10px] font-bold text-slate-600 animate-in fade-in slide-in-from-top-1 inline-block space-y-1 min-w-[140px]">
                        {emp.hireDate && <div><span className="text-slate-400 mr-2 uppercase tracking-widest">到職</span>{emp.hireDate.split('T')[0]}</div>}
                        {emp.birthDate && <div><span className="text-slate-400 mr-2 uppercase tracking-widest">生日</span>{emp.birthDate.split('T')[0]}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5 text-left"><div className="font-bold text-slate-900">{emp.jobTitle}</div><div className="text-[10px] text-slate-400 font-bold">{emp.dept}</div></td>
                  <td className="px-4 py-5 text-left"><div className="flex items-center gap-3">{(emp.password && emp.password !== emp.empId) && (<span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700">已自訂</span>)}<button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"><RotateCcw size={12}/>還原</button></div></td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900">
                    <button onClick={()=>{
                      setEditingId(emp.id);
                      setFormData({ 
                        ...emp, 
                        gender: emp.gender || '', 
                        birthDate: emp.birthDate ? emp.birthDate.split('T')[0] : '', 
                        hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : ''
                      }); 
                      setShowDetails(!!(emp.gender || emp.birthDate || emp.hireDate)); 
                      setIsCustomDept(false);
                      window.scrollTo({top:0,behavior:'smooth'});
                    }} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Edit2 size={16} /></button>
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

const AnnouncementManagement = ({ announcements, setAnnouncements, setNotification }) => {
  const [formData, setFormData] = useState({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setNotification({ type: 'error', text: '公告標題不可為空' });

    if (editingId) {
      setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
      setNotification({ type: 'success', text: '公告更新成功' });
    } else {
      setAnnouncements(prev => [{ ...formData, id: Date.now() }, ...prev]);
      setNotification({ type: 'success', text: '公告新增成功' });
    }
    setFormData({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if(window.confirm('確定要刪除這則公告嗎？')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setNotification({ type: 'success', text: '公告已刪除' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-rose-500 p-8 text-white flex justify-between items-center text-left">
          <div>
            <h1 className="text-2xl font-black text-white text-left">公告維護中心</h1>
            <p className="text-sm opacity-90 italic text-white text-left">發布與管理首頁的系統公告資訊</p>
          </div>
          <Megaphone size={40} className="opacity-40" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left border-b border-slate-100 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-left items-end">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">公告標題</label>
              <input type="text" placeholder="請輸入公告標題..." required className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-rose-500 font-bold" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">公告類型</label>
              <select className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700" value={formData.type} onChange={e=>setFormData({...formData, type:e.target.value})}>
                {ANNOUNCEMENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">發布日期</label>
              <input type="date" required className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">下架日期 (選填)</label>
              <input type="date" className="w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700" value={formData.endDate || ''} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-5 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">公告詳細內容 (選填)</label>
              <textarea placeholder="請輸入詳細公告內容，支援多行顯示..." rows="4" className="w-full p-4 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-700" value={formData.content} onChange={e=>setFormData({...formData, content:e.target.value})} />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-slate-300" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew:e.target.checked})} />
              <span className="text-sm font-bold text-slate-600">標示為 <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black uppercase tracking-wider ml-1">New</span> 新訊</span>
            </label>
            <div className="flex gap-3">
              {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });}} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors">取消編輯</button>}
              <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-colors flex items-center gap-2">
                {editingId ? <><Edit2 size={18}/> 更新公告</> : <><Plus size={18}/> 發布公告</>}
              </button>
            </div>
          </div>
        </form>

        <div className="p-8">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><ListChecks size={18} className="text-slate-400"/> 現有公告列表</h3>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {announcements.length > 0 ? announcements.map(ann => {
              const typeInfo = ANNOUNCEMENT_TYPES.find(t => t.id === ann.type) || ANNOUNCEMENT_TYPES[0];
              return (
              <div key={ann.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${typeInfo.colorClass}`}>
                    {typeInfo.label}
                  </span>
                  {ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}
                </div>
                <p className="text-sm font-bold text-slate-700 flex-1 truncate">{ann.title}</p>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 font-mono">{ann.date} 發布</div>
                    {ann.endDate && <div className="text-[10px] font-bold text-rose-400 font-mono">~ {ann.endDate} 下架</div>}
                  </div>
                  <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
                    <button onClick={()=>{setEditingId(ann.id); setFormData(ann); window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(ann.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              );
            }) : (
              <div className="p-8 text-center text-slate-400 text-sm font-bold italic">無任何公告資料</div>
            )}
          </div>
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
    { id: 1, type: 'policy', title: '2026年員工旅遊補助辦法及申請期限更新', date: '2026-04-15', endDate: '2026-05-15', isNew: true, content: '請各位同仁注意，2026年度的員工旅遊補助辦法已於今日更新。補助金額與申請流程有部分調整，詳細規則與申請表單請至人資部下載。若有任何疑問，請洽人資部王小姐。' },
    { id: 2, type: 'system', title: '系統維護通知：本週五晚間 10:00-12:00 暫停各項表單申請', date: '2026-04-14', endDate: '2026-04-18', isNew: false, content: '資訊部預計於本週五晚間 10:00 至 12:00 進行伺服器例行性維護。屆時員工服務平台將暫停服務，無法進行表單送出或資料查詢。請有需要的同仁提早完成相關作業，造成不便敬請見諒。' },
    { id: 3, type: 'event', title: 'Q2 跨部門季會暨慶生會活動報名開跑！', date: '2026-04-10', endDate: '', isNew: false, content: '各位夥伴好，\n\n今年第二季的跨部門交流會與慶生會要來囉！\n活動時間：2026年5月10日下午 15:00\n活動地點：總部大樓 3F 交誼廳\n\n歡迎大家踴躍報名參加，當天備有精緻下午茶與抽獎活動，千萬別錯過！' },
  ]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // 新增：從 sessionStorage 讀取初始狀態
  const [userSession, setUserSession] = useState(() => {
    const savedSession = sessionStorage.getItem('docflow_user_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  // 新增：當 userSession 變更時，同步寫入或清除 sessionStorage
  useEffect(() => {
    if (userSession) {
      sessionStorage.setItem('docflow_user_session', JSON.stringify(userSession));
    } else {
      sessionStorage.removeItem('docflow_user_session');
    }
  }, [userSession]);

  useEffect(() => { if (notification) { const timer = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(timer); } }, [notification]);
  
  const fetchData = async () => { 
    try { 
      setLoading(true);
      setApiError(false);
      const fetchWithTimeout = (url, options, timeout = 5000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('連線逾時')), timeout))
        ]);
      };

      const [resEmp, resRec] = await Promise.all([ 
        fetchWithTimeout(`${NGROK_URL}/api/employees?_t=${Date.now()}`, { ...fetchOptions, cache: 'no-store' }).then(r => r.ok ? r.json() : []), 
        fetchWithTimeout(`${NGROK_URL}/api/records?_t=${Date.now()}`, { ...fetchOptions, cache: 'no-store' }).then(r => r.ok ? r.json() : []) 
      ]); 
      
      const fetchedEmployees = Array.isArray(resEmp) ? resEmp : [];
      let fetchedRecords = Array.isArray(resRec) ? resRec : [];

      // 新增：檢查當前登入者是否被踢出 (單一登入驗證，透過系統登入紀錄)
      if (userSession && userSession.id !== 'root') {
        const loginRecords = Array.isArray(resRec) ? resRec.filter(r => r.formType === '系統登入' && r.empId === userSession.empId) : [];
        if (loginRecords.length > 0) {
          // 強制依照 JSON Server 返回的陣列自然順序，取最後一筆保證是最新的
          const latestLogin = loginRecords[loginRecords.length - 1];
          
          if (latestLogin.sessionToken && userSession.sessionToken && latestLogin.sessionToken !== userSession.sessionToken) {
            setUserSession(null);
            sessionStorage.removeItem('docflow_user_session');
            setNotification({ type: 'error', text: '您的帳號已在其他裝置登入，您已被強制登出' });
            return;
          }
        }
      }

      fetchedRecords = fetchedRecords
        .filter(r => r.formType !== '系統登入') // 過濾掉系統登入紀錄，確保不會出現在任何列表
        .map(r => {
          let updatedR = { ...r };
          if (!updatedR.dept || updatedR.dept === '未設定') {
            const emp = fetchedEmployees.find(e => e.empId === updatedR.empId);
            if (emp && emp.dept) {
              updatedR.dept = emp.dept;
            }
          }
          
          // 過濾後端附加上去的「[主管意見]」或「[代理人意見]」，讓事由欄位保持乾淨
          if (updatedR.reason) {
            updatedR.reason = updatedR.reason.replace(/\s*\[(?:主管|代理人)意見\][:：]?[\s\S]*$/, '');
          }
          
          return updatedR;
        });
      
      setEmployees(fetchedEmployees); 
      setRecords(fetchedRecords); 
    } catch (err) { 
      console.error('資料庫連線失敗:', err);
      setApiError(true);
      setEmployees([]); 
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchData(); }, []);

  // 新增：定期檢查單一登入 (SSO) 狀態 (輪詢)
  useEffect(() => {
    if (!userSession || userSession.id === 'root') return;
    
    const checkSession = async () => {
      try {
        // 只需要去拉取 records 就可以判斷
        const formTypeEncoded = encodeURIComponent('系統登入');
        const res = await fetch(`${NGROK_URL}/api/records?formType=${formTypeEncoded}&empId=${userSession.empId}&_t=${Date.now()}`, {
          method: 'GET',
          headers: fetchOptions.headers
        });
        if (res.ok) {
          let loginRecords = await res.json();
          if (!Array.isArray(loginRecords)) return;

          // 如果後端不支援 query 過濾，就在前端再過濾一次
          loginRecords = loginRecords.filter(r => r.formType === '系統登入' && r.empId === userSession.empId);

          if (loginRecords.length > 0) {
            // 利用陣列最後一筆作為最新紀錄，徹底避開兩台電腦時間差(Clock Skew)的問題
            const latestLogin = loginRecords[loginRecords.length - 1];

            if (latestLogin.sessionToken && userSession.sessionToken && latestLogin.sessionToken !== userSession.sessionToken) {
              setUserSession(null);
              sessionStorage.removeItem('docflow_user_session');
              setNotification({ type: 'error', text: '您的帳號已在其他裝置登入，您已被強制登出' });
            }
          }
        }
      } catch (e) {
        // 忽略網路錯誤，避免短暫斷線造成誤踢
      }
    };

    const interval = setInterval(checkSession, 3000); // 加快檢查頻率 (每 3 秒)
    return () => clearInterval(interval);
  }, [userSession]);

  const availableDepts = useMemo(() => {
    const depts = employees.map(e => e.dept).filter(Boolean);
    return [...new Set(depts)];
  }, [employees]);
  
  const isAdmin = useMemo(() => userSession && (userSession.empId === 'root' || ADMIN_TITLES.includes(userSession.jobTitle)), [userSession]);

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
  
  if (!userSession) return <LoginView employees={employees} apiError={apiError} onLogin={u=>{
    setUserSession(u);
    setActiveMenu('welcome');
    setNotification({type:'success',text:`${u.name} 登入成功`});
  }} />;

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
          <button onClick={() => setActiveMenu('welcome')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'welcome' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Sparkles size={20} /> 首頁總覽</button>
          <button onClick={() => setActiveMenu('announcement-list')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'announcement-list' ? 'bg-yellow-50 text-yellow-600 border-yellow-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Bell size={20} /> 資訊公告</button>
          <button onClick={() => setActiveMenu('substitute')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'substitute' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><UserCheck size={20} /> 代理確認</button>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'overtime' ? 'bg-blue-50 text-blue-600 border-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('leave-apply')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'leave-apply' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><CalendarPlus size={20} /> 請假申請</button>
          <button onClick={() => setActiveMenu('integrated-query')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'integrated-query' ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ClipboardList size={20} /> 單據查詢</button>
          <button onClick={() => setActiveMenu('change-password')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'change-password' ? 'bg-slate-100 text-slate-700 border-slate-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><KeyRound size={20} /> 修改密碼</button>
          {isAdmin && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mt-8 mb-2 text-left">管理功能區</p>
              <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
              <button onClick={() => setActiveMenu('announcement')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'announcement' ? 'bg-rose-50 text-rose-600 border-rose-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Megaphone size={20} /> 公告維護</button>
              <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 text-left ${activeMenu === 'personnel' ? 'bg-teal-50 text-teal-600 border-teal-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
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
          {activeMenu === 'welcome' && <WelcomeView userSession={userSession} records={records} onRefresh={fetchData} setActiveMenu={setActiveMenu} isAdmin={isAdmin} announcements={announcements} employees={employees} />}
          {activeMenu === 'announcement-list' && <AnnouncementListView announcements={announcements} />}
          {activeMenu === 'substitute' && <SubstituteView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} />}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} records={records} employees={employees} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} />}
          {activeMenu === 'leave-apply' && <LeaveApplyView currentSerialId={leaveSerialId} onRefresh={fetchData} employees={employees} setNotification={setNotification} userSession={userSession} records={records} availableDepts={availableDepts} />}
          {activeMenu === 'integrated-query' && <InquiryView records={records} userSession={userSession} />}
          {activeMenu === 'change-password' && <ChangePasswordView userSession={userSession} setNotification={setNotification} onLogout={() => setUserSession(null)} onRefresh={fetchData} />}
          {activeMenu === 'announcement' && isAdmin && <AnnouncementManagement announcements={announcements} setAnnouncements={setAnnouncements} setNotification={setNotification} />}
          {activeMenu === 'approval' && isAdmin && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} employees={employees} />}
          {activeMenu === 'personnel' && isAdmin && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} userSession={userSession} availableDepts={availableDepts} />}
        </div>
      </main>
    </div>
  );
};

export default App;