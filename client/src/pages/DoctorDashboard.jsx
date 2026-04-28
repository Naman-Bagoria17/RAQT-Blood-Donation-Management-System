import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiCheck, FiX, FiPhone, FiUser, FiSearch, FiList, FiPlusCircle } from 'react-icons/fi';
import { MdOutlineLocalHospital } from 'react-icons/md';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  
  const [form, setForm] = useState({ name: '', hospital_name: '', contact: '' });
  const [requestForm, setRequestForm] = useState({ blood_group: 'O+', quantity: 1, urgency_level: 'MEDIUM' });
  const [searchForm, setSearchForm] = useState({ blood_group: 'O+', lat: '', lng: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, reqRes, myReqRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/request/all').catch(() => ({ data: { data: [] } })),
        api.get('/request/my-requests').catch(() => ({ data: { data: [] } }))
      ]);

      const data = profileRes.data.data;
      setProfile(data.profile);
      setUserData(data.user);
      setRequests(reqRes.data.data || []);
      setMyRequests(myReqRes.data.data || []);

      setForm({
        name: data.user?.name || '',
        hospital_name: data.profile?.hospital_name || '',
        contact: data.profile?.contact || '',
      });
    } catch {
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.hospital_name.trim()) { toast.error('Hospital name is required.'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: form.name || undefined,
        hospital_name: form.hospital_name,
        contact: form.contact || undefined,
      });
      setProfile(data.data.profile);
      setUserData((p) => ({ ...p, name: form.name || p.name }));
      toast.success('Profile updated.');
      setEditing(false);
    } catch (err) {
      toast.error('Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/request/create', requestForm);
      toast.success('Blood request created successfully.');
      fetchData(); // Refresh requests
      setRequestForm({ blood_group: 'O+', quantity: 1, urgency_level: 'MEDIUM' });
      setActiveTab('my_requests');
    } catch (err) {
      toast.error('Failed to create blood request.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.lat || !searchForm.lng) {
      toast.error('Latitude and Longitude are required.');
      return;
    }
    try {
      const { data } = await api.get(`/donors/search?blood_group=${encodeURIComponent(searchForm.blood_group)}&lat=${searchForm.lat}&lng=${searchForm.lng}`);
      setSearchResults(data.data);
      if (data.data.length === 0) toast.info('No eligible donors found nearby.');
    } catch (err) {
      toast.error('Search failed.');
    }
  };

  const getLocationForSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setSearchForm((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        (err) => {
          alert("Location access is mandatory for searching donors. Please enable it in your browser settings.");
          toast.error('Location access denied.');
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
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

  const handleComplete = async (id) => {
    try {
      await api.put(`/request/complete/${id}`);
      toast.success('Donation completed successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete donation.');
    }
  };

  const selectDonor = async (donorId, requestId) => {
    if (!requestId) {
      toast.error('Select a request context first (Feature expansion needed)');
      return;
    }
    try {
      await api.put(`/request/status/${requestId}`, { status: 'IN_PROGRESS', donor_id: donorId });
      toast.success('Donor selected and notified.');
      fetchData();
    } catch (err) {
      toast.error('Failed to select donor.');
    }
  };

  const initials = (userData?.name || user?.name || 'DR')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const displayUser = userData || user;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="dashboard-layout">
        <div className="container">
          <div className="dash-header">
            <p className="dash-breadcrumb">
              <MdOutlineLocalHospital size={12} style={{ color: '#a5b4fc' }} />
              Doctor Portal
            </p>
            <h1 className="dash-title">Dr. {(displayUser?.name || '').split(' ')[0] || 'Doctor'}</h1>
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <span>Loading dashboard…</span>
            </div>
          ) : (
            <>
              <div className="dash-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                <button className={`btn btn-ghost ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
                <button className={`btn btn-ghost ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Global Active Requests</button>
                <button className={`btn btn-ghost ${activeTab === 'my_requests' ? 'active' : ''}`} onClick={() => setActiveTab('my_requests')}>My Request History</button>
                <button className={`btn btn-ghost ${activeTab === 'donor_track' ? 'active' : ''}`} onClick={() => setActiveTab('donor_track')}>Donor Action Track</button>
                <button className={`btn btn-ghost ${activeTab === 'create_request' ? 'active' : ''}`} onClick={() => setActiveTab('create_request')}>Create Request</button>
                <button className={`btn btn-ghost ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Search Donors</button>
              </div>

              {activeTab === 'profile' && (
                <div className="dash-grid">
                  <div className="panel">
                    <div className="profile-summary">
                      <div className="profile-big-avatar doctor-avatar">{initials}</div>
                      <p className="profile-name">Dr. {displayUser?.name}</p>
                      <p className="profile-email">{displayUser?.email}</p>
                    </div>
                    <div className="detail-list">
                      <div className="detail-row"><span className="detail-key">Hospital</span><span className="detail-val">{profile?.hospital_name || '—'}</span></div>
                      <div className="detail-row"><span className="detail-key">Contact</span><span className="detail-val">{profile?.contact || '—'}</span></div>
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
                      <form onSubmit={handleSaveProfile} style={{ padding: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input type="text" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Hospital Name</label>
                          <input type="text" className="form-input" value={form.hospital_name} onChange={e => setForm({...form, hospital_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contact</label>
                          <input type="tel" className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button type="submit" className="btn btn-primary" disabled={saving}>Save</button>
                          <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="panel-body"><p>Manage your hospital profile details here.</p></div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Global Active Blood Requests</span>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {requests.length === 0 ? <p>No active requests.</p> : (
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.5rem' }}>ID</th>
                            <th style={{ padding: '0.5rem' }}>Blood Group</th>
                            <th style={{ padding: '0.5rem' }}>Units</th>
                            <th style={{ padding: '0.5rem' }}>Urgency</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map(req => (
                            <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{req.requestId}</td>
                              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--red)' }}>{req.blood_group}</td>
                              <td style={{ padding: '0.5rem' }}>{req.quantity}</td>
                              <td style={{ padding: '0.5rem' }}>{req.urgency_level}</td>
                              <td style={{ padding: '0.5rem' }}>{req.status}</td>
                              <td style={{ padding: '0.5rem' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'my_requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Pending Requests Section */}
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title" style={{ color: 'var(--blue)' }}>Pending Requests</span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {myRequests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length === 0 ? <p>No pending requests.</p> : (
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
                            {myRequests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').map(req => (
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

                  {/* Completed Requests Section */}
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title" style={{ color: '#10b981' }}>Completed Requests</span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {myRequests.filter(r => r.status === 'CLOSED').length === 0 ? <p>No completed requests.</p> : (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '0.5rem' }}>ID</th>
                              <th style={{ padding: '0.5rem' }}>Blood Group</th>
                              <th style={{ padding: '0.5rem' }}>Units</th>
                              <th style={{ padding: '0.5rem' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myRequests.filter(r => r.status === 'CLOSED').map(req => (
                              <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{req.requestId}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--red)' }}>{req.blood_group}</td>
                                <td style={{ padding: '0.5rem' }}>{req.quantity}</td>
                                <td style={{ padding: '0.5rem' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Revoked Requests Section */}
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title" style={{ color: 'var(--red)' }}>Revoked Requests</span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {myRequests.filter(r => r.status === 'REVOKED').length === 0 ? <p>No revoked requests.</p> : (
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '0.5rem' }}>ID</th>
                              <th style={{ padding: '0.5rem' }}>Blood Group</th>
                              <th style={{ padding: '0.5rem' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myRequests.filter(r => r.status === 'REVOKED').map(req => (
                              <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{req.requestId}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--red)' }}>{req.blood_group}</td>
                                <td style={{ padding: '0.5rem' }}>{new Date(req.request_date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'donor_track' && (
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Donor Action Track</span>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-2)' }}>Manage requests that have an assigned donor and mark them as completed.</p>
                    {myRequests.filter(r => r.status === 'IN_PROGRESS').length === 0 ? <p>No active requests with assigned donors.</p> : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {myRequests.filter(r => r.status === 'IN_PROGRESS').map(req => (
                          <div key={req._id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface-light)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                              Request {req.requestId}
                              <span className="badge" style={{ backgroundColor: 'var(--blue)', color: 'white' }}>In Progress</span>
                            </h4>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}><strong>Blood Group:</strong> <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{req.blood_group}</span></p>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}><strong>Urgency:</strong> {req.urgency_level}</p>
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}><strong>Assigned Donor:</strong></p>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>{req.selected_donor?.name || 'Unknown'}</p>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-2)' }}>{req.selected_donor?.email || ''}</p>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%', marginTop: '1rem' }}
                              onClick={() => handleComplete(req._id)}
                            >
                              <FiCheck style={{ marginRight: '0.5rem' }} /> Complete Donation
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'create_request' && (
                <div className="panel" style={{ maxWidth: 600 }}>
                  <div className="panel-header">
                    <span className="panel-title">Create Emergency Request</span>
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

              {activeTab === 'search' && (
                <div className="dash-grid">
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Smart Donor Search</span>
                    </div>
                    <form onSubmit={handleSearch} style={{ padding: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select className="form-input" value={searchForm.blood_group} onChange={e => setSearchForm({...searchForm, blood_group: e.target.value})}>
                          {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Location (Lat, Lng)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" placeholder="Latitude" className="form-input" value={searchForm.lat} onChange={e => setSearchForm({...searchForm, lat: e.target.value})} />
                          <input type="text" placeholder="Longitude" className="form-input" value={searchForm.lng} onChange={e => setSearchForm({...searchForm, lng: e.target.value})} />
                          <button type="button" className="btn btn-outline" onClick={getLocationForSearch} title="Get Current Location">📍</button>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Search Eligible Donors</button>
                    </form>
                  </div>
                  
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">Search Results</span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {searchResults.length === 0 ? <p>No results yet. Run a search to find donors.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {searchResults.map((donor, idx) => (
                            <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                {donor.userInfo?.name}
                                <span className="badge badge-donor" style={{ backgroundColor: '#10b981', color: 'white' }}>Eligible</span>
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-2)' }}>
                                Distance: {(donor.distance / 1000).toFixed(2)} km
                              </p>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>Contact: {donor.profile?.contact || donor.userInfo?.email}</p>
                              {requests.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <select id={`req-${idx}`} className="form-input" style={{ padding: '0.25rem', fontSize: '0.8rem' }}>
                                    <option value="">Select Request context</option>
                                    {requests.filter(r => r.status === 'OPEN' && r.blood_group === searchForm.blood_group).map(r => (
                                      <option key={r._id} value={r._id}>{r.blood_group} - {r.urgency_level}</option>
                                    ))}
                                  </select>
                                  <button 
                                    className="btn btn-sm btn-primary" 
                                    onClick={() => selectDonor(donor.userInfo?._id, document.getElementById(`req-${idx}`).value)}
                                  >
                                    Select Donor
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

export default DoctorDashboard;
