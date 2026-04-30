import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff, KeyRound,
  CalendarPlus, ClipboardList, HelpCircle, Timer, Sparkles, ChevronDown, ChevronUp, Megaphone,
  Paperclip, UploadCloud, Activity, GitMerge, CheckCircle2 as CheckIcon, Circle as CircleIcon, ClockIcon,
  ChevronLeft, ChevronRight, Moon, Sun, Printer, PieChart
} from 'lucide-react';

// =============================================================================
// 1. 全域設定與常數
// =============================================================================
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 
const ADMIN_TITLES = ["總經理", "協理", "經理", "副理"];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const FETCH_OPTIONS = { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } };

const OT_CATEGORIES = [ { id: 'regular', label: '一般上班日' }, { id: 'holiday', label: '國定假日' }, { id: 'rest', label: '休息日' }, { id: 'business', label: '出差加班' } ];
const LEAVE_CATEGORIES = [ { id: 'annual', label: '特別休假' }, { id: 'comp', label: '補休' }, { id: 'personal', label: '事假' }, { id: 'sick', label: '病假' }, { id: 'sick_hospital', label: '病假(連續住院)' }, { id: 'marriage', label: '婚假' }, { id: 'bereavement', label: '喪假' }, { id: 'official', label: '公假' }, { id: 'occupational_sickness', label: '公傷假' }, { id: 'maternity_leave', label: '產假' }, { id: 'paternity_leave', label: '陪產假' }, { id: 'prenatal_checkup', label: '產檢假' }, { id: 'welfare', label: '福利假' }, { id: 'family_care', label: '家庭照顧假' }, { id: 'parental_leave', label: '育嬰留停假' } ];
const ABNORMAL_CATEGORIES = [ { id: 'forgot_logout', label: '電腦未登出或未關機' }, { id: 'official_outing', label: '公務外出' }, { id: 'late_logout', label: '逾時登出，無加班申請事實' }, { id: 'other', label: '其他' } ];
const ANNOUNCEMENT_TYPES = [ { id: 'policy', label: '政策更新' }, { id: 'system', label: '系統維護' }, { id: 'personnel', label: '人事通報' }, { id: 'reward', label: '獎懲公告' }, { id: 'event', label: '節日與活動' }, { id: 'shared_doc', label: '單據共享' } ];

const INITIAL_ANNOUNCEMENTS = [
  { id: 1, type: 'policy', title: '2026年員工旅遊補助辦法及申請期限更新', date: '2026-04-15', endDate: '2026-05-15', isNew: true, content: '請各位同仁注意，2026年度的員工旅遊補助辦法已於今日更新。補助金額與申請流程有部分調整，詳細規則與申請表單請至人資部下載。若有任何疑問，請洽人資部王小姐。' },
  { id: 2, type: 'system', title: '系統維護通知：本週五晚間 10:00-12:00 暫停各項表單申請', date: '2026-04-14', endDate: '2026-04-18', isNew: false, content: '資訊部預計於本週五晚間 10:00 至 12:00 進行伺服器例行性維護。屆時員工服務平台將暫停服務，無法進行表單送出或資料查詢。請有需要的同仁提早完成相關作業，造成不便敬請見諒。' },
  { id: 3, type: 'event', title: 'Q2 跨部門季會暨慶生會活動報名開跑！', date: '2026-04-10', endDate: '', isNew: false, content: '各位夥伴好，\n\n今年第二季的跨部門交流會與慶生會要來囉！\n活動時間：2026年5月10日下午 15:00\n活動地點：總部大樓 3F 交誼廳\n\n歡迎大家踴躍報名參加，當天備有精緻下午茶與抽獎活動，千萬別錯過！' },
];

// =============================================================================
// 2. 核心業務邏輯與工具函數
// =============================================================================
const Utils = {
  isTimeOverlapping: (newReq, existingRecords) => {
    const nStart = new Date(`${newReq.startDate}T${newReq.startHour}:${newReq.startMin}:00`).getTime();
    const nEnd = new Date(`${newReq.endDate}T${newReq.endHour}:${newReq.endMin}:00`).getTime();
    if (isNaN(nStart) || isNaN(nEnd)) return false;
    return (existingRecords || []).some(r => {
      if (['rejected', 'canceled'].includes(r.status)) return false;
      const exStart = new Date(`${r.startDate}T${r.startHour}:${r.startMin}:00`).getTime();
      const exEnd = new Date(`${r.endDate}T${r.endHour}:${r.endMin}:00`).getTime();
      return !isNaN(exStart) && !isNaN(exEnd) && Math.max(nStart, exStart) < Math.min(nEnd, exEnd);
    });
  },
  calculatePTO: (empId, hireDateStr, records) => {
    let usedAnn = 0, earnedCmp = 0, usedCmp = 0;
    (records || []).forEach(r => {
      if (r.empId === empId && (r.status === 'approved' || r.status.startsWith('canceling_'))) {
        if (r.formType === '請假' && r.category === 'annual') usedAnn += (parseFloat(r.totalHours) || 0);
        if (r.formType === '加班' && r.compensationType === 'leave') earnedCmp += (parseFloat(r.totalHours) || 0);
        if (r.formType === '請假' && r.category === 'comp') usedCmp += (parseFloat(r.totalHours) || 0);
      }
    });
    let totalAnnualHours = 0;
    if (hireDateStr) {
      const hd = new Date(hireDateStr), td = new Date();
      let y = td.getFullYear() - hd.getFullYear();
      if (td.getMonth() < hd.getMonth() || (td.getMonth() === hd.getMonth() && td.getDate() < hd.getDate())) y--;
      let days = y >= 10 ? Math.min(15 + (y - 9), 30) : y >= 5 ? 15 : y >= 3 ? 14 : y >= 2 ? 10 : y >= 1 ? 7 : (td >= new Date(new Date(hd).setMonth(hd.getMonth() + 6)) ? 3 : 0);
      totalAnnualHours = days * 8;
    }
    return { totalAnnual: totalAnnualHours, usedAnnual: usedAnn, remainAnnual: Math.max(0, totalAnnualHours - usedAnn), earnedComp: earnedCmp, usedComp: usedCmp, remainComp: Math.max(0, earnedCmp - usedCmp) };
  },
  getNextAnniversary: (hireDateStr) => {
    if (!hireDateStr) return null;
    const hd = new Date(hireDateStr), td = new Date();
    td.setHours(0, 0, 0, 0); 
    let next = new Date(td.getFullYear(), hd.getMonth(), hd.getDate());
    if (next < td) next.setFullYear(td.getFullYear() + 1);
    return next;
  },
  getProjectedPTO: (hireDateStr, nextAnniv) => {
    if (!hireDateStr || !nextAnniv) return 0;
    const y = nextAnniv.getFullYear() - new Date(hireDateStr).getFullYear();
    let d = y >= 10 ? 15 + (y - 9) : y >= 5 ? 15 : y >= 3 ? 14 : y >= 2 ? 10 : y >= 1 ? 7 : 3;
    return Math.min(d, 30) * 8; 
  },
  canApprove: (user, r, employees) => {
    const baseCanApprove = (u, req) => {
      if (!u) return false;
      if (u.empId === 'root') return true;
      if (req.empId === u.empId) return false;
      if (['pending_assignment', 'canceling_assignment'].includes(req.status)) return u.empId === '9002';
      const rank = u.jobTitle || '';
      if (['pending_gm', 'canceling_gm'].includes(req.status)) return u.empId === '9001' || rank.includes('總經理');
      if (['pending_director', 'canceling_director'].includes(req.status)) {
        if (!rank.includes('協理')) return false;
        if (u.dept === '工程組') return ['工程組', '系統組'].includes(req.dept);
        if (u.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(req.dept);
        return req.dept === u.dept;
      }
      if (['pending_manager', 'pending', 'canceling_manager'].includes(req.status)) return (rank.includes("經理") || rank.includes("副理")) && req.dept === u.dept;
      return false;
    };

    if (baseCanApprove(user, r)) return true;
    const delegators = (employees || []).filter(e => e.delegationActive && e.delegatedTo === user.empId);
    return delegators.some(delegator => baseCanApprove(delegator, r));
  },
  getSerialId: (records, typeStr, prefix) => {
    const ds = new Date().toISOString().split('T')[0].replace(/-/g, '');
    let max = 0;
    (records || []).filter(r => r.serialId?.startsWith(ds) && r.formType === typeStr).forEach(r => { const match = r.serialId?.match(new RegExp(`-${prefix}(\\d+)$`)); if (match) max = Math.max(max, parseInt(match[1], 10)); });
    return `${ds}-${prefix}${String(max + 1).padStart(3, '0')}`;
  },
  getNextStatus: (r, action, empRank) => {
    const days = (parseFloat(r.totalHours) || 0) / 8;
    const isCancel = r.status.startsWith('canceling_');
    if (action === 'rejected') return isCancel ? 'approved' : 'rejected';
    
    if (r.status.includes('substitute')) {
      if (empRank.includes('總經理')) return isCancel ? 'canceling_assignment' : 'pending_assignment';
      if (empRank.includes('協理')) return isCancel ? 'canceling_gm' : 'pending_gm';
      if (empRank.includes('經理') || empRank.includes('副理')) return isCancel ? 'canceling_director' : 'pending_director';
      return isCancel ? 'canceling_manager' : 'pending_manager';
    }

    if (isCancel) {
      if (r.status === 'canceling_manager') return days > 3 ? 'canceling_director' : 'canceling_assignment';
      if (r.status === 'canceling_director') return ((empRank.includes('經理') || empRank.includes('副理')) && days >= 1) || days > 5 ? 'canceling_gm' : 'canceling_assignment';
      if (r.status === 'canceling_gm') return 'canceling_assignment';
      if (r.status === 'canceling_assignment') return 'canceled';
    } else {
      if (r.formType === '請假') {
        if (r.status === 'pending_manager' || r.status === 'pending') return days > 3 ? 'pending_director' : 'pending_assignment';
        if (r.status === 'pending_director') return ((empRank.includes('經理') || empRank.includes('副理')) && days >= 1) || days > 5 ? 'pending_gm' : 'pending_assignment';
        if (r.status === 'pending_gm') return 'pending_assignment';
        if (r.status === 'pending_assignment') return 'approved';
      } else {
        if (['pending', 'pending_manager', 'pending_director', 'pending_gm'].includes(r.status)) return 'pending_assignment';
        if (r.status === 'pending_assignment') return 'approved';
      }
    }
    return 'approved';
  }
};

// =============================================================================
// 3. 自定義 HOOKS & CONTEXT
// =============================================================================
const AppContext = React.createContext({});
const useAppContext = () => React.useContext(AppContext);

const useAppState = (userSession, setUserSession) => {
  const [data, setData] = useState({ employees: [], records: [], sysLogs: [], loading: true, apiError: false });
  const [readAnns, setReadAnns] = useState([]);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [calendarData, setCalendarData] = useState({ loaded: false, holidays: [] });

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const t = Date.now();
      const [resEmp, resRec, resLogs] = await Promise.all([
        fetch(`${NGROK_URL}/api/employees?_t=${t}`, FETCH_OPTIONS).then(r => r.ok ? r.json() : []),
        fetch(`${NGROK_URL}/api/records?_t=${t}`, FETCH_OPTIONS).then(r => r.ok ? r.json() : []),
        fetch(`${NGROK_URL}/api/logs?_t=${t}`, FETCH_OPTIONS).then(r => r.ok ? r.json() : [])
      ]);

      if (userSession && userSession.empId !== 'root') {
        const currentInDb = (resEmp || []).find(e => e.id === userSession.id);
        if (currentInDb?.currentSessionId && currentInDb.currentSessionId !== userSession.currentSessionId) {
          alert('⚠️ 系統通知：您的帳號已在其他裝置登入，您已被強制登出！');
          setUserSession(null);
          return;
        }
      }

      setData({
        employees: resEmp || [],
        records: (resRec || []).map(r => ({ ...r, dept: (!r.dept || r.dept === '未設定') ? ((resEmp || []).find(e => e.empId === r.empId)?.dept || '未設定') : r.dept })),
        sysLogs: (resLogs || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        loading: false,
        apiError: false
      });
    } catch (err) {
      setData(prev => ({ ...prev, loading: false, apiError: true }));
    }

    try {
      if (!calendarData.loaded) {
        const y = new Date().getFullYear();
        const [res1, res2] = await Promise.all([
           fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${y}.json`).then(r=>r.json()).catch(()=>[]),
           fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${y+1}.json`).then(r=>r.json()).catch(()=>[])
        ]);
        const arr = [...(res1||[]), ...(res2||[])];
        if (arr.length > 0) {
           const h = arr.filter(d => d.isHoliday).map(d => `${d.date.substring(0,4)}-${d.date.substring(4,6)}-${d.date.substring(6,8)}`);
           setCalendarData({ loaded: true, holidays: h });
        }
      }
    } catch(e) { console.warn("行事曆同步失敗", e); }
  };

  const logAction = async (user, type, details) => {
    if (!user?.empId) return;
    try {
      await fetch(`${NGROK_URL}/api/logs`, { 
        method: 'POST', headers: FETCH_OPTIONS.headers, 
        body: JSON.stringify({ serialId: `LOG-${Date.now()}`, formType: '系統日誌', empId: user.empId, name: user.name, dept: user.dept || '系統', actionType: type, details: typeof details === 'object' ? JSON.stringify(details) : details, createdAt: new Date().toISOString() }) 
      });
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!userSession) return;
    let ws;
    try {
      ws = new WebSocket(NGROK_URL.replace(/^http/, 'ws'));
      ws.onmessage = (e) => {
        try {
           const msg = JSON.parse(e.data);
           if (msg.type === 'NEW_RECORD' || msg.type === 'UPDATE' || msg.type === 'SSO_KICK') fetchData();
        } catch(err){}
      };
    } catch (e) { console.warn("WS 暫不支援或無法連線", e); }
    return () => { if(ws) ws.close(); }
  }, [userSession]);

  // 每 10 秒主動檢查一次 Session 狀態 (防止雙重登入)
  useEffect(() => {
    if (!userSession || userSession.empId === 'root') return;
    const checkSession = async () => {
      try {
        const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}?_t=${Date.now()}`, FETCH_OPTIONS);
        if (res.ok) {
          const dbUser = await res.json();
          if (dbUser.currentSessionId && dbUser.currentSessionId !== userSession.currentSessionId) {
            alert('⚠️ 系統通知：您的帳號已在其他裝置登入，您已被強制登出！');
            setUserSession(null);
          }
        }
      } catch (e) {}
    };
    const intervalId = setInterval(checkSession, 10000);
    return () => clearInterval(intervalId);
  }, [userSession, setUserSession]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (userSession) setReadAnns(JSON.parse(localStorage.getItem(`readAnns_${userSession.empId}`) || '[]'));
  }, [userSession]);

  return { ...data, readAnns, setReadAnns, announcements, setAnnouncements, calendarData, fetchData, logAction };
};

// =============================================================================
// 4. 原子化 UI Components
// =============================================================================
const BaseCard = ({ children, className = '' }) => <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100 ${className}`}>{children}</div>;
const ViewHeader = ({ title, subtitle, icon: Icon, rightElement }) => (
  <div className="bg-sky-600 dark:bg-sky-800 px-8 py-10 text-white flex justify-between items-center relative transition-colors duration-500">
    <div><h1 className="text-2xl font-black text-white">{title}</h1>{subtitle && <p className="mt-1 text-sm opacity-90 font-medium text-white">{subtitle}</p>}</div>
    {rightElement ? rightElement : (Icon && <Icon size={40} className="opacity-30 text-white" />)}
  </div>
);
const FormGroup = ({ label, required, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>{label && <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1 h-4">{label} {required && <span className="text-rose-500">*</span>}</label>}{children}</div>
);
const BaseInput = ({ className = '', ...props }) => <input className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 ${className}`} {...props} />;
const BaseSelect = ({ className = '', children, ...props }) => <select className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 ${className}`} {...props}>{children}</select>;
const BaseButton = ({ children, disabled, loading, className = '', ...props }) => (
  <button disabled={disabled || loading} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${disabled || loading ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600'} ${className}`} {...props}>
    {loading && <Loader2 size={20} className="animate-spin text-white" />}<span>{children}</span>
  </button>
);
const StatusBadge = ({ status, formType, onClick }) => {
  const isClickable = !!onClick;
  if (['approved', 'rejected', 'canceled'].includes(status)) {
    const config = { approved: { c: 'text-emerald-600 border-emerald-600', I: Check, l: '已核准' }, rejected: { c: 'text-rose-600 border-rose-600', I: X, l: '已駁回' }, canceled: { c: 'text-slate-400 border-slate-400', I: RotateCcw, l: formType === '請假' ? '已銷假' : '已撤銷' } }[status];
    return (<div onClick={onClick} className={`w-11 h-11 rounded-full border-[1.5px] flex flex-col items-center justify-center -rotate-[15deg] ${config.c} opacity-80 relative mx-1 ${isClickable?'cursor-pointer hover:scale-105 transition-all':''}`}><div className={`absolute inset-[2px] rounded-full border ${config.c} opacity-40`}></div><config.I size={14} strokeWidth={4} className="mb-0.5" /><span className="text-[8px] font-black leading-none">{config.l}</span></div>);
  }
  const labels = { pending_substitute: "待代理", pending_manager: "待經副理", pending_director: "待協理", pending_gm: "待總經理", pending_assignment: "待交辦", canceling_substitute: "待代理(銷)", canceling_manager: "待經副理(銷)", canceling_director: "待協理(銷)", canceling_gm: "待總(銷)", canceling_assignment: "待交(銷)", pending: "待簽核" };
  return (<span onClick={onClick} className={`px-3 py-1.5 rounded-full text-[10px] font-black border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center gap-1 shadow-sm ${isClickable?'cursor-pointer hover:ring-2':''}`}>{labels[status] || "處理中"} {isClickable && <Search size={10} />}</span>);
};

const RecordCard = ({ r, actionSlot, isSelectable, isSelected, onSelect, showPrint }) => {
  const { setWorkflowTarget, setPrintRecord } = useAppContext();
  const typeStyle = r.formType === '請假' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
                    r.formType === '出勤異常' ? 'bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' :
                    (r.appType === 'post' ? 'bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400');
  
  const typeLabel = r.formType === '請假' ? '請假申請' : r.formType === '出勤異常' ? '出勤異常' : (r.appType === 'post' ? '事後加班' : '事前加班');
  const catLabel = r.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || '未設定') : 
                   r.formType === '出勤異常' ? (ABNORMAL_CATEGORIES.find(c => c.id === r.category)?.label || '未設定') : 
                   (r.compensationType === 'leave' ? '換補休' : '計薪');

  return (
    <div onClick={isSelectable ? onSelect : undefined} className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm relative ${isSelectable ? 'cursor-pointer' : ''} ${isSelected ? 'bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-400 border-sky-400' : 'bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 border-slate-200 dark:border-slate-700'}`}>
      {showPrint && (
        <button type="button" onClick={(e) => { e.stopPropagation(); setPrintRecord(r); }} className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors" title="預覽並列印表單">
          <Printer size={16} />
        </button>
      )}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full text-sm mt-4 md:mt-0">
        {isSelectable && <div className="shrink-0 w-6 flex items-center justify-center"><div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-transparent'}`}>{isSelected && <Check size={14} strokeWidth={4} />}</div></div>}
        <div className="flex flex-col min-w-0 w-full md:w-[25%] md:shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`px-2.5 py-1 rounded text-[10px] font-black ${typeStyle}`}>{typeLabel}</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{catLabel}</span>
            <span className="font-mono text-[10px] font-bold text-slate-500">{r.serialId}</span>
          </div>
          <div className="font-black text-slate-800 dark:text-slate-100 text-base truncate w-full">{r.name} <span className="text-xs text-slate-500 font-bold ml-1">{r.dept}</span></div>
        </div>
        <div className="flex flex-col min-w-0 w-full md:w-[25%] md:shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">時間 {r.formType !== '出勤異常' && `(${r.totalHours}H)`}</p>
          <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300 leading-tight bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg inline-block w-fit">{r.startDate === r.endDate ? <span>{r.startDate} {r.startHour}:{r.startMin} ~ {r.endHour}:{r.endMin}</span> : <>{r.startDate} {r.startHour}:{r.startMin} ~<br/>{r.endDate} {r.endHour}:{r.endMin}</>}</div>
        </div>
        <div className="flex flex-col min-w-0 w-full md:w-[25%] flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">事由與意見</p>
          <p className="font-bold text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{r.reason || '無'}</p>
          {r.attachmentName && <a href={r.attachmentData} download={r.attachmentName} onClick={e=>e.stopPropagation()} className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center mt-1"><Paperclip size={10} className="mr-0.5"/>附件</a>}
        </div>
        <div className="w-full md:w-[20%] shrink-0 flex flex-col md:items-end justify-center border-t md:border-0 border-slate-100 dark:border-slate-700 pt-3 md:pt-0 mt-2 md:mt-0"><div className="flex items-center md:justify-end gap-2 w-full"><StatusBadge status={r.status} formType={r.formType} onClick={(e) => { e.stopPropagation(); setWorkflowTarget(r); }} />{actionSlot && actionSlot(r)}</div></div>
      </div>
    </div>
  );
};

const PrintModal = ({ record, onClose }) => {
  const { employees } = useAppContext();
  if (!record) return null;
  const applicant = employees.find(e => e.empId === record.empId) || {};
  const catLabel = record.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === record.category)?.label || '未設定') : 
                   record.formType === '出勤異常' ? (ABNORMAL_CATEGORIES.find(c => c.id === record.category)?.label || '未設定') : 
                   (record.compensationType === 'leave' ? '換補休' : '計薪');

  return (
    <div id="print-area" className="fixed inset-0 z-[500] bg-white overflow-y-auto print:absolute print:inset-0 text-slate-900 font-serif">
      <div className="max-w-[21cm] min-h-[29.7cm] mx-auto p-[2cm] bg-white text-sm">
        <div className="no-print flex justify-end gap-4 mb-4">
          <button onClick={onClose} className="px-6 py-2 bg-slate-100 rounded-lg font-bold text-slate-600 hover:bg-slate-200">返回</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-sky-600 rounded-lg font-bold text-white hover:bg-sky-700 flex items-center gap-2"><Printer size={16} /> 確認列印</button>
        </div>
        
        {/* A4 內容 */}
        <div className="border-4 border-slate-800 p-8 relative">
           <div className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-500">單號：{record.serialId}</div>
           <h1 className="text-3xl font-black text-center mb-1 tracking-[0.5em]">{record.formType}單</h1>
           <p className="text-center text-slate-500 font-bold mb-8 tracking-widest border-b-2 border-slate-800 pb-4">XX 科技股份有限公司</p>
           
           <table className="w-full border-collapse border border-slate-800 mb-8 text-base">
              <tbody>
                <tr>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 w-32 text-center">申請單位</td><td className="border border-slate-800 p-3">{record.dept}</td>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 w-32 text-center">申請日期</td><td className="border border-slate-800 p-3 font-mono">{record.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center">員工姓名</td><td className="border border-slate-800 p-3">{record.name}</td>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center">員工代號</td><td className="border border-slate-800 p-3 font-mono">{record.empId}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center">申請項目</td><td className="border border-slate-800 p-3 font-black text-sky-800">{catLabel}</td>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center">代理人</td><td className="border border-slate-800 p-3">{record.substitute || '無'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center">時間起迄</td>
                  <td className="border border-slate-800 p-3 font-mono" colSpan="3">
                    {record.startDate} {record.startHour}:{record.startMin} 至 {record.endDate} {record.endHour}:{record.endMin}
                    <span className="ml-4 font-black bg-slate-100 px-2 py-1 border border-slate-400">總計：{record.totalHours} 小時</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-800 bg-slate-100 font-bold p-3 text-center h-32 align-top">事由與備註</td>
                  <td className="border border-slate-800 p-3 align-top whitespace-pre-wrap leading-relaxed" colSpan="3">{record.reason || '無'}</td>
                </tr>
              </tbody>
           </table>

           <div className="grid grid-cols-4 gap-4 mt-12 text-center border-t border-slate-300 pt-8">
             <div><p className="font-bold mb-16 text-slate-500">申請人簽章</p><div className="border-b border-slate-400 mx-4"></div></div>
             <div><p className="font-bold mb-16 text-slate-500">單位主管簽章</p><div className="border-b border-slate-400 mx-4"></div></div>
             <div><p className="font-bold mb-16 text-slate-500">人資查驗</p><div className="border-b border-slate-400 mx-4"></div></div>
             <div><p className="font-bold mb-16 text-slate-500">最高主管核定</p><div className="border-b border-slate-400 mx-4"></div></div>
           </div>
           
           <div className="mt-8 text-[10px] text-slate-400">系統列印時間：{new Date().toLocaleString('zh-TW')} / 狀態：{record.status === 'approved' ? '已核准結案' : '流程進行中'}</div>
        </div>
      </div>
    </div>
  );
};

const ShareSelector = ({ formData, setFormData }) => {
  const { employees, availableDepts } = useAppContext();
  const [sDept, setSDept] = useState('');
  const [sEmp, setSEmp] = useState('');
  return (
    <div className="space-y-2 text-left mt-4 text-slate-900 dark:text-slate-100">
      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Eye size={12}/> 開放檢視權限 (選填)</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <BaseSelect className="flex-1 text-sm p-3" value={sDept} onChange={e=>{setSDept(e.target.value);setSEmp('');}}><option value="">-- 選擇部門 --</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</BaseSelect>
        <BaseSelect className="flex-1 text-sm p-3" value={sEmp} onChange={e=>setSEmp(e.target.value)} disabled={!sDept}><option value="">-- 選擇員工 --</option>{(employees||[]).filter(emp=>emp.dept===sDept && emp.empId!==formData.empId).map(emp=><option key={emp.empId} value={emp.empId}>{emp.name}</option>)}</BaseSelect>
        <button type="button" onClick={()=>{if(sEmp&&!formData.sharedWith.includes(sEmp)){setFormData({...formData,sharedWith:[...formData.sharedWith,sEmp]});setSEmp('');}}} disabled={!sEmp} className="px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-sm disabled:bg-slate-300">加入</button>
      </div>
      {formData.sharedWith.length>0 && <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">{formData.sharedWith.map(id=>{const emp=(employees||[]).find(e=>e.empId===id); return <span key={id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm">{emp?emp.name:id}<button type="button" onClick={()=>setFormData({...formData,sharedWith:formData.sharedWith.filter(v=>v!==id)})} className="text-rose-500 ml-1"><X size={14}/></button></span>})}</div>}
    </div>
  )
};

