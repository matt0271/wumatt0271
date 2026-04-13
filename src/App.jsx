import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Clock, User, ListChecks, Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, LayoutDashboard, Menu, X, ShieldCheck, Check, Search, 
  BarChart3, Users, UserPlus, Edit2, Plus, ArrowRight, AlertTriangle, RefreshCw,
  Info, Briefcase, Building2, CheckCircle2, XCircle, MessageSquare, Download, Upload, FileSpreadsheet, RotateCcw,
  FileText, Calendar, Undo2, Bell, CheckCircle, LogOut, Lock, UserCheck, Eye, EyeOff
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

// --- View: Login ---
const LoginView = ({ employees, onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const user = employees.find(
        emp => emp.name === identifier.trim() || emp.empId === identifier.trim()
      );

      if (user && user.empId === password.trim()) {
        onLogin(user);
      } else {
        setError('驗證失敗：憑證或密碼不正確。');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-inner relative z-10">
            <UserCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight relative z-10">身分驗證</h1>
          <p className="text-indigo-100 mt-2 opacity-80 text-sm relative z-10 font-bold">請輸入憑證與密碼進入平台</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={18} className="shrink-0" /> {error}
            </div>
          )}
          
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">員工姓名或編號</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 font-bold" 
                  placeholder="輸入姓名或員編"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">登入密碼 (預設員編)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 font-bold" 
                  placeholder="輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
            {loading ? '身分確認中...' : '登入平台'}
          </button>
        </form>
      </div>
    </div>
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
const OvertimeView = ({ currentSerialId, onRefresh, employees, records, setNotification, userSession }) => {
  const [appType, setAppType] = useState('pre'); 
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null); 
  
  const initialFormState = {
    name: userSession.name, 
    empId: userSession.empId,
    category: 'regular', 
    compensationType: 'leave',
    startDate: '', startHour: '', startMin: '00',  
    endDate: '', endHour: '', endMin: '00',    
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);

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

  const handleStartDateChange = (e) => {
    const newDate = e.target.value;
    setFormData(prev => ({ ...prev, startDate: newDate, endDate: newDate }));
  };

  const totalHours = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !formData.startHour || !formData.endHour) return "";
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
      if (response.ok) {
        setFormData({ ...initialFormState, startDate: '', endDate: '', reason: '' });
        setNotification({ type: 'success', text: '加班申請提交成功' });
        onRefresh();
      } else {
        setSubmitError(`提交失敗 (HTTP ${response.status})`);
      }
    } catch (err) { 
      setSubmitError("提交失敗，請檢查網路連線或伺服器"); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleWithdrawAction = async () => {
    if (!withdrawTarget || !withdrawTarget.id) return;
    setWithdrawing(true);
    try {
      const response = await fetch(`${NGROK_URL}/api/records/${withdrawTarget.id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (response.ok) {
        setWithdrawTarget(null);
        setNotification({ type: 'success', text: '單據已成功抽單移除' });
        onRefresh();
      } else {
        setNotification({ type: 'error', text: '抽單失敗' });
      }
    } catch (err) {
      setNotification({ type: 'error', text: '連線錯誤' });
    } finally { 
      setWithdrawing(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-left">
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 text-left text-slate-900">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">確定要抽單嗎？</h3>
            <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">單號：<span className="font-mono font-bold text-indigo-600">{withdrawTarget.serialId}</span></p>
            <div className="flex gap-3 text-left">
              <button onClick={() => setWithdrawTarget(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">取消</button>
              <button onClick={handleWithdrawAction} disabled={withdrawing} className="flex-1 py-3 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-lg flex items-center justify-center gap-2">
                {withdrawing ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} 確認
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left font-sans text-slate-900">
        <div className="bg-indigo-600 px-8 py-10 text-white relative">
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"><Fingerprint className="w-4 h-4" /><span className="text-xs font-mono font-bold">{currentSerialId}</span></div>
          <h1 className="text-2xl font-black">加班申請單</h1>
          <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
            <button type="button" onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
            <button type="button" onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {submitError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold"><AlertTriangle size={18} /> {submitError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">員編</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-sm opacity-60 font-mono font-bold" value={formData.empId} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名</label><input type="text" readOnly className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-sm opacity-60 font-bold" value={formData.name} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">加班類別</label><select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">補償方式</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center">
                <button type="button" onClick={() => setFormData({...formData, compensationType: 'leave'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType === 'leave' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>換補休</button>
                <button type="button" onClick={() => setFormData({...formData, compensationType: 'pay'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formData.compensationType === 'pay' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>計薪</button>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end font-sans">
            <div className="space-y-2 lg:col-span-5 text-left"><label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
              <div className="flex gap-2"><input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.startDate} onChange={handleStartDateChange} />
                <div className="flex gap-1 shrink-0">
                  <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold text-center bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold text-center bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="space-y-2 lg:col-span-5 text-left"><label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
              <div className="flex gap-2"><input type="date" required className="flex-1 min-w-0 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                <div className="flex gap-1 shrink-0">
                  <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold text-center bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}><option value="">時</option>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                  <select required className="p-3 w-[85px] rounded-xl border border-slate-200 text-sm font-bold text-center bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}><option value="">分</option>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 rounded-2xl p-3 text-white flex flex-col justify-center items-center shadow-lg lg:col-span-2 min-h-[66px]">
              <span className="text-[9px] font-black uppercase opacity-70">總時數</span>
              <div className="flex items-baseline gap-1"><span className="text-xl font-black">{totalHours || "0"}</span><span className="text-[9px] font-bold opacity-60">HR</span></div>
            </div>
          </div>
          <div className="space-y-2 text-left text-slate-900"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">加班詳細事由</label><textarea required rows="3" placeholder="請描述具體加班原因與工作進度..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
          <button disabled={totalHours === "" || totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${totalHours === "" || totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />} {submitting ? '提交中...' : '提交申請'}
          </button>
        </form>
      </div>

      {recentSubmissions.length > 0 && (
        <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl p-8 animate-in slide-in-from-bottom duration-700 overflow-hidden text-left">
          <div className="flex items-center gap-3 mb-8 text-indigo-600 border-b border-indigo-100 pb-4"><FileText size={24} /><h3 className="font-black text-lg">最近 30 天提交的單據 ({recentSubmissions.length})</h3></div>
          <div className="space-y-6">
            {recentSubmissions.map((record, index) => (
              <div key={record.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-indigo-100/30 last:border-0 last:pb-0 relative group text-left">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">單號</p><p className="font-mono font-black text-indigo-600 text-sm">{record.serialId}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名</p><p className="font-black text-slate-800 text-sm">{record.name}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">提交日期/時間</p><div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Calendar size={14} className="text-slate-400" />{new Date(record.createdAt).toLocaleString('zh-TW', { hour12: false })}</div></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">狀態</p>
                  <div className="flex items-center gap-4"><StatusBadge status={record.status} />
                    {record.status === 'pending' && <button onClick={() => setWithdrawTarget(record)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-500 border border-rose-200 rounded-xl text-[10px] font-black hover:bg-rose-50 shadow-sm transition-all"><Undo2 size={12} />抽單</button>}
                  </div>
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
const ApprovalView = ({ records, onRefresh, setNotification }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus) => {
    if (!selectedId) return;
    if (newStatus === 'rejected' && (!opinion || !opinion.trim())) {
      setNotification({ type: 'error', text: '駁回失敗：請務必填寫駁回理由。' });
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`${NGROK_URL}/api/records/${selectedId}/status`, { 
        method: 'PUT', 
        headers: fetchOptions.headers, 
        body: JSON.stringify({ status: newStatus, opinion: opinion }) 
      });
      if (res.ok) { 
        setNotification({ type: 'success', text: `單據已${newStatus === 'approved' ? '核准' : '駁回'}` });
        setSelectedId(null); setOpinion(''); onRefresh(); 
      }
    } catch (err) { setNotification({ type: 'error', text: '連線異常' }); } finally { setUpdating(false); }
  };

  const pendingRecords = useMemo(() => records.filter(r => r.status === 'pending'), [records]);
  const recentProcessed = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return records.filter(r => r.status !== 'pending' && new Date(r.createdAt) >= thirtyDaysAgo).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  const selectedRecord = useMemo(() => pendingRecords.find(r => r.id === selectedId), [pendingRecords, selectedId]);

  return (
    <div className="space-y-6 pb-20 text-left font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500">
        <div className="bg-emerald-600 px-8 py-8 text-white flex justify-between items-center text-left">
          <div><h1 className="text-2xl font-black">主管簽核</h1><p className="text-sm opacity-80 italic font-bold">審核待處理之員工加班申請紀錄</p></div>
          <ShieldCheck size={40} className="opacity-40" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b">
              <tr><th className="px-8 py-4">選擇</th><th className="px-4 py-4">單號</th><th className="px-4 py-4">申請人</th><th className="px-4 py-4">加班時間</th><th className="px-4 py-4 text-center">時數</th><th className="px-4 py-4 min-w-[200px]">事由</th><th className="px-8 py-4 text-right">狀態</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pendingRecords.length > 0 ? pendingRecords.map(record => (
                <tr key={record.id} onClick={() => setSelectedId(record.id)} className={`transition-all cursor-pointer ${selectedId === record.id ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-5"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2 h-2 rounded-full bg-white" />}</div></td>
                  <td className="px-4 py-5 font-mono text-indigo-600 font-bold">{record.serialId}</td>
                  <td className="px-4 py-5 font-black text-slate-800">{record.name}<div className="text-[10px] text-indigo-600 font-bold tracking-tight">{record.empId}</div></td>
                  <td className="px-4 py-5 text-xs font-bold text-slate-700 whitespace-nowrap">起：{record.startDate}<br/>迄：{record.endDate}</td>
                  <td className="px-4 py-5 text-center font-black">{record.totalHours} HR</td>
                  <td className="px-4 py-5 text-slate-900"><p className="text-xs line-clamp-2 leading-relaxed font-bold" title={record.reason}>{record.reason}</p></td>
                  <td className="px-8 py-5 text-right"><StatusBadge status={record.status} /></td>
                </tr>
              )) : (<tr><td colSpan="7" className="px-8 py-10 text-center text-slate-400 italic font-bold uppercase tracking-widest">目前無待處理申請</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`bg-white rounded-3xl shadow-xl border p-8 transition-all duration-500 ${selectedId ? 'border-indigo-200 opacity-100' : 'border-slate-100 opacity-50 grayscale pointer-events-none translate-y-4'}`}>
        <div className="flex flex-col md:flex-row gap-8 text-left">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm"><MessageSquare size={18} /> 簽核意見 <span className="text-rose-500 font-bold text-[10px] ml-1 uppercase tracking-widest">* 駁回為必填</span></div>
            <textarea placeholder="請輸入簽核或駁回理由..." className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-sm h-24 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={opinion} onChange={(e) => setOpinion(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end gap-3 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-left">目前選取：<span className="text-indigo-600">{selectedRecord?.serialId || '未選取'}</span></p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <button disabled={!selectedId || updating} onClick={() => updateStatus('rejected')} className="flex flex-col items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group font-black active:scale-95"><XCircle size={24}/><span className="text-[11px] uppercase tracking-widest">駁回申請</span></button>
              <button disabled={!selectedId || updating} onClick={() => updateStatus('approved')} className="flex flex-col items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group font-black active:scale-95">{updating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}<span className="text-[11px] uppercase tracking-widest">核准加班</span></button>
            </div>
          </div>
        </div>
      </div>

      {recentProcessed.length > 0 && (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 overflow-hidden text-left">
          <div className="flex items-center gap-3 mb-8 text-slate-600 border-b border-slate-200 pb-4"><History size={24} /><h3 className="font-black text-lg text-left">最近 30 天已處理單據 ({recentProcessed.length})</h3></div>
          <div className="space-y-6">
            {recentProcessed.map((record, index) => (
              <div key={record.id || index} className="grid grid-cols-1 md:grid-cols-5 gap-6 pb-6 border-b border-slate-200 last:border-0 relative group text-left">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">單號</p><p className="font-mono font-black text-slate-600 text-sm">{record.serialId}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請人</p><p className="font-black text-slate-800 text-sm">{record.name}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">加班事由</p><p className="text-xs text-slate-500 line-clamp-1 font-bold">{record.reason}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請日期</p><div className="flex items-center gap-2 text-slate-600 text-sm font-black"><Calendar size={14} />{new Date(record.createdAt).toLocaleDateString('zh-TW')}</div></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">結果</p><StatusBadge status={record.status} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Personnel Management ---
const PersonnelManagement = ({ employees, onRefresh, setNotification }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `${NGROK_URL}/api/employees/${editingId}` : `${NGROK_URL}/api/employees`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: fetchOptions.headers, body: JSON.stringify(formData) });
      if (res.ok) {
        setNotification({ type: 'success', text: `資料已${editingId ? '更新' : '新增'}` });
        setFormData({ name: '', empId: '', jobTitle: '', dept: '' });
        setEditingId(null); onRefresh();
      }
    } catch (err) { setNotification({ type: 'error', text: '操作失敗' }); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try {
      const res = await fetch(`${NGROK_URL}/api/employees/${id}`, { method: 'DELETE', headers: fetchOptions.headers });
      if (res.ok) { setNotification({ type: 'success', text: '人員已移除' }); onRefresh(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left animate-in fade-in duration-500 font-sans text-slate-900">
      <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center">
        <div><h1 className="text-2xl font-black">人員管理</h1><p className="text-sm opacity-80 italic font-bold">維護企業員工基本資料庫</p></div><Users size={40} className="opacity-40" />
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left text-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">員編</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-mono font-bold" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">姓名</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">職稱</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">單位</label><input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})} /></div>
        </div>
        <div className="flex gap-3 text-left">
          <button type="button" onClick={() => { setFormData({name:'',empId:'',jobTitle:'',dept:''}); setEditingId(null); }} className="px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 border flex items-center justify-center gap-2 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs active:scale-95"><RotateCcw size={18} /> 重設</button>
          <button disabled={loading} className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs active:scale-95 ${editingId ? 'bg-orange-500 shadow-orange-100' : 'bg-sky-600 shadow-sky-100'}`}>{loading ? <Loader2 size={18} className="animate-spin" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />} {editingId ? '確認更新' : '新增人員'}</button>
        </div>
      </form>
      <div className="overflow-x-auto border-t text-left">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b">
            <tr><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left">職稱</th><th className="px-4 py-4 text-left">單位</th><th className="px-8 py-4 text-right">操作</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-all text-left">
                <td className="px-8 py-5 font-mono font-bold text-sky-600">{emp.empId}</td>
                <td className="px-4 py-5 font-black text-slate-800">{emp.name}</td>
                <td className="px-4 py-5 text-slate-500 font-bold">{emp.jobTitle}</td>
                <td className="px-4 py-5 text-slate-500 font-bold">{emp.dept}</td>
                <td className="px-8 py-5 text-right flex justify-end gap-2 text-slate-900"><button onClick={() => { setEditingId(emp.id); setFormData(emp); window.scrollTo({top:0,behavior:'smooth'}); }} className="p-2 text-slate-300 hover:text-sky-600 transition-colors"><Edit2 size={16}/></button><button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const [notification, setNotification] = useState(null);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      const [resEmp, resRec] = await Promise.all([
        fetch(`${NGROK_URL}/api/employees`, fetchOptions).then(r => r.json()),
        fetch(`${NGROK_URL}/api/records`, fetchOptions).then(r => r.json())
      ]);
      setEmployees(Array.isArray(resEmp) ? resEmp : []);
      setRecords(Array.isArray(resRec) ? resRec : []);
      setLoading(false);
    } catch (err) { 
      console.error("Fetch error:", err); 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const otSerialId = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;

  if (!userSession) {
    return <LoginView employees={employees} onLogin={(user) => {
      setUserSession(user);
      setNotification({ type: 'success', text: `歡迎回來，${user.name}` });
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-left font-sans text-slate-900 overflow-hidden">
      {notification && (
        <div className={`fixed top-10 right-10 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 border ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold text-sm">{notification.text}</span>
        </div>
      )}

      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-0 h-screen shadow-sm text-left shrink-0">
        <div className="flex items-center gap-4 mb-10 text-indigo-600 text-left">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100"><LayoutDashboard className="text-white" size={24} /></div>
            <h2 className="font-black text-xl tracking-tight">員工服務平台</h2>
        </div>
        
        <nav className="space-y-2 flex-grow text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">服務項目</p>
          <button onClick={() => setActiveMenu('overtime')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'overtime' ? 'bg-indigo-50 text-indigo-600 border-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Clock size={20} /> 加班申請</button>
          <button onClick={() => setActiveMenu('approval')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'approval' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><ShieldCheck size={20} /> 主管簽核</button>
          <button onClick={() => setActiveMenu('personnel')} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === 'personnel' ? 'bg-sky-50 text-sky-600 border-sky-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}><Users size={20} /> 人員管理</button>
        </nav>

        <div className="mt-auto space-y-4 text-left">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3">
            {/* 改動點：藍色框框內改為顯示部門 */}
            <div className="px-2 min-w-[40px] h-10 bg-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-inner text-[10px] whitespace-nowrap overflow-hidden">
              {userSession.dept || '部門'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black truncate">{userSession.name}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{userSession.empId}</p>
            </div>
          </div>
          <button 
            onClick={() => setUserSession(null)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 uppercase tracking-widest text-xs active:scale-95"
          >
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>

      <main className="flex-grow p-10 overflow-y-auto bg-slate-50 text-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeMenu === 'overtime' && (
            <OvertimeView 
              currentSerialId={otSerialId} 
              onRefresh={fetchData} 
              employees={employees} 
              records={records} 
              setNotification={setNotification} 
              userSession={userSession}
            />
          )}
          {activeMenu === 'approval' && <ApprovalView records={records} onRefresh={fetchData} setNotification={setNotification} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} onRefresh={fetchData} setNotification={setNotification} />}
        </div>
      </main>
    </div>
  );
};

export default App;