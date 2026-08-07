'use/client';
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Coins, Clock, RefreshCw, Calendar, 
  UserPlus, CheckCircle, AlertCircle, Edit, ChevronRight, FileText, Download, History, LogOut, Home, Settings
} from 'lucide-react';
import Preloader from '@/app/components/Preloader';

interface AdminDashboardProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments' | 'reports' | 'settings'>('stats');

  const getActiveTabIndex = () => {
    switch (activeTab) {
      case 'stats': return 0;
      case 'users': return 1;
      case 'payments': return 2;
      case 'reports': return 3;
      case 'settings': return 4;
      default: return 0;
    }
  };
  
  // Data States
  const [statsData, setStatsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [cutoffTimes, setCutoffTimes] = useState<any>({ breakfast: '07:30', lunch: '10:00', dinner: '18:00' });
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals / Action States
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false);
  const [showDueBalancesModal, setShowDueBalancesModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationAmountForm, setAllocationAmountForm] = useState<string | number>('');

  // Expanded User Points logs
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedUserMeals, setExpandedUserMeals] = useState<any[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  // Past Meals Editor States
  const [pastRecordDate, setPastRecordDate] = useState('');
  const [showPastMealEditor, setShowPastMealEditor] = useState(false);
  const [loadingPastMeals, setLoadingPastMeals] = useState(false);
  const [savingPastMeals, setSavingPastMeals] = useState(false);
  const [pastMeals, setPastMeals] = useState({ breakfast: false, lunch: false, dinner: false });

  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user', balance: 0, location: 'none' });
  const [paymentForm, setPaymentForm] = useState({ userId: '', amount: 12000, month: '', notes: '' });
  const [settingsForm, setSettingsForm] = useState({ breakfast: '07:30', lunch: '10:00', dinner: '18:00' });
  const [reportMonth, setReportMonth] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportPointPrice, setReportPointPrice] = useState(0);
  const [reportTotalPoints, setReportTotalPoints] = useState(0);

  // Local helper dates
  const [currentMonthStr, setCurrentMonthStr] = useState('');
  useEffect(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonthStr(`${year}-${month}`);
    setPaymentForm(prev => ({ ...prev, month: `${year}-${month}` }));
    setReportMonth(`${year}-${month}`);
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resStats, resUsers, resPayments, resSettings, resHistory] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/history')
      ]);

      const jsonStats = await resStats.json();
      const jsonUsers = await resUsers.json();
      const jsonPayments = await resPayments.json();
      const jsonSettings = await resSettings.json();
      const jsonHistory = await resHistory.json();

      if (jsonStats.success) setStatsData(jsonStats);
      if (jsonUsers.success) setUsersList(jsonUsers.users);
      if (jsonPayments.success) setPaymentsList(jsonPayments.payments);
      if (jsonSettings.success) {
        setCutoffTimes(jsonSettings.cutoffTimes);
        setSettingsForm(jsonSettings.cutoffTimes);
      }
      if (jsonHistory.success) setHistoryLogs(jsonHistory.logs);

    } catch (err) {
      setError('Connection error loading admin utilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const handleToggleUserExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setExpandedUserMeals([]);
      return;
    }

    setExpandedUserId(userId);
    setExpandedUserMeals([]);
    setLoadingMeals(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setExpandedUserMeals(json.meals);
      }
    } catch (err) {
      console.error('Error fetching user meals:', err);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleSelectPastDate = (val: string) => {
    setPastRecordDate(val);
    setShowPastMealEditor(false);
  };

  const loadPastMealRecord = async () => {
    if (!editingUser || !pastRecordDate) return;
    setLoadingPastMeals(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${editingUser._id}&date=${pastRecordDate}`);
      const json = await res.json();
      if (json.success) {
        setPastMeals({
          breakfast: json.meal?.breakfast || false,
          lunch: json.meal?.lunch || false,
          dinner: json.meal?.dinner || false
        });
        setShowPastMealEditor(true);
      } else {
        flashError(json.message || 'Error loading meal records');
      }
    } catch (err) {
      console.error('Error fetching past meal record:', err);
      flashError('Failed to fetch meal record');
    } finally {
      setLoadingPastMeals(false);
    }
  };

  const savePastMealRecord = async () => {
    if (!editingUser || !pastRecordDate) return;
    setSavingPastMeals(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_meals',
          userId: editingUser._id,
          date: pastRecordDate,
          ...pastMeals
        })
      });
      const json = await res.json();
      if (json.success) {
        flashSuccess('Past meal record updated successfully!');
        loadAllAdminData();
      } else {
        flashError(json.message || 'Failed to update past meals');
      }
    } catch (err) {
      console.error('Error saving past meal record:', err);
      flashError('Failed to save past meal record');
    } finally {
      setSavingPastMeals(false);
    }
  };

  useEffect(() => {
    if (!editingUser) {
      setPastRecordDate('');
      setShowPastMealEditor(false);
    }
  }, [editingUser]);

  // Manage Users: Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('User registered successfully');
        setShowAddUser(false);
        setUserForm({ name: '', email: '', password: '', role: 'user', balance: 0, location: 'none' });
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to register user');
      }
    } catch (err) {
      flashError('Server error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Users: Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser._id,
          ...editingUser
        })
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('User updated successfully');
        setEditingUser(null);
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to update user');
      }
    } catch (err) {
      flashError('Server error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Users: Delete User
  const handleDeleteUser = async () => {
    if (!editingUser) return;
    const confirmDelete = window.confirm(`Are you absolutely sure you want to permanently delete user account "${editingUser.name}"? This will delete all of their logged meal requests and payments history!`);
    if (!confirmDelete) return;

    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users?userId=${editingUser._id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('User account and associated records deleted successfully');
        setEditingUser(null);
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      flashError('Server error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Payments: Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('Payment recorded successfully');
        setShowAddPayment(false);
        setPaymentForm({ userId: '', amount: 12000, month: currentMonthStr, notes: '' });
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to record payment');
      }
    } catch (err) {
      flashError('Server error recording payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Payments: Edit Payment
  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: editingPayment._id,
          amount: editingPayment.amount,
          notes: editingPayment.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('Payment updated successfully');
        setEditingPayment(null);
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to update payment');
      }
    } catch (err) {
      flashError('Server error updating payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Settings: Save Cutoffs
  const handleSaveCutoffs = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess('Cut-off times updated successfully');
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      flashError('Server error saving settings');
    } finally {
      setActionLoading(false);
    }
  };

  // Monthly Chammery Budget Allocation
  const handleSaveAllocation = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonthStr, amount: Number(allocationAmountForm) })
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess(`Allocation for ${currentMonthStr} updated to Rs. ${Number(allocationAmountForm).toLocaleString()}`);
        setShowAllocationModal(false);
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to save allocation');
      }
    } catch (err) {
      flashError('Server error saving allocation');
    } finally {
      setActionLoading(false);
    }
  };

  // Monthly Finalization
  const handleFinalizeMonth = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonthStr })
      });
      const data = await res.json();
      if (data.success) {
        flashSuccess(`Month ${currentMonthStr} finalized. Deductions completed & emails sent.`);
        setFinalizeConfirm(false);
        await loadAllAdminData();
      } else {
        flashError(data.message || 'Failed to finalize month');
      }
    } catch (err) {
      flashError('Server error finalising month');
    } finally {
      setActionLoading(false);
    }
  };

  // Load report data
  const loadReports = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?month=${reportMonth}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.reports);
        setReportPointPrice(json.pointPrice || 0);
        const ptsTotal = (json.reports || []).reduce((acc: number, r: any) => acc + (r.totalPoints || 0), 0);
        setReportTotalPoints(ptsTotal);
      } else {
        flashError('Failed to retrieve reports');
      }
    } catch (err) {
      flashError('Connection error loading reports');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (reportData.length === 0) return;

    const element = document.getElementById('printable-report-card');
    if (!element) return;

    const runHtml2Pdf = () => {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `uk-chammery-report-${reportMonth}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      // Create a style element to override styles for PDF generation
      const pdfStyle = document.createElement('style');
      pdfStyle.id = 'pdf-temp-style';
      pdfStyle.innerHTML = `
        #printable-report-card .print-header-logo {
          display: flex !important;
        }
        #printable-report-card .no-print {
          display: none !important;
        }
        #printable-report-card {
          padding: 15px !important;
          background: #ffffff !important;
          box-shadow: none !important;
          border: none !important;
        }
        #printable-report-card .report-summary-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
        }
        #printable-report-card table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10px !important;
        }
        #printable-report-card th {
          background-color: #1B5E20 !important;
          color: #ffffff !important;
          padding: 8px !important;
        }
        #printable-report-card td {
          padding: 8px !important;
          border-bottom: 1px solid #eeeeee !important;
        }
        #printable-report-card tr.totals-row td {
          background-color: #e8f5e9 !important;
        }
      `;
      document.head.appendChild(pdfStyle);

      // @ts-ignore
      window.html2pdf().from(element).set(opt).save().then(() => {
        // Clean up temporary styles
        const styleEl = document.getElementById('pdf-temp-style');
        if (styleEl) styleEl.remove();
      });
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = runHtml2Pdf;
      document.body.appendChild(script);
    } else {
      runHtml2Pdf();
    }
  };

  useEffect(() => {
    if (activeTab === 'reports' && reportMonth) {
      loadReports();
    }
  }, [activeTab, reportMonth]);

  if (loading) {
    return <Preloader message="Loading admin panel..." />;
  }

  const { stats, charts } = statsData;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media screen {
          .print-header-logo {
            display: none !important;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-header-logo {
            display: flex !important;
          }
          body, html, #__next, .container-with-bottom-nav {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: none !important;
          }
          #printable-report-card {
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th {
            background-color: #1B5E20 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr:nth-child(even) td {
            background-color: #fafafa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tfoot tr, tr.totals-row td {
            background-color: #e8f5e9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      {/* Top Navbar */}
      <div className="navbar no-print">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/uklogo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <span>UK-Chammery Admin</span>
        </div>
        <div className="navbar-actions">
          <button 
            onClick={loadAllAdminData} 
            className="btn btn-secondary" 
            style={{ minWidth: '40px', padding: '8px', minHeight: '40px', border: 'none' }}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={onLogout} 
            className="btn btn-secondary" 
            style={{ minWidth: '40px', padding: '8px', minHeight: '40px', border: 'none', color: 'var(--error)' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="container container-with-bottom-nav">
        {/* Success/Error Alerts */}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. STATS TAB */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card" style={{ padding: '14px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Active Users</span>
                <h3 style={{ fontSize: '1.4rem' }}>{stats.activeUsers} / {stats.registeredUsers}</h3>
              </div>

              <div className="card" style={{ padding: '14px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Total balance</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--success)' }}>Rs. {stats.totalMonthlyCollection.toLocaleString()}</h3>
              </div>

              <div 
                className="card" 
                style={{ padding: '14px', gap: '4px', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} 
                onClick={() => {
                  setAllocationAmountForm(stats.allocatedAmount || 0);
                  setShowAllocationModal(true);
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>This Month Chammery Allocated</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Rs. {(stats.allocatedAmount || 0).toLocaleString()}</h3>
              </div>

              <div className="card" style={{ padding: '14px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Balance for next month chammery</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--success)' }}>Rs. {(stats.totalMonthlyCollection - (stats.allocatedAmount || 0)).toLocaleString()}</h3>
              </div>

              <div className="card" style={{ padding: '14px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Total Points Used</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>{stats.currentTotalPoints} pts</h3>
              </div>

              <div className="card" style={{ padding: '14px', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Est. Point Price</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Rs. {stats.estimatedPointPrice.toFixed(2)}</h3>
              </div>

              <div 
                className="card" 
                style={{ padding: '14px', gap: '4px', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} 
                onClick={() => setShowPendingPaymentsModal(true)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>This Month</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--warning)' }}>{stats.pendingPayments} users</h3>
              </div>

              <div 
                className="card" 
                style={{ padding: '14px', gap: '4px', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} 
                onClick={() => setShowDueBalancesModal(true)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Due Wallet Balances</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--error)' }}>{stats.usersWithDueBalances} users</h3>
              </div>
            </div>

            {/* Daily Meal Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Current Month Requests</h3>
              
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: '16px', flexWrap: 'wrap' }}>
                {/* SVG Donut Chart */}
                {(() => {
                  const b = stats.breakfastRequests || 0;
                  const l = stats.lunchRequests || 0;
                  const d = stats.dinnerRequests || 0;
                  const total = b + l + d;
                  
                  if (total === 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="30" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                        </svg>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>No requests logged</span>
                      </div>
                    );
                  }

                  const bPercent = b / total;
                  const lPercent = l / total;
                  const dPercent = d / total;

                  // Circle radius = 30, circumference = 188.5
                  const circ = 188.5;
                  const bStroke = bPercent * circ;
                  const lStroke = lPercent * circ;
                  const dStroke = dPercent * circ;

                  // Slices offsets
                  const bOffset = 0;
                  const lOffset = -bStroke;
                  const dOffset = -(bStroke + lStroke);

                  return (
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Breakfast (Gold) */}
                        {b > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="30"
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="14"
                            strokeDasharray={`${bStroke} ${circ}`}
                            strokeDashoffset={bOffset}
                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                          />
                        )}
                        {/* Lunch (Forest Green) */}
                        {l > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="30"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="14"
                            strokeDasharray={`${lStroke} ${circ}`}
                            strokeDashoffset={lOffset}
                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                          />
                        )}
                        {/* Dinner (Emerald Green) */}
                        {d > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="30"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="14"
                            strokeDasharray={`${dStroke} ${circ}`}
                            strokeDashoffset={dOffset}
                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                          />
                        )}
                      </svg>
                      {/* Center text showing total requests */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--foreground)' }}>{total}</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Orders</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Legend & Stats Details */}
                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div style={{ backgroundColor: '#FFFDF5', border: '1px solid #FEF3C7', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', fontWeight: 600 }}>Breakfast</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.breakfastRequests}</span>
                    </div>
                    <div style={{ backgroundColor: '#F9FDFB', border: '1px solid #D1FAE5', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', fontWeight: 600 }}>Lunch</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.lunchRequests}</span>
                    </div>
                    <div style={{ backgroundColor: '#F9FBFF', border: '1px solid #DBEAFE', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', fontWeight: 600 }}>Dinner</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>{stats.dinnerRequests}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '6px', fontSize: '0.72rem', color: 'var(--muted)' }}>
                    <span>UK: <strong>{stats.dinnerUKRequests || 0}</strong></span>
                    <span>UK2: <strong>{stats.dinnerUK2Requests || 0}</strong></span>
                    <span>Kadana: <strong>{stats.dinnerKadanaRequests || 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual SVG Chart: Consumption Ranking */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>Top User Consumption Ranking</h3>
              {charts.userRanking.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '10px', fontSize: '0.85rem' }}>No orders registered this month.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  {charts.userRanking.map((rank: any, i: number) => {
                    const maxPoints = charts.userRanking[0]?.points || 1;
                    const percent = Math.round((rank.points / maxPoints) * 100);
                    return (
                      <div key={`rank-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span>{rank.name}</span>
                          <span style={{ color: 'var(--primary)' }}>{rank.points} points</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit History mini log */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <History size={16} /> Recent Activity Logs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px', marginTop: '4px' }}>
                {historyLogs.slice(0, 5).map((log: any) => (
                  <div key={log._id} style={{ fontSize: '0.75rem', borderBottom: '1px solid #f9f9f9', paddingBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                      <strong>{log.action}</strong>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ color: 'var(--foreground)', margin: '2px 0 0 0' }}>{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>User Accounts</h3>
              {!showAddUser && !editingUser && (
                <button className="btn btn-primary" onClick={() => { setShowAddUser(true); setEditingUser(null); }} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserPlus size={16} /> Register User
                </button>
              )}
            </div>

            {/* Register New User Inline Card */}
            {showAddUser && (
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>Register New User</h3>
                <form onSubmit={handleAddUser}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                      <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required placeholder="e.g. Nimal Perera" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                      <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required placeholder="nimal@ukchammery.com" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
                      <input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required placeholder="Create temporary password" />
                    </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
                      <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} required>
                        <option value="user">Office Staff</option>
                        <option value="cook">Cook / Chef</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {userForm.role === 'user' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Location</label>
                        <select value={userForm.location || 'none'} onChange={e => setUserForm({...userForm, location: e.target.value})}>
                          <option value="none">Office (None)</option>
                          <option value="UK Guest">UK Guest</option>
                          <option value="UK Guest 2">UK Guest 2</option>
                          <option value="Kadana Guest">Kadana Guest</option>
                        </select>
                      </div>
                    )}

                    </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>
                      {actionLoading ? 'Saving...' : 'Register'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit User Account Inline Card */}
            {editingUser && (
              <div className="card" style={{ borderLeft: '4px solid var(--warning)', padding: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>Edit User Account</h3>
                <form onSubmit={handleUpdateUser}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                      <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                      <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
                    </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role</label>
                      <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} required>
                        <option value="user">Office Staff</option>
                        <option value="cook">Cook / Chef</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {editingUser.role === 'user' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Location</label>
                        <select value={editingUser.location || 'none'} onChange={e => setEditingUser({...editingUser, location: e.target.value})}>
                          <option value="none">Office (None)</option>
                          <option value="UK Guest">UK Guest</option>
                          <option value="UK Guest 2">UK Guest 2</option>
                          <option value="Kadana Guest">Kadana Guest</option>
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status</label>
                      <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})} required>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {(editingUser.role === 'user' || editingUser.role === 'cook') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Balance (Rs.)</label>
                        <input type="number" value={editingUser.balance} onChange={e => setEditingUser({...editingUser, balance: Number(e.target.value)})} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Reset Password (leave empty to keep same)</label>
                      <input type="text" placeholder="New password" onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                    </div>

                    {editingUser.role === 'user' && (
                      <div 
                        style={{ 
                          marginTop: '16px', 
                          paddingTop: '16px', 
                          borderTop: '2px dashed var(--border)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px'
                        }}
                      >
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>
                          Manage Past Meal Records
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Select Date</label>
                            <input 
                              type="date" 
                              value={pastRecordDate} 
                              onChange={e => handleSelectPastDate(e.target.value)} 
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ minHeight: '38px', padding: '0 12px', fontSize: '0.8rem' }}
                            onClick={loadPastMealRecord}
                            disabled={!pastRecordDate || loadingPastMeals}
                          >
                            {loadingPastMeals ? 'Loading...' : 'Get Meals'}
                          </button>
                        </div>

                        {showPastMealEditor && (
                          <div style={{ 
                            backgroundColor: 'var(--bg-light)', 
                            padding: '12px', 
                            borderRadius: 'var(--radius-sm)', 
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>
                              Meal selections for {pastRecordDate}:
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={pastMeals.breakfast} 
                                  onChange={e => setPastMeals({ ...pastMeals, breakfast: e.target.checked })} 
                                />
                                Breakfast (1 pt)
                              </label>
                              
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={pastMeals.lunch} 
                                  onChange={e => setPastMeals({ ...pastMeals, lunch: e.target.checked })} 
                                />
                                Lunch (2 pts)
                              </label>
                              
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={pastMeals.dinner} 
                                  onChange={e => setPastMeals({ ...pastMeals, dinner: e.target.checked })} 
                                />
                                Dinner (1 pt)
                              </label>
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ width: '100%', minHeight: '34px', fontSize: '0.8rem', marginTop: '4px' }}
                              onClick={savePastMealRecord}
                              disabled={savingPastMeals}
                            >
                              {savingPastMeals ? 'Saving...' : 'Save Meal Records'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>
                        {actionLoading ? 'Updating...' : 'Save Changes'}
                      </button>
                    </div>
                    {editingUser._id !== user.userId && (
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        disabled={actionLoading}
                        onClick={handleDeleteUser}
                        style={{ width: '100%', minHeight: '38px', backgroundColor: 'var(--error)', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete User Account
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {usersList.map((u: any) => (
                <div 
                  key={u._id} 
                  className="card" 
                  style={{ 
                    padding: '16px', 
                    gap: '6px', 
                    borderLeft: `4px solid ${u.role === 'admin' ? 'var(--primary)' : u.role === 'cook' ? 'var(--accent)' : '#ccc'}`,
                    cursor: u.role === 'user' ? 'pointer' : 'default'
                  }}
                  onClick={() => u.role === 'user' && handleToggleUserExpand(u._id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={e => e.stopPropagation()}>
                    <div>
                      <h4 style={{ fontSize: '1rem', color: 'var(--foreground)' }}>{u.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {u.role === 'user' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', minHeight: '32px' }}
                          onClick={() => handleToggleUserExpand(u._id)}
                        >
                          {expandedUserId === u._id ? 'Hide Points' : 'View Points'}
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingUser(u); setShowAddUser(false); }} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', minWidth: '32px', minHeight: '32px', border: 'none' }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginTop: '4px' }}>
                    <div>
                      <span className="badge badge-success" style={{ marginRight: '6px', fontSize: '0.65rem' }}>{u.role === 'user' ? 'Office Staff' : u.role === 'cook' ? 'Cook / Chef' : 'Administrator'}</span>
                      {u.role === 'user' && u.location && u.location !== 'none' && (
                        <span className="badge" style={{ marginRight: '6px', fontSize: '0.65rem', backgroundColor: 'var(--accent)', color: 'white' }}>{u.location}</span>
                      )}
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>{u.status}</span>
                    </div>
                    {(u.role === 'user' || u.role === 'cook') && (
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        Balance: Rs. {u.balance.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Expanded view for user meal logs */}
                  {expandedUserId === u._id && u.role === 'user' && (
                    <div 
                      style={{ 
                        marginTop: '12px', 
                        paddingTop: '12px', 
                        borderTop: '1px dotted var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      onClick={e => e.stopPropagation()} // prevent double-closing when clicking logs
                    >
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: 0, fontWeight: 700 }}>
                        Current Month Meal Consumption
                      </h5>
                      
                      {loadingMeals ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '6px 0' }}>
                          Loading consumption logs...
                        </div>
                      ) : expandedUserMeals.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '6px 0' }}>
                          No meal requests recorded for this user this month.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                          {/* Aggregate Summary */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr 1.2fr', 
                            gap: '6px', 
                            backgroundColor: 'var(--bg-light)', 
                            padding: '8px', 
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            border: '1px solid var(--border)'
                          }}>
                            <div>B: {expandedUserMeals.filter(m => m.breakfast).length}</div>
                            <div>L: {expandedUserMeals.filter(m => m.lunch).length}</div>
                            <div>D: {expandedUserMeals.filter(m => m.dinner).length}</div>
                            <div style={{ color: 'var(--primary)' }}>Total: {expandedUserMeals.reduce((acc, m) => acc + m.points, 0)} pts</div>
                          </div>
                          
                          {/* Request List */}
                          <div className="table-container" style={{ margin: 0 }}>
                            <table style={{ fontSize: '0.75rem' }}>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th style={{ textAlign: 'center' }}>B</th>
                                  <th style={{ textAlign: 'center' }}>L</th>
                                  <th style={{ textAlign: 'center' }}>D</th>
                                  <th style={{ textAlign: 'center' }}>Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedUserMeals.map((m: any) => (
                                  <tr key={m._id}>
                                    <td style={{ fontWeight: 600 }}>{m.date}</td>
                                    <td style={{ textAlign: 'center' }}>{m.breakfast ? '✓' : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{m.lunch ? '✓' : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{m.dinner ? '✓' : '-'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{m.points}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Payment Logs</h3>
              {!showAddPayment && !editingPayment && (
                <button className="btn btn-primary" onClick={() => { setShowAddPayment(true); setEditingPayment(null); }} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={16} /> Record Payment
                </button>
              )}
            </div>

            {/* Inline: Record Payment Form Card */}
            {showAddPayment && (
              <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>Record Received Payment</h3>
                <form onSubmit={handleAddPayment}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select User</label>
                      <select 
                        value={paymentForm.userId} 
                        onChange={e => setPaymentForm({...paymentForm, userId: e.target.value})} 
                        required
                      >
                        <option value="">-- Select Office Staff --</option>
                        {usersList.filter(u => u.role === 'user' && u.status === 'active').map(u => (
                          <option key={u._id} value={u._id}>{u.name} (Bal: Rs. {u.balance})</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Month</label>
                      <input 
                        type="month" 
                        value={paymentForm.month} 
                        onChange={e => setPaymentForm({...paymentForm, month: e.target.value})} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Amount (Rs.)</label>
                      <input 
                        type="number" 
                        value={paymentForm.amount} 
                        onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Optional Notes</label>
                      <input 
                        type="text" 
                        value={paymentForm.notes} 
                        onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} 
                        placeholder="Receipt reference, cash, bank details..." 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddPayment(false)} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>
                      {actionLoading ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Inline: Edit Payment Form Card */}
            {editingPayment && (
              <div className="card" style={{ borderLeft: '4px solid var(--warning)', padding: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>Edit Payment Record</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Modifying this payment will automatically adjust the user balance by the difference.
                </p>
                <form onSubmit={handleUpdatePayment}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>User Name</label>
                      <input type="text" value={editingPayment.userId?.name || 'Staff'} disabled />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Month</label>
                      <input 
                        type="month" 
                        value={editingPayment.month} 
                        onChange={e => setEditingPayment({...editingPayment, month: e.target.value})} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Amount (Rs.)</label>
                      <input 
                        type="number" 
                        value={editingPayment.amount} 
                        onChange={e => setEditingPayment({...editingPayment, amount: Number(e.target.value)})} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notes</label>
                      <input 
                        type="text" 
                        value={editingPayment.notes || ''} 
                        onChange={e => setEditingPayment({...editingPayment, notes: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingPayment(null)} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }}>
                      {actionLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentsList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No payments recorded.</p>
              ) : (
                paymentsList.map((p: any) => (
                  <div key={p._id} className="card" style={{ padding: '16px', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } as any}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--foreground)' }}>{p.userId?.name || 'Unknown User'}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          Month: <strong>{p.month}</strong> | Date: {new Date(p.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => { setEditingPayment(p); setShowAddPayment(false); }}
                        className="btn btn-secondary" 
                        style={{ padding: '6px', minWidth: '32px', minHeight: '32px', border: 'none' }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Recorded by: {p.recordedBy?.name || 'Admin'}</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                        Rs. {p.amount.toLocaleString()}
                      </span>
                    </div>
                    {p.notes && (
                      <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--muted)', margin: 0 }}>
                        Note: {p.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Generate Statements & Reports
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Billing Month</label>
                  <input 
                    type="month" 
                    value={reportMonth} 
                    onChange={e => setReportMonth(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={loadReports} disabled={actionLoading} style={{ minHeight: '38px' }}>
                    Generate List
                  </button>
                  <a 
                    href={`/api/admin/reports?month=${reportMonth}&format=csv`}
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', minHeight: '38px' }}
                  >
                    <Download size={15} /> CSV
                  </a>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleDownloadPDF} 
                    disabled={reportData.length === 0}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', minHeight: '38px' }}
                  >
                    <FileText size={15} /> PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Compiled Directory list */}
            <div className="card" style={{ padding: '16px' }} id="printable-report-card">
              {/* Print Header Logo (only visible during print) */}
              <div className="print-header-logo" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1B5E20', paddingBottom: '16px', marginBottom: '20px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/uklogo.png" alt="Logo" style={{ height: '50px', width: 'auto' }} />
                  <div>
                    <h1 style={{ fontSize: '1.5rem', color: '#1B5E20', margin: 0, fontWeight: 800 }}>UK-Chammery</h1>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '2px 0 0 0' }}>Office Dining Portal & Billing Reports</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#333' }}>
                  <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Monthly Meal Statement</h2>
                  <p style={{ margin: '2px 0 0 0' }}>Billing Month: <strong>{reportMonth}</strong></p>
                  <p style={{ margin: '2px 0 0 0' }}>Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <h3 className="no-print" style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>
                Report Table - {reportMonth}
              </h3>

              {/* Summary Cards */}
              {reportData.length > 0 && (
                <div className="report-summary-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px', 
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    backgroundColor: 'var(--bg-light)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Billing Month</span>
                    <h4 style={{ fontSize: '1.1rem', margin: '4px 0 0 0', fontWeight: 800, color: 'var(--foreground)' }}>{reportMonth}</h4>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--bg-light)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Point Price</span>
                    <h4 style={{ fontSize: '1.1rem', margin: '4px 0 0 0', fontWeight: 800, color: 'var(--primary)' }}>Rs. {reportPointPrice.toFixed(2)}</h4>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--bg-light)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Points Used</span>
                    <h4 style={{ fontSize: '1.1rem', margin: '4px 0 0 0', fontWeight: 800, color: 'var(--foreground)' }}>{reportTotalPoints} pts</h4>
                  </div>
                </div>
              )}
              
              <div className="table-container" style={{ marginTop: '6px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>This Month Payment</th>
                      <th>After Balance</th>
                      <th style={{ textAlign: 'center' }}>B</th>
                      <th style={{ textAlign: 'center' }}>L</th>
                      <th style={{ textAlign: 'center' }}>D</th>
                      <th style={{ textAlign: 'center' }}>Pts</th>
                      <th>Cost This Month Total</th>
                      <th>Now Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                          No report compiled yet. Select a month and search.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {reportData.map((row: any, index: number) => {
                          const isNegative = row.nowBalance < 0;
                          return (
                            <tr key={`rep-${index}`}>
                              <td style={{ fontWeight: 600 }}>{row.name}</td>
                              <td>Rs. {row.monthlyPayment.toLocaleString()}</td>
                              <td>Rs. {row.afterBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td style={{ textAlign: 'center' }}>{row.breakfastCount}</td>
                              <td style={{ textAlign: 'center' }}>{row.lunchCount}</td>
                              <td style={{ textAlign: 'center' }}>{row.dinnerCount}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalPoints}</td>
                              <td style={{ color: 'var(--error)' }}>Rs. {row.totalMealCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td style={{ 
                                color: isNegative ? 'var(--error)' : 'var(--success)', 
                                fontWeight: 'bold' 
                              }}>
                                {isNegative ? '-' : ''}Rs. {Math.abs(row.nowBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals Row */}
                        <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', borderTop: '2px solid var(--primary)' }} className="totals-row">
                          <td>TOTALS</td>
                          <td>Rs. {reportData.reduce((acc, row) => acc + row.monthlyPayment, 0).toLocaleString()}</td>
                          <td>Rs. {reportData.reduce((acc, row) => acc + row.afterBalance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'center' }}>{reportData.reduce((acc, row) => acc + row.breakfastCount, 0)}</td>
                          <td style={{ textAlign: 'center' }}>{reportData.reduce((acc, row) => acc + row.lunchCount, 0)}</td>
                          <td style={{ textAlign: 'center' }}>{reportData.reduce((acc, row) => acc + row.dinnerCount, 0)}</td>
                          <td style={{ textAlign: 'center' }}>{reportData.reduce((acc, row) => acc + row.totalPoints, 0)}</td>
                          <td style={{ color: 'var(--error)' }}>Rs. {reportData.reduce((acc, row) => acc + row.totalMealCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>
                            <div style={{ color: 'var(--success)' }}>Bal: Rs. {reportData.reduce((acc, row) => row.nowBalance > 0 ? acc + row.nowBalance : acc, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            {reportData.reduce((acc, row) => row.nowBalance < 0 ? acc + row.nowBalance : acc, 0) < 0 && (
                              <div style={{ color: 'var(--error)' }}>Due: -Rs. {Math.abs(reportData.reduce((acc, row) => row.nowBalance < 0 ? acc + row.nowBalance : acc, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form className="card" onSubmit={handleSaveCutoffs}>
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Cut-off Times Configurations
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Configure when meal ordering closes for each meal type. After these times, new requests apply to the next calendar date.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Breakfast Cut-off Time (24-hour)</label>
                  <input 
                    type="text" 
                    value={settingsForm.breakfast} 
                    onChange={e => setSettingsForm({...settingsForm, breakfast: e.target.value})} 
                    placeholder="07:30" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lunch Cut-off Time (24-hour)</label>
                  <input 
                    type="text" 
                    value={settingsForm.lunch} 
                    onChange={e => setSettingsForm({...settingsForm, lunch: e.target.value})} 
                    placeholder="10:00" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dinner Cut-off Time (24-hour)</label>
                  <input 
                    type="text" 
                    value={settingsForm.dinner} 
                    onChange={e => setSettingsForm({...settingsForm, dinner: e.target.value})} 
                    placeholder="18:00" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ width: '100%', marginTop: '8px' }}>
                {actionLoading ? 'Saving config...' : 'Save Cut-off Times'}
              </button>
            </form>

            <div className="card">
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                End of Month Finalization
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Finalize the calculations for the current month. The system will:
              </p>

              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Aggregate all employee balances (Rs. {stats.totalMonthlyCollection.toLocaleString()}).</li>
                <li>Use the allocated chammery amount: <strong>Rs. {(stats.allocatedAmount || 0).toLocaleString()}</strong>.</li>
                <li>Aggregate total points consumed by all users ({stats.currentTotalPoints} points).</li>
                <li>Compute point price based on allocation: <strong>Rs. {stats.estimatedPointPrice.toFixed(2)}</strong>.</li>
                <li>Deduct calculated food costs from each staff member's balance.</li>
                <li>Generate monthly invoice statements and email reports automatically.</li>
              </ul>

              <div className="alert alert-warning" style={{ marginTop: '8px' }}>
                <AlertCircle size={18} />
                <span>WARNING: This action is permanent and can only be performed once per month.</span>
              </div>

              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ width: '100%', marginTop: '12px' }}
                onClick={() => setFinalizeConfirm(true)}
              >
                Finalize Month ({currentMonthStr})
              </button>

              {/* Modal: Confirm Finalization */}
              {finalizeConfirm && (
                <div className="modal-overlay" onClick={() => setFinalizeConfirm(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--error)' }}>
                      Confirm Finalization
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
                      Are you absolutely sure you want to lock the points price at <strong>Rs. {stats.estimatedPointPrice.toFixed(2)}</strong> and deduct food costs for the month of <strong>{currentMonthStr}</strong>?
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="btn btn-secondary" onClick={() => setFinalizeConfirm(false)} style={{ flex: 1 }}>Cancel</button>
                      <button 
                        className="btn btn-danger" 
                        onClick={handleFinalizeMonth} 
                        disabled={actionLoading}
                        style={{ flex: 1 }}
                      >
                        {actionLoading ? 'Processing...' : 'Yes, Lock & Deduct'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Bottom Tab Navigation Bar */}
      <div className="bottom-nav no-print" style={{ 
        height: '64px', 
        backgroundColor: '#ffffff', 
        borderTop: '1.5px solid var(--border)',
        borderRadius: '24px 24px 0 0',
        padding: '0 8px',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 -8px 30px rgba(6, 78, 59, 0.06)',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Sliding Active Indicator Circle */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: `calc(${getActiveTabIndex() * 20}% + (20% - 48px) / 2)`,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          transition: 'left 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)', /* Fluid spring slide */
          zIndex: 1,
          boxShadow: '0 6px 16px rgba(6, 78, 59, 0.22)'
        }} />

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {/* Item 1: Dashboard */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveTab('stats')}
            style={{ 
              flex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              border: 'none', 
              background: 'transparent',
              color: activeTab === 'stats' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Home size={20} />
            {activeTab !== 'stats' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Dashboard</span>}
          </button>

          {/* Item 2: Users */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveTab('users')}
            style={{ 
              flex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              border: 'none', 
              background: 'transparent',
              color: activeTab === 'users' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Users size={20} />
            {activeTab !== 'users' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Users</span>}
          </button>

          {/* Item 3: Payments */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveTab('payments')}
            style={{ 
              flex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              border: 'none', 
              background: 'transparent',
              color: activeTab === 'payments' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Coins size={20} />
            {activeTab !== 'payments' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Payments</span>}
          </button>

          {/* Item 4: Reports */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveTab('reports')}
            style={{ 
              flex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              border: 'none', 
              background: 'transparent',
              color: activeTab === 'reports' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <FileText size={20} />
            {activeTab !== 'reports' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Reports</span>}
          </button>

          {/* Item 5: Settings */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveTab('settings')}
            style={{ 
              flex: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              border: 'none', 
              background: 'transparent',
              color: activeTab === 'settings' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Settings size={20} />
            {activeTab !== 'settings' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Settings</span>}
          </button>
        </div>
      </div>

      {/* Modals: Pending Payments and Due Wallet Balances */}
      {showPendingPaymentsModal && (() => {
        const paidUserIds = paymentsList
          .filter(p => p.month === currentMonthStr && p.status === 'paid')
          .map(p => p.userId?._id || p.userId);
        const pendingPaymentUsers = usersList.filter(u => 
          u.role === 'user' && 
          u.status === 'active' && 
          !paidUserIds.includes(u._id)
        );
        return (
          <div className="modal-overlay" onClick={() => setShowPendingPaymentsModal(false)}>
            <div className="modal-content animate-slideup" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} style={{ color: 'var(--warning)' }} /> This Month
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', textAlign: 'left' }}>
                Active staff who have not registered their payment for <strong>{currentMonthStr}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', margin: '8px 0', width: '100%' }}>
                {pendingPaymentUsers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No pending payments this month!</p>
                ) : (
                  pendingPaymentUsers.map(u => (
                    <div key={u._id} style={{ 
                      padding: '12px 16px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1.5px solid var(--border)', 
                      backgroundColor: 'var(--bg-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                        👤 {u.name}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginRight: '6px' }}>Balance:</span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: u.balance < 0 ? 'var(--error)' : 'var(--success)' }}>
                          Rs. {u.balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className="btn btn-secondary" onClick={() => setShowPendingPaymentsModal(false)} style={{ width: '100%', marginTop: '8px' }}>
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {showDueBalancesModal && (() => {
        const dueBalanceUsers = usersList.filter(u => 
          u.role === 'user' && 
          u.status === 'active' && 
          u.balance <= 0
        );
        return (
          <div className="modal-overlay" onClick={() => setShowDueBalancesModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: 'var(--error)' }} /> Due Wallet Balances
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', textAlign: 'left' }}>
                Active staff whose wallet balances are negative or zero (dues).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', margin: '8px 0', width: '100%' }}>
                {dueBalanceUsers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No outstanding dues!</p>
                ) : (
                  dueBalanceUsers.map(u => (
                    <div key={u._id} style={{ 
                      padding: '12px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1.5px solid var(--border)', 
                      backgroundColor: 'var(--bg-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Due Amount</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--error)' }}>
                          Rs. {u.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button className="btn btn-secondary" onClick={() => setShowDueBalancesModal(false)} style={{ width: '100%', marginTop: '8px' }}>
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal: Update Monthly Allocation */}
      {showAllocationModal && (
        <div className="modal-overlay" onClick={() => setShowAllocationModal(false)}>
          <div className="modal-content animate-slideup" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '10px', color: 'var(--primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Set Monthly Allocation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>
              Allocate the budget/amount for the chammery for <strong>{currentMonthStr}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>Allocated Amount (Rs.)</label>
              <input 
                type="number" 
                value={allocationAmountForm} 
                onChange={(e) => setAllocationAmountForm(e.target.value)} 
                placeholder="Enter allocated amount"
                style={{ padding: '12px 16px', borderRadius: '9999px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAllocationModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveAllocation} 
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: 'var(--success)', border: 'none', color: '#ffffff' }}
              >
                {actionLoading ? 'Saving...' : 'Save Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
