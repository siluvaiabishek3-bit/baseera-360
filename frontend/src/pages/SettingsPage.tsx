import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Eye, EyeOff, Mail, Lock, User, Bell, Shield, LogOut } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    company: 'BASEERA 360',
    position: 'Drone Pilot & Survey Engineer',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailOnDefect: true,
    emailOnCompletion: true,
    emailOnTeamUpdate: true,
    pushNotifications: true,
    weeklyReport: true,
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'english',
    timezone: 'Asia/Dubai',
    defaultView: 'grid',
  });

  const handleProfileSave = async () => {
    try {
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters!');
      return;
    }
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  const getTabButtonStyle = (tab: string) => ({
    padding: '12px 16px',
    borderBottom: activeTab === tab ? '3px solid #DC143C' : 'none',
    color: activeTab === tab ? '#DC143C' : '#666',
    fontWeight: activeTab === tab ? '600' : '500',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
  });

  return (
    <div style={{ padding: '32px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
          Settings
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Manage your account, preferences, and notifications
        </p>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid #e5e5e5',
        marginBottom: '32px',
        backgroundColor: 'white',
        padding: '0 24px',
        borderRadius: '12px 12px 0 0',
      }}>
        <button onClick={() => setActiveTab('profile')} style={getTabButtonStyle('profile')}>
          <User size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Profile
        </button>
        <button onClick={() => setActiveTab('security')} style={getTabButtonStyle('security')}>
          <Lock size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Security
        </button>
        <button onClick={() => setActiveTab('notifications')} style={getTabButtonStyle('notifications')}>
          <Bell size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Notifications
        </button>
        <button onClick={() => setActiveTab('preferences')} style={getTabButtonStyle('preferences')}>
          <Shield size={18} style={{ display: 'inline', marginRight: '8px' }} />
          Preferences
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* PROFILE INFO */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e5e5e5',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '24px' }}>
              Profile Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+971 50 123 4567"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Position
                </label>
                <input
                  type="text"
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC143C'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 16px rgba(220, 20, 60, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>

          {/* PROFILE PICTURE */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e5e5e5',
            padding: '24px',
            textAlign: 'center',
            height: 'fit-content',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>
              Profile Picture
            </h3>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              backgroundImage: 'linear-gradient(135deg, #DC143C 0%, #FF4444 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 4px 6px rgba(220, 20, 60, 0.2)',
            }}>
              <User size={60} color="white" />
            </div>
            <button style={{
              width: '100%',
              backgroundColor: '#f5f5f5',
              color: '#1a1a1a',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: '600',
              border: '1px solid #e5e5e5',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            >
              Upload Photo
            </button>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
              JPG, PNG up to 5MB
            </p>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e5e5e5',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '24px' }}>
              Security Settings
            </h2>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 16px rgba(220, 20, 60, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Lock size={18} />
                Change Password
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: '1px solid #e5e5e5',
                      color: '#1a1a1a',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 12px 16px rgba(220, 20, 60, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Save size={18} />
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffe69c',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#856404', marginBottom: '8px' }}>
              🔒 Security Tip
            </h3>
            <p style={{ fontSize: '13px', color: '#856404', lineHeight: '1.5' }}>
              Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters for better security.
            </p>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e5e5e5',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '24px' }}>
              Notification Preferences
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                >
                  <div>
                    <p style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '4px', fontSize: '14px' }}>
                      {key === 'emailOnDefect' && 'Email on Defect Found'}
                      {key === 'emailOnCompletion' && 'Email on Project Completion'}
                      {key === 'emailOnTeamUpdate' && 'Email on Team Updates'}
                      {key === 'pushNotifications' && 'Push Notifications'}
                      {key === 'weeklyReport' && 'Weekly Report Email'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      {key === 'emailOnDefect' && 'Get notified when defects are found'}
                      {key === 'emailOnCompletion' && 'Get notified when projects complete'}
                      {key === 'emailOnTeamUpdate' && 'Get notified of team changes'}
                      {key === 'pushNotifications' && 'Receive browser notifications'}
                      {key === 'weeklyReport' && 'Receive weekly summary'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => setNotifications({ ...notifications, [key]: !value })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#DC143C',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => alert('Notification preferences saved!')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 16px rgba(220, 20, 60, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Save size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* PREFERENCES TAB */}
      {activeTab === 'preferences' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #e5e5e5',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '24px' }}>
              Preferences
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="english">English</option>
                  <option value="arabic">العربية (Arabic)</option>
                  <option value="french">Français (French)</option>
                  <option value="spanish">Español (Spanish)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                  Default View
                </label>
                <select
                  value={preferences.defaultView}
                  onChange={(e) => setPreferences({ ...preferences, defaultView: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                  <option value="table">Table View</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => alert('Preferences saved!')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #DC143C 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 16px rgba(220, 20, 60, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Save size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT SECTION */}
      <div style={{
        marginTop: '32px',
        maxWidth: '600px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b', marginBottom: '12px' }}>
          Danger Zone
        </h2>
        <p style={{ color: '#b91c1c', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
          Logging out will end your session. You'll need to login again to access your account.
        </p>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;