const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const generatePayslipPDF = (payslipData) => {
  return new Promise((resolve, reject) => {
    try {
      const { employee, month, year, basicSalary, allowances, deductions, grossSalary, netSalary, workingDays, presentDays } = payslipData;

      const uploadsDir = path.join(__dirname, '../uploads/payslips');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `payslip_${employee.employeeId}_${month}_${year}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.rect(0, 0, 595, 90).fill('#4C1D95');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('HRMS SYSTEM', 50, 25);
      doc.fontSize(12).font('Helvetica').text('Payslip', 50, 52);
      doc.fillColor('#F59E0B').fontSize(14).text(`${monthNames[month - 1]} ${year}`, 430, 35, { align: 'right', width: 110 });

      // Employee Info
      doc.fillColor('#4C1D95').fontSize(13).font('Helvetica-Bold').text('Employee Information', 50, 110);
      doc.moveTo(50, 128).lineTo(545, 128).strokeColor('#7C3AED').lineWidth(1).stroke();

      const col1 = 50, col2 = 200, col3 = 320, col4 = 470;
      const infoY = 140;
      doc.fillColor('#555555').fontSize(10).font('Helvetica');
      doc.text('Employee Name', col1, infoY);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(employee.name, col2, infoY);
      doc.fillColor('#555555').font('Helvetica').text('Employee ID', col3, infoY);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(employee.employeeId, col4, infoY);

      doc.fillColor('#555555').font('Helvetica').text('Designation', col1, infoY + 20);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(employee.designation || 'N/A', col2, infoY + 20);
      doc.fillColor('#555555').font('Helvetica').text('Department', col3, infoY + 20);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(employee.department?.name || 'N/A', col4, infoY + 20);

      doc.fillColor('#555555').font('Helvetica').text('Working Days', col1, infoY + 40);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(String(workingDays || 0), col2, infoY + 40);
      doc.fillColor('#555555').font('Helvetica').text('Present Days', col3, infoY + 40);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(String(presentDays || 0), col4, infoY + 40);

      // Earnings
      const tableY = 240;
      doc.rect(50, tableY, 240, 28).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(11).font('Helvetica-Bold').text('EARNINGS', 60, tableY + 8);

      doc.rect(305, tableY, 240, 28).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(11).font('Helvetica-Bold').text('DEDUCTIONS', 315, tableY + 8);

      // Earnings rows
      let earnY = tableY + 35;
      doc.fillColor('#333').fontSize(10).font('Helvetica');
      doc.text('Basic Salary', 60, earnY);
      doc.text(`Rs. ${basicSalary.toLocaleString()}`, 180, earnY, { align: 'right', width: 100 });
      earnY += 20;

      let totalAllowances = 0;
      allowances.forEach(a => {
        doc.text(a.name, 60, earnY);
        doc.text(`Rs. ${a.amount.toLocaleString()}`, 180, earnY, { align: 'right', width: 100 });
        totalAllowances += a.amount;
        earnY += 20;
      });

      // Deductions rows
      let dedY = tableY + 35;
      let totalDeductions = 0;
      deductions.forEach(d => {
        doc.text(d.name, 315, dedY);
        doc.text(`Rs. ${d.amount.toLocaleString()}`, 435, dedY, { align: 'right', width: 100 });
        totalDeductions += d.amount;
        dedY += 20;
      });

      const summaryY = Math.max(earnY, dedY) + 15;
      doc.moveTo(50, summaryY).lineTo(545, summaryY).strokeColor('#DDD6FE').lineWidth(1).stroke();

      // Totals
      doc.rect(50, summaryY + 10, 495, 32).fill('#FEF3C7');
      doc.fillColor('#4C1D95').fontSize(11).font('Helvetica-Bold');
      doc.text('Gross Salary', 60, summaryY + 19);
      doc.text(`Rs. ${grossSalary.toLocaleString()}`, 200, summaryY + 19);
      doc.text('Total Deductions', 305, summaryY + 19);
      doc.text(`Rs. ${totalDeductions.toLocaleString()}`, 440, summaryY + 19, { align: 'right', width: 95 });

      // Net Pay
      const netY = summaryY + 55;
      doc.rect(50, netY, 495, 45).fill('#4C1D95');
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('NET PAY', 60, netY + 14);
      doc.fillColor('#F59E0B').fontSize(18).text(`Rs. ${netSalary.toLocaleString()}`, 200, netY + 10, { align: 'right', width: 280 });

      // Footer
      doc.moveTo(50, netY + 70).lineTo(545, netY + 70).strokeColor('#DDD6FE').lineWidth(1).stroke();
      doc.fillColor('#888').fontSize(9).font('Helvetica').text('This is a computer-generated payslip and does not require a signature.', 50, netY + 80, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => resolve(`/uploads/payslips/${filename}`));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generatePayslipPDF;
