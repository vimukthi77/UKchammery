'use/client';
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserDashboard from '@/app/components/UserDashboard';
import CookDashboard from '@/app/components/CookDashboard';
import AdminDashboard from '@/app/components/AdminDashboard';

export default function DashboardGateway() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-light)',
        color: 'var(--primary)',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        Loading your meal dashboard...
      </div>
    );
  }

  if (!user) return null;

  // Render dashboard based on roles
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  } else if (user.role === 'cook') {
    return <CookDashboard user={user} onLogout={handleLogout} />;
  } else {
    return <UserDashboard user={user} onLogout={handleLogout} />;
  }
}
