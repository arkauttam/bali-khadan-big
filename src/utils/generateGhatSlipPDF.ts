import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface SlipData {
  slNo: number;
  dateTime: string;
  carNumber: string;
  name: string;
  phoneNumber: string;
  location: string;
  wheels: number;
  cft: number;
  cost: number;
  cash: number;
  upi: number;
  remark: string;
  branch?: string;
}

const PRIMARY_COLOR = "#1E40AF";
const SECONDARY_COLOR = "#64748B";
const ACCENT_COLOR = "#059669";
const BACKGROUND_COLOR = "#F8FAFC";

export const generateGhatSlipPDF = async (
  data: SlipData,
  copies: number = 2
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  const qrValue = JSON.stringify({
    sl: data.slNo,
    car: data.carNumber,
    amount: data.cost,
    date: data.dateTime,
    name: data.name,
  });

  const qrBase64 = await QRCode.toDataURL(qrValue, {
    margin: 1,
    width: 300,
    color: {
      dark: PRIMARY_COLOR,
      light: "#FFFFFF"
    }
  });

  for (let i = 0; i < copies; i++) {
    if (i > 0) doc.addPage();

    // Background tint
    doc.setFillColor(BACKGROUND_COLOR);
    doc.rect(0, 0, 148, 210, "F");

    // Header section with colored band
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(0, 0, 148, 20, "F");
    
    // Logo/Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("GHAT MATERIAL", 74, 10, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("TRANSPORT RECEIPT", 74, 15, { align: "center" });

    // QR Code in top-right position (moved up)
    doc.addImage(qrBase64, "PNG", 115, 5, 20, 20);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text("Scan to verify", 125, 27, { align: "center" });

    let y = 30;

    // Receipt ID and Date section - Changed "Receipt #" to "SL #"
    doc.setTextColor(SECONDARY_COLOR);
    doc.setFontSize(9);
    doc.text(`SL #${data.slNo}`, 15, y);
    doc.text(`Date: ${formatDate(data.dateTime)}`, 15, y + 4);
    doc.text(`Time: ${formatTime(data.dateTime)}`, 15, y + 8);
    
    // Status badge
    doc.setFillColor(ACCENT_COLOR);
    doc.roundedRect(110, y - 2, 28, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("PAID", 124, y + 3, { align: "center" });

    y += 18;

    // Vehicle Card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, y, 124, 30, 4, 4, "F");
    doc.setDrawColor(225, 225, 225);
    doc.roundedRect(12, y, 124, 30, 4, 4, "S");
    
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("VEHICLE DETAILS", 20, y + 7);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("courier", "bold");
    doc.text(data.carNumber, 20, y + 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(SECONDARY_COLOR);
    doc.text(`Wheels: ${data.wheels} • Capacity: ${data.cft} CFT`, 20, y + 26);

    y += 40;

    // Two-column layout for Party Details
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, y, 60, 40, 4, 4, "F");
    doc.roundedRect(76, y, 60, 40, 4, 4, "F");
    doc.setDrawColor(225, 225, 225);
    doc.roundedRect(12, y, 60, 40, 4, 4, "S");
    doc.roundedRect(76, y, 60, 40, 4, 4, "S");

    // Party Details Column
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PARTY DETAILS", 20, y + 7);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Name:", 16, y + 16);
    doc.text("Phone:", 16, y + 23);
    doc.text("Location:", 16, y + 30);
    
    doc.setFont("helvetica", "normal");
    doc.text(data.name, 34, y + 16);
    doc.text(data.phoneNumber, 34, y + 23);
    doc.text(data.location, 34, y + 30);

    // Payment Details Column - Updated amount formatting with superscript Rupee symbol
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT DETAILS", 82, y + 7);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 80, y + 16);
    doc.text("Paid via Cash:", 80, y + 23);
    doc.text("Paid via UPI:", 80, y + 30);
    doc.text("Balance:", 80, y + 37);
    
    doc.setFont("helvetica", "normal");
    
    // Display amount with superscript Rupee symbol (¹)
    const formattedAmount = formatAmountWithSuperscriptRupee(data.cost);
    
    // Draw superscript Rupee symbol and amount
    doc.setTextColor(ACCENT_COLOR);
    doc.setFontSize(8);
    doc.text("¹", 115, y + 16);
    doc.setFontSize(10);
    doc.text(data.cost.toLocaleString(), 117.5, y + 16);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    // Format cash amount with superscript Rupee
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text("¹", 115, y + 23);
    doc.setFontSize(9);
    doc.text(data.cash.toLocaleString(), 117.5, y + 23, { align: "right" });
    
    // Format UPI amount with superscript Rupee
    doc.setFontSize(8);
    doc.text("¹", 115, y + 30);
    doc.setFontSize(9);
    doc.text(data.upi.toLocaleString(), 117.5, y + 30, { align: "right" });
    
    const balance = data.cost - (data.cash + data.upi);
    doc.setTextColor(balance > 0 ? "#DC2626" : ACCENT_COLOR);
    
    // Format balance amount with superscript Rupee
    doc.setFontSize(8);
    doc.text("¹", 115, y + 37);
    doc.setFontSize(9);
    doc.text(Math.abs(balance).toLocaleString(), 117.5, y + 37, { align: "right" });

    y += 50;

    // Remarks section
    if (data.remark && data.remark.trim() !== "") {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, y, 124, 20, 4, 4, "F");
      doc.setDrawColor(225, 225, 225);
      doc.roundedRect(12, y, 124, 20, 4, 4, "S");
      
      doc.setTextColor(PRIMARY_COLOR);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("REMARKS", 20, y + 7);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(data.remark, 20, y + 14, { maxWidth: 110 });
      y += 25;
    }

    // Footer
    doc.setTextColor(SECONDARY_COLOR);
    doc.setFontSize(7);
    doc.text("Thank you for your business!", 74, 160, { align: "center" });
    
    doc.setFontSize(6);
    doc.text("This is a computer-generated receipt. No signature required.", 74, 165, { align: "center" });
    
    // Footer separator
    doc.setDrawColor(220, 220, 220);
    doc.line(12, 170, 136, 170);
    
    // Signature lines
    doc.setTextColor(SECONDARY_COLOR);
    doc.setFontSize(7);
    doc.text("_______________________", 30, 180);
    doc.text("_______________________", 100, 180);
    
    doc.text("Customer Copy", 30, 185, { align: "center" });
    doc.text("Office Copy", 100, 185, { align: "center" });
    
    // Page indicator (if multiple copies)
    if (copies > 1) {
      doc.setFontSize(6);
      doc.text(`Copy ${i + 1} of ${copies}`, 74, 195, { align: "center" });
    }
  }

  /* ===== AUTO PRINT ===== */
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};

/* ========= HELPERS ========= */
const formatAmountWithSuperscriptRupee = (amount: number): string => {
  // This function formats the amount with superscript rupee symbol
  // The actual drawing is handled in the main function with separate text calls
  return `¹${amount.toLocaleString()}`;
};

const formatDate = (dt: string) => {
  const date = new Date(dt);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (dt: string) => {
  const date = new Date(dt);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};