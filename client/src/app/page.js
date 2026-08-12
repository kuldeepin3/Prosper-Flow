"use client";

import React, { useState, useEffect } from 'react';
import { 
  useFinanceStore, 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES, 
  INVESTMENT_TYPES 
} from './useFinanceStore';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon, 
  Wallet, 
  Briefcase, 
  Target, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Shield, 
  Upload, 
  FileText,
  User,
  ArrowUpRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  BarChart2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Activity,
  Brain
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Cell, 
  Pie,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';

export default function Home() {
  const {
    token,
    user,
    transactions,
    budgets,
    savings,
    investments,
    liabilities,
    netWorth,
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
  } = useFinanceStore();

  // Authentication State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isRegisterMode) {
      const res = await register(authEmail, authPassword, authName);
      if (!res.success) {
        setAuthError(res.error);
      }
    } else {
      const res = await login(authEmail, authPassword);
      if (!res.success) {
        setAuthError(res.error);
      }
    }
  };

  // Dialog & Active Tabs State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | transactions | budgets | savings | investments
  
  // Transaction Forms
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('EXPENSE');
  const [txCategory, setTxCategory] = useState('Food');
  const [txDate, setTxDate] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txIsRecurring, setTxIsRecurring] = useState(false);
  const [txRecurrenceInterval, setTxRecurrenceInterval] = useState('MONTHLY');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // AI Assistant Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Financial Assistant. Ask me about your spending, budget suggestions, or investment yields.' }
  ]);
  const [queryInput, setQueryInput] = useState('');

  // Date Filter States
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/analytics?month=${filterMonth}&year=${filterYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (e) {
        console.error("Error fetching analytics data", e);
      }
    };
    fetchAnalytics();
  }, [token, filterMonth, filterYear, transactions]);


  const handleAddTransactionSubmit = (e) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txDate) return;
    addTransaction({
      amount: Number(txAmount),
      type: txType,
      category: txCategory,
      date: txDate,
      description: txDesc || `${txType} transaction`,
      is_recurring: txIsRecurring,
      recurrence_interval: txIsRecurring ? txRecurrenceInterval : null,
      tags: [txCategory.toLowerCase()]
    });
    setTxAmount('');
    setTxDesc('');
    setTxIsRecurring(false);
  };

  // Savings Goal Form State
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Investment Form State
  const [invAssetType, setInvAssetType] = useState('Stocks');
  const [invSymbol, setInvSymbol] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPurchasePrice, setInvPurchasePrice] = useState('');
  const [invCurrentValue, setInvCurrentValue] = useState('');
  const [invBuyDate, setInvBuyDate] = useState('');

  // Liability Form State
  const [libType, setLibType] = useState('Credit Cards');
  const [libProvider, setLibProvider] = useState('');
  const [libOwed, setLibOwed] = useState('');
  const [libEmi, setLibEmi] = useState('');
  const [libInterestRate, setLibInterestRate] = useState('');
  const [libDueDate, setLibDueDate] = useState('');
  const [surplusPayment, setSurplusPayment] = useState('5000');

  const handleAddLiabilitySubmit = (e) => {
    e.preventDefault();
    if (!libProvider || !libOwed) return;
    addLiability({
      type: libType,
      provider: libProvider,
      owed: Number(libOwed),
      emi: Number(libEmi || 0),
      interestRate: Number(libInterestRate || 0),
      dueDate: libDueDate || null
    });
    setLibProvider('');
    setLibOwed('');
    setLibEmi('');
    setLibInterestRate('');
    setLibDueDate('');
  };

  const handleAddSavingsGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;
    addSavingsGoal({
      name: goalName,
      target: Number(goalTarget),
      deadline: goalDeadline || null
    });
    setGoalName('');
    setGoalTarget('');
    setGoalDeadline('');
  };

  const handleAddInvestmentSubmit = (e) => {
    e.preventDefault();
    if (!invSymbol || !invUnits || !invPurchasePrice || !invCurrentValue) return;
    addInvestment({
      assetType: invAssetType,
      symbol: invSymbol,
      units: Number(invUnits),
      purchasePrice: Number(invPurchasePrice),
      currentValue: Number(invCurrentValue),
      buyDate: invBuyDate || null
    });
    setInvSymbol('');
    setInvUnits('');
    setInvPurchasePrice('');
    setInvCurrentValue('');
    setInvBuyDate('');
  };


  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    const userMessage = { role: 'user', text: queryInput };
    setChatMessages(prev => [...prev, userMessage]);
    setQueryInput('');

    // Add a loading message to simulate thinking
    const loadingMessageId = Date.now();
    setChatMessages(prev => [...prev, { role: 'assistant', text: 'Thinking...', id: loadingMessageId }]);

    try {
      const response = await fetch(`${API_URL}/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMessage.text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.response || "Sorry, I couldn't get a response from my engine.";
      const actions = data.actions_taken || [];
      
      let actionSummary = "";
      if (actions.length > 0) {
        fetchAllData();
        actionSummary = "\n\n🔧 **Actions Executed:**\n" + actions.map(act => {
          if (act.status === "success") {
            if (act.tool === "update_budget") {
              return `• Set **${act.details.category}** budget limit to **₹${act.details.limit_amount.toLocaleString()}**`;
            } else if (act.tool === "create_savings_goal") {
              return `• Created savings goal **"${act.details.name}"** targeting **₹${act.details.target_amount.toLocaleString()}**`;
            } else if (act.tool === "create_transaction") {
              return `• Logged **${act.details.type}** of **₹${act.details.amount.toLocaleString()}** under **${act.details.category}** (${act.details.description})`;
            }
          } else {
            return `• Failed to execute ${act.tool}: ${act.message}`;
          }
          return "";
        }).filter(str => str !== "").join("\n");
      }
      
      const finalReply = reply + actionSummary;

      setChatMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId ? { role: 'assistant', text: finalReply } : msg
      ));
    } catch (error) {
      console.error("AI Copilot query error:", error);
      setChatMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId ? { role: 'assistant', text: "Error: Could not connect to AI Copilot service. Please ensure the backend and Ollama are running." } : msg
      ));
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [y, m, d] = t.date.split('-');
    return Number(y) === filterYear && Number(m) === filterMonth;
  });

  // 1. Current Month Aggregation (Bar Graph Data: Income, Expenses, Net Balance)
  const currentMonthData = [
    {
      name: 'Monthly Overview',
      Income: analytics?.monthly_income || 0,
      Expenses: analytics?.monthly_expenses || 0,
      'Net Balance': (analytics?.monthly_income || 0) - (analytics?.monthly_expenses || 0)
    }
  ];

  // 2. Spending Breakdown (Pie / Bar Chart for Categorized spends)
  const spendingBreakdownData = EXPENSE_CATEGORIES.map(cat => {
    const sum = filteredTransactions
      .filter(t => t.type === 'EXPENSE' && t.category === cat)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { category: cat, Amount: sum };
  }).filter(item => item.Amount > 0);

  // 3. Cash Flow Trends over Time (Line Chart)
  const sortedTx = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningIncome = 0;
  let runningExpense = 0;
  const cashFlowTrendsData = sortedTx.map(t => {
    if (t.type === 'INCOME') runningIncome += t.amount;
    if (t.type === 'EXPENSE') runningExpense += t.amount;
    return {
      date: t.date,
      'Total Earned': runningIncome,
      'Total Spent': runningExpense
    };
  });

  const pieData = EXPENSE_CATEGORIES.map(cat => {
    const sum = filteredTransactions
      .filter(t => t.type === 'EXPENSE' && t.category === cat)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: cat, value: sum };
  }).filter(item => item.value > 0);


  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

  // Debt payoff simulation
  const runDebtSimulation = (strategy) => {
    let extraPayment = Number(surplusPayment) || 0;
    let activeDebts = liabilities
      .filter(l => l.owed > 0)
      .map(l => ({
        id: l.id,
        provider: l.provider,
        type: l.type,
        owed: Number(l.owed),
        emi: Number(l.emi || 0),
        interestRate: Number(l.interestRate || 0)
      }));

    if (activeDebts.length === 0) {
      return { months: 0, totalInterest: 0 };
    }

    if (strategy === 'snowball') {
      activeDebts.sort((a, b) => a.owed - b.owed);
    } else {
      activeDebts.sort((a, b) => b.interestRate - a.interestRate);
    }

    let months = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years safety cap

    while (activeDebts.some(d => d.owed > 0) && months < maxMonths) {
      months++;
      
      // Calculate and add monthly interest to each debt
      activeDebts.forEach(d => {
        if (d.owed > 0) {
          const monthlyRate = (d.interestRate / 100) / 12;
          const interest = d.owed * monthlyRate;
          d.owed += interest;
          totalInterest += interest;
        }
      });

      // Budget is EMIs + extra surplus
      let totalEmiRequired = activeDebts.reduce((sum, d) => sum + (d.owed > 0 ? d.emi : 0), 0);
      let monthlyBudget = totalEmiRequired + extraPayment;
      let remainingBudget = monthlyBudget;

      // First pay minimum EMIs
      activeDebts.forEach(d => {
        if (d.owed > 0) {
          const payment = Math.min(d.owed, d.emi);
          d.owed -= payment;
          remainingBudget -= payment;
        }
      });

      // Apply extra surplus to the prioritized debt
      if (remainingBudget > 0) {
        for (let d of activeDebts) {
          if (d.owed > 0) {
            const payment = Math.min(d.owed, remainingBudget);
            d.owed -= payment;
            remainingBudget -= payment;
            if (remainingBudget <= 0) break;
          }
        }
      }
    }

    return { months, totalInterest };
  };

  const snowballResult = runDebtSimulation('snowball');
  const avalancheResult = runDebtSimulation('avalanche');

  // Auth screen guard
  if (!mounted) {
    return <div className="min-h-screen bg-[#09090b]"></div>;
  }

  if (!token && !showAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Header */}
        <header className="w-full border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Prosper Flow</span>
          </div>
          <button 
            onClick={() => setShowAuth(true)}
            className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition duration-200 flex items-center gap-1.5"
          >
            Sign In <ChevronRight className="w-4 h-4" />
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Self-Hosted AI Personal Finance
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6">
            Supercharge Your <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">Financial Intelligence</span>
          </h1>
          
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
            Prosper Flow is a private, AI-powered personal finance engine. Track transactions, analyze budgets, simulate debt payoff, and chat with your personal AI financial copilot.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button 
              onClick={() => setShowAuth(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-extrabold rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 text-base"
            >
              Launch Engine <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="https://github.com/kuldeepin3/Prosper-Flow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl border border-zinc-800 hover:border-zinc-700 transition duration-200 flex items-center justify-center gap-2 text-base"
            >
              View on GitHub
            </a>
          </div>

          {/* Interactive Feature Mockup Grid */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm hover:border-zinc-700/80 transition duration-300">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-5 border border-emerald-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Financial Copilot</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Chat with an intelligence layer directly connected to your ledger. Run semantic searches, ask for budget tips, and get yield calculations private to your machine.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm hover:border-zinc-700/80 transition duration-300">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-5 border border-emerald-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Local OCR Parsing</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Upload images or PDFs of invoices and bank statements. The engine uses a local OCR model to extract and automatically import items directly into your ledger.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm hover:border-zinc-700/80 transition duration-300">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit mb-5 border border-emerald-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Runway Projections</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Analyze your cash flow and current assets to project your liquidity runway. Simulate debt payoff strategies (snowball vs. avalanche) to optimize your wealth journey.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-950 py-8 px-6 text-center text-xs text-zinc-500 bg-[#070709] mt-auto">
          <p>© {new Date().getFullYear()} Prosper Flow Engine. Built with Next.js, FastAPI, PostgreSQL, and Ollama.</p>
        </footer>
      </div>
    );
  }

  if (!token && showAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b] px-4">
        <div className="w-full max-w-md p-8 glass-card border border-zinc-800 relative">
          <button 
            onClick={() => {
              setShowAuth(false);
              setAuthError('');
            }}
            className="absolute top-6 left-6 text-zinc-500 hover:text-zinc-300 transition text-xs flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="flex flex-col items-center mb-8 text-center mt-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-4 border border-emerald-500/25">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isRegisterMode ? "Create New Engine Session" : "Secure Identity Portal"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Prosper Flow Financial Risk & Asset Engine</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Secure Username / Email</label>
              <input 
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Access Token / Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold p-2.5 rounded-lg text-sm flex items-center justify-center gap-2 mt-6"
            >
              <Lock className="w-4 h-4" /> {isRegisterMode ? "Register Security Key" : "Authenticate & Access Session"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
              }}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition"
            >
              {isRegisterMode ? "Already registered? Login here" : "Don't have a secure token? Sign up here"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>TLS 1.3 Active</span>
            <span>AES-256-GCM Secure</span>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen text-slate-100 bg-[#09090b]">
      {/* Sidebar Layout */}
      <aside className="w-64 border-r border-zinc-800 bg-[#0c0c0e] p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Prosper Flow</h1>
              <span className="text-xs text-zinc-500">Financial Command Engine</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'dashboard' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <Wallet className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('transactions')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'transactions' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <DollarSign className="w-4 h-4" /> Ledgers & Invoices
            </button>
            <button 
              onClick={() => setActiveTab('budgets')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'budgets' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <PieIcon className="w-4 h-4" /> Budgets
            </button>
            <button 
              onClick={() => setActiveTab('savings')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'savings' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <Target className="w-4 h-4" /> Savings Targets
            </button>
            <button 
              onClick={() => setActiveTab('investments')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'investments' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <Briefcase className="w-4 h-4" /> Asset Portfolios
            </button>
            <button 
              onClick={() => setActiveTab('liabilities')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'liabilities' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Liabilities & Debts
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold truncate max-w-[120px]">{user?.full_name || user?.email}</h2>
              <span className="text-xs text-zinc-500">Premium Account</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 justify-center px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <span className="text-xs text-emerald-400 font-mono tracking-wider uppercase">Active Session Secure</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Financial Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Filters */}
            <div className="flex gap-2 bg-[#0c0c0e] border border-zinc-800 p-1.5 rounded-lg text-xs">
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-zinc-950">
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <span className="text-zinc-600">|</span>
              <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="2025" className="bg-zinc-950">2025</option>
                <option value="2026" className="bg-zinc-950">2026</option>
                <option value="2027" className="bg-zinc-950">2027</option>
              </select>
            </div>

            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold text-sm shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" /> AI Assistant
            </button>
          </div>
        </header>


        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Global Aggregates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Calculated Net Worth</span>
                  <h2 className="text-3xl font-bold mt-1 text-white">₹{netWorth.toLocaleString()}</h2>
                </div>
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+8.2% from last quarter</span>
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Active Assets Portfolio</span>
                  <h2 className="text-3xl font-bold mt-1 text-emerald-400">₹{totalAssets.toLocaleString()}</h2>
                </div>
                <div className="mt-4 text-xs text-zinc-500">
                  Investments: ₹{totalInvestments.toLocaleString()}
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Outstanding Liabilities</span>
                  <h2 className="text-3xl font-bold mt-1 text-rose-400">₹{totalLiabilities.toLocaleString()}</h2>
                </div>
                <div className="mt-4 text-xs text-zinc-500">
                  Remaining Debt Load
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
                  <h2 className="text-3xl font-bold mt-1 text-blue-400">{(analytics?.savings_rate || 0).toFixed(1)}%</h2>
                </div>
                <div className="mt-4 text-xs text-zinc-500 font-mono">
                  Income: ₹{(analytics?.monthly_income || 0).toLocaleString()} | Spent: ₹{(analytics?.monthly_expenses || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Automated Financial Command Insights */}
            {analytics?.insights && analytics.insights.length > 0 && (
              <div className="glass-card p-6 border border-emerald-500/15 bg-emerald-500/[0.01]">
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Automated Risk & Savings Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.insights.map((insight, idx) => {
                    const isAlert = insight.startsWith('⚠️');
                    const isSuccess = insight.startsWith('🎉') || insight.startsWith('🏆');
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-xs leading-relaxed ${
                          isAlert 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' 
                            : isSuccess 
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span className="mt-0.5 text-sm">
                          {isAlert ? '⚠️' : isSuccess ? '✨' : '💡'}
                        </span>
                        <span>
                          {insight.replace(/^[⚠️🎉🏆💡]\s*/, '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Monthly Overview - Bar Graph (Income, Expenses, Net Balance) */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Monthly Overview Metrics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentMonthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#52525b" />
                    <YAxis stroke="#52525b" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Legend />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Net Balance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Predictive Runway Forecasting Widget */}
            <div className="glass-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-lg text-white">Predictive Cash Runway</h3>
                  <p className="text-xs text-zinc-500 mt-1">Based on monthly burn rate projections & active liquid assets (savings + investments + ledger cash).</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Estimated Runway</span>
                    <span className={`text-2xl font-bold ${
                      runwayData?.runway_days === -1 
                        ? 'text-emerald-400' 
                        : runwayData?.runway_days < 90 
                          ? 'text-rose-400' 
                          : 'text-amber-400'
                    }`}>
                      {runwayData?.runway_days === -1 
                        ? 'Infinite (Net-Saving)' 
                        : `${runwayData?.runway_days} Days`
                      }
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    runwayData?.runway_days === -1 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : runwayData?.runway_days < 90 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                    <span className="text-xs text-zinc-400 block font-medium">Current Liquidity</span>
                    <h4 className="text-xl font-bold text-white">₹{(runwayData?.current_liquidity || 0).toLocaleString()}</h4>
                    <p className="text-[10px] text-zinc-500">Total cash, savings, and investments available immediately.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                    <span className="text-xs text-zinc-400 block font-medium">Average Monthly Net Cash Flow</span>
                    <h4 className={`text-xl font-bold ${
                      (runwayData?.average_net_flow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {(runwayData?.average_net_flow || 0) >= 0 ? '+' : ''}
                      ₹{(runwayData?.average_net_flow || 0).toLocaleString()}/mo
                    </h4>
                    <p className="text-[10px] text-zinc-500">Based on transaction history over the last 3 months.</p>
                  </div>
                </div>

                <div className="lg:grid-cols-2">
                  <div className="h-56">
                    {runwayData?.projection && runwayData.projection.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={runwayData.projection}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="month" stroke="#52525b" fontSize={10} />
                          <YAxis stroke="#52525b" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Projected Balance']}
                          />
                          <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        No projection data available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cash Flow Trends - Line Chart */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-6">Cash Flow Trends (Earned vs Spent over time)</h3>
                <div className="h-72">
                  {cashFlowTrendsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={11} />
                        <YAxis stroke="#52525b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Total Earned" stroke="#10b981" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="Total Spent" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                      Insufficient transaction data.
                    </div>
                  )}
                </div>
              </div>

              {/* Spending Breakdown (Bar Chart Category Spends) */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-6">Spending Breakdown</h3>
                <div className="h-72">
                  {spendingBreakdownData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendingBreakdownData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis type="number" stroke="#52525b" />
                        <YAxis dataKey="category" type="category" stroke="#52525b" width={80} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                        <Bar dataKey="Amount" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                      No expense data logged this month.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Budget Overviews & warnings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Active Monthly Budgets</h3>
                  <button onClick={() => setActiveTab('budgets')} className="text-emerald-400 hover:underline text-xs">Configure Limits</button>
                </div>
                <div className="space-y-4">
                  {(analytics?.budgets_progress || []).map(b => {
                    const spent = b.spent_amount;
                    const limit = b.limit_amount;
                    const pct = Math.min(100, b.percentage);
                    const isOver = spent > limit;
                    return (
                      <div key={b.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium flex items-center gap-1.5">
                            {b.category}
                            {isOver && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
                          </span>
                          <span className={`${isOver ? 'text-rose-500 font-bold' : 'text-zinc-400'}`}>
                            ₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        {isOver && (
                          <span className="text-[10px] text-rose-500 mt-1 block font-semibold uppercase tracking-wider">
                            ⚠️ Over Limit by ₹{(spent - limit).toLocaleString()}!
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Transaction Panel */}
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Recent Ledger Rows</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-emerald-400 hover:underline text-xs">Detailed Ledger</button>
                </div>
                <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto pr-1">
                  {filteredTransactions.slice(0, 5).map(t => (
                    <div key={t.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-100">{t.description}</h4>
                        <span className="text-xs text-zinc-500">{t.category} • {t.date}</span>
                      </div>
                      <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Master Transaction Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-zinc-800/20">
                        <td className="py-3.5 px-4 font-mono text-xs">{t.date}</td>
                        <td className="py-3.5 px-4 font-medium">{t.description}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {t.category}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'INCOME' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => deleteTransaction(t.id)} className="text-zinc-500 hover:text-rose-400 transition p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Log New Ledger Entry</h3>
              <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Transaction Type</label>
                  <select 
                    value={txType} 
                    onChange={(e) => {
                      setTxType(e.target.value);
                      setTxCategory(e.target.value === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="EXPENSE">Expense (Debit)</option>
                    <option value="INCOME">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Category</label>
                  <select 
                    value={txCategory} 
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    {txType === 'INCOME' 
                      ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                      : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Amount (INR)</label>
                  <input 
                    type="number" 
                    value={txAmount} 
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="e.g. 2500" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Transaction Date</label>
                  <input 
                    type="date" 
                    value={txDate} 
                    onChange={(e) => setTxDate(e.target.value)}
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Description / Notes</label>
                  <input 
                    type="text" 
                    value={txDesc} 
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="Describe transaction details" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div className="flex items-center gap-2 p-1">
                  <input 
                    type="checkbox" 
                    id="tx-recurring-check"
                    checked={txIsRecurring} 
                    onChange={(e) => setTxIsRecurring(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="tx-recurring-check" className="text-xs font-semibold text-zinc-400 cursor-pointer">
                    Enable Recurring Transaction Template
                  </label>
                </div>

                {txIsRecurring && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Recurrence Interval</label>
                    <select 
                      value={txRecurrenceInterval} 
                      onChange={(e) => setTxRecurrenceInterval(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                    >
                      <option value="DAILY">Daily (repeats daily)</option>
                      <option value="WEEKLY">Weekly (repeats weekly)</option>
                      <option value="MONTHLY">Monthly (repeats monthly)</option>
                      <option value="YEARLY">Yearly (repeats yearly)</option>
                    </select>
                  </div>
                )}


                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold p-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save Transaction
                </button>
              </form>

              {/* OCR invoice mockup */}
              <div className="mt-8 pt-8 border-t border-zinc-800">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" /> Auto-Scan Bills & Receipts
                </h4>
                <p className="text-xs text-zinc-500 mb-4">Upload a receipt image or PDF invoice. The AI parser will auto-populate the ledger details.</p>
                
                {/* Scan Status Overlay */}
                {window.isScanningReceipt && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs animate-pulse">
                    <span>⚡ AI Scanning In Progress (CLAHE contrast filtering active)...</span>
                    <span className="font-mono">Extracting lines...</span>
                  </div>
                )}

                <input 
                  type="file" 
                  id="receipt-file-input" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    window.isScanningReceipt = true;
                    // Trigger re-render by doing a dummy state update
                    setTxAmount(prev => prev);
                    
                    const formData = new FormData();
                    formData.append("file", file);
                    
                    try {
                      const response = await fetch(`${API_URL}/parse`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${token}`
                        },
                        body: formData,
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Server responded with ${response.status}`);
                      }
                      
                      const data = await response.json();
                      const parsed = data.parsed_data || {};
                      
                      const amount = parsed.TotalAmount || parsed.Amount || parsed.total || 0;
                      const date = parsed.Date || parsed.InvoiceDate || new Date().toISOString().split('T')[0];
                      const desc = parsed.MerchantName || parsed.Vendor || parsed.merchant || file.name;
                      
                      setTxAmount(amount.toString());
                      setTxType('EXPENSE');
                      setTxCategory('Food'); // Default fallback, could try to parse category if LLM returns it
                      setTxDate(date);
                      setTxDesc(desc);
                      
                      alert(`✅ OCR Scanner Extracted successfully! \n\nMerchant: ${desc}\nDate: ${date}\nGrand Total: ₹${amount}\n\nRaw Text Extracted:\n${data.raw_text?.substring(0, 100)}...`);
                    } catch (error) {
                      console.error("Error parsing receipt:", error);
                      alert(`❌ Error parsing receipt: ${error.message}`);
                    } finally {
                      window.isScanningReceipt = false;
                      // Trigger re-render to hide scanning state
                      setTxAmount(prev => prev);
                    }
                  }}
                />

                {/* Interactive Drag & Drop Box with Rotation Modifiers */}
                <div 
                  onClick={() => document.getElementById('receipt-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#10b981"; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)";
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const input = document.getElementById('receipt-file-input');
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(e.dataTransfer.files[0]);
                      input.files = dataTransfer.files;
                      input.dispatchEvent(new Event('change', { bubbles: True }));
                    }
                  }}
                  className="border border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-emerald-500 transition cursor-pointer relative"
                >
                  <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium block">Drag & Drop receipt or Click to Browse</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports JPG, PNG, PDF (Max 10MB)</span>
                </div>
              </div>

              {/* CSV Importer */}
              <div className="mt-8 pt-8 border-t border-zinc-800">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" /> AI CSV Statement Importer
                </h4>
                <p className="text-xs text-zinc-500 mb-4">Drag and drop your bank statement CSV. The AI will parse descriptions and auto-categorize transactions using vector matching.</p>
                
                {/* Import Status Indicator */}
                {isImportingCsv && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs animate-pulse">
                    <span>⚡ Parsing and Auto-Categorizing statement...</span>
                  </div>
                )}

                <input 
                  type="file" 
                  id="csv-file-input" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    setIsImportingCsv(true);
                    try {
                      const res = await importCSV(file);
                      if (res.success) {
                        alert(`✅ Import Successful!\n\n${res.message}`);
                      } else {
                        alert(`❌ Import Failed: ${res.error}`);
                      }
                    } catch (error) {
                      console.error("CSV Import Error:", error);
                      alert(`❌ CSV Import Error: ${error.message}`);
                    } finally {
                      setIsImportingCsv(false);
                      // Clear the input value
                      e.target.value = '';
                    }
                  }}
                />

                <div 
                  onClick={() => document.getElementById('csv-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#10b981"; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)";
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const input = document.getElementById('csv-file-input');
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(e.dataTransfer.files[0]);
                      input.files = dataTransfer.files;
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }}
                  className="border border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-emerald-500 transition cursor-pointer relative"
                >
                  <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium block">Drag & Drop bank CSV or Click to Browse</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports standard statements (.csv)</span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-300 mt-6 mb-1">Import Statement (Image/PDF)</h4>
                <p className="text-xs text-zinc-500 mb-4">Upload a screenshot, photo, or PDF of your bank transactions list. Our local OCR + AI parser will automatically extract and log them.</p>

                {/* Import Status Indicator */}
                {isImportingImage && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs animate-pulse">
                    <span>⚡ Running OCR & Parsing transactions list...</span>
                  </div>
                )}

                <input 
                  type="file" 
                  id="image-statement-file-input" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    setIsImportingImage(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    
                    try {
                      const response = await fetch(`${API_URL}/transactions/import-image`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${token}`
                        },
                        body: formData,
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Server responded with ${response.status}`);
                      }
                      
                      const res = await response.json();
                      if (res.imported > 0) {
                        fetchAllData();
                        alert(`✅ Import Successful!\n\n${res.message}`);
                      } else {
                        alert(`❌ Import Failed: ${res.message}`);
                      }
                    } catch (error) {
                      console.error("Statement Image Import Error:", error);
                      alert(`❌ Statement Image Import Error: ${error.message}`);
                    } finally {
                      setIsImportingImage(false);
                      // Clear the input value
                      e.target.value = '';
                    }
                  }}
                />

                <div 
                  onClick={() => document.getElementById('image-statement-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#10b981"; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "rgba(63, 63, 70, 0.4)";
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const input = document.getElementById('image-statement-file-input');
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(e.dataTransfer.files[0]);
                      input.files = dataTransfer.files;
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }}
                  className="border border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-emerald-500 transition cursor-pointer relative"
                >
                  <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium block">Drag & Drop bank screenshot/PDF or Browse</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports JPG, PNG, WEBP, PDF</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div className="glass-card p-8">
            <h3 className="font-bold text-lg mb-6">Manage Monthly Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXPENSE_CATEGORIES.map(cat => {
                const currentBudget = budgets.find(b => b.category === cat) || { limit: 0 };
                const spent = transactions
                  .filter(t => t.type === 'EXPENSE' && t.category === cat)
                  .reduce((acc, curr) => acc + curr.amount, 0);
                const isOver = spent > currentBudget.limit && currentBudget.limit > 0;

                return (
                  <div key={cat} className="p-5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-300">{cat}</h4>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xs text-zinc-500">Spent: ₹{spent.toLocaleString()}</span>
                        <span className={`text-sm font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Limit: ₹{currentBudget.limit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <input 
                        type="number"
                        placeholder="Set limit"
                        defaultValue={currentBudget.limit || ''}
                        onBlur={(e) => updateBudget(cat, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Savings Goals Tab */}
        {activeTab === 'savings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Progressive Savings Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savings.map(s => {
                  const pct = Math.min(100, (s.current / s.target) * 100);
                  return (
                    <div key={s.id} className="p-6 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-base text-zinc-100">{s.name}</h4>
                          <span className="text-xs text-zinc-500 font-mono">By {s.deadline}</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-4">
                          <span className="text-2xl font-extrabold text-emerald-400">₹{s.current.toLocaleString()}</span>
                          <span className="text-xs text-zinc-400">Target: ₹{s.target.toLocaleString()}</span>
                        </div>
                        
                        <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1.5 block text-right">{pct.toFixed(0)}% Completed</span>
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Deposit amount"
                          id={`deposit-${s.id}`}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-slate-100 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById(`deposit-${s.id}`);
                            if (input && input.value) {
                              addSavingsContribution(s.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold text-xs px-4 rounded"
                        >
                          Contribute
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Create Savings Goal</h3>
              <form onSubmit={handleAddSavingsGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Goal Name</label>
                  <input 
                    type="text" 
                    value={goalName} 
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Emergency Fund" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Target Amount (INR)</label>
                  <input 
                    type="number" 
                    value={goalTarget} 
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. 150000" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Deadline Date</label>
                  <input 
                    type="date" 
                    value={goalDeadline} 
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold p-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Goal
                </button>
              </form>
            </div>
          </div>
        )}


        {/* Investment Portfolio Tab */}
        {activeTab === 'investments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Investment Assets Allocation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {investments.map(inv => {
                  const totalInvested = inv.units * inv.purchasePrice;
                  const valuation = inv.units * inv.currentValue;
                  const roi = ((valuation - totalInvested) / totalInvested) * 100;

                  return (
                    <div key={inv.id} className="p-5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm text-zinc-200">{inv.symbol}</h4>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{inv.assetType}</span>
                        </div>
                        <div className="mt-4">
                          <span className="text-xs text-zinc-500">Value:</span>
                          <h5 className="text-xl font-bold text-white">₹{valuation.toLocaleString()}</h5>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Units: {inv.units}</span>
                        <span className={`font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-lg mb-6">Log New Asset Purchase</h3>
              <form onSubmit={handleAddInvestmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Asset Type</label>
                  <select 
                    value={invAssetType} 
                    onChange={(e) => setInvAssetType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  >
                    {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Asset Symbol / Ticker</label>
                  <input 
                    type="text" 
                    value={invSymbol} 
                    onChange={(e) => setInvSymbol(e.target.value)}
                    placeholder="e.g. AAPL, BTC, RELIANCE" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Units Bought</label>
                    <input 
                      type="number" 
                      step="any"
                      value={invUnits} 
                      onChange={(e) => setInvUnits(e.target.value)}
                      placeholder="e.g. 10" 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Purchase Price</label>
                    <input 
                      type="number" 
                      step="any"
                      value={invPurchasePrice} 
                      onChange={(e) => setInvPurchasePrice(e.target.value)}
                      placeholder="e.g. 3200" 
                      required 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Current Value per Unit</label>
                  <input 
                    type="number" 
                    step="any"
                    value={invCurrentValue} 
                    onChange={(e) => setInvCurrentValue(e.target.value)}
                    placeholder="e.g. 3500" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Purchase Date</label>
                  <input 
                    type="date" 
                    value={invBuyDate} 
                    onChange={(e) => setInvBuyDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold p-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log Purchase
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Liabilities & Debts Tab */}
        {activeTab === 'liabilities' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Liabilities List */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg mb-6">Active Outstanding Liabilities</h3>
                {liabilities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                      <thead className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4">Provider</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Balance Owed</th>
                          <th className="py-3 px-4">Min. EMI</th>
                          <th className="py-3 px-4">Interest Rate</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Pay</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {liabilities.map(l => (
                          <tr key={l.id} className="hover:bg-zinc-800/20">
                            <td className="py-3.5 px-4 font-semibold text-zinc-100">{l.provider}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {l.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-rose-400">₹{l.owed.toLocaleString()}</td>
                            <td className="py-3.5 px-4">₹{(l.emi || 0).toLocaleString()}/mo</td>
                            <td className="py-3.5 px-4 font-mono text-xs">{l.interestRate}%</td>
                            <td className="py-3.5 px-4 font-mono text-xs">{l.dueDate || 'N/A'}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex gap-1.5 items-center">
                                <input 
                                  type="number" 
                                  placeholder="Amt"
                                  id={`pay-input-${l.id}`}
                                  className="w-16 bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-slate-100 focus:outline-none"
                                />
                                <button 
                                  onClick={() => {
                                    const input = document.getElementById(`pay-input-${l.id}`);
                                    if (input && input.value) {
                                      payLiability(l.id, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 transition text-black font-bold text-[10px] px-2 py-1 rounded"
                                >
                                  Pay
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button onClick={() => deleteLiability(l.id)} className="text-zinc-500 hover:text-rose-400 transition p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-500 text-sm">
                    No active liabilities logged. You are debt-free! 🎉
                  </div>
                )}
              </div>

              {/* Payoff strategy simulator */}
              {liabilities.filter(l => l.owed > 0).length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-bold text-lg mb-2">Debt Repayment Planner & Simulator</h3>
                  <p className="text-xs text-zinc-400 mb-6">Compare payoff strategies side-by-side. Set an extra amount to pay on top of your minimum EMIs each month.</p>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Extra Monthly Surplus Payment (INR)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="50000" 
                          step="1000" 
                          value={surplusPayment}
                          onChange={(e) => setSurplusPayment(e.target.value)}
                          className="flex-1 accent-emerald-500"
                        />
                        <input 
                          type="number" 
                          value={surplusPayment}
                          onChange={(e) => setSurplusPayment(e.target.value)}
                          className="w-24 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Snowball Card */}
                    <div className="p-5 rounded-lg bg-zinc-950/40 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-zinc-200">Debt Snowball</h4>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Balance Order</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Focuses on smallest balances first for quick emotional wins.</p>
                        
                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Payoff Duration:</span>
                            <span className="font-semibold text-white">{snowballResult.months} Months</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Total Interest Accrued:</span>
                            <span className="font-semibold text-rose-400">₹{Math.round(snowballResult.totalInterest).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Avalanche Card */}
                    <div className="p-5 rounded-lg bg-zinc-950/40 border border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-emerald-400">Debt Avalanche</h4>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Interest Order</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Focuses on highest interest rates first to save maximum money.</p>
                        
                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Payoff Duration:</span>
                            <span className="font-semibold text-emerald-400">{avalancheResult.months} Months</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Total Interest Accrued:</span>
                            <span className="font-semibold text-rose-400">₹{Math.round(avalancheResult.totalInterest).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Form column */}
            <div className="glass-card p-6 h-fit">
              <h3 className="font-bold text-lg mb-6">Log New Liability / Debt</h3>
              <form onSubmit={handleAddLiabilitySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Liability Type</label>
                  <select 
                    value={libType} 
                    onChange={(e) => setLibType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  >
                    <option value="Credit Cards">Credit Card Balance</option>
                    <option value="Loans">Personal Loan</option>
                    <option value="Student Loans">Student Loan</option>
                    <option value="Home Loans">Home Mortgage</option>
                    <option value="Other Debts">Other / Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Lender / Provider</label>
                  <input 
                    type="text" 
                    value={libProvider} 
                    onChange={(e) => setLibProvider(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Current Owed Amount (INR)</label>
                  <input 
                    type="number" 
                    value={libOwed} 
                    onChange={(e) => setLibOwed(e.target.value)}
                    placeholder="e.g. 450000" 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Min Monthly / EMI</label>
                    <input 
                      type="number" 
                      value={libEmi} 
                      onChange={(e) => setLibEmi(e.target.value)}
                      placeholder="e.g. 12500" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={libInterestRate} 
                      onChange={(e) => setLibInterestRate(e.target.value)}
                      placeholder="e.g. 11.5" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Next Payment Due Date</label>
                  <input 
                    type="date" 
                    value={libDueDate} 
                    onChange={(e) => setLibDueDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-black font-semibold p-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log Liability
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Floating AI Chat Assistant Panel */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[480px] glass-card shadow-2xl flex flex-col border border-emerald-500/20 z-50">
          <div className="p-4 border-b border-zinc-800 bg-[#0c0c0e]/80 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-semibold text-sm">Financial Copilot</h4>
                <span className="text-[10px] text-zinc-400">RAG Context Enabled</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-zinc-400 hover:text-white font-bold text-sm">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 leading-relaxed ${msg.role === 'user' ? 'bg-emerald-500 text-black font-semibold' : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAIQuery} className="p-3 border-t border-zinc-800 bg-[#0c0c0e]/95 rounded-b-xl flex gap-2">
            <input 
              type="text" 
              value={queryInput} 
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask: 'Am I overspending on food?'"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 transition text-black p-2 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
