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

// --- Constants ---
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

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
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || labels.pending}
    </span>
  );
};

// --- View: Overtime Application ---
const OvertimeView = ({ currentSerialId, onRefresh, employees, lastSubmitted, setLastSubmitted }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const initialFormState = {
    name: '', empId: '',
    category: 'regular', compensationType: 'leave',
    startDate: '', startHour: '', startMin: '',  
    endDate: '', endHour: '', endMin: '',    
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleNameChange = (e) => {
    const value = e.target.value;
    const match = employees.find(emp => emp.name === value);
    setFormData(prev => ({
      ...prev,
      name: value,
      empId: match ? match.empId : prev.empId
    }));
  };

  const handleEmpIdChange = (e) => {
    const value = e.target.value;
    const match = employees.find(emp => emp.empId === value);
    setFormData(prev => ({
      ...prev,
      empId: value,
      name: match ? match.name : prev.name
    }));
  };

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
    
    const now = new Date();
    const submitTime = now.toLocaleString('zh-TW', { hour12: false });
    
    try {
      const response = await fetch(`${NGROK_URL}/api/records`, {
        method: 'POST',
        headers: fetchOptions.headers,
        body: JSON.stringify({ 
          ...formData, 
          serialId: currentSerialId, 
          formType: '加班', 
          appType, 
          totalHours, 
          status: 'pending', 
          createdAt: now.toISOString() 
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        setLastSubmitted({
          id: result.id, 
          serialId: currentSerialId,
          name: formData.name,
          changeTime: submitTime,
          status: 'pending'
        });
        
        setFormData(initialFormState);
        onRefresh();
      } else {
        setSubmitError(`提交失敗 (HTTP ${response.status})`);
      }
    } catch (err) { 
      setSubmitError("提交失敗，請檢查後端連線");
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleWithdrawAction = async () => {
    if (!lastSubmitted || !lastSubmitted.id) return;
    setWithdrawing(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/records/${lastSubmitted.id}`, {
        method: 'DELETE',
        headers: fetchOptions.headers
      });
      if (response.ok) {
        setLastSubmitted(null);
        setShowWithdrawModal(false);
        onRefresh();
      } else {
        alert("抽單失敗，請稍後再試");
      }
    } catch (err) {
      console.error(err);
      alert("連線錯誤");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">確定要抽單嗎？</h3>
            <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
              抽單後該筆申請單（<span className="font-mono font-bold text-indigo-600">{lastSubmitted?.serialId}</span>）將會被移除，且無法復原。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button 
                onClick={handleWithdrawAction}
                disabled={withdrawing}
                className="flex-1 py-3 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2"
              >
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />}
                確認抽單
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
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
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={handleNameChange} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">員編</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.empId} onChange={handleEmpIdChange} />
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
              <div className="flex items-baseline gap-1"><span className="text-xl font-black">{totalHours || "0"}</span>{totalHours !== "" && <span className="text-[9px] font-bold opacity-60">HR</span>}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">加班詳細事由</label>
            <textarea required rows="3" placeholder="請描述具體加班原因..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
          </div>

          <button disabled={totalHours === "" || totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${totalHours === "" || totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} {submitting ? '提交中...' : '提交申請'}</button>
        </form>
      </div>

      {lastSubmitted && (
        <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-8 animate-in slide-in-from-bottom duration-700 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <FileText size={24} />
              <h3 className="font-black text-lg">最近提交單據資訊</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">單號</p>
              <p className="font-mono font-black text-indigo-600">{lastSubmitted.serialId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">姓名</p>
              <p className="font-black text-slate-800">{lastSubmitted.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">異動時間</p>
              <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                <Clock size={14} className="text-slate-400" />
                {lastSubmitted.changeTime}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">狀態</p>
              <div className="flex items-center gap-4">
                <StatusBadge status={lastSubmitted.status} />
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-500 border border-rose-200 rounded-xl text-[10px] font-black hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm active:scale-95"
                >
                  <Undo2 size={12} />
                  抽單
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, onRefresh }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

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
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleExport = () => {
    if (!window.XLSX) return alert("系統元件載入中，請稍後再試");
    if (employees.length === 0) return alert("目前沒有資料可以匯出");
    const data = employees.map(emp => ({ "姓名": emp.name, "員編": emp.empId, "職稱": emp.jobTitle, "單位": emp.dept }));
    const worksheet = window.XLSX.utils.json_to_sheet(data);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "員工名單");
    window.XLSX.writeFile(workbook, `員工清單_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e) => {
    if (!window.XLSX) return alert("系統元件載入中，請稍後再試");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = window.XLSX.read(bstr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = window.XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) return alert("Excel 檔案中沒有找到資料");
      setLoading(true);
      try {
        for (const row of jsonData) {
          const name = row["姓名"] || row["name"];
          const empId = row["員編"] || row["employeeId"];
          if (name && empId) {
            await fetch(`${NGROK_URL}/api/employees`, { method: 'POST', headers: fetchOptions.headers, body: JSON.stringify({ name, empId, jobTitle: row["職稱"]||"", dept: row["單位"]||"" }) });
          }
        }
        onRefresh();
        alert("匯入成功！");
      } catch (err) { console.error(err); } finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = () => { setFormData({ name: '', empId: '', jobTitle: '', dept: '' }); setEditingId(null); };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500">
      <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
        <div><h1 className="text-2xl font-black">人員管理</h1><p className="text-sm opacity-80 italic">維護企業員工基本資料庫</p></div>
        <Users size={40} className="opacity-40" />
      </div>
      <div className="px-8 pt-6 flex gap-3">
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"><FileSpreadsheet size={14} /> 匯出 Excel 清單</button>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-100 transition-all border border-sky-100"><Upload size={14} /> 匯入 Excel 資料</button>
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
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
        <div className="flex gap-3">
          <button type="button" onClick={handleReset} className="px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200"><RotateCcw size={18} /> 重設填寫</button>
          <button disabled={loading} className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}>{loading ? <Loader2 className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}{editingId ? '確認更新資料' : '新增人員'}</button>
        </div>
      </form>
      <div className="overflow-x-auto border-t">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-4">員編</th><th className="px-4 py-4">姓名</th><th className="px-4 py-4">職稱</th><th className="px-4 py-4">單位</th><th className="px-8 py-4 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500">{emp.jobTitle}</td>
                <td className="px-4 py-5 text-slate-500">{emp.dept}</td>
                <td className="px-8 py-5 text-right flex justify-end gap-2"><button onClick={() => { setEditingId(emp.id); setFormData(emp); window.scrollTo({top:0,behavior:'smooth'}); }} className="p-2 text-slate-300 hover:text-sky-600 transition-colors"><Edit2 size={16}/></button><button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- View: Supervisor Approval ---
const ApprovalView = ({ records, onRefresh }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus) => {
    if (!selectedId) return;
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { method: 'PUT', headers: fetchOptions.headers, body: JSON.stringify({ status: newStatus, opinion: opinion }) });
      if (res.ok) { setSelectedId(null); setOpinion(''); onRefresh(); }
    } catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  const pendingRecords = useMemo(() => records.filter(r => r.status === 'pending'), [records]);
  const selectedRecord = useMemo(() => records.find(r => r.id === selectedId), [records, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
        <div className="bg-emerald-600 px-8 py-8 text-white flex justify-between items-center">
          <div><h1 className="text-2xl font-black">主管簽核</h1><p className="text-sm opacity-80 italic">審核員工加班申請紀錄</p></div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">待處理申請 (請點選單筆進行簽核)</span><span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-black">{pendingRecords.length}</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr><th className="px-8 py-4">選擇</th><th className="px-4 py-4">單號</th><th className="px-4 py-4">申請人/員編</th><th className="px-4 py-4">加班起迄時間</th><th className="px-4 py-4 text-center">時數</th><th className="px-4 py-4 min-w-[200px]">事由</th><th className="px-8 py-4 text-right">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.length > 0 ? records.map(record => (
                <tr key={record.id} onClick={() => record.status === 'pending' && setSelectedId(record.id)} className={`transition-all cursor-pointer ${record.status !== 'pending' ? 'opacity-50 cursor-not-allowed bg-slate-50/30' : selectedId === record.id ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-5"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2 h-2 rounded-full bg-white" />}</div></td>
                  <td className="px-4 py-5"><div className="font-mono font-bold text-indigo-600 text-xs mb-1">{record.serialId}</div><div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${record.appType === 'pre' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'}`}>{record.appType === 'pre' ? '事前' : '補報'}</div></td>
                  <td className="px-4 py-5"><div className="font-black text-slate-800 text-sm">{record.name}</div><div className="text-[10px] text-indigo-600 font-bold font-mono tracking-tight">{record.empId}</div></td>
                  <td className="px-4 py-5"><div className="text-xs font-bold text-slate-700 whitespace-nowrap">起：{record.startDate} {record.startHour}:{record.startMin}</div><div className="text-xs font-bold text-slate-700 whitespace-nowrap mt-1">迄：{record.endDate} {record.endHour}:{record.endMin}</div></td>
                  <td className="px-4 py-5 text-center"><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black border border-indigo-100 whitespace-nowrap">{record.totalHours} HR</span></td>
                  <td className="px-4 py-5"><p className="text-xs text-slate-500 line-clamp-3 leading-relaxed max-w-[200px] cursor-help" title={record.reason}>{record.reason}</p></td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={record.status} /></td>
                </tr>
              )) : (<tr><td colSpan="8" className="px-8 py-10 text-center text-slate-400 italic">目前尚無申請紀錄</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`bg-white rounded-3xl shadow-xl border p-8 transition-all duration-500 ${selectedId ? 'border-indigo-200 translate-y-0 opacity-100' : 'border-slate-100 translate-y-4 opacity-50 grayscale pointer-events-none'}`}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 主管簽核意見</div>
            <textarea placeholder={selectedId ? "請輸入核准或駁回之意見 (選填)..." : "請先從上方清單選擇申請單"} className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-24" value={opinion} onChange={(e) => setOpinion(e.target.value)} disabled={!selectedId} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">目前選取：<span className="text-indigo-600 font-black">{selectedRecord ? selectedRecord.serialId : '無'}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={!selectedId || updating} onClick={() => updateStatus('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group active:scale-95"><XCircle size={24} className="group-hover:scale-110 transition-transform"/><span className="font-black text-xs">駁回申請</span></button>
              <button disabled={!selectedId || updating} onClick={() => updateStatus('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group active:scale-95">{updating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />}<span className="font-black text-xs">核准加班</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const fetchData = async () => {
    try {
      const [resEmp, resRec] = await Promise.all([
        fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()),
        fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json())
      ]);
      setEmployees(Array.isArray(resEmp) ? resEmp : []);
      setRecords(Array.isArray(resRec) ? resRec : []);
      setLoading(false);
    } catch (err) { console.error("Fetch error:", err); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const otSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900">
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-4 mb-10"><div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100"><LayoutDashboard className="text-white" size={24} /></div><h2 className="font-black text-lg tracking-tight">員工服務平台</h2></div>
        <nav className="space-y-2 flex-grow text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
          <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
        </nav>
      </aside>
      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeMenu === 'overtime' && (
            <OvertimeView 
              currentSerialId={otSerialId} 
              onRefresh={fetchData} 
              employees={employees} 
              lastSubmitted={lastSubmitted}
              setLastSubmitted={setLastSubmitted}
            />
          )}
          {activeMenu === 'approval' && <ApprovalView records={records} onRefresh={fetchData} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} onRefresh={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;