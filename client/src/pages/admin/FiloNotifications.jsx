import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  Bell, 
  Trash2, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Smartphone, 
  X,
  Layers,
  Award,
  UserPlus,
  ArrowRight,
  Download,
  CheckCheck,
  RotateCcw
} from 'lucide-react';

const FiloNotifications = () => {
  const navigate = useNavigate();
  const [broadcastNotifications, setBroadcastNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SYSTEM' | 'BROADCAST'
  const [readIds, setReadIds] = useState(new Set());

  // New Notification Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('FILO_PUSH');

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);

      const [resNotifs, resResults, resCand] = await Promise.all([
        API.get('/notifications').catch(() => ({ data: [] })),
        API.get('/results').catch(() => ({ data: [] })),
        API.get('/candidates').catch(() => ({ data: [] }))
      ]);

      // Broadcast Notifications
      const broadcasts = (resNotifs.data || []).map(n => ({
        ...n,
        category: 'BROADCAST'
      }));
      setBroadcastNotifications(broadcasts);

      // System Activity Notifications
      const results = resResults.data || [];
      const candidates = resCand.data || [];

      const systemList = [];

      results.forEach((r) => {
        if (r.status === 'COMPLETED') {
          systemList.push({
            _id: `res-${r._id}`,
            title: `Assessment Completed: ${r.candidate?.name || 'Candidate'}`,
            message: `Scored ${r.score}/${r.totalQuestions} (${r.percentage}%) for ${r.job?.name || 'Job Track'}`,
            createdAt: r.updatedAt || r.createdAt,
            timeDisplay: r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            category: 'SYSTEM',
            type: 'RESULT',
            link: `/admin/results/${r._id}`,
            candidateName: r.candidate?.name,
            scoreInfo: `${r.score}/${r.totalQuestions} (${r.percentage}%)`
          });
        }
      });

      candidates.forEach((c) => {
        systemList.push({
          _id: `cand-${c._id}`,
          title: `Candidate Registered: ${c.name}`,
          message: `Assigned Track: ${c.jobId?.name || 'General Track'}`,
          createdAt: c.createdAt,
          timeDisplay: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          category: 'SYSTEM',
          type: 'CANDIDATE',
          link: c.assessment ? `/admin/results/${c.assessment._id}` : `/admin/candidates/${c._id}`,
          candidateName: c.name
        });
      });

      // Sort system notifications by newest first
      systemList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSystemNotifications(systemList);

    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();

    // Connect to Real-Time SSE Stream for Notifications
    let eventSource;
    try {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'CANDIDATE_REGISTERED' || parsed.type === 'ASSESSMENT_COMPLETED') {
            const newNotif = {
              _id: parsed.data.id || `sse-${Date.now()}`,
              title: parsed.data.title,
              message: parsed.data.desc,
              createdAt: new Date().toISOString(),
              timeDisplay: parsed.data.time || 'Just now',
              category: 'SYSTEM',
              type: parsed.type === 'ASSESSMENT_COMPLETED' ? 'RESULT' : 'CANDIDATE',
              link: parsed.data.link || '/admin/dashboard'
            };

            setSystemNotifications(prev => [newNotif, ...prev.filter(n => n._id !== newNotif._id)]);
            setToast({ type: 'success', text: `⚡ Real-Time Notification: ${newNotif.title}` });
            setTimeout(() => setToast(null), 4000);
          }
        } catch (err) {
          console.error('Error handling SSE notification:', err);
        }
      };
    } catch (sseErr) {
      console.error('SSE initialization error:', sseErr);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setToast({ type: 'error', text: 'Please enter both title and message.' });
      return;
    }

    try {
      setSending(true);
      const payload = { title, message, channel, targetAudience: 'ALL' };
      const res = await API.post('/notifications', payload);
      setToast({ type: 'success', text: res.data.message || 'Notification broadcasted successfully!' });

      setTitle('');
      setMessage('');
      setShowCreateModal(false);
      fetchAllNotifications();
    } catch (err) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await API.delete(`/notifications/${id}`);
      setBroadcastNotifications(prev => prev.filter(n => n._id !== id));
      setToast({ type: 'success', text: 'Notification deleted successfully.' });
    } catch (err) {
      setToast({ type: 'error', text: 'Failed to delete notification.' });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Export Activity & Notification Logs to CSV
  const handleExportCSV = () => {
    const allItems = [...systemNotifications, ...broadcastNotifications];
    if (allItems.length === 0) {
      setToast({ type: 'error', text: 'No notifications available to export.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Category,Type,Title,Details,Time,Status\n";

    allItems.forEach((n) => {
      const isRead = readIds.has(n._id) ? "Read" : "Unread";
      const cleanTitle = `"${(n.title || '').replace(/"/g, '""')}"`;
      const cleanMessage = `"${(n.message || '').replace(/"/g, '""')}"`;
      const timeStr = `"${n.timeDisplay || n.createdAt || 'N/A'}"`;

      csvContent += `${n._id},${n.category || 'SYSTEM'},${n.type || 'PUSH'},${cleanTitle},${cleanMessage},${timeStr},${isRead}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fic_notifications_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ type: 'success', text: 'Notification activity log exported to CSV!' });
    setTimeout(() => setToast(null), 3000);
  };

  // Mark all currently visible as read
  const handleMarkAllRead = () => {
    const visibleList = displayList;
    const newReadSet = new Set(readIds);
    visibleList.forEach(item => newReadSet.add(item._id));
    setReadIds(newReadSet);
    setToast({ type: 'success', text: 'Marked all notifications as read.' });
    setTimeout(() => setToast(null), 3000);
  };

  // Clear system activity history log
  const handleClearHistory = () => {
    if (!window.confirm('Clear local system activity notifications log?')) return;
    setSystemNotifications([]);
    setToast({ type: 'success', text: 'System activity history cleared.' });
    setTimeout(() => setToast(null), 3000);
  };

  // Combine and filter items based on active tab
  let displayList = [];
  if (activeTab === 'ALL') {
    displayList = [...systemNotifications, ...broadcastNotifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (activeTab === 'SYSTEM') {
    displayList = systemNotifications;
  } else if (activeTab === 'BROADCAST') {
    displayList = broadcastNotifications;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ffe9e8] pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#800000] text-white rounded-2xl shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-[#311213]">Notifications & Activity</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#166534]/10 text-[#166534] border border-[#bbf7d0]">
                <span className="w-1.5 h-1.5 bg-[#166534] rounded-full animate-ping mr-1.5" />
                Live SSE Stream
              </span>
            </div>
            <p className="text-xs text-[#8e706c] font-semibold mt-0.5">
              Monitor real-time candidate assessment completions, registrations & system broadcasts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-[#fff0f0] hover:bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Export Activity Log to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Broadcast</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm border transition-all ${
          toast.type === 'success' ? 'bg-[#f0fff4] text-[#166534] border-[#bbf7d0]' : 'bg-[#fff1f2] text-[#991b1b] border-[#fecdd3]'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-[#ffe9e8]/60 p-1.5 rounded-xl border border-[#e2bfb9]">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'text-[#5a413d] hover:text-[#800000]'
            }`}
          >
            All Activity ({systemNotifications.length + broadcastNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'SYSTEM'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'text-[#5a413d] hover:text-[#800000]'
            }`}
          >
            System Activity ({systemNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('BROADCAST')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'BROADCAST'
                ? 'bg-[#800000] text-white shadow-xs'
                : 'text-[#5a413d] hover:text-[#800000]'
            }`}
          >
            Broadcast Messages ({broadcastNotifications.length})
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 text-xs font-bold text-[#800000] bg-[#fff0f0] hover:bg-[#ffe9e8] px-3 py-1.5 rounded-lg border border-[#e2bfb9] transition-all cursor-pointer"
            title="Mark visible as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>

          {activeTab !== 'BROADCAST' && systemNotifications.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center space-x-1 text-xs font-bold text-[#8e706c] hover:text-[#800000] px-2.5 py-1.5 rounded-lg hover:bg-[#fff0f0] transition-all cursor-pointer"
              title="Clear system activity history log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List Container */}
      <div className="bg-white border border-[#e2bfb9] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ffe9e8] flex items-center justify-between bg-[#fff8f7]">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#800000]" />
            <h2 className="font-extrabold text-sm text-[#311213]">
              {activeTab === 'ALL' && 'All System Notifications'}
              {activeTab === 'SYSTEM' && 'Candidate & Assessment Activity'}
              {activeTab === 'BROADCAST' && 'Push & In-App Broadcasts'}
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#8e706c]">
            Showing {displayList.length} item{displayList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#8e706c] font-medium">
            Loading notifications...
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#fff0f0] text-[#800000] flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#311213]">No Notifications Found</p>
            <p className="text-xs text-[#8e706c]">There are no activity logs or broadcast notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ffe9e8]">
            {displayList.map((n) => {
              const isSystem = n.category === 'SYSTEM';
              const isRead = readIds.has(n._id);

              return (
                <div 
                  key={n._id} 
                  onClick={() => {
                    setReadIds(prev => new Set(prev).add(n._id));
                    if (n.link) navigate(n.link);
                  }}
                  className={`p-5 transition-colors flex items-start justify-between gap-4 group ${
                    !isRead ? 'bg-[#fff0f0]/40' : ''
                  } ${n.link ? 'cursor-pointer hover:bg-[#fff8f7]' : 'hover:bg-[#fff8f7]'}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon matching system or broadcast */}
                    <div className="p-2.5 bg-[#ffe9e8] text-[#800000] rounded-xl shrink-0 mt-1 shadow-xs relative">
                      {isSystem ? (
                        n.type === 'RESULT' ? (
                          <Award className="w-5 h-5 text-[#800000]" />
                        ) : (
                          <UserPlus className="w-5 h-5 text-[#800000]" />
                        )
                      ) : (
                        <Smartphone className="w-5 h-5 text-[#800000]" />
                      )}

                      {!isRead && (
                        <span className="w-2.5 h-2.5 bg-[#800000] border-2 border-white rounded-full absolute -top-0.5 -right-0.5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-extrabold text-sm text-[#311213]">{n.title}</h3>
                        {!isSystem && (
                          <span className="bg-[#fff0f0] text-[#800000] border border-[#e2bfb9] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {n.channel?.replace('_', ' ') || 'FILO PUSH'}
                          </span>
                        )}
                        {isSystem && (
                          <span className="bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                            {n.type === 'RESULT' ? 'Assessment' : 'Registration'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#5a413d] leading-relaxed font-medium">{n.message}</p>

                      <div className="flex items-center space-x-4 text-[11px] text-[#8e706c] pt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#8e706c]" />
                          <span>
                            {n.timeDisplay || (n.createdAt ? `${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Recently')}
                          </span>
                        </div>

                        {!isSystem && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-[#8e706c]" />
                            <span>{n.sentCount || 1} Recipients</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {isSystem && n.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadIds(prev => new Set(prev).add(n._id));
                          navigate(n.link);
                        }}
                        className="px-3 py-1.5 bg-[#fff0f0] hover:bg-[#ffe9e8] text-[#800000] border border-[#e2bfb9] rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBroadcast(n._id);
                        }}
                        className="p-2 text-[#8e706c] hover:text-[#800000] hover:bg-[#ffe9e8] rounded-xl transition-all"
                        title="Delete Broadcast Notification"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating New Broadcast Notification */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#311213]/40 backdrop-blur-xs">
          <div className="bg-white border border-[#e2bfb9] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ffe9e8] pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-[#800000]" />
                <h3 className="font-bold text-base text-[#311213]">Create New Broadcast</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-[#8e706c] hover:text-[#311213]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#311213] uppercase mb-1">
                  Title <span className="text-[#800000]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2 text-xs text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#311213] uppercase mb-1">
                  Message <span className="text-[#800000]">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Notification message body..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl p-3 text-xs text-[#311213] font-medium focus:outline-none focus:border-[#800000]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#311213] uppercase mb-1">
                  Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e2bfb9] rounded-xl px-3.5 py-2 text-xs text-[#311213] font-semibold focus:outline-none focus:border-[#800000]"
                >
                  <option value="FILO_PUSH">Filo Push Notification</option>
                  <option value="IN_APP">In-App Alert</option>
                  <option value="SMS_BROADCAST">SMS Broadcast</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5a413d] hover:bg-[#fff0f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-[#800000] hover:bg-[#570000] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiloNotifications;
