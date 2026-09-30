const PDFDocument = require('pdfkit');

const generateReceiptPDF = (receiptData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('SPORTS ASSOCIATION RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Receipt No: ${receiptData.receiptNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Details
    doc.fontSize(12).font('Helvetica-Bold').text('Received From:');
    doc.font('Helvetica').text(receiptData.issuedTo);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Description:');
    doc.font('Helvetica').text(receiptData.description || 'Payment received');
    doc.moveDown();

    // Amount box
    doc.font('Helvetica-Bold').fontSize(14).text(`Amount: Rs. ${receiptData.amount.toFixed(2)}`, { align: 'center' });
    doc.moveDown(2);

    // Footer
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text('Authorized Signature: _________________', { align: 'right' });
    doc.text('Sports Association', { align: 'right' });

    doc.end();
  });
};

module.exports = { generateReceiptPDF };
