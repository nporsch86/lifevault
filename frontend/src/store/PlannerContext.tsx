import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Guest {
  email: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PlannerEvent {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: string;
  description?: string;
  amount?: number;
  isPaid?: boolean;
  meetingLink?: string;
  travelTime?: number; // duration in minutes
  location?: string;
  mapsLink?: string;
  guests?: Guest[];
  inviteStatus?: 'accepted' | 'declined' | 'pending';
  isHandwritten?: boolean;
  handwrittenData?: string; // base64 image data
}

export interface PlannerTask {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Budget {
  category: string;
  limit: number;
  rollover: number; // unused budget from previous month
  rolloverEnabled: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  icon?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  dueDate?: string; // for bills/expenses with separate due dates
  withdrawalDate?: string; // when the money actually leaves
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  receiptImage?: string;
  isTaxDeductible: boolean;
  autoGenerate?: boolean;
}

export interface SharedCalendar {
  id: string;
  name: string;
  owner: string;
  permission: 'view' | 'edit';
  status: 'pending' | 'accepted' | 'declined';
}

interface PlannerContextType {
  events: PlannerEvent[];
  tasks: PlannerTask[];
  budgets: Budget[];
  expenses: Expense[];
  goals: SavingsGoal[];
  categories: Category[];
  isPremium: boolean;
  sharedCalendars: SharedCalendar[];
  myShares: SharedCalendar[];
  allDayEvents: PlannerEvent[];
  addEvent: (event: PlannerEvent) => void;
  addAllDayEvent: (event: PlannerEvent) => void;
  updateEvent: (id: string, updates: Partial<PlannerEvent>) => void;
  addTask: (task: PlannerTask) => void;
  toggleTask: (id: string) => void;
  togglePaid: (eventId: string) => void;
  updateBudget: (category: string, updates: Partial<Budget>) => void;
  addBudget: (budget: Budget) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  addCategory: (category: Category) => void;
  setPremium: (premium: boolean) => void;
  respondToInvite: (eventId: string, status: 'accepted' | 'declined') => void;
  shareCalendar: (email: string, permission: 'view' | 'edit') => void;
  removeShare: (id: string) => void;
  respondToSharedCalendar: (id: string, status: 'accepted' | 'declined') => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('lifevault_budgets');
    return saved ? JSON.parse(saved) : [
      { category: 'Food', limit: 500, rollover: 0, rolloverEnabled: false },
      { category: 'Transport', limit: 200, rollover: 0, rolloverEnabled: false },
      { category: 'Shopping', limit: 300, rollover: 0, rolloverEnabled: false },
      { category: 'Bills', limit: 1500, rollover: 0, rolloverEnabled: false },
      { category: 'Health', limit: 150, rollover: 0, rolloverEnabled: false },
      { category: 'Other', limit: 100, rollover: 0, rolloverEnabled: false },
    ];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('lifevault_categories');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Food', icon: '🍔', color: '#EF4444' },
      { id: '2', name: 'Transport', icon: '🚗', color: '#3B82F6' },
      { id: '3', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
      { id: '4', name: 'Bills', icon: '📄', color: '#F59E0B' },
      { id: '5', name: 'Health', icon: '🏥', color: '#10B981' },
      { id: '6', name: 'Other', icon: '📦', color: '#6B7280' },
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('lifevault_expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', amount: 84.50, category: 'Food', note: 'Groceries at Whole Foods', date: '2025-10-15', isRecurring: false, isTaxDeductible: false },
      { id: '2', amount: 23.00, category: 'Transport', note: 'Uber to Meeting', date: '2025-10-14', isRecurring: false, isTaxDeductible: true },
      { id: '3', amount: 120.00, category: 'Shopping', note: 'New Sneakers', date: '2025-10-14', isRecurring: false, isTaxDeductible: false },
      { id: '4', amount: 450.00, category: 'Bills', note: 'Rent Component', date: '2025-10-13', isRecurring: true, frequency: 'monthly', isTaxDeductible: true },
      { id: '5', amount: 95.00, category: 'Bills', note: 'Water Bill', date: '2025-10-20', dueDate: '2025-10-20', isRecurring: false, isTaxDeductible: false },
      { id: '6', amount: 120.00, category: 'Bills', note: 'Internet Bill', date: '2025-10-25', dueDate: '2025-10-25', isRecurring: true, frequency: 'monthly', isTaxDeductible: false },
    ];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('lifevault_goals');
    return saved ? JSON.parse(saved) : [
      { id: 'g1', title: 'Emergency Fund', targetAmount: 5000, currentAmount: 1200, category: 'Other' },
      { id: 'g2', title: 'New Car', targetAmount: 25000, currentAmount: 3500, category: 'Transport' },
    ];
  });

  const [isPremium, setPremium] = useState(() => {
    return localStorage.getItem('lifevault_premium') === 'true';
  });

  const [events, setEvents] = useState<PlannerEvent[]>([
    { id: 'e1', title: 'Team Meeting', date: '2025-10-20', startTime: '10:00', endTime: '11:00', category: 'Work' },
    { id: 'e2', title: 'Dinner with Sarah', date: '2025-10-22', startTime: '19:00', category: 'Personal' },
    { id: 'e3', title: 'Doctor Appointment', date: '2025-10-24', startTime: '09:00', category: 'Important' },
    { id: 'e4', title: 'Project Review', date: '2025-10-08', startTime: '14:00', category: 'Work' },
    { id: 'e5', title: 'Birthday', date: '2025-10-15', category: 'Personal' },
    { id: 'e6', title: 'Confidential Sync', date: '2025-10-29', category: 'Confidential' },
    { id: 'e7', title: 'Quarterly Planning', date: '2025-10-20', category: 'Work' },
    { id: 'e8', title: 'Gym Session', date: '2025-10-20', category: 'Personal' },
    { id: 'e9', title: 'Client Call', date: '2025-10-01', category: 'Work' },
    { id: 'e10', title: 'Dentist', date: '2025-10-01', category: 'Important' },
    { id: 'b1', title: 'Electricity Bill', date: '2025-10-05', category: 'Bill', amount: 85.00, isPaid: true },
    { id: 'b2', title: 'Internet', date: '2025-10-12', category: 'Bill', amount: 60.00, isPaid: true },
    { id: 'b3', title: 'Rent Payment', date: '2025-10-01', category: 'Bill', amount: 1200.00, isPaid: true },
    { id: 'b4', title: 'Gym Membership', date: '2025-10-18', category: 'Bill', amount: 45.00, isPaid: false },
    { id: 'b5', title: 'Phone Bill', date: '2025-10-30', category: 'Bill', amount: 55.00, isPaid: false },
    { id: 'b6', title: 'AWS Cloud', date: '2025-10-27', category: 'Bill', amount: 12.50, isPaid: false },
    { 
      id: 'inv1', 
      title: 'Strategy Session', 
      date: '2025-10-29', 
      startTime: '13:00', 
      endTime: '14:30', 
      category: 'Work', 
      inviteStatus: 'pending',
      guests: [
        { email: 'jane@example.com', status: 'accepted' },
        { email: 'mark@example.com', status: 'pending' },
        { email: 'jamie@email.com', status: 'pending' }
      ]
    },
  ]);

  const [tasks, setTasks] = useState<PlannerTask[]>([
    { id: 't1', title: 'Finish proposal', date: '2025-10-01', completed: false, priority: 'high', category: 'Work' },
    { id: 't2', title: 'Buy milk', date: '2025-10-01', completed: true, priority: 'low', category: 'Personal' },
    { id: 't3', title: 'Email client', date: '2025-10-08', completed: true, priority: 'medium', category: 'Work' },
    { id: 't4', title: 'Prepare slides', date: '2025-10-20', completed: false, priority: 'high', category: 'Work' },
    { id: 't5', title: 'Book flight', date: '2025-10-20', completed: true, priority: 'medium', category: 'Personal' },
    { id: 't6', title: 'Call mom', date: '2025-10-29', completed: false, priority: 'low', category: 'Personal' },
  ]);

  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([
    { id: 'sc1', name: 'Work Project', owner: 'sarah@example.com', permission: 'view', status: 'pending' },
  ]);

  const [myShares, setMyShares] = useState<SharedCalendar[]>([
    { id: 'ms1', name: 'Personal Planner', owner: 'jamie@email.com', permission: 'edit', status: 'accepted' },
  ]);

  const [allDayEvents, setAllDayEvents] = useState<PlannerEvent[]>(() => {
    const saved = localStorage.getItem('lifevault_allday_events');
    return saved ? JSON.parse(saved) : [];
  });

  const addEvent = (event: PlannerEvent) => setEvents([...events, event]);
  
  const addAllDayEvent = (event: PlannerEvent) => {
    const updated = [...allDayEvents, event];
    setAllDayEvents(updated);
    localStorage.setItem('lifevault_allday_events', JSON.stringify(updated));
  };
  const updateEvent = (id: string, updates: Partial<PlannerEvent>) => {
    setEvents(events.map(e => e.id === id ? { ...e, ...updates } : e));
  };
  const addTask = (task: PlannerTask) => setTasks([...tasks, task]);
  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  const togglePaid = (eventId: string) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, isPaid: !e.isPaid } : e));
  };

  const updateBudget = (category: string, updates: Partial<Budget>) => {
    const updated = budgets.map(b => b.category === category ? { ...b, ...updates } : b);
    setBudgets(updated);
    localStorage.setItem('lifevault_budgets', JSON.stringify(updated));
  };

  const addBudget = (budget: Budget) => {
    const updated = [...budgets, budget];
    setBudgets(updated);
    localStorage.setItem('lifevault_budgets', JSON.stringify(updated));
  };

  const addExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    localStorage.setItem('lifevault_expenses', JSON.stringify(updated));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setExpenses(updated);
    localStorage.setItem('lifevault_expenses', JSON.stringify(updated));
  };

  const addGoal = (goal: SavingsGoal) => {
    const updated = [...goals, goal];
    setGoals(updated);
    localStorage.setItem('lifevault_goals', JSON.stringify(updated));
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    setGoals(updated);
    localStorage.setItem('lifevault_goals', JSON.stringify(updated));
  };

  const addCategory = (category: Category) => {
    const updated = [...categories, category];
    setCategories(updated);
    localStorage.setItem('lifevault_categories', JSON.stringify(updated));
  };

  const handleSetPremium = (val: boolean) => {
    setPremium(val);
    localStorage.setItem('lifevault_premium', val.toString());
  };

  const respondToInvite = (eventId: string, status: 'accepted' | 'declined') => {
    setEvents(events.map(e => e.id === eventId ? { ...e, inviteStatus: status } : e));
  };

  const shareCalendar = (email: string, permission: 'view' | 'edit') => {
    const newShare: SharedCalendar = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Main Calendar',
      owner: email,
      permission,
      status: 'pending'
    };
    setMyShares([...myShares, newShare]);
  };

  const removeShare = (id: string) => {
    setMyShares(myShares.filter(s => s.id !== id));
  };

  const respondToSharedCalendar = (id: string, status: 'accepted' | 'declined') => {
    setSharedCalendars(sharedCalendars.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <PlannerContext.Provider value={{ 
      events, tasks, budgets, expenses, goals, categories, isPremium,
      allDayEvents,
      addEvent, addAllDayEvent, updateEvent, addTask, toggleTask, togglePaid, updateBudget, addBudget,
      addExpense, updateExpense, addGoal, updateGoal, addCategory,
      setPremium: handleSetPremium,
      respondToInvite,
      sharedCalendars,
      myShares,
      shareCalendar,
      removeShare,
      respondToSharedCalendar
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
