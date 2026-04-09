import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X,
  ShieldCheck, Check, XCircle, MessageSquare, AlertTriangle
} from 'lucide-react';

// --- 加班申請視圖 ---
const OvertimeView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  const [opinions, setOpinions] = useState({}); // 暫存主管簽核意見
  const [errors, setErrors] = useState({}); // 錯誤提示狀態

  const initialFormState = {
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
  };
  
  const [formData, setFormData] = useState(initialFormState);
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
        comment: '',
        timestamp: new Date().toLocaleString() 
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(initialFormState);
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

  const handleApproval = (id, newStatus) => {
    const opinion = opinions[id] || '';
    if (newStatus === 'rejected' && !opinion.trim()) {
      setErrors(prev => ({ ...prev, [id]: true }));
      return;
    }
    const updated = records.map(r => r.id === id ? { ...r, status: newStatus, comment: opinion } : r);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    const newOpinions = { ...opinions };
    delete newOpinions[id];
    setOpinions(newOpinions);
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const pendingOvertime = records.filter(r => r.formType === '加班' && r.status === 'pending');

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
          <p className="mt-1 text-indigo-100 opacity-90 text-xs font-medium uppercase tracking-wider italic">事前／事後加班皆可在此完成申請</p>
        </div>

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('pre')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事後補報</button>
            <button onClick={() => setAppType('approve')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'approve' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              主管簽核
              {pendingOvertime.length > 0 && <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
            </button>
          </div>
        </div>

        {appType === 'approve' ? (
          <div className="px-8 py-10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 tracking-tight">待簽核加班項目</h3>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">表單編號</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">員編</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">加班事由</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">加班日期</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">工時數</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">選項</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">簽核與意見</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOvertime.length > 0 ? (
                    pendingOvertime.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-5">
                          <div className="text-xs font-black font-mono text-indigo-600">{record.serialId}</div>
                          {/* 新增：主管簽核表格內的類型顯示 */}
                          <div className={`mt-1 inline-flex text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                            {record.appType === 'pre' ? '事前申請' : '事後補報'}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-xs font-bold text-slate-600">{record.empId}</td>
                        <td className="px-4 py-5 text-xs font-bold text-slate-800">{record.name}</td>
                        <td className="px-6 py-5">
                          <p className="text-xs text-slate-500 font-medium line-clamp-4 max-w-[200px]" title={record.reason}>{record.reason}</p>
                        </td>
                        <td className="px-4 py-5">
                          <div className="text-xs font-bold text-slate-700">{record.startDate}</div>
                          <div className="text-[10px] text-slate-400">{record.startHour}:{record.startMin} - {record.endHour}:{record.endMin}</div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{record.totalHours}</span>
                        </td>
                        <td className="px-4 py-5">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                            {record.compensationType === 'leave' ? '補休' : '計薪'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <div className="relative">
                              <input 
                                type="text"
                                placeholder={errors[record.id] ? "駁回必須填寫理由！" : "輸入簽核意見..."}
                                className={`w-full px-3 py-2 text-[11px] rounded-xl border outline-none transition-all ${errors[record.id] ? 'border-rose-400 bg-rose-50 placeholder-rose-400' : 'border-slate-200 focus:border-indigo-400'}`}
                                value={opinions[record.id] || ''}
                                onChange={(e) => {
                                  setOpinions({ ...opinions, [record.id]: e.target.value });
                                  if (errors[record.id]) setErrors({ ...errors, [record.id]: false });
                                }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleApproval(record.id, 'approved')} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95">
                                <Check size={14} strokeWidth={3} /> 核准
                              </button>
                              <button onClick={() => handleApproval(record.id, 'rejected')} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95">
                                <XCircle size={14} /> 駁回
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="py-20 text-center text-slate-300 opacity-30 font-bold">目前無待簽核項目</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
                  <div className="flex gap-1 shrink-0">
                    <select name="startHour" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.startHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}:00</option>)}</select>
                    <select name="startMin" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.startMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center text-xs font-bold text-rose-600 uppercase tracking-widest"><Clock className="w-3.5 h-3.5 mr-2" /> 結束</label>
                <div className="flex gap-2">
                  <input type="date" name="endDate" className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold" value={formData.endDate} onChange={handleInputChange} />
                  <div className="flex gap-1 shrink-0">
                    <select name="endHour" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.endHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}:00</option>)}</select>
                    <select name="endMin" className="w-18 border border-slate-200 rounded-lg text-sm px-1 bg-white" value={formData.endMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  </div>
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

            <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider"><AlertCircle className="w-4 h-4 text-indigo-600" />備註：</div>
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
        )}
      </div>
    </div>
  );
};

// --- 請假申請視圖 ---
const LeaveView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  const [opinions, setOpinions] = useState({});
  const [errors, setErrors] = useState({});

  const initialFormState = {
    name: '',
    empId: '',
    type: 'personal',
    startDate: today,
    startHour: '09',
    endDate: today,
    endHour: '18',
    proxy: '',
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);
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
        totalHours: totalDays * 8, 
        status: 'pending',
        comment: '',
        timestamp: new Date().toLocaleString() 
      };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(initialFormState);
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApproval = (id, newStatus) => {
    const opinion = opinions[id] || '';
    if (newStatus === 'rejected' && !opinion.trim()) {
      setErrors(prev => ({ ...prev, [id]: true }));
      return;
    }
    const updated = records.map(r => r.id === id ? { ...r, status: newStatus, comment: opinion } : r);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    const newOpinions = { ...opinions };
    delete newOpinions[id];
    setOpinions(newOpinions);
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const pendingLeaves = records.filter(r => r.formType === '請假' && r.status === 'pending');

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

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('form')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'form' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>申請表單</button>
            <button onClick={() => setAppType('approve')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${appType === 'approve' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              主管簽核
              {pendingLeaves.length > 0 && <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
            </button>
          </div>
        </div>

        {appType === 'approve' ? (
          <div className="px-8 py-10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-800 tracking-tight">待簽核請假項目</h3>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">表單編號</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">員編</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">姓名</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">假別</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">請假日期</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">天數</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">簽核與意見</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingLeaves.length > 0 ? (
                    pendingLeaves.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-5 font-black font-mono text-xs text-rose-600">{record.serialId}</td>
                        <td className="px-4 py-5 text-xs font-bold text-slate-600">{record.empId}</td>
                        <td className="px-4 py-5 text-xs font-bold text-slate-800">{record.name}</td>
                        <td className="px-4 py-5 text-center"><span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded">{leaveTypes.find(t => t.id === record.type)?.label}</span></td>
                        <td className="px-4 py-5"><div className="text-xs font-bold text-slate-700">{record.startDate}</div><div className="text-[10px] text-slate-400">至 {record.endDate}</div></td>
                        <td className="px-4 py-5 text-center"><span className="text-sm font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">{record.totalHours / 8} 天</span></td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder={errors[record.id] ? "請填寫駁回理由" : "輸入意見..."} className={`w-full px-3 py-2 text-[11px] rounded-xl border outline-none transition-all ${errors[record.id] ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-rose-400'}`} value={opinions[record.id] || ''} onChange={(e) => { setOpinions({ ...opinions, [record.id]: e.target.value }); if (errors[record.id]) setErrors({ ...errors, [record.id]: false }); }} />
                            <div className="flex gap-2">
                              <button onClick={() => handleApproval(record.id, 'approved')} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95">
                                <Check size={14} strokeWidth={3} /> 核准
                              </button>
                              <button onClick={() => handleApproval(record.id, 'rejected')} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95">
                                <XCircle size={14} /> 駁回
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="py-20 text-center text-slate-300 font-bold opacity-30">無待簽核項目</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

// --- 主程式入口 ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [overtimeAppType, setOvertimeAppType] = useState('pre'); // 加班單標籤頁狀態
  const [leaveAppType, setLeaveAppType] = useState('form');     // 請假單標籤頁狀態
  const [records, setRecords] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

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

  const requestDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const executeDelete = () => {
    const updated = records.filter(r => r.id !== deleteConfirm.id);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    setDeleteConfirm({ show: false, id: null });
  };

  // 動態過濾紀錄的邏輯
  const filteredHistory = useMemo(() => {
    const isApprovalMode = (activeMenu === 'overtime' && overtimeAppType === 'approve') || 
                           (activeMenu === 'leave' && leaveAppType === 'approve');

    if (isApprovalMode) {
      // 簽核模式：只顯示「已核准」或「已駁回」的紀錄
      return records.filter(r => (r.status === 'approved' || r.status === 'rejected') && 
                                 ((activeMenu === 'overtime' && r.formType === '加班') || 
                                  (activeMenu === 'leave' && r.formType === '請假')));
    } else {
      // 申請模式：顯示該選單類型的所有紀錄
      return records.filter(r => (activeMenu === 'overtime' && r.formType === '加班') || 
                                 (activeMenu === 'leave' && r.formType === '請假'));
    }
  }, [records, activeMenu, overtimeAppType, leaveAppType]);

  const navItems = [
    { id: 'overtime', label: '加班申請單', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'leave', label: '請假申請單', icon: CalendarDays, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">已核准</span>;
      case 'rejected': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-wider">已駁回</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700 uppercase tracking-wider">待核准</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"><LayoutDashboard className="text-white w-6 h-6" /></div>
            <div><h2 className="font-black text-slate-800 tracking-tight text-lg text-left">員工服務平台</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Employee Portal</p></div>
          </div>
          <nav className="flex-grow px-4 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeMenu === item.id ? `${item.bg} ${item.color} shadow-sm` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                <item.icon className="w-5 h-5" />{item.label}{activeMenu === item.id && <div className={`ml-auto w-1.5 h-6 rounded-full ${item.id === 'overtime' ? 'bg-indigo-600' : 'bg-rose-600'}`}></div>}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100"><button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><LogOut className="w-5 h-5" />登出系統</button></div>
        </div>
      </aside>

      <main className="flex-grow min-w-0 flex flex-col">
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu /></button>
          <h1 className="font-black text-slate-800 text-sm">員工服務平台</h1><div className="w-10 h-10 bg-indigo-100 rounded-full"></div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 sm:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto space-y-12">
            {activeMenu === 'overtime' ? (
              <OvertimeView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={overtimeAppType} setAppType={setOvertimeAppType} />
            ) : (
              <LeaveView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={leaveAppType} setAppType={setLeaveAppType} />
            )}
            
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  {((activeMenu === 'overtime' && overtimeAppType === 'approve') || (activeMenu === 'leave' && leaveAppType === 'approve')) ? '歷史簽核紀錄' : '歷史申請紀錄'}
                  <span className="ml-2 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full">{filteredHistory.length} 筆</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                {filteredHistory.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">編號 / 類型</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">申請資訊</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">時間</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">時數/天</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">狀態</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">簽核意見</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-5">
                            <div className="text-xs font-black font-mono text-slate-700">{record.serialId || '---'}</div>
                            {/* 更新：歷史紀錄標籤改為「事前申請」或「事後補報」 */}
                            <div className={`mt-1 inline-flex text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                              record.formType === '加班' 
                                ? (record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600')
                                : 'bg-rose-100 text-rose-600'
                            }`}>
                              {record.formType === '加班' 
                                ? (record.appType === 'pre' ? '事前申請' : '事後補報') 
                                : record.formType}
                            </div>
                          </td>
                          <td className="px-6 py-5"><div className="text-sm font-bold text-slate-800">{record.name}</div><div className="text-[10px] text-slate-400 font-medium">{record.empId}</div></td>
                          <td className="px-6 py-5 text-xs text-slate-500 font-medium"><div>{record.startDate}</div><div className="opacity-50 text-[10px]">至 {record.endDate}</div></td>
                          <td className="px-6 py-5 text-center"><div className="text-sm font-black text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-lg">{record.formType === '加班' ? `${record.totalHours} HR` : `${record.totalHours/8} D`}</div></td>
                          <td className="px-6 py-5 text-center">{getStatusBadge(record.status)}</td>
                          <td className="px-6 py-5">{record.comment ? <div className="text-[11px] font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">{record.comment}</div> : <span className="text-[10px] text-slate-300 italic">尚未填寫意見</span>}</td>
                          <td className="px-8 py-5 text-right"><button onClick={() => requestDelete(record.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                    <ListChecks size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-30 tracking-widest">尚無紀錄</p>
                  </div>
                )}
              </div>
            </div>
            <footer className="text-center opacity-30 pb-4"><p className="text-[10px] font-black uppercase tracking-[0.3em]">HR Management System 2.0</p></footer>
          </div>
        </div>
      </main>

      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-rose-500 w-8 h-8" /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">確認刪除紀錄？</h3>
              <p className="text-sm text-slate-500 font-medium">此操作無法撤銷，確定要將此項申請紀錄從系統中移除嗎？</p>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3">
              <button onClick={() => setDeleteConfirm({ show: false, id: null })} className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">取消</button>
              <button onClick={executeDelete} className="flex-1 py-3 px-4 bg-rose-500 rounded-2xl text-sm font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"></div>}
    </div>
  );
};

export default App;