import React, { useState, useMemo, useEffect } from 'react';
// 必須確保已安裝：npm install lucide-react
import { 
  Clock, User, Hash, FileText, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Timer, Coins, Info, ListChecks, Loader2 
} from 'lucide-react';

const App = () => {
  const [appType, setAppType] = useState('pre'); // 'pre' for 事前, 'post' for 事後
  const [records, setRecords] = useState([]);
  
  // 初始化日期為今天
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

  // 模擬載入紀錄
  useEffect(() => {
    const saved = localStorage.getItem('overtime_records');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
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

  // 自動計算總工時
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours <= 0 || submitting) return;
    
    setSubmitting(true);
    
    // 模擬網絡延遲
    setTimeout(() => {
      const newRecord = {
        ...formData,
        id: Date.now(),
        appType,
        totalHours,
        timestamp: new Date().toLocaleString()
      };

      const updatedRecords = [newRecord, ...records];
      setRecords(updatedRecords);
      localStorage.setItem('overtime_records', JSON.stringify(updatedRecords));
      
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
          <div className="bg-indigo-600 px-6 py-8 text-white text-center">
            <h1 className="text-2xl font-bold tracking-tight">加班申請系統</h1>
            <p className="mt-2 text-indigo-100 opacity-90 text-sm">企業正式版</p>
          </div>

          <div className="px-6 pt-6 pb-2">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAppType('pre')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'pre' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                事前加班申請
              </button>
              <button
                type="button"
                onClick={() => setAppType('post')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  appType === 'post' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                事後加班補報
              </button>
            </div>

            <div className={`mt-4 flex items-start p-4 rounded-xl border transition-all duration-300 ${
              appType === 'pre' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <AlertCircle className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${appType === 'pre' ? 'text-blue-500' : 'text-amber-500'}`} />
              <p className={`text-xs leading-relaxed font-medium ${appType === 'pre' ? 'text-blue-700' : 'text-amber-700'}`}>
                {appType === 'pre' 
                  ? '【事前申請須知】請於加班日 24 小時前提出申請，並確保已與單位主管達成初步共識。'
                  : '【事後補報須知】補報僅限突發緊急狀況，請於事後 3 個工作天內完成，並備妥相關證明。'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-4">
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

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-slate-700 text-emerald-600 font-bold">
                  <Clock className="w-4 h-4 mr-2" /> 開始時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date" name="startDate"
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]"
                    value={formData.startDate} onChange={handleInputChange}
                  />
                  <div className="flex space-x-2 sm:col-span-2">
                    <select name="startHour" className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.startHour} onChange={handleInputChange}>
                      {hours.map(h => <option key={h} value={h}>{h} 點</option>)}
                    </select>
                    <select name="startMin" className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.startMin} onChange={handleInputChange}>
                      {minutes.map(m => <option key={m} value={m}>{m} 分</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-slate-700 text-rose-600 font-bold">
                  <Clock className="w-4 h-4 mr-2" /> 結束時間 (24小時制)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date" name="endDate"
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]"
                    value={formData.endDate} onChange={handleInputChange}
                  />
                  <div className="flex space-x-2 sm:col-span-2">
                    <select name="endHour" className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.endHour} onChange={handleInputChange}>
                      {hours.map(h => <option key={h} value={h}>{h} 點</option>)}
                    </select>
                    <select name="endMin" className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.endMin} onChange={handleInputChange}>
                      {minutes.map(m => <option key={m} value={m}>{m} 分</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> 加班類別
                </label>
                <select name="category" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.category} onChange={handleInputChange}>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Coins className="w-4 h-4 mr-2 text-amber-500" /> 補償方式
                </label>
                <select name="compensationType" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white h-[46px]" value={formData.compensationType} onChange={handleInputChange}>
                  {compensationTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-700">
                  <Timer className="w-4 h-4 mr-2 text-indigo-500" /> 系統計算總時數
                </label>
                <div className="h-[46px] bg-indigo-50/50 px-5 rounded-xl border border-dashed border-indigo-200 flex items-center justify-between">
                  <span className={`text-2xl font-black ${totalHours > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {totalHours} <span className="text-xs font-bold text-indigo-400 ml-1">小時</span>
                  </span>
                </div>
              </div>
            </div>

            {totalHours > 46 && (
              <div className="flex items-center text-red-600 text-[11px] font-bold bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                <AlertCircle className="w-4 h-4 mr-2" />
                警告：目前計算時數已超過每月 46 小時法定上限！
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-slate-700">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> 加班事由
              </label>
              <textarea
                name="reason" rows="3" required placeholder="請詳細描述加班原因與工作內容..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
                value={formData.reason} onChange={handleInputChange}
              />
            </div>

            <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center text-slate-700 font-bold text-sm mb-1">
                <Info className="w-4 h-4 mr-2 text-slate-500" /> 加班申請規範提醒
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li>• A. 加班申請須事前由直屬主管核准，始得進行加班。</li>
                <li>• B. 此單於加班後七個工作日內交至財務行政部辦理，逾期不受理。</li>
                <li>• C. 此加班工時將依比率換算為補休時數或薪資。</li>
                <li>• D. 每月加班時數上限不得超過 46 小時。</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={submitting || submitted || totalHours <= 0}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${
                submitted ? 'bg-emerald-500 shadow-emerald-100' : submitting ? 'bg-indigo-400' : totalHours <= 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              {submitted ? (
                <> <CheckCircle2 className="w-5 h-5" /> <span>提交成功！</span> </>
              ) : submitting ? (
                <> <Loader2 className="w-5 h-5 animate-spin" /> <span>處理中...</span> </>
              ) : (
                <> <span>立即提交申請單</span> <ChevronRight className="w-4 h-4" /> </>
              )}
            </button>
          </form>
        </div>

        {/* 下方的申請紀錄區塊 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center text-slate-700 font-bold text-sm">
              <ListChecks className="w-5 h-5 mr-2 text-indigo-500" />
              本地申請紀錄 (儲存於瀏覽器)
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">目前尚無紀錄。</div>
            ) : (
              records.map((record) => (
                <div key={record.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{record.name}</span>
                      <span className="ml-2 text-[11px] text-slate-400">({record.empId})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {record.appType === 'pre' ? '事前' : '事後'} · {categories.find(c => c.id === record.category)?.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex space-x-4">
                    <span>📅 {record.startDate}</span>
                    <span>⏱️ {record.totalHours}hr</span>
                    <span className="text-amber-600 font-bold">{compensationTypes.find(t => t.id === record.compensationType)?.label}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded italic truncate">{record.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;