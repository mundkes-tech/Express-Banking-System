import React, { useEffect, useState } from 'react';
import client from '../api/client';
import './AuditLogs.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await client.get('/reports/audit-logs');
      setLogs(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter
    ? logs.filter((log) =>
        log.actionType?.includes(filter) ||
        log.resourceType?.includes(filter) ||
        log.status?.includes(filter)
      )
    : logs;

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h2>System Audit Logs</h2>
      {error && <div className="error-box">{error}</div>}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Filter by action, resource, or status..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <p>No audit logs found.</p>
        </div>
      ) : (
        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Actor</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={idx} className={`status-${log.status}`}>
                  <td className="timestamp" data-label="Timestamp">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="action" data-label="Action">{log.actionType || 'N/A'}</td>
                  <td className="resource" data-label="Resource">{log.resourceType || 'N/A'}</td>
                  <td className="performer" data-label="Actor">
                    {typeof log.performedBy === 'object'
                      ? `${log.performedBy.name || 'System'}${log.performedBy.employeeId ? ` (${log.performedBy.employeeId})` : ''}`
                      : (log.performedBy || 'System')}
                  </td>
                  <td data-label="IP Address">{log.ipAddress || 'N/A'}</td>
                  <td data-label="Status">
                    <span className={`status-badge ${log.status}`}>{log.status}</span>
                  </td>
                  <td className="details" data-label="Details">{JSON.stringify(log.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
