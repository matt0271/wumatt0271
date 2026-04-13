import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X,
  ShieldCheck, Check, XCircle, MessageSquare, AlertTriangle,
  Search, Filter, BarChart3, MousePointerClick, Building2, Briefcase,
  Users, UserPlus, Wifi, WifiOff, HelpCircle, Edit2, CalendarSearch,
  Download, Upload, FileSpreadsheet, Plus, ArrowRight, Settings, Globe,
  Save, RefreshCw
} from 'lucide-react';

// ==========================================
// 💡 如果設定一直跳回，請直接修改下方這行網址：
// ==========================================
const DEFAULT_API_URL = ' https://opacity-container-niece.ngrok-free.dev'; 

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

const DEPARTMENTS = [
  '工程組', '系統組', '財務行政部', '產品組', '客服組', 
  '北區營業組', '中區營業組', '南區營業組', '總經理室'
];

// --- 狀態標籤 ---
const StatusBadge = ({ status }) => {
  const styles = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200"
  };
  const labels = { approved: "已核准", rejected: "已駁回", pending: "待簽核" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || labels.pending}
    </span>
  );
};

// --- 加班申請 ---
const OvertimeView = ({ currentSerialId, today, refreshData, apiBaseUrl }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', jobTitle: '', dept: '',
    category: 'regular', compensationType: 'leave',
    startDate: today, startHour: '09', startMin: '00',
    endDate: today, endHour: '18', endMin: '00',
    reason: '',
  });

  const totalHours = useMemo(() => {
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
      const response = await fetch(`${apiBaseUrl}/records.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (response.ok) { setFormData(prev => ({ ...prev, reason: '' })); alert('加班申請已提交'); refreshData(); }
    } catch (err) { alert('連線失敗，請檢查 API 位址'); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 text-left">
      <div className="bg-indigo-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white"><Fingerprint className="w-4 h-4" /><span className="text-xs font-mono font-bold">{currentSerialId}</span></div>
        <h1 className="text-2xl font-black text-left text-white">加班申請單</h1>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {['name', 'empId', 'jobTitle', 'dept'].map(f => (
            <div key={f} className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} /></div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end text-left">
          <div className="space-y-2 text-left"><label className="text-xs font-bold text-emerald-600">開始時間</label><div className="flex gap-1"><input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
          <div className="space-y-2 text-left"><label className="text-xs font-bold text-rose-600">結束時間</label><div className="flex gap-1"><input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
          <div className="bg-indigo-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg"><span className="text-[10px] font-bold uppercase text-white">總時數</span><span className="text-2xl font-black text-white">{totalHours} HR</span></div>
        </div>
        <div className="space-y-2 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">加班事由</label><textarea required rows="3" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-left" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
        <button disabled={totalHours <= 0 || submitting} className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl disabled:bg-slate-300">提交申請</button>
      </form>
    </div>
  );
};

// --- 請假申請 ---
const LeaveView = ({ currentSerialId, today, refreshData, apiBaseUrl }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', jobTitle: '', dept: '',
    type: 'annual', proxy: '', startDate: today, startHour: '09', startMin: '00', endDate: today, endHour: '18', endMin: '00', reason: '',
  });

  const totalHours = useMemo(() => {
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
      const response = await fetch(`${apiBaseUrl}/records.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (response.ok) { setFormData(prev => ({ ...prev, reason: '', proxy: '' })); alert('請假申請已提交'); refreshData(); }
    } catch (err) { alert('連線失敗'); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in duration-300">
      <div className="bg-teal-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white"><Fingerprint className="w-4 h-4" /><span className="text-xs font-mono font-bold text-white">{currentSerialId}</span></div>
        <h1 className="text-2xl font-black text-left text-white">請假申請單</h1>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {['name', 'empId', 'jobTitle', 'dept'].map(f => (
            <div key={f} className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} /></div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end text-left">
          <div className="space-y-2 text-left"><label className="text-xs font-bold text-emerald-600">開始日期</label><div className="flex gap-1"><input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
          <div className="space-y-2 text-left"><label className="text-xs font-bold text-rose-600">結束日期</label><div className="flex gap-1"><input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select><select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
          <div className="bg-teal-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg"><span className="text-[10px] font-bold uppercase text-white">計算時數</span><span className="text-2xl font-black text-white">{totalHours} HR</span></div>
        </div>
        <div className="space-y-2 text-left"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">請假理由</label><textarea required rows="3" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-left" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
        <button disabled={totalHours <= 0 || submitting} className="w-full py-4 rounded-2xl font-black text-white bg-teal-600 hover:bg-teal-700 shadow-xl disabled:bg-slate-300">提交請假申請</button>
      </form>
    </div>
  );
};

// --- 主管簽核中心 ---
const ApprovalCenter = ({ records, refreshData, apiBaseUrl }) => {
  const [processing, setProcessing] = useState(false);
  const handleAction = async (id, status) => {
    setProcessing(true);
    try {
      await fetch(`${apiBaseUrl}/records.php?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      refreshData();
    } catch (err) { alert('操作失敗'); } finally { setProcessing(false); }
  };
  const pending = records.filter(r => r.status === 'pending');
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-left animate-in fade-in">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2"><ShieldCheck className="text-rose-600" /> 待處理案件 ({pending.length})</h1>
      <div className="space-y-4">
        {pending.map(r => (
          <div key={r.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50/50">
            <div className="text-left">
              <div className="font-mono text-xs text-indigo-600 text-left">{r.serialId}</div>
              <div className="font-bold text-slate-800 text-left">{r.name} - {r.formType} ({r.totalHours} HR)</div>
              <div className="text-xs text-slate-500 font-medium text-left">{r.jobTitle} / {r.dept}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction(r.id, 'approved')} disabled={processing} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-600">核准</button>
              <button onClick={() => handleAction(r.id, 'rejected')} disabled={processing} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md hover:bg-rose-600">駁回</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="py-20 text-center text-slate-300 italic text-center">目前沒有待處理案件</div>}
      </div>
    </div>
  );
};

// --- 人員管理 ---
const PersonnelManagement = ({ employees, refreshData, apiBaseUrl }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/employees.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) { setFormData({ name: '', empId: '', jobTitle: '', dept: '' }); refreshData(); }
    } catch (err) { alert('連線 API 失敗'); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-8 text-left animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
        <h1 className="text-2xl font-black mb-6 text-sky-600 flex items-center gap-2"><Users /> 人員管理系統</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {['name', 'empId', 'jobTitle', 'dept'].map(f => (
            <div key={f} className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              {f === 'dept' ? (
                <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>
                  <option value="">選擇單位</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
              )}
            </div>
          ))}
          <button className="bg-sky-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-sky-700 transition-all">{loading ? '處理中...' : '新增人員'}</button>
        </form>
      </div>
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase"><tr><th className="p-4">員編</th><th className="p-4 text-left">姓名</th><th className="p-4 text-left">職稱</th><th className="p-4 text-left">單位</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all text-left"><td className="p-4 font-mono font-medium text-sky-600 text-left">{emp.empId}</td><td className="p-4 font-bold text-slate-800 text-left">{emp.name}</td><td className="p-4 text-slate-500 text-left">{emp.jobTitle}</td><td className="p-4 text-slate-500 text-left">{emp.dept}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 主程式入口 ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // API 位址管理
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try { return localStorage.getItem('app_api_url') || DEFAULT_API_URL; }
    catch (e) { return DEFAULT_API_URL; }
  });
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const [resR, resE] = await Promise.all([
        fetch(`${apiBaseUrl}/records.php`, { signal: controller.signal }), 
        fetch(`${apiBaseUrl}/employees.php`, { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);
      if (resR.ok && resE.ok) { 
        setRecords(await resR.json()); 
        setEmployees(await resE.json()); 
        setApiError(null); 
      } else { throw new Error(); }
    } catch (err) { setApiError("連線異常：請點選左下角設定填入最新的 ngrok https 網址。"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const itv = setInterval(() => fetchData(true), 30000); return () => clearInterval(itv); }, [apiBaseUrl]);

  // 同步彈窗網址
  useEffect(() => { if (isSettingsOpen) setTempApiUrl(apiBaseUrl); }, [isSettingsOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 text-left">
      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-[60] transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 h-full flex flex-col text-left">
          <div className="flex items-center gap-4 mb-10 text-left"><div className="p-3 bg-indigo-600 rounded-2xl shadow-xl"><LayoutDashboard className="text-white text-left" size={24} /></div><h2 className="font-black text-lg tracking-tight text-left">員工服務平台</h2></div>
          <nav className="flex-grow space-y-2 text-left">
            {[
              { id: 'overtime', label: '加班申請', icon: Clock },
              { id: 'leave', label: '請假申請', icon: CalendarDays },
              { id: 'approval', label: '主管簽核', icon: ShieldCheck },
              { id: 'personnel', label: '人員管理', icon: Users }
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); fetchData(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold border-l-4 transition-all ${activeMenu === item.id ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 border-transparent hover:bg-slate-50'}`}><item.icon size={20} />{item.label}</button>
            ))}
          </nav>
          <div className="mt-auto p-6 bg-slate-50 rounded-2xl text-left">
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 group text-left w-full hover:bg-white p-2 rounded-xl transition-all">
              <Settings size={20} className="text-slate-400 group-hover:text-indigo-600" />
              <div className="truncate text-left"><p className="text-xs font-black text-slate-800 text-left">API 設定</p><p className="text-[10px] text-slate-400 truncate text-left">{apiBaseUrl}</p></div>
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-grow pt-10 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12">
          {apiError && <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-800 text-sm font-bold animate-pulse text-left shadow-sm"><AlertTriangle className="shrink-0 text-left" />{apiError}</div>}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId="2026-OT001" today="2026-04-13" refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'leave' && <LeaveView currentSerialId="2026-LV001" today="2026-04-13" refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'approval' && <ApprovalCenter records={records} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          
          {/* 歷史紀錄表格 */}
          {(activeMenu === 'overtime' || activeMenu === 'leave') && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 text-left">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-left text-slate-400"><History /> 近期申請紀錄</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="p-4">單號</th><th className="p-4 text-left">姓名</th><th className="p-4 text-center">時數</th><th className="p-4 text-right">狀態</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.filter(r => (activeMenu === 'overtime' ? r.formType === '加班' : r.formType === '請假')).slice(0, 5).map(r => (
                      <tr key={r.id} className="text-sm font-medium"><td className="p-4 font-mono text-indigo-600">{r.serialId}</td><td className="p-4 font-bold text-left">{r.name}</td><td className="p-4 text-center">{r.totalHours} HR</td><td className="p-4 text-right"><StatusBadge status={r.status} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm text-left">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-left animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6 text-left"><Globe className="text-indigo-600" /><h3 className="text-xl font-black text-left">API 位址設定</h3></div>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed text-left">請貼上 <b>ngrok</b> 產生的 <b>https</b> 網址。這將儲存在您的瀏覽器中。<br/>範例：https://xxxx.ngrok-free.app/api</p>
            <input type="text" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-left" value={tempApiUrl} onChange={e => setTempApiUrl(e.target.value)} />
            <div className="flex gap-3 mt-6 text-left"><button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold hover:bg-slate-200 transition-colors">取消</button><button onClick={() => { const u = tempApiUrl.replace(/\/+$/, ""); try { localStorage.setItem('app_api_url', u); } catch(e){} setApiBaseUrl(u); setIsSettingsOpen(false); fetchData(); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95">儲存設定</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;