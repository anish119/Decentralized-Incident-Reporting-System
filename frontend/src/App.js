import React, { useState, useEffect } from 'react';
import './App.css';
import ReportForm from './components/reportForm';
import PublicReports from './components/PublicReports';
import TrackReport from './components/TrackReport'; // Or we can remove this, but let's keep it if users still need to look up by ID? Actually MyReports replaced the track flow, but we can replace the tab.
import MyReports from './components/MyReports';
import InvestigatorDashboard from './components/InvestigatorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

function App() {
  const [activeTab, setActiveTab] = useState('reports'); // default to public reports
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    // Apply theme
    document.body.setAttribute('data-theme', theme);

    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setActiveTab('system-admin');
    } else if (userData.role === 'investigator') {
      setActiveTab('admin-dashboard'); // Keeping naming consistent with current state if possible, or rename
    } else {
      setActiveTab('my-reports');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('reports');
  };

  const handleReportSubmitted = () => {
    setActiveTab('my-reports');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Voices Unchained</h1>
            <p>Secure Anonymous Reporting System</p>
          </div>
          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user && (
              <div className="user-info">
                <span className="user-name">{user.username}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >📊 Public Reports</button>

        {!user && (
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >🔐 Login / Register</button>
        )}

        {user && user.role === 'user' && (
          <>
            <button
              className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
              onClick={() => setActiveTab('submit')}
            >📝 Submit Report</button>
            <button
              className={`tab-btn ${activeTab === 'my-reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-reports')}
            >🔍 My Reports</button>
            <button
              className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
            >🆔 Track By ID</button>
          </>
        )}

        {user && user.role === 'investigator' && (
          <button
            className={`tab-btn ${activeTab === 'admin-dashboard' ? 'admin-active' : ''}`}
            onClick={() => setActiveTab('admin-dashboard')}
          >🛡️ Investigator Dashboard</button>
        )}

        {user && user.role === 'admin' && (
          <button
            className={`tab-btn ${activeTab === 'system-admin' ? 'admin-active' : ''}`}
            onClick={() => setActiveTab('system-admin')}
          >⚙️ System Admin</button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'reports' && <PublicReports onRedirectLogin={() => setActiveTab('login')} />}
        {activeTab === 'login' && !user && <Login onLoginSuccess={handleLoginSuccess} />}
        {activeTab === 'submit' && user && user.role === 'user' && <ReportForm onReportSubmitted={handleReportSubmitted} />}
        {activeTab === 'my-reports' && user && user.role === 'user' && <MyReports />}
        {activeTab === 'track' && user && user.role === 'user' && <TrackReport />}
        {activeTab === 'admin-dashboard' && user && user.role === 'investigator' && <InvestigatorDashboard />}
        {activeTab === 'system-admin' && user && user.role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}

export default App;