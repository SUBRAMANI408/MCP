const Fund = require('../models/Fund');
const Receipt = require('../models/Receipt');
const Notification = require('../models/Notification');
const Association = require('../models/Association');
const { generateReceiptPDF } = require('../utils/receiptGenerator');
const cloudinary = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

const generateReceiptNumber = () => `RCP-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

exports.collectIncome = async (req, res) => {
  const { associationId, category, amount, description, relatedTeamId, issuedTo } = req.body;
  const fund = await Fund.create({
    associationId, type: 'income', category, amount, description,
    relatedTeamId: relatedTeamId || null,
    requestedBy: req.user._id,
    status: 'completed',
  });
  // Generate receipt
  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    issuedTo: issuedTo || 'Payee',
    amount, date: new Date(), description,
  };
  
  try {
    const pdfBuffer = await generateReceiptPDF(receiptData);
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'receipts', public_id: receiptData.receiptNumber, format: 'pdf' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(pdfBuffer);
    });
    
    const receipt = await Receipt.create({
      fundId: fund._id,
      receiptNumber: receiptData.receiptNumber,
      issuedTo: receiptData.issuedTo,
      amount, date: receiptData.date, description,
      pdfUrl: uploadResult.secure_url,
    });
    fund.receiptId = receipt._id;
    fund.receiptStatus = 'generated';
    await fund.save();
    successResponse(res, { fund, receipt }, 'Income recorded and receipt generated', 201);
  } catch (error) {
    console.error('Receipt generation or upload failed:', error);
    fund.receiptStatus = 'pending';
    await fund.save();
    return res.status(201).json({
      success: true,
      message: 'Receipt generation failed and is queued for retry.',
      data: { fund },
      warning: 'Receipt generation failed and is queued for retry.'
    });
  }
};

exports.retryReceipt = async (req, res) => {
  const fund = await Fund.findById(req.params.id);
  if (!fund) return res.status(404).json({ success: false, message: 'Fund record not found' });
  if (fund.type !== 'income') return res.status(400).json({ success: false, message: 'Only income funds have receipts' });
  if (fund.receiptId || fund.receiptStatus === 'generated') return res.status(400).json({ success: false, message: 'Receipt already generated' });

  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    issuedTo: req.body.issuedTo || 'Payee',
    amount: fund.amount, 
    date: fund.createdAt, 
    description: fund.description,
  };
  
  try {
    const pdfBuffer = await generateReceiptPDF(receiptData);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'receipts', public_id: receiptData.receiptNumber, format: 'pdf' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(pdfBuffer);
    });
    
    const receipt = await Receipt.create({
      fundId: fund._id,
      receiptNumber: receiptData.receiptNumber,
      issuedTo: receiptData.issuedTo,
      amount: fund.amount, 
      date: receiptData.date, 
      description: fund.description,
      pdfUrl: uploadResult.secure_url,
    });
    fund.receiptId = receipt._id;
    fund.receiptStatus = 'generated';
    await fund.save();
    successResponse(res, { fund, receipt }, 'Receipt generated successfully');
  } catch (error) {
    console.error('Retry receipt generation failed:', error);
    return res.status(500).json({ success: false, message: 'Receipt generation failed again' });
  }
};

exports.createExpenseRequest = async (req, res) => {
  const { associationId, category, amount, description, relatedTeamId } = req.body;
  const fund = await Fund.create({
    associationId, type: 'expense', category: category || 'expense', amount, description,
    relatedTeamId: relatedTeamId || null,
    requestedBy: req.user._id,
    status: 'pending',
  });
  // Notify association head
  const association = await Association.findById(associationId);
  if (association) {
    await Notification.create({
      userId: association.headUserId,
      type: 'general',
      message: `New expense request of Rs. ${amount} submitted for approval.`,
      refId: fund._id,
      refModel: 'Fund',
    });
    const io = req.app.get('io');
    io.to(association.headUserId.toString()).emit('notification:new', { type: 'expense_request', fundId: fund._id });
  }
  successResponse(res, fund, 'Expense request submitted for approval', 201);
};

exports.getFunds = async (req, res) => {
  const { associationId, type, category, status, page = 1, limit = 10 } = req.query;
  const query = {};
  
  if (req.user && req.user.role !== 'admin') {
    if (!req.user.associationId) {
      return res.status(400).json({ success: false, message: 'User does not belong to an association' });
    }
    query.associationId = req.user.associationId;
  } else if (associationId) {
    query.associationId = associationId;
  }

  if (type) query.type = type;
  if (category) query.category = category;
  if (status) query.status = status;
  const total = await Fund.countDocuments(query);
  const funds = await Fund.find(query)
    .populate('requestedBy', 'name')
    .populate('approvedBy', 'name')
    .populate('relatedTeamId', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, funds, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getFund = async (req, res) => {
  const fund = await Fund.findById(req.params.id)
    .populate('requestedBy', 'name email')
    .populate('approvedBy', 'name')
    .populate('receiptId')
    .populate('relatedTeamId', 'name');
  if (!fund) return res.status(404).json({ success: false, message: 'Fund record not found' });
  successResponse(res, fund);
};

exports.getBalance = async (req, res) => {
  const { associationId } = req.params;
  const mongoId = require('mongoose').Types.ObjectId.createFromHexString(associationId);
  const [income, expenses] = await Promise.all([
    Fund.aggregate([
      { $match: { associationId: mongoId, type: 'income', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Fund.aggregate([
      { $match: { associationId: mongoId, type: 'expense', status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
  ]);
  const totalIncome = income[0]?.total || 0;
  const totalExpenses = expenses[0]?.total || 0;
  successResponse(res, { totalIncome, totalExpenses, balance: totalIncome - totalExpenses });
};

exports.approveExpense = async (req, res) => {
  const fund = await Fund.findById(req.params.id).populate('requestedBy', 'name email _id');
  if (!fund) return res.status(404).json({ success: false, message: 'Fund record not found' });
  if (fund.type !== 'expense') return res.status(400).json({ success: false, message: 'Not an expense' });
  fund.status = 'approved';
  fund.approvedBy = req.user._id;
  await fund.save();
  await Notification.create({
    userId: fund.requestedBy._id,
    type: 'expense_approved',
    message: `Your expense request of Rs. ${fund.amount} has been approved.`,
    refId: fund._id,
  });
  successResponse(res, fund, 'Expense approved');
};

exports.rejectExpense = async (req, res) => {
  const fund = await Fund.findById(req.params.id).populate('requestedBy', '_id');
  if (!fund) return res.status(404).json({ success: false, message: 'Fund record not found' });
  fund.status = 'rejected';
  fund.approvedBy = req.user._id;
  await fund.save();
  await Notification.create({
    userId: fund.requestedBy._id,
    type: 'expense_rejected',
    message: `Your expense request of Rs. ${fund.amount} has been rejected.`,
    refId: fund._id,
  });
  successResponse(res, fund, 'Expense rejected');
};

exports.getFinancialReports = async (req, res) => {
  const { associationId } = req.params;
  const mongoId = require('mongoose').Types.ObjectId.createFromHexString(associationId);
  const [byCategory, monthly] = await Promise.all([
    Fund.aggregate([
      { $match: { associationId: mongoId } },
      { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Fund.aggregate([
      { $match: { associationId: mongoId, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
  ]);
  successResponse(res, { byCategory, monthly });
};

exports.getDashboard = async (req, res) => {
  const matchQuery = {};
  if (req.user.role !== 'admin') {
    if (!req.user.associationId) {
      return res.status(400).json({ success: false, message: 'User does not belong to an association' });
    }
    matchQuery.associationId = require('mongoose').Types.ObjectId.createFromHexString(req.user.associationId.toString());
  }

  const [income, expenses, pending, recent] = await Promise.all([
    Fund.aggregate([
      { $match: { ...matchQuery, type: 'income', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Fund.aggregate([
      { $match: { ...matchQuery, type: 'expense', status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Fund.aggregate([
      { $match: { ...matchQuery, type: 'expense', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Fund.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
  ]);

  const totalIncome = income[0]?.total || 0;
  const totalExpenses = expenses[0]?.total || 0;

  successResponse(res, {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    pendingExpensesAmount: pending[0]?.total || 0,
    pendingExpenseRequests: pending[0]?.count || 0,
    recentTransactions: recent
  });
};
