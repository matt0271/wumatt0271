import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2
} from 'lucide-react';

// --- ngrok API 設定 ---
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 

const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
};

// --- Constants ---
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

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

// --- View: Overtime Application ---
const OvertimeView = ({ currentSerialId, onRefresh, onIdChange }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const initialFormState = {
    name: '', empId: '',
    category: 'regular', compensationType: 'leave',
    startDate: '', startHour: '', startMin: '',  
    endDate: '', endHour: '', endMin: '',    
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    onIdChange(formData.empId);
  }, [formData.empId, onIdChange]);

  const handleStartDateChange = (e) => {
    const newDate = e.target.value;
    setFormData(prev => ({ ...prev, startDate: newDate, endDate: newDate }));
  };

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.startMin || !formData.endHour || !formData.endMin) {
      return "";
    }
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours === "" || totalHours <= 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, totalHours, status: 'pending' })
      });
      if (response.ok) {
        setFormData(initialFormState);
        onRefresh();
      } else {
        setSubmitError(`提交失敗 (HTTP ${response.status})`);
      }
    } catch (err) { 
      setSubmitError("提交失敗，請檢查網路連線");
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500">
      <div className="bg-indigo-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black">加班申請單 <span className="text-sm font-normal opacity-70 ml-2">({appType === 'pre' ? '事前' : '事後'})</span></h1>
        <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
          <button type="button" onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
          <button type="button" onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {submitError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold"><AlertTriangle size={18} /> {submitError}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">姓名</label>
            <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">員編</label>
            <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班類別</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">補償方式</label>
            <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center">
              <button type="button" onClick={() => setFormData({...formData, compensationType: 'leave'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.compensationType === 'leave' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>換補休</button>
              <button type="button" onClick={() => setFormData({...formData, compensationType: 'pay'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.compensationType === 'pay' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>計薪</button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="space-y-2 lg:col-span-5">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
            <div className="flex gap-2">
              <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500" value={formData.startDate} onChange={handleStartDateChange} />
              <div className="flex gap-1 shrink-0">
                <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-center" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-center" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 lg:col-span-5">
            <label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
            <div className="flex gap-2">
              <input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1 shrink-0">
                <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-rose-500 text-center" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-rose-500 text-center" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-3 text-white flex flex-col justify-center items-center shadow-lg shadow-indigo-100 lg:col-span-2 min-h-[66px]">
            <span className="text-[9px] font-black uppercase opacity-70 mb-0.5">總時數</span>
            <div className="flex items-baseline gap-1"><span className="text-xl font-black">{totalHours || "0"}</span><span className="text-[9px] font-bold opacity-60">HR</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班詳細事由</label>
          <textarea required rows="3" placeholder="請描述加班內容..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
        </div>

        <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-black text-sm"><Info size={18} /> 備註 ：</div>
          <ul className="space-y-2 text-xs text-amber-700 leading-relaxed font-medium">
            <li className="flex gap-2"><span className="font-bold">A.</span><span>加班申請須事前由直屬主管核准，始得進行加班，並於事後呈主管審核確認。</span></li>
            <li className="flex gap-2"><span className="font-bold">B.</span><span>此單由各部門編序號並於加班後七個工作日內交至財務行政部辦理，逾期不受理。</span></li>
            <li className="flex gap-2"><span className="font-bold">C.</span><span>此加班工時將依比率換算為補休時數或薪資。</span></li>
            <li className="flex gap-2"><span className="font-bold">D.</span><span>每月加班時數上限不得超過46小時。</span></li>
          </ul>
        </div>

        <button disabled={totalHours === "" || totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${totalHours === "" || totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} {submitting ? '提交中...' : '提交申請'}</button>
      </form>
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, onRefresh, onIdChange }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingId) onIdChange(formData.empId);
  }, [editingId, formData.empId, onIdChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: fetchOptions.headers, body: JSON.stringify(formData) });
      if (res.ok) {
        setFormData({ name: '', empId: '', jobTitle: '', dept: '' });
        setEditingId(null);
        onRefresh();
        onIdChange('');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (res.ok) onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500">
      <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
        <div><h1 className="text-2xl font-black">人員管理</h1><p className="text-sm opacity-80 italic">維護企業員工基本資料庫</p></div>
        <Users size={40} className="opacity-40" />
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'jobTitle', 'dept'].map(f => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
            </div>
          ))}
        </div>
        <button disabled={loading} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}>{loading ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}{editingId ? '更新資料' : '新增人員'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:''}); onIdChange(''); }} className="w-full text-xs text-slate-400 font-bold hover:text-rose-500 underline">取消編輯</button>}
      </form>
      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-8 py-4">員編</th><th className="px-4 py-4">姓名</th><th className="px-4 py-4">職稱</th><th className="px-4 py-4">單位</th><th className="px-8 py-4 text-right">操作</th></tr></thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.length > 0 ? employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500">{emp.jobTitle}</td>
                <td className="px-4 py-5 text-slate-500">{emp.dept}</td>
                <td className="px-8 py-5 text-right flex justify-end gap-2"><button onClick={() => { setEditingId(emp.id); setFormData(emp); }} className="p-2 text-slate-300 hover:text-sky-600 transition-colors"><Edit2 size={16}/></button><button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button></td>
              </tr>
            )) : (<tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400 italic">目前尚無員工資料</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState(''); 

  const today = new Date().toISOString().split('T')[0];

  const activeEmployee = useMemo(() => {
    if (!targetId) return null;
    return employees.find(emp => emp.empId === targetId);
  }, [targetId, employees]);

  const fetchData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      const [resEmployees, resRecords] = await Promise.all([
        fetch(`${NGROK_URL}/api/employees`, { ...fetchOptions, signal: controller.signal }).then(r => r.ok ? r.json() : []),
        fetch(`${NGROK_URL}/api/records`, { ...fetchOptions, signal: controller.signal }).then(r => r.ok ? r.json() : [])
      ]);
      clearTimeout(timeoutId);
      setEmployees(Array.isArray(resEmployees) ? resEmployees : []);
      setRecords(Array.isArray(resRecords) ? resRecords : []);
      setLoading(false);
    } catch (err) { 
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 20000); return () => clearInterval(interval); }, []);

  const otSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '加班' && r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900">
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-10"><div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100"><LayoutDashboard className="text-white" size={24} /></div><h2 className="font-black text-lg tracking-tight">員工服務平台</h2></div>
        
        <nav className="space-y-2 flex-grow">
          <button onClick={() => { setActiveMenu('overtime'); setTargetId(''); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => { setActiveMenu('personnel'); setTargetId(''); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
        </nav>

        {/* 下方資訊欄：僅在匹配到人員時顯示，移除系統狀態文字 */}
        {activeEmployee && (
          <div className="mt-auto p-5 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <User size={24}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">匹配人員</p>
                <h3 className="font-black truncate text-sm">{activeEmployee.name}</h3>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-60 flex items-center gap-1"><Briefcase size={12}/> 職稱</span>
                <span className="text-xs font-black">{activeEmployee.jobTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-60 flex items-center gap-1"><Building2 size={12}/> 單位</span>
                <span className="text-xs font-black italic">{activeEmployee.dept}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} onIdChange={setTargetId} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} onRefresh={fetchData} onIdChange={setTargetId} />}
        </div>
      </main>
    </div>
  );
};

export default App;