const Receipt = require('../models/Receipt');
const Fund = require('../models/Fund');
const { generateReceiptPDF } = require('../utils/receiptGenerator');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const { denyIfCrossTenant } = require('../middleware/scope');

exports.getReceipts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  let query = {};
  if (req.user.role !== 'admin') {
    const matchingFundIds = await Fund.find({ associationId: req.user.associationId }).distinct('_id');
    query.fundId = { $in: matchingFundIds };
  }

  const total = await Receipt.countDocuments(query);
  const receipts = await Receipt.find(query)
    .populate('fundId', 'category amount description associationId')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, receipts, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).populate('fundId');
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  if (receipt.fundId?.associationId && denyIfCrossTenant(receipt.fundId.associationId, req.user, res)) {
    return;
  }
  successResponse(res, receipt);
};

exports.downloadReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).populate('fundId');
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  if (receipt.fundId?.associationId && denyIfCrossTenant(receipt.fundId.associationId, req.user, res)) {
    return;
  }
  if (receipt.pdfUrl) {
    return res.redirect(receipt.pdfUrl);
  }
  // Regenerate PDF
  const pdfBuffer = await generateReceiptPDF({
    receiptNumber: receipt.receiptNumber,
    issuedTo: receipt.issuedTo,
    amount: receipt.amount,
    date: receipt.date,
    description: receipt.description,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${receipt.receiptNumber}.pdf`);
  res.send(pdfBuffer);
};
