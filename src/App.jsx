import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell
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

// --- Constants ---
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 
const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

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

  // 獲取最近 30 天送出的所有加班單據 (供員工查看進度)
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
        body: JSON.stringify({ 
          ...formData, 
          serialId: currentSerialId, 
          formType: '加班', 
          appType, 
          status: 'pending', 
          createdAt: now.toISOString(),
          totalHours: calculateTotalHours()
        })
      });
      if (response.ok) {
        setFormData({ name: '', empId: '', category: 'regular', compensationType: 'leave', startDate: '', startHour: '', startMin: '', endDate: '', endHour: '', endMin: '', reason: '' });
        onRefresh();
      }
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const calculateTotalHours = () => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return 0;
    const start = new Date(`${formData.startDate}T${formData.startHour}:${formData.startMin || '00'}:00`);
    const end = new Date(`${formData.endDate}T${formData.endHour}:${formData.endMin || '00'}:00`);
    if (isNaN(start.getTime()) || end <= start) return 0;
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
  };

  const handleWithdrawAction = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (response.ok) {
        setWithdrawTarget(null);
        onRefresh();
      } else {
        alert("抽單失敗，請確認後端 server.js 已更新 DELETE 路由");
      }
    } catch (err) { console.error(err); } finally { setWithdrawing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-left">
      {/* 抽單確認視窗 */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">確定要抽單嗎？</h3>
            <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">抽單後單據（<span className="font-mono font-bold text-indigo-600">{withdrawTarget.serialId}</span>）將會被移除且無法復原。</p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">取消</button>
              <button onClick={handleWithdrawAction} disabled={withdrawing} className="flex-1 py-3 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-lg flex items-center justify-center gap-2 transition-all">
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} 確認抽單
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 申請表單卡片 */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white relative">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Fingerprint className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{currentSerialId}</span>
          </div>
          <h1 className="text-2xl font-black">加班申請單</h1>
          <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
            <button onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">姓名</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">員編</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">類別</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">補償方式</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-[46px]">
                <button type="button" onClick={() => setFormData({...formData, compensationType: 'leave'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType === 'leave' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}>換補休</button>
                <button type="button" onClick={() => setFormData({...formData, compensationType: 'pay'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${formData.compensationType === 'pay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}>計薪</button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="space-y-2 lg:col-span-5">
              <label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 p-3 rounded-xl border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value, endDate: e.target.value})} />
                <select className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>
                  <option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-5">
              <label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
              <div className="flex gap-2">
                <input type="date" required className="flex-1 p-3 rounded-xl border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                <select className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>
                  <option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-indigo-600 rounded-2xl p-3 text-white flex flex-col justify-center items-center lg:col-span-2 min-h-[66px] shadow-lg shadow-indigo-100">
              <span className="text-[9px] font-black uppercase opacity-70">預計時數</span>
              <div className="flex items-baseline gap-1"><span className="text-xl font-black">{calculateTotalHours()}</span><span className="text-[9px] font-bold">HR</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">加班詳細事由</label>
            <textarea required rows="3" placeholder="請描述加班具體原因與工作內容..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white transition-all" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
          </div>

          <button disabled={submitting} className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} {submitting ? '提交中...' : '提交申請'}
          </button>
        </form>
      </div>

      {/* 最近 30 天單據清單 */}
      {recentSubmissions.length > 0 && (
        <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-8 overflow-hidden animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center gap-3 mb-6 text-indigo-600">
            <FileText size={24} />
            <h3 className="font-black text-lg">最近 30 天加班單據 ({recentSubmissions.length})</h3>
          </div>
          <div className="space-y-4">
            {recentSubmissions.map(record => (
              <div key={record.id} className="bg-white p-6 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">單號</p>
                        <p className="font-mono font-black text-indigo-600 text-sm">{record.serialId}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">姓名</p>
                        <p className="font-black text-slate-800 text-sm">{record.name}</p>
                    </div>
                    <div className="space-y-1 hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">提交時間</p>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><Calendar size={12}/>{new Date(record.createdAt).toLocaleString('zh-TW', { hour12: false })}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={record.status} />
                  {record.status === 'pending' && (
                    <button onClick={() => setWithdrawTarget(record)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"><Undo2 size={18} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Supervisor Approval ---
const ApprovalView = ({ records, onRefresh }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  // 【關鍵過濾】：只顯示待簽核 (pending) 的單據。一旦後端更新狀態，單據就會消失。
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
        onRefresh(); 
      }
    } catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
        <div className="bg-emerald-600 px-8 py-8 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black">主管簽核</h1><p className="text-sm opacity-80 italic">審核待處理之員工加班申請紀錄</p></div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">選擇</th>
                <th className="px-4 py-4">單號</th>
                <th className="px-4 py-4">申請人</th>
                <th className="px-4 py-4 min-w-[200px]">加班區間</th>
                <th className="px-4 py-4">時數</th>
                <th className="px-8 py-4 text-right">操作狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingRecords.length > 0 ? pendingRecords.map(record => (
                <tr key={record.id} onClick={() => setSelectedId(record.id)} className={`transition-all cursor-pointer ${selectedId === record.id ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-5"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2 h-2 rounded-full bg-white" />}</div></td>
                  <td className="px-4 py-5 font-mono text-indigo-600 font-bold">{record.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{record.name}</td>
                  <td className="px-4 py-5 text-xs font-bold text-slate-700">起：{record.startDate} {record.startHour}:{record.startMin}<br/>迄：{record.endDate} {record.endHour}:{record.endMin}</td>
                  <td className="px-4 py-5 text-center font-black">{record.totalHours} HR</td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={record.status} /></td>
                </tr>
              )) : (<tr><td colSpan="6" className="px-8 py-10 text-center text-slate-400 italic">目前無待簽核單據</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <div className="bg-white rounded-3xl shadow-xl border p-8 animate-in slide-in-from-bottom border-indigo-200">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 主管簽核意見</div>
              <textarea placeholder="請輸入核准或駁回之具體理由 (選填)..." className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-sm h-24 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
            </div>
            <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">目前選取：<span className="text-indigo-600 font-black">{selectedRecord?.serialId}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => updateStatus('rejected')} disabled={updating} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all active:scale-95"><XCircle size={24}/><span className="font-black text-xs">駁回申請</span></button>
                <button onClick={() => updateStatus('approved')} disabled={updating} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all active:scale-95">{updating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}<span className="font-black text-xs">核准加班</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      {/* 側邊導覽列 */}
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm shrink-0">
        <div className="flex items-center gap-4 mb-10 text-indigo-600">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100"><LayoutDashboard className="text-white" size={24} /></div>
            <h2 className="font-black text-xl tracking-tight">員工服務平台</h2>
        </div>
        <nav className="space-y-2 flex-grow text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">主要服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
        </nav>
        <div className="mt-auto p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">管理</div><div><p className="text-xs font-black">管理者介面</p><p className="text-[10px] text-slate-400">系統版本 v2.5</p></div></div>
        </div>
      </aside>

      {/* 主內容區塊 */}
      <main className="flex-grow p-10 overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} onRefresh={fetchData} employees={employees} records={records} />}
          {activeMenu === 'approval' && <ApprovalView records={records} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;