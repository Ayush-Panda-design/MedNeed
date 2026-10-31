import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';
import { generateGstTaxInvoice } from '@/lib/gst';

/**
 * GET /api/orders/[id]/invoice
 * 
 * Generates an official statutory GST Tax Invoice (Form 20/21 compliant)
 * with HSN 3004, CGST/SGST/IGST tax values, Pharmacy Drug Licenses,
 * and Registered Dispensing Pharmacist sign-off.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Zero-Trust Authentication
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access statutory tax invoices' },
        { status: 401 }
      );
    }

    const { userId, isStaff } = authResult.auth;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'Database connection string not configured' },
        { status: 500 }
      );
    }

    // 2. Fetch order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: `Order #${orderId} not found` }, { status: 404 });
    }

    // Security: Only order owner or authorized pharmacy staff can access tax invoice
    if (order.userId !== userId && !isStaff) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You do not have permission to view this invoice' },
        { status: 403 }
      );
    }

    // 3. Generate Complete Statutory Tax Invoice
    const invoice = await generateGstTaxInvoice(order);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // 4. Return HTML Printable Format if requested
    if (format === 'html') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber} - MedNeed Pharmacy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      background: #f8fafc;
      font-size: 12px;
      line-height: 1.4;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .header-table, .info-table, .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .header-table td {
      vertical-align: top;
    }
    .pharmacy-title {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .licenses-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      margin-top: 6px;
    }
    .tax-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 16px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .items-table {
      margin-top: 12px;
      font-size: 11px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .items-table td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .total-row td {
      font-weight: 700;
      background: #f8fafc;
    }
    .grand-total {
      font-size: 14px;
      font-weight: 900;
      color: #047857;
      background: #ecfdf5 !important;
    }
    .sign-section {
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sign-box {
      border-top: 1px solid #64748b;
      width: 240px;
      text-align: center;
      padding-top: 6px;
      font-size: 11px;
    }
    .no-print {
      margin-bottom: 16px;
      text-align: right;
    }
    .print-btn {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; padding: 0; width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 820px; margin: 0 auto 12px auto;">
    <button class="print-btn" onclick="window.print()">🖨️ Print Tax Invoice</button>
  </div>

  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="width: 60%;">
          <div class="pharmacy-title">${invoice.pharmacy.pharmacyLegalName}</div>
          <div style="font-size: 11px; color: #475569;">${invoice.pharmacy.tradeName}</div>
          <div>${invoice.pharmacy.registeredAddress}</div>
          <div>${invoice.pharmacy.city}, ${invoice.pharmacy.state} - ${invoice.pharmacy.pincode}</div>
          <div>Phone: ${invoice.pharmacy.contactPhone} | Email: ${invoice.pharmacy.contactEmail}</div>
          <div class="licenses-box">
            <strong>GSTIN:</strong> ${invoice.pharmacy.gstin} | <strong>PAN:</strong> ${invoice.pharmacy.pan}<br>
            <strong>Drug License (20B):</strong> ${invoice.pharmacy.drugLicense20B}<br>
            <strong>Drug License (21B):</strong> ${invoice.pharmacy.drugLicense21B}<br>
            <strong>FSSAI License:</strong> ${invoice.pharmacy.fssaiLicense}
          </div>
        </td>
        <td style="width: 40%; text-align: right;">
          <div class="tax-badge">TAX INVOICE</div>
          <div style="margin-top: 8px;">
            <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Invoice Date:</strong> ${invoice.invoiceDate}</div>
            <div><strong>Order ID:</strong> #${invoice.orderId}</div>
            <div><strong>Payment Mode:</strong> ${invoice.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Online'}</div>
            <div><strong>Payment Status:</strong> ${invoice.paymentStatus}</div>
            <div><strong>Place of Supply:</strong> ${invoice.placeOfSupply}</div>
          </div>
        </td>
      </tr>
    </table>

    <div class="section-title">Billed &amp; Delivered To (Patient / Customer Details)</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">
      <strong>${invoice.customer.name}</strong> (${invoice.customer.phone})<br>
      ${invoice.customer.address}<br>
      PIN Code: ${invoice.customer.pincode} | State: ${invoice.customer.state} (Code: ${invoice.customer.stateCode})
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 30px;">#</th>
          <th>Description of Goods / Services</th>
          <th class="text-center">HSN/SAC</th>
          <th class="text-center">Batch</th>
          <th class="text-center">Qty</th>
          <th class="text-right">MRP (₹)</th>
          <th class="text-right">Unit Price (₹)</th>
          <th class="text-right">Taxable (₹)</th>
          ${invoice.isInterState ? `
            <th class="text-right">IGST (%)</th>
            <th class="text-right">IGST (₹)</th>
          ` : `
            <th class="text-right">CGST (%)</th>
            <th class="text-right">CGST (₹)</th>
            <th class="text-right">SGST (%)</th>
            <th class="text-right">SGST (₹)</th>
          `}
          <th class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((it) => `
          <tr>
            <td class="text-center">${it.slNo}</td>
            <td><strong>${it.title}</strong></td>
            <td class="text-center">${it.hsnCode}</td>
            <td class="text-center" style="font-family: monospace;">${it.batchNumber}</td>
            <td class="text-center">${it.quantity}</td>
            <td class="text-right">${it.mrp.toFixed(2)}</td>
            <td class="text-right">${it.unitPrice.toFixed(2)}</td>
            <td class="text-right">${it.taxableValue.toFixed(2)}</td>
            ${invoice.isInterState ? `
              <td class="text-right">${(it.igstRate * 100).toFixed(0)}%</td>
              <td class="text-right">${it.igstAmount.toFixed(2)}</td>
            ` : `
              <td class="text-right">${(it.cgstRate * 100).toFixed(0)}%</td>
              <td class="text-right">${it.cgstAmount.toFixed(2)}</td>
              <td class="text-right">${(it.sgstRate * 100).toFixed(0)}%</td>
              <td class="text-right">${it.sgstAmount.toFixed(2)}</td>
            `}
            <td class="text-right font-bold">${it.lineTotal.toFixed(2)}</td>
          </tr>
        `).join('')}

        <tr class="total-row">
          <td colspan="7" class="text-right">Subtotal (Item Taxable Value):</td>
          <td class="text-right">₹${invoice.totals.totalTaxableValue.toFixed(2)}</td>
          ${invoice.isInterState ? `
            <td></td>
            <td class="text-right">₹${invoice.totals.totalIgst.toFixed(2)}</td>
          ` : `
            <td></td>
            <td class="text-right">₹${invoice.totals.totalCgst.toFixed(2)}</td>
            <td></td>
            <td class="text-right">₹${invoice.totals.totalSgst.toFixed(2)}</td>
          `}
          <td class="text-right">₹${(invoice.totals.roundedFinalTotal - invoice.totals.deliveryFee).toFixed(2)}</td>
        </tr>

        ${invoice.totals.deliveryFee > 0 ? `
          <tr>
            <td colspan="${invoice.isInterState ? 10 : 12}" class="text-right">Express Local Delivery Fee (5-10km):</td>
            <td class="text-right font-bold">₹${invoice.totals.deliveryFee.toFixed(2)}</td>
          </tr>
        ` : ''}

        ${invoice.totals.discountSavings > 0 ? `
          <tr style="color: #047857;">
            <td colspan="${invoice.isInterState ? 10 : 12}" class="text-right font-bold">Total Customer Savings on MRP:</td>
            <td class="text-right font-bold">-₹${invoice.totals.discountSavings.toFixed(2)}</td>
          </tr>
        ` : ''}

        <tr class="grand-total">
          <td colspan="${invoice.isInterState ? 10 : 12}" class="text-right font-bold">Grand Invoice Total (INR):</td>
          <td class="text-right font-bold">₹${invoice.totals.roundedFinalTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 14px; font-size: 10px; color: #64748b; line-height: 1.5;">
      <strong>Statutory Declarations &amp; Returns Policy:</strong><br>
      1. Certified that all medicines supplied under this tax invoice have been procured from licensed manufacturers/distributors and stored strictly under required temperature and humidity conditions.<br>
      2. As per Drugs and Cosmetics Rules, Schedule H/H1 medicines have been verified by a Registered Pharmacist prior to dispensation.<br>
      3. Temperature-sensitive cold chain items must be refrigerated between 2°C to 8°C immediately upon delivery.
    </div>

    <div class="sign-section">
      <div style="font-size: 11px;">
        <strong>Dispensed &amp; Verified by Registered Pharmacist:</strong><br>
        Name: <strong>${invoice.dispensingPharmacist.name}</strong><br>
        Registration No: <strong>${invoice.dispensingPharmacist.registrationNumber}</strong><br>
        Council: <em>${invoice.dispensingPharmacist.council}</em>
      </div>

      <div class="sign-box">
        For <strong>${invoice.pharmacy.pharmacyLegalName}</strong><br><br>
        <strong>Authorized Signatory / Registered Pharmacist</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
