const ExpenseRequest = require('../models/ExpenseRequest');
const Fund = require('../models/Fund');
const Notification = require('../models/Notification');
const Association = require('../models/Association');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * Expense Request Controller (Phase 7)
 * Implements structured 3-step expense lifecycle: Request -> Head Approval -> Funds Officer Payment
 */

exports.createExpenseRequest = async (req, res) => {
  const { purpose, category, amount, attachments, notes } = req.body;
  const associationId = req.user.associationId || req.body.associationId;

  if (!associationId) {
    return res.status(400).json({ success: false, message: 'User does not belong to an association and no associationId was provided' });
  }

  const formattedAttachments = (attachments || []).map(a => typeof a === 'string' ? { url: a } : a);

  const expense = await ExpenseRequest.create({
    associationId,
    requestedBy: req.user._id,
    purpose,
    category,
    amount,
    attachments: formattedAttachments,
    notes: notes || '',
    status: 'pending',
  });

  // Notify Association Head
  const assoc = await Association.findById(associationId);
  if (assoc && assoc.headUserId) {
    await Notification.create({
      userId: assoc.headUserId,
      type: 'general',
      message: `New expense request: Rs. ${amount} for "${purpose}" by ${req.user.name}`,
      refId: expense._id,
      refModel: 'ExpenseRequest',
    });
    const io = req.app.get('io');
    if (io) io.to(assoc.headUserId.toString()).emit('notification:new', { type: 'expense_request', expenseId: expense._id });
  }

  await logAudit({
    action: 'expense_requested',
    performedBy: req.user._id,
    targetModel: 'ExpenseRequest',
    targetId: expense._id,
    details: { purpose, amount, category }
  });

  successResponse(res, expense, 'Expense request submitted successfully', 201);
};

exports.getExpenseRequests = async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role !== 'admin') {
    query.associationId = req.user.associationId;
  }
  if (status) query.status = status;
  if (category) query.category = category;

  const total = await ExpenseRequest.countDocuments(query);
  const expenses = await ExpenseRequest.find(query)
    .populate('requestedBy', 'name email role')
    .populate('approvedBy', 'name email')
    .populate('paidBy', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  paginatedResponse(res, expenses, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getExpenseRequest = async (req, res) => {
  const expense = await ExpenseRequest.findById(req.params.id)
    .populate('requestedBy', 'name email role')
    .populate('approvedBy', 'name email')
    .populate('paidBy', 'name email');

  if (!expense) return res.status(404).json({ success: false, message: 'Expense request not found' });
  successResponse(res, expense);
};

exports.reviewExpenseRequest = async (req, res) => {
  const { status, rejectionReason } = req.body; // 'approved' or 'rejected'
  const expense = await ExpenseRequest.findById(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense request not found' });

  expense.status = status;
  expense.approvedBy = req.user._id;
  expense.approvedAt = new Date();
  if (rejectionReason) expense.rejectionReason = rejectionReason;
  await expense.save();

  // Notify requester
  await Notification.create({
    userId: expense.requestedBy,
    type: 'general',
    message: `Your expense request for "${expense.purpose}" has been ${status}.`,
    refId: expense._id,
    refModel: 'ExpenseRequest',
  });

  await logAudit({
    action: `expense_${status}`,
    performedBy: req.user._id,
    targetModel: 'ExpenseRequest',
    targetId: expense._id,
    details: { status, rejectionReason }
  });

  successResponse(res, expense, `Expense request ${status}`);
};

exports.payExpenseRequest = async (req, res) => {
  const { paymentRef, notes } = req.body;
  const expense = await ExpenseRequest.findById(req.params.id);
  if (!expense) return res.status(404).json({ success: false, message: 'Expense request not found' });

  if (expense.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Cannot pay an unapproved expense request' });
  }

  expense.status = 'paid';
  expense.paidBy = req.user._id;
  expense.paidAt = new Date();
  expense.paymentRef = paymentRef || `PAY-${Date.now()}`;
  if (notes) expense.notes = notes;
  await expense.save();

  // Record expenditure into the central Fund collection
  const validFundCategories = ['membership_fee', 'tournament_fee', 'sponsorship', 'donation', 'expense', 'other'];
  const fundCategory = validFundCategories.includes(expense.category) ? expense.category : 'expense';

  await Fund.create({
    associationId: expense.associationId,
    type: 'expense',
    category: fundCategory,
    amount: expense.amount,
    description: `Paid: ${expense.purpose} (Ref: ${expense.paymentRef})`,
    requestedBy: expense.requestedBy,
    approvedBy: expense.approvedBy,
    status: 'completed',
  });

  // Notify requester
  await Notification.create({
    userId: expense.requestedBy,
    type: 'general',
    message: `Payment released for your expense request "${expense.purpose}". Payment Ref: ${expense.paymentRef}`,
    refId: expense._id,
    refModel: 'ExpenseRequest',
  });

  await logAudit({
    action: 'expense_paid',
    performedBy: req.user._id,
    targetModel: 'ExpenseRequest',
    targetId: expense._id,
    details: { paymentRef: expense.paymentRef, amount: expense.amount }
  });

  successResponse(res, expense, 'Expense recorded as paid and posted to central ledger');
};
