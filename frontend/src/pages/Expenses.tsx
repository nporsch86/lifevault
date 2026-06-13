import { Wallet, TrendingUp, TrendingDown, Filter, Repeat, MoreHorizontal, Camera, FileText, Tag, X, CheckCircle2, PieChart, AlertCircle, Edit3, ArrowRight, Target, Calendar, Clock } from 'lucide-react';
import { useState, useRef } from 'react';
import { usePlanner } from '../store/PlannerContext';
import type { Budget, Expense, SavingsGoal } from '../store/PlannerContext';

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-500',
  Transport: 'bg-blue-500',
  Shopping: 'bg-pink-500',
  Bills: 'bg-purple-500',
  Health: 'bg-red-500',
  Other: 'bg-slate-500',
};

export default function Expenses() {
  const { budgets, updateBudget, addBudget, expenses, addExpense, goals, addGoal, categories, addCategory } = usePlanner();

  const [activeTab, setActiveTab] = useState<'all' | 'receipts' | 'tax' | 'budgets' | 'goals' | 'recurring'>('all');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Other',
    isRecurring: false,
    frequency: 'monthly',
    isTaxDeductible: false,
    autoGenerate: false,
  });

  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    targetAmount: 0,
    currentAmount: 0,
    category: 'Other',
    icon: '🎯',
  });

  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦', color: '#6B7280' });
  const [newLimit, setNewLimit] = useState(0);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getCategoryColor = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.color || '#6B7280';
  };

  const getCategoryIcon = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.icon || '📦';
  };

  const totals = {
    income: 4200,
    expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    taxDeductible: expenses.filter(e => e.isTaxDeductible).reduce((sum, e) => sum + e.amount, 0),
    taxReceiptsCount: expenses.filter(e => e.isTaxDeductible && e.receiptImage).length,
    totalBudget: budgets.reduce((sum, b) => sum + b.limit + (b.rollover || 0), 0),
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
      category: newExpense.category || 'Other',
      note: newExpense.note || '',
      date: newExpense.date || new Date().toISOString().split('T')[0],
      dueDate: newExpense.dueDate,
      withdrawalDate: newExpense.withdrawalDate,
      isRecurring: !!newExpense.isRecurring,
      frequency: newExpense.frequency,
      isTaxDeductible: !!newExpense.isTaxDeductible,
      receiptImage: newExpense.receiptImage,
      autoGenerate: newExpense.autoGenerate,
    };
    addExpense(expense);
    setNewExpense({
      category: 'Other',
      isRecurring: false,
      frequency: 'monthly',
      isTaxDeductible: false,
      autoGenerate: false,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const goal: SavingsGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title: newGoal.title || 'Untitled Goal',
      targetAmount: Number(newGoal.targetAmount) || 0,
      currentAmount: Number(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline,
      category: newGoal.category || 'Other',
      icon: newGoal.icon || '🎯',
    };
    addGoal(goal);
    setNewGoal({
      targetAmount: 0,
      currentAmount: 0,
      category: 'Other',
      icon: '🎯',
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const catId = Math.random().toString(36).substr(2, 9);
    addCategory({
      id: catId,
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color
    });
    addBudget({
      category: newCategory.name,
      limit: newLimit,
      rollover: 0,
      rolloverEnabled: false
    });
    setShowAddCategory(false);
    setNewCategory({ name: '', icon: '📦', color: '#6B7280' });
    setNewLimit(0);
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
    : activeTab === 'recurring'
    ? expenses.filter(e => e.isRecurring)
    : [];

  const getDueStatus = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { label: `Overdue by ${Math.abs(diff)} days`, color: 'text-red-500 bg-red-500/10' };
    if (diff === 0) return { label: 'Due today', color: 'text-orange-500 bg-orange-500/10' };
    if (diff <= 3) return { label: `Due in ${diff} days`, color: 'text-orange-400 bg-orange-400/10' };
    return { label: `Due in ${diff} days`, color: 'text-slate-500 bg-slate-500/10' };
  };

  return (
    <div className="flex flex-col h-full space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-100 tracking-tight">Financial Hub</h2>
          <p className="text-slate-500 font-bold mt-1">October 2025 Overview</p>
        </div>
        <div className="flex bg-[#16191e] p-1 rounded-2xl border border-slate-800/50 shadow-inner overflow-x-auto">
          {['all', 'receipts', 'tax', 'recurring', 'budgets', 'goals'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'recurring' ? '🔁 Recurring' : tab}
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
            <div className="flex justify-between items-center mt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Used {budgetUsagePercent}% of limit
              </p>
              {budgets.some(b => b.rollover > 0) && (
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  incl. rollover
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:rotate-12 transition-transform">
            <PieChart className="w-20 h-20 text-blue-500" />
          </div>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Goals Progress</p>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><Target className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-slate-100 relative z-10">
            ${goals.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
          </p>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Savings Saved</p>
          <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform">
            <Target className="w-20 h-20" />
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
                  onClick={() => setShowBudgetModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center"
                >
                  <Edit3 className="w-3 h-3 mr-2" /> Manage Budgets
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map(budget => {
                  const spent = getCategorySpending(budget.category);
                  const totalLimit = budget.limit + (budget.rollover || 0);
                  const percent = Math.round((spent / totalLimit) * 100);
                  const isNearLimit = percent >= 80 && percent < 100;
                  const isOverLimit = percent >= 100;
                  const icon = getCategoryIcon(budget.category);
                  const color = getCategoryColor(budget.category);

                  return (
                    <div key={budget.category} className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl group hover:border-slate-700/50 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-800/50 flex items-center justify-center text-lg shadow-inner border border-white/5">
                            {icon}
                          </div>
                          <div>
                            <span className="font-black text-slate-200 uppercase text-xs tracking-widest block">{budget.category}</span>
                            {budget.rolloverEnabled && (
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Rollover On</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-200 block">${spent.toFixed(0)}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">of ${totalLimit}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5 relative">
                          {budget.rollover > 0 && (
                            <div 
                              className="absolute top-0 bottom-0 bg-emerald-500/20 border-r border-emerald-500/50 z-0" 
                              style={{ width: `${(budget.rollover / totalLimit) * 100}%` }}
                            ></div>
                          )}
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r relative z-10 ${getProgressBarColor(percent)}`} 
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-slate-600'}`}>
                            {percent}% of budget
                          </p>
                          {budget.rollover > 0 && (
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">
                              +${budget.rollover} rolled over
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div 
                  onClick={() => setShowAddCategory(true)}
                  className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 hover:bg-slate-800/30 transition-all cursor-pointer min-h-[160px]"
                >
                   <Tag className="w-8 h-8 text-slate-700" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add New Category</p>
                </div>
              </div>
            </div>
          ) : activeTab === 'goals' ? (
            <div className="space-y-6 animate-in slide-in-from-left duration-300">
               <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-100 tracking-tight flex items-center uppercase text-xs tracking-[0.2em]">
                  <Target className="w-4 h-4 mr-2 text-blue-500" /> Savings Goals
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  return (
                    <div key={goal.id} className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl group hover:border-slate-700/50 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-800/50 flex items-center justify-center text-lg shadow-inner border border-white/5">
                            {goal.icon || '🎯'}
                          </div>
                          <span className="font-black text-slate-200 uppercase text-xs tracking-widest">{goal.title}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-200 block">${goal.currentAmount.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">target ${goal.targetAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-blue-600" 
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                            {percent}% Reached
                          </p>
                          {goal.deadline && (
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              By {goal.deadline}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div 
                  onClick={() => setShowGoalModal(true)}
                  className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 hover:bg-slate-800/30 transition-all cursor-pointer"
                >
                   <Target className="w-8 h-8 text-slate-700" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Add New Goal</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-slate-100 tracking-tight flex items-center uppercase text-xs tracking-[0.2em]">
                  {activeTab === 'all' ? 'Recent Transactions' : activeTab === 'receipts' ? 'Scanned Receipts' : activeTab === 'recurring' ? 'Recurring Expenses' : 'Tax-Relevant Entries'}
                </h3>
              </div>
              <div className="space-y-3">
                {filteredExpenses.map(expense => {
                  const dueStatus = expense.dueDate ? getDueStatus(expense.dueDate) : null;
                  const color = getCategoryColor(expense.category);
                  const icon = getCategoryIcon(expense.category);

                  return (
                    <div 
                      key={expense.id} 
                      className="bg-[#16191e] p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-blue-600/30 transition-all cursor-pointer relative overflow-hidden shadow-lg shadow-black/10"
                      onClick={() => expense.receiptImage && setSelectedReceipt(expense.receiptImage)}
                    >
                      {expense.isTaxDeductible && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-[8px] font-black text-white uppercase tracking-tighter rounded-bl-xl shadow-md">
                          Tax
                        </div>
                      )}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-lg shadow-inner border border-white/5">
                          {icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-black text-slate-100">{expense.note}</p>
                            {expense.autoGenerate && (
                              <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                🔁 Auto
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expense.date} • {expense.category}</p>
                            {dueStatus && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${dueStatus.color}`}>
                                {dueStatus.label}
                              </span>
                            )}
                            {expense.withdrawalDate && (
                              <span className="text-[8px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-slate-700/50">
                                WD: {expense.withdrawalDate}
                              </span>
                            )}
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
                  );
                })}
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
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none text-sm"
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block text-center">Tax</label>
                  <div 
                    onClick={() => setNewExpense({...newExpense, isTaxDeductible: !newExpense.isTaxDeductible})}
                    className={`w-full py-4 px-4 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${newExpense.isTaxDeductible ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10' : 'bg-slate-800 border-slate-700/50 text-slate-500'}`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mr-2 ${newExpense.isTaxDeductible ? 'text-purple-400' : 'text-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{newExpense.isTaxDeductible ? 'Tax' : 'Pers.'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Due By</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      value={newExpense.dueDate || ''}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-xs"
                      onChange={(e) => setNewExpense({...newExpense, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Taken On</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      value={newExpense.withdrawalDate || ''}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-xs"
                      onChange={(e) => setNewExpense({...newExpense, withdrawalDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${newExpense.isRecurring ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-700 text-slate-500'}`}>
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-200 uppercase tracking-widest">Recurring</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewExpense({...newExpense, isRecurring: !newExpense.isRecurring})}
                    className={`w-10 h-6 rounded-full transition-all relative ${newExpense.isRecurring ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newExpense.isRecurring ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
                {newExpense.isRecurring && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <select 
                      value={newExpense.frequency}
                      onChange={(e) => setNewExpense({...newExpense, frequency: e.target.value as any})}
                      className="bg-slate-700 border-none rounded-lg py-1 px-2 text-[10px] font-black text-blue-400 uppercase tracking-widest focus:ring-0"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Auto-Generate</span>
                      <button 
                        type="button"
                        onClick={() => setNewExpense({...newExpense, autoGenerate: !newExpense.autoGenerate})}
                        className={`w-8 h-4 rounded-full transition-all relative ${newExpense.autoGenerate ? 'bg-emerald-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${newExpense.autoGenerate ? 'left-4.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  </div>
                )}
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
                <div key={b.category} className="space-y-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs shadow-inner">
                        {getCategoryIcon(b.category)}
                      </div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.category}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Rollover</span>
                      <button 
                        type="button"
                        onClick={() => updateBudget(b.category, { rolloverEnabled: !b.rolloverEnabled })}
                        className={`w-8 h-4 rounded-full transition-all relative ${b.rolloverEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${b.rolloverEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                      <input 
                        type="number"
                        placeholder="Limit"
                        defaultValue={b.limit}
                        onChange={(e) => updateBudget(b.category, { limit: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-3 pl-7 pr-3 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-xs"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                      <input 
                        type="number"
                        placeholder="Rollover"
                        defaultValue={b.rollover}
                        onChange={(e) => updateBudget(b.category, { rollover: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-3 pl-7 pr-3 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-xs"
                      />
                    </div>
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

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#16191e] w-full max-w-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowAddCategory(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase tracking-widest">New Category</h3>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Category Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Entertainment"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-6 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block text-center">Emoji Icon</label>
                  <div className="grid grid-cols-4 gap-2 p-2 bg-slate-800 rounded-2xl border border-slate-700/50">
                    {['🍔', '🚗', '🛍️', '📄', '🏥', '📦', '🎮', '💡'].map(emoji => (
                      <button 
                        key={emoji}
                        type="button"
                        onClick={() => setNewCategory({...newCategory, icon: emoji})}
                        className={`p-2 rounded-lg text-lg transition-all ${newCategory.icon === emoji ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-700'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block text-center">Color Theme</label>
                  <div className="grid grid-cols-4 gap-2 p-2 bg-slate-800 rounded-2xl border border-slate-700/50">
                    {['#EF4444', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#6B7280', '#8B5CF6', '#06B6D4'].map(color => (
                      <button 
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({...newCategory, color})}
                        className={`w-6 h-6 rounded-full transition-all mx-auto ${newCategory.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={newLimit || ''}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center"
              >
                Create Category <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#16191e] w-full max-w-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowGoalModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-100 tracking-tight uppercase tracking-widest">New Savings Goal</h3>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddGoal(e); setShowGoalModal(false); }} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Travel Fund"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-6 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Target Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newGoal.targetAmount || ''}
                      onChange={(e) => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Current Savings</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newGoal.currentAmount || ''}
                      onChange={(e) => setNewGoal({...newGoal, currentAmount: Number(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Target Date (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="date" 
                    value={newGoal.deadline || ''}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Category</label>
                <select 
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none text-sm"
                >
                  {budgets.map(b => (
                    <option key={b.category} value={b.category}>{b.category}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center"
              >
                Create Goal <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
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
