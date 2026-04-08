import React, { useState, useMemo } from 'react';
import { Clock, User, Hash, FileText, Calendar, CheckCircle2, AlertCircle, ChevronRight, Timer, Coins, Info } from 'lucide-react';

const App = () => {
  const [appType, setAppType] = useState('pre'); // 'pre' for 事前, 'post' for 事後
  
  // 初始化日期為今天
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    category: 'regular',
    compensationType: 'leave', // 預設為補休
    startDate: today,
    startHour: '09',
    startMin: '00',
    endDate: today,
    endHour: '18',
    endMin: '00',
    reason: '',
  });
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

  // 產生 00-23 的小時選項
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // 分鐘僅限 00 與 30
  const minutes = ['00', '30'];

  // 自動計算工時數
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
    
    // 當開始日期變動時，同步更新結束日期
    if (name === 'startDate') {
      setFormData(prev => ({ 
        ...prev, 
        startDate: value,
        endDate: value // 同步日期
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalHours <= 0) return;
    
    console.log('提交數據:', { ...formData, appType, totalHours });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="bg-indigo-600 px-6 py-8 text-white text-center">
            <h1 className="text-2xl font-bold tracking-tight">加班申請系統</h1>
            <p className="mt-2 text-indigo-100 opacity-90 text-sm">請填寫下方資訊以完成申請程序</p>
          </div>

          {/* Type Selector Section */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setAppType('pre')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'pre' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                事前加班申請
              </button>
              <button
                onClick={() => setAppType('post')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'post' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                事後加班補報
              </button>
            </div>

            {/* Hint Box (Dynamic Top Hint) */}
            <div className={`mt-4 flex items-start p-4 rounded-xl border transition-all duration-300 ${
              appType === 'pre' 
              ? 'bg-blue-50 border-blue-100' 
              : 'bg-amber-50 border-amber-100'
            }`}>
              <AlertCircle className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                appType === 'pre' ? 'text-blue-500' : 'text-amber-500'
              }`} />
              <p className={`text-xs leading-relaxed font-medium ${
                appType === 'pre' ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {appType === 'pre' 
                  ? '【事前申請須知】請於加班日 24 小時前提出申請，並確保已與單位主管達成初步共識。'
                  : '【事後補報須知】補報僅限突發緊急狀況，請於事後 3 個工作天內完成，並備妥相關工作證明備查。'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <User className="w-4 h-4 mr-2 text-indigo-500" />
                  姓名
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="請輸入姓名"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Hash className="w-4 h-4 mr-2 text-indigo-500" />
                  員工編號
                </label>
                <input
                  type="text"
                  name="empId"
                  required
                  placeholder="例如: EMP001"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                  value={formData.empId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Time Selection Slots */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Clock className="w-4 h-4 mr-2 text-emerald-500" />
                  開始時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date"
                    name="startDate"
                    className="px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer bg-white w-full h-[46px]"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  <div className="flex space-x-2 sm:col-span-2">
                    <select
                      name="startHour"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                      value={formData.startHour}
                      onChange={handleInputChange}
                    >
                      {hours.map(h => <option key={h} value={h}>{h} 點</option>)}
                    </select>
                    <select
                      name="startMin"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                      value={formData.startMin}
                      onChange={handleInputChange}
                    >
                      {minutes.map(m => <option key={m} value={m}>{m} 分</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Clock className="w-4 h-4 mr-2 text-rose-500" />
                  結束時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date"
                    name="endDate"
                    className="px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer bg-white w-full h-[46px]"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                  <div className="flex space-x-2 sm:col-span-2">
                    <select
                      name="endHour"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                      value={formData.endHour}
                      onChange={handleInputChange}
                    >
                      {hours.map(h => <option key={h} value={h}>{h} 點</option>)}
                    </select>
                    <select
                      name="endMin"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                      value={formData.endMin}
                      onChange={handleInputChange}
                    >
                      {minutes.map(m => <option key={m} value={m}>{m} 分</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Row: Category, Compensation Type, and Total Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                  加班類別
                </label>
                <select
                  name="category"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Coins className="w-4 h-4 mr-2 text-amber-500" />
                  補償方式
                </label>
                <select
                  name="compensationType"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer h-[46px]"
                  value={formData.compensationType}
                  onChange={handleInputChange}
                >
                  {compensationTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Timer className="w-4 h-4 mr-2 text-indigo-500" />
                  系統計算總時數
                </label>
                <div className="h-[46px] bg-indigo-50/50 px-5 rounded-xl border border-dashed border-indigo-200 flex items-center justify-between">
                  <div className="flex items-baseline space-x-1 ml-auto">
                    <span className={`text-2xl font-black ${totalHours > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {totalHours}
                    </span>
                    <span className="text-xs font-bold text-indigo-400">小時</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Warning for invalid time */}
            {totalHours <= 0 && (
              <div className="flex items-center text-rose-500 text-xs mt-1 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>無效的時間設定：結束時間必須晚於開始時間</span>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-slate-700">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                加班事由
              </label>
              <textarea
                name="reason"
                rows="3"
                required
                placeholder="請詳細描述加班原因與工作內容..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none bg-white"
                value={formData.reason}
                onChange={handleInputChange}
              />
            </div>

            {/* NEW: Regulations Reminder (Below Reason) */}
            <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center text-slate-700 font-bold text-sm mb-1">
                <Info className="w-4 h-4 mr-2 text-slate-500" />
                加班申請規範提醒
              </div>
              <ul className="space-y-2.5">
                {[
                  "A. 加班申請須事前由直屬主管核准，始得進行加班，並於事後呈主管審核確認。",
                  "B. 此單由各部門編序號並於加班後七個工作日內交至財務行政部辦理，逾期不受理。",
                  "C. 此加班工時將依比率換算為補休時數或薪資。",
                  "D. 每月加班時數上限不得超過 46 小時。"
                ].map((item, index) => (
                  <li key={index} className="flex text-xs text-slate-600 leading-relaxed">
                    <span className="mr-1.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              {/* Overtime limit warning (Bonus UI) */}
              {totalHours > 46 && (
                <div className="mt-2 flex items-center text-red-600 text-[10px] font-bold bg-red-50 p-1.5 rounded border border-red-100 animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  警告：當前計算時數已超過每月 46 小時上限規範！
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitted || totalHours <= 0}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${
                submitted 
                ? 'bg-emerald-500 shadow-emerald-100' 
                : totalHours <= 0 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>提交成功！</span>
                </>
              ) : (
                <>
                  <span>立即提交申請</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © 2024 企業內部管理系統 · 員工自助服務平台
        </p>
      </div>
    </div>
  );
};

export default App;