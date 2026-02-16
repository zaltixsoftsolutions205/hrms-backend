const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const generatePayslipPDF = (payslipData) => {
  return new Promise((resolve, reject) => {
    try {
      const { employee, month, year, basicSalary, allowances, deductions, grossSalary, netSalary, workingDays, presentDays, periodStart, periodEnd } = payslipData;

      // Format pay period label  e.g. "25 Dec 2025 – 24 Jan 2026"
      const fmtDate = (d) => { if (!d) return ''; const [y, m, day] = d.split('-'); return `${parseInt(day)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y}`; };
      const periodLabel = periodStart && periodEnd ? `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}` : `${monthNames[month - 1]} ${year}`;

      const uploadsDir = path.join(__dirname, '../uploads/payslips');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const filename = `payslip_${employee.employeeId}_${month}_${year}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ── Header with Zaltix branding ──
      doc.rect(0, 0, 595, 100).fill('#4C1D95');

      // Logo on white background
      const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
      doc.roundedRect(46, 12, 166, 56, 8).fill('#ffffff');
      doc.image(logoPath, 52, 17, { width: 154 });

      // Payslip subtitle
      doc.fillColor('#c4b5fd').fontSize(11).font('Helvetica').text('Payslip', 228, 43);

      // Period
      doc.fillColor('#F59E0B').fontSize(14).font('Helvetica-Bold').text(`${monthNames[month - 1]} ${year}`, 400, 30, { align: 'right', width: 145 });
      doc.fillColor('#c4b5fd').fontSize(9).font('Helvetica').text('Salary Statement', 400, 50, { align: 'right', width: 145 });

      // ── Employee Information ──
      doc.fillColor('#4C1D95').fontSize(12).font('Helvetica-Bold').text('Employee Information', 50, 118);
      doc.moveTo(50, 134).lineTo(545, 134).strokeColor('#7C3AED').lineWidth(1).stroke();

      const col1 = 50, col2 = 180, col3 = 320, col4 = 450;
      let infoY = 146;

      const infoRow = (label1, value1, label2, value2, y) => {
        doc.fillColor('#666666').fontSize(9).font('Helvetica').text(label1, col1, y);
        doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold').text(value1, col2, y);
        doc.fillColor('#666666').fontSize(9).font('Helvetica').text(label2, col3, y);
        doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica-Bold').text(value2, col4, y);
      };

      infoRow('Employee Name', employee.name, 'Employee ID', employee.employeeId, infoY);
      infoRow('Designation', employee.designation || 'N/A', 'Department', employee.department?.name || 'N/A', infoY + 22);
      infoRow('Working Days', String(workingDays || 0), 'Present Days', String(presentDays || 0), infoY + 44);
      infoRow('Pay Period', periodLabel, '', '', infoY + 66);

      // ── Earnings & Deductions side-by-side ──
      const tableY = 278;

      // Earnings header
      doc.rect(50, tableY, 240, 26).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(10).font('Helvetica-Bold').text('EARNINGS', 60, tableY + 7);
      doc.text('Amount (\u20B9)', 190, tableY + 7, { align: 'right', width: 90 });

      // Deductions header
      doc.rect(305, tableY, 240, 26).fill('#EDE9FE');
      doc.fillColor('#4C1D95').fontSize(10).font('Helvetica-Bold').text('DEDUCTIONS', 315, tableY + 7);
      doc.text('Amount (\u20B9)', 445, tableY + 7, { align: 'right', width: 90 });

      // Earnings rows
      let earnY = tableY + 34;
      doc.fillColor('#333333').fontSize(9).font('Helvetica');

      doc.text('Basic Salary (Pro-rated)', 60, earnY);
      doc.text(fmt(basicSalary), 190, earnY, { align: 'right', width: 90 });
      earnY += 18;

      let totalAllowances = 0;
      (allowances || []).forEach(a => {
        doc.text(a.name, 60, earnY);
        doc.text(fmt(a.amount), 190, earnY, { align: 'right', width: 90 });
        totalAllowances += (a.amount || 0);
        earnY += 18;
      });

      // Earnings total line
      earnY += 4;
      doc.moveTo(50, earnY).lineTo(290, earnY).strokeColor('#DDD6FE').lineWidth(0.5).stroke();
      earnY += 6;
      doc.fillColor('#4C1D95').font('Helvetica-Bold').text('Total Earnings', 60, earnY);
      doc.text(fmt(grossSalary), 190, earnY, { align: 'right', width: 90 });

      // Deductions rows
      let dedY = tableY + 34;
      let totalDeductions = 0;
      doc.fillColor('#333333').fontSize(9).font('Helvetica');

      (deductions || []).forEach(d => {
        doc.text(d.name, 315, dedY);
        doc.text(fmt(d.amount), 445, dedY, { align: 'right', width: 90 });
        totalDeductions += (d.amount || 0);
        dedY += 18;
      });

      // Deductions total line
      dedY += 4;
      doc.moveTo(305, dedY).lineTo(545, dedY).strokeColor('#DDD6FE').lineWidth(0.5).stroke();
      dedY += 6;
      doc.fillColor('#4C1D95').font('Helvetica-Bold').text('Total Deductions', 315, dedY);
      doc.text(fmt(totalDeductions), 445, dedY, { align: 'right', width: 90 });

      // ── Summary bar ──
      const summaryY = Math.max(earnY, dedY) + 24;
      doc.rect(50, summaryY, 495, 30).fill('#FEF3C7');
      doc.fillColor('#4C1D95').fontSize(10).font('Helvetica-Bold');
      doc.text('Gross Salary', 60, summaryY + 9);
      doc.text(`\u20B9 ${fmt(grossSalary)}`, 160, summaryY + 9, { width: 100 });
      doc.text('Total Deductions', 315, summaryY + 9);
      doc.text(`\u20B9 ${fmt(totalDeductions)}`, 445, summaryY + 9, { align: 'right', width: 90 });

      // ── Net Pay bar ──
      const netY = summaryY + 44;
      doc.rect(50, netY, 495, 44).fill('#4C1D95');
      doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('NET PAY', 60, netY + 14);
      doc.fillColor('#F59E0B').fontSize(20).font('Helvetica-Bold').text(`\u20B9 ${fmt(netSalary)}`, 200, netY + 10, { align: 'right', width: 280 });

      // ── Footer ──
      const footerY = netY + 65;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#DDD6FE').lineWidth(0.5).stroke();
      doc.fillColor('#999999').fontSize(8).font('Helvetica')
        .text('This is a computer-generated payslip by Zaltix Soft Solutions and does not require a signature.', 50, footerY + 8, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => resolve(`/uploads/payslips/${filename}`));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generatePayslipPDF;
