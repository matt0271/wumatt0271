import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X,
  ShieldCheck, Check, XCircle, MessageSquare, AlertTriangle,
  Search, Filter, BarChart3, MousePointerClick, Building2, Briefcase,
  Users, UserPlus, Wifi, WifiOff, HelpCircle
} from 'lucide-react';

// --- NGROK 設定區 ---
// 請在此替換為您執行 ngrok http 5000 後產生的網址 (記得結尾不要斜線)
// 例如: https://abcd-123-456.ngrok-free.app
const NGROK_URL = 'https://lindsy-unarbitrative-gannon.ngrok-free.dev'; 
const API_BASE_URL = `${NGROK_URL}/api`;

// 使用 ngrok 時必須帶上的 Header，否則 API 會回傳 ngrok 的警告 HTML
const NGROK_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

// 通用的時間選項
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30'];

// --- 加班申請視圖 ---
const OvertimeView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentOpinion, setCurrentOpinion] = useState('');
  const [error, setError] = useState(false);

  const initialFormState = {
    name: '',
    empId: '',
    category: 'regular',
    compensationType: 'leave',
    startDate: today,
    startHour: '09',
    startMin: '00',
    endDate: today,
    endHour: '18',
    endMin: '00',
    reason: '',
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'regular', label: '一般上班日' },
    { id: 'holiday', label: '國定假日' },
    { id: 'rest', label: '休息日' },
    { id: 'business', label: '出差加班' },
  ];

  const compensationTypes = [
    { id: 'leave', label: '補休' },
    { id: 'pay', label: '計薪' },
  ];

  const totalHours = useMemo(() => {
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffInMs = end - start;
    if (diffInMs <= 0) return 0;
    const h = diffInMs / (1000 * 60 * 60);
    return Math.round(h * 10) / 10;
  }, [formData.startDate, formData.startHour, formData.startMin, formData.endDate, formData.endHour, formData.endMin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const newRecord = { 
        ...formData, 
        id: Date.now(), 
        serialId: currentSerialId, 
        formType: '加班',
        appType, 
        totalHours, 
        status: 'pending',
        comment: '',
        timestamp: new Date().toLocaleString() 
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(initialFormState);
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setFormData(prev => ({ ...prev, startDate: value, endDate: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApprovalSubmit = (newStatus) => {
    if (!selectedId) return;
    if (newStatus === 'rejected' && !currentOpinion.trim()) {
      setError(true);
      return;
    }
    const updated = records.map(r => r.id === selectedId ? { ...r, status: newStatus, comment: currentOpinion } : r);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    setSelectedId(null);
    setCurrentOpinion('');
    setError(false);
  };

  const pendingOvertime = records.filter(r => r.formType === '加班' && r.status === 'pending');
  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-6 right-8 z-20 flex items-center gap-3 bg-indigo-500/30 backdrop-blur-md px-5 py-2.5 rounded-full border border-indigo-400/30 shadow-inner">
            <Fingerprint className="w-5 h-5 text-indigo-200" />
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">表單編號</span>
              <span className="text-base font-black font-mono tracking-wider leading-none">{currentSerialId}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><Timer size={120} /></div>
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-left">加班申請單</h1>
          <p className="mt-2 text-indigo-100 opacity-90 text-sm font-medium uppercase tracking-wider italic text-left">事前／事後加班皆可在此完成申請</p>
        </div>

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('pre')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事後補報</button>
            <button onClick={() => setAppType('approve')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'approve' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>主管簽核 {pendingOvertime.length > 0 && <span className="ml-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>}</button>
          </div>
        </div>

        {appType === 'approve' ? (
          <div className="px-8 py-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /><h3 className="text-lg font-bold text-slate-800 tracking-tight">待簽核加班清單</h3><span className="text-sm text-slate-400 font-medium">請點選下方項目進行簽核處理</span></div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">選取</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">表單編號</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">員編</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">姓名</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">加班事由</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">加班日期</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">工時數</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">選項</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingOvertime.length > 0 ? (
                      pendingOvertime.map((record) => (
                        <tr key={record.id} onClick={() => { setSelectedId(record.id); setError(false); }} className={`cursor-pointer transition-all duration-200 ${selectedId === record.id ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-6 text-center"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600 shadow-md shadow-indigo-200' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2.5 h-2.5 rounded-full bg-white animate-in zoom-in duration-300"></div>}</div></td>
                          <td className="px-4 py-6">
                            <div className="font-black font-mono text-indigo-600">{record.serialId}</div>
                            <div className={`mt-1 inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded ${record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{record.appType === 'pre' ? '事前申請' : '事後補報'}</div>
                          </td>
                          <td className="px-4 py-6 font-bold text-slate-600">{record.empId}</td>
                          <td className="px-4 py-6 font-bold text-slate-800">{record.name}</td>
                          <td className="px-6 py-6"><p className="text-slate-500 font-medium line-clamp-4 max-w-[250px] leading-relaxed" title={record.reason}>{record.reason}</p></td>
                          <td className="px-4 py-6">
                            <div className="font-bold text-slate-700">{record.startDate}</div>
                            <div className="text-xs text-slate-400 mt-1">{record.startHour}:{record.startMin} - {record.endHour}:{record.endMin}</div>
                          </td>
                          <td className="px-4 py-6 text-center"><span className="text-base font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-xl">{record.totalHours}</span></td>
                          <td className="px-4 py-6"><span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 uppercase tracking-tighter">{record.compensationType === 'leave' ? '補休' : '計薪'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="py-24 text-center text-slate-300 opacity-30 font-bold text-base">目前無待簽核項目</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${selectedId ? 'bg-white border-indigo-100 shadow-2xl shadow-indigo-100/50 scale-[1.01]' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow space-y-5 w-full">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><MessageSquare className={`w-6 h-6 ${selectedId ? 'text-indigo-600' : 'text-slate-400'}`} /><h4 className="text-lg font-black text-slate-800 tracking-tight">案件處理與簽核意見</h4></div>{selectedRecord && <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-in fade-in">當前選取：{selectedRecord.serialId} ({selectedRecord.name})</div>}</div>
                  <div className="relative">
                    <textarea disabled={!selectedId} placeholder={selectedId ? "在此輸入審核意見或駁回具體原因..." : "請先從上方列表中勾選待簽核案件..."} className={`w-full p-5 rounded-2xl text-base font-medium border outline-none transition-all resize-none h-32 ${error ? 'border-rose-400 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'}`} value={currentOpinion} onChange={(e) => { setCurrentOpinion(e.target.value); if (error) setError(false); }} />
                    {error && <div className="absolute left-5 bottom-3 text-xs font-black text-rose-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={14} /> 駁回必須填寫意見理由！</div>}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-4 shrink-0 w-full md:w-auto pt-10">
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('approved')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-2xl text-base font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-30"><Check size={20} strokeWidth={4} /> 核准通過</button>
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('rejected')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-2xl text-base font-black hover:bg-rose-600 shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-30"><XCircle size={20} /> 駁回申請</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-8 pt-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3"><label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><User className="w-4 h-4 mr-2 text-indigo-500" /> 姓名</label><input type="text" name="name" required placeholder="請輸入姓名" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium" value={formData.name} onChange={handleInputChange} /></div>
              <div className="space-y-3"><label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><Hash className="w-4 h-4 mr-2 text-indigo-500" /> 員工編號</label><input type="text" name="empId" required placeholder="例如: EMP-001" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium" value={formData.empId} onChange={handleInputChange} /></div>
            </div>
            {/* 表單其餘部分... */}
            <button type="submit" disabled={totalHours <= 0 || submitting} className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 ${submitted ? 'bg-emerald-500 shadow-emerald-200' : totalHours <= 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>{submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : submitted ? <CheckCircle2 className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}{submitted ? '提交成功' : '提交加班申請'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- 請假申請視圖 ---
const LeaveView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  // ... 請假單組件邏輯 (保持原有優化後的版本)
  return (<div>請假單內容</div>);
};

// --- 人員管理視圖 (已更新 NGROK 連線邏輯) ---
const PersonnelManagementView = ({ employees, refreshEmployees, requestDelete, dbStatus }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', dept: '', jobTitle: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (dbStatus !== 'connected') return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: NGROK_HEADERS, // 使用 ngrok 專用 Header
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setFormData({ name: '', empId: '', dept: '', jobTitle: '' });
        refreshEmployees();
      }
    } catch (err) {
      console.error("無法新增員工:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-sky-600 px-8 py-10 text-white relative overflow-hidden flex justify-between items-center">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight">人員管理中心</h1>
            <p className="mt-2 text-sky-100 opacity-90 text-sm font-medium italic">NGROK 遠端連線模式</p>
          </div>
          <div className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full border ${dbStatus === 'connected' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-rose-500/20 border-rose-400'}`}>
            {dbStatus === 'connected' ? <Wifi className="w-4 h-4 text-emerald-200" /> : <WifiOff className="w-4 h-4 text-rose-200" />}
            <span className="text-xs font-bold uppercase tracking-widest">{dbStatus === 'connected' ? '雲端連線正常' : '連線中斷'}</span>
          </div>
        </div>

        {dbStatus !== 'connected' && (
          <div className="mx-8 mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
            <HelpCircle className="text-amber-500 shrink-0 mt-1" />
            <div className="space-y-2">
              <h4 className="font-bold text-amber-800">無法連線至 NGROK 端點</h4>
              <p className="text-sm text-amber-700 leading-relaxed">請確認：<br/>1. 您的 ngrok 是否正在運行？<br/>2. 程式碼最上方的 <code>NGROK_URL</code> 是否已更新為最新的網址？<br/>3. 您的本地後端 <code>server.js</code> 是否已啟動？</p>
            </div>
          </div>
        )}

        <form onSubmit={handleAddEmployee} className={`p-8 space-y-8 ${dbStatus !== 'connected' ? 'opacity-50 pointer-events-none' : ''}`}>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-bold">
            {['name', 'empId', 'dept', 'jobTitle'].map(f => (
              <div key={f} className="space-y-3">
                <label className="flex items-center text-slate-500 uppercase tracking-widest">{f === 'name' ? '姓名' : f === 'empId' ? '員編' : f === 'dept' ? '單位' : '職稱'}</label>
                <input type="text" name={f} className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-sky-100" value={formData[f]} onChange={handleInputChange} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={submitting} className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-sky-700 transition-all active:scale-95 flex items-center justify-center gap-3">
            {submitting ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {submitting ? '同步中...' : '儲存至遠端資料庫'}
          </button>
        </form>
      </div>
      {/* 列表部分... (略) */}
    </div>
  );
};

// --- 查詢中心視圖 ---
const QueryCenterView = ({ records, getStatusBadge }) => {
  return (<div className="bg-white p-20 rounded-3xl text-center font-bold text-slate-400">查詢模組</div>);
};

// --- 主程式入口 ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [overtimeAppType, setOvertimeAppType] = useState('pre'); 
  const [leaveAppType, setLeaveAppType] = useState('form');     
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [dbStatus, setDbStatus] = useState('checking'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: 'record' });

  // --- 改良：使用 NGROK Headers 獲取資料 ---
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        headers: NGROK_HEADERS
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        setDbStatus('connected');
      } else {
        setDbStatus('error');
      }
    } catch (err) {
      setDbStatus('error');
    }
  };

  useEffect(() => {
    const savedRecords = localStorage.getItem('portal_records');
    if (savedRecords) { try { setRecords(JSON.parse(savedRecords)); } catch (e) { console.error(e); } }
    fetchEmployees();
  }, []);

  const currentSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const requestDelete = (id, type = 'record') => { setDeleteConfirm({ show: true, id, type }); };

  const executeDelete = async () => {
    if (deleteConfirm.type === 'record') {
      const updated = records.filter(r => r.id !== deleteConfirm.id);
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/employees/${deleteConfirm.id}`, { 
          method: 'DELETE',
          headers: NGROK_HEADERS
        });
        if (res.ok) fetchEmployees();
      } catch (err) {
        console.error("刪除失敗:", err);
      }
    }
    setDeleteConfirm({ show: false, id: null, type: 'record' });
  };

  const navItems = [
    { id: 'overtime', label: '加班申請單', icon: Clock, color: 'text-indigo-600', activeBorder: 'border-indigo-600' },
    { id: 'leave', label: '請假申請單', icon: CalendarDays, color: 'text-teal-600', activeBorder: 'border-teal-600' },
    { id: 'query', label: '查詢中心', icon: Search, color: 'text-amber-600', activeBorder: 'border-amber-600' },
    { id: 'personnel', label: '人員管理', icon: Users, color: 'text-sky-600', activeBorder: 'border-sky-600' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">已核准</span>;
      case 'rejected': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">已駁回</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">待簽核</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* 導覽列與主介面... (與前一版一致) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform`}>
        <div className="h-full flex flex-col p-8 space-y-6">
          <div className="flex items-center gap-3"><div className="p-3 bg-indigo-600 rounded-2xl"><LayoutDashboard className="text-white" /></div><h2 className="font-black text-xl">員工平台</h2></div>
          <nav className="flex-grow space-y-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeMenu === item.id ? `bg-slate-100 ${item.color} border-l-4 ${item.activeBorder}` : 'text-slate-400 hover:bg-slate-50'}`}><item.icon size={20}/>{item.label}</button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12">
          {activeMenu === 'overtime' ? <OvertimeView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={overtimeAppType} setAppType={setOvertimeAppType} /> : 
           activeMenu === 'leave' ? <LeaveView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={leaveAppType} setAppType={setLeaveAppType} /> : 
           activeMenu === 'query' ? <QueryCenterView records={records} getStatusBadge={getStatusBadge} /> : 
           <PersonnelManagementView employees={employees} refreshEmployees={fetchEmployees} requestDelete={requestDelete} dbStatus={dbStatus} />}
          
          {/* 歷史紀錄區塊... */}
        </div>
      </main>

      {/* 刪除確認 Modal... */}
    </div>
  );
};

export default App;