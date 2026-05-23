import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    role: 'teller',
    department: 'Operations',
    phone: '',
  });
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await client.get('/employees');
        setEmployees(response.data.data || []);
      } catch (error) {
        addNotification('Failed to load employees', 'error');
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [addNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.name || !formData.email || !formData.password) {
      addNotification('Please fill in all required fields', 'warning');
      return;
    }

    try {
      const response = await client.post('/employees', formData);
      const newEmployee = response.data.data;
      setEmployees((prev) => [newEmployee, ...prev]);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        role: 'teller',
        department: 'Operations',
        phone: '',
      });
      setShowForm(false);
      addNotification(`Employee "${newEmployee.name}" created successfully!`, 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create employee';
      addNotification(errorMsg, 'error');
    }
  };

  const handleUpdateEmployee = async (employeeId, updates) => {
    try {
      const response = await client.patch(`/employees/${employeeId}`, updates);
      setEmployees((prev) =>
        prev.map((emp) => (emp._id === employeeId ? response.data.data : emp))
      );
      addNotification('Employee updated successfully!', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update employee';
      addNotification(errorMsg, 'error');
    }
  };

  const handleToggleActive = (employee) => {
    handleUpdateEmployee(employee._id, { isActive: !employee.isActive });
  };

  const handleRoleChange = (employeeId, newRole) => {
    handleUpdateEmployee(employeeId, { role: newRole });
  };

  if (loading) {
    return <div className="employee-management"><p>Loading employees...</p></div>;
  }

  return (
    <div className="employee-management">
      <div className="em-header">
        <h2>Employee Management</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="em-form-container">
          <h3>Create New Employee</h3>
          <p className="form-note">
            <strong>Note:</strong> Only Teller and Manager roles can be created here. Admin accounts require system administrator intervention.
          </p>
          <form onSubmit={handleAddEmployee}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID *</label>
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="e.g., TELLER001"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="teller">Teller</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  minLength="6"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Operations"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <button type="submit" className="btn-primary">
              Create Employee
            </button>
          </form>
        </div>
      )}

      <div className="employees-section">
        <h3>{employees.length} Employee(s)</h3>
        {employees.length === 0 ? (
          <p className="no-data">No employees found.</p>
        ) : (
          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee._id} className="employee-card">
                <div className="card-header">
                  <div>
                    <h4>{employee.name}</h4>
                    <p className="emp-id">{employee.employeeId}</p>
                  </div>
                  <span className={`status-badge status-${employee.isActive ? 'active' : 'inactive'}`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="card-body">
                  <p><strong>Email:</strong> {employee.email}</p>
                  <p><strong>Department:</strong> {employee.department}</p>
                  {employee.phone && <p><strong>Phone:</strong> {employee.phone}</p>}
                  <p><strong>Last Login:</strong> {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : 'Never'}</p>
                  <p className="text-muted"><small>Created: {new Date(employee.createdAt).toLocaleDateString()}</small></p>
                </div>

                <div className="card-actions">
                  <div className="role-selector">
                    <label htmlFor={`role-${employee._id}`}>Role:</label>
                    <select
                      id={`role-${employee._id}`}
                      value={employee.role}
                      onChange={(e) => handleRoleChange(employee._id, e.target.value)}
                      className="role-select"
                    disabled={employee.role === 'admin'}
                  >
                    <option value="teller">Teller</option>
                    <option value="manager">Manager</option>
                    {employee.role === 'admin' && <option value="admin">Admin (Cannot Change)</option>}
                    </select>
                  </div>

                  <button
                    className={`btn-toggle ${employee.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                    onClick={() => handleToggleActive(employee)}
                  >
                    {employee.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
