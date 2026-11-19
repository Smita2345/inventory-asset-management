import React, { useState, useEffect } from 'react';
import { S } from './styles';

const API = 'http://localhost:3000/api';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState({ total: 0, available: 0, assigned: 0, underRepair: 0 });
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selEmp, setSelEmp] = useState(null);
  const [empAssets, setEmpAssets] = useState([]);
  const [regOpen, setRegOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState(null);
  const [empId, setEmpId] = useState('');
  const [returnAsset, setReturnAsset] = useState(null);
  const [condition, setCondition] = useState('Good');
  const [historyData, setHistoryData] = useState(null);
  const [form, setForm] = useState({ assetTag: '', name: '', category: 'Laptop', warrantyExpiry: '' });

  const loadData = async () => {
    const [d, a, e] = await Promise.all([
      fetch(`${API}/dashboard`).then((r) => r.json()),
      fetch(`${API}/assets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`).then((r) => r.json()),
      fetch(`${API}/employees`).then((r) => r.json()),
    ]);
    setDash(d);
    setAssets(a);
    setEmployees(e);
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const submitRegister = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, warrantyExpiry: form.warrantyExpiry || null }),
    });
    if (!res.ok) return alert('Asset ID must be unique.');
    setForm({ assetTag: '', name: '', category: 'Laptop', warrantyExpiry: '' });
    setRegOpen(false);
    loadData();
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!empId) return;
    await fetch(`${API}/assets/${assignAsset.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: Number(empId) }),
    });
    setAssignAsset(null);
    setEmpId('');
    loadData();
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    await fetch(`${API}/assets/${returnAsset.id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnCondition: condition }),
    });
    setReturnAsset(null);
    setCondition('Good');
    loadData();
  };

  const markFixed = async (id) => {
    await fetch(`${API}/assets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Available' }),
    });
    loadData();
  };

  const viewHistory = async (asset) => {
    const records = await fetch(`${API}/assets/${asset.id}/history`).then((r) => r.json());
    setHistoryData({ asset, records });
  };

  const pickEmployee = async (emp) => {
    setSelEmp(emp);
    const list = await fetch(`${API}/employees/${emp.id}/assets`).then((r) => r.json());
    setEmpAssets(list);
  };

  const warrantyInfo = (dt) => {
    if (!dt) return { text: 'No Warranty', alert: false };
    const days = Math.ceil((new Date(dt) - new Date()) / 86400000);
    if (days < 0) return { text: `${dt} (Expired)`, alert: true };
    if (days <= 30) return { text: `${dt} (${days}d left)`, alert: true };
    return { text: dt, alert: false };
  };

  const alerts = assets.filter((a) => warrantyInfo(a.warrantyExpiry).alert);

  const badge = (st) => {
    const c = st === 'Available' ? ['#dcfce7', '#166534'] : st === 'Assigned' ? ['#dbeafe', '#1e40af'] : ['#fee2e2', '#991b1b'];
    return <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: c[0], color: c[1] }}>{st}</span>;
  };

  return (
    <div style={S.shell}>
      <aside style={S.aside}>
        <div>
          <div style={S.brand}>
            <div style={S.logo}>IA</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>AssetFlow Pro</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Inventory System</div>
            </div>
          </div>
          <nav style={S.nav}>
            <button onClick={() => setTab('dashboard')} style={S.navBtn(tab === 'dashboard')}>📊 Dashboard Overview</button>
            <button onClick={() => setTab('assets')} style={S.navBtn(tab === 'assets')}>💻 Asset Inventory</button>
            <button onClick={() => setTab('employees')} style={S.navBtn(tab === 'employees')}>👥 Employee Allocations</button>
            <button onClick={() => setTab('warranty')} style={S.navBtn(tab === 'warranty')}>⚠️ Warranty Alerts ({alerts.length})</button>
          </nav>
        </div>
      </aside>

      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Inventory & Asset Management</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Track hardware, manage employee assignments, and monitor warranties</p>
          </div>
          <button onClick={() => setRegOpen(true)} style={S.primaryBtn}>+ Register New Asset</button>
        </header>

        <div style={S.body}>
          {tab === 'dashboard' && (
            <>
              <div style={S.kpiGrid}>
                <div style={S.kpiCard('#0f172a')}><div style={S.kpiLabel}>Total Assets</div><div style={S.kpiVal('#0f172a')}>{dash.total}</div></div>
                <div style={S.kpiCard('#22c55e')}><div style={S.kpiLabel}>Available</div><div style={S.kpiVal('#16a34a')}>{dash.available}</div></div>
                <div style={S.kpiCard('#3b82f6')}><div style={S.kpiLabel}>Assigned</div><div style={S.kpiVal('#2563eb')}>{dash.assigned}</div></div>
                <div style={S.kpiCard('#ef4444')}><div style={S.kpiLabel}>Under Repair</div><div style={S.kpiVal('#dc2626')}>{dash.underRepair}</div></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={S.panel}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Quick Summary</h3>
                  <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 8px' }}>
                    <strong>Total Employees:</strong> {employees.length}
                  </p>
                  <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px' }}>
                    <strong>Active Warranty Alerts:</strong> {alerts.length}
                  </p>
                  <button onClick={() => setTab('assets')} style={S.secBtn}>View Full Inventory →</button>
                </div>

                <div style={S.panel}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Recent Assets</h3>
                  {assets.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '14px' }}>
                      <p style={{ margin: '0 0 12px' }}>No assets registered yet.</p>
                      <button onClick={() => setRegOpen(true)} style={S.primaryBtn}>+ Add First Asset</button>
                    </div>
                  ) : (
                    assets.slice(0, 4).map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span><strong>{a.assetTag}</strong> — {a.name}</span>
                        {badge(a.status)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'assets' && (
            <div style={S.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Equipment Registry</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...S.input, width: '220px' }} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={S.input}>
                    <option value="ALL">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>
              </div>
              {assets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <p>No assets registered yet.</p>
                  <button onClick={() => setRegOpen(true)} style={S.primaryBtn}>+ Add First Asset</button>
                </div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr><th style={S.th}>ID</th><th style={S.th}>Name</th><th style={S.th}>Category</th><th style={S.th}>Status</th><th style={S.th}>Assigned To</th><th style={S.th}>Warranty</th><th style={S.th}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => {
                      const holder = a.assignments && a.assignments[0] ? a.assignments[0].employee : null;
                      const w = warrantyInfo(a.warrantyExpiry);
                      return (
                        <tr key={a.id}>
                          <td style={S.td}><span style={S.tag}>{a.assetTag}</span></td>
                          <td style={{ ...S.td, fontWeight: '600' }}>{a.name}</td>
                          <td style={S.td}>{a.category}</td>
                          <td style={S.td}>{badge(a.status)}</td>
                          <td style={S.td}>{holder ? `${holder.name} (${holder.department})` : 'Unassigned'}</td>
                          <td style={{ ...S.td, color: w.alert ? '#dc2626' : '#475569' }}>{w.text}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {a.status === 'Available' && <button onClick={() => setAssignAsset(a)} style={S.actBlue}>Assign</button>}
                              {a.status === 'Assigned' && <button onClick={() => setReturnAsset(a)} style={S.actWarn}>Return</button>}
                              {a.status === 'Under Repair' && <button onClick={() => markFixed(a.id)} style={S.actGreen}>Mark Fixed</button>}
                              <button onClick={() => viewHistory(a)} style={S.secBtn}>History</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
              )}
            </div>
          )}

          {tab === 'employees' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
              <div style={S.panel}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Employees</h3>
                {employees.map((emp) => (
                  <button key={emp.id} onClick={() => pickEmployee(emp)} style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', border: selEmp?.id === emp.id ? '2px solid #2563eb' : '1px solid #e2e8f0', backgroundColor: selEmp?.id === emp.id ? '#eff6ff' : '#fff' }}>
                    <div style={{ fontWeight: '600' }}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.department}</div>
                  </button>
                ))}
              </div>
              <div style={S.panel}>
                {!selEmp ? <p style={{ color: '#64748b' }}>Select an employee on the left to view assigned assets.</p> : (
                  <div>
                    <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Assigned to {selEmp.name} ({empAssets.length})</h3>
                    {empAssets.length === 0 ? <p style={{ color: '#64748b' }}>No active assets assigned.</p> : (
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>ID</th><th style={S.th}>Asset</th><th style={S.th}>Category</th><th style={S.th}>Action</th></tr></thead>
                        <tbody>
                          {empAssets.map((x) => (
                            <tr key={x.id}>
                              <td style={S.td}><strong>{x.asset.assetTag}</strong></td>
                              <td style={S.td}>{x.asset.name}</td>
                              <td style={S.td}>{x.asset.category}</td>
                              <td style={S.td}><button onClick={() => setReturnAsset(x.asset)} style={S.secBtn}>Return</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'warranty' && (
            <div style={S.panel}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px' }}>Warranty Alerts (Expiring in 30 Days or Expired)</h3>
              {alerts.length === 0 ? <p style={{ color: '#16a34a' }}>No upcoming warranty expirations.</p> : (
                <table style={S.table}>
                  <thead><tr><th style={S.th}>ID</th><th style={S.th}>Name</th><th style={S.th}>Status</th><th style={S.th}>Warranty</th></tr></thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={a.id}>
                        <td style={S.td}><strong>{a.assetTag}</strong></td>
                        <td style={S.td}>{a.name}</td>
                        <td style={S.td}>{badge(a.status)}</td>
                        <td style={{ ...S.td, color: '#dc2626', fontWeight: '600' }}>{warrantyInfo(a.warrantyExpiry).text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {regOpen && (
        <div style={S.overlay}><div style={S.modal}>
          <h3 style={{ margin: '0 0 14px' }}>Register New Asset</h3>
          <form onSubmit={submitRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={S.label}>Unique Asset ID *</label><input required placeholder="LAP-001" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} style={{ ...S.input, width: '100%' }} /></div>
            <div><label style={S.label}>Asset Name *</label><input required placeholder="MacBook Pro" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...S.input, width: '100%' }} /></div>
            <div><label style={S.label}>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...S.input, width: '100%' }}><option>Laptop</option><option>Monitor</option><option>Keyboard</option><option>Other</option></select></div>
            <div><label style={S.label}>Warranty Expiry</label><input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} style={{ ...S.input, width: '100%' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" onClick={() => setRegOpen(false)} style={S.secBtn}>Cancel</button><button type="submit" style={S.primaryBtn}>Save</button></div>
          </form>
        </div></div>
      )}

      {assignAsset && (
        <div style={S.overlay}><div style={S.modal}>
          <h3 style={{ margin: '0 0 12px' }}>Assign {assignAsset.name}</h3>
          <form onSubmit={submitAssign} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select required value={empId} onChange={(e) => setEmpId(e.target.value)} style={{ ...S.input, width: '100%' }}>
              <option value="">-- Select Employee --</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" onClick={() => setAssignAsset(null)} style={S.secBtn}>Cancel</button><button type="submit" style={S.primaryBtn}>Assign</button></div>
          </form>
        </div></div>
      )}

      {returnAsset && (
        <div style={S.overlay}><div style={S.modal}>
          <h3 style={{ margin: '0 0 12px' }}>Return {returnAsset.name}</h3>
          <form onSubmit={submitReturn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={S.label}>Return Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ ...S.input, width: '100%' }}>
              <option value="Good">Good (Available)</option>
              <option value="Minor Wear">Minor Wear (Available)</option>
              <option value="Damaged">Damaged (Moves to Under Repair)</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" onClick={() => setReturnAsset(null)} style={S.secBtn}>Cancel</button><button type="submit" style={S.primaryBtn}>Return</button></div>
          </form>
        </div></div>
      )}

      {historyData && (
        <div style={S.overlay}><div style={S.modal}>
          <h3 style={{ margin: '0 0 12px' }}>History: {historyData.asset.name}</h3>
          {historyData.records.length === 0 ? <p>No history yet.</p> : historyData.records.map((r) => (
            <div key={r.id} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
              <strong>{r.employee.name}</strong> • Assigned: {new Date(r.assignedDate).toLocaleDateString()}
              {r.returnedDate ? ` • Returned: ${new Date(r.returnedDate).toLocaleDateString()} (${r.returnCondition})` : ' • Active'}
            </div>
          ))}
          <button onClick={() => setHistoryData(null)} style={S.primaryBtn}>Close</button>
        </div></div>
      )}
    </div>
  );
}