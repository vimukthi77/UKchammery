'use client';

import { useState, useEffect } from 'react';
import { LogOut, Search, Printer, Download, RefreshCw, ClipboardList, Utensils, Calendar } from 'lucide-react';

interface CookDashboardProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export default function CookDashboard({ user, onLogout }: CookDashboardProps) {
  const [dateType, setDateType] = useState<'today' | 'tomorrow'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayStr, setTodayStr] = useState('');
  const [tomorrowStr, setTomorrowStr] = useState('');

  // Calculate local dates
  useEffect(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    setTodayStr(today);

    d.setDate(d.getDate() + 1);
    const yT = d.getFullYear();
    const mT = String(d.getMonth() + 1).padStart(2, '0');
    const dT = String(d.getDate()).padStart(2, '0');
    const tomorrow = `${yT}-${mT}-${dT}`;
    setTomorrowStr(tomorrow);
  }, []);

  const loadCookData = async () => {
    if (!todayStr) return;
    setLoading(true);
    try {
      const targetDate = dateType === 'today' ? todayStr : tomorrowStr;
      const res = await fetch(`/api/cook/meals?date=${targetDate}&search=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load requests');
      }
    } catch (err) {
      setError('Connection error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCookData();
  }, [dateType, searchQuery, todayStr]);

  // Handle Download Kitchen Sheet
  const handleDownloadSheet = () => {
    if (!data) return;
    const targetDate = dateType === 'today' ? todayStr : tomorrowStr;
    const { totals, lists } = data;
    
    let text = `UK-Chammery Kitchen Meal Requests Sheet\n`;
    text += `Date: ${targetDate} (${dateType.toUpperCase()})\n`;
    text += `========================================\n\n`;
    
    text += `Breakfast Orders (${totals.breakfast}):\n`;
    lists.breakfast.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });
    text += `\n`;

    text += `Lunch Orders (${totals.lunch}):\n`;
    lists.lunch.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });
    text += `\n`;

    text += `Dinner Orders (${totals.dinner}):\n`;
    lists.dinner.forEach((name: string, i: number) => {
      text += `${i + 1}. ${name}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kitchen-sheet-${targetDate}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!todayStr) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .animate-slideup {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .kitchen-card-breakfast {
          border-left: 5px solid #F59E0B !important;
          transition: var(--transition) !important;
        }
        .kitchen-card-breakfast:hover {
          box-shadow: 0 12px 30px rgba(245, 158, 11, 0.12) !important;
          transform: translateY(-2px);
        }
        .kitchen-card-lunch {
          border-left: 5px solid #10B981 !important;
          transition: var(--transition) !important;
        }
        .kitchen-card-lunch:hover {
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.12) !important;
          transform: translateY(-2px);
        }
        .kitchen-card-dinner {
          border-left: 5px solid #3B82F6 !important;
          transition: var(--transition) !important;
        }
        .kitchen-card-dinner:hover {
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.12) !important;
          transform: translateY(-2px);
        }
        .kitchen-badge {
          font-weight: 800;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
      `}</style>
      {/* Top Navbar */}
      <div className="navbar no-print">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/uklogo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <span>UK-Chammery Kitchen</span>
        </div>
        <div className="navbar-actions">
          <button 
            onClick={loadCookData} 
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

      <div className="container">
        {/* Date Filter Tabs */}
        <div className="tabs no-print">
          <button 
            className={`tab ${dateType === 'today' ? 'tab-active' : ''}`}
            onClick={() => setDateType('today')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Calendar size={16} /> Today ({todayStr})
          </button>
          <button 
            className={`tab ${dateType === 'tomorrow' ? 'tab-active' : ''}`}
            onClick={() => setDateType('tomorrow')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Calendar size={16} /> Tomorrow ({tomorrowStr})
          </button>
        </div>

        {/* Print Title (Only visible when printing) */}
        <div style={{ display: 'none' }} className="visible-print-block">
          <h1 style={{ textAlign: 'center', margin: '20px 0 10px 0' }}>UK-Chammery Kitchen Report</h1>
          <p style={{ textAlign: 'center', marginBottom: '20px' }}>
            Date: <strong>{dateType === 'today' ? todayStr : tomorrowStr}</strong> ({dateType.toUpperCase()})
          </p>
        </div>

        {/* Search and Action Row */}
        <div className="card no-print animate-slideup" style={{ gap: '12px' }}>
          <div style={{ display: 'flex', position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search staff names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--muted)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> Print List
            </button>
            <button className="btn btn-primary" onClick={handleDownloadSheet} style={{ padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> Download TXT
            </button>
          </div>
        </div>

        {/* KPI Kitchen Count Grid */}
        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }} className="no-print animate-slideup">
            <div className="card" style={{ padding: '12px', alignItems: 'center', textAlign: 'center', backgroundColor: '#FFF8E7', border: '1px solid #FCD34D', gap: '4px' }}>
              <Utensils size={24} style={{ color: '#D97706' }} />
              <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Breakfast</span>
              <h3 style={{ fontSize: '1.5rem', color: '#D97706', margin: '2px 0 0 0', fontWeight: 800 }}>{data.totals.breakfast}</h3>
            </div>
            
            <div className="card" style={{ padding: '12px', alignItems: 'center', textAlign: 'center', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', gap: '4px' }}>
              <Utensils size={24} style={{ color: '#059669' }} />
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Lunch</span>
              <h3 style={{ fontSize: '1.5rem', color: '#059669', margin: '2px 0 0 0', fontWeight: 800 }}>{data.totals.lunch}</h3>
            </div>
            
            <div className="card" style={{ padding: '12px', alignItems: 'center', textAlign: 'center', backgroundColor: '#EFF6FF', border: '1px solid #93C5FD', gap: '4px' }}>
              <Utensils size={24} style={{ color: '#2563EB' }} />
              <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Dinner</span>
              <h3 style={{ fontSize: '1.5rem', color: '#2563EB', margin: '2px 0 0 0', fontWeight: 800 }}>{data.totals.dinner}</h3>
            </div>
          </div>
        )}

        {/* Meal Type Filter Pills (Breakfast, Lunch, Dinner, All) */}
        <div className="no-print animate-slideup" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginTop: '4px' }}>
          <button 
            onClick={() => setMealFilter('all')} 
            className="tab" 
            style={{ 
              flex: 1, 
              backgroundColor: mealFilter === 'all' ? 'var(--accent)' : '#E5E7EB',
              color: mealFilter === 'all' ? 'white' : '#374151'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setMealFilter('breakfast')} 
            className="tab" 
            style={{ 
              flex: 1, 
              backgroundColor: mealFilter === 'breakfast' ? 'var(--accent)' : '#E5E7EB',
              color: mealFilter === 'breakfast' ? 'white' : '#374151'
            }}
          >
            Breakfast
          </button>
          <button 
            onClick={() => setMealFilter('lunch')} 
            className="tab" 
            style={{ 
              flex: 1, 
              backgroundColor: mealFilter === 'lunch' ? 'var(--accent)' : '#E5E7EB',
              color: mealFilter === 'lunch' ? 'white' : '#374151'
            }}
          >
            Lunch
          </button>
          <button 
            onClick={() => setMealFilter('dinner')} 
            className="tab" 
            style={{ 
              flex: 1, 
              backgroundColor: mealFilter === 'dinner' ? 'var(--accent)' : '#E5E7EB',
              color: mealFilter === 'dinner' ? 'white' : '#374151'
            }}
          >
            Dinner
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '30px', fontWeight: 'bold', color: 'var(--primary)' }} className="animate-slideup">
            Fetching menu requests...
          </div>
        )}

        {/* Display Meal Lists */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Breakfast Block */}
            {(mealFilter === 'all' || mealFilter === 'breakfast') && (
              <div className="card kitchen-card-breakfast animate-slideup">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Breakfast Orders
                  </h3>
                  <span className="kitchen-badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    {data.totals.breakfast} orders
                  </span>
                </div>
                {data.lists.breakfast.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '0.85rem' }}>No breakfast orders registered.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {data.lists.breakfast.map((name: string, index: number) => (
                      <li key={`b-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#FFFDF9', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <ClipboardList size={12} /> Breakfast
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Lunch Block */}
            {(mealFilter === 'all' || mealFilter === 'lunch') && (
              <div className="card kitchen-card-lunch animate-slideup">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Lunch Orders
                  </h3>
                  <span className="kitchen-badge" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
                    {data.totals.lunch} orders
                  </span>
                </div>
                {data.lists.lunch.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '0.85rem' }}>No lunch orders registered.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {data.lists.lunch.map((name: string, index: number) => (
                      <li key={`l-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#F9FDFB', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <ClipboardList size={12} /> Lunch
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Dinner Block */}
            {(mealFilter === 'all' || mealFilter === 'dinner') && (
              <div className="card kitchen-card-dinner animate-slideup">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Dinner Orders
                  </h3>
                  <span className="kitchen-badge" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                    {data.totals.dinner} orders
                  </span>
                </div>
                {data.lists.dinner.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '0.85rem' }}>No dinner orders registered.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {data.lists.dinner.map((name: string, index: number) => (
                      <li key={`d-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#F9FBFF', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <ClipboardList size={12} /> Dinner
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