const PassInput = ({ label, value, field, showKey, Icon, shows, onToggle, onChange }) => (
  <FormGroup label={label}>
    <div className="relative group text-left">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors"><Icon size={18} /></div>
      <BaseInput type={shows[showKey] ? 'text' : 'password'} required className="pl-12 pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={value} onChange={e => onChange(field, e.target.value)} />
      <button type="button" onClick={() => onToggle(showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{shows[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  </FormGroup>
);

const ConfirmModal = ({ title, desc, onConfirm, onCancel, confirmText, confirmClass, icon:Icon }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
      <Icon size={48} className={`mx-auto mb-4 ${confirmClass.includes('rose')?'text-rose-500':'text-slate-400'}`} />
      <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-bold text-center leading-relaxed">{desc}</p>
      <div className="flex gap-3">
        {onCancel && <button onClick={onCancel} className="flex-1 py-3 font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-xl transition-colors">返回/取消</button>}
        <button onClick={onConfirm} className={`flex-1 py-3 font-black text-white rounded-xl ${confirmClass}`}>{confirmText}</button>
      </div>
    </div>
  </div>
);

const InfiniteScrollObserver = ({ onLoadMore, hasMore, isTable = false, colSpan = 1 }) => {
  const observerRef = useRef(null);
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) onLoadMore(); }, { rootMargin: '100px' });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) return null;
  const content = <div ref={observerRef} className="py-6 flex justify-center"><Loader2 className="animate-spin text-slate-300" size={24} /></div>;
  return isTable ? <tr className="block md:table-row border-none bg-transparent shadow-none"><td className="block md:table-cell border-none text-center" colSpan={colSpan}>{content}</td></tr> : content;
};

