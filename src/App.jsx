import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, 
  Loader2, Trash2, History, ClipboardCheck, Fingerprint,
  CalendarDays, UserCheck, LayoutDashboard, LogOut, Menu, X,
  ShieldCheck, Check, XCircle, MessageSquare, AlertTriangle,
  Search, Filter, BarChart3, MousePointerClick, Building2, Briefcase,
  Users, UserPlus
} from 'lucide-react';

// 通用的時間選項
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '30'];

// --- 加班申請視圖 ---
const OvertimeView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentOpinion, setCurrentOpinion] = useState('');
  const [error, setError] = useState(false);

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

  const handleApprovalSubmit = (newStatus) => {
    if (!selectedId) return;
    if (newStatus === 'rejected' && !currentOpinion.trim()) {
      setError(true);
      return;
    }
    const updated = records.map(r => r.id === selectedId ? { ...r, status: newStatus, comment: currentOpinion } : r);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    setSelectedId(null);
    setCurrentOpinion('');
    setError(false);
  };

  const pendingOvertime = records.filter(r => r.formType === '加班' && r.status === 'pending');
  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-6 right-8 z-20 flex items-center gap-3 bg-indigo-500/30 backdrop-blur-md px-5 py-2.5 rounded-full border border-indigo-400/30 shadow-inner">
            <Fingerprint className="w-5 h-5 text-indigo-200" />
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">表單編號</span>
              <span className="text-base font-black font-mono tracking-wider leading-none">{currentSerialId}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><Timer size={120} /></div>
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-left">加班申請單</h1>
          <p className="mt-2 text-indigo-100 opacity-90 text-sm font-medium uppercase tracking-wider italic text-left">事前／事後加班皆可在此完成申請</p>
        </div>

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('pre')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'pre' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事前申請</button>
            <button onClick={() => setAppType('post')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'post' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>事後補報</button>
            <button onClick={() => setAppType('approve')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'approve' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>主管簽核 {pendingOvertime.length > 0 && <span className="ml-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>}</button>
          </div>
        </div>

        {appType === 'approve' ? (
          <div className="px-8 py-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /><h3 className="text-lg font-bold text-slate-800 tracking-tight">待簽核加班清單</h3><span className="text-sm text-slate-400 font-medium">請點選下方項目進行簽核處理</span></div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">選取</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">表單編號</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">員編</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">姓名</th>
                      <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">加班事由</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">加班日期</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">工時數</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">選項</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingOvertime.length > 0 ? (
                      pendingOvertime.map((record) => (
                        <tr key={record.id} onClick={() => { setSelectedId(record.id); setError(false); }} className={`cursor-pointer transition-all duration-200 ${selectedId === record.id ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-6 text-center"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-indigo-600 bg-indigo-600 shadow-md shadow-indigo-200' : 'border-slate-300 bg-white'}`}>{selectedId === record.id && <div className="w-2.5 h-2.5 rounded-full bg-white animate-in zoom-in duration-300"></div>}</div></td>
                          <td className="px-4 py-6">
                            <div className="font-black font-mono text-indigo-600">{record.serialId}</div>
                            <div className={`mt-1 inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded ${record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>{record.appType === 'pre' ? '事前申請' : '事後補報'}</div>
                          </td>
                          <td className="px-4 py-6 font-bold text-slate-600">{record.empId}</td>
                          <td className="px-4 py-6 font-bold text-slate-800">{record.name}</td>
                          <td className="px-6 py-6"><p className="text-slate-500 font-medium line-clamp-4 max-w-[250px] leading-relaxed" title={record.reason}>{record.reason}</p></td>
                          <td className="px-4 py-6">
                            <div className="font-bold text-slate-700">{record.startDate}</div>
                            <div className="text-xs text-slate-400 mt-1">{record.startHour}:{record.startMin} - {record.endHour}:{record.endMin}</div>
                          </td>
                          <td className="px-4 py-6 text-center"><span className="text-base font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-xl">{record.totalHours}</span></td>
                          <td className="px-4 py-6"><span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 uppercase tracking-tighter">{record.compensationType === 'leave' ? '補休' : '計薪'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="py-24 text-center text-slate-300 opacity-30 font-bold text-base">目前無待簽核項目</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${selectedId ? 'bg-white border-indigo-100 shadow-2xl shadow-indigo-100/50 scale-[1.01]' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow space-y-5 w-full">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><MessageSquare className={`w-6 h-6 ${selectedId ? 'text-indigo-600' : 'text-slate-400'}`} /><h4 className="text-lg font-black text-slate-800 tracking-tight">案件處理與簽核意見</h4></div>{selectedRecord && <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 animate-in fade-in">當前選取：{selectedRecord.serialId} ({selectedRecord.name})</div>}</div>
                  <div className="relative">
                    <textarea disabled={!selectedId} placeholder={selectedId ? "在此輸入審核意見或駁回具體原因..." : "請先從上方列表中勾選待簽核案件..."} className={`w-full p-5 rounded-2xl text-base font-medium border outline-none transition-all resize-none h-32 ${error ? 'border-rose-400 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'}`} value={currentOpinion} onChange={(e) => { setCurrentOpinion(e.target.value); if (error) setError(false); }} />
                    {error && <div className="absolute left-5 bottom-3 text-xs font-black text-rose-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={14} /> 駁回必須填寫意見理由！</div>}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-4 shrink-0 w-full md:w-auto pt-10">
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('approved')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-2xl text-base font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-30"><Check size={20} strokeWidth={4} /> 核准通過</button>
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('rejected')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-2xl text-base font-black hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-30"><XCircle size={20} /> 駁回申請</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-8 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3"><label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><User className="w-4 h-4 mr-2 text-indigo-500" /> 姓名</label><input type="text" name="name" required placeholder="請輸入姓名" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium" value={formData.name} onChange={handleInputChange} /></div>
              <div className="space-y-3"><label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><Hash className="w-4 h-4 mr-2 text-indigo-500" /> 員工編號</label><input type="text" name="empId" required placeholder="例如: EMP-001" className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium" value={formData.empId} onChange={handleInputChange} /></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="space-y-4"><label className="flex items-center text-sm font-bold text-emerald-600 uppercase tracking-widest"><Clock className="w-4 h-4 mr-2" /> 開始</label><div className="flex gap-3"><input type="date" name="startDate" className="flex-grow px-4 py-3 rounded-xl border border-slate-200 text-base font-semibold" value={formData.startDate} onChange={handleInputChange} /><div className="flex gap-2 shrink-0"><select name="startHour" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.startHour} onChange={handleInputChange}>{HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}</select><select name="startMin" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.startMin} onChange={handleInputChange}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div></div>
              <div className="space-y-4"><label className="flex items-center text-sm font-bold text-rose-600 uppercase tracking-widest"><Clock className="w-4 h-4 mr-2" /> 結束</label><div className="flex gap-3"><input type="date" name="endDate" className="flex-grow px-4 py-3 rounded-xl border border-slate-200 text-base font-semibold" value={formData.endDate} onChange={handleInputChange} /><div className="flex gap-2 shrink-0"><select name="endHour" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.endHour} onChange={handleInputChange}>{HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}</select><select name="endMin" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.endMin} onChange={handleInputChange}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="space-y-3"><label className="text-sm font-bold text-slate-500 uppercase tracking-widest">加班類別</label><select name="category" className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-white text-base font-semibold outline-none" value={formData.category} onChange={handleInputChange}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div className="space-y-3"><label className="text-sm font-bold text-slate-500 uppercase tracking-widest">補償方式</label><select name="compensationType" className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-white text-base font-semibold outline-none" value={formData.compensationType} onChange={handleInputChange}>{compensationTypes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl shadow-indigo-200 text-center flex items-center justify-between px-6"><span className="text-xs font-black text-indigo-100 uppercase tracking-tighter">總計時數</span><span className="text-2xl font-black text-white">{totalHours} <small className="text-xs opacity-80">HR</small></span></div>
            </div>
            <div className="space-y-3"><label className="text-sm font-bold text-slate-500 uppercase tracking-widest">加班事由</label><textarea name="reason" rows="4" required placeholder="描述加班具體工作細節..." className="w-full p-5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-base font-medium bg-white" value={formData.reason} onChange={handleInputChange}></textarea></div>
            <div className="bg-slate-100 rounded-[1.5rem] p-6 border border-slate-200 space-y-4"><div className="flex items-center gap-3 text-slate-800 font-bold text-sm uppercase tracking-wider"><AlertCircle className="w-5 h-5 text-indigo-600" />備註：</div><div className="space-y-3 text-xs leading-relaxed text-slate-600 font-medium"><p>A. 加班申請須事前由直屬主管核准，始得進行加班，並於事後呈主管審核確認。</p><p>B. 此單由各部門編序號並於加班後七個工作日內交至財務行政部辦理，逾期不受理。</p><p>C. 此加班工時將依比率換算為補休時數或薪資。</p><p>D. 每月加班時數上限不得超過46小時。</p></div></div>
            <button type="submit" disabled={totalHours <= 0 || submitting} className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 ${submitted ? 'bg-emerald-500 shadow-emerald-200' : totalHours <= 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>{submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : submitted ? <CheckCircle2 className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}{submitted ? '提交成功' : '提交加班申請'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- 請假申請視圖 ---
const LeaveView = ({ records, setRecords, today, currentSerialId, appType, setAppType }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentOpinion, setCurrentOpinion] = useState('');
  const [error, setError] = useState(false);

  const initialFormState = {
    name: '',
    empId: '',
    dept: '',      
    jobTitle: '',  
    type: 'annual',
    startDate: today,
    startHour: '09',
    startMin: '00',
    endDate: today,
    endHour: '18',
    endMin: '00',
    proxy: '',
    reason: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const leaveTypes = [
    { id: 'annual', label: '特休假' },
    { id: 'compensatory', label: '補休' },
    { id: 'personal', label: '事假' },
    { id: 'sick', label: '病假' },
    { id: 'hospitalized', label: '病假(連續住院)' },
    { id: 'marriage', label: '婚假' },
    { id: 'official', label: '公假' },
    { id: 'maternity', label: '產假' },
    { id: 'paternity', label: '陪產假' },
    { id: 'prenatal', label: '產檢假' },
    { id: 'bereavement', label: '喪假' },
    { id: 'benefit', label: '福利假' },
    { id: 'family_care', label: '家庭照顧假' },
    { id: 'parental_leave', label: '育嬰留停' },
  ];

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
        formType: '請假',
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApprovalSubmit = (newStatus) => {
    if (!selectedId) return;
    if (newStatus === 'rejected' && !currentOpinion.trim()) {
      setError(true);
      return;
    }
    const updated = records.map(r => r.id === selectedId ? { ...r, status: newStatus, comment: currentOpinion } : r);
    setRecords(updated);
    localStorage.setItem('portal_records', JSON.stringify(updated));
    setSelectedId(null);
    setCurrentOpinion('');
    setError(false);
  };

  const pendingLeaves = records.filter(r => r.formType === '請假' && r.status === 'pending');
  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="bg-teal-600 px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-6 right-8 z-20 flex items-center gap-3 bg-teal-500/30 backdrop-blur-md px-5 py-2.5 rounded-full border border-teal-400/30 shadow-inner">
            <Fingerprint className="w-5 h-5 text-teal-200" />
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold text-teal-200 uppercase tracking-widest leading-none mb-1">表單編號</span>
              <span className="text-base font-black font-mono tracking-wider leading-none">{currentSerialId}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10"><CalendarDays size={120} /></div>
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-left">請假申請單</h1>
          <p className="mt-2 text-teal-100 opacity-90 text-sm font-medium uppercase tracking-wider italic text-left">請在此填寫您的請假計畫</p>
        </div>

        <div className="px-8 pt-8 pb-2">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl">
            <button onClick={() => setAppType('form')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'form' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>申請表單</button>
            <button onClick={() => setAppType('approve')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-base font-bold transition-all ${appType === 'approve' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>主管簽核 {pendingLeaves.length > 0 && <span className="ml-2 w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></span>}</button>
          </div>
        </div>

        {appType === 'approve' ? (
          <div className="px-8 py-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2"><ShieldCheck className="w-6 h-6 text-teal-600" /><h3 className="text-lg font-bold text-slate-800 tracking-tight">待簽核請假項目</h3></div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-20">選取</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">表單編號</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">員編/姓名</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">假別</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">請假日期</th>
                      <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">時數</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pendingLeaves.length > 0 ? (
                      pendingLeaves.map((record) => (
                        <tr key={record.id} onClick={() => setSelectedId(record.id)} className={`cursor-pointer transition-all duration-200 ${selectedId === record.id ? 'bg-teal-50/70 hover:bg-teal-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-6 text-center"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedId === record.id ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}`}>{selectedId === record.id && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}</div></td>
                          <td className="px-4 py-6 font-black font-mono text-teal-600">{record.serialId}</td>
                          <td className="px-4 py-6"><div className="font-bold text-slate-800">{record.name}</div><div className="text-xs text-slate-400">{record.empId}</div></td>
                          <td className="px-4 py-6 text-center"><span className="text-[11px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-lg uppercase tracking-wider">{leaveTypes.find(t => t.id === record.type)?.label}</span></td>
                          <td className="px-4 py-6"><div className="font-bold text-slate-700">{record.startDate} {record.startHour}:{record.startMin}</div><div className="text-xs text-slate-400 mt-1">至 {record.endDate} {record.endHour}:{record.endMin}</div></td>
                          <td className="px-4 py-6 text-center"><span className="text-base font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl">{record.totalHours} HR</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="py-24 text-center text-slate-300 font-bold text-base opacity-30">無待簽核項目</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${selectedId ? 'bg-white border-teal-100 shadow-2xl shadow-teal-100/50 scale-[1.01]' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-grow space-y-5 w-full">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><MessageSquare className={`w-6 h-6 ${selectedId ? 'text-teal-600' : 'text-slate-400'}`} /><h4 className="text-lg font-black text-slate-800 tracking-tight">請假單處理意見</h4></div>{selectedRecord && <div className="text-xs font-black text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100 animate-in fade-in">已選：{selectedRecord.serialId}</div>}</div>
                  <textarea disabled={!selectedId} placeholder={selectedId ? "請輸入核准或駁回意見..." : "請先選取上方單據..."} className={`w-full p-5 rounded-2xl text-base font-medium border outline-none transition-all resize-none h-32 ${error ? 'border-rose-400 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50'}`} value={currentOpinion} onChange={(e) => { setCurrentOpinion(e.target.value); if (error) setError(false); }} />
                  {error && <div className="text-xs font-black text-rose-500 flex items-center gap-1 animate-pulse mt-1"><AlertTriangle size={14} /> 駁回必須填寫理由！</div>}
                </div>
                <div className="flex flex-row md:flex-col gap-4 shrink-0 w-full md:w-auto pt-10">
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('approved')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-2xl text-base font-black hover:bg-emerald-600 shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-30"><Check size={20} strokeWidth={4} /> 核准</button>
                  <button disabled={!selectedId} onClick={() => handleApprovalSubmit('rejected')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-rose-500 text-white rounded-2xl text-base font-black hover:bg-rose-600 shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-30"><XCircle size={20} /> 駁回</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><User className="w-4 h-4 mr-2 text-teal-500" /> 姓名</label>
                <input type="text" name="name" required className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-base font-medium" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-3">
                <label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><Hash className="w-4 h-4 mr-2 text-teal-500" /> 員工編號</label>
                <input type="text" name="empId" required className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-base font-medium" value={formData.empId} onChange={handleInputChange} />
              </div>
              <div className="space-y-3">
                <label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><Building2 className="w-4 h-4 mr-2 text-teal-500" /> 單位</label>
                <input type="text" name="dept" required placeholder="例如: 財務部" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-base font-medium" value={formData.dept} onChange={handleInputChange} />
              </div>
              <div className="space-y-3">
                <label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><Briefcase className="w-4 h-4 mr-2 text-teal-500" /> 職稱</label>
                <input type="text" name="jobTitle" required placeholder="例如: 經理" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-base font-medium" value={formData.jobTitle} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3"><label className="text-sm font-bold text-slate-500 uppercase tracking-widest">請假類別</label><select name="type" className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-white text-base font-semibold outline-none" value={formData.type} onChange={handleInputChange}>{leaveTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              <div className="space-y-3"><label className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest"><UserCheck className="w-4 h-4 mr-2 text-teal-500" /> 職務代理人</label><input type="text" name="proxy" required className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none text-base font-medium" value={formData.proxy} onChange={handleInputChange} /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="space-y-4"><label className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4" /> 開始日期與時間</label><div className="flex gap-3"><input type="date" name="startDate" className="flex-grow px-4 py-3 rounded-xl border border-slate-200 text-base font-semibold" value={formData.startDate} onChange={handleInputChange} /><div className="flex gap-2 shrink-0"><select name="startHour" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.startHour} onChange={handleInputChange}>{HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}</select><select name="startMin" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.startMin} onChange={handleInputChange}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div></div>
              <div className="space-y-4"><label className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4" /> 結束日期與時間</label><div className="flex gap-3"><input type="date" name="endDate" className="flex-grow px-4 py-3 rounded-xl border border-slate-200 text-base font-semibold" value={formData.endDate} onChange={handleInputChange} /><div className="flex gap-2 shrink-0"><select name="endHour" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.endHour} onChange={handleInputChange}>{HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}</select><select name="endMin" className="w-20 border border-slate-200 rounded-xl text-base px-2 bg-white" value={formData.endMin} onChange={handleInputChange}>{MINUTES.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-10 space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">請假事由 (請詳述)</label>
                <textarea name="reason" rows="8" required placeholder="請詳細描述請假期間的事由或工作交辦事項..." className="w-full p-5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-base font-medium bg-white" value={formData.reason} onChange={handleInputChange}></textarea>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-teal-600 p-5 rounded-3xl shadow-xl shadow-teal-100 flex flex-col items-center justify-center gap-1 border border-teal-500/20">
                  <span className="text-[10px] font-black text-teal-100 uppercase tracking-widest">總計</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{totalHours}</span>
                    <span className="text-[10px] font-black text-teal-200 uppercase">HR</span>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={totalHours <= 0 || submitting} className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 ${submitted ? 'bg-emerald-500 shadow-emerald-200' : totalHours <= 0 ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'}`}>{submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : submitted ? <CheckCircle2 className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}{submitted ? '提交成功' : '提交請假申請'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- 人員管理視圖 ---
const PersonnelManagementView = ({ employees, setEmployees, requestDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    dept: '',
    jobTitle: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newEmployee = { ...formData, id: Date.now() };
      const updated = [newEmployee, ...employees];
      setEmployees(updated);
      localStorage.setItem('portal_employees', JSON.stringify(updated));
      setFormData({ name: '', empId: '', dept: '', jobTitle: '' });
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {/* 人員管理標題改為 Orange 色系 */}
        <div className="bg-orange-600 px-8 py-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><UserPlus size={120} /></div>
          <h1 className="text-3xl font-black tracking-tight relative z-10">人員管理中心</h1>
          <p className="mt-2 text-orange-100 opacity-90 text-sm font-medium uppercase tracking-wider italic">維護企業員工基本主檔</p>
        </div>

        <form onSubmit={handleAddEmployee} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-bold">
            <div className="space-y-3"><label className="flex items-center text-slate-500 uppercase tracking-widest"><User className="w-4 h-4 mr-2 text-orange-500" /> 姓名</label><input type="text" name="name" required placeholder="員工姓名" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base font-medium" value={formData.name} onChange={handleInputChange} /></div>
            <div className="space-y-3"><label className="flex items-center text-slate-500 uppercase tracking-widest"><Hash className="w-4 h-4 mr-2 text-orange-500" /> 員工編號</label><input type="text" name="empId" required placeholder="例如: EMP-001" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base font-medium" value={formData.empId} onChange={handleInputChange} /></div>
            <div className="space-y-3"><label className="flex items-center text-slate-500 uppercase tracking-widest"><Building2 className="w-4 h-4 mr-2 text-orange-500" /> 單位</label><input type="text" name="dept" required placeholder="所屬部門" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base font-medium" value={formData.dept} onChange={handleInputChange} /></div>
            <div className="space-y-3"><label className="flex items-center text-slate-500 uppercase tracking-widest"><Briefcase className="w-4 h-4 mr-2 text-orange-500" /> 職稱</label><input type="text" name="jobTitle" required placeholder="職務角色" className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base font-medium" value={formData.jobTitle} onChange={handleInputChange} /></div>
          </div>
          <button type="submit" disabled={submitting} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3">
            {submitting ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {submitting ? '處理中...' : '新增人員至資料庫'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3"><Users className="text-orange-600 w-6 h-6" /><h2 className="text-xl font-black text-slate-800">現有人員清單</h2></div>
          <span className="bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full font-bold">{employees.length} 位人員</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-5">員編</th><th className="px-6 py-5">姓名</th><th className="px-6 py-5">單位</th><th className="px-6 py-5">職稱</th><th className="px-8 py-5 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-slate-100 text-base text-sm">
              {employees.length > 0 ? employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-mono font-black text-slate-700">{emp.empId}</td>
                  <td className="px-6 py-6 font-bold text-slate-800">{emp.name}</td>
                  <td className="px-6 py-6 text-slate-600 font-medium">{emp.dept}</td>
                  <td className="px-6 py-6 text-slate-600 font-medium">{emp.jobTitle}</td>
                  <td className="px-8 py-6 text-right"><button onClick={() => requestDelete(emp.id, 'employee')} className="p-3 text-slate-300 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50"><Trash2 size={20} /></button></td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="py-24 text-center text-slate-300 font-bold opacity-30 text-lg">尚未建立任何人員資料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 查詢中心視圖 ---
const QueryCenterView = ({ records, getStatusBadge }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredResults = useMemo(() => {
    return records.filter(r => {
      const matchSearch = 
        r.serialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.name.includes(searchTerm) ||
        r.empId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || r.formType === filterType;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [records, searchTerm, filterType, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: filteredResults.length,
      approved: filteredResults.filter(r => r.status === 'approved').length,
      pending: filteredResults.filter(r => r.status === 'pending').length,
      rejected: filteredResults.filter(r => r.status === 'rejected').length,
    };
  }, [filteredResults]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {/* 查詢中心標題改為 Violet 色系 */}
        <div className="bg-violet-600 px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Search size={120} /></div>
          <h1 className="text-3xl font-black tracking-tight relative z-10 text-left">查詢中心</h1>
          <p className="mt-2 text-violet-100 opacity-90 text-sm font-medium uppercase tracking-wider text-left italic">跨類別檢索所有電子單據</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 relative"><Search className="absolute left-5 top-4.5 w-6 h-6 text-violet-400" /><input type="text" placeholder="搜尋編號、姓名或員編..." className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-violet-100 outline-none font-medium text-base transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="relative"><Filter className="absolute left-5 top-4.5 w-5 h-5 text-violet-400" /><select className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 outline-none font-bold text-sm appearance-none bg-white cursor-pointer shadow-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="all">所有單據類型</option><option value="加班">加班申請單</option><option value="請假">請假申請單</option></select></div>
            <div className="relative"><ShieldCheck className="absolute left-5 top-4.5 w-5 h-5 text-violet-400" /><select className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 outline-none font-bold text-sm appearance-none bg-white cursor-pointer shadow-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">所有審核狀態</option><option value="pending">待核准</option><option value="approved">已核准</option><option value="rejected">已駁回</option></select></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: '搜尋結果', value: stats.total, color: 'bg-slate-100 text-slate-600' },
              { label: '已核准', value: stats.approved, color: 'bg-emerald-50 text-emerald-600' },
              { label: '待簽核', value: stats.pending, color: 'bg-amber-50 text-amber-600' },
              { label: '已駁回', value: stats.rejected, color: 'bg-rose-50 text-rose-600' }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm`}>
                <span className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">{stat.label}</span>
                <span className="text-2xl font-black">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead><tr className="bg-slate-50/50"><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">編號 / 類型</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">申請資訊</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">時間範圍</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">數量</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">狀態</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredResults.length > 0 ? (
                  filteredResults.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-6"><div className="font-black font-mono text-slate-700">{record.serialId}</div><div className={`mt-1.5 inline-flex text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${record.formType === '加班' ? (record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600') : 'bg-teal-100 text-teal-600'}`}>{record.formType === '加班' ? (record.appType === 'pre' ? '事前申請' : '事後補報') : record.formType}</div></td>
                      <td className="px-6 py-6"><div className="text-base font-bold text-slate-800">{record.name}</div><div className="text-xs text-slate-400 font-medium mt-1">{record.empId}</div></td>
                      <td className="px-6 py-6 text-sm text-slate-500 font-medium"><div>{record.startDate}</div><div className="opacity-50 mt-1 text-xs">至 {record.endDate}</div></td>
                      <td className="px-6 py-6 text-center"><div className="text-base font-black text-slate-700 bg-slate-100 inline-block px-4 py-1.5 rounded-xl">{record.totalHours} HR</div></td>
                      <td className="px-6 py-6 text-center">{getStatusBadge(record.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-24 text-center text-slate-300 font-bold text-base opacity-30">找不到符合條件的單據</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 主程式入口 ---
const App = () => {
  const [activeMenu, setActiveMenu] = useState('overtime');
  const [overtimeAppType, setOvertimeAppType] = useState('pre'); 
  const [leaveAppType, setLeaveAppType] = useState('form');     
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, type: 'record' });

  useEffect(() => {
    const savedRecords = localStorage.getItem('portal_records');
    if (savedRecords) { try { setRecords(JSON.parse(savedRecords)); } catch (e) { console.error(e); } }
    const savedEmployees = localStorage.getItem('portal_employees');
    if (savedEmployees) { try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { console.error(e); } }
  }, []);

  const currentSerialId = useMemo(() => {
    const dateStr = today.replace(/-/g, '');
    const todaysCount = records.filter(r => r.serialId && r.serialId.startsWith(dateStr)).length;
    return `${dateStr}-${String(todaysCount + 1).padStart(3, '0')}`;
  }, [records, today]);

  const requestDelete = (id, type = 'record') => { setDeleteConfirm({ show: true, id, type }); };
  const executeDelete = () => {
    if (deleteConfirm.type === 'record') {
      const updated = records.filter(r => r.id !== deleteConfirm.id);
      setRecords(updated);
      localStorage.setItem('portal_records', JSON.stringify(updated));
    } else {
      const updated = employees.filter(e => e.id !== deleteConfirm.id);
      setEmployees(updated);
      localStorage.setItem('portal_employees', JSON.stringify(updated));
    }
    setDeleteConfirm({ show: false, id: null, type: 'record' });
  };

  const filteredHistory = useMemo(() => {
    const isApprovalMode = (activeMenu === 'overtime' && overtimeAppType === 'approve') || 
                           (activeMenu === 'leave' && leaveAppType === 'approve');
    if (isApprovalMode) {
      return records.filter(r => (r.status === 'approved' || r.status === 'rejected') && 
                                 ((activeMenu === 'overtime' && r.formType === '加班') || 
                                  (activeMenu === 'leave' && r.formType === '請假')));
    } else {
      return records.filter(r => (activeMenu === 'overtime' && r.formType === '加班') || 
                                 (activeMenu === 'leave' && r.formType === '請假'));
    }
  }, [records, activeMenu, overtimeAppType, leaveAppType]);

  const navItems = [
    { id: 'overtime', label: '加班申請單', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', activeBorder: 'border-indigo-600' },
    { id: 'leave', label: '請假申請單', icon: CalendarDays, color: 'text-teal-600', bg: 'bg-teal-50', activeBorder: 'border-teal-600' },
    { id: 'query', label: '查詢中心', icon: Search, color: 'text-violet-600', bg: 'bg-violet-50', activeBorder: 'border-violet-600' },
    { id: 'personnel', label: '人員管理', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', activeBorder: 'border-orange-600' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider">已核准</span>;
      case 'rejected': return <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 uppercase tracking-wider">已駁回</span>;
      default: return <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-700 uppercase tracking-wider">待核准</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-8 py-12 flex items-center gap-4"><div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200"><LayoutDashboard className="text-white w-7 h-7" /></div><div><h2 className="font-black text-slate-800 tracking-tight text-xl text-left">員工服務平台</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Employee Portal</p></div></div>
          <nav className="flex-grow px-5 space-y-3">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-5 px-5 py-4.5 rounded-2xl text-base font-bold transition-all ${activeMenu === item.id ? `${item.bg} ${item.color} shadow-sm border-l-4 ${item.activeBorder}` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-4 border-transparent'}`}>
                <item.icon className="w-6 h-6" />{item.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-100"><button className="w-full flex items-center gap-5 px-5 py-4.5 rounded-2xl text-base font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><LogOut className="w-6 h-6" />登出系統</button></div>
        </div>
      </aside>

      <main className="flex-grow min-w-0 flex flex-col">
        <header className="lg:hidden h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40"><button onClick={() => setSidebarOpen(true)} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl"><Menu size={28} /></button><h1 className="font-black text-slate-800 text-base">員工服務平台</h1><div className="w-11 h-11 bg-indigo-100 rounded-full"></div></header>
        <div className="flex-grow overflow-y-auto p-6 sm:p-10 lg:p-14 scroll-smooth">
          <div className="max-w-5xl mx-auto space-y-14">
            {activeMenu === 'overtime' ? ( <OvertimeView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={overtimeAppType} setAppType={setOvertimeAppType} /> ) : activeMenu === 'leave' ? ( <LeaveView records={records} setRecords={setRecords} today={today} currentSerialId={currentSerialId} appType={leaveAppType} setAppType={setLeaveAppType} /> ) : activeMenu === 'query' ? ( <QueryCenterView records={records} getStatusBadge={getStatusBadge} /> ) : ( <PersonnelManagementView employees={employees} setEmployees={setEmployees} requestDelete={requestDelete} /> )}
            
            {activeMenu !== 'query' && activeMenu !== 'personnel' && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between"><h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><History className="w-6 h-6 text-indigo-500" />{((activeMenu === 'overtime' && overtimeAppType === 'approve') || (activeMenu === 'leave' && leaveAppType === 'approve')) ? '歷史簽核紀錄' : '歷史申請紀錄'}<span className="ml-3 bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-full">{filteredHistory.length} 筆</span></h2></div>
                <div className="overflow-x-auto">
                  {filteredHistory.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead><tr className="bg-slate-50/50"><th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">編號 / 類型</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">申請資訊</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">時間</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">時數/天</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">狀態</th><th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">簽核意見</th><th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-base">
                        {filteredHistory.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-8 py-7"><div className="font-black font-mono text-slate-700">{record.serialId || '---'}</div><div className={`mt-2 inline-flex text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${record.formType === '加班' ? (record.appType === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600') : 'bg-teal-100 text-teal-600'}`}>{record.formType === '加班' ? (record.appType === 'pre' ? '事前申請' : '事後補報') : record.formType}</div></td>
                            <td className="px-6 py-7"><div className="text-base font-bold text-slate-800">{record.name}</div><div className="text-xs text-slate-400 font-medium mt-1">{record.empId}</div></td>
                            <td className="px-6 py-7 text-sm text-slate-500 font-medium"><div>{record.startDate} {record.startHour ? `${record.startHour}:${record.startMin}` : ''}</div><div className="opacity-50 mt-1 text-xs">至 {record.endDate} {record.endHour ? `${record.endHour}:${record.endMin}` : ''}</div></td>
                            <td className="px-6 py-7 text-center"><div className="text-base font-black text-slate-700 bg-slate-100 inline-block px-4 py-2 rounded-xl">{record.totalHours} HR</div></td>
                            <td className="px-6 py-7 text-center">{getStatusBadge(record.status)}</td>
                            <td className="px-6 py-7">{record.comment ? <div className="text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{record.comment}</div> : <span className="text-xs text-slate-300 italic">尚未填寫意見</span>}</td>
                            <td className="px-8 py-7 text-right"><button onClick={() => requestDelete(record.id, 'record')} className="p-3 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 shadow-sm"><Trash2 size={20} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : ( <div className="py-24 flex flex-col items-center justify-center text-slate-300"><ListChecks size={60} className="mb-5 opacity-10" /><p className="text-lg font-bold opacity-30 tracking-widest">尚無紀錄</p></div> )}
                </div>
              </div>
            )}
            <footer className="text-center opacity-30 pb-6"><p className="text-xs font-black uppercase tracking-[0.4em]">HR Management System 2.0</p></footer>
          </div>
        </div>
      </main>

      {deleteConfirm.show && ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"><div className="p-10 text-center"><div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-rose-500 w-10 h-10" /></div><h3 className="text-2xl font-black text-slate-800 mb-3">確認刪除{deleteConfirm.type === 'record' ? '紀錄' : '人員'}？</h3><p className="text-base text-slate-500 font-medium leading-relaxed">此操作無法撤銷，您確定要將這項{deleteConfirm.type === 'record' ? '申請紀錄' : '人員資料'}從系統中永久移除嗎？</p></div><div className="bg-slate-50 p-6 flex gap-4"><button onClick={() => setDeleteConfirm({ show: false, id: null, type: 'record' })} className="flex-1 py-4 px-6 bg-white border border-slate-200 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm">取消返回</button><button onClick={executeDelete} className="flex-1 py-4 px-6 bg-rose-500 rounded-2xl text-base font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95">確認刪除</button></div></div></div> )}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"></div>}
    </div>
  );
};

export default App;