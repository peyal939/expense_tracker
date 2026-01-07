import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Plus, TrendingUp, TrendingDown, Wallet, CreditCard, Coffee, ShoppingBag, Car, Home, Utensils, Zap, MoreHorizontal, ChevronRight, Search, Bell, X } from 'lucide-react';

const categories = [
  { id: 'food', name: 'Food & Dining', icon: Utensils, color: '#f97316' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#8b5cf6' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#3b82f6' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: '#eab308' },
  { id: 'housing', name: 'Housing', icon: Home, color: '#22c55e' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: '#a855f7' },
];

const initialExpenses = [
  { id: 1, name: 'Grocery Store', category: 'food', amount: 85.50, date: '2025-01-06' },
  { id: 2, name: 'Uber Ride', category: 'transport', amount: 24.00, date: '2025-01-06' },
  { id: 3, name: 'Electric Bill', category: 'utilities', amount: 120.00, date: '2025-01-05' },
  { id: 4, name: 'Coffee Shop', category: 'coffee', amount: 6.50, date: '2025-01-05' },
  { id: 5, name: 'Amazon Purchase', category: 'shopping', amount: 156.99, date: '2025-01-04' },
  { id: 6, name: 'Restaurant', category: 'food', amount: 65.00, date: '2025-01-04' },
  { id: 7, name: 'Gas Station', category: 'transport', amount: 45.00, date: '2025-01-03' },
  { id: 8, name: 'Monthly Rent', category: 'housing', amount: 1500.00, date: '2025-01-01' },
];

const weeklyData = [
  { day: 'Mon', amount: 120 },
  { day: 'Tue', amount: 85 },
  { day: 'Wed', amount: 200 },
  { day: 'Thu', amount: 45 },
  { day: 'Fri', amount: 180 },
  { day: 'Sat', amount: 250 },
  { day: 'Sun', amount: 90 },
];

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', category: 'food', amount: '' });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyBudget = 3500;
  const remainingBudget = monthlyBudget - totalExpenses;
  const budgetPercentage = (totalExpenses / monthlyBudget) * 100;

  const categoryTotals = categories.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0);

  const pieData = categoryTotals.map(cat => ({
    name: cat.name,
    value: cat.total,
    color: cat.color
  }));

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      setExpenses([
        { 
          id: Date.now(), 
          ...newExpense, 
          amount: parseFloat(newExpense.amount),
          date: new Date().toISOString().split('T')[0]
        },
        ...expenses
      ]);
      setNewExpense({ name: '', category: 'food', amount: '' });
      setShowAddModal(false);
    }
  };

  const getCategoryInfo = (categoryId) => categories.find(c => c.id === categoryId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div>
          <h1 className="text-xl font-semibold">Expense Tracker</h1>
          <p className="text-slate-400 text-sm">January 2025</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <Search size={20} className="text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors relative">
            <Bell size={20} className="text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-semibold">
            S
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Spent Card */}
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <Wallet size={18} />
                <span className="text-sm font-medium">Total Spent</span>
              </div>
              <p className="text-3xl font-bold">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <TrendingUp size={16} />
                <span>12% vs last month</span>
              </div>
            </div>
          </div>

          {/* Budget Card */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CreditCard size={18} />
              <span className="text-sm font-medium">Monthly Budget</span>
            </div>
            <p className="text-3xl font-bold">${monthlyBudget.toLocaleString()}</p>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Used</span>
                <span className={budgetPercentage > 80 ? 'text-rose-400' : 'text-emerald-400'}>{budgetPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${budgetPercentage > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Remaining Card */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <TrendingDown size={18} />
              <span className="text-sm font-medium">Remaining</span>
            </div>
            <p className={`text-3xl font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${remainingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-sm mt-2">25 days left in January</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Spending Chart */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Weekly Spending</h3>
              <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">View All</button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value) => [`$${value}`, 'Spent']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">By Category</h3>
              <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">Details</button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryTotals.slice(0, 4).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-sm text-slate-300">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium">${cat.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="font-semibold">Recent Transactions</h3>
            <button className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              See All <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {expenses.slice(0, 6).map(expense => {
              const category = getCategoryInfo(expense.category);
              const Icon = category.icon;
              return (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon size={22} style={{ color: category.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <p className="text-sm text-slate-500">{category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-${expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{expense.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all"
      >
        <Plus size={24} />
      </button>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold">Add Expense</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  placeholder="What did you spend on?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          newExpense.category === cat.id 
                            ? 'border-violet-500 bg-violet-500/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Icon size={20} style={{ color: cat.color }} />
                        <span className="text-xs text-slate-300">{cat.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-800">
              <button
                onClick={handleAddExpense}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
