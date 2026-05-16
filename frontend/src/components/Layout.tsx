import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Home, Folder, Image, MapPin, BarChart3, Settings, Search, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';

  const getNavLinkClass = (path: string) => {
    const baseClass = 'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold';
    const activeClass = 'bg-baseera-red text-white shadow-lg shadow-baseera-red/50';
    const inactiveClass = 'text-baseera-gray hover:bg-baseera-dark hover:text-baseera-red';
    return baseClass + ' ' + (isActive(path) ? activeClass : inactiveClass);
  };

  return (
    <div className="flex h-screen bg-baseera-light">
      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? '256px' : '80px',
        backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
        color: 'white',
        transition: 'width 0.3s',
        boxShadow: '0 20px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #DC143C',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/baseera_logo.gif" alt="BASEERA 360" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
            {sidebarOpen && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>BASEERA 360</p>
                <p style={{ fontSize: '12px', color: '#d4d4d4' }}>Inspection Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            className={getNavLinkClass('/dashboard')}
            style={{ border: 'none', cursor: 'pointer', backgroundColor: isActive('/dashboard') ? '#DC143C' : 'transparent', color: isActive('/dashboard') ? 'white' : '#d4d4d4' }}
          >
            <Home size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => navigate('/projects')}
            className={getNavLinkClass('/projects')}
            style={{ border: 'none', cursor: 'pointer', backgroundColor: isActive('/projects') ? '#DC143C' : 'transparent', color: isActive('/projects') ? 'white' : '#d4d4d4' }}
          >
            <Folder size={20} />
            {sidebarOpen && <span>Projects</span>}
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              color: '#d4d4d4',
              fontWeight: '600',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#DC143C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d4d4d4';
            }}
          >
            <Image size={20} />
            {sidebarOpen && <span>Media</span>}
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              color: '#d4d4d4',
              fontWeight: '600',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#DC143C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d4d4d4';
            }}
          >
            <MapPin size={20} />
            {sidebarOpen && <span>Inspections</span>}
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className={getNavLinkClass('/analytics')}
            style={{ border: 'none', cursor: 'pointer', backgroundColor: isActive('/analytics') ? '#DC143C' : 'transparent', color: isActive('/analytics') ? 'white' : '#d4d4d4' }}
          >
            <BarChart3 size={20} />
            {sidebarOpen && <span>Analytics</span>}
          </button>
        </nav>

        {/* Settings & Logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #DC143C',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <button
            onClick={() => navigate('/settings')}
            className={getNavLinkClass('/settings')}
            style={{ border: 'none', cursor: 'pointer', backgroundColor: isActive('/settings') ? '#DC143C' : 'transparent', color: isActive('/settings') ? 'white' : '#d4d4d4' }}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              color: '#d4d4d4',
              fontWeight: '600',
              backgroundColor: 'transparent',
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#DC143C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#d4d4d4';
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* TOP NAV */}
        <div style={{
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #DC143C',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#DC143C',
                }}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div style={{
                display: 'none',
                '@media (min-width: 768px)': { display: 'flex' },
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2a2a2a',
                padding: '8px 16px',
                borderRadius: '8px',
                flex: 1,
                maxWidth: '448px',
                border: '1px solid #DC143C',
              }}>
                <Search size={18} style={{ color: '#DC143C' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  style={{
                    backgroundColor: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '14px',
                    color: '#f5f5f5',
                    border: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button style={{
                position: 'relative',
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#DC143C',
              }}>
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#DC143C',
                  borderRadius: '50%',
                }}></span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  textAlign: 'right',
                  display: 'none',
                  '@media (min-width: 640px)': { display: 'block' },
                }}>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#f5f5f5' }}>
                    {user?.firstName || user?.email || 'User'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#d4d4d4' }}>{user?.role || 'Engineer'}</p>
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundImage: 'linear-gradient(135deg, #FF4444 0%, #DC143C 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(220, 20, 60, 0.3)',
                }}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;