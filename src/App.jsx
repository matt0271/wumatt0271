import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info
} from 'lucide-react';

// --- ngrok API 設定 ---
// 重要：請將下方的網址替換為您執行 ngrok http 5000 後產生的 https 網址
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 

// 建立一個統一的 fetch 標頭，包含跳過 ngrok 警告頁面的設定
const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
};

// --- Constants ---
const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

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
    name: '', empId: '',
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
      const res = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({
          ...formData,
          serialId: currentSerialId,
          formType: '加班',
          appType,
          totalHours,
          status: 'pending'
        })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, reason: '' }));
        onRefresh();
      } else {
        console.error("提交失敗，伺服器回傳錯誤");
      }
    } catch (err) { 
      console.error("提交失敗，請檢查網路連線:", err); 
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
        {/* 四個欄位放在同一行 */}
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
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">補償方式</label>
            <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center">
              <button
                type="button"
                onClick={() => setFormData({...formData, compensationType: 'leave'})}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.compensationType === 'leave' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                換補休
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, compensationType: 'pay'})}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.compensationType === 'pay' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                計薪
              </button>
            </div>
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

        {/* 備註區塊 */}
        <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
            <Info size={18} />
            備註 ：
          </div>
          <ul className="space-y-2 text-xs text-amber-700 leading-relaxed font-medium">
            <li className="flex gap-2">
              <span className="font-bold">A.</span>
              <span>加班申請須事前由直屬主管核准，始得進行加班，並於事後呈主管審核確認。</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">B.</span>
              <span>此單由各部門編序號並於加班後七個工作日內交至財務行政部辦理，逾期不受理。</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">C.</span>
              <span>此加班工時將依比率換算為補休時數或薪資。</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">D.</span>
              <span>每月加班時數上限不得超過46小時。</span>
            </li>
          </ul>
        </div>

        <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          {submitting ? '提交中...' : '提交申請'}
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
      const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: fetchOptions.headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', empId: '', dept: '', jobTitle: '' });
        setEditingId(null);
        onRefresh();
      }
    } catch (err) { console.error("處理資料出錯:", err); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: fetchOptions.headers
      });
      if (res.ok) onRefresh();
    } catch (err) { console.error("刪除失敗:", err); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500">
      <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">人員管理</h1>
          <p className="text-sm opacity-80 italic">維護企業員工基本資料庫</p>
        </div>
        <Users size={40} className="opacity-40" />
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['name', 'empId', 'dept', 'jobTitle'].map(f => (
            <div key={f} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f==='name'?'姓名':f==='empId'?'員編':f==='dept'?'單位':'職稱'}</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
            </div>
          ))}
        </div>
        <button disabled={loading} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}>
          {loading ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}
          {editingId ? '更新資料' : '新增人員'}
        </button>
      </form>
      <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-4">員編</th><th className="px-4 py-4">姓名</th><th className="px-4 py-4">單位</th><th className="px-8 py-4 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.length > 0 ? employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500">{emp.dept}</td>
                <td className="px-8 py-5 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditingId(emp.id); setFormData(emp); }} className="p-2 text-slate-300 hover:text-sky-600 transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 italic">目前尚無員工資料</td></tr>
            )}
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
  const [errorState, setErrorState] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (NGROK_URL.includes('您的-ngrok-網址')) {
      setErrorState({
        title: "尚未設定 ngrok 網址",
        message: "請在程式碼第 11 行將預設網址替換為您啟動 ngrok 後產生的網址。",
        code: "NGROK_URL_PLACEHOLDER"
      });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 15000); 

    try {
      const employeePromise = fetch(`${NGROK_URL}/api/employees`, { ...fetchOptions, signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject(`Employee API Error: ${res.status}`))
        .catch(err => {
            if (err.name === 'AbortError') throw err;
            console.warn("無法取得員工資料:", err);
            return null;
        });

      const recordsPromise = fetch(`${NGROK_URL}/api/records`, { ...fetchOptions, signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject(`Records API Error: ${res.status}`))
        .catch(err => {
            if (err.name === 'AbortError') throw err;
            console.warn("無法取得紀錄資料:", err);
            return null;
        });

      const [dataEmployees, dataRecords] = await Promise.all([employeePromise, recordsPromise]);

      clearTimeout(timeoutId);

      if (dataEmployees) setEmployees(dataEmployees);
      if (dataRecords) setRecords(dataRecords);

      if (!dataEmployees && !employees.length) {
          throw new Error("無法連線至 API 伺服器獲取基礎資料。");
      }
      
      setErrorState(null);
      setLoading(false);
    } catch (err) { 
      clearTimeout(timeoutId);
      console.error("Fetch failed:", err); 
      
      const isTimeout = err.name === 'AbortError';
      setErrorState({
        title: isTimeout ? "連線逾時 (Timeout)" : "連線失敗 (Network Error)",
        message: isTimeout 
            ? "伺服器回應時間過長（超過 15 秒）。這通常是因為您的電腦休眠中、ngrok 斷線或網路環境不穩定。" 
            : "前端無法連線至您的後端 API。請檢查以下事項：\n1. Node.js 伺服器是否正在運行 (node server.js)\n2. ngrok 隧道是否已啟動 (ngrok http 5000)\n3. 網址是否填寫正確且沒有重複字元。",
        code: err.name
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000); 
    return () => clearInterval(interval);
  }, []);

  const otSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '加班' && r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <div className="text-sm font-black text-slate-400 uppercase tracking-widest">正在連線至後端服務...</div>
    </div>
  );

  if (errorState) return (
    <div className="h-screen flex items-center justify-center p-6 bg-slate-50 text-left">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-rose-100 max-w-xl w-full">
        <div className="flex items-center gap-4 mb-6 text-rose-500">
          <AlertTriangle size={48} />
          <h2 className="text-2xl font-black">{errorState.title}</h2>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 mb-8">
          <p className="text-rose-700 text-sm whitespace-pre-wrap leading-relaxed">
            {errorState.message}
          </p>
        </div>
        <div className="space-y-4">
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <RefreshCw size={20} /> 重新嘗試連線
          </button>
          <div className="text-center text-[10px] text-slate-300 font-mono uppercase">
            Error Type: {errorState.code}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900">
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight">員工服務平台</h2>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              雲端同步正常
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4">主選單</p>
          <button 
            onClick={() => setActiveMenu('overtime')} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}
          >
            <Clock size={20} /> 加班申請
          </button>
          <button 
            onClick={() => setActiveMenu('personnel')} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}
          >
            <Users size={20} /> 人員管理
          </button>
        </nav>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} today={today} onRefresh={fetchData} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;