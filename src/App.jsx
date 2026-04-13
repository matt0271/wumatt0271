import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2
} from 'lucide-react';

// --- ngrok API 設定 ---
const NGROK_URL = 'https://opacity-container-niece.ngrok-free.dev'; 

const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
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
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || labels.pending}
    </span>
  );
};

// --- View: Overtime Application ---
const OvertimeView = ({ currentSerialId, onRefresh, employees, records }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null); 
  
  const [formData, setFormData] = useState({
    name: '', empId: '', category: 'regular', compensationType: 'leave',
    startDate: '', startHour: '', startMin: '', endDate: '', endHour: '', endMin: '', reason: '',
  });

  // 獲取最近 30 天送出的所有加班單據 (不論狀態)
  const recentSubmissions = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return records
      .filter(r => {
        if (r.formType !== '加班' || !r.createdAt) return false;
        const recordDate = new Date(r.createdAt);
        return recordDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const now = new Date();
    try {
      const response = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '加班', appType, status: 'pending', createdAt: now.toISOString() })
      });
      if (response.ok) {
        setFormData({ name: '', empId: '', category: 'regular', compensationType: 'leave', startDate: '', startHour: '', startMin: '', endDate: '', endHour: '', endMin: '', reason: '' });
        onRefresh();
      }
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleWithdrawAction = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers });
      setWithdrawTarget(null);
      onRefresh();
    } catch (err) { console.error(err); } finally { setWithdrawing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-left">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black mb-2">確定要抽單嗎？</h3>
            <p className="text-sm text-slate-500 mb-8">單號：{withdrawTarget.serialId}</p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">取消</button>
              <button onClick={handleWithdrawAction} disabled={withdrawing} className="flex-1 py-3 rounded-xl font-black text-white bg-rose-500 flex items-center justify-center gap-2">
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} 確認抽單
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black">加班申請單</h1>
            <p className="text-xs opacity-70 mt-1">目前單號：{currentSerialId}</p>
          </div>
          <div className="flex bg-indigo-700/50 p-1 rounded-xl">
            <button onClick={() => setAppType('pre')} className={`px-4 py-2 rounded-lg text-xs font-bold ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70'}`}>事前</button>
            <button onClick={() => setAppType('post')} className={`px-4 py-2 rounded-lg text-xs font-bold ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70'}`}>事後</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" placeholder="姓名" className="w-full p-3 rounded-xl border bg-slate-50 text-sm" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required />
                <input type="text" placeholder="員編" className="w-full p-3 rounded-xl border bg-slate-50 text-sm" value={formData.empId} onChange={e=>setFormData({...formData, empId:e.target.value})} required />
                <select className="w-full p-3 rounded-xl border bg-slate-50 text-sm" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                    <option value="regular">一般上班日</option>
                    <option value="holiday">國定假日</option>
                </select>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={()=>setFormData({...formData, compensationType:'leave'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${formData.compensationType==='leave'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>換補休</button>
                    <button type="button" onClick={()=>setFormData({...formData, compensationType:'pay'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${formData.compensationType==='pay'?'bg-white shadow text-indigo-600':'text-slate-500'}`}>計薪</button>
                </div>
            </div>
            <textarea placeholder="請輸入加班事由" className="w-full p-4 rounded-xl border bg-slate-50 text-sm" rows="3" value={formData.reason} onChange={e=>setFormData({...formData, reason:e.target.value})} required />
            <button disabled={submitting} className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 shadow-lg hover:bg-indigo-700 transition-all">
                {submitting ? "提交中..." : "提交加班申請"}
            </button>
        </form>
      </div>

      {/* 最近 30 天單據 (顯示給員工看，包含已過之單據) */}
      <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-8 overflow-hidden">
        <h3 className="font-black text-lg text-indigo-600 mb-6 flex items-center gap-2"><FileText size={20}/> 最近 30 天單據紀錄</h3>
        <div className="space-y-4">
          {recentSubmissions.map(record => (
            <div key={record.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400">{record.serialId}</p>
                <p className="font-black text-slate-800">{record.name} - {record.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={record.status} />
                {record.status === 'pending' && <button onClick={() => setWithdrawTarget(record)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Undo2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- View: Supervisor Approval ---
const ApprovalView = ({ records, onRefresh }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  // 【關鍵修正】：過濾 records，只顯示 pending (待簽核) 的單據
  const pendingRecords = useMemo(() => {
    return records.filter(r => r.status === 'pending');
  }, [records]);

  const updateStatus = async (newStatus) => {
    if (!selectedId) return;
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { 
        method: 'PUT', 
        headers: fetchOptions.headers, 
        body: JSON.stringify({ status: newStatus, opinion: opinion }) 
      });
      if (res.ok) { 
        setSelectedId(null); 
        setOpinion(''); 
        onRefresh(); // 重新抓取資料後，因為上述 filter 邏輯，該單據會立刻消失
      }
    } catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
        <div className="bg-emerald-600 px-8 py-8 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black">主管簽核</h1><p className="text-sm opacity-80 italic">僅顯示待處理之加班申請</p></div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr><th className="px-8 py-4">選擇</th><th className="px-4 py-4">單號</th><th className="px-4 py-4">申請人</th><th className="px-4 py-4 min-w-[200px]">事由</th><th className="px-8 py-4 text-right">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingRecords.length > 0 ? pendingRecords.map(record => (
                <tr key={record.id} onClick={() => setSelectedId(record.id)} className={`transition-all cursor-pointer ${selectedId === record.id ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-5"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2 h-2 rounded-full bg-white" />}</div></td>
                  <td className="px-4 py-5 font-mono text-indigo-600 font-bold">{record.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{record.name}</td>
                  <td className="px-4 py-5 text-xs text-slate-500 line-clamp-2">{record.reason}</td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={record.status} /></td>
                </tr>
              )) : (<tr><td colSpan="5" className="px-8 py-10 text-center text-slate-400 italic">目前沒有待簽核的單據</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border p-8 animate-in slide-in-from-bottom border-indigo-200">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 主管簽核意見</div>
              <textarea placeholder="輸入意見 (選填)..." className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none h-24 focus:bg-white" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
            </div>
            <div className="w-full md:w-72 flex flex-col justify-end gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">目前選取：<span className="text-indigo-600 font-black">{selectedRecord?.serialId}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateStatus('rejected')} disabled={updating} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"><XCircle size={24}/><span className="font-black text-xs">駁回申請</span></button>
                <button onClick={() => updateStatus('approved')} disabled={updating} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">{updating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}<span className="font-black text-xs">核准加班</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- App Main ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resRec, resEmp] = await Promise.all([
        fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json()),
        fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json())
      ]);
      setRecords(Array.isArray(resRec) ? resRec : []);
      setEmployees(Array.isArray(resEmp) ? resEmp : []);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const otSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = records.filter(r => r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(count + 1).padStart(3, '0')}`;
  }, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      <aside className="w-80 bg-white border-r p-8 flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-4 mb-10 text-indigo-600 font-black text-xl"><LayoutDashboard /> 員工服務平台</div>
        <nav className="space-y-2 flex-grow text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeMenu === 'approval' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}><ShieldCheck size={20} /> 主管簽核</button>
        </nav>
      </aside>
      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} employees={employees} records={records} />}
          {activeMenu === 'approval' && <ApprovalView records={records} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;