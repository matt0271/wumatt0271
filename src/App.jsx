import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X
} from 'lucide-react';

// --- 加班申請視圖 ---
const OvertimeView = ({ records, setRecords, today, currentSerialId }) => {
  const [appType, setAppType] = useState('pre'); 
  const [formData, setFormData] = useState({
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
  });

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

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '30'];

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
        timestamp: new Date().toLocaleString() 
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(prev => ({ ...prev, reason: '' }));
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-6 right-8 z-20 flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-400/30 shadow-inner">
            <Fingerprint className="w-4 h-4 text-indigo-200" />
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">表單編號</span>
              <span className="text-sm font-black font-mono tracking-wider leading-none">{currentSerialId}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><Timer size={100} /></div>
          <h1 className="text-2xl font-black tracking-tight relative z-10">加班申請單</h1>
          <p className="mt-1 text-indigo-100 opacity-90 text-xs font-medium uppercase tracking-wider">Overtime Application</p>
        </div>

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('pre')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事後補報</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest"><User className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 姓名</label>
              <input type="text" name="name" required placeholder="請輸入姓名" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest"><Hash className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 員工編號</label>
              <input type="text" name="empId" required placeholder="例如: EMP-001" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={formData.empId} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-3">
              <label className="flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest"><Clock className="w-3.5 h-3.5 mr-2" /> 開始</label>
              <div className="flex gap-2">
                <input type="date" name="startDate" className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold" value={formData.startDate} onChange={handleInputChange} />
                <select name="startHour" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.startHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}:00</option>)}</select>
                <select name="startMin" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.startMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center text-xs font-bold text-rose-600 uppercase tracking-widest"><Clock className="w-3.5 h-3.5 mr-2" /> 結束</label>
              <div className="flex gap-2">
                <input type="date" name="endDate" className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold" value={formData.endDate} onChange={handleInputChange} />
                <select name="endHour" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.endHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}:00</option>)}</select>
                <select name="endMin" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.endMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">加班類別</label>
              <select name="category" className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold outline-none" value={formData.category} onChange={handleInputChange}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">補償方式</label>
              <select name="compensationType" className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold outline-none" value={formData.compensationType} onChange={handleInputChange}>{compensationTypes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            </div>
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200 text-center flex items-center justify-between px-5">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-tighter">總計時數</span>
              <span className="text-xl font-black text-white">{totalHours} <small className="text-[10px] opacity-80">HR</small></span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">加班事由</label>
            <textarea name="reason" rows="3" required placeholder="描述加班細節..." className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium bg-white" value={formData.reason} onChange={handleInputChange}></textarea>
          </div>

          {/* 備註提醒區塊 (已移除原 C 選項並重編序號) */}
          <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              備註：
            </div>
            <div className="space-y-2 text-[11px] leading-relaxed text-slate-600 font-medium">
              <p>A. 加班申請須事前由直屬主管核准，始得進行加班，並於事後呈主管審核確認。</p>
              <p>B. 此單由各部門編序號並於加班後七個工作日內交至財務行政部辦理，逾期不受理。</p>
              <p>C. 此加班工時將依比率換算為補休時數或薪資。</p>
              <p>D. 每月加班時數上限不得超過46小時。</p>
            </div>
          </div>

          <button type="submit" disabled={totalHours <= 0 || submitting} className={`w-full py-4 rounded-xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${submitted ? 'bg-emerald-500 shadow-emerald-200' : totalHours <= 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : submitted ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
            {submitted ? '提交成功' : '提交加班申請'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 請假申請視圖 ---
const LeaveView = ({ records, setRecords, today, currentSerialId }) => {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    type: 'personal',
    startDate: today,
    startHour: '09',
    endDate: today,
    endHour: '18',
    proxy: '',
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const leaveTypes = [
    { id: 'personal', label: '事假' },
    { id: 'sick', label: '病假' },
    { id: 'annual', label: '特休' },
    { id: 'compensatory', label: '補休' },
    { id: 'other', label: '其他' },
  ];

  const totalDays = useMemo(() => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, diff + 1);
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newRecord = { 
        ...formData, 
        id: Date.now(), 
        serialId: currentSerialId, 
        formType: '請假',
        totalHours: totalDays * 8, // 簡易換算為時數
        status: 'pending',
        timestamp: new Date().toLocaleString() 
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(prev => ({ ...prev, reason: '' }));
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-rose-600 px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-6 right-8 z-20 flex items-center gap-2 bg-rose-500/30 backdrop-blur-md px-4 py-2 rounded-full border border-rose-400/30 shadow-inner">
            <Fingerprint className="w-4 h-4 text-rose-200" />
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-rose-200 uppercase tracking-widest leading-none mb-1">表單編號</span>
              <span className="text-sm font-black font-mono tracking-wider leading-none">{currentSerialId}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><CalendarDays size={100} /></div>
          <h1 className="text-2xl font-black tracking-tight relative z-10">請假申請單</h1>
          <p className="mt-1 text-rose-100 opacity-90 text-xs font-medium uppercase tracking-wider">Leave Application</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest"><User className="w-3.5 h-3.5 mr-2 text-rose-500" /> 姓名</label>
              <input type="text" name="name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-sm font-medium" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest"><Hash className="w-3.5 h-3.5 mr-2 text-rose-500" /> 員工編號</label>
              <input type="text" name="empId" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-sm font-medium" value={formData.empId} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">請假假別</label>
              <select name="type" className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold outline-none" value={formData.type} onChange={handleInputChange}>{leaveTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </div>
            <div className="space-y-2"><label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest"><UserCheck className="w-3.5 h-3.5 mr-2 text-rose-500" /> 職務代理人</label>
              <input type="text" name="proxy" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-sm font-medium" value={formData.proxy} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-3">
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest">開始日期</label>
              <input type="date" name="startDate" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold" value={formData.startDate} onChange={handleInputChange} />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-rose-600 uppercase tracking-widest">結束日期</label>
              <input type="date" name="endDate" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold" value={formData.endDate} onChange={handleInputChange} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">請假事由</label>
            <textarea name="reason" rows="3" required className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-sm font-medium bg-white" value={formData.reason} onChange={handleInputChange}></textarea>
          </div>

          <button type="submit" disabled={submitting} className={`w-full py-4 rounded-xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${submitted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : submitted ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
            {submitted ? '提交成功' : '提交請假申請'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 主程式入口 ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [records, setRecords] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const saved = localStorage.getItem('portal_records');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const currentSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const deleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
  };

  const navItems = [
    { id: 'overtime', label: '加班申請單', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'leave', label: '請假申請單', icon: CalendarDays, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* 側邊導覽列 */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 tracking-tight text-lg">員工服務平台</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Portal</p>
            </div>
          </div>

          <nav className="flex-grow px-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeMenu === item.id 
                    ? `${item.bg} ${item.color} shadow-sm` 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {activeMenu === item.id && <div className={`ml-auto w-1.5 h-6 rounded-full ${item.id === 'overtime' ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
              <LogOut className="w-5 h-5" />
              登出系統
            </button>
          </div>
        </div>
      </aside>

      {/* 內容區域 */}
      <main className="flex-grow min-w-0 flex flex-col">
        {/* 手機版頂部工具列 */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu /></button>
          <h1 className="font-black text-slate-800 text-sm">員工服務平台</h1>
          <div className="w-10 h-10 bg-indigo-100 rounded-full"></div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 sm:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* 動態渲染視圖 */}
            {activeMenu === 'overtime' ? (
              <OvertimeView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} />
            ) : (
              <LeaveView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} />
            )}

            {/* 歷史紀錄共用區塊 */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  歷史申請紀錄
                  <span className="ml-2 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full">{records.length} 筆</span>
                </h2>
              </div>

              <div className="overflow-x-auto">
                {records.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">編號 / 類型</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">申請資訊</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">時間</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">時數</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">狀態</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-5">
                            <div className="text-xs font-black font-mono text-slate-700">{record.serialId || '---'}</div>
                            <div className={`mt-1 inline-flex text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${record.formType === '加班' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>{record.formType}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-bold text-slate-800">{record.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{record.empId}</div>
                          </td>
                          <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                            <div>{record.startDate}</div>
                            <div className="opacity-50">至 {record.endDate}</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="text-sm font-black text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-lg">
                              {record.totalHours} <span className="text-[9px] opacity-70">HR</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700 uppercase tracking-wider">待核准</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => deleteRecord(record.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                    <ListChecks size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-30 tracking-widest">目前尚無任何紀錄</p>
                  </div>
                )}
              </div>
            </div>

            <footer className="text-center opacity-30 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">HR Management System 2.0</p>
            </footer>
          </div>
        </div>
      </main>

      {/* 手機版側邊欄背景掩蓋 */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"></div>}
    </div>
  );
};

export default App;