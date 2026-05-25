import React, { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './EmployeeManagement.css';

const emptyCreateForm = {
  employeeId: '',
  name: '',
  email: '',
  password: '',
  role: 'teller',
  department: 'Operations',
  phone: '',
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [editForm, setEditForm] = useState({ role: 'teller', department: 'Operations', phone: '', isActive: true });
  const [savingEmployeeId, setSavingEmployeeId] = useState('');
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const { addNotification } = useNotification();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await client.get('/employees');
      setEmployees(res.data.data || []);
    } catch (error) {
      addNotification('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const searchable = [
        employee.employeeId,
        employee.name,
        employee.email,
        employee.role,
        employee.department,
        employee.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [employees, searchTerm]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      setCreateForm((previous) => ({ ...previous, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }

    setCreateForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const beginEdit = (employee) => {
    setEditingEmployeeId(employee._id);
    setEditForm({
      role: employee.role || 'teller',
      department: employee.department || 'Operations',
      phone: employee.phone || '',
      isActive: Boolean(employee.isActive),
    });
  };

  const cancelEdit = () => {
    setEditingEmployeeId('');
    setEditForm({ role: 'teller', department: 'Operations', phone: '', isActive: true });
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      setCreatingEmployee(true);
      await client.post('/employees', {
        ...createForm,
        phone: createForm.phone || '',
      });
      addNotification('Employee created successfully', 'success');
      setCreateForm(emptyCreateForm);
      await fetchEmployees();
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to create employee', 'error');
    } finally {
      setCreatingEmployee(false);
    }
  };

  const submitUpdate = async (employeeId) => {
    try {
      setSavingEmployeeId(employeeId);
      await client.patch(`/employees/${employeeId}`, editForm);
      addNotification('Employee updated successfully', 'success');
      cancelEdit();
      await fetchEmployees();
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to update employee', 'error');
    } finally {
      setSavingEmployeeId('');
    }
  };

  if (loading) return <div className="container"><p>Loading employees...</p></div>;

  return (
    <div className="container employee-management">
      <h2>Employee Management</h2>
      <p className="cm-subtitle">Create staff accounts, update roles, and activate or deactivate employees.</p>

      <div className="cm-toolbar">
        <input
          className="cm-search"
          type="search"
          placeholder="Search by employee ID, name, email, role, department..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button type="button" className="cm-refresh" onClick={fetchEmployees}>Refresh</button>
      </div>

      <form className="management-form" onSubmit={submitCreate}>
        <h3>Create Employee</h3>
        <div className="two-col-grid">
          <input name="employeeId" value={createForm.employeeId} onChange={handleCreateChange} placeholder="Employee ID" required />
          <input name="name" value={createForm.name} onChange={handleCreateChange} placeholder="Name" required />
        </div>
        <div className="two-col-grid">
          <input name="email" type="email" value={createForm.email} onChange={handleCreateChange} placeholder="Email" required />
          <input name="password" type="password" value={createForm.password} onChange={handleCreateChange} placeholder="Password" required />
        </div>
        <div className="two-col-grid">
          <select name="role" value={createForm.role} onChange={handleCreateChange}>
            <option value="teller">Teller</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <input name="department" value={createForm.department} onChange={handleCreateChange} placeholder="Department" />
        </div>
        <input name="phone" value={createForm.phone} onChange={handleCreateChange} placeholder="Phone" />
        <button type="submit" disabled={creatingEmployee}>{creatingEmployee ? 'Creating...' : 'Create Employee'}</button>
      </form>

      <div className="employees-grid">
        {filteredEmployees.map((emp) => {
          const isEditing = editingEmployeeId === emp._id;
          return (
            <div className="employee-card" key={emp._id}>
              <div className="card-header">
                <div>
                  <h4>{emp.name}</h4>
                  <p className="employee-id">{emp.employeeId}</p>
                </div>
                <span className={`status-badge status-${emp.isActive ? 'active' : 'inactive'}`}>
                  {emp.isActive ? 'active' : 'inactive'}
                </span>
              </div>

              <p><strong>Email:</strong> {emp.email}</p>

              {isEditing ? (
                <div className="customer-edit-form">
                  <select name="role" value={editForm.role} onChange={handleEditChange}>
                    <option value="teller">Teller</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input name="department" value={editForm.department} onChange={handleEditChange} placeholder="Department" />
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} placeholder="Phone" />
                  <label className="checkbox-row">
                    <input type="checkbox" name="isActive" checked={editForm.isActive} onChange={handleEditChange} />
                    Active
                  </label>
                </div>
              ) : (
                <>
                  <p><strong>Role:</strong> {emp.role}</p>
                  <p><strong>Department:</strong> {emp.department}</p>
                  <p><strong>Phone:</strong> {emp.phone || 'N/A'}</p>
                </>
              )}

              <div className="customer-actions">
                {isEditing ? (
                  <>
                    <button type="button" className="action-btn primary" disabled={savingEmployeeId === emp._id} onClick={() => submitUpdate(emp._id)}>
                      {savingEmployeeId === emp._id ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="action-btn secondary" onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <button type="button" className="action-btn primary" onClick={() => beginEdit(emp)}>Edit</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeManagement;
