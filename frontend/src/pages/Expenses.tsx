import { Wallet, TrendingUp, TrendingDown, Filter, Repeat, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Expense {
  id: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Health' | 'Other';
  note: string;
  date: string;
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-500',
  Transport: 'bg-blue-500',
  Shopping: 'bg-pink-500',
  Bills: 'bg-purple-500',
  Health: 'bg-red-500',
  Other: 'bg-slate-500',
};

const barData = [40, 60, 30, 80, 50, 90, 45, 70, 35, 65, 40, 55, 30, 85, 45, 60, 40, 75, 50, 40, 30, 95, 60, 45, 50];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', amount: 84.50, category: 'Food', note: 'Groceries at Whole Foods', date: 'Oct 15', isRecurring: false },
    { id: '2', amount: 23.00, category: 'Transport', note: 'Uber', date: 'Oct 14', isRecurring: false },
    { id: '3', amount: 120.00, category: 'Shopping', note: 'New Sneakers', date: 'Oct 14', isRecurring: false },
    { id: '4', amount: 450.00, category: 'Bills', note: 'Rent Component', date: 'Oct 13', isRecurring: true, frequency: 'monthly' },
  ]);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Other',
    isRecurring: false,
    frequency: 'monthly',
  });

  const totals = {
    income: 4200,
    expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(newExpense.amount) || 0,
      category: newExpense.category as any,
      note: newExpense.note || '',
      date: newExpense.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isRecurring: !!newExpense.isRecurring,
      frequency: newExpense.frequency,
    };
    setExpenses([expense, ...expenses]);
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-slate-100 tracking-tight">October 2025</h2>
        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Income</p>
            <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-green-500">${totals.income.toLocaleString()}</p>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Expenses</p>
            <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-red-400">${totals.expenses.toLocaleString()}</p>
        </div>

        <div className="bg-[#16191e] p-6 rounded-3xl border border-slate-800/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Balance</p>
            <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600"><Wallet className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-slate-100">${(totals.income - totals.expenses).toLocaleString()}</p>
        </div>
      </div>

      {/* Spending Trend Bar Chart */}
      <div className="bg-[#16191e] p-8 rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8">Daily Spending Trend</h3>
        <div className="flex items-end justify-between h-32 gap-1 px-2">
          {barData.map((val, i) => (
            <div 
              key={i} 
              className="flex-1 bg-slate-800 rounded-t-sm relative group"
              style={{ height: `${val}%` }}
            >
              <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm"></div>
              {i % 4 === 0 && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Expense List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-100 tracking-tight flex items-center">
              Transactions
            </h3>
            <button className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center space-x-1 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              <span>Filter</span>
            </button>
          </div>
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="bg-[#16191e] p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-slate-700/50 transition-all cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[expense.category]}`}></div>
                  <div>
                    <p className="text-sm font-black text-slate-100">{expense.note}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{expense.date} • {expense.category}</p>
                      {expense.isRecurring && <Repeat className="w-3 h-3 text-blue-600/50" />}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-100">${expense.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="space-y-6">
          <div className="bg-[#16191e] p-8 rounded-3xl border border-slate-800/50 shadow-xl">
            <h3 className="text-xl font-black text-slate-100 tracking-tight mb-8">Add Entry</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.valueAsNumber})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Category</label>
                <select 
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Note</label>
                <textarea 
                  placeholder="What was it for?"
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl py-4 px-4 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all h-24 resize-none"
                  onChange={(e) => setNewExpense({...newExpense, note: e.target.value})}
                ></textarea>
              </div>

              <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${newExpense.isRecurring ? 'bg-blue-600' : 'bg-slate-700'}`}
                    onClick={() => setNewExpense({...newExpense, isRecurring: !newExpense.isRecurring})}
                  >
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${newExpense.isRecurring ? 'left-5' : 'left-1'}`}></div>
                  </div>
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Recurring</span>
                </div>
                
                {newExpense.isRecurring && (
                  <select 
                    className="bg-transparent text-[10px] font-black text-blue-600 uppercase tracking-widest focus:outline-none"
                    value={newExpense.frequency}
                    onChange={(e) => setNewExpense({...newExpense, frequency: e.target.value as any})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-slate-950 py-5 rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:scale-[0.99] active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-sm"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
