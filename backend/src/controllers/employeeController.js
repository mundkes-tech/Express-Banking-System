const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

const createEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, role, department, phone } = req.body;

    // Validate required fields
    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ message: 'Employee ID, name, email, and password are required' });
    }

    // Prevent admin creation via API (only seed script can create admins)
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be created via this endpoint. Contact system administrator.' });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ employeeId }, { email }],
    });
    if (existingEmployee) {
      return res.status(409).json({ message: 'Employee ID or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = await Employee.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role: role || 'teller',
      department: department || 'Operations',
      phone: phone || '',
      isActive: true,
    });

    // Audit log
    await AuditLog.create({
      actionType: 'employee_created',
      performedBy: req.employee._id,
      resourceType: 'Employee',
      resourceId: newEmployee._id,
      details: { employeeId, name, role: newEmployee.role },
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(201).json({
      message: 'Employee created successfully',
      data: {
        _id: newEmployee._id,
        employeeId: newEmployee.employeeId,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        phone: newEmployee.phone,
        isActive: newEmployee.isActive,
        createdAt: newEmployee.createdAt,
      },
    });
  } catch (error) {
    await AuditLog.create({
      actionType: 'employee_created',
      performedBy: req.employee._id,
      resourceType: 'Employee',
      details: req.body,
      ipAddress: req.ip,
      status: 'failed',
    });
    next(error);
  }
};

const listEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find({}, '-password').sort({ createdAt: -1 });

    // Audit log
    await AuditLog.create({
      actionType: 'employees_viewed',
      performedBy: req.employee._id,
      resourceType: 'Employee',
      details: { count: employees.length },
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(200).json({
      message: 'Employees retrieved successfully',
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { role, isActive, department, phone } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields
    if (role) employee.role = role;
    if (isActive !== undefined) employee.isActive = isActive;
    if (department) employee.department = department;
    if (phone) employee.phone = phone;

    await employee.save();

    // Audit log
    await AuditLog.create({
      actionType: 'employee_updated',
      performedBy: req.employee._id,
      resourceType: 'Employee',
      resourceId: employee._id,
      details: { updated: { role, isActive, department, phone } },
      ipAddress: req.ip,
      status: 'success',
    });

    res.status(200).json({
      message: 'Employee updated successfully',
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        phone: employee.phone,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  listEmployees,
  updateEmployee,
};
