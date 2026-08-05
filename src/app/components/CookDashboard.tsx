'use/client';
'use client';

import { useState, useEffect } from 'react';
import { LogOut, Search, Printer, Download, RefreshCw, ClipboardList, Utensils } from 'lucide-react';

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
        setError(json.message || 'Failed to load kitchen list');
      }
    } catch (err) {
      setError('Connection error loading kitchen list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCookData();
  }, [dateType, todayStr, searchQuery]);

  // Handle Download Kitchen Sheet
  const handleDownloadSheet = () => {
    if (!data) return;
    const targetDate = dateType === 'today' ? todayStr : tomorrowStr;
    const { totals, lists } = data;
    
    let content = `UK-CHAMMERY KITCHEN REPORT\n`;
    content += `Date: ${targetDate} (${dateType.toUpperCase()})\n`;
    content += `========================================\n\n`;
    
    content += `BREAKFAST (Total: ${totals.breakfast})\n`;
    content += `----------------------------------------\n`;
    if (lists.breakfast.length === 0) content += `No requests.\n`;
    lists.breakfast.forEach((name: string, i: number) => {
      content += `${i + 1}. ${name}\n`;
    });
    content += `\n`;

    content += `LUNCH (Total: ${totals.lunch})\n`;
    content += `----------------------------------------\n`;
    if (lists.lunch.length === 0) content += `No requests.\n`;
    lists.lunch.forEach((name: string, i: number) => {
      content += `${i + 1}. ${name}\n`;
    });
    content += `\n`;

    content += `DINNER (Total: ${totals.dinner})\n`;
    content += `----------------------------------------\n`;
    if (lists.dinner.length === 0) content += `No requests.\n`;
    lists.dinner.forEach((name: string, i: number) => {
      content += `${i + 1}. ${name}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kitchen-sheet-${targetDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!todayStr) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div className="navbar no-print">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/uklogo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <span>UK-Chammery Cook</span>
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
          >
            Today ({todayStr})
          </button>
          <button 
            className={`tab ${dateType === 'tomorrow' ? 'tab-active' : ''}`}
            onClick={() => setDateType('tomorrow')}
          >
            Tomorrow ({tomorrowStr})
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
        <div className="card no-print" style={{ gap: '12px' }}>
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
            <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '10px' }}>
              <Printer size={18} /> Print List
            </button>
            <button className="btn btn-primary" onClick={handleDownloadSheet} style={{ padding: '10px' }}>
              <Download size={18} /> Download TXT
            </button>
          </div>
        </div>

        {/* Meal Type Filter Pills (Breakfast, Lunch, Dinner, All) */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button 
            onClick={() => setMealFilter('all')} 
            className="btn" 
            style={{ 
              flex: 1, 
              padding: '6px 12px', 
              minHeight: '36px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              backgroundColor: mealFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
              color: mealFilter === 'all' ? 'white' : 'var(--primary)',
              border: mealFilter === 'all' ? 'none' : '1px solid var(--border)'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setMealFilter('breakfast')} 
            className="btn" 
            style={{ 
              flex: 1, 
              padding: '6px 12px', 
              minHeight: '36px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              backgroundColor: mealFilter === 'breakfast' ? 'var(--primary)' : 'var(--bg-card)',
              color: mealFilter === 'breakfast' ? 'white' : 'var(--primary)',
              border: mealFilter === 'breakfast' ? 'none' : '1px solid var(--border)'
            }}
          >
            Breakfast
          </button>
          <button 
            onClick={() => setMealFilter('lunch')} 
            className="btn" 
            style={{ 
              flex: 1, 
              padding: '6px 12px', 
              minHeight: '36px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              backgroundColor: mealFilter === 'lunch' ? 'var(--primary)' : 'var(--bg-card)',
              color: mealFilter === 'lunch' ? 'white' : 'var(--primary)',
              border: mealFilter === 'lunch' ? 'none' : '1px solid var(--border)'
            }}
          >
            Lunch
          </button>
          <button 
            onClick={() => setMealFilter('dinner')} 
            className="btn" 
            style={{ 
              flex: 1, 
              padding: '6px 12px', 
              minHeight: '36px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              backgroundColor: mealFilter === 'dinner' ? 'var(--primary)' : 'var(--bg-card)',
              color: mealFilter === 'dinner' ? 'white' : 'var(--primary)',
              border: mealFilter === 'dinner' ? 'none' : '1px solid var(--border)'
            }}
          >
            Dinner
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '30px', fontWeight: 'bold', color: 'var(--primary)' }}>
            Retrieving meal requests...
          </div>
        )}

        {/* Display Meal Lists */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Breakfast Block */}
            {(mealFilter === 'all' || mealFilter === 'breakfast') && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🍳 Breakfast Requests
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    {data.totals.breakfast} orders
                  </span>
                </div>
                {data.lists.breakfast.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '12px', color: 'var(--muted)', fontSize: '0.85rem' }}>No breakfast orders.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.lists.breakfast.map((name: string, index: number) => (
                      <li key={`b-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
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
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🍲 Lunch Requests
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    {data.totals.lunch} orders
                  </span>
                </div>
                {data.lists.lunch.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '12px', color: 'var(--muted)', fontSize: '0.85rem' }}>No lunch orders.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.lists.lunch.map((name: string, index: number) => (
                      <li key={`l-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
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
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🍽️ Dinner Requests
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    {data.totals.dinner} orders
                  </span>
                </div>
                {data.lists.dinner.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '12px', color: 'var(--muted)', fontSize: '0.85rem' }}>No dinner orders.</p>
                ) : (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.lists.dinner.map((name: string, index: number) => (
                      <li key={`d-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
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
