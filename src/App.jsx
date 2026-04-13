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

// --- 常數定義 ---
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30']; 

const DEPARTMENTS = [
  '工程組', '系統組', '財務行政部', '產品組', '客服組', 
  '北區營業組', '中區營業組', '南區營業組', '總經理室'
];

const LEAVE_TYPES = [
  { id: 'annual', label: '特休假' }, { id: 'compensatory', label: '補休' },
  { id: 'personal', label: '事假' }, { id: 'sick', label: '病假' },
  { id: 'hospitalized', label: '病假(連續住院)' }, { id: 'marriage', label: '婚假' },
  { id: 'official', label: '公假' }, { id: 'maternity', label: '產假' },
  { id: 'paternity', label: '陪產假' }, { id: 'prenatal', label: '產檢假' },
  { id: 'bereavement', label: '喪假' }, { id: 'benefit', label: '福利假' },
  { id: 'family_care', label: '家庭照顧假' }, { id: 'parental_leave', label: '育嬰留停' },
];

const OT_CATEGORIES = [
  { id: 'regular', label: '一般上班日' },
  { id: 'holiday', label: '國定假日' },
  { id: 'rest', label: '休息日' },
  { id: 'business', label: '出差加班' },
];

// --- 狀態標籤組件 ---
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

// --- 加班申請視圖 ---
const OvertimeView = ({ currentSerialId, today, refreshData, apiBaseUrl }) => {
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
      const response = await fetch(`${apiBaseUrl}/records.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serialId: currentSerialId,
          formType: '加班',
          appType,
          totalHours,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      });
      if (response.ok) {
        setFormData(prev => ({ ...prev, reason: '' }));
        alert('加班申請已提交');
        refreshData();
      } else { throw new Error('API Error'); }
    } catch (err) {
      alert('提交失敗：無法連線至 API。請點擊側邊欄 API 設定檢查網址。');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 text-left">
      <div className="bg-indigo-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black text-left">加班申請單 <span className="text-sm font-normal opacity-70 ml-2">({appType === 'pre' ? '事前' : '事後'})</span></h1>
        <div className="mt-6 flex bg-indigo-700/50 p-1 rounded-xl w-fit">
          <button onClick={() => setAppType('pre')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事前申請</button>
          <button onClick={() => setAppType('post')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow' : 'text-white/70 hover:text-white'}`}>事後補報</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {['name', 'empId', 'jobTitle', 'dept'].map((f) => (
            <div key={f} className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
                value={formData[f]} 
                onChange={e => setFormData({...formData, [f]: e.target.value})} 
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">加班類別</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {OT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">補償方式</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm font-bold" value={formData.compensationType} onChange={e => setFormData({...formData, compensationType: e.target.value})}>
              <option value="leave">換取補休</option>
              <option value="pay">申領加班費</option>
            </select>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Plus size={14}/> 開始時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-rose-600 flex items-center gap-2"><ArrowRight size={14}/> 結束時間</label>
            <div className="flex gap-2">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg">
            <span className="text-[10px] font-bold uppercase">總時數</span>
            <span className="text-2xl font-black text-white">{totalHours} <span className="text-xs">HR</span></span>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">加班詳細事由</label>
          <textarea required rows="3" placeholder="請描述加班期間預計完成之工作內容..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm focus:bg-white" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
        </div>

        <button disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${totalHours <= 0 || submitting ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          {submitting ? '提交中...' : '提交申請'}
        </button>
      </form>
    </div>
  );
};

// --- 請假申請視圖 ---
const LeaveView = ({ currentSerialId, today, refreshData, apiBaseUrl }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', empId: '', jobTitle: '', dept: '',
    type: 'annual', proxy: '',
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
        body: JSON.stringify({ ...formData, serialId: currentSerialId, formType: '請假', totalHours, status: 'pending', createdAt: new Date().toISOString() })
      });
      if (response.ok) {
        setFormData(prev => ({ ...prev, reason: '', proxy: '' }));
        alert('請假申請已提交');
        refreshData();
      }
    } catch (err) { alert('連線失敗'); } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 text-left">
      <div className="bg-teal-600 px-8 py-10 text-white relative">
        <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white">
          <Fingerprint className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{currentSerialId}</span>
        </div>
        <h1 className="text-2xl font-black text-left">請假申請單</h1>
        <p className="text-sm opacity-80 mt-1 italic text-left">請詳細填寫請假類別與職務代理人</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          {['name', 'empId', 'jobTitle', 'dept'].map((f) => (
            <div key={f} className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
              <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">假別</label>
            <select className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">職務代理人</label>
            <input type="text" required placeholder="請輸入代理人姓名" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData.proxy} onChange={e => setFormData({...formData, proxy: e.target.value})} />
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end text-left">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-emerald-600">開始日期</label>
            <div className="flex gap-1">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.startMin} onChange={e => setFormData({...formData, startMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-rose-600">結束日期</label>
            <div className="flex gap-1">
              <input type="date" className="flex-grow p-2 rounded-lg border border-slate-200 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              <div className="flex gap-1">
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endHour} onChange={e => setFormData({...formData, endHour: e.target.value})}>{HOURS.map(h => <option key={h} value={h}>{h}:</option>)}</select>
                <select className="p-2 rounded-lg border border-slate-200 text-sm" value={formData.endMin} onChange={e => setFormData({...formData, endMin: e.target.value})}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="bg-teal-600 rounded-xl p-4 text-white flex justify-between items-center shadow-lg">
            <span className="text-[10px] font-bold uppercase text-white">時數計算</span>
            <span className="text-2xl font-black text-white">{totalHours} <span className="text-xs">HR</span></span>
          </div>
        </div>
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">請假理由</label>
          <textarea required rows="3" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
        </div>
        <button disabled={totalHours <= 0 || submitting} className="w-full py-4 rounded-2xl font-black text-white bg-teal-600 hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:bg-slate-300">
          {submitting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
          提交請假申請
        </button>
      </form>
    </div>
  );
};

// --- 主管簽核中心 ---
const ApprovalCenter = ({ records, refreshData, apiBaseUrl }) => {
  const [activeTab, setActiveTab] = useState('加班');
  const [selectedId, setSelectedId] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [processing, setProcessing] = useState(false);

  const pendingItems = records.filter(r => r.formType === activeTab && r.status === 'pending');
  const selectedItem = records.find(r => r.id === selectedId);

  const handleAction = async (status) => {
    if (!selectedId || processing) return;
    if (status === 'rejected' && !opinion.trim()) { alert('請填寫駁回理由'); return; }
    setProcessing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/records.php?id=${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment: opinion })
      });
      if (response.ok) { setSelectedId(null); setOpinion(''); refreshData(); }
    } catch (err) { alert('更新失敗'); } finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-rose-600 px-8 py-8 text-white flex justify-between items-center text-left">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-left text-white">主管簽核中心</h1><p className="text-sm opacity-80 italic text-left text-white">處理待簽核之申請案件</p></div>
          <ShieldCheck size={40} className="opacity-40 text-white" />
        </div>
        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-8 text-left">
            <button onClick={() => setActiveTab('加班')} className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === '加班' ? 'bg-white text-rose-600 shadow' : 'text-slate-500'}`}>加班案件 ({records.filter(r=>r.formType==='加班' && r.status==='pending').length})</button>
            <button onClick={() => setActiveTab('請假')} className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === '請假' ? 'bg-white text-rose-600 shadow' : 'text-slate-500'}`}>請假案件 ({records.filter(r=>r.formType==='請假' && r.status==='pending').length})</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left text-left">
            <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-8 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">待處理清單 <ListChecks size={14}/></h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {pendingItems.length > 0 ? pendingItems.map(item => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === item.id ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-100 hover:bg-slate-50 bg-white'}`}>
                    <div className="flex justify-between items-start mb-2"><span className="text-xs font-mono font-black text-rose-600">{item.serialId}</span><span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{item.totalHours} HR</span></div>
                    <div className="font-black text-slate-800 text-left">{item.name}</div>
                    <div className="text-xs text-slate-400 text-left">{item.jobTitle} / {item.dept}</div>
                  </button>
                )) : <div className="py-20 text-center text-slate-300 font-bold italic opacity-50 text-center">尚無待處理案件</div>}
              </div>
            </div>
            <div className={`space-y-6 transition-opacity duration-300 text-left ${!selectedId ? 'opacity-20 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">案件詳情與處理 <Edit2 size={14}/></h3>
              {selectedItem && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300 text-left">
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-4 text-sm text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="text-left text-left"><div className="text-[10px] font-bold text-slate-400 text-left">申請人</div><div className="font-bold text-left">{selectedItem.name} ({selectedItem.empId})</div></div>
                      <div className="text-left text-left"><div className="text-[10px] font-bold text-slate-400 text-left">申請時間</div><div className="font-bold text-left">{new Date(selectedItem.createdAt).toLocaleDateString()}</div></div>
                    </div>
                    <div className="text-left text-left"><div className="text-[10px] font-bold text-slate-400 text-left">事由內容</div><div className="font-medium text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 mt-1 text-left">{selectedItem.reason}</div></div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase text-left">審核意見 / 駁回理由</label>
                    <textarea rows="3" className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-rose-50 text-sm text-left" placeholder="請輸入意見..." value={opinion} onChange={e => setOpinion(e.target.value)} />
                  </div>
                  <div className="flex gap-4 text-left"><button onClick={() => handleAction('approved')} disabled={processing} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-white">{processing ? <Loader2 className="animate-spin text-white" /> : <Check size={20} className="text-white" />} <span className="text-white">核准</span></button><button onClick={() => handleAction('rejected')} disabled={processing} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-white">{processing ? <Loader2 className="animate-spin text-white" /> : <X size={20} className="text-white" />} <span className="text-white">駁回</span></button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 人員管理視圖 ---
const PersonnelManagement = ({ employees, refreshData, apiBaseUrl }) => {
  const [formData, setFormData] = useState({ name: '', empId: '', jobTitle: '', dept: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `${apiBaseUrl}/employees.php?id=${editingId}` : `${apiBaseUrl}/employees.php`;
      const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { setFormData({ name: '', empId: '', jobTitle: '', dept: '' }); setEditingId(null); refreshData(); }
    } catch (err) { alert('操作失敗'); } finally { setLoading(false); }
  };

  const deleteEmp = async (id) => {
    if (!window.confirm("確認刪除此員工？")) return;
    try { await fetch(`${apiBaseUrl}/employees.php?id=${id}`, { method: 'DELETE' }); refreshData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-sky-600 px-8 py-8 text-white flex justify-between items-center text-left">
          <div className="text-left text-white"><h1 className="text-2xl font-black text-left text-white">人員管理中心</h1><p className="text-sm opacity-80 italic text-left text-white">維護企業員工基本資料庫 (XAMPP)</p></div>
          <Users size={40} className="opacity-40 text-white" />
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            {['name', 'empId', 'jobTitle', 'dept'].map(f => (
              <div key={f} className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">{f==='name'?'姓名':f==='empId'?'員編':f==='jobTitle'?'職稱':'單位'}</label>
                <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm text-left" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 text-left"><button disabled={loading} className={`flex-grow py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-orange-500' : 'bg-sky-600'}`}>{loading ? <Loader2 className="animate-spin text-white" /> : editingId ? <Edit2 size={18}/> : <UserPlus size={18} />}{editingId ? '更新資料' : '新增人員'}</button>{editingId && <button onClick={() => { setEditingId(null); setFormData({name:'',empId:'',jobTitle:'',dept:''}); }} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">取消</button>}</div>
        </form>
        <div className="overflow-x-auto border-t border-slate-100 text-left">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left"><th className="px-8 py-4 text-left">員編</th><th className="px-4 py-4 text-left">姓名</th><th className="px-4 py-4 text-left">職稱</th><th className="px-4 py-4 text-left">單位</th><th className="px-8 py-4 text-right text-left">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-all text-left">
                  <td className="px-8 py-5 font-mono font-bold text-sky-600 text-left">{emp.empId}</td>
                  <td className="px-4 py-5 font-black text-slate-800 text-left">{emp.name}</td>
                  <td className="px-4 py-5 text-slate-500 text-left">{emp.jobTitle}</td>
                  <td className="px-4 py-5 text-slate-500 text-left">{emp.dept}</td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2 text-left"><button onClick={() => { setEditingId(emp.id); setFormData(emp); }} className="p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-lg"><Edit2 size={16}/></button><button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button></td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td colSpan="5" className="py-10 text-center text-slate-300 italic text-center">目前無人員數據</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 表單綜合查詢 ---
const FormQueryView = ({ records }) => {
  const [search, setSearch] = useState('');
  const filtered = records.filter(r => r.serialId?.toLowerCase().includes(search.toLowerCase()) || r.name?.includes(search) || r.empId?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-500 text-left">
      <div className="bg-amber-600 px-8 py-8 text-white flex justify-between items-center text-left">
        <div className="text-left text-white"><h1 className="text-2xl font-black text-left text-white">表單綜合查詢</h1><p className="text-sm opacity-80 italic text-left text-white">檢索與追蹤所有歷史申請案件</p></div>
        <Search size={40} className="opacity-40 text-white" />
      </div>
      <div className="p-6">
        <div className="relative mb-6 text-left text-left text-left text-left"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="搜尋單號、姓名、員工編號..." className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold text-sm transition-all text-left" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 text-left">
          <table className="w-full text-left border-collapse text-left text-left">
            <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left"><th className="px-6 py-4 text-left">單號/類別</th><th className="px-4 py-4 text-left">申請人</th><th className="px-4 py-4 text-left">事由</th><th className="px-4 py-4 text-center text-left">時數</th><th className="px-6 py-4 text-right text-left">狀態</th></tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-all text-left"><td className="px-6 py-5 text-left text-left"><div className="font-mono font-black text-slate-700 text-left">{r.serialId}</div><div className={`text-[10px] font-black uppercase inline-block px-2 py-0.5 rounded mt-1 ${r.formType === '加班' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>{r.formType}</div></td><td className="px-4 py-5 text-left text-left"><div className="font-bold text-slate-800 text-left">{r.name}</div><div className="text-[10px] text-slate-400 uppercase text-left">{r.jobTitle} / {r.dept}</div></td><td className="px-4 py-5 max-w-[200px] truncate italic text-slate-500 text-left">"{r.reason}"</td><td className="px-4 py-5 text-center font-black text-slate-700 text-left">{r.totalHours} HR</td><td className="px-6 py-5 text-right text-left"><StatusBadge status={r.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
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
  
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem('app_api_url') || 'http://localhost/api');
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const [resRecords, resEmployees] = await Promise.all([fetch(`${apiBaseUrl}/records.php`, { signal: controller.signal }), fetch(`${apiBaseUrl}/employees.php`, { signal: controller.signal })]);
      clearTimeout(timeoutId);
      if (resRecords.ok && resEmployees.ok) {
        const dRecords = await resRecords.json();
        const dEmployees = await resEmployees.json();
        setRecords(dRecords.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setEmployees(dEmployees);
        setApiError(null);
      } else { throw new Error('Connect Error'); }
    } catch (err) {
      console.error("Fetch failed", err);
      setApiError("無法連接至 API 伺服器。如果是 HTTPS 環境，請設定 ngrok 的 https 網址。");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(() => fetchData(false), 30000); return () => clearInterval(interval); }, [apiBaseUrl]);

  const saveSettings = () => {
    const formattedUrl = tempApiUrl.replace(/\/+$/, "");
    localStorage.setItem('app_api_url', formattedUrl);
    setApiBaseUrl(formattedUrl);
    setIsSettingsOpen(false);
    fetchData();
  };

  const otSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '加班' && r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-OT${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const leaveSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.formType === '請假' && r.serialId?.startsWith(dateStr)).length;
    return `${dateStr}-LV${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const navItems = [
    { id: 'overtime', label: '加班申請', icon: Clock, color: 'text-indigo-600', activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-600' },
    { id: 'leave', label: '請假申請', icon: CalendarDays, color: 'text-teal-600', activeBg: 'bg-teal-50', activeBorder: 'border-teal-600' },
    { id: 'approval', label: '主管簽核', icon: ShieldCheck, color: 'text-rose-600', activeBg: 'bg-rose-50', activeBorder: 'border-rose-600', badge: records.filter(r=>r.status==='pending').length },
    { id: 'query', label: '綜合查詢', icon: BarChart3, color: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-600' },
    { id: 'personnel', label: '人員管理', icon: Users, color: 'text-sky-600', activeBg: 'bg-sky-50', activeBorder: 'border-sky-600' },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4 text-left">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin text-left text-left" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs text-left">正在載入系統服務...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 text-left text-left text-left text-left text-left">
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6 text-left">
        <div className="flex items-center gap-2"><LayoutDashboard className="text-indigo-600" /><span className="font-black">員工服務平台</span></div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-slate-100 text-slate-600 text-left">{sidebarOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-[60] transform transition-transform duration-300 shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 h-full flex flex-col text-left">
          <div className="hidden lg:flex items-center gap-4 mb-10 text-left text-left text-left text-left"><div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-left"><LayoutDashboard className="text-white text-left" size={24} /></div><div className="text-left text-left text-left text-left"><h2 className="font-black text-lg tracking-tight text-left text-left text-left text-left">員工服務平台</h2><div className={`flex items-center gap-1 text-[10px] font-black uppercase text-left text-left text-left text-left ${apiError ? 'text-rose-500' : 'text-emerald-500'}`}><div className={`w-1.5 h-1.5 rounded-full animate-pulse ${apiError ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>{apiError ? '連線異常' : '連線正常'}</div></div></div>
          <nav className="flex-grow space-y-2 text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-4 text-left">主選單</p>{navItems.map(item => (<button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); fetchData(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all border-l-4 ${activeMenu === item.id ? `${item.activeBg} ${item.color} ${item.activeBorder}` : 'text-slate-400 hover:bg-slate-50 border-transparent'} text-left`}>{item.icon && <item.icon size={20} />}<span className="flex-grow text-left">{item.label}</span>{item.badge > 0 && <span className="w-6 h-6 flex items-center justify-center bg-rose-500 text-white text-[10px] rounded-full shadow-lg shadow-rose-100 animate-bounce text-left text-left text-left text-left">{item.badge}</span>}</button>))}</nav>
          <div className="mt-auto p-6 bg-slate-50 rounded-2xl text-left"><button onClick={() => { setTempApiUrl(apiBaseUrl); setIsSettingsOpen(true); }} className="flex items-center gap-3 w-full group text-left"><div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors text-left text-left text-left text-left text-left text-left"><Settings size={20} /></div><div className="truncate text-left text-left text-left text-left text-left text-left"><p className="text-xs font-black text-slate-800 text-left text-left text-left text-left">API 網址設定</p><p className="text-[10px] text-slate-400 font-mono truncate text-left text-left text-left text-left">{apiBaseUrl}</p></div></button></div>
        </div>
      </aside>
      <main className="flex-grow pt-24 lg:pt-10 p-4 md:p-10 overflow-y-auto text-left text-left text-left text-left text-left">
        <div className="max-w-5xl mx-auto space-y-12 text-left text-left text-left text-left text-left text-left">
          {apiError && <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-4 text-rose-800 text-sm font-bold animate-in slide-in-from-top duration-500 text-left text-left text-left text-left text-left text-left text-left"><AlertTriangle className="shrink-0 text-left text-left text-left text-left text-left text-left text-left" /><div className="text-left text-left text-left text-left text-left text-left text-left text-left"><p className="text-left text-left text-left text-left text-left text-left text-left text-left">連線異常</p><p className="text-xs font-normal mt-1 opacity-70 text-left text-left text-left text-left text-left text-left text-left text-left">瀏覽器阻擋了非加密請求。請點擊側邊欄下方的「API 網址設定」，填入您的 <b>ngrok</b> 網址 (https://...)。</p></div></div>}
          {activeMenu === 'overtime' && <OvertimeView currentSerialId={otSerialId} today={today} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'leave' && <LeaveView currentSerialId={leaveSerialId} today={today} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'approval' && <ApprovalCenter records={records} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {activeMenu === 'query' && <FormQueryView records={records} />}
          {activeMenu === 'personnel' && <PersonnelManagement employees={employees} refreshData={fetchData} apiBaseUrl={apiBaseUrl} />}
          {(activeMenu === 'overtime' || activeMenu === 'leave') && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 text-left text-left text-left text-left text-left text-left">
              <div className="flex items-center justify-between mb-8 text-left text-left text-left text-left text-left text-left text-left text-left"><h3 className="text-xl font-black flex items-center gap-3 text-left text-left text-left text-left text-left text-left text-left text-left"><History className="text-slate-400 text-left text-left text-left text-left text-left text-left text-left text-left" /> 近期申請紀錄</h3><button onClick={() => setActiveMenu('query')} className="text-xs font-bold text-indigo-600 hover:underline text-left text-left text-left text-left text-left text-left text-left text-left">查看全部</button></div>
              <div className="overflow-x-auto text-left text-left text-left text-left text-left text-left text-left text-left">
                <table className="w-full text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-left text-left text-left text-left text-left text-left text-left text-left"><tr><th className="py-4 text-left text-left text-left text-left text-left text-left text-left text-left">單號</th><th className="py-4 text-left text-left text-left text-left text-left text-left text-left text-left">姓名</th><th className="py-4 text-center text-left text-left text-left text-left text-left text-left text-left text-left">時數</th><th className="py-4 text-right text-left text-left text-left text-left text-left text-left text-left text-left">處理狀態</th></tr></thead><tbody className="divide-y divide-slate-50 text-left">
                  {records.filter(r => (activeMenu === 'overtime' ? r.formType === '加班' : r.formType === '請假')).slice(0, 5).map(r => (
                    <tr key={r.id} className="text-sm font-medium text-left text-left text-left text-left text-left text-left text-left text-left"><td className="py-5 text-left text-left text-left text-left text-left text-left text-left text-left"><div className="font-mono font-bold text-slate-700 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{r.serialId}</div><div className="text-[10px] text-slate-400 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{r.startDate}</div></td><td className="py-5 font-black text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{r.name}</td><td className="py-5 text-center text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{r.totalHours} HR</td><td className="py-5 text-right text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><StatusBadge status={r.status} /></td></tr>
                  ))}
                  {records.length === 0 && !apiError && <tr><td colSpan="4" className="py-10 text-center text-slate-300 italic text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">無紀錄</td></tr>}
                </tbody></table>
              </div>
            </div>
          )}
        </div>
      </main>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in text-left text-left text-left text-left text-left text-left">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="flex items-center gap-3 mb-6 text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Globe className="text-indigo-600 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" /><h3 className="text-xl font-black text-slate-800 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">API 設定</h3></div><p className="text-sm text-slate-500 mb-6 leading-relaxed text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">請輸入後端 API 的位址。如果您正在使用雲端預覽，必須使用 <b>ngrok</b> 產生的 <b>https</b> 網址。</p><div className="space-y-4 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><input type="text" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-50 font-mono text-xs text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" placeholder="https://xxxx.ngrok-free.app/api" value={tempApiUrl} onChange={e => setTempApiUrl(e.target.value)} /><div className="flex gap-3 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">取消</button><button onClick={saveSettings} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-white"><Save size={18} className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-white" /> 儲存</button></div></div></div>
        </div>
      )}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"></div>}
    </div>
  );
};

export default App;