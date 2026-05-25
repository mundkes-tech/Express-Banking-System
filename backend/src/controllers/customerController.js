const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

// Generate unique customer ID
const generateCustomerId = () => {
  return `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Create a new customer (teller/manager/admin only)
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCustomer) {
      return res.status(409).json({
        message: 'Customer with this email or phone already exists',
      });
    }

    const customerId = generateCustomerId();

    const customer = await Customer.create({
      customerId,
      name,
      email,
      phone,
      address,
      createdBy: req.employee._id,
      status: 'inactive', // Customer inactive until KYC verified
      kyc: {
        status: 'not_started',
      },
    });

    // Audit: customer created
    try {
      await AuditLog.create({
        actionType: 'customer_create',
        performedBy: req.employee._id,
        resourceType: 'Customer',
        resourceId: customer.customerId,
        details: { name: customer.name, email: customer.email, phone: customer.phone },
        ipAddress: req.ip,
        status: 'success',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return res.status(201).json({
      message: 'Customer created successfully',
      customer,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all customers (teller/manager/admin can view)
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { status, kycStatus } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (kycStatus) {
      filter['kyc.status'] = kycStatus;
    }

    const customers = await Customer.find(filter)
      .populate('createdBy', 'name employeeId')
      .populate('kyc.verifiedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Customers fetched successfully',
      data: customers,
    });
  } catch (error) {
    return next(error);
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId)
      .populate('createdBy', 'name employeeId')
      .populate('kyc.verifiedBy', 'name employeeId');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    return next(error);
  }
};

// Update customer details (teller/manager/admin)
exports.updateCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { name, email, phone, address } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check for duplicate email/phone if changing
    if (email && email !== customer.email) {
      const existingEmail = await Customer.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      customer.email = email;
    }

    if (phone && phone !== customer.phone) {
      const existingPhone = await Customer.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone already in use' });
      }
      customer.phone = phone;
    }

    if (name) customer.name = name;
    if (address) customer.address = { ...customer.address, ...address };

    await customer.save();

    return res.status(200).json({
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    return next(error);
  }
};

// Start KYC verification (teller submits KYC details)
exports.startKYC = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { idType, idNumber, idDocument } = req.body;

    if (!idDocument || !String(idDocument).trim()) {
      return res.status(400).json({ message: 'ID document reference is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.kyc.status = 'pending';
    customer.kyc.idType = idType;
    customer.kyc.idNumber = idNumber;
    customer.kyc.idDocument = idDocument;

    await customer.save();

    // Audit: KYC submitted
    try {
      await AuditLog.create({
        actionType: 'kyc_submitted',
        performedBy: req.employee._id,
        resourceType: 'Customer',
        resourceId: customer.customerId,
        details: { idType, idNumber },
        ipAddress: req.ip,
        status: 'pending',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return res.status(200).json({
      message: 'KYC details submitted for verification',
      customer,
    });
  } catch (error) {
    return next(error);
  }
};

// Verify KYC (manager/admin only)
exports.verifyKYC = async (req, res, next) => {
  try {
    // Only manager and admin can verify KYC
    if (!['manager', 'admin'].includes(req.employee.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions to verify KYC',
      });
    }

    const { customerId } = req.params;
    const { approved, rejectionReason } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (customer.kyc.status !== 'pending') {
      return res.status(400).json({
        message: 'KYC must be in pending status to verify',
      });
    }

    if (approved) {
      customer.kyc.status = 'verified';
      customer.kyc.verifiedBy = req.employee._id;
      customer.kyc.verifiedAt = new Date();
      customer.status = 'active'; // Activate customer on KYC verification
    } else {
      customer.kyc.status = 'rejected';
      customer.kyc.rejectionReason = rejectionReason || 'KYC verification failed';
    }

    await customer.save();

    // Audit: KYC verified/rejected
    try {
      await AuditLog.create({
        actionType: approved ? 'kyc_verified' : 'kyc_rejected',
        performedBy: req.employee._id,
        resourceType: 'Customer',
        resourceId: customer.customerId,
        details: { rejectionReason },
        ipAddress: req.ip,
        status: approved ? 'success' : 'failed',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return res.status(200).json({
      message: `KYC ${approved ? 'approved' : 'rejected'} successfully`,
      customer,
    });
  } catch (error) {
    return next(error);
  }
};

// Get customers pending KYC verification (manager/admin)
exports.getPendingKYC = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.employee.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions to view pending KYC',
      });
    }

    const customers = await Customer.find({ 'kyc.status': 'pending' })
      .populate('createdBy', 'name employeeId')
      .sort({ createdAt: -1 });

    return res.status(200).json(customers);
  } catch (error) {
    return next(error);
  }
};

// Block/unblock customer (manager/admin only)
exports.blockCustomer = async (req, res, next) => {
  try {
    if (!['manager', 'admin'].includes(req.employee.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions to block customer',
      });
    }

    const { customerId } = req.params;
    const { blocked } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.status = blocked ? 'blocked' : 'active';
    await customer.save();

    return res.status(200).json({
      message: `Customer ${blocked ? 'blocked' : 'unblocked'} successfully`,
      customer,
    });
  } catch (error) {
    return next(error);
  }
};
