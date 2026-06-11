import { Wallet, TrendingUp, TrendingDown, Filter, Repeat, MoreHorizontal, Camera, FileText, Tag, X, CheckCircle2, PieChart, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { Budget } from '../store/PlannerContext';

interface Expense {
  id: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Health' | 'Other';
  note: string;
  date: string;
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  receiptImage?: string;
  isTaxDeductible: boolean;
}

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-500',
  Transport: 'bg-blue-500',
  Shopping: 'bg-pink-500',
  Bills: 'bg-purple-500',
  Health: 'bg-red-500',
  Other: 'bg-slate-500',
};

export default function Expenses() {
  const { budgets, updateBudget } = usePlanner();
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', amount: 84.50, category: 'Food', note: 'Groceries at Whole Foods', date: 'Oct 15', isRecurring: false, isTaxDeductible: false },
    { id: '2', amount: 23.00, category: 'Transport', note: 'Uber to Meeting', date: 'Oct 14', isRecurring: false, isTaxDeductible: true },
    { id: '3', amount: 120.00, category: 'Shopping', note: 'New Sneakers', date: 'Oct 14', isRecurring: false, isTaxDeductible: false },
    { id: '4', amount: 450.00, category: 'Bills', note: 'Rent Component', date: 'Oct 13', isRecurring: true, frequency: 'monthly', isTaxDeductible: true },
    { id: '5', amount: 215.00, category: 'Shopping', note: 'Gaming Monitor', date: 'Oct 10', isRecurring: false, isTaxDeductible: false },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'tax' | 'budgets'>('all');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Other',
    isRecurring: false,
    frequency: 'monthly',
    isTaxDeductible: false,
  });

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const totals = {
    income: 4200,
    expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    taxDeductible: expenses.filter(e => e.isTaxDeductible).reduce((sum, e) => sum + e.amount, 0),
    taxReceiptsCount: expenses.filter(e => e.isTaxDeductible && e.receiptImage).length,
    totalBudget: budgets.reduce((sum, b) => sum + b.limit, 0),
  };

  const budgetUsagePercent = Math.round((totals.expenses / totals.totalBudget) * 100);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewExpense({ ...newExpense, receiptImage: reader.result as string });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(newExpense.amount) || 0,
      category: (newExpense.category as any) || 'Other',
      note: newExpense.note || '',
      date: newExpense.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isRecurring: !!newExpense.isRecurring,
      frequency: newExpense.frequency,
      isTaxDeductible: !!newExpense.isTaxDeductible,
      receiptImage: newExpense.receiptImage,
    };
    setExpenses([expense, ...expenses]);
    setNewExpense({
      category: 'Other',
      isRecurring: false,
      frequency: 'monthly',
      isTaxDeductible: false,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getCategorySpending = (category: string) => {
    return expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
  };

  const getProgressBarColor = (percent: number) => {
    if (percent <= 50) return 'from-green-500 to-green-600';
    if (percent <= 80) return 'from-yellow-400 to-yellow-500';
    if (percent <= 100) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const filteredExpenses = activeTab === 'all' 
    ? expenses 
    : activeTab === 'receipts'
    ? expenses.filter(e => e.receiptImage)
    : activeTab === 'tax'
    ? expenses.filter(e => e.isTaxDeductible)
    : [];

  return (
    <div className="flex flex-col h-full space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Financial Hub</h2>
          <p className="text-slate-500 font-bold mt-1">October 2025 Overview</p>
        </div>
        <div className="flex bg-[#16191e] p-1 rounded-2xl border border-slate-800/50 shadow-inner">
          {['all', 'receipts', 'tax', 'budgets'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Monthly Budget Summary Card */}
        <div className="bg-[#16191e] p-6 rounded-[2rem] border border-blue-500/30 shadow-xl relative overflow-hidden group ring-1 ring-blue-500/20 md:col-span-1">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Monthly Budget</p>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><PieChart className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-slate-100 relative z-10">${totals.expenses.toLocaleString()} <span className="text-slate-500 text-sm font-bold">/ ${totals.totalBudget.toLocaleString()}</span></p>
          <div className="mt-4 relative z-10">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressBarColor(budgetUsagePercent)}`} 
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-2">
              Used {budgetUsagePercent}% of your monthly limit
            </p>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:rotate-12 transition-transform">
            <PieChart className="w-20 h-20 text-blue-500" />
          </div>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Income</p>
            <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-green-500 relative z-10">${totals.income.toLocaleString()}</p>
          <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-20 h-20" />
          </div>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Expenses</p>
            <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-red-400 relative z-10">${totals.expenses.toLocaleString()}</p>
          <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-20 h-20" />
          </div>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Balance</p>
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600"><Wallet className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-slate-100 relative z-10">${(totals.income - totals.expenses).toLocaleString()}</p>
          <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
            <Wallet className="w-20 h-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area (List or Budgets) */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'budgets' ? (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
               <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-100 tracking-tight flex items-center uppercase text-xs tracking-[0.2em]">
                  <PieChart className="w-4 h-4 mr-2 text-blue-500" /> Monthly Budgets
                </h3>
                <button 
                  onClick={() => {
                    setEditingBudget(budgets[0]);
                    setShowBudgetModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center"
                >
                  <Edit3 className="w-3 h-3 mr-2" /> Set Budgets
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map(budget => {
                  const spent = getCategorySpending(budget.category);
                  const percent = Math.round((spent / budget.limit) * 100);
                  const isNearLimit = percent >= 80 && percent < 100;
                  const isOverLimit = percent >= 100;

                  return (
                    <div key={budget.category} className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl group hover:border-slate-700/50 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${categoryColors[budget.category as keyof typeof categoryColors]}`}></div>
                          <span className="font-black text-slate-200 uppercase text-xs tracking-widest">{budget.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-500">${spent.toFixed(0)} / ${budget.limit}</span>
                          <button 
                            onClick={() => {
                              setEditingBudget(budget);
                              setShowBudgetModal(true);
                            }} 
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-500 transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressBarColor(percent)}`} 
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-slate-600'}`}>
                            {percent}% of budget
                          </p>
                          {isOverLimit && (
                            <div className="flex items-center text-[10px] font-black text-red-500 uppercase tracking-tighter animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" /> Over by ${(spent - budget.limit).toFixed(0)}
                            </div>
                          )}
                          {isNearLimit && (
                            <div className="flex items-center text-[10px] font-black text-orange-500 uppercase tracking-tighter">
                              <AlertCircle className="w-3 h-3 mr-1" /> Subtle Warning
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-100 tracking-tight flex items-center uppercase text-xs tracking-[0.2em]">
                  {activeTab === 'all' ? 'Recent Transactions' : activeTab === 'receipts' ? 'Scanned Receipts' : 'Tax-Relevant Entries'}
                </h3>
                <button className="text-[10px] font-black text-slate-500 hover:text-slate-300 flex items-center space-x-1 uppercase tracking-widest">
                  <Filter className="w-3 h-3" />
                  <span>Filter</span>
                </button>
              </div>
              <div className="space-y-3">
                {filteredExpenses.map(expense => (
                  <div 
                    key={expense.id} 
                    className="bg-[#16191e] p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-blue-600/30 transition-all cursor-pointer relative overflow-hidden shadow-lg shadow-black/10"
                    onClick={() => expense.receiptImage && setSelectedReceipt(expense.receiptImage)}
                  >
                    {expense.isTaxDeductible && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-[8px] font-black text-white uppercase tracking-tighter rounded-bl-xl shadow-md">
                        Tax Deductible
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${categoryColors[expense.category]} shadow-sm`} style={{ boxShadow: `0 0 10px ${categoryColors[expense.category].split('-')[1]}` }}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-black text-slate-100">{expense.note}</p>
                          {expense.receiptImage && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expense.date} • {expense.category}</p>
                          {expense.isRecurring && <Repeat className="w-3 h-3 text-blue-600/50" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm font-black text-slate-100">${expense.amount.toFixed(2)}</p>
                      <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Expense Form */}
        <div className="space-y-6">
          <div className="bg-[#16191e] p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
            <h3 className="text-xl font-black text-slate-100 tracking-tight mb-8 uppercase text-sm tracking-[0.2em] text-blue-500">
              New Transaction
            </h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.amount || ''}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.valueAsNumber})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Category</label>
                  <select 
                    value={newExpense.category}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none"
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  >
                    <option value="Other">Other</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block text-center">Tax</label>
                  <div 
                    onClick={() => setNewExpense({...newExpense, isTaxDeductible: !newExpense.isTaxDeductible})}
                    className={`w-full py-4 px-4 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${newExpense.isTaxDeductible ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10' : 'bg-slate-800 border-slate-700/50 text-slate-500'}`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mr-2 ${newExpense.isTaxDeductible ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{newExpense.isTaxDeductible ? 'Deductible' : 'Personal'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Receipt</label>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Take Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Upload File"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div 
                  className={`relative w-full aspect-video rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group ${newExpense.receiptImage ? 'border-blue-600/50 bg-blue-600/5' : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'}`}
                >
                  {newExpense.receiptImage ? (
                    <>
                      <img src={newExpense.receiptImage} alt="Receipt Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-4">
                        <button type="button" onClick={() => setNewExpense({...newExpense, receiptImage: undefined})} className="p-3 bg-red-600 rounded-full text-white hover:scale-110 transition-transform">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processing...</p>
                        </div>
                      ) : (
                        <div className="text-center p-6 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                          <Camera className="w-10 h-10 text-slate-800 mb-3" />
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                            Click to scan or<br />drag & drop receipt
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <input 
                  type="file" 
                  ref={cameraInputRef}
                  className="hidden" 
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:scale-[0.99] active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xs"
              >
                Save Entry
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Budget Setting Modal */}
      {showBudgetModal && editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#16191e] w-full max-w-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowBudgetModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase tracking-widest">Set Budgets</h3>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {budgets.map(b => (
                <div key={b.category} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${categoryColors[b.category as keyof typeof categoryColors]}`}></div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.category}</label>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                      type="number"
                      defaultValue={b.limit}
                      onChange={(e) => updateBudget(b.category, Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-10 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowBudgetModal(false)}
              className="w-full mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center"
            >
              Confirm Budgets <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-md">
          <div className="relative max-w-4xl w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-12 right-0 text-white hover:text-blue-500 flex items-center space-x-2 font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              <X className="w-6 h-6" />
              <span>Close Viewer</span>
            </button>
            <div className="flex-1 bg-[#1a1a2e] rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center p-12 ring-1 ring-white/5">
              <img src={selectedReceipt} alt="Full Receipt" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
            </div>
            <div className="mt-8 flex justify-center space-x-6">
              <button className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] flex items-center border border-slate-700">
                <Tag className="w-4 h-4 mr-3 text-purple-500" /> Mark as Personal
              </button>
              <button className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center scale-110">
                <FileText className="w-5 h-5 mr-3" /> Export PDF for Taxes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
