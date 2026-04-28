import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiDroplet, FiPhone, FiCalendar, FiEdit2, FiCheck, FiX, FiActivity, FiPlusCircle, FiList } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [history, setHistory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({ name: '', blood_group: '', contact: '' });
  const [donationForm, setDonationForm] = useState({ quantity: 350, donation_date: '' });
  const [requestForm, setRequestForm] = useState({ blood_group: 'O+', quantity: 1, urgency_level: 'MEDIUM' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, eligRes, histRes, myReqRes, notifRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/donor/eligibility'),
        api.get('/donation/history'),
        api.get('/request/my-requests').catch(() => ({ data: { data: [] } })),
        api.get('/notifications').catch(() => ({ data: { data: [] } }))
      ]);

      const data = profileRes.data.data;
      setProfile(data.profile);
      setUserData(data.user);
      setEligibility(eligRes.data.eligible);
      setHistory(histRes.data.data);
      setMyRequests(myReqRes.data.data || []);
      setNotifications(notifRes.data.data || []);

      setForm({
        name: data.user?.name || '',
        blood_group: data.profile?.blood_group || 'O+',
        contact: data.profile?.contact || '',
      });
    } catch (err) {
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.contact && !/^[0-9]{10}$/.test(form.contact)) {
      toast.error('Contact must be a 10-digit number.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: form.name || undefined,
        blood_group: form.blood_group,
        contact: form.contact || undefined,
      });
      setProfile(data.data.profile);
      setUserData((p) => ({ ...p, name: form.name || p.name }));
      toast.success('Profile updated.');
      setEditing(false);
      fetchData(); // Refresh eligibility
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donation/add', donationForm);
      toast.success('Donation record added.');
      setDonationForm({ quantity: 350, donation_date: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to add donation record.');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/request/create', requestForm);
      toast.success('Blood request created successfully.');
      setRequestForm({ blood_group: 'O+', quantity: 1, urgency_level: 'MEDIUM' });
      fetchData();
      setActiveTab('my_requests');
    } catch (err) {
      toast.error('Failed to create blood request.');
    }
  };

  const handleRevoke = async (id) => {
    try {
      await api.put(`/request/revoke/${id}`);
      toast.success('Request revoked.');
      fetchData();
    } catch (err) {
      toast.error('Failed to revoke request.');
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const initials = (userData?.name || user?.name || 'D')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const displayUser = userData || user;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="dashboard-layout">
        <div className="container">
          <div className="dash-header">
            <p className="dash-breadcrumb">
              <FiDroplet size={11} style={{ color: 'var(--red)' }} />
              Donor Portal
            </p>
            <h1 className="dash-title">
              Good to see you, {(displayUser?.name || '').split(' ')[0] || 'Donor'}.
            </h1>
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <span>Loading dashboard…</span>
            </div>
          ) : (
            <>
              <div className="stats-row">
                <div className="stat-tile">
                  <div className="stat-tile-icon"><FiDroplet size={14} /> Blood Group</div>
                  <div className="stat-tile-value" style={{ fontFamily: 'var(--font-display)', color: 'var(--red-light)' }}>
                    {profile?.blood_group || '—'}
                  </div>
                </div>

                <div className="stat-tile">
                  <div className="stat-tile-icon"><FiActivity size={14} /> Status</div>
                  <div className="stat-tile-value" style={{ fontSize: '1.1rem', color: eligibility ? '#10b981' : '#f59e0b' }}>
                    {eligibility ? 'Eligible to Donate' : 'Not Eligible Yet'}
                  </div>
                  <p className="stat-tile-note">Based on 90-day safe interval</p>
                </div>

                <div className="stat-tile">
                  <div className="stat-tile-icon"><FiCalendar size={14} /> Last Donation</div>
                  <div className="stat-tile-value" style={{ fontSize: '1.1rem' }}>
                    {fmt(profile?.last_donation_date)}
                  </div>
                </div>
              </div>

              <div className="dash-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                <button className={`btn btn-ghost ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
                <button className={`btn btn-ghost ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Donation History</button>
                <button className={`btn btn-ghost ${activeTab === 'my_requests' ? 'active' : ''}`} onClick={() => setActiveTab('my_requests')}>My Requests</button>
                <button className={`btn btn-ghost ${activeTab === 'request' ? 'active' : ''}`} onClick={() => setActiveTab('request')}>Create Request</button>
                <button className={`btn btn-ghost ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                  Notifications {notifications.filter(n => n.status === 'UNREAD').length > 0 && <span style={{ background: 'var(--red)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>{notifications.filter(n => n.status === 'UNREAD').length}</span>}
                </button>
              </div>

              {activeTab === 'profile' && (
                <div className="dash-grid">
                  <div className="panel">
                    <div className="profile-summary">
                      <div className="profile-big-avatar">{initials}</div>
                      <p className="profile-name">{displayUser?.name}</p>
                      <p className="profile-email">{displayUser?.email}</p>
                    </div>
                    <div className="detail-list">
                      <div className="detail-row"><span className="detail-key">Blood group</span><span className="detail-val blood-val">{profile?.blood_group || '—'}</span></div>
                      <div className="detail-row"><span className="detail-key">Contact</span><span className="detail-val">{profile?.contact || '—'}</span></div>
                      <div className="detail-row"><span className="detail-key">Eligibility</span><span className="detail-val">{eligibility ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Profile information</span>
                      {!editing && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><FiEdit2 size={13} /> Edit</button>
                      )}
                    </div>
                    {editing ? (
                      <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Name</label>
                          <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Blood Group</label>
                          <select name="blood_group" className="form-input" value={form.blood_group} onChange={handleChange}>
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contact</label>
                          <input type="tel" name="contact" className="form-input" value={form.contact} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button type="submit" className="btn btn-primary" disabled={saving}>Save</button>
                          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="panel-body"><p>Manage your donor profile details here.</p></div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="dash-grid">
                  <div className="panel" style={{ gridColumn: 'span 2' }}>
                    <div className="panel-header">
                      <span className="panel-title">Add External Donation</span>
                    </div>
                    <form onSubmit={handleAddDonation} style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input type="date" required className="form-input" value={donationForm.donation_date} onChange={e => setDonationForm({...donationForm, donation_date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Quantity (ml)</label>
                        <input type="number" required className="form-input" value={donationForm.quantity} onChange={e => setDonationForm({...donationForm, quantity: e.target.value})} min="100" />
                      </div>
                      <button type="submit" className="btn btn-primary">Add Record</button>
                    </form>
                  </div>
                  <div className="panel" style={{ gridColumn: 'span 2' }}>
                    <div className="panel-header">
                      <span className="panel-title">Donation History</span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {history.length === 0 ? <p>No donation records found.</p> : (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '0.5rem' }}>Date</th>
                              <th style={{ padding: '0.5rem' }}>Hospital</th>
                              <th style={{ padding: '0.5rem' }}>Quantity (ml)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map(record => (
                              <tr key={record._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{fmt(record.donation_date)}</td>
                                <td style={{ padding: '0.5rem' }}>{record.hospital?.name || 'External/Unknown'}</td>
                                <td style={{ padding: '0.5rem' }}>{record.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'my_requests' && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">My Request History</span>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {myRequests.length === 0 ? <p>You haven't created any requests yet.</p> : (
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.5rem' }}>ID</th>
                            <th style={{ padding: '0.5rem' }}>Blood Group</th>
                            <th style={{ padding: '0.5rem' }}>Urgency</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                            <th style={{ padding: '0.5rem' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myRequests.map(req => (
                            <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{req.requestId}</td>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--red)' }}>{req.blood_group}</td>
                              <td style={{ padding: '0.5rem' }}>{req.urgency_level}</td>
                              <td style={{ padding: '0.5rem' }}>{req.status}</td>
                              <td style={{ padding: '0.5rem' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                              <td style={{ padding: '0.5rem' }}>
                                {req.status === 'OPEN' && (
                                  <button onClick={() => handleRevoke(req._id)} className="btn btn-sm btn-outline" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>Revoke</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'request' && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Request Blood for Emergency</span>
                  </div>
                  <form onSubmit={handleCreateRequest} style={{ padding: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Blood Group Needed</label>
                      <select className="form-input" value={requestForm.blood_group} onChange={e => setRequestForm({...requestForm, blood_group: e.target.value})}>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Units Needed</label>
                      <input type="number" min="1" className="form-input" value={requestForm.quantity} onChange={e => setRequestForm({...requestForm, quantity: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Urgency</label>
                      <select className="form-input" value={requestForm.urgency_level} onChange={e => setRequestForm({...requestForm, urgency_level: e.target.value})}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Request</button>
                  </form>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Notifications</span>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {notifications.length === 0 ? <p>No notifications.</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notifications.map(notif => (
                          <div key={notif._id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: notif.status === 'UNREAD' ? 'var(--bg-2)' : 'transparent' }}>
                            <p style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: notif.status === 'UNREAD' ? 'bold' : 'normal' }}>{notif.message}</span>
                              {notif.status === 'UNREAD' && (
                                <button onClick={() => handleReadNotification(notif._id)} className="btn btn-sm btn-outline">Mark as Read</button>
                              )}
                            </p>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;
