import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight
} from 'lucide-react';

// --- ngrok API 設定 ---
// 重要：請將下方的網址替換為您執行 ngrok http 80 後產生的 https 網址
const NGROK_URL = ' https://opacity-container-niece.ngrok-free.dev'; 
const API_URL = `${NGROK_URL}/api.php`;

// 建立一個統一的 fetch 標頭，包含跳過 ngrok 警告頁面的設定
const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // 跳過 ngrok 的初始警告頁面
  }
};

// --- Helper: Status Badge ---
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
const OvertimeView = ({ currentSerialId, today, onRefresh }) => {
  const [appType, setAppType] = useState('pre'); 
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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({
          action: 'addRecord',
          data: {
            ...formData,
            serialId: currentSerialId,
            formType: '加班',
            appType,
            totalHours,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, reason: '' }));
        onRefresh();
      }
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
      <div className="bg-indigo-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black">加班申請單 (ngrok) <span className="text-sm font-normal opacity-70 ml-2">({appType === 'pre' ? '事前' : '事後'})</span></h1>
        <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
          <button onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
          <button onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'jobTitle', 'dept'].map((f) => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班類別</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {[{id:'regular',label:'一般上班日'},{id:'holiday',label:'國定假日'},{id:'rest',label:'休息日'},{id:'business',label:'出差加班'}].map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">補償方式</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" value={formData.compensationType} onChange={e => setFormData({...formData, compensationType: e.target.value})}>
              <option value="leave">換取補休</option>
              <option value="pay">申領加班費</option>
            </select>
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{Array.from({length:24},(_,i)=>i.toString().padStart(2,'0')).map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{['00','30'].map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{Array.from({length:24},(_,i)=>i.toString().padStart(2,'0')).map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{['00','30'].map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg shadow-indigo-100">
            <span className="text-[10px] font-bold uppercase">總時數</span>
            <span className="text-2xl font-black">{totalHours} <span className="text-xs">HR</span></span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班詳細事由</label>
          <textarea required rows="3" placeholder="請描述加班內容..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
        </div>
        <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          提交申請
        </button>
      </form>
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, onRefresh }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', dept: '', jobTitle: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const action = editingId ? 'updateEmployee' : 'addEmployee';
      await fetch(API_URL, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({ action, data: { ...formData, id: editingId } })
      });
      setFormData({ name: '', empId: '', dept: '', jobTitle: '' });
      setEditingId(null);
      onRefresh();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({ action: 'deleteEmployee', id })
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
      <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
        <div><h1 className="text-2xl font-black">人員管理中心 (ngrok)</h1><p className="text-sm opacity-80 italic">透過 ngrok 隧道訪問 XAMPP</p></div>
        <Users size={40} className="opacity-40" />
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'dept', 'jobTitle'].map(f => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f==='name'?'姓名':f==='empId'?'員編':f==='dept'?'單位':'職稱'}</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button disabled={loading} className={`flex-grow py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}>
            {loading ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}
            {editingId ? '更新資料' : '新增人員'}
          </button>
        </div>
      </form>
      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-4">員編</th><th className="px-4 py-4">姓名</th><th className="px-4 py-4">單位</th><th className="px-8 py-4 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500">{emp.dept}</td>
                <td className="px-8 py-5 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditingId(emp.id); setFormData(emp); }} className="p-2 text-slate-300 hover:text-sky-600"><Edit2 size={16}/></button>
                  <button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Application ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      const [resRecords, resEmployees] = await Promise.all([
        fetch(`${API_URL}?action=getRecords`, { headers: fetchOptions.headers }),
        fetch(`${API_URL}?action=getEmployees`, { headers: fetchOptions.headers })
      ]);
      
      if (!resRecords.ok || !resEmployees.ok) throw new Error("API Network response was not ok");
      
      const dataRecords = await resRecords.json();
      const dataEmployees = await resEmployees.json();
      setRecords(Array.isArray(dataRecords) ? dataRecords : []);
      setEmployees(Array.isArray(dataEmployees) ? dataEmployees : []);
      setLoading(false);
    } catch (err) { 
      console.error("Fetch failed", err); 
      // 若連線失敗，可能是 ngrok 網址已過期
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 延長輪詢時間減少 ngrok 壓力
    return () => clearInterval(interval);
  }, []);

  const otSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '加班' && r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  if (loading) return <div className="h-screen flex flex-col items-center justify-center gap-4">
    <Loader2 className="animate-spin text-indigo-600" />
    <div className="text-xs font-black">正在透過 ngrok 連線至資料庫...</div>
    <div className="text-[10px] text-slate-400">請確保 XAMPP 正在執行且 ngrok 已啟動</div>
  </div>;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left">
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl"><LayoutDashboard className="text-white" /></div>
          <div><h2 className="font-black text-lg">員工平台</h2><div className="text-[10px] text-emerald-500 font-bold uppercase">ngrok 連線中</div></div>
        </div>
        <nav className="space-y-2 flex-grow">
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex p-4 rounded-2xl font-bold ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' : 'text-slate-400'}`}><Clock className="mr-3" /> 加班申請</button>
          <button onClick={() => setActiveMenu('personnel')} className={`w-full flex p-4 rounded-2xl font-bold ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-l-4 border-sky-600' : 'text-slate-400'}`}><Users className="mr-3" /> 人員管理</button>
        </nav>
      </aside>
      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} today={today} onRefresh={fetchData} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;