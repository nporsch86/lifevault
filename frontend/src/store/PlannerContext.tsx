import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface PlannerEvent {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: 'Work' | 'Personal' | 'Important' | 'Confidential' | 'Bill' | 'Medical' | 'Family' | 'Health';
  description?: string;
  amount?: number;
  isPaid?: boolean;
  meetingLink?: string;
  travelTime?: number; // duration in minutes
  invitees?: string[];
  inviteStatus?: 'accepted' | 'declined' | 'pending';
}

export interface PlannerTask {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface Budget {
  category: string;
  limit: number;
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
  isPremium: boolean;
  sharedCalendars: SharedCalendar[];
  myShares: SharedCalendar[];
  addEvent: (event: PlannerEvent) => void;
  updateEvent: (id: string, updates: Partial<PlannerEvent>) => void;
  addTask: (task: PlannerTask) => void;
  toggleTask: (id: string) => void;
  togglePaid: (eventId: string) => void;
  updateBudget: (category: string, limit: number) => void;
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
      { category: 'Food', limit: 500 },
      { category: 'Transport', limit: 200 },
      { category: 'Shopping', limit: 300 },
      { category: 'Bills', limit: 1500 },
      { category: 'Health', limit: 150 },
      { category: 'Other', limit: 100 },
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
      invitees: ['jane@example.com', 'mark@example.com', 'jamie@email.com']
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

  const addEvent = (event: PlannerEvent) => setEvents([...events, event]);
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

  const updateBudget = (category: string, limit: number) => {
    const updated = budgets.map(b => b.category === category ? { ...b, limit } : b);
    setBudgets(updated);
    localStorage.setItem('lifevault_budgets', JSON.stringify(updated));
  };

  const handleSetPremium = (val: boolean) => {
    setPremium(val);
    localStorage.setItem('lifevault_premium', val.toString());
  };

  const respondToInvite = (eventId: string, status: 'accepted' | 'declined') => {
    setEvents(events.map(e => e.id === eventId ? { ...e, inviteStatus: status } : e));
  };

  return (
    <PlannerContext.Provider value={{ 
      events, tasks, budgets, isPremium,
            addEvent, updateEvent, addTask, toggleTask, togglePaid, updateBudget,
            setPremium: handleSetPremium,
            respondToInvite,
            sharedCalendars: [],
            myShares: [],
            shareCalendar: () => {},
            removeShare: () => {},
            respondToSharedCalendar: () => {}
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
