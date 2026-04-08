import React, { useState, useMemo, useEffect } from 'react';
// 本地環境請確認執行：npm install lucide-react
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, Loader2 
} from 'lucide-react';

const App = () => {
  const [appType, setAppType] = useState('pre'); 
  const [records, setRecords] = useState([]);
  const today = new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    const saved = localStorage.getItem('overtime_records');
    if (saved) setRecords(JSON.parse(saved));
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setFormData(prev => ({ ...prev, startDate: value, endDate: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const newRecord = { ...formData, id: Date.now(), appType, totalHours, timestamp: new Date().toLocaleString() };
      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem('overtime_records', JSON.stringify(updated));
      setSubmitted(true);
      setSubmitting(false);
      setFormData(prev => ({ ...prev, reason: '' }));
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* Indigo Header */}
          <div className="bg-indigo-600 px-6 py-10 text-white text-center">
            <h1 className="text-3xl font-bold tracking-tight">加班申請系統</h1>
            <p className="mt-2 text-indigo-100 opacity-90 text-sm font-medium">企業正式版 · 員工自助服務</p>
          </div>

          {/* Toggle Buttons */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAppType('pre')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'pre' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                事前加班申請
              </button>
              <button
                type="button"
                onClick={() => setAppType('post')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'post' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                事後加班補報
              </button>
            </div>

            {/* Hint Box */}
            <div className={`mt-4 flex items-start p-4 rounded-xl border ${
              appType === 'pre' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed font-medium">
                {appType === 'pre' 
                  ? '【事前申請須知】請於加班日 24 小時前提出申請，並確保已與單位主管達成初步共識。'
                  : '【事後補報須知】補報僅限突發緊急狀況，請於事後 3 個工作天內完成。'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-4">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <User className="w-4 h-4 mr-2 text-indigo-500" /> 姓名
                </label>
                <input
                  type="text" name="name" required placeholder="請輸入姓名"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={formData.name} onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Hash className="w-4 h-4 mr-2 text-indigo-500" /> 員工編號
                </label>
                <input
                  type="text" name="empId" required placeholder="例如: EMP001"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={formData.empId} onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Time Selectors */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-emerald-600">
                  <Clock className="w-4 h-4 mr-2" /> 開始時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="date" name="startDate" className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm h-[46px]" value={formData.startDate} onChange={handleInputChange} />
                  <select name="startHour" className="border rounded-lg text-sm px-2 bg-white" value={formData.startHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}點</option>)}</select>
                  <select name="startMin" className="border rounded-lg text-sm px-2 bg-white" value={formData.startMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}分</option>)}</select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-rose-600">
                  <Clock className="w-4 h-4 mr-2" /> 結束時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="date" name="endDate" className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm h-[46px]" value={formData.endDate} onChange={handleInputChange} />
                  <select name="endHour" className="border rounded-lg text-sm px-2 bg-white" value={formData.endHour} onChange={handleInputChange}>{hours.map(h => <option key={h} value={h}>{h}點</option>)}</select>
                  <select name="endMin" className="border rounded-lg text-sm px-2 bg-white" value={formData.endMin} onChange={handleInputChange}>{minutes.map(m => <option key={m} value={m}>{m}分</option>)}</select>
                </div>
              </div>
            </div>

            {/* Config & Calc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">加班類別</label>
                <select name="category" className="w-full px-4 py-2 border rounded-lg h-[46px] bg-white" value={formData.category} onChange={handleInputChange}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">補償方式</label>
                <select name="compensationType" className="w-full px-4 py-2 border rounded-lg h-[46px] bg-white" value={formData.compensationType} onChange={handleInputChange}>
                  {compensationTypes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-dashed border-indigo-200 text-center h-[46px] flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-400 mr-2">總計</span>
                <span className="text-xl font-black text-indigo-600">{totalHours} <small className="text-[10px]">hr</small></span>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-slate-700">加班事由</label>
              <textarea name="reason" rows="3" required placeholder="詳細描述工作內容..." className="w-full p-4 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={formData.reason} onChange={handleInputChange}></textarea>
            </div>

            {/* Reminders */}
            <div className="bg-slate-100 p-5 rounded-xl space-y-2 text-xs text-slate-600">
               <div className="font-bold flex items-center mb-1"><Info className="w-4 h-4 mr-2" /> 提醒事項</div>
               <p>A. 加班須事前核准。 B. 七日內送件。 C. 依比例換算補休/薪資。 D. 上限 46 小時。</p>
            </div>

            <button type="submit" disabled={totalHours <= 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${submitted ? 'bg-emerald-500' : totalHours <= 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {submitted ? '提交成功！' : '立即提交申請'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;