const WorkflowModal = ({ isOpen, onClose, record }) => {
  const { employees } = useAppContext();
  if (!isOpen || !record) return null;
  const days = (parseFloat(record.totalHours) || 0) / 8;
  const applicantRank = record.jobTitle || ((employees || []).find(e => e.empId === record.empId)?.jobTitle) || "";
  const isGM = applicantRank.includes('總經理'), isDirector = applicantRank.includes('協理'), isManager = applicantRank.includes('經理') || applicantRank.includes('副理');

  const statusHierarchy = [
    { id: 'submitted', label: '申請人送出' }, { id: 'pending_substitute', label: '職務代理人' }, { id: 'pending_manager', label: '部門經副理' },
    { id: 'pending_director', label: '部門協理' }, { id: 'pending_gm', label: '總經理室' }, { id: 'pending_assignment', label: '專員交辦' },
    { id: 'approved', label: '已核准' }, { id: 'canceling_substitute', label: '代理人(銷假)' }, { id: 'canceling_manager', label: '部門經副理(銷假)' },
    { id: 'canceling_director', label: '部門協理(銷假)' }, { id: 'canceling_gm', label: '總經理室(銷假)' }, { id: 'canceling_assignment', label: '專員交辦(銷假)' },
    { id: 'canceled', label: '已銷假/撤銷' }
  ];

  const getRequiredNodes = () => {
    let nodes = [];
    const buildNodes = (startNode, isCancelFlow) => {
       let tempNodes = [startNode];
       if (isCancelFlow && record.formType === '請假') tempNodes.push('canceling_substitute');
       else if (!isCancelFlow && record.formType === '請假') tempNodes.push('pending_substitute');
       let current = '', targetEnd = isCancelFlow ? 'canceling_assignment' : 'pending_assignment';
       if (isGM) current = targetEnd;
       else if (isDirector) current = isCancelFlow ? 'canceling_gm' : 'pending_gm';
       else if (isManager) current = isCancelFlow ? 'canceling_director' : 'pending_director';
       else current = isCancelFlow ? 'canceling_manager' : 'pending_manager';
       let step = current;
       while (step && step !== targetEnd) {
           tempNodes.push(step);
           if (step === 'pending_manager' || step === 'canceling_manager') step = days > 3 ? (isCancelFlow ? 'canceling_director' : 'pending_director') : targetEnd;
           else if (step === 'pending_director' || step === 'canceling_director') step = (isManager && days >= 1) || days > 5 ? (isCancelFlow ? 'canceling_gm' : 'pending_gm') : targetEnd;
           else if (step === 'pending_gm' || step === 'canceling_gm') step = targetEnd;
           else break;
       }
       tempNodes.push(targetEnd, !isCancelFlow ? 'approved' : 'canceled');
       return tempNodes;
    };
    if (record.status.startsWith('canceling_') || record.status === 'canceled') nodes = ['submitted', 'approved', ...buildNodes('approved', true).slice(1)];
    else nodes = buildNodes('submitted', false);
    return [...new Set(nodes)];
  };

  const requiredNodes = getRequiredNodes();
  let currentStatusIdx = requiredNodes.indexOf(record.status === 'pending' ? 'pending_manager' : record.status);
  if (record.status === 'rejected') currentStatusIdx = 2; 

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 dark:bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3 text-white"><Search size={24} className="text-sky-400" /><div><h3 className="font-black text-lg">流程追蹤</h3><p className="text-[10px] opacity-60 font-mono">#{record.serialId}</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <div className="p-10 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-800/50">
          {requiredNodes.map((nodeId, index) => {
            const nodeInfo = statusHierarchy.find(h => h.id === nodeId);
            const isLast = index === requiredNodes.length - 1;
            let stepStatus = index < currentStatusIdx || record.status === 'approved' || record.status === 'canceled' ? "done" : (index === currentStatusIdx ? "current" : "pending");
            if (record.status === 'rejected' && index === currentStatusIdx) stepStatus = "error";

            return (
              <div key={nodeId} className="flex gap-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${stepStatus === "done" ? "bg-emerald-500 border-emerald-500 text-white" : stepStatus === "current" ? "bg-white dark:bg-slate-900 border-sky-500 text-sky-500 ring-4 ring-sky-50 dark:ring-sky-900" : stepStatus === "error" ? "bg-rose-500 border-rose-500 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-500"}`}>
                    {stepStatus === "done" ? <CheckIcon size={16} strokeWidth={4} /> : stepStatus === "current" ? <ClockIcon size={16} strokeWidth={3} /> : stepStatus === "error" ? <XCircle size={16} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  {!isLast && <div className={`w-0.5 h-12 ${index < currentStatusIdx || record.status === 'approved' || record.status === 'canceled' ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />}
                </div>
                <div className="pt-0.5 pb-10 flex-1">
                  <h4 className={`text-sm font-black ${stepStatus === "current" ? "text-sky-600 dark:text-sky-400" : stepStatus === "done" ? "text-emerald-600 dark:text-emerald-400" : stepStatus === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>{nodeInfo?.label || nodeId}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 leading-relaxed">{stepStatus === 'done' ? '已通過' : stepStatus === 'current' ? '簽核中' : '等待簽核'}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 p-6 text-center"><button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300">關閉視窗</button></div>
      </div>
    </div>
  );
};

// =============================================================================
// 5. 模組化業務視圖 (VIEWS)
// =============================================================================

// --- 簽核代理設定視圖 ---
const DelegationView = () => {
  const { userSession, employees, onRefresh, setNotification, onLogAction } = useAppContext();
  const currentUserData = useMemo(() => employees.find(e => e.empId === userSession.empId) || userSession, [employees, userSession]);
  const [isActive, setIsActive] = useState(currentUserData.delegationActive || false);
  const [delegatedTo, setDelegatedTo] = useState(currentUserData.delegatedTo || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsActive(currentUserData.delegationActive || false);
    setDelegatedTo(currentUserData.delegatedTo || '');
  }, [currentUserData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isActive && !delegatedTo) return setNotification({ type: 'error', text: '啟用代理時，請選擇一位代理人' });
    if (isActive && delegatedTo === userSession.empId) return setNotification({ type: 'error', text: '代理人不能是自己' });
    
    setLoading(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${currentUserData.id}`, {
        method: 'PATCH',
        headers: FETCH_OPTIONS.headers,
        body: JSON.stringify({ delegationActive: isActive, delegatedTo: isActive ? delegatedTo : '' })
      });
      if (!res.ok) throw new Error('API Error');
      
      const delegateName = isActive ? (employees.find(e => e.empId === delegatedTo)?.name || delegatedTo) : '';
      await onLogAction(userSession, '人事管理', `設定簽核代理：${isActive ? `啟用 (代理人: ${delegateName})` : '停用'}`);
      
      setNotification({ type: 'success', text: '簽核代理設定已更新' });
      onRefresh();
    } catch (err) {
      setNotification({ type: 'error', text: '設定失敗，請稍後再試' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <BaseCard>
        <ViewHeader title="簽核權限代理" subtitle="當您休假或公出時，可將表單簽核權限暫時委託給其他同仁" icon={GitMerge} />
        <form onSubmit={handleSave} className="p-10 space-y-8 max-w-2xl mx-auto py-12 text-left">
          <div className="bg-sky-50 dark:bg-sky-900/30 border-l-4 border-sky-500 p-5 rounded-r-2xl text-sm font-bold text-sky-800 dark:text-sky-300 shadow-sm leading-relaxed">
            <p className="flex items-center gap-2 mb-2 font-black text-sky-900 dark:text-sky-400"><Info size={18}/> 代理機制說明</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>啟用後，您指定的代理人將能在其「待簽核單據」中看到並處理原屬於您的表單。</li>
              <li>您本身仍保有簽核權限，雙方皆可進行簽核作業。</li>
              <li>休假結束後，請務必回來關閉代理機制。</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">啟用代理</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">目前狀態：{isActive ? <span className="text-emerald-600 dark:text-emerald-400">運作中</span> : '已停用'}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {isActive && (
            <div className="animate-in slide-in-from-top-4 fade-in">
              <FormGroup label="選擇職務代理人" required>
                <div className="relative text-left">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><UserPlus size={18} /></div>
                  <BaseSelect required className="pl-12" value={delegatedTo} onChange={e => setDelegatedTo(e.target.value)}>
                    <option value="" disabled>-- 請選擇同仁 --</option>
                    {employees.filter(e => e.empId !== userSession.empId).map(e => (
                      <option key={e.empId} value={e.empId}>{e.dept} - {e.name} ({e.jobTitle})</option>
                    ))}
                  </BaseSelect>
                </div>
              </FormGroup>
            </div>
          )}

          <BaseButton loading={loading}><CheckCircle size={20} className={!loading ? "text-white" : "hidden"} /> <span className="text-white">儲存設定</span></BaseButton>
        </form>
      </BaseCard>
    </div>
  );
};

// --- 統計報表 (Chart.js) ---
const ReportsView = () => {
  const { records } = useAppContext();
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => setChartLoaded(true);
      document.head.appendChild(script);
    } else {
      setChartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!chartLoaded || !window.Chart || !chartRef1.current || !chartRef2.current) return;

    // 1. 各部門加班時數統計
    const otData = {};
    records.filter(r => r.formType === '加班' && r.status === 'approved').forEach(r => {
      otData[r.dept] = (otData[r.dept] || 0) + parseFloat(r.totalHours || 0);
    });
    const c1 = new window.Chart(chartRef1.current, {
      type: 'bar',
      data: {
        labels: Object.keys(otData),
        datasets: [{ label: '總加班時數 (HR)', data: Object.values(otData), backgroundColor: '#0ea5e9', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // 2. 請假事由分佈
    const lvData = {};
    records.filter(r => r.formType === '請假' && r.status === 'approved').forEach(r => {
      const cat = LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || r.category;
      lvData[cat] = (lvData[cat] || 0) + parseFloat(r.totalHours || 0);
    });
    const c2 = new window.Chart(chartRef2.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(lvData),
        datasets: [{ data: Object.values(lvData), backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#06b6d4'], borderWidth: 2, borderColor: '#fff' }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%' }
    });

    return () => { c1.destroy(); c2.destroy(); };
  }, [chartLoaded, records]);

  return (
    <div className="space-y-8 animate-in fade-in">
      <BaseCard>
        <ViewHeader title="統計報表" subtitle="人力資源與出勤狀況數據分析" bgClass="bg-indigo-600" icon={PieChart} />
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-sky-500"/> 各部門累計加班時數</h3>
            <div className="h-64 relative"><canvas ref={chartRef1}></canvas></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2"><PieChart size={18} className="text-emerald-500"/> 全公司請假假別分佈</h3>
            <div className="h-64 relative"><canvas ref={chartRef2}></canvas></div>
          </div>
        </div>
      </BaseCard>
    </div>
  );
};

const LoginView = ({ employees, apiError, onLogAction, onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36); 

    if (identifier.trim() === 'root') {
      const today = new Date(), dynamicPassword = `${today.getFullYear() - 1911}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      if (password.trim() === dynamicPassword) {
        const rootUser = { id: 'root', empId: 'root', name: '系統管理員', jobTitle: '最高管理員', dept: '資訊部', currentSessionId: newSessionId, hireDate: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString() };
        await onLogAction(rootUser, '登入/登出', '系統管理員登入成功'); onLogin(rootUser);
      } else setError('帳號或密碼不正確');
      setLoading(false); return;
    }
    if (!employees || employees.length === 0) { setError('目前無法連線到資料庫，請確認伺服器已啟動。'); setLoading(false); return; }
    try {
      const user = employees.find(emp => emp.name === identifier.trim() || emp.empId === identifier.trim());
      if (user && ((user.password && user.password !== "") ? user.password : user.empId) === password.trim()) {
        await fetch(`${NGROK_URL}/api/employees/${user.id}`, { method: 'PATCH', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ currentSessionId: newSessionId }) });
        const updatedUser = { ...user, currentSessionId: newSessionId };
        await onLogAction(updatedUser, '登入/登出', '使用者登入成功'); 
        onLogin(updatedUser);
      } else setError('帳號或密碼不正確');
    } catch (err) { setError('登入處理發生系統錯誤，請重試'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 font-sans text-slate-900 dark:text-slate-100 relative">
      <BaseCard className="max-w-md w-full animate-in zoom-in-95 duration-500 z-10">
        <div className="bg-sky-600 dark:bg-sky-800 p-12 text-white text-center relative overflow-hidden text-left"><div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl text-left"></div><UserCheck size={44} className="mx-auto mb-4 opacity-90 text-white text-left" /><h1 className="text-3xl font-black tracking-tight relative z-10 text-center text-white text-left">員工服務平台</h1><p className="text-sky-100 mt-2 opacity-90 text-sm relative z-10 font-medium text-center text-white text-left">系統登入驗證</p></div>
        <form onSubmit={handleLogin} className="p-10 space-y-6 text-left">
          {apiError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-700 text-xs font-bold text-left"><AlertTriangle size={18} className="shrink-0 text-amber-700" /> 後端連線異常，目前為離線狀態。<br/>請確認 server.js 是否已執行。</div>}
          {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 text-left"><AlertTriangle size={18} className="text-rose-600" /> {error}</div>}
          <div className="space-y-4 text-left">
            <FormGroup label="員編或姓名"><BaseInput required value={identifier} onChange={e => setIdentifier(e.target.value)} /></FormGroup>
            <FormGroup label="密碼"><div className="relative text-left"><BaseInput type={showPassword ? 'text' : 'password'} required className="pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={password} onChange={e => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-left"><Eye size={18} className="text-slate-400" /></button></div></FormGroup>
          </div>
          <BaseButton loading={loading}>確認登入</BaseButton>
        </form>
      </BaseCard>
    </div>
  );
};

const WelcomeView = () => {
  const { userSession, records, isAdmin, announcements, employees, readAnns, markAnnAsRead, setActiveMenu } = useAppContext();
  const stats = useMemo(() => Utils.calculatePTO(userSession.empId, userSession.hireDate, records), [records, userSession]);
  const counts = useMemo(() => ({
    sub: (records || []).filter(r => r.formType === '請假' && ['pending_substitute', 'canceling_substitute'].includes(r.status) && r.substitute === userSession.name).length,
    mgr: isAdmin ? (records || []).filter(r => Utils.canApprove(userSession, r, employees)).length : 0,
    myOT: (records || []).filter(r => r.empId === userSession.empId && r.formType === '加班' && !['approved', 'rejected', 'canceled'].includes(r.status)).length,
    myLV: (records || []).filter(r => r.empId === userSession.empId && r.formType === '請假' && !['approved', 'rejected', 'canceled'].includes(r.status)).length,
    myAB: (records || []).filter(r => r.empId === userSession.empId && r.formType === '出勤異常' && !['approved', 'rejected', 'canceled'].includes(r.status)).length,
  }), [records, userSession, isAdmin, employees]);

  const userWarningStatus = useMemo(() => {
    if (!userSession.hireDate) return null;
    const nextAnniv = Utils.getNextAnniversary(userSession.hireDate);
    if (!nextAnniv) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const projectedTotal = stats.remainAnnual + Utils.getProjectedPTO(userSession.hireDate, nextAnniv);
    
    let phase = null;
    if (daysLeft <= 30) phase = 30;
    else if (daysLeft <= 60) phase = 60;
    else if (daysLeft <= 90) phase = 90;

    return projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0 ? { active: true, daysLeft, projectedTotal, overHours: projectedTotal - 240, nextAnnivStr: nextAnniv.toISOString().split('T')[0], phase } : null;
  }, [userSession.hireDate, stats.remainAnnual]);

  const teamWatchlist = useMemo(() => {
    if (!isAdmin) return [];
    const team = (employees || []).filter(emp => {
      if (emp.empId === userSession.empId) return false; 
      if (userSession.empId === 'root') return true;
      const isEmpManager = emp.jobTitle?.includes("經理") || emp.jobTitle?.includes("副理") || emp.jobTitle?.includes("協理");
      const userRank = userSession.jobTitle || '';
      if (userSession.empId === '9001' || userRank.includes('總經理')) return emp.dept === userSession.dept || isEmpManager;
      if (userRank.includes('協理')) {
        if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(emp.dept);
        if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept);
      }
      return emp.dept === userSession.dept;
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    return team.map(emp => {
      const estats = Utils.calculatePTO(emp.empId, emp.hireDate, records);
      const nextAnniv = Utils.getNextAnniversary(emp.hireDate);
      if (!nextAnniv) return null;
      const daysLeft = Math.ceil((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const projectedTotal = estats.remainAnnual + Utils.getProjectedPTO(emp.hireDate, nextAnniv);
      
      let phase = null;
      if (daysLeft <= 30) phase = 30;
      else if (daysLeft <= 60) phase = 60;
      else if (daysLeft <= 90) phase = 90;

      return projectedTotal > 240 && daysLeft <= 90 && daysLeft > 0 ? { ...emp, remainAnnual: estats.remainAnnual, projectedTotal, daysLeft, nextAnnivStr: nextAnniv.toISOString().split('T')[0], overHours: projectedTotal - 240, phase } : null;
    }).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [isAdmin, employees, records, userSession]);

  const activeAnns = useMemo(() => (announcements || []).filter(ann => !ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]), [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left text-slate-900">
      {userWarningStatus && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-2xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 text-left">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full shrink-0 animate-pulse mt-0.5"><AlertTriangle className="text-rose-600 dark:text-rose-400" size={24} /></div>
          <div className="text-left">
            <h3 className="text-rose-800 dark:text-rose-300 font-black text-lg flex items-center gap-2 text-left">特休時數超標預警 <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm text-left">【{userWarningStatus.phase}天內到期通知】 倒數 {userWarningStatus.daysLeft} 天</span></h3>
            <p className="text-rose-700 dark:text-rose-400 mt-1.5 text-sm font-medium leading-relaxed text-left">您的到職週年日 (<span className="font-bold">{userWarningStatus.nextAnnivStr}</span>) 即將到來。預計發放新特休後將達 <span className="font-bold">{userWarningStatus.projectedTotal} 小時</span>，超過 240 小時之規定上限。<strong className="block mt-1 text-rose-900 dark:text-rose-200 bg-rose-200/50 dark:bg-rose-800/50 inline-block px-2 py-0.5 rounded text-left">屆時超過之 {userWarningStatus.overHours} 小時將自動歸零，請盡速安排休假，以免影響權益。</strong></p>
          </div>
        </div>
      )}

      <div className="bg-sky-600 dark:bg-sky-800 rounded-3xl p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500">
        <div className="space-y-3">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-2 border border-white/10"><Sparkles size={14}/> 員工服務中心</div>
          <h1 className="text-3xl md:text-4xl font-black">歡迎回來，{userSession.name}！</h1>
          <p className="text-sky-100 font-medium opacity-90 max-w-lg">這裡是您的數位辦公空間。快速申請、查詢進度或管理個人資料。</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[180px]">
          <div className="text-xs font-bold text-sky-100 mb-1">{userSession.dept}</div>
          <div className="text-2xl font-black">{userSession.jobTitle}</div>
          <div className="text-[10px] font-mono mt-2 bg-white/20 px-2 py-1 rounded-full">{userSession.empId}</div>
        </div>
      </div>

      <BaseCard>
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><Bell size={20} className="text-rose-500" /><h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">最新公告</h2></div>
          <button onClick={() => setActiveMenu('announcement-list')} className="text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">查看全部 <ArrowRight size={12} /></button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {activeAnns.slice(0, 3).map(ann => (
            <div key={ann.id} onClick={() => { markAnnAsRead(ann.id); }} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer">
              <span className="px-2 py-1 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label || '一般'}</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400">{ann.date}</span>
            </div>
          ))}
          {activeAnns.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold italic">目前無公告資訊</div>}
        </div>
      </BaseCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseCard className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl"><CalendarDays size={28} /></div>
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">特休餘額</p>
                {userWarningStatus && <AlertTriangle size={14} className="text-rose-500 animate-bounce mb-1" title="即遇到期" />}
              </div>
              <div className="flex items-baseline gap-1"><span className="text-3xl font-black">{userSession.hireDate ? stats.remainAnnual : '-'}</span><span className="text-sm font-bold text-slate-400">HR</span></div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">總額度 {stats.totalAnnual}</span>
            <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">已休 {stats.usedAnnual}</span>
          </div>
        </BaseCard>
        <BaseCard className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl"><Timer size={28} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">補休餘額</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl font-black">{stats.remainComp}</span><span className="text-sm font-bold text-slate-400">HR</span></div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-300">累計 {stats.earnedComp}</span>
            <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">已用 {stats.usedComp}</span>
          </div>
        </BaseCard>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-6`}>
        <div onClick={()=>setActiveMenu('substitute')} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 shadow-sm cursor-pointer transition-all active:scale-95">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-2xl"><UserCheck size={28} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">代理待確認</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl font-black">{counts.sub}</span><span className="text-sm font-bold text-slate-400">件</span></div>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div onClick={()=>setActiveMenu('approval')} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 shadow-sm cursor-pointer transition-all active:scale-95">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl"><ShieldCheck size={28} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">待簽核單據</p>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-black">{counts.mgr}</span><span className="text-sm font-bold text-slate-400">件</span></div>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-50 dark:hover:bg-sky-900/50 px-5 py-3 rounded-2xl cursor-pointer group" onClick={()=>setActiveMenu('overtime')}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center gap-1">加班處理中 <ArrowRight size={12}/></span>
            <span className="text-xl font-black">{counts.myOT}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-50 dark:hover:bg-sky-900/50 px-5 py-3 rounded-2xl cursor-pointer group" onClick={()=>setActiveMenu('leave-apply')}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center gap-1">請假處理中 <ArrowRight size={12}/></span>
            <span className="text-xl font-black">{counts.myLV}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 hover:bg-sky-50 dark:hover:bg-sky-900/50 px-5 py-3 rounded-2xl cursor-pointer group" onClick={()=>setActiveMenu('abnormality')}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center gap-1">異常單處理中 <ArrowRight size={12}/></span>
            <span className="text-xl font-black">{counts.myAB}</span>
          </div>
        </div>
      </div>

      {isAdmin && teamWatchlist.length > 0 && (
        <BaseCard className="border-rose-200 dark:border-rose-800 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-rose-50 dark:bg-rose-900/30 border-b border-rose-100 dark:border-rose-800 p-5 sm:px-8 flex items-center justify-between gap-3 text-left"><div className="flex items-center gap-3 text-left"><div className="p-2 bg-rose-500 rounded-xl text-white shadow-sm text-left text-white"><AlertTriangle size={20} /></div><div className="text-left"><h2 className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest text-left">團隊特休超標關注名單 (90天內)</h2><p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5 font-bold text-left">近期發放特休且預估超標之人員，請盡速督促排休</p></div></div><span className="bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm text-left text-white">需關注 {teamWatchlist.length} 人</span></div>
          <div className="overflow-hidden md:overflow-x-auto text-left">
            <table className="w-full text-left text-sm whitespace-nowrap block md:table">
              <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-left">
                <tr><th className="p-4 px-8 text-left">員工姓名 / 單位</th><th className="p-4 text-left">發放日 / 倒數</th><th className="p-4 text-right text-left">目前結餘</th><th className="p-4 text-right text-left">預測總計</th><th className="p-4 text-right px-8 text-left">預計歸零</th></tr>
              </thead>
              <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-slate-100 dark:divide-slate-700 text-left p-4 md:p-0">
                {teamWatchlist.map(emp => (
                  <tr key={emp.id} className="block md:table-row bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors text-left overflow-hidden">
                    <td className="flex md:table-cell justify-between items-start md:items-center p-4 md:px-8 border-b border-slate-100 dark:border-slate-700 md:border-none text-left">
                      <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">員工姓名 / 單位</span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{emp.name} <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 ml-1 font-medium">({emp.empId})</span></div>
                        <div className="text-[10px] text-slate-500 font-bold">{emp.dept} / {emp.jobTitle}</div>
                      </div>
                    </td>
                    <td className="flex md:table-cell justify-between items-start md:items-center p-4 border-b border-slate-100 dark:border-slate-700 md:border-none text-left">
                      <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">發放日 / 倒數</span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{emp.nextAnnivStr}</div>
                        <div className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded ${emp.phase === 30 ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' : emp.phase === 60 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'}`}>{emp.phase}天內通知 (剩 {emp.daysLeft} 天)</div>
                      </div>
                    </td>
                    <td className="flex md:table-cell justify-between items-center p-4 md:text-right font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 md:border-none text-left">
                      <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">目前結餘</span>
                      {emp.remainAnnual} HR
                    </td>
                    <td className="flex md:table-cell justify-between items-center p-4 md:text-right font-black text-rose-600 dark:text-rose-500 border-b border-slate-100 dark:border-slate-700 md:border-none text-left">
                      <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">預測總計</span>
                      {emp.projectedTotal} HR
                    </td>
                    <td className="flex md:table-cell justify-between items-center p-4 md:px-8 md:text-right text-left">
                      <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">預計歸零</span>
                      <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm border border-rose-200 dark:border-rose-800">-{emp.overHours} HR</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BaseCard>
      )}
    </div>
  );
};

const GenericApplyView = ({ type, currentSerialId }) => {
  const { onRefresh, records, employees, setNotification, userSession, availableDepts, onLogAction, setWorkflowTarget, calendarData } = useAppContext();
  const isOT = type === '加班', isLV = type === '請假', isAb = type === '出勤異常';
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  
  const [fd, setFd] = useState({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', jobTitle: userSession.jobTitle || '', category: isOT ? 'regular' : isAb ? 'forgot_logout' : 'annual', compensationType: 'leave', substitute: '', startDate: '', startHour: '09', startMin: '00', endDate: '', endHour: '18', endMin: '00', reason: '', attachmentName: '', attachmentData: null, appType: 'pre', sharedWith: [] });

  // 本機草稿功能 (Local Storage)
  useEffect(() => {
    const draft = localStorage.getItem(`draft_${type}_${userSession.empId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFd(prev => ({ ...prev, ...parsed, serialId: currentSerialId })); // serialId 不應該被草稿覆蓋
      } catch (e) { console.error('無法讀取草稿', e); }
    }
  }, [type, userSession.empId, currentSerialId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`draft_${type}_${userSession.empId}`, JSON.stringify(fd));
    }, 1000); // 1秒 debounce
    return () => clearTimeout(timer);
  }, [fd, type, userSession.empId]);

  const total = useMemo(() => {
    if (isAb || !fd.startDate || !fd.endDate) return 0;
    const s = new Date(`${fd.startDate}T${fd.startHour}:${fd.startMin}:00`), e = new Date(`${fd.endDate}T${fd.endHour}:${fd.endMin}:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
    if (isOT) return Math.round(((e - s) / 3600000) * 10) / 10;
    
    let tMs = 0, cD = new Date(s); cD.setHours(0,0,0,0); const eD = new Date(e); eD.setHours(0,0,0,0);
    while (cD <= eD) {
      const dateStr = `${cD.getFullYear()}-${String(cD.getMonth() + 1).padStart(2, '0')}-${String(cD.getDate()).padStart(2, '0')}`;
      let isDayOff = false;
      if (calendarData.loaded) {
        isDayOff = calendarData.holidays.includes(dateStr);
      } else {
        const fallbackHolidays = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-10-10'];
        isDayOff = (cD.getDay() === 0 || cD.getDay() === 6) || fallbackHolidays.includes(dateStr);
      }

      if (!isDayOff) {
        const wS = new Date(cD).setHours(9,0,0,0), wE = new Date(cD).setHours(18,0,0,0), oS = Math.max(s.getTime(), wS), oE = Math.min(e.getTime(), wE);
        if (oE > oS) { let dMs = oE - oS; const lS = new Date(cD).setHours(12,30,0,0), lE = new Date(cD).setHours(13,30,0,0), lOS = Math.max(oS, lS), lOE = Math.min(oE, lE); if (lOE > lOS) dMs -= (lOE - lOS); tMs += dMs; }
      }
      cD.setDate(cD.getDate() + 1);
    }
    return Math.max(0, Math.round((tMs / 3600000) * 10) / 10);
  }, [fd, isOT, isAb, calendarData]);

  const calculatedCompensation = useMemo(() => {
    if (!isOT || total <= 0) return { leave: 0, payStr: '0' };
    let payHours = 0; const h = Number(total);
    if (fd.category === 'rest') payHours = h <= 2 ? h * 1.34 : (h <= 8 ? 2 * 1.34 + (h - 2) * 1.67 : 2 * 1.34 + 6 * 1.67 + (h - 8) * 2.67);
    else if (fd.category === 'holiday') payHours = h <= 8 ? 8 : (h <= 10 ? 8 + (h - 8) * 1.34 : 8 + 2 * 1.34 + (h - 10) * 1.67);
    else payHours = h <= 2 ? h * 1.34 : 2 * 1.34 + (h - 2) * 1.67;
    return { leave: h, payStr: payHours > 0 ? (Math.round(payHours * 100) / 100).toFixed(2) : '0' };
  }, [total, fd.category, isOT]);

  const currentMonthOTHours = useMemo(() => isOT && fd.startDate ? records.filter(r => r.formType === '加班' && r.empId === fd.empId && r.status === 'approved' && r.startDate && r.startDate.substring(0, 7) === fd.startDate.substring(0, 7)).reduce((sum, r) => sum + (parseFloat(r.totalHours) || 0), 0) : 0, [records, fd.startDate, fd.empId, isOT]);
  const isOverLimit = isOT && (currentMonthOTHours + (Number(total) || 0) > 46);

  // 判斷代理人是否剛好請假
  const isSubstituteOnLeave = useMemo(() => {
    if (!isLV || !fd.substitute || !fd.startDate || !fd.endDate) return false;
    const subEmp = employees.find(e => e.name === fd.substitute && e.dept === fd.dept);
    if (!subEmp) return false;
    const subLeaves = records.filter(r => r.empId === subEmp.empId && r.formType === '請假' && !['rejected', 'canceled'].includes(r.status));
    return Utils.isTimeOverlapping(fd, subLeaves);
  }, [isLV, fd.substitute, fd.startDate, fd.startHour, fd.startMin, fd.endDate, fd.endHour, fd.endMin, fd.dept, employees, records]);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (submitting) return;

    if (!isAb && total <= 0) {
      return setNotification({ type: 'error', text: '時間區間無效！結束時間必須晚於開始時間，且結算時數不可為 0' });
    }
    if (isOverLimit) {
      return setNotification({ type: 'error', text: '已超過當月法定加班時數上限' });
    }

    if (isAb && fd.category === 'other' && !fd.reason.trim()) return setNotification({ type: 'error', text: '請填寫其他原因之詳細說明' });
    setSubmitting(true);
    
    if (!isAb && Utils.isTimeOverlapping(fd, records.filter(r => r.empId === fd.empId))) { setNotification({ type: 'error', text: '時段重疊' }); setSubmitting(false); return; }
    
    try {
      if (isLV) {
        const freshRes = await fetch(`${NGROK_URL}/api/records?_t=${Date.now()}`, FETCH_OPTIONS);
        const stats = Utils.calculatePTO(userSession.empId, userSession.hireDate, await freshRes.json());
        if (fd.category === 'annual' && total > stats.remainAnnual) throw new Error('特休餘額不足');
        if (fd.category === 'comp' && total > stats.remainComp) throw new Error('補休餘額不足');
      }
      let initStatus = isLV ? 'pending_substitute' : 'pending_manager';
      if (!isLV) {
        const rk = userSession.jobTitle || '';
        if (rk.includes('總經理')) initStatus = 'pending_assignment';
        else if (rk.includes('協理')) initStatus = 'pending_gm';
        else if (rk.includes('經理') || rk.includes('副理')) initStatus = 'pending_director';
      }
      const payload = { ...fd, endDate: isAb ? fd.startDate : fd.endDate, serialId: currentSerialId, formType: type, totalHours: isAb ? 0 : total, status: initStatus, sharedWith: fd.sharedWith.join(','), createdAt: new Date().toISOString() };
      await fetch(`${NGROK_URL}/api/records`, { method: 'POST', headers: FETCH_OPTIONS.headers, body: JSON.stringify(payload) });
      await onLogAction(userSession, '表單申請', `送出${type}單 (${currentSerialId})`);
      setNotification({ type: 'success', text: '送出成功' }); onRefresh();
      
      // 送出成功後清空草稿與表單
      localStorage.removeItem(`draft_${type}_${userSession.empId}`);
      setFd({ name: userSession.name, empId: userSession.empId, dept: userSession.dept || '', jobTitle: userSession.jobTitle || '', category: isOT ? 'regular' : isAb ? 'forgot_logout' : 'annual', compensationType: 'leave', substitute: '', startDate: '', startHour: '09', startMin: '00', endDate: '', endHour: '18', endMin: '00', reason: '', attachmentName: '', attachmentData: null, appType: 'pre', sharedWith: [] }); 
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) { setNotification({ type: 'error', text: err.message || '送出失敗' }); } finally { setSubmitting(false); }
  };

  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { setNotification({ type: 'error', text: '檔案大小不能超過 5MB' }); e.target.value = ''; return; } const reader = new FileReader(); reader.onloadend = () => { setFd(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result })); }; reader.readAsDataURL(file); } };

  const recs = useMemo(() => records.filter(r => r.formType === type && (userSession.empId === 'root' || r.empId === userSession.empId)).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)), [records, type, userSession.empId]);

  return (
    <div className="space-y-8 animate-in fade-in">
      {withdrawTarget && <ConfirmModal title="確定要抽單刪除？" desc={`單號：${withdrawTarget.serialId}`} onCancel={() => setWithdrawTarget(null)} onConfirm={async () => { try { await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: FETCH_OPTIONS.headers }); await onLogAction(userSession, '單據撤銷', `刪除單據 (${withdrawTarget.serialId})`); setNotification({ type: 'success', text: '已成功刪除單據' }); setWithdrawTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '刪除失敗' }); } }} confirmText="確認刪除" confirmClass="bg-rose-500" icon={AlertTriangle} />}
      {cancelTarget && <ConfirmModal title="確定要申請撤銷/銷假？" desc={`將送出撤銷/銷假簽核流程。單號：${cancelTarget.serialId}`} onCancel={() => setCancelTarget(null)} onConfirm={async () => { try { let targetStatus = cancelTarget.formType === '請假' ? 'canceling_substitute' : 'canceling_manager'; const ur = userSession.jobTitle || ''; if(cancelTarget.formType !== '請假') { if(ur.includes('總經理')) targetStatus = 'canceling_assignment'; else if(ur.includes('協理')) targetStatus = 'canceling_gm'; else if(ur.includes('經理')||ur.includes('副理')) targetStatus = 'canceling_director'; } await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ status: targetStatus, opinion: '申請人發起撤銷流程' }) }); await onLogAction(userSession, '單據撤銷', `發起撤銷申請 (${cancelTarget.serialId})`); setNotification({ type: 'success', text: '已成功送出撤銷申請' }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '操作失敗' }); } }} confirmText="送出撤銷" confirmClass="bg-sky-600" icon={Undo2} />}
      
      <BaseCard>
        <ViewHeader title={`${type}${isAb?'確認單':'申請單'}`} subtitle={`提交您的${type}紀錄`} icon={isOT ? Clock : isLV ? CalendarPlus : Fingerprint} rightElement={<div className="bg-white/20 px-4 py-2 rounded-full border border-white/20 font-bold text-[11px] font-mono text-white">NO.{currentSerialId}</div>} />
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {isOT && <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl"><button type="button" onClick={() => setFd({...fd, appType:'pre'})} className={`py-3 rounded-xl font-black ${fd.appType === 'pre' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow' : 'text-slate-400'}`}>事前申請</button><button type="button" onClick={() => setFd({...fd, appType:'post'})} className={`py-3 rounded-xl font-black ${fd.appType === 'post' ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow' : 'text-slate-400'}`}>事後補報</button></div>}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <FormGroup label="員編"><BaseInput value={fd.empId} onChange={e=>setFd({...fd, empId:e.target.value})} /></FormGroup>
            <FormGroup label="姓名"><BaseInput value={fd.name} onChange={e=>setFd({...fd, name:e.target.value})} /></FormGroup>
            <FormGroup label="部門" required><BaseSelect required value={fd.dept} onChange={e=>setFd({...fd, dept:e.target.value})}><option value="" disabled>請選擇</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}</BaseSelect></FormGroup>
            {isLV && <FormGroup label="職稱"><BaseInput value={fd.jobTitle} onChange={e=>setFd({...fd, jobTitle:e.target.value})} /></FormGroup>}
            {!isAb && <FormGroup label={isOT?"類別":"假別"} className={isOT ? "lg:col-span-2" : ""}><BaseSelect value={fd.category} onChange={e=>setFd({...fd, category:e.target.value})}>{(isOT?OT_CATEGORIES:LEAVE_CATEGORIES).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</BaseSelect></FormGroup>}
            
            {/* 新增：代理人休假預警防呆 */}
            {isLV && (
              <div className="flex flex-col gap-1.5">
                <FormGroup label="代理人" required>
                  <BaseSelect required value={fd.substitute} onChange={e=>setFd({...fd, substitute:e.target.value})}>
                    <option value="" disabled>請選擇</option>
                    {employees.filter(e=>e.dept===fd.dept&&e.empId!==fd.empId).map(e=><option key={e.empId} value={e.name}>{e.name}</option>)}
                  </BaseSelect>
                </FormGroup>
                {isSubstituteOnLeave && (
                  <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-in fade-in bg-rose-50 dark:bg-rose-900/30 p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm">
                    <AlertTriangle size={12}/> 該員此時段已請假，請確認！
                  </div>
                )}
              </div>
            )}

            {isOT && (
              <FormGroup label="補償">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-12">
                  <button type="button" onClick={()=>setFd({...fd, compensationType:'leave'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${fd.compensationType==='leave'?'bg-sky-600 text-white shadow':'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>換補休</button>
                  <button type="button" onClick={()=>setFd({...fd, compensationType:'pay'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${fd.compensationType==='pay'?'bg-sky-600 text-white shadow':'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>計薪</button>
                </div>
              </FormGroup>
            )}
          </div>

          {isAb && <FormGroup label="異常原因" required><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{ABNORMAL_CATEGORIES.map(c => (<label key={c.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${fd.category === c.id ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/30 ring-2 ring-sky-500/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}><input type="radio" value={c.id} checked={fd.category === c.id} onChange={e=>setFd({...fd, category:e.target.value})} className="w-4 h-4 text-sky-500" /><span className="font-bold text-sm text-slate-700 dark:text-slate-200">{c.label}</span></label>))}</div></FormGroup>}

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            {isAb ? (
              <div className="flex flex-wrap gap-4 md:gap-6 items-end w-full">
                <div className="flex-1 min-w-[200px]">
                  <FormGroup label="出勤日期" required>
                    <BaseInput type="date" required value={fd.startDate} onChange={e=>setFd({...fd, startDate:e.target.value, endDate:e.target.value})} />
                  </FormGroup>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <FormGroup label="上班時間" required>
                    <div className="flex items-center gap-2">
                      <BaseSelect className="flex-1" value={fd.startHour} onChange={e=>setFd({...fd, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</BaseSelect>
                      <span className="font-bold text-slate-400">:</span>
                      <BaseSelect className="flex-1" value={fd.startMin} onChange={e=>setFd({...fd, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</BaseSelect>
                    </div>
                  </FormGroup>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <FormGroup label="下班時間" required>
                    <div className="flex items-center gap-2">
                      <BaseSelect className="flex-1" value={fd.endHour} onChange={e=>setFd({...fd, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</BaseSelect>
                      <span className="font-bold text-slate-400">:</span>
                      <BaseSelect className="flex-1" value={fd.endMin} onChange={e=>setFd({...fd, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</BaseSelect>
                    </div>
                  </FormGroup>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 items-end w-full">
                <div className="flex-1 min-w-[300px]">
                  <FormGroup label="開始時間" required>
                    <div className="flex gap-2">
                      <BaseInput type="date" required className="flex-1 min-w-[140px]" value={fd.startDate} onChange={e=>setFd({...fd, startDate:e.target.value, endDate:e.target.value})} />
                      <BaseSelect className="w-[88px] shrink-0" value={fd.startHour} onChange={e=>setFd({...fd, startHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</BaseSelect>
                      <BaseSelect className="w-[88px] shrink-0" value={fd.startMin} onChange={e=>setFd({...fd, startMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</BaseSelect>
                    </div>
                  </FormGroup>
                </div>
                <div className="flex-1 min-w-[300px]">
                  <FormGroup label="結束時間" required>
                    <div className="flex gap-2">
                      <BaseInput type="date" required className="flex-1 min-w-[140px]" min={fd.startDate} value={fd.endDate} onChange={e=>setFd({...fd, endDate:e.target.value})} />
                      <BaseSelect className="w-[88px] shrink-0" value={fd.endHour} onChange={e=>setFd({...fd, endHour:e.target.value})}>{HOURS.map(h=><option key={h} value={h}>{h}</option>)}</BaseSelect>
                      <BaseSelect className="w-[88px] shrink-0" value={fd.endMin} onChange={e=>setFd({...fd, endMin:e.target.value})}>{MINUTES.map(m=><option key={m} value={m}>{m}</option>)}</BaseSelect>
                    </div>
                  </FormGroup>
                </div>
                <div className={`rounded-2xl p-3 text-white flex flex-col justify-center items-center h-[72px] font-black shrink-0 min-w-[120px] flex-1 sm:flex-none ${isOT ? 'bg-[#3b82f6] shadow-md shadow-blue-500/20' : 'bg-[#10b981] shadow-md shadow-emerald-500/20'}`}>
                  <span className="text-[10px] sm:text-xs opacity-90">{isOT ? '時數' : '總時數'}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl">{total}</span>
                    <span className="text-[10px] sm:text-xs">HR</span>
                  </div>
                </div>
                {isOT && (
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-3 text-slate-600 dark:text-slate-300 flex flex-col justify-center items-center h-[72px] font-black shadow-inner shrink-0 min-w-[120px] flex-1 sm:flex-none">
                    <span className="text-[10px] sm:text-xs opacity-70 whitespace-nowrap">{(fd.compensationType === 'leave' ? '預計補休' : '預計加班費')}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl text-slate-800 dark:text-slate-100">{fd.compensationType === 'leave' ? calculatedCompensation.leave : calculatedCompensation.payStr}</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{fd.compensationType === 'leave' ? 'HR' : '倍時薪'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(!isAb || fd.category === 'other') && <FormGroup label={isAb?"其他原因詳述":"事由"} required><textarea required rows="2" className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={fd.reason} onChange={e=>setFd({...fd, reason:e.target.value})} /></FormGroup>}
          {isLV && <FormGroup label="證明文件 (選填)"><div onClick={()=>fileInputRef.current?.click()} className="w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"><UploadCloud size={24} className="text-slate-400" /><span className="font-bold text-sm text-center">{fd.attachmentName || '點擊上傳檔案 (最大 5MB)'}</span><input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} /></div>{fd.attachmentName && <button type="button" onClick={()=>{setFd({...fd, attachmentName:'', attachmentData:null}); if(fileInputRef.current) fileInputRef.current.value='';}} className="text-xs text-rose-500 font-bold mt-1 hover:underline">移除</button>}</FormGroup>}
          <ShareSelector formData={fd} setFormData={setFd} />
          {isAb && <div className="bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-800 dark:text-sky-300 border-l-4 p-5 rounded-r-2xl text-[11px] font-bold space-y-3 shadow-sm"><h4 className="flex items-center gap-2 font-black text-sm text-sky-900 dark:text-sky-400"><Info size={16} /> 備註與注意事項：</h4><ol className="list-decimal pl-5 space-y-1.5 leading-relaxed"><li>請盡量避免因電腦未登出或未關機而補單。</li><li>出勤異常確認單請於出勤日期隔日前交付財務行政部辦理。</li></ol></div>}
          {isOT && <div className="bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-800 dark:text-sky-300 border-l-4 p-5 rounded-r-2xl text-[11px] font-bold space-y-3 shadow-sm"><h4 className="flex items-center gap-2 font-black text-sm text-sky-900 dark:text-sky-400"><Info size={16} /> 備註與注意事項：</h4><ol className="list-decimal pl-5 space-y-1.5 leading-relaxed"><li>申請人→經副理→協理→總經理→交辦。</li><li>加班費將依勞基法規定倍率計算；補休則依工作時數 1:1 計算。</li><li>事後申請請於加班後七個工作日內交至財務行政部辦理，逾期視同無加班事實。</li></ol></div>}
          
          <BaseButton disabled={(!isAb && total<=0) || submitting || isOverLimit} loading={submitting}>送出{type}</BaseButton>
        </form>
      </BaseCard>

      <BaseCard className="p-8">
        <div className="flex items-center gap-3 mb-6 text-slate-500 font-black border-b border-slate-100 dark:border-slate-700 pb-4"><History size={24}/><h3 className="text-slate-500 dark:text-slate-400">最近 10 筆{type}紀錄</h3></div>
        <div className="space-y-3">
          {recs.slice(0, 10).map(r => (
            <RecordCard key={r.id} r={r} actionSlot={(rec) => (
              <>
                {['pending', 'pending_substitute', 'pending_manager', 'pending_director', 'pending_gm'].includes(rec.status) && <button onClick={(e)=>{e.stopPropagation(); setWithdrawTarget(rec);}} className="px-3 py-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/30 rounded-md text-[10px] font-black hover:bg-rose-100 transition-colors">抽單</button>}
                {rec.status === 'approved' && !isAb && <button onClick={(e)=>{e.stopPropagation(); setCancelTarget(rec);}} className="px-3 py-1.5 text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-md text-[10px] font-black hover:bg-slate-100 transition-colors">撤銷</button>}
              </>
            )} />
          ))}
          {recs.length === 0 && <div className="py-12 text-center text-slate-400 font-bold">無紀錄</div>}
        </div>
      </BaseCard>
    </div>
  );
};

const BatchProcessView = ({ title, subtitle, icon, processType }) => {
  const { records, userSession, employees, onRefresh, setNotification } = useAppContext();
  const [selectedIds, setSelectedIds] = useState([]);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  const pending = useMemo(() => {
    if (processType === 'substitute') return records.filter(r => r.formType === '請假' && r.status.includes('substitute') && r.substitute === userSession.name);
    return records.filter(r => Utils.canApprove(userSession, r, employees));
  }, [records, processType, userSession, employees]);

  const handleBatch = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === 'rejected' && !opinion.trim()) return setNotification({ type: 'error', text: '駁回原因為必填' });
    setUpdating(true);
    try {
      for (const id of selectedIds) {
        const r = pending.find(rec => rec.id === id);
        const empRank = employees.find(e => e.empId === r.empId)?.jobTitle || '';
        const targetStatus = Utils.getNextStatus(r, action, empRank);
        await fetch(`${NGROK_URL}/api/records/${id}/status`, { method: 'PUT', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ status: targetStatus, opinion }) });
      }
      setNotification({ type: 'success', text: '批次處理完成' }); setSelectedIds([]); setOpinion(''); onRefresh();
    } catch { setNotification({ type: 'error', text: '處理發生異常' }); } finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      <BaseCard>
        <ViewHeader title={title} subtitle={subtitle} icon={icon} rightElement={<div className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">待處理名單</div>} />
        <div className="p-8 space-y-4 bg-slate-50/30 dark:bg-slate-800/50 min-h-[400px]">
          {pending.length > 0 && <button onClick={()=>setSelectedIds(selectedIds.length===pending.length?[]:pending.map(r=>r.id))} className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-100 dark:bg-sky-900 dark:text-sky-300 rounded-lg">{selectedIds.length===pending.length?'取消全選':'全選單據'}</button>}
          <div className="space-y-3">
            {pending.map(r => <RecordCard key={r.id} r={r} isSelectable isSelected={selectedIds.includes(r.id)} onSelect={()=>setSelectedIds(prev=>prev.includes(r.id)?prev.filter(x=>x!==r.id):[...prev, r.id])} />)}
            {pending.length === 0 && <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3"><CheckCircle2 size={48} className="opacity-20 mb-2"/>目前無待辦事項</div>}
          </div>
        </div>
      </BaseCard>
      {selectedIds.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-sky-400 p-8 flex flex-col md:flex-row gap-8 sticky bottom-6 z-40">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between"><span className="text-sky-600 font-black text-sm">回覆意見 <span className="text-rose-500">*駁回必填</span></span><span className="text-xs font-bold bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full">已選 {selectedIds.length} 筆</span></div>
            <textarea placeholder="填寫意見..." className="w-full p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-500" value={opinion} onChange={e=>setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-64 flex gap-3 items-end">
            <button disabled={updating} onClick={()=>handleBatch('rejected')} className="flex-1 py-4 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-2xl font-black transition-all hover:scale-95">駁回</button>
            <button disabled={updating} onClick={()=>handleBatch('approved')} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black transition-all hover:scale-95 flex items-center justify-center gap-2">{updating && <Loader2 size={16} className="animate-spin" />}同意</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementListView = () => {
  const { announcements, readAnns, markAnnAsRead } = useAppContext();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const activeAnnouncements = useMemo(() => announcements.filter(ann => !ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]), [announcements]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans relative text-slate-900">
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-left text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 shrink-0 text-left"><div className="flex items-center gap-3 text-left"><span className="px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">{ANNOUNCEMENT_TYPES.find(t => t.id === selectedAnnouncement.type)?.label || '一般'}</span><span className="text-xs font-bold text-slate-400 font-mono text-left">{selectedAnnouncement.date} 發布</span></div><button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-left"><X size={20} /></button></div>
            <div className="p-6 md:p-8 overflow-y-auto text-left"><h2 className="text-2xl font-black mb-6 leading-snug text-left">{selectedAnnouncement.title}</h2><div className="leading-relaxed whitespace-pre-wrap font-medium text-left">{selectedAnnouncement.content || '此公告目前沒有詳細內文。'}</div></div>
          </div>
        </div>
      )}
      <BaseCard>
        <ViewHeader title="資訊公告" subtitle="查看公司所有最新與歷史公告" icon={Bell} />
        <div className="divide-y divide-slate-100 dark:divide-slate-700 text-left">
          {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => {
            return (
            <div key={ann.id} onClick={() => { setSelectedAnnouncement(ann); markAnnAsRead(ann.id); }} className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-left text-slate-900 dark:text-slate-100">
              <div className="flex items-center gap-3 w-full sm:w-auto text-left"><span className="px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label || '一般'}</span>{ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider text-left">New</span>}</div>
              <p className="text-sm font-bold flex-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate flex items-center gap-2 text-left">{!readAnns.includes(ann.id) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 text-left" title="未讀"></span>}{ann.title}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 text-left">{ann.date} 發布</span>
            </div>
            );
          }) : <div className="p-16 text-center text-slate-400 text-sm font-bold italic text-left">目前無任何公告資料</div>}
        </div>
      </BaseCard>
    </div>
  );
};

const CalendarView = () => {
  const { records, userSession, calendarData } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const deptLeaves = useMemo(() => records.filter(r => r.formType === '請假' && r.status === 'approved' && (userSession.empId === 'root' || r.dept === userSession.dept)), [records, userSession]);
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({length: firstDayOfMonth}, () => null).concat(Array.from({length: daysInMonth}, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)));

  const formatDate = (date) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

  const getCategoryColor = (catId) => {
    const map = {
      annual: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      sick: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      sick_hospital: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      personal: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      official: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      occupational_sickness: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      marriage: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      maternity_leave: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      paternity_leave: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      prenatal_checkup: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      bereavement: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
      comp: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    };
    return map[catId] || 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <BaseCard>
        <ViewHeader title="休假月曆" subtitle={`檢視 ${userSession.empId === 'root' ? '全公司' : userSession.dept} 同仁的休假`} icon={Calendar} />
        <div className="p-8 text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-left">
            <div className="flex items-center gap-4 text-left"><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl transition-colors text-left"><ChevronDown className="rotate-90 text-slate-600 dark:text-slate-400" size={20}/></button><h2 className="text-xl font-black text-slate-800 dark:text-slate-100 w-40 text-center tracking-wide text-left">{currentDate.getFullYear()} 年 {monthNames[currentDate.getMonth()]}</h2><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl transition-colors text-left"><ChevronDown className="-rotate-90 text-slate-600 dark:text-slate-400" size={20}/></button></div>
            <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold rounded-xl transition-colors shadow-sm active:scale-95 text-left text-sky-600">回到本月</button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-left">
            {weekDays.map((day, idx) => <div key={day} className={`text-center font-black text-xs uppercase tracking-widest py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-left ${idx === 0 || idx === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`}>{day}</div>)}
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-[110px] bg-slate-50/30 dark:bg-slate-900/30 rounded-2xl border border-slate-100/50 dark:border-slate-800 text-left text-slate-900"></div>;
              const dateStr = formatDate(day);
              const isToday = dateStr === formatDate(new Date());
              const leavesToday = deptLeaves.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
              
              let isDayOff = day.getDay() === 0 || day.getDay() === 6;
              if (calendarData?.loaded) {
                isDayOff = isDayOff || calendarData.holidays.includes(dateStr);
              } else {
                const fallbackHolidays = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-19', '2026-09-25', '2026-10-10'];
                isDayOff = isDayOff || fallbackHolidays.includes(dateStr);
              }

              return (
                <div key={dateStr} className={`min-h-[120px] rounded-2xl border p-2 flex flex-col gap-1.5 overflow-hidden transition-colors text-left ${isToday ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-900/30 shadow-md ring-1 ring-sky-400' : isDayOff ? 'border-rose-100 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                  <div className={`text-xs font-black px-1.5 mb-1 text-left ${isToday ? 'text-sky-600 dark:text-sky-400' : isDayOff ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{day.getDate()}</div>
                  <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1 text-left">
                    {leavesToday.map(r => {
                      const catLabel = LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || r.category;
                      const titleInfo = `申請人：${r.name}\n假別：${catLabel}\n時間：${r.startDate} ${r.startHour}:${r.startMin} ~ ${r.endDate} ${r.endHour}:${r.endMin}`;
                      return (
                        <div key={r.id} className={`px-2 py-1.5 border rounded-md text-xs font-bold truncate shrink-0 cursor-default shadow-sm text-left ${getCategoryColor(r.category)}`} title={titleInfo}>
                          {r.name} - {catLabel}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BaseCard>
    </div>
  );
};

const InquiryView = () => {
  const { records, userSession, setNotification } = useAppContext();
  const [filters, setFilters] = useState({ formType: '', serialId: '', status: '', startDate: '', endDate: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); 

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const results = records.filter(r => {
      const isApplicant = r.empId === userSession.empId, isRoot = userSession.empId === 'root', isSharedWithMe = r.sharedWith && r.sharedWith.split(',').includes(userSession.empId);
      if (!isRoot && !isApplicant && !isSharedWithMe) return false;
      if (filters.formType && r.formType !== filters.formType) return false;
      if (filters.serialId && r.serialId && !r.serialId.toLowerCase().includes(filters.serialId.toLowerCase())) return false;
      if (filters.status) { if (filters.status === 'canceling') { if (!r.status.startsWith('canceling_')) return false; } else { if (r.status !== filters.status) return false; } }
      if (filters.startDate && r.startDate < filters.startDate) return false;
      if (filters.endDate && r.startDate > filters.endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setSearchResults(results); setHasSearched(true); setVisibleCount(10); 
  };
  const handleReset = () => { setFilters({ formType: '', serialId: '', status: '', startDate: '', endDate: '' }); setSearchResults([]); setHasSearched(false); setVisibleCount(10); };

  const handleExportRecords = () => {
    if (!window.XLSX) {
      setNotification({ type: 'error', text: 'Excel 模組尚未載入完成，請稍後' });
      return;
    }
    if (searchResults.length === 0) {
      setNotification({ type: 'error', text: '沒有可匯出的單據資料' });
      return;
    }
    const data = searchResults.map(r => ({
      "單號": r.serialId,
      "類型": r.formType,
      "子類別": r.formType === '請假' ? (LEAVE_CATEGORIES.find(c => c.id === r.category)?.label || r.category) : r.formType === '出勤異常' ? (ABNORMAL_CATEGORIES.find(c => c.id === r.category)?.label || r.category) : (r.compensationType === 'leave' ? '換補休' : '計薪'),
      "員工代號": r.empId,
      "姓名": r.name,
      "部門": r.dept,
      "開始時間": `${r.startDate} ${r.startHour}:${r.startMin}`,
      "結束時間": `${r.endDate} ${r.endHour}:${r.endMin}`,
      "總時數": r.totalHours,
      "代理人": r.substitute || '無',
      "狀態": r.status === 'approved' ? '已核准' : r.status === 'rejected' ? '已駁回' : r.status === 'canceled' ? '已撤銷/銷假' : '處理中',
      "事由": r.reason || '無'
    }));
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "單據查詢結果");
    window.XLSX.writeFile(wb, `單據查詢報表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left text-slate-900 font-sans">
      <BaseCard>
        <ViewHeader title="申請單據查詢" subtitle="設定條件查詢您的歷史單據或被分享的單據" icon={Search} />
        <form onSubmit={handleSearch} className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
            <FormGroup label="單據類型"><BaseSelect value={filters.formType} onChange={e => setFilters({...filters, formType: e.target.value})}><option value="">全部</option><option value="加班">加班申請</option><option value="請假">請假申請</option><option value="出勤異常">出勤異常單</option></BaseSelect></FormGroup>
            <FormGroup label="單號包含 (模糊搜尋)"><BaseInput placeholder="例如: OT001" value={filters.serialId} onChange={e => setFilters({...filters, serialId: e.target.value})} /></FormGroup>
            <FormGroup label="簽核狀態"><BaseSelect value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="">全部</option><option value="pending_substitute">待代理確認</option><option value="pending_manager">待經副理簽核</option><option value="pending_director">待協理簽核</option><option value="pending_gm">待總經理簽核</option><option value="pending_assignment">待交辦(9002)</option><option value="approved">已核准</option><option value="canceling">銷假/撤銷審核中</option><option value="rejected">已駁回</option><option value="canceled">已撤銷/已銷假</option></BaseSelect></FormGroup>
            <FormGroup label="起始日期 (從)"><BaseInput type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} /></FormGroup>
            <FormGroup label="結束日期 (至)"><BaseInput type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} /></FormGroup>
          </div>
          <div className="flex gap-3 justify-end pt-2 text-left">
            <button type="button" onClick={handleExportRecords} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 transition-colors border border-emerald-200 dark:border-emerald-800 shadow-sm text-left"><FileSpreadsheet size={18} /> 匯出 Excel</button>
            <button type="button" onClick={handleReset} className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 transition-colors text-left">清除重設</button>
            <button type="submit" className="px-8 py-3 rounded-xl font-black text-white bg-sky-600 transition-colors flex items-center gap-2 text-white text-left"><Search size={18} className="text-white" /> <span className="text-white">執行查詢</span></button>
          </div>
        </form>
        <div className="p-8 space-y-4 text-left">
          {!hasSearched ? <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3 text-left"><Search size={48} className="opacity-20 mb-2 text-left" /><p className="text-left">請設定上方查詢條件，並點擊「執行查詢」查看單據</p></div> : searchResults.length > 0 ? (
            <div className="space-y-3 text-left">
              {searchResults.slice(0, visibleCount).map(r => <RecordCard key={r.id} r={r} showPrint />)}
              <InfiniteScrollObserver onLoadMore={() => setVisibleCount(c => c + 10)} hasMore={visibleCount < searchResults.length} />
            </div>
          ) : <div className="py-24 text-center text-slate-400 italic font-bold text-left">查無符合條件的單據</div>}
        </div>
      </BaseCard>
    </div>
  );
};

const LeaveCancelView = () => {
  const { records, onRefresh, setNotification, userSession, onLogAction } = useAppContext();
  const [cancelTarget, setCancelTarget] = useState(null);
  const displayRecords = useMemo(() => records.filter(r => r.empId === userSession.empId && (r.status === 'approved' || r.status.startsWith('canceling_') || r.status === 'canceled')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [records, userSession.empId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      {cancelTarget && <ConfirmModal title={`確定要申請${cancelTarget.formType === '請假' ? '銷假' : '撤銷'}？`} desc={`將送出${cancelTarget.formType === '請假' ? '銷假' : '撤銷'}簽核流程。單號：${cancelTarget.serialId}`} onCancel={() => setCancelTarget(null)} onConfirm={async () => { try { let targetStatus = ''; if (cancelTarget.formType === '請假') { targetStatus = 'canceling_substitute'; } else { const userRank = userSession.jobTitle || ''; if (userRank.includes('總經理')) targetStatus = 'canceling_assignment'; else if (userRank.includes('協理')) targetStatus = 'canceling_gm'; else if (userRank.includes('經理') || userRank.includes('副理')) targetStatus = 'canceling_director'; else targetStatus = 'canceling_manager'; } await fetch(`${NGROK_URL}/api/records/${cancelTarget.id}/status`, { method: 'PUT', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ status: targetStatus, opinion: `申請人發起${cancelTarget.formType === '請假' ? '銷假' : '撤銷'}流程` }) }); await onLogAction(userSession, '單據撤銷', `發起${cancelTarget.formType === '請假' ? '銷假' : '撤銷'}申請 (${cancelTarget.serialId})`); setNotification({ type: 'success', text: `已成功送出${cancelTarget.formType === '請假' ? '銷假' : '撤銷'}申請` }); setCancelTarget(null); onRefresh(); } catch(err) { setNotification({ type: 'error', text: '操作失敗' }); } }} confirmText="送出申請" confirmClass="bg-sky-600" icon={Undo2} />}
      <BaseCard>
        <ViewHeader title="銷假與撤銷申請" subtitle="針對已核准的單據發起銷假或撤銷流程" icon={Undo2} />
        <div className="p-8 space-y-4 text-left text-slate-900">
          {displayRecords.length > 0 ? (
            <div className="space-y-3 text-left text-slate-900">
              {displayRecords.map(r => (
                <RecordCard key={r.id} r={r} actionSlot={(rec) => {
                  const isCanceling = rec.status.startsWith('canceling_');
                  const isCanceled = rec.status === 'canceled';
                  if (isCanceled) {
                    return <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg text-xs font-black whitespace-nowrap border border-slate-200 dark:border-slate-600 cursor-not-allowed text-left">已結案</span>;
                  }
                  return !isCanceling ? (
                    <button onClick={(e) => {e.stopPropagation(); setCancelTarget(rec);}} className="px-4 py-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-black transition-colors whitespace-nowrap shadow-sm text-left">申請{rec.formType === '請假' ? '銷假' : '撤銷'}</button>
                  ) : <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg text-xs font-black whitespace-nowrap border border-slate-200 dark:border-slate-600 text-left">處理中...</span>;
                }} />
              ))}
            </div>
          ) : <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3 text-left"><Undo2 size={48} className="opacity-20 mb-2 text-left" /><p className="text-left">目前沒有可銷假或撤銷的相關單據</p></div>}
        </div>
      </BaseCard>
    </div>
  );
};

const ChangePasswordView = () => {
  const { userSession, setNotification, handleLogout, onRefresh, onLogAction } = useAppContext();
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
      const res = await fetch(`${NGROK_URL}/api/employees/${userSession.id}`, { method: 'PATCH', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ password: formData.new.trim() }) });
      if (res.ok) { await onLogAction(userSession, '密碼變更', '自行變更登入密碼'); setNotification({ type: 'success', text: '密碼更新成功，即將登出...' }); onRefresh(); setTimeout(() => handleLogout(), 2000); }
      else throw new Error('API error');
    } catch (err) { setNotification({ type: 'error', text: '修改失敗' }); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <BaseCard>
        <ViewHeader title="帳號安全設定" subtitle="變更後將強制登出以確認生效" icon={KeyRound} />
        <form onSubmit={handleUpdate} className="p-10 space-y-8 max-w-lg mx-auto py-16 text-left">
          <div className="space-y-6 text-left">
            <PassInput label="目前登入密碼" value={formData.current} field="current" showKey="cur" Icon={Lock} shows={shows} onToggle={k=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
            <PassInput label="設定新密碼" value={formData.new} field="new" showKey="new" Icon={KeyRound} shows={shows} onToggle={k=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
            <PassInput label="再次確認新密碼" value={formData.confirm} field="confirm" showKey="con" Icon={CheckCircle2} shows={shows} onToggle={k=>setShows(p=>({...p,[k]:!p[k]}))} onChange={(f,v)=>setFormData(p=>({...p,[f]:v}))} />
          </div>
          <BaseButton loading={loading}><CheckCircle size={20} className={!loading ? "text-white" : "hidden"} /> <span className="text-white">儲存變更</span></BaseButton>
        </form>
      </BaseCard>
    </div>
  );
};

const AnnouncementManagement = () => {
  const { announcements, setAnnouncements, setNotification, userSession, onLogAction } = useAppContext();
  const [formData, setFormData] = useState({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setNotification({ type: 'error', text: '公告標題不可為空' });

    let logMsg = editingId ? `更新公告：${formData.title}` : `發布新公告：${formData.title}`;

    if (editingId) {
      const oldData = announcements.find(a => a.id === editingId);
      if (oldData) {
        const changes = [];
        const fieldMap = { title:'標題', type:'類型', date:'發布日', endDate:'下架日', content:'內容', isNew:'New標示' };
        Object.keys(fieldMap).forEach(k => {
          const oldVal = oldData[k] === true ? '是' : oldData[k] === false ? '否' : (oldData[k] || '無');
          const newVal = formData[k] === true ? '是' : formData[k] === false ? '否' : (formData[k] || '無');
          if (oldVal !== newVal) changes.push(`[${fieldMap[k]}] ${oldVal} ➔ ${newVal}`);
        });
        if (changes.length > 0) logMsg += `\n變更細節：\n${changes.join('\n')}`;
      }
      setAnnouncements(prev => prev.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
      await onLogAction(userSession, '系統公告', logMsg);
      setNotification({ type: 'success', text: '公告更新成功' });
    } else {
      setAnnouncements(prev => [{ ...formData, id: Date.now() }, ...prev]);
      await onLogAction(userSession, '系統公告', logMsg);
      setNotification({ type: 'success', text: '公告新增成功' });
    }
    setFormData({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <BaseCard>
        <ViewHeader title="公告維護中心" subtitle="發布與管理首頁的系統公告資訊" icon={Megaphone} />
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-left items-end">
            <FormGroup label="公告標題" className="md:col-span-2" required><BaseInput placeholder="請輸入公告標題..." required value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} /></FormGroup>
            <FormGroup label="公告類型"><BaseSelect value={formData.type} onChange={e=>setFormData({...formData, type:e.target.value})}>{ANNOUNCEMENT_TYPES.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}</BaseSelect></FormGroup>
            <FormGroup label="發布日期" required><BaseInput type="date" required value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} /></FormGroup>
            <FormGroup label="下架日期 (選填)"><BaseInput type="date" value={formData.endDate || ''} onChange={e=>setFormData({...formData, endDate:e.target.value})} /></FormGroup>
            <FormGroup label="公告詳細內容 (選填)" className="md:col-span-5 pt-2"><textarea placeholder="請輸入詳細公告內容，支援多行顯示..." rows="4" className="w-full p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-sky-500 text-left" value={formData.content} onChange={e=>setFormData({...formData, content:e.target.value})} /></FormGroup>
          </div>
          <div className="flex items-center justify-between pt-2 text-left">
            <label className="flex items-center gap-2 cursor-pointer text-left"><input type="checkbox" className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 dark:border-slate-600" checked={formData.isNew} onChange={e=>setFormData({...formData, isNew:e.target.checked})} /><span className="text-sm font-bold text-slate-600 dark:text-slate-300">標示為 <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black uppercase tracking-wider ml-1">New</span> 新訊</span></label>
            <div className="flex gap-3 text-left">{editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({ title: '', type: 'policy', date: new Date().toISOString().split('T')[0], endDate: '', isNew: true, content: '' });}} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 transition-colors">取消編輯</button>}<BaseButton className="w-auto px-8" type="submit">{editingId ? <><Edit2 size={18} className="text-white" /> <span className="text-white">更新公告</span></> : <><Plus size={18} className="text-white" /> <span className="text-white">發布公告</span></>}</BaseButton></div>
          </div>
        </form>
        <div className="p-8 text-left"><h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><ListChecks size={18} className="text-slate-400" /> 現有公告列表</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden text-left">
            {announcements.length > 0 ? announcements.map(ann => {
              return (
              <div key={ann.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group text-left">
                <div className="flex items-center gap-3 w-full sm:w-auto text-left"><span className="px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{ANNOUNCEMENT_TYPES.find(t => t.id === ann.type)?.label || '一般'}</span>{ann.isNew && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-black animate-pulse uppercase tracking-wider">New</span>}</div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{ann.title}</p>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right text-left"><div className="text-xs font-bold text-slate-400 font-mono">{ann.date} 發布</div>{ann.endDate && <div className="text-[10px] font-bold text-rose-400 font-mono">~ {ann.endDate} 下架</div>}</div>
                  <div className="flex items-center gap-1 border-l pl-4 border-slate-200 dark:border-slate-700 text-left"><button onClick={()=>{setEditingId(ann.id); setFormData(ann); window.scrollTo({top:0,behavior:'smooth'});}} className="p-2 text-slate-400 hover:text-sky-600 transition-colors rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30"><Edit2 size={16} /></button><button onClick={async () => { if(window.confirm('確定刪除？')){setAnnouncements(prev => prev.filter(a => a.id !== ann.id)); await onLogAction(userSession, '系統公告', `刪除公告：${ann.title}`); setNotification({ type: 'success', text: '已刪除' });} }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30"><Trash2 size={16} /></button></div>
                </div>
              </div>
              );
            }) : <div className="p-8 text-center text-slate-400 text-sm font-bold italic">無任何公告資料</div>}
          </div>
        </div>
      </BaseCard>
    </div>
  );
};

const PersonnelManagement = () => {
  const { employees, onRefresh, setNotification, userSession, availableDepts, onLogAction } = useAppContext();
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '', gender: '', birthDate: '', hireDate: '' });
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [pwdTarget, setPwdTarget] = useState(null); 
  const [expandedEmpId, setExpandedEmpId] = useState(null);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20); 
  const [previewData, setPreviewData] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!userSession) return [];
    if (userSession.empId === 'root' || userSession.jobTitle === '總經理') return employees;
    if (userSession.jobTitle === '協理') {
      if (userSession.dept === '工程組') return employees.filter(emp => ['工程組', '系統組'].includes(emp.dept));
      if (userSession.dept === '北區營業組') return employees.filter(emp => ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept));
    }
    return employees.filter(emp => emp.dept === userSession.dept);
  }, [employees, userSession]);

  const availableTitles = useMemo(() => [...new Set((employees || []).map(e => e.jobTitle).filter(Boolean))], [employees]);
  
  const handleExport = () => { if (!window.XLSX) { setNotification({ type: 'error', text: 'Excel 模組尚未載入' }); return; } const data = filteredEmployees.map(emp => ({ "姓名": emp.name, "員編": emp.empId, "職稱": emp.jobTitle, "單位": emp.dept, "性別": emp.gender || '', "出生年月日": emp.birthDate ? emp.birthDate.split('T')[0] : '', "到職日": emp.hireDate ? emp.hireDate.split('T')[0] : '' })); const ws = window.XLSX.utils.json_to_sheet(data); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "員工名單"); window.XLSX.writeFile(wb, `員工清單_${new Date().toISOString().split('T')[0]}.xlsx`); };
  
  const handleImportSelect = async (e) => { 
    const file = e.target.files[0]; if (!file) return; 
    const reader = new FileReader(); 
    reader.onload = (evt) => { 
      try {
        const bstr = evt.target.result; const wb = window.XLSX.read(bstr, { type: 'binary' }); const jsonData = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); 
        if (jsonData.length > 0) {
           setPreviewData(jsonData);
        } else {
           setNotification({ type: 'error', text: 'Excel 檔案內無資料' });
        }
      } catch (err) {
        setNotification({ type: 'error', text: '無法解析 Excel 檔案格式' });
      }
      e.target.value = ""; 
    }; 
    reader.readAsBinaryString(file); 
  };

  const confirmImport = async () => {
    if (!previewData || previewData.length === 0) return;
    setLoading(true); 
    try {
      let count = 0;
      for (const row of previewData) { 
        const payload = { name: row["姓名"], empId: row["員編"]?.toString(), jobTitle: row["職稱"] || "", dept: row["單位"] || "", gender: row["性別"] || "", birthDate: row["出生年月日"] || null, hireDate: row["到職日"] || null }; 
        if (payload.name && payload.empId) {
           await fetch(`${NGROK_URL}/api/employees`, { method: 'POST', headers: FETCH_OPTIONS.headers, body: JSON.stringify(payload) }); 
           count++;
        }
      } 
      await onLogAction(userSession, '人事管理', `批次匯入員工資料 (共 ${count} 筆)`); 
      onRefresh(); 
      setNotification({ type: 'success', text: `成功匯入 ${count} 筆資料` }); 
      setPreviewData(null);
    } catch (e) {
      setNotification({ type: 'error', text: '匯入過程中發生錯誤' }); 
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      {pwdTarget && <ConfirmModal title="重設密碼？" desc={`為 ${pwdTarget.name} 還原為員編密碼`} onCancel={()=>setPwdTarget(null)} onConfirm={async () => { await fetch(`${NGROK_URL}/api/employees/${pwdTarget.id}`, { method: 'PATCH', headers: FETCH_OPTIONS.headers, body: JSON.stringify({ password: pwdTarget.empId }) }); await onLogAction(userSession, '密碼變更', `重設員工密碼 (${pwdTarget.empId} ${pwdTarget.name}) ➔ 變更為預設員編`); onRefresh(); setPwdTarget(null); setNotification({type:'success',text:'密碼重設成功'}); }} confirmText="確認" confirmClass="bg-sky-600" icon={RotateCcw} />}
      
      {previewData && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center text-left">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <h3 className="font-black text-xl flex items-center gap-2"><FileSpreadsheet className="text-emerald-500" /> 匯入資料預覽</h3>
               <button onClick={()=>setPreviewData(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl mb-4 text-sm font-bold">
                 系統偵測到 {previewData.length} 筆資料，請確認以下欄位對應是否正確，確認無誤後再點擊寫入。
               </div>
               <table className="w-full text-sm border">
                 <thead className="bg-slate-50 dark:bg-slate-700">
                   <tr>
                     <th className="p-3 border text-left">員編</th><th className="p-3 border text-left">姓名</th><th className="p-3 border text-left">單位</th><th className="p-3 border text-left">職稱</th><th className="p-3 border text-left">到職日</th>
                   </tr>
                 </thead>
                 <tbody>
                   {previewData.slice(0, 10).map((row, i) => (
                     <tr key={i} className="border-b dark:border-slate-700">
                       <td className="p-3 border font-mono">{row["員編"]}</td><td className="p-3 border">{row["姓名"]}</td><td className="p-3 border">{row["單位"]}</td><td className="p-3 border">{row["職稱"]}</td><td className="p-3 border">{row["到職日"]}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {previewData.length > 10 && <div className="text-center text-slate-400 mt-4 text-xs font-bold">... (還有 {previewData.length - 10} 筆未顯示) ...</div>}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-4">
              <button onClick={()=>setPreviewData(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold">取消匯入</button>
              <button onClick={confirmImport} disabled={loading} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2">{loading && <Loader2 size={16} className="animate-spin" />} 確認寫入資料庫</button>
            </div>
          </div>
        </div>
      )}

      <BaseCard>
        <ViewHeader title="人員管理中心" subtitle="維護同仁資料與 Excel 工具" icon={Users} />
        <div className="px-8 pt-6 flex gap-3 text-left text-slate-900"><button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800 transition-colors"><FileSpreadsheet size={16} /> 匯出 Excel</button><button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl text-xs font-bold border border-sky-100 dark:border-sky-800 transition-colors"><Upload size={16} /> 匯入 Excel</button><input type="file" ref={fileInputRef} onChange={handleImportSelect} accept=".xlsx, .xls" className="hidden" /></div>
        <form onSubmit={async (e) => {
          e.preventDefault(); const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`; 
          const payload = { ...formData, birthDate: formData.birthDate || null, hireDate: formData.hireDate || null };
          
          let logMsg = editingId ? `更新員工資料 (${payload.empId} ${payload.name})` : `新增員工資料 (${payload.empId} ${payload.name})`;
          if (editingId) {
            const oldData = employees.find(emp => emp.id === editingId);
            if (oldData) {
              const changes = [];
              const fieldMap = { name:'姓名', empId:'員編', jobTitle:'職稱', dept:'單位', gender:'性別', birthDate:'生日', hireDate:'到職日' };
              Object.keys(fieldMap).forEach(k => {
                const oldVal = oldData[k] ? (k.includes('Date') ? oldData[k].split('T')[0] : oldData[k]) : '無';
                const newVal = payload[k] ? (k.includes('Date') ? payload[k].split('T')[0] : payload[k]) : '無';
                if (oldVal !== newVal) changes.push(`[${fieldMap[k]}] ${oldVal} ➔ ${newVal}`);
              });
              if (changes.length > 0) logMsg += `\n變更細節：\n${changes.join('\n')}`;
            }
          }

          try {
            const res = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers: FETCH_OPTIONS.headers, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('伺服器更新失敗');
            await onLogAction(userSession, '人事管理', logMsg);
            onRefresh(); setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''}); setShowDetails(false); setIsCustomDept(false); setNotification({ type: 'success', text: '人員資料更新成功！' });
          } catch (err) { setNotification({ type: 'error', text: '更新失敗！請確認後端 API 是否有重啟' }); }
        }} className="p-8 space-y-6 text-left">
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <BaseInput placeholder="員編" required value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} />
              <BaseInput placeholder="姓名" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              <div className="text-left"><BaseInput list="titles-list" placeholder="職稱" required value={formData.jobTitle} onChange={e=>setFormData({...formData, jobTitle:e.target.value})} /><datalist id="titles-list">{availableTitles.map(t=><option key={t} value={t} />)}</datalist></div>
              <div className="text-left">{isCustomDept ? (<BaseInput placeholder="請輸入新單位..." required className="shadow-inner font-bold text-sky-700" value={formData.dept} onChange={e=>setFormData({...formData, dept:e.target.value})} autoFocus onBlur={() => { if(!formData.dept) setIsCustomDept(false); }} />) : (<BaseSelect required value={formData.dept} onChange={e => { if(e.target.value === '__custom__') { setIsCustomDept(true); setFormData({...formData, dept:''}); } else { setFormData({...formData, dept:e.target.value}); } }}><option value="" disabled>請選擇單位</option>{availableDepts.map(d=><option key={d} value={d}>{d}</option>)}<option value="__custom__" className="text-sky-600 font-black">+ 新增單位 / 職稱</option></BaseSelect>)}</div>
            </div>
            <div className="text-left pt-2 text-left"><button type="button" onClick={() => setShowDetails(!showDetails)} className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 transition-colors bg-sky-50 dark:bg-sky-900/30 px-3 py-2 rounded-lg">{showDetails ? <EyeOff size={14} /> : <Eye size={14} />} {showDetails ? '隱藏進階人事資料' : '填寫進階人事資料 (性別 / 生日 / 到職日)'}</button></div>
            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left p-5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                <FormGroup label="性別"><BaseSelect value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="">請選擇</option><option value="男">男</option><option value="女">女</option></BaseSelect></FormGroup>
                <FormGroup label="出生年月日"><BaseInput type="date" value={formData.birthDate} onChange={e=>setFormData({...formData, birthDate:e.target.value})} /></FormGroup>
                <FormGroup label="到職日"><BaseInput type="date" value={formData.hireDate} onChange={e=>setFormData({...formData, hireDate:e.target.value})} /></FormGroup>
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-2 text-left">
            <BaseButton type="submit" className="flex-1">{editingId ? '更新資料' : '新增人員'}</BaseButton>
            <button type="button" onClick={() => { setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:'', gender:'', birthDate:'', hireDate:''}); setShowDetails(false); setIsCustomDept(false); }} className="w-1/3 sm:w-1/4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">清除 / 取消</button>
          </div>
        </form>
        <div className="overflow-hidden md:overflow-x-auto border-t border-slate-100 dark:border-slate-700 text-left">
          <table className="w-full text-sm text-left block md:table">
            <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
              <tr><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left">職稱 / 單位</th><th className="px-4 py-4 text-left">登入密碼</th><th className="px-8 py-4 text-right">操作</th></tr>
            </thead>
            <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-slate-100 dark:divide-slate-700 text-left p-4 md:p-0">
              {filteredEmployees.slice(0, visibleCount).map(emp => (
                <tr key={emp.id} className="block md:table-row bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="flex md:table-cell justify-between items-center px-4 md:px-8 py-3 md:py-5 font-mono font-bold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 md:border-none">
                    <span className="md:hidden text-xs font-black text-slate-400">員編</span>{emp.empId}
                  </td>
                  <td className="flex flex-col md:table-cell px-4 py-3 md:py-5 border-b border-slate-100 dark:border-slate-700 md:border-none">
                    <div className="flex justify-between items-center w-full">
                      <span className="md:hidden text-xs font-black text-slate-400">姓名</span>
                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end md:justify-start">
                        <div onClick={() => setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id)} className="font-black flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-colors w-fit group">
                          {emp.name} {emp.gender && <span className="text-[10px] text-slate-400 font-bold group-hover:text-sky-500 transition-colors">({emp.gender})</span>}
                          {(emp.birthDate || emp.hireDate) && (expandedEmpId === emp.id ? <ChevronUp size={14} className="text-sky-600" /> : <ChevronDown size={14} className="text-slate-300 group-hover:text-sky-400 transition-colors" />)}
                        </div>
                      </div>
                    </div>
                    {expandedEmpId === emp.id && (emp.birthDate || emp.hireDate) && (
                      <div className="mt-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-top-1 space-y-1 self-end md:self-start min-w-[140px]">
                        {emp.hireDate && <div><span className="text-slate-400 mr-2 uppercase tracking-widest">到職</span>{emp.hireDate.split('T')[0]}</div>}
                        {emp.birthDate && <div><span className="text-slate-400 mr-2 uppercase tracking-widest">生日</span>{emp.birthDate.split('T')[0]}</div>}
                      </div>
                    )}
                  </td>
                  <td className="flex md:table-cell justify-between items-center px-4 py-3 md:py-5 border-b border-slate-100 dark:border-slate-700 md:border-none text-right md:text-left">
                    <span className="md:hidden text-xs font-black text-slate-400">職稱/單位</span>
                    <div><div className="font-bold text-slate-900 dark:text-slate-100">{emp.jobTitle}</div><div className="text-[10px] text-slate-400 font-bold">{emp.dept}</div></div>
                  </td>
                  <td className="flex md:table-cell justify-between items-center px-4 py-3 md:py-5 border-b border-slate-100 dark:border-slate-700 md:border-none">
                    <span className="md:hidden text-xs font-black text-slate-400">登入密碼</span>
                    <div className="flex items-center gap-3">
                      {(emp.password && emp.password !== emp.empId) && (<span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">已自訂</span>)}
                      <button onClick={()=>setPwdTarget(emp)} className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"><RotateCcw size={12} />還原</button>
                    </div>
                  </td>
                  <td className="flex md:table-cell justify-end items-center gap-2 px-4 md:px-8 py-3 md:py-5">
                    <button onClick={()=>{ setEditingId(emp.id); setFormData({ ...emp, gender: emp.gender || '', birthDate: emp.birthDate ? emp.birthDate.split('T')[0] : '', hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '' }); setShowDetails(!!(emp.gender || emp.birthDate || emp.hireDate)); setIsCustomDept(false); window.scrollTo({top:0,behavior:'smooth'}); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={async () => { if(window.confirm("確定刪除？")) { await fetch(`${NGROK_URL}/api/employees/${emp.id}`, { method: 'DELETE', headers: FETCH_OPTIONS.headers }); await onLogAction(userSession, '人事管理', `刪除員工資料 (${emp.empId} ${emp.name})`); onRefresh(); setNotification({type:'success', text:'已成功刪除員工'})} }} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              <InfiniteScrollObserver onLoadMore={() => setVisibleCount(c => c + 20)} hasMore={visibleCount < filteredEmployees.length} isTable={true} colSpan={5} />
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  );
};

const SystemLogView = () => {
  const { sysLogs } = useAppContext();
  const [filters, setFilters] = useState({ actionType: '', keyword: '', startDate: '', endDate: '' });
  const [visibleCount, setVisibleCount] = useState(30); 

  const displayLogs = useMemo(() => sysLogs.filter(log => {
      if (filters.actionType && log.actionType !== filters.actionType) return false;
      if (filters.startDate && log.createdAt < filters.startDate) return false;
      if (filters.endDate && log.createdAt > filters.endDate + 'T23:59:59') return false;
      if (filters.keyword) { const kw = filters.keyword.toLowerCase(); return (log.name?.toLowerCase().includes(kw) || log.empId?.toLowerCase().includes(kw) || (typeof log.details === 'string' && log.details.toLowerCase().includes(kw))); }
      return true;
    }), [sysLogs, filters]);

  useEffect(() => { setVisibleCount(30); }, [filters]);

  const handleReset = () => setFilters({ actionType: '', keyword: '', startDate: '', endDate: '' });

  const handleExportTXT = () => {
    let txt = "系統操作日誌\n==============================================================\n";
    displayLogs.forEach(l => { const d=new Date(l.createdAt); txt += `[${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}] 員編:${l.empId} 姓名:${l.name} | 動作:${l.actionType} | 內容:${typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}\n`; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); link.download = `系統操作日誌_${new Date().toISOString().split('T')[0]}.txt`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const data = displayLogs.map(l => { const d=new Date(l.createdAt); return {"操作時間": `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`, "操作者姓名": l.name, "員編": l.empId, "動作類型": l.actionType, "詳細內容": typeof l.details === 'object' ? JSON.stringify(l.details) : l.details}; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })); link.download = `系統操作日誌_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans text-slate-900">
      <BaseCard>
        <ViewHeader title="系統操作日誌" subtitle="最高權限管理員專屬，追蹤全站重要操作軌跡" bgClass="bg-slate-800" icon={Activity} />
        
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <FormGroup label="動作類型"><BaseSelect value={filters.actionType} onChange={e => setFilters({...filters, actionType: e.target.value})}><option value="">全部</option><option value="登入/登出">登入/登出</option><option value="表單申請">表單申請</option><option value="單據撤銷">單據撤銷</option><option value="代理確認">代理確認</option><option value="主管簽核">主管簽核</option><option value="交辦審核">交辦審核</option><option value="人事管理">人事管理</option><option value="密碼變更">密碼變更</option><option value="系統公告">系統公告</option><option value="系統維護">系統維護</option></BaseSelect></FormGroup>
            <FormGroup label="關鍵字搜尋"><BaseInput placeholder="姓名、員編或詳細內容..." value={filters.keyword} onChange={e => setFilters({...filters, keyword: e.target.value})} /></FormGroup>
            <FormGroup label="起始日期 (從)"><BaseInput type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} /></FormGroup>
            <FormGroup label="結束日期 (至)"><BaseInput type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} /></FormGroup>
          </div>
          <div className="flex gap-3 justify-end pt-2 text-left">
            <button type="button" onClick={handleExportTXT} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"><FileText size={16} /> 匯出 TXT</button>
            <button type="button" onClick={handleExportJSON} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 dark:text-sky-400 transition-colors border border-sky-200 dark:border-sky-800 shadow-sm"><Download size={16} /> 匯出 JSON</button>
            <button type="button" onClick={handleReset} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors">清除重設</button>
          </div>
        </div>

        <div className="p-8 space-y-4 text-left">
          {displayLogs.length > 0 ? (
            <div className="overflow-hidden md:overflow-x-auto pb-4 text-left">
              <table className="w-full text-left whitespace-nowrap block md:table" style={{ borderSpacing: 0 }}>
                <thead className="hidden md:table-header-group">
                  <tr>
                    <th className="bg-slate-50 dark:bg-slate-800 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-l-2xl border-y border-l border-slate-200 dark:border-slate-700">操作時間</th>
                    <th className="bg-slate-50 dark:bg-slate-800 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700">操作者</th>
                    <th className="bg-slate-50 dark:bg-slate-800 px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y border-slate-200 dark:border-slate-700">動作類型</th>
                    <th className="bg-slate-50 dark:bg-slate-800 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-r-2xl border-y border-r border-slate-200 dark:border-slate-700 w-full">詳細內容</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-slate-100 dark:divide-slate-700 text-left p-4 md:p-0">
                  <tr className="hidden md:table-row h-2"></tr>
                  {displayLogs.slice(0, visibleCount).map(log => {
                    const d = new Date(log.createdAt);
                    const formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
                    return (
                      <tr key={log.id || log.serialId} className="block md:table-row bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 md:border-none rounded-2xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                        <td className="flex md:table-cell justify-between items-center px-4 md:px-6 py-3 md:py-4 font-mono font-bold text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-700 md:border-none">
                          <span className="md:hidden text-xs font-black text-slate-400">時間</span>
                          {formattedDate}
                        </td>
                        <td className="flex md:table-cell justify-between items-center px-4 md:px-4 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 md:border-none">
                          <span className="md:hidden text-xs font-black text-slate-400">操作者</span>
                          <div className="text-right md:text-left">
                            <div className="font-black text-slate-800 dark:text-slate-200">{log.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold font-mono">{log.empId}</div>
                          </div>
                        </td>
                        <td className="flex md:table-cell justify-between items-center px-4 md:px-4 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 md:border-none">
                          <span className="md:hidden text-xs font-black text-slate-400">類型</span>
                          <span className="px-2 py-1 rounded-md text-[10px] font-black border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="flex flex-col md:table-cell px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 md:border-none text-left gap-1">
                          <span className="md:hidden text-xs font-black text-slate-400 mb-1">詳細內容</span>
                          <div className="font-bold text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-w-[250px] leading-relaxed">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <InfiniteScrollObserver onLoadMore={() => setVisibleCount(c => c + 30)} hasMore={visibleCount < displayLogs.length} isTable={true} colSpan={4} />
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
              <Search size={48} className="opacity-20 mb-2" />
              <p>查無符合條件的操作日誌</p>
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
};

// =============================================================================
// 6. 系統主程式 APP
// =============================================================================
const App = () => {
  const [userSession, setUserSession] = useState(() => JSON.parse(sessionStorage.getItem('docflow_user_session')));
  const [activeMenu, setActiveMenu] = useState('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workflowTarget, setWorkflowTarget] = useState(null);
  const [printRecord, setPrintRecord] = useState(null); 
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
  
  // 加入 Light/Dark Mode 的 localStorage 狀態記憶
  const [theme, setTheme] = useState(() => localStorage.getItem('docflow_theme') || 'light'); 
  
  const { employees, records, sysLogs, readAnns, setReadAnns, announcements, setAnnouncements, calendarData, fetchData, logAction, loading, apiError } = useAppState(userSession, setUserSession);
  const [notification, setNotification] = useState(null);

  // 記錄 Session 與 Theme 變更
  useEffect(() => { if (userSession) sessionStorage.setItem('docflow_user_session', JSON.stringify(userSession)); else sessionStorage.removeItem('docflow_user_session'); }, [userSession]);
  useEffect(() => { localStorage.setItem('docflow_theme', theme); }, [theme]);
  useEffect(() => { if (notification) { const t = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(t); } }, [notification]);

  const handleLogout = (reason = '手動登出') => {
    if (userSession) logAction(userSession, '登出', reason);
    setUserSession(null);
  };

  // --- 閒置超時自動登出 (30分鐘) ---
  useEffect(() => {
    if (!userSession) return;
    let timeoutId;
    const handleIdle = () => {
      handleLogout('系統閒置超過 30 分鐘自動登出');
      setSessionExpiredMessage('您已閒置超過 30 分鐘，為保護資訊安全，系統已自動登出。');
    };
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    };

    resetTimeout(); 
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimeout));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimeout));
    };
  }, [userSession]);

  const isAdmin = userSession?.empId === 'root' || userSession?.empId === '9002' || ADMIN_TITLES.includes(userSession?.jobTitle);
  const availableDepts = [...new Set((employees || []).map(e => e.dept).filter(Boolean))];

  // 打包全域狀態給 Context Provider
  const contextValue = {
    userSession, setUserSession,
    records, employees, sysLogs, announcements, setAnnouncements,
    readAnns, markAnnAsRead: (id) => setReadAnns(p => [...new Set([...p, id])]),
    calendarData, availableDepts,
    onRefresh: fetchData, onLogAction: logAction,
    setNotification, setWorkflowTarget, setPrintRecord,
    isAdmin, setActiveMenu, handleLogout
  };

  // 選單數字與紅點計算
  const counts = useMemo(() => {
    if (!userSession) return { sub:0, mgr:0, unreadAnn:0, hasWelcomeDot:false };
    const sub = records.filter(r => r.formType === '請假' && r.status.includes('substitute') && r.substitute === userSession.name).length;
    const mgr = isAdmin ? records.filter(r => Utils.canApprove(userSession, r, employees)).length : 0;
    const unreadAnn = announcements.filter(ann => (!ann.endDate || ann.endDate >= new Date().toISOString().split('T')[0]) && !readAnns.includes(ann.id)).length;

    let hasMyPTOWarning = false;
    if (userSession.hireDate) {
       const stats = Utils.calculatePTO(userSession.empId, userSession.hireDate, records);
       const na = Utils.getNextAnniversary(userSession.hireDate);
       if (na) {
          const dLeft = Math.ceil((na.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
          const proj = stats.remainAnnual + Utils.getProjectedPTO(userSession.hireDate, na);
          if (proj > 240 && dLeft <= 90 && dLeft > 0) hasMyPTOWarning = true;
       }
    }

    let hasTeamWarning = false;
    if (isAdmin) {
       const team = employees.filter(emp => {
          if (emp.empId === userSession.empId) return false;
          if (userSession.empId === 'root') return true;
          const isEmpMgr = emp.jobTitle?.includes("經理") || emp.jobTitle?.includes("副理") || emp.jobTitle?.includes("協理");
          const rank = userSession.jobTitle || '';
          if (userSession.empId === '9001' || rank.includes('總經理')) return emp.dept === userSession.dept || isEmpMgr;
          if (rank.includes('協理')) {
            if (userSession.dept === '工程組') return ['工程組', '系統組'].includes(emp.dept);
            if (userSession.dept === '北區營業組') return ['客服組', '系統組', '北區營業組', '中區營業組', '南區營業組'].includes(emp.dept);
          }
          return emp.dept === userSession.dept;
       });
       hasTeamWarning = team.some(emp => {
          if (!emp.hireDate) return false;
          const st = Utils.calculatePTO(emp.empId, emp.hireDate, records);
          const na = Utils.getNextAnniversary(emp.hireDate);
          if (!na) return false;
          const dL = Math.ceil((na.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
          const pj = st.remainAnnual + Utils.getProjectedPTO(emp.hireDate, na);
          return pj > 240 && dL <= 90 && dL > 0;
       });
    }

    return { sub, mgr, unreadAnn, hasWelcomeDot: hasMyPTOWarning || hasTeamWarning };
  }, [records, userSession, isAdmin, employees, announcements, readAnns]);

  if (loading) return <div className={`h-screen flex items-center justify-center ${theme==='dark'?'dark bg-slate-900':'bg-slate-50'} text-sky-500`}><Loader2 className="animate-spin w-12 h-12" /></div>;
  
  if (!userSession) return (
    <div className={theme==='dark'?'dark':''}>
      {sessionExpiredMessage && (
        <ConfirmModal 
          title="系統已自動登出" 
          desc={sessionExpiredMessage} 
          onConfirm={() => setSessionExpiredMessage('')} 
          confirmText="重新登入" 
          confirmClass="bg-sky-600" 
          icon={Lock} 
        />
      )}
      <LoginView employees={employees} apiError={apiError} onLogAction={logAction} onLogin={u => { setUserSession(u); fetchData(); }} />
    </div>
  );

  const MItem = ({ id, I, label, badge, hasDot }) => (
    <button onClick={()=>{setActiveMenu(id);setSidebarOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu===id ? `bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 border-sky-600` : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'} ${isSidebarCollapsed ? 'justify-center' : ''}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <I size={20} />
        {hasDot && !badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>}
        {isSidebarCollapsed && badge > 0 && <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full">{badge}</span>}
      </div>
      {!isSidebarCollapsed && (
        <>
          <span className="truncate flex-1 text-left">{label}</span>
          {badge > 0 && <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-sm">{badge}</span>}
        </>
      )}
    </button>
  );

  const renderView = () => {
    switch (activeMenu) {
      case 'welcome': return <WelcomeView />;
      case 'overtime': return <GenericApplyView type="加班" currentSerialId={Utils.getSerialId(records, '加班', 'OT')} />;
      case 'leave-apply': return <GenericApplyView type="請假" currentSerialId={Utils.getSerialId(records, '請假', 'LV')} />;
      case 'abnormality': return <GenericApplyView type="出勤異常" currentSerialId={Utils.getSerialId(records, '出勤異常', 'AB')} />;
      case 'substitute': return <BatchProcessView title="代理確認中心" subtitle="確認同仁指定的職務代理申請" icon={UserCheck} processType="substitute" />;
      case 'approval': return <BatchProcessView title={userSession.empId === '9002' ? '交辦審核中心' : '簽核中心'} subtitle={userSession.empId === '9002' ? '確認並結案由主管核准後之交辦事項 (支援批次簽核)' : '審核員工表單 (支援批次簽核)'} icon={ShieldCheck} processType="approval" />;
      case 'integrated-query': return <InquiryView />;
      case 'leave-cancel': return <LeaveCancelView />;
      case 'change-password': return <ChangePasswordView />;
      case 'announcement-list': return <AnnouncementListView />;
      case 'calendar': return <CalendarView />;
      case 'announcement': return <AnnouncementManagement />;
      case 'personnel': return <PersonnelManagement />;
      case 'reports': return <ReportsView />;
      case 'system-logs': return <SystemLogView />;
      case 'delegation': return <DelegationView />;
      default: return <WelcomeView />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex-1 flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 w-full h-full relative">
          <PrintModal record={printRecord} onClose={() => setPrintRecord(null)} />
          <WorkflowModal isOpen={!!workflowTarget} onClose={()=>setWorkflowTarget(null)} record={workflowTarget} />
          {notification && (<div className={`fixed top-10 right-10 z-[200] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-rose-50 border-rose-200 text-rose-700'}`}>{notification.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}<span className="font-bold text-sm">{notification.text}</span></div>)}
          
          {/* 手機版頂部 */}
          <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-3 text-sky-600"><div className="p-2 bg-sky-600 rounded-xl text-white"><LayoutDashboard size={20}/></div><span className="font-black text-lg">員工服務</span></div>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500"><Menu size={24} /></button>
          </div>
          
          {/* 側邊導航 */}
          <aside className={`fixed md:relative top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col z-50 transform transition-transform w-80 shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isSidebarCollapsed ? 'md:w-24' : 'md:w-80'} shrink-0`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4 text-sky-600 overflow-hidden">
                <div className="p-3 bg-sky-600 rounded-2xl text-white shrink-0"><LayoutDashboard size={24} /></div>
                {!isSidebarCollapsed && <h2 className="font-black text-xl whitespace-nowrap">服務平台</h2>}
              </div>
              <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'hidden md:flex flex-col absolute top-24 left-1/2 -translate-x-1/2' : ''}`}>
                <button onClick={()=>setTheme(theme==='light'?'dark':'light')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">{theme==='light'?<Moon size={20}/>:<Sun size={20}/>}</button>
                {!isSidebarCollapsed && <button onClick={()=>setSidebarOpen(false)} className="md:hidden p-2 text-slate-400"><X size={20}/></button>}
              </div>
            </div>

            <nav className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
              <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4 ${isSidebarCollapsed ? 'text-center px-0' : ''}`}>{isSidebarCollapsed ? '...' : '主要服務'}</p>
              <MItem id="welcome" I={Sparkles} label="首頁總覽" hasDot={counts.hasWelcomeDot} />
              <MItem id="overtime" I={Clock} label="加班申請" />
              <MItem id="leave-apply" I={CalendarPlus} label="請假申請" />
              <MItem id="abnormality" I={Fingerprint} label="出勤異常單" />
              <MItem id="substitute" I={UserCheck} label="代理確認" badge={counts.sub} />
              <MItem id="leave-cancel" I={Undo2} label="銷假與撤銷" />
              <MItem id="integrated-query" I={ClipboardList} label="單據查詢" />
              <MItem id="calendar" I={Calendar} label="休假月曆" />
              <MItem id="announcement-list" I={Bell} label="資訊公告" badge={counts.unreadAnn} />
              {isAdmin && (
                <>
                  <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-8 ${isSidebarCollapsed ? 'text-center px-0' : ''}`}>{isSidebarCollapsed ? '...' : '管理功能'}</p>
                  <MItem id="approval" I={ShieldCheck} label={userSession.empId === '9002' ? '交辦審核' : '單據簽核'} badge={counts.mgr} />
                  <MItem id="delegation" I={GitMerge} label="簽核權限代理" />
                  <MItem id="reports" I={PieChart} label="統計報表" />
                  <MItem id="announcement" I={Megaphone} label="公告維護" />
                  <MItem id="personnel" I={Users} label="人員管理" />
                </>
              )}
              <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-8 ${isSidebarCollapsed ? 'text-center px-0' : ''}`}>{isSidebarCollapsed ? '...' : '系統設定'}</p>
              <MItem id="change-password" I={KeyRound} label="密碼變更" />
              {userSession.empId === 'root' && <MItem id="system-logs" I={Activity} label="系統日誌" />}
            </nav>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
              <div className={`p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center p-2' : ''}`}>
                <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/50 rounded-xl flex items-center justify-center font-black text-sky-600 dark:text-sky-400 text-xs shrink-0">{(userSession.dept||'部').substring(0,1)}</div>
                {!isSidebarCollapsed && <div className="overflow-hidden"><p className="text-xs font-black truncate">{userSession.name}</p><p className="text-[10px] text-slate-400 font-mono font-bold truncate">{userSession.empId}</p></div>}
              </div>
              <button onClick={() => handleLogout()} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all ${isSidebarCollapsed ? 'justify-center p-2' : ''}`}>
                <LogOut size={20} className="shrink-0" /> {!isSidebarCollapsed && <span>登出系統</span>}
              </button>
            </div>

            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full items-center justify-center text-slate-500 hover:text-sky-500 z-50 shadow-md transition-transform active:scale-90">
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </aside>

          <main className="flex-grow h-full p-4 sm:p-10 overflow-y-auto custom-scrollbar relative">
            <div className="max-w-6xl mx-auto">{renderView()}</div>
          </main>
        </div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } 
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
          @media print {
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; background: white; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </AppContext.Provider>
  );
};

export default App;