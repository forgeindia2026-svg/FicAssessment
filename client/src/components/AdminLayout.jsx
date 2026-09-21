import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Award,
  LogOut,
  Bell,
  Search,
  HelpCircle as HelpIcon,
  CheckCircle2,
  UserPlus,
  X,
  ChevronRight,
  BookOpen,
  Send,
  BellRing
} from 'lucide-react';

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ candidates: [], jobs: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Profile Menu Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Fetch real-time system notifications
  const fetchNotifications = async () => {
    try {
      const [resResults, resCand] = await Promise.all([
        API.get('/results').catch(() => ({ data: [] })),
        API.get('/candidates').catch(() => ({ data: [] }))
      ]);

      const results = resResults.data || [];
      const candidates = resCand.data || [];

      const list = [];

      results.forEach((r) => {
        if (r.status === 'COMPLETED') {
          list.push({
            id: `res-${r._id}`,
            title: `Assessment Completed: ${r.candidate?.name || 'Candidate'}`,
            desc: `Scored ${r.score}/${r.totalQuestions} (${r.percentage}%) for ${r.job?.name || 'Job'}`,
            time: r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            type: 'result',
            link: `/admin/results/${r._id}`,
            read: false
          });
        }
      });

      candidates.slice(0, 3).forEach((c) => {
        list.push({
          id: `cand-${c._id}`,
          title: `Candidate Registered: ${c.name}`,
          desc: `Assigned Track: ${c.jobId?.name || 'General Track'}`,
          time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          type: 'candidate',
          link: c.assessment ? `/admin/results/${c.assessment._id}` : `/admin/candidates/${c._id}`,
          read: false
        });
      });

      if (list.length === 0) {
        list.push({
          id: 'system-1',
          title: 'System Ready',
          desc: 'Default Admin account (admin@fic.com) active.',
          time: 'Just now',
          type: 'system',
          link: '/admin/dashboard',
          read: true
        });
      }

      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Connect to Real-Time SSE Notification Stream
    let eventSource;
    try {
      eventSource = new EventSource('/api/notifications/stream');
      
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'CANDIDATE_REGISTERED' || parsed.type === 'ASSESSMENT_COMPLETED') {
            const newNotif = {
              id: parsed.data.id || `sse-${Date.now()}`,
              title: parsed.data.title,
              desc: parsed.data.desc,
              time: parsed.data.time || 'Just now',
              type: parsed.type === 'ASSESSMENT_COMPLETED' ? 'result' : 'candidate',
              link: parsed.data.link || '/admin/dashboard',
              read: false
            };

            setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
            setUnreadCount(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      };
    } catch (sseErr) {
      console.error('SSE connection error:', sseErr);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ candidates: [], jobs: [] });
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchItems = async () => {
      try {
        const [resCand, resJobs] = await Promise.all([
          API.get('/candidates').catch(() => ({ data: [] })),
          API.get('/jobs').catch(() => ({ data: [] }))
        ]);

        const matchedCand = (resCand.data || []).filter(c =>
          c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
        );

        const matchedJobs = (resJobs.data || []).filter(j =>
          j.name.toLowerCase().includes(query)
        );

        setSearchResults({ candidates: matchedCand, jobs: matchedJobs });
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    searchItems();
  }, [searchQuery]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Candidates', path: '/admin/candidates', icon: Users },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Questions', path: '/admin/questions', icon: HelpCircle },
    { name: 'Bulk Import', path: '/admin/questions/bulk', icon: FileSpreadsheet },
    { name: 'Results', path: '/admin/results', icon: Award },
    { name: 'Notifications', path: '/admin/notifications', icon: BellRing },
  ];

  const location = useLocation();
  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  return (
    <div className="flex min-h-screen bg-[#fff8f7] text-[#311213] font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-[#e2bfb9] flex flex-col justify-between shrink-0 shadow-sm z-20 overflow-y-auto">
        <div>
          {/* Brand Header with Official Logo */}
          <div className="p-6 border-b border-[#ffe9e8] flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Forge India Connect"
              className="w-10 h-10 rounded-full shadow-sm object-cover border border-[#e2bfb9] shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-[#311213] leading-tight truncate">FORGE INDIA</h1>
              <p className="text-[11px] text-[#800000] font-bold tracking-wider uppercase">Connect • Admin</p>
            </div>
          </div>

          {/* Navigation with Spacing & Padding */}
          <nav className="p-4 space-y-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isActive
                      ? 'bg-[#ffe9e8] text-[#800000] border-l-4 border-[#800000] shadow-xs'
                      : 'text-[#5a413d] hover:bg-[#fff0f0] hover:text-[#311213]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Session */}
        <div className="p-4 border-t border-[#ffe9e8] bg-[#fff8f7]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="truncate">
              <p className="text-[11px] font-semibold text-[#8e706c] uppercase">Administrator</p>
              <p className="text-xs font-bold text-[#311213] truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-[#fff0f0] hover:bg-[#ffe1e1] text-[#800000] border border-[#e2bfb9] text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-64 min-h-screen">
        {/* Top Navigation Bar - Render ONLY on Dashboard tab */}
        {isDashboard && (
          <header className="h-16 bg-white border-b border-[#e2bfb9] px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Forge India Connect Logo"
                className="w-8 h-8 rounded-full border border-[#e2bfb9] object-cover"
              />
              <h2 className="font-extrabold text-base text-[#311213]">FORGE INDIA CONNECT — Assessment Platform</h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar & Dropdown */}
              <div className="relative hidden sm:block w-64" ref={searchRef}>
                <Search className="w-4 h-4 text-[#8e706c] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search candidates, jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#311213] focus:outline-none focus:border-[#800000] font-medium"
                />

                {/* Live Search Results Popover */}
                {showSearchResults && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-[#e2bfb9] rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                    {searchResults.candidates.length === 0 && searchResults.jobs.length === 0 ? (
                      <div className="p-3 text-center text-[#8e706c]">No matching records found.</div>
                    ) : (
                      <div className="divide-y divide-[#ffe9e8]">
                        {searchResults.candidates.length > 0 && (
                          <div className="p-2">
                            <span className="text-[10px] font-bold text-[#8e706c] uppercase px-2 block mb-1">Candidates</span>
                            {searchResults.candidates.slice(0, 3).map(c => (
                              <div
                                key={c._id}
                                onClick={() => {
                                  setShowSearchResults(false);
                                  setSearchQuery('');
                                  navigate(c.assessment ? `/admin/results/${c.assessment._id}` : `/admin/candidates/${c._id}`);
                                }}
                                className="px-2 py-1.5 hover:bg-[#fff0f0] rounded cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-bold text-[#311213] truncate">{c.name}</span>
                                <span className="text-[10px] text-[#8e706c]">{c.jobId?.name || 'Candidate'}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {searchResults.jobs.length > 0 && (
                          <div className="p-2">
                            <span className="text-[10px] font-bold text-[#8e706c] uppercase px-2 block mb-1">Job Positions</span>
                            {searchResults.jobs.slice(0, 3).map(j => (
                              <div
                                key={j._id}
                                onClick={() => {
                                  setShowSearchResults(false);
                                  setSearchQuery('');
                                  navigate(`/admin/questions?jobId=${j._id}`);
                                }}
                                className="px-2 py-1.5 hover:bg-[#fff0f0] rounded cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-bold text-[#311213] truncate">{j.name}</span>
                                <span className="text-[10px] text-[#800000] font-semibold">{j.questionCount || 0} MCQs</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-[#5a413d] hover:bg-[#fff0f0] rounded-md transition-colors relative focus:outline-none"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 bg-[#800000] border-2 border-white rounded-full absolute top-1 right-1 animate-pulse" />
                  )}
                </button>

                {/* Popover Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e2bfb9] rounded-2xl shadow-xl z-50 overflow-hidden space-y-0">
                    <div className="p-4 bg-[#ffe9e8] border-b border-[#e2bfb9] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-[#800000]" />
                        <h3 className="font-extrabold text-sm text-[#311213]">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-[#800000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          }}
                          className="text-[11px] font-bold text-[#800000] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#ffe9e8]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#8e706c] font-medium">
                          No notifications available.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
                              setUnreadCount(prev => Math.max(0, prev - 1));
                              setShowNotifications(false);
                              navigate(n.link);
                            }}
                            className={`p-4 flex items-start space-x-3 hover:bg-[#fff8f7] cursor-pointer transition-colors ${!n.read ? 'bg-[#fff0f0]/60' : ''
                              }`}
                          >
                            <div className="p-2 rounded-lg bg-[#ffe9e8] text-[#800000] shrink-0 mt-0.5">
                              {n.type === 'result' ? <Award className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[#311213] truncate">{n.title}</p>
                                <span className="text-[10px] text-[#8e706c] shrink-0 ml-1 font-medium">{n.time}</span>
                              </div>
                              <p className="text-xs text-[#5a413d] mt-0.5 line-clamp-2 leading-relaxed font-normal">{n.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Help Icon Modal */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-[#5a413d] hover:bg-[#fff0f0] rounded-md transition-colors"
                title="Platform Guide & Help"
              >
                <HelpIcon className="w-4 h-4" />
              </button>

              {/* Avatar Profile Dropdown */}
              <div className="relative pl-2 border-l border-[#e2bfb9]" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-[#800000] hover:bg-[#570000] text-white flex items-center justify-center font-bold text-xs shadow-sm transition-all cursor-pointer ring-2 ring-[#e2bfb9] hover:ring-[#800000]"
                  title="Admin Account & Profile"
                >
                  A
                </button>

                {/* Profile Popover Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e2bfb9] rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                    {/* Admin Header Info */}
                    <div className="p-4 bg-[#ffe9e8] border-b border-[#e2bfb9] space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-[#800000] text-white flex items-center justify-center font-extrabold text-xs">
                          A
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#311213] truncate">{admin?.email || 'admin@fic.com'}</p>
                          <span className="bg-[#800000] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            System Administrator
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Links */}
                    <div className="p-2 space-y-1">

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/admin/notifications');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-[#311213] hover:bg-[#fff0f0] rounded-xl font-semibold transition-colors text-left"
                      >
                        <BellRing className="w-4 h-4 text-[#800000]" />
                        <span>Notifications & Alerts</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowHelpModal(true);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-[#311213] hover:bg-[#fff0f0] rounded-xl font-semibold transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-[#800000]" />
                        <span>Platform Guide & Help</span>
                      </button>
                    </div>

                    {/* Sign Out Action */}
                    <div className="p-2 border-t border-[#ffe9e8] bg-[#fff8f7]">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-700" />
                        <span>Sign Out Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Page View Body */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#311213]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e2bfb9] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#800000]" />
                <h3 className="font-bold text-base text-[#311213]">Admin Platform Quick Guide</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-[#8e706c] hover:text-[#311213]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#5a413d] leading-relaxed">
              <div className="p-3 bg-[#fff8f7] border border-[#e2bfb9] rounded-xl space-y-1">
                <span className="font-bold text-[#311213] block">1. Dynamic Job Positions & Candidate Links</span>
                <p>Create jobs in <strong>Jobs Management</strong>. Share the <code>/apply/:jobToken</code> link with candidates to let them register directly!</p>
              </div>

              <div className="p-3 bg-[#fff8f7] border border-[#e2bfb9] rounded-xl space-y-1">
                <span className="font-bold text-[#311213] block">2. Question Banks & Bulk MCQ Import</span>
                <p>Paste 50+ MCQs into <strong>Bulk Import</strong> using standard text formatting (Question, Options A-D, Answer: X). Validate and import instantly.</p>
              </div>

              <div className="p-3 bg-[#fff8f7] border border-[#e2bfb9] rounded-xl space-y-1">
                <span className="font-bold text-[#311213] block">3. Candidate Assessment Token URL</span>
                <p>Generate cryptographic test tokens (<code>/assessment/:token</code>) for candidates to take 30-minute timed assessments.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-[#800000] hover:bg-[#570000] text-white font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
