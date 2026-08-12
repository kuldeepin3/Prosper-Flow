import { useState, useEffect } from 'react';

// Categories Definition
export const EXPENSE_CATEGORIES = [
  'Food', 'Rent', 'Travel', 'Entertainment', 'Shopping', 
  'Healthcare', 'Education', 'EMI', 'Insurance', 'Subscriptions', 'Fuel', 'Utilities'
];

export const INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Dividends', 'Rental income', 'Interest income', 'Side hustle', 'Scholarships'
];

export const INVESTMENT_TYPES = [
  'Stocks', 'Mutual Funds', 'Fixed Deposits', 'PPF', 'EPF', 'Gold', 'Crypto', 'Bonds', 'Real Estate'
];

// Seed state helper
const initialTransactions = [
  { id: '1', amount: 65000, type: 'INCOME', category: 'Salary', date: '2026-06-01', description: 'Monthly paycheck', tags: ['primary', 'salary'] },
  { id: '2', amount: 5000, type: 'INCOME', category: 'Freelancing', date: '2026-06-10', description: 'Landing page design', tags: ['side-hustle'] },
  { id: '3', amount: 12000, type: 'EXPENSE', category: 'Rent', date: '2026-06-02', description: 'Apartment rent', tags: ['fixed'] },
  { id: '4', amount: 4500, type: 'EXPENSE', category: 'Food', date: '2026-06-05', description: 'Weekly Groceries & Dinner out', tags: ['groceries'] },
  { id: '5', amount: 2500, type: 'EXPENSE', category: 'Utilities', date: '2026-06-08', description: 'Electricity & High-speed Wifi', tags: ['bills'] },
  { id: '6', amount: 1500, type: 'EXPENSE', category: 'Travel', date: '2026-06-12', description: 'Uber rides', tags: ['commute'] },
  { id: '7', amount: 999, type: 'EXPENSE', category: 'Subscriptions', date: '2026-06-14', description: 'Streaming subscription bundle', tags: ['entertainment'] }
];

const initialBudgets = [
  { category: 'Food', limit: 6000 },
  { category: 'Travel', limit: 3000 },
  { category: 'Entertainment', limit: 2500 },
  { category: 'Utilities', limit: 4000 }
];

const initialSavings = [
  { id: 's1', name: 'Emergency Fund', target: 120000, current: 85000, deadline: '2026-12-31' },
  { id: 's2', name: 'New Mac Studio', target: 160000, current: 60000, deadline: '2026-09-30' },
  { id: 's3', name: 'Tokyo Getaway', target: 200000, current: 40000, deadline: '2027-04-30' }
];

const initialInvestments = [
  { id: 'i1', assetType: 'Stocks', symbol: 'TCS', units: 15, purchasePrice: 3200, currentValue: 3800, buyDate: '2025-01-15' },
  { id: 'i2', assetType: 'Mutual Funds', symbol: 'Parag Parikh Flexi', units: 1200, purchasePrice: 50, currentValue: 68, buyDate: '2024-06-10' },
  { id: 'i3', assetType: 'Crypto', symbol: 'BTC', units: 0.05, purchasePrice: 3500000, currentValue: 5400000, buyDate: '2024-11-20' },
  { id: 'i4', assetType: 'Gold', symbol: 'Physical Gold Sovereign', units: 2, purchasePrice: 55000, currentValue: 64000, buyDate: '2023-08-05' }
];

const initialLiabilities = [
  { id: 'l1', type: 'Credit Cards', provider: 'HDFC Regalia', owed: 18500, emi: 0, dueDate: '2026-06-25' },
  { id: 'l2', type: 'Loans', provider: 'SBI Education Loan', owed: 450000, emi: 12500, dueDate: '2026-07-05' }
];

export function useFinanceStore() {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ft_token') || null;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ft_user');
        return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        return null;
      }
    }
    return null;
  });

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [runwayData, setRunwayData] = useState({
    current_liquidity: 0,
    average_net_flow: 0,
    runway_days: -1,
    projection: []
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchAllData = async () => {
    if (!token) return;
    const headers = getHeaders();

    try {
      const txRes = await fetch(`${API_URL}/transactions`, { headers });
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.transaction_date,
          description: t.description || ''
        })));
      }
    } catch (e) {
      console.error("Error fetching transactions", e);
    }

    try {
      const budgetRes = await fetch(`${API_URL}/budgets`, { headers });
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgets(data.map(b => ({
          id: b.id,
          category: b.category,
          limit: b.limit_amount
        })));
      }
    } catch (e) {
      console.error("Error fetching budgets", e);
    }

    try {
      const savingsRes = await fetch(`${API_URL}/savings`, { headers });
      if (savingsRes.ok) {
        const data = await savingsRes.json();
        setSavings(data.map(s => ({
          id: s.id,
          name: s.name,
          target: s.target_amount,
          current: s.current_amount,
          deadline: s.deadline || ''
        })));
      }
    } catch (e) {
      console.error("Error fetching savings", e);
    }

    try {
      const invRes = await fetch(`${API_URL}/investments`, { headers });
      if (invRes.ok) {
        const data = await invRes.json();
        setInvestments(data.map(i => ({
          id: i.id,
          assetType: i.asset_type,
          symbol: i.symbol,
          units: i.units,
          purchasePrice: i.purchase_price,
          currentValue: i.current_value,
          buyDate: i.buy_date || ''
        })));
      }
    } catch (e) {
      console.error("Error fetching investments", e);
    }

    try {
      const libRes = await fetch(`${API_URL}/liabilities`, { headers });
      if (libRes.ok) {
        const data = await libRes.json();
        setLiabilities(data.map(l => ({
          id: l.id,
          type: l.type,
          provider: l.provider,
          owed: l.owed,
          emi: l.emi,
          interestRate: l.interest_rate || 0.0,
          dueDate: l.due_date || ''
        })));
      }
    } catch (e) {
      console.error("Error fetching liabilities", e);
    }

    try {
      const runwayRes = await fetch(`${API_URL}/analytics/runway`, { headers });
      if (runwayRes.ok) {
        const data = await runwayRes.json();
        setRunwayData(data);
      }
    } catch (e) {
      console.error("Error fetching runway data", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    } else {
      setTransactions([]);
      setBudgets([]);
      setSavings([]);
      setInvestments([]);
      setLiabilities([]);
    }
  }, [token]);

  // Auth Operations
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('ft_token', data.token);
        localStorage.setItem('ft_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.detail || "Login failed" };
      }
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (email, password, fullName = "") => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('ft_token', data.token);
        localStorage.setItem('ft_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.detail || "Registration failed" };
      }
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_user');
  };

  // Operations
  const addTransaction = async (t) => {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: t.amount,
          type: t.type,
          category: t.category,
          transaction_date: t.date,
          description: t.description,
          is_recurring: t.is_recurring || false,
          recurrence_interval: t.recurrence_interval || null
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error adding transaction", e);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error deleting transaction", e);
    }
  };

  const updateBudget = async (category, limit) => {
    try {
      const res = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category,
          limit_amount: Number(limit)
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error updating budget", e);
    }
  };

  const addSavingsContribution = async (id, amount) => {
    try {
      const res = await fetch(`${API_URL}/savings/${id}/contribute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount: Number(amount) })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error adding savings contribution", e);
    }
  };

  const addSavingsGoal = async (goal) => {
    try {
      const res = await fetch(`${API_URL}/savings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: goal.name,
          target_amount: Number(goal.target),
          deadline: goal.deadline || null
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error adding savings goal", e);
    }
  };

  const addInvestment = async (inv) => {
    try {
      const res = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          asset_type: inv.assetType,
          symbol: inv.symbol,
          units: Number(inv.units),
          purchase_price: Number(inv.purchasePrice),
          current_value: Number(inv.currentValue),
          buy_date: inv.buyDate || null
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error adding investment", e);
    }
  };

  const importCSV = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/transactions/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return { success: true, message: data.message, imported: data.imported };
      } else {
        const err = await res.json();
        return { success: false, error: err.detail || "Import failed" };
      }
    } catch (e) {
      console.error("Error importing CSV", e);
      return { success: false, error: e.message };
    }
  };

  const addLiability = async (lib) => {
    try {
      const res = await fetch(`${API_URL}/liabilities`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: lib.type,
          provider: lib.provider,
          owed: Number(lib.owed),
          emi: Number(lib.emi || 0),
          interest_rate: Number(lib.interestRate || 0.0),
          due_date: lib.dueDate || null
        })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error adding liability", e);
    }
  };

  const deleteLiability = async (id) => {
    try {
      const res = await fetch(`${API_URL}/liabilities/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error deleting liability", e);
    }
  };

  const payLiability = async (id, amount) => {
    try {
      const res = await fetch(`${API_URL}/liabilities/${id}/pay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount: Number(amount) })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error("Error paying liability", e);
    }
  };

  // Aggregated Net Worth Calculations
  const cashSavings = transactions.reduce((acc, t) => {
    if (t.type === 'INCOME') return acc + Number(t.amount);
    return acc - Number(t.amount);
  }, 0);

  const totalInvestments = investments.reduce((acc, inv) => acc + (inv.units * inv.currentValue), 0);
  const totalAssets = cashSavings + totalInvestments;
  const totalLiabilities = liabilities.reduce((acc, l) => acc + Number(l.owed), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Monthly stats helper
  const monthlyIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount), 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount), 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  return {
    token,
    user,
    transactions,
    budgets,
    savings,
    investments,
    liabilities,
    netWorth,
    cashSavings,
    totalInvestments,
    totalAssets,
    totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    login,
    register,
    logout,
    addTransaction,
    deleteTransaction,
    updateBudget,
    addSavingsContribution,
    addSavingsGoal,
    addInvestment,
    importCSV,
    addLiability,
    deleteLiability,
    payLiability,
    fetchAllData,
    runwayData,
    API_URL
  };
}
