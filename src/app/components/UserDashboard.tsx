'use client';

import { useState, useEffect } from 'react';
import { LogOut, Bell, Calendar, History, Coins, Check, X, AlertCircle, Home, FileText, Settings, Coffee, Utensils, Sunset, Lock, ClipboardList } from 'lucide-react';
import Preloader from '@/app/components/Preloader';

interface UserDashboardProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
    balance: number;
  };
  onLogout: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [toggleLoading, setToggleLoading] = useState(false);
  
  // Navigation State
  const [activeSection, setActiveSection] = useState<'order' | 'report' | 'history' | 'notifications' | 'payments' | 'all_orders'>('order');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Daily Orders Summary States
  const [dailyOrders, setDailyOrders] = useState<any>(null);
  const [loadingDailyOrders, setLoadingDailyOrders] = useState(false);
  const [dailyOrdersTab, setDailyOrdersTab] = useState<'today' | 'tomorrow'>('today');

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getActiveTabIndex = () => {
    switch (activeSection) {
      case 'history': return 0;
      case 'report': return 1;
      case 'order': return 2;
      case 'all_orders': return 3;
      case 'notifications': return 4;
      case 'payments': return 5;
      default: return 2;
    }
  };

  // Meal Request Form States
  const [todayMeals, setTodayMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [tomorrowMeals, setTomorrowMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [initialTodayMeals, setInitialTodayMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [initialTomorrowMeals, setInitialTomorrowMeals] = useState({ breakfast: false, lunch: false, dinner: false });

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/user/meals');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load meal requests');
      }
    } catch (err) {
      setError('Connection error loading dashboard');
    }
  };

  const loadDailyOrders = async () => {
    setLoadingDailyOrders(true);
    try {
      const res = await fetch('/api/user/daily-orders');
      const json = await res.json();
      if (json.success) {
        setDailyOrders(json);
      } else {
        setError(json.message || 'Failed to load daily orders');
      }
    } catch (err) {
      console.error('Failed to load daily orders', err);
      setError('Connection error loading daily orders');
    } finally {
      setLoadingDailyOrders(false);
    }
  };

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCopyOrdersText = (day: 'today' | 'tomorrow') => {
    const dataForDay = day === 'today' ? dailyOrders?.today : dailyOrders?.tomorrow;
    if (!dataForDay) return;
    
    const dateStr = dataForDay.date;
    const { totals, lists } = dataForDay;
    
    let text = `UK-Chammery Meal Requests Sheet\n`;
    text += `Date: ${dateStr} (${day.toUpperCase()})\n`;
    text += `========================================\n\n`;
    
    text += `Breakfast (${totals.breakfast}):\n`;
    lists.breakfast.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });
    text += `\n`;
    
    text += `Lunch (${totals.lunch}):\n`;
    lists.lunch.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });
    text += `\n`;
    
    const totalDinner = totals.dinner + (totals.dinnerUK || 0) + (totals.dinnerUK2 || 0) + (totals.dinnerKadana || 0);
    text += `Dinner (Total: ${totalDinner} | Office: ${totals.dinner}, UK: ${totals.dinnerUK || 0}, UK2: ${totals.dinnerUK2 || 0}, Kadana: ${totals.dinnerKadana || 0}):\n`;
    lists.dinner.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });
    
    navigator.clipboard.writeText(text);
    flashSuccess(`Orders for ${day} copied to clipboard!`);
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/user/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications);
        setUnreadCount(json.notifications.filter((n: any) => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadDashboardData(), loadNotifications()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (data && data.meals) {
      const todayState = {
        breakfast: data.meals.today.breakfast,
        lunch: data.meals.today.lunch,
        dinner: data.meals.today.dinner
      };
      const tomorrowState = {
        breakfast: data.meals.tomorrow.breakfast,
        lunch: data.meals.tomorrow.lunch,
        dinner: data.meals.tomorrow.dinner
      };
      setTodayMeals(todayState);
      setInitialTodayMeals(todayState);
      setTomorrowMeals(tomorrowState);
      setInitialTomorrowMeals(tomorrowState);
    }
  }, [data]);

  // Helper to check if selection differs from saved database state
  const isMealFormModified = (targetDate: string, current: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
    const initial = targetDate === today ? initialTodayMeals : initialTomorrowMeals;
    return (
      current.breakfast !== initial.breakfast ||
      current.lunch !== initial.lunch ||
      current.dinner !== initial.dinner
    );
  };

  // Helper to get submit button label
  const getButtonText = (targetDate: string) => {
    if (toggleLoading) return 'Saving...';
    const initial = targetDate === today ? initialTodayMeals : initialTomorrowMeals;
    const initialHadSelection = initial.breakfast || initial.lunch || initial.dinner;
    return initialHadSelection ? 'Update Meal Requests' : 'Submit Meal Requests';
  };

  // Submit meal request changes via button click
  const handleSubmitRequests = async (targetDate: string, mealSelections: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
    setToggleLoading(true);
    setError('');

    const isToday = targetDate === today;
    const initial = isToday ? initialTodayMeals : initialTomorrowMeals;
    const initialHadSelection = initial.breakfast || initial.lunch || initial.dinner;
    const currentHasSelection = mealSelections.breakfast || mealSelections.lunch || mealSelections.dinner;
    const isCancelling = initialHadSelection && !currentHasSelection;

    try {
      const res = await fetch('/api/user/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          ...mealSelections
        })
      });

      const json = await res.json();

      if (json.success) {
        await loadDashboardData(); // Reload stats and history
        if (isCancelling) {
          setSuccessMsg('Your meal requests have been successfully cancelled.');
        } else {
          setSuccessMsg('Meal requests updated successfully!');
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(json.message || 'Could not save meal requests');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError('Connection error submitting meal requests');
    } finally {
      setToggleLoading(false);
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      const json = await res.json();
      if (json.success) {
        setUnreadCount(0);
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all read');
    }
  };

  // Check cutoffs client side to disable buttons
  const isCutoffPassed = (meal: 'breakfast' | 'lunch' | 'dinner', date: string) => {
    if (!data) return true;
    if (date > data.today) return false; // Tomorrow or later never blocked
    
    const cutoffTime = data.cutoffTimes[meal];
    if (!cutoffTime) return true;
    
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHours > cutoffHours) return true;
    if (currentHours === cutoffHours && currentMinutes >= cutoffMinutes) return true;
    
    return false;
  };

  // Handle Password Update Form Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const json = await res.json();
      if (json.success) {
        setPasswordSuccess('Your password has been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(json.message || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError('Connection error updating password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <Preloader message="Loading dashboard..." />;
  }

  const { today, currentMonth, cutoffTimes, monthlyStats, meals, history, payment, paymentHistory } = data;
  const tomorrowStr = meals.tomorrow.date;

  const todayDateObj = new Date(today);
  const formattedToday = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const monthName = todayDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .meal-checkbox-container {
          background-color: var(--bg-light) !important;
          border: 1px solid var(--border) !important;
          border-radius: var(--radius-md) !important;
          padding: 14px 16px !important;
          transition: all 0.2s ease !important;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          margin-bottom: 2px;
        }
        .meal-checkbox-container:hover:not(.meal-locked) {
          border-color: var(--primary) !important;
          background-color: #f1f8f1 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27, 94, 32, 0.08) !important;
        }
        .meal-locked {
          background-color: #f7f7f7 !important;
          border-color: #e0e0e0 !important;
          cursor: not-allowed !important;
        }
        .meal-checkbox {
          width: 20px !important;
          height: 20px !important;
          accent-color: var(--primary) !important;
          cursor: pointer;
        }
        .meal-checkbox:disabled {
          cursor: not-allowed;
        }
        .meal-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 14px;
          margin-bottom: 8px;
        }
        @media (max-width: 600px) {
          .meal-card-grid {
            grid-template-columns: 1fr;
          }
        }
        .meal-select-card {
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background-color: #ffffff;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          gap: 8px;
          user-select: none;
        }
        .meal-select-card:hover:not(.meal-locked) {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }
        .meal-select-card.meal-selected {
          border-color: var(--primary);
          background-color: #f1f8f1;
          box-shadow: 0 4px 12px rgba(6, 78, 59, 0.05);
        }
        .meal-select-card.meal-locked {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f7f7f7;
          border-color: #e5e7eb;
        }
        .meal-card-check {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .meal-card-check-selected {
          background-color: var(--primary);
          color: white;
        }
        .meal-card-check-unselected {
          border: 1.5px solid var(--border);
        }
      `}</style>
      {/* Top Navbar */}
      <div className="navbar">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/uklogo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <span>UK-Chammery</span>
        </div>
        <div className="navbar-actions" style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '0.9rem',
              userSelect: 'none'
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {showProfileMenu && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                onClick={() => setShowProfileMenu(false)} 
              />
              <div style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '170px',
                zIndex: 999
              }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', marginBottom: '4px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
                <button 
                  onClick={() => { setShowChangePasswordModal(true); setShowProfileMenu(false); }}
                  className="btn" 
                  style={{ 
                    justifyContent: 'flex-start', 
                    minHeight: '36px', 
                    padding: '6px 12px', 
                    fontSize: '0.85rem', 
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    boxShadow: 'none',
                    borderRadius: '6px',
                    width: '100%'
                  }}
                >
                  <Settings size={16} /> Change Password
                </button>
                <button 
                  onClick={() => { onLogout(); setShowProfileMenu(false); }}
                  className="btn" 
                  style={{ 
                    justifyContent: 'flex-start', 
                    minHeight: '36px', 
                    padding: '6px 12px', 
                    fontSize: '0.85rem', 
                    backgroundColor: 'transparent',
                    color: 'var(--error)',
                    boxShadow: 'none',
                    borderRadius: '6px',
                    width: '100%'
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="container container-with-bottom-nav">
        {/* Error Banner */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Modal Popup Overlay */}
        {successMsg && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              padding: '24px', 
              gap: '16px',
              maxWidth: '340px',
              width: '90%'
            }}>
              <div style={{ 
                backgroundColor: 'rgba(27, 94, 32, 0.1)', 
                color: 'var(--primary)', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(27, 94, 32, 0.15)'
              }}>
                <Check size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: '0 0 6px 0', fontWeight: 800 }}>Success!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.4 }}>{successMsg}</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setSuccessMsg('')} 
                style={{ width: '100%', minHeight: '38px', marginTop: '4px' }}
              >
                Awesome
              </button>
            </div>
          </div>
        )}


        {activeSection === 'order' && (
          <>
            {/* User Card */}
            <div className="card" style={{ gap: '6px', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Welcome back</p>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--foreground)' }}>{user.name}</h2>
              <p style={{ fontSize: '0.85rem' }}>Role: <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>Office Staff</span></p>
            </div>

            {/* Dashboard Stats */}
            <div className="card card-premium">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>{monthName}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{formattedToday}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Current Month Balance</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 800 }}>Rs. {user.balance.toLocaleString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', display: 'block', opacity: 0.8 }}>Used Points</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={16} /> {monthlyStats.points} pts
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', display: 'block', opacity: 0.8 }}>
                    {monthlyStats.isFinalized ? 'Final Remaining' : 'Estimated Remaining'}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Rs. {monthlyStats.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Meal Ordering Section */}
            {!isCutoffPassed('dinner', today) ? (
              /* Today's Ordering Section */
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={18} /> Daily Meal Requests
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>TODAY'S ORDER</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Request Meals for TODAY ({today})</h4>
                  
                  <div style={{ 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--bg-light)', 
                    border: '1px solid var(--border)', 
                    fontSize: '0.8rem', 
                    color: 'var(--muted)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    marginBottom: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                      <AlertCircle size={14} /> Ordering Guidelines
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      Tap the cards below to select your meals. Cut-off times lock automatically.
                    </p>
                  </div>

                <div className="meal-card-grid">
                  {/* Breakfast Card */}
                  {(() => {
                    const isLocked = isCutoffPassed('breakfast', today);
                    const isSelected = todayMeals.breakfast;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''} ${isLocked ? 'meal-locked' : ''}`}
                        onClick={() => !isLocked && !toggleLoading && setTodayMeals({ ...todayMeals, breakfast: !todayMeals.breakfast })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Coffee size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Breakfast</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1 Pt</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Cutoff: {cutoffTimes.breakfast} AM</span>
                        {isLocked ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, marginTop: '2px' }}>
                            <Lock size={10} /> Locked
                          </span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Lunch Card */}
                  {(() => {
                    const isLocked = isCutoffPassed('lunch', today);
                    const isSelected = todayMeals.lunch;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''} ${isLocked ? 'meal-locked' : ''}`}
                        onClick={() => !isLocked && !toggleLoading && setTodayMeals({ ...todayMeals, lunch: !todayMeals.lunch })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Utensils size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Lunch</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#D1FAE5', color: '#059669', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>2 Pts</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Cutoff: {cutoffTimes.lunch} AM</span>
                        {isLocked ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, marginTop: '2px' }}>
                            <Lock size={10} /> Locked
                          </span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dinner Card */}
                  {(() => {
                    const isLocked = isCutoffPassed('dinner', today);
                    const isSelected = todayMeals.dinner;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''} ${isLocked ? 'meal-locked' : ''}`}
                        onClick={() => !isLocked && !toggleLoading && setTodayMeals({ ...todayMeals, dinner: !todayMeals.dinner })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Sunset size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Dinner</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#DBEAFE', color: '#2563EB', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1 Pt</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Cutoff: {cutoffTimes.dinner} PM</span>
                        {isLocked ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, marginTop: '2px' }}>
                            <Lock size={10} /> Locked
                          </span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Estimate summary bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '10px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Estimated Points Selected:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                    {((todayMeals.breakfast ? 1 : 0) + (todayMeals.lunch ? 2 : 0) + (todayMeals.dinner ? 1 : 0))} Points
                  </span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={() => handleSubmitRequests(today, todayMeals)}
                disabled={
                  toggleLoading || 
                  (isCutoffPassed('breakfast', today) && isCutoffPassed('lunch', today) && isCutoffPassed('dinner', today)) ||
                  !isMealFormModified(today, todayMeals)
                }
              >
                {getButtonText(today)}
              </button>
            </div>
            ) : (
              /* Tomorrow's Ordering Section */
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={18} /> Daily Meal Requests
                  </h3>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>TOMORROW'S ORDER</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Request Meals for TOMORROW ({tomorrowStr})</h4>
                  
                  <div style={{ 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--bg-light)', 
                    border: '1px solid var(--border)', 
                    fontSize: '0.8rem', 
                    color: 'var(--muted)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    marginBottom: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                      <AlertCircle size={14} /> Ordering Guidelines
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      Tap the cards below to select your meals for tomorrow.
                    </p>
                  </div>

                <div className="meal-card-grid">
                  {/* Breakfast Tomorrow */}
                  {(() => {
                    const isSelected = tomorrowMeals.breakfast;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''}`}
                        onClick={() => !toggleLoading && setTomorrowMeals({ ...tomorrowMeals, breakfast: !tomorrowMeals.breakfast })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Coffee size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Breakfast</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1 Pt</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Tomorrow order (Open)</span>
                        {isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Lunch Tomorrow */}
                  {(() => {
                    const isSelected = tomorrowMeals.lunch;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''}`}
                        onClick={() => !toggleLoading && setTomorrowMeals({ ...tomorrowMeals, lunch: !tomorrowMeals.lunch })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Utensils size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Lunch</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#D1FAE5', color: '#059669', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>2 Pts</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Tomorrow order (Open)</span>
                        {isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dinner Tomorrow */}
                  {(() => {
                    const isSelected = tomorrowMeals.dinner;
                    return (
                      <div 
                        className={`meal-select-card ${isSelected ? 'meal-selected' : ''}`}
                        onClick={() => !toggleLoading && setTomorrowMeals({ ...tomorrowMeals, dinner: !tomorrowMeals.dinner })}
                      >
                        <div className={`meal-card-check ${isSelected ? 'meal-card-check-selected' : 'meal-card-check-unselected'}`}>
                          {isSelected && <Check size={10} />}
                        </div>
                        <Sunset size={24} style={{ color: isSelected ? 'var(--primary)' : 'var(--muted)', marginTop: '4px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Dinner</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#DBEAFE', color: '#2563EB', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1 Pt</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Tomorrow order (Open)</span>
                        {isSelected ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>Selected</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>Select</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Estimate summary bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '10px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Estimated Points Selected:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                    {((tomorrowMeals.breakfast ? 1 : 0) + (tomorrowMeals.lunch ? 2 : 0) + (tomorrowMeals.dinner ? 1 : 0))} Points
                  </span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={() => handleSubmitRequests(tomorrowStr, tomorrowMeals)}
                disabled={toggleLoading || !isMealFormModified(tomorrowStr, tomorrowMeals)}
              >
                {getButtonText(tomorrowStr)}
              </button>
            </div>
            )}
          </>
        )}

        {activeSection === 'report' && (
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Monthly Usage Report ({monthName})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafafa', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Breakfasts</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{monthlyStats.breakfast}</span>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafafa', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Lunches</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{monthlyStats.lunch}</span>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafafa', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Dinners</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{monthlyStats.dinner}</span>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fafafa', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Points</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{monthlyStats.points} pts</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{monthlyStats.isFinalized ? 'Final Point Price:' : 'Est. Point Price:'}</span>
                <span style={{ fontWeight: 600 }}>Rs. {monthlyStats.pointPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid var(--border)' }}>
                <span>{monthlyStats.isFinalized ? 'Final Meal Cost:' : 'Est. Meal Cost:'}</span>
                <span style={{ fontWeight: 600, color: 'var(--error)' }}>Rs. {monthlyStats.mealCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {monthlyStats.isFinalized ? (
              <div className="alert alert-success" style={{ marginTop: '8px' }}>
                <Check size={16} /> Month finalized. Cost has been deducted.
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '12px' }}>
                *Point price & remaining balance are estimated in real-time until the Admin finalizes the month.
              </div>
            )}
          </div>
        )}

        {activeSection === 'history' && (
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={18} /> Meal Request History
            </h3>
            
            <div className="table-container" style={{ marginTop: '4px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>B (1)</th>
                    <th style={{ textAlign: 'center' }}>L (2)</th>
                    <th style={{ textAlign: 'center' }}>D (1)</th>
                    <th style={{ textAlign: 'center' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                        No history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((record: any) => (
                      <tr key={record._id}>
                        <td style={{ fontWeight: 600 }}>{record.date}</td>
                        <td style={{ textAlign: 'center' }}>
                          {record.breakfast ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--error)', opacity: 0.3 }} />}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {record.lunch ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--error)', opacity: 0.3 }} />}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {record.dinner ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--error)', opacity: 0.3 }} />}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {record.points}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} /> Notifications
              </h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  You have no notifications yet.
                </p>
              ) : (
                notifications.map((n: any) => (
                  <div key={n._id} style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: n.read ? '#ffffff' : 'var(--bg-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    borderLeft: n.read ? '1px solid var(--border)' : '4px solid var(--primary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>{n.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payments Section (Payment & Top-up History) */}
        {activeSection === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} /> Payment & Top-up History
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                Your registered payments and wallet top-up records.
              </p>

              <div className="table-container" style={{ marginTop: '8px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Billing Month</th>
                      <th style={{ textAlign: 'right' }}>Amount (Rs.)</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!paymentHistory || paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((p: any) => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>{p.date}</td>
                          <td>{p.month}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                            Rs. {p.amount.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Staff Orders Section */}
        {activeSection === 'all_orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} /> Staff Meal Orders
              </h3>

              {/* Sub-tabs for Today and Tomorrow */}
              <div className="tabs" style={{ margin: '12px 0 8px 0', borderBottom: 'none' }}>
                <button 
                  className={`tab ${dailyOrdersTab === 'today' ? 'tab-active' : ''}`}
                  onClick={() => setDailyOrdersTab('today')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', flex: 1, padding: '10px 0' }}
                >
                  Today ({dailyOrders?.today?.date || '...'})
                </button>
                <button 
                  className={`tab ${dailyOrdersTab === 'tomorrow' ? 'tab-active' : ''}`}
                  onClick={() => setDailyOrdersTab('tomorrow')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', flex: 1, padding: '10px 0' }}
                >
                  Tomorrow ({dailyOrders?.tomorrow?.date || '...'})
                </button>
              </div>

              {loadingDailyOrders ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Loading orders...</p>
              ) : !dailyOrders ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Failed to load daily orders data.</p>
              ) : (
                (() => {
                  const dayData = dailyOrdersTab === 'today' ? dailyOrders.today : dailyOrders.tomorrow;
                  const totals = dayData.totals;
                  const lists = dayData.lists;
                  
                  // Total Dinner Sum
                  const totalDinner = totals.dinner + (totals.dinnerUK || 0) + (totals.dinnerUK2 || 0) + (totals.dinnerKadana || 0);

                  // Create a list of all unique users who ordered anything (stripping location suffixes for list unification)
                  const allOrderers = Array.from(new Set([
                    ...lists.breakfast,
                    ...lists.lunch,
                    ...lists.dinner.map((d: string) => d.replace(/ \((UK Guest|UK Guest 2|Kadana Guest)\)/, ''))
                  ])).sort();

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                      {/* Summary Cards Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #F59E0B', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Breakfast Orders</span>
                          <h3 style={{ fontSize: '1.3rem', color: '#F59E0B' }}>{totals.breakfast}</h3>
                        </div>

                        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #10B981', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Lunch Orders</span>
                          <h3 style={{ fontSize: '1.3rem', color: '#10B981' }}>{totals.lunch}</h3>
                        </div>

                        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #3B82F6', gap: '4px', gridColumn: 'span 2' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Dinner Orders (Total: {totalDinner})</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                              Office Staff: <strong style={{ color: 'var(--primary)' }}>{totals.dinner}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                              UK Guest: <strong style={{ color: 'var(--primary)' }}>{totals.dinnerUK || 0}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                              UK Guest 2: <strong style={{ color: 'var(--primary)' }}>{totals.dinnerUK2 || 0}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                              Kadana Guest: <strong style={{ color: 'var(--primary)' }}>{totals.dinnerKadana || 0}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Copy Action Button */}
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleCopyOrdersText(dailyOrdersTab)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        <ClipboardList size={18} /> Copy Orders Details
                      </button>

                      {/* Staff Orders List Table */}
                      <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--bg-light)' }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', borderBottom: '1.5px solid var(--border)' }}>Staff Member</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1.5px solid var(--border)' }}>Breakfast</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1.5px solid var(--border)' }}>Lunch</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1.5px solid var(--border)' }}>Dinner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allOrderers.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No orders placed for this day.</td>
                              </tr>
                            ) : (
                              allOrderers.map(name => {
                                const hasBreakfast = lists.breakfast.includes(name);
                                const hasLunch = lists.lunch.includes(name);
                                const dinnerEntry = lists.dinner.find((d: string) => d === name || d.startsWith(`${name} (`));
                                const hasDinner = !!dinnerEntry;
                                const guestSuffix = dinnerEntry && dinnerEntry.includes('(') 
                                  ? dinnerEntry.substring(dinnerEntry.indexOf(' ')) 
                                  : '';
                                return (
                                  <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                                      {name}{hasDinner && guestSuffix && <span style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 400 }}>{guestSuffix}</span>}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {hasBreakfast ? (
                                        <span style={{ color: '#F59E0B', fontWeight: 800 }}>✓</span>
                                      ) : (
                                        <span style={{ color: '#E5E7EB' }}>-</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {hasLunch ? (
                                        <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span>
                                      ) : (
                                        <span style={{ color: '#E5E7EB' }}>-</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {hasDinner ? (
                                        <span style={{ color: '#3B82F6', fontWeight: 800 }}>✓</span>
                                      ) : (
                                        <span style={{ color: '#E5E7EB' }}>-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
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
          left: `calc(${getActiveTabIndex() * (100 / 6)}% + (${100 / 6}% - 48px) / 2)`,
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
          {/* Item 1: History */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveSection('history')}
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
              color: activeSection === 'history' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <History size={20} />
            {activeSection !== 'history' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>History</span>}
          </button>

          {/* Item 2: Reports */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveSection('report')}
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
              color: activeSection === 'report' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <FileText size={20} />
            {activeSection !== 'report' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Reports</span>}
          </button>

          {/* Item 3: Order */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveSection('order')}
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
              color: activeSection === 'order' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Calendar size={20} />
            {activeSection !== 'order' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Order</span>}
          </button>

          {/* Item 3.5: Orders */}
          <button 
            className="bottom-nav-item"
            onClick={() => { setActiveSection('all_orders'); loadDailyOrders(); }}
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
              color: activeSection === 'all_orders' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <ClipboardList size={20} />
            {activeSection !== 'all_orders' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Orders</span>}
          </button>

          {/* Item 4: Alerts */}
          <button 
            className="bottom-nav-item"
            onClick={() => { setActiveSection('notifications'); loadNotifications(); }}
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
              color: activeSection === 'notifications' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="notification-badge-nav" 
                style={{ 
                  top: activeSection === 'notifications' ? '12px' : '4px', 
                  right: '25%',
                  backgroundColor: 'var(--error)',
                  color: 'white'
                }}
              >
                {unreadCount}
              </span>
            )}
            {activeSection !== 'notifications' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Alerts</span>}
          </button>

          {/* Item 5: Payments */}
          <button 
            className="bottom-nav-item"
            onClick={() => setActiveSection('payments')}
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
              color: activeSection === 'payments' ? '#ffffff' : 'var(--muted)',
              transition: 'color 0.25s ease'
            }}
          >
            <Coins size={20} />
            {activeSection !== 'payments' && <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Payments</span>}
          </button>
        </div>
      </div>

      {/* Modal: Change Password */}
      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={() => {
          setShowChangePasswordModal(false);
          setPasswordError('');
          setPasswordSuccess('');
        }} style={{ zIndex: 1100 }}>
          <div className="modal-content animate-slideup" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} style={{ color: 'var(--primary)' }} /> Change Password
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px', textAlign: 'left' }}>
              Manage your credentials and update your password.
            </p>

            {passwordError && (
              <div className="alert alert-error" style={{ padding: '10px 14px', marginBottom: '12px' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.82rem' }}>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="alert alert-success" style={{ padding: '10px 14px', marginBottom: '12px' }}>
                <Check size={16} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.82rem' }}>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError('');
              setPasswordSuccess('');

              if (newPassword !== confirmPassword) {
                setPasswordError('New passwords do not match');
                return;
              }

              setPasswordLoading(true);
              try {
                const res = await fetch('/api/user/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword })
                });
                const json = await res.json();
                if (json.success) {
                  setPasswordSuccess('Your password has been successfully updated.');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setTimeout(() => {
                    setShowChangePasswordModal(false);
                    setPasswordSuccess('');
                  }, 2000);
                } else {
                  setPasswordError(json.message || 'Failed to update password');
                }
              } catch (err) {
                setPasswordError('Connection error updating password');
              } finally {
                setPasswordLoading(false);
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password" 
                    required 
                    style={{ borderRadius: '9999px', padding: '12px 16px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Enter new password" 
                    required 
                    style={{ borderRadius: '9999px', padding: '12px 16px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password" 
                    required 
                    style={{ borderRadius: '9999px', padding: '12px 16px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }} 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={passwordLoading} 
                  style={{ flex: 1 }}
                >
                  {passwordLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
