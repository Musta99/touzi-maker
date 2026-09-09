import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export class ReportGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
  }

  private addHeader(title: string, subtitle?: string) {
    this.doc.setFontSize(20);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text("Touzi Maker", 105, 20, { align: "center" });
    
    this.doc.setFontSize(14);
    this.doc.text(title, 105, 30, { align: "center" });

    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, 105, 38, { align: "center" });
    }
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    const date = new Date().toLocaleDateString();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(`Generated on ${date}`, 14, 290);
      this.doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
    }
  }

  public generateCollectionSummary(projectName: string, data: any[], grandTotal: number) {
    this.addHeader("Collection Summary Report", `Project: ${projectName}`);

    const tableBody = data.map((row, index) => [
      index + 1,
      row.buildingNameEn,
      row.flatsCollected,
      `Tk. ${row.totalCollected.toLocaleString()}`
    ]);

    tableBody.push([
      "", 
      "GRAND TOTAL", 
      "", 
      `Tk. ${grandTotal.toLocaleString()}`
    ]);

    autoTable(this.doc, {
      startY: 50,
      head: [["#", "Building", "Flats Collected", "Total Amount"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244]; // light green
        }
      }
    });

    this.addFooter();
    this.doc.save(`Collection_Summary_${new Date().getTime()}.pdf`);
  }

  public generateBuildingReport(projectName: string, buildingName: string, data: any[]) {
    this.addHeader("Building Detail Report", `Building: ${buildingName} | Project: ${projectName}`);

    const tableBody = data.map((row, index) => [
      index + 1,
      row.floorNameEn,
      row.flatName,
      row.headName,
      row.status,
      row.amount > 0 ? `Tk. ${row.amount.toLocaleString()}` : "-"
    ]);

    autoTable(this.doc, {
      startY: 50,
      head: [["#", "Floor", "Flat", "Family Head", "Status", "Amount"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.cell.raw === "Paid") {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    this.addFooter();
    this.doc.save(`Building_Report_${buildingName.replace(/\s+/g, '_')}.pdf`);
  }

  public async generateBuildingRangeReport(projectName: string, rangeName: string, data: any[]) {
    // ── Group rows by building ────────────────────────────────────────
    const buildingMap = new Map<string, { nameBn: string; nameEn: string; rows: any[] }>();
    for (const row of data) {
      const key = row.buildingNameEn;
      if (!buildingMap.has(key)) {
        buildingMap.set(key, { nameBn: row.buildingNameBn || row.buildingNameEn, nameEn: row.buildingNameEn, rows: [] });
      }
      buildingMap.get(key)!.rows.push(row);
    }

    // ── Compute package summary ───────────────────────────────────────
    const packageSummary = new Map<number, number>();

    // ── Build HTML string ─────────────────────────────────────────────
    let buildingIndex = 1;
    let buildingHtml = "";

    for (const [, building] of buildingMap) {
      let rowsHtml = "";
      let rowIndex = 1;

      for (const row of building.rows) {
        let packages: { amount: number; qty: number }[] = [];
        if (row.tobrukPackages && row.tobrukPackages.length > 0) {
          packages = row.tobrukPackages;
        } else if (row.amount > 0) {
          packages = [{ amount: row.amount, qty: 1 }];
        }
        for (const p of packages) {
          packageSummary.set(p.amount, (packageSummary.get(p.amount) || 0) + p.qty);
        }
        const pkgStr = packages.length > 0 ? packages.map(p => `${p.amount}×${p.qty}`).join("<br/>") : "—";
        const isPaid = row.status === "Paid";
        const isDummy = row.status === "—";

        rowsHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="text-align:center; padding: 10px 5px;">${rowIndex++}</td>
          <td style="padding: 10px 5px;">${row.floorNameBn || row.floorNameEn}</td>
          <td style="padding: 10px 5px;">${row.flatName}</td>
          <td style="padding: 10px 5px;">${row.headName}</td>
          <td style="padding: 10px 5px; font-weight:600; color:${isDummy ? '#6b7280' : (isPaid ? '#16a34a' : '#b45309')}">${isDummy ? '—' : (isPaid ? 'পরিশোধিত' : 'বাকি')}</td>
          <td style="padding: 10px 5px; text-align:right;">৳${row.amount > 0 ? row.amount.toLocaleString() : '—'}</td>
          <td style="padding: 10px 5px; text-align:center;">${pkgStr}</td>
        </tr>`;
      }

      buildingHtml += `
        <div style="margin-bottom:24px">
          <h3 style="color:#166534;font-size:16px;margin:0 0 6px 0;padding:6px 0;border-bottom:2px solid #16a34a">
            ${buildingIndex++}. ${building.nameBn}
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#16a34a;color:white">
                <th style="padding:5px;width:28px;text-align:center">#</th>
                <th style="padding:5px;text-align:left">তলা</th>
                <th style="padding:5px;text-align:left">ফ্ল্যাট</th>
                <th style="padding:5px;text-align:left">পরিবার প্রধান</th>
                <th style="padding:5px;width:70px">স্ট্যাটাস</th>
                <th style="padding:5px;width:60px;text-align:right">পরিমাণ</th>
                <th style="padding:5px;width:90px;text-align:center">প্যাকেজ</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;
    }

    // ── Package summary HTML ──────────────────────────────────────────
    let summaryHtml = "";
    if (packageSummary.size > 0) {
      const sortedEntries = Array.from(packageSummary.entries()).sort((a, b) => a[0] - b[0]);
      let summaryRows = sortedEntries.map(([amt, qty]) => `
        <tr>
          <td style="padding:6px 8px;font-weight:600">৳${amt.toLocaleString()}</td>
          <td style="padding:6px 8px;text-align:center;font-weight:600">${qty} পিস</td>
          <td style="padding:6px 8px;text-align:right;font-weight:600">৳${(amt * qty).toLocaleString()}</td>
        </tr>`).join("");

      summaryHtml = `
        <div style="margin-top:32px;page-break-inside:avoid">
          <h3 style="color:#92400e;font-size:15px;margin:0 0 6px 0;padding:6px 0;border-bottom:2px solid #f59e0b">
            প্যাকেজ সারসংক্ষেপ
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f59e0b;color:white">
                <th style="padding:6px 8px;text-align:left">প্যাকেজ সাইজ</th>
                <th style="padding:6px 8px;text-align:center">মোট পরিমাণ</th>
                <th style="padding:6px 8px;text-align:right">মোট মূল্য</th>
              </tr>
            </thead>
            <tbody>${summaryRows}</tbody>
          </table>
        </div>`;
    }

    const date = new Date().toLocaleDateString("bn-BD");

    const fullHtml = `
      <div style="font-family:'Noto Sans Bengali','SolaimanLipi','Hind Siliguri',sans-serif;
                  width:794px;padding:40px;background:white;color:#1f2937;box-sizing:border-box">
        <h1 style="text-align:center;font-size:22px;margin:0 0 4px 0">ভাড়াটিয়ার তালিকা</h1>
        <h2 style="text-align:center;font-size:15px;margin:0 0 4px 0;font-weight:500">Building Range Detail Report</h2>
        <p style="text-align:center;font-size:11px;color:#6b7280;margin:0 0 24px 0">
          রেঞ্জ: ${rangeName} | প্রকল্প: ${projectName} | তারিখ: ${date}
        </p>
        ${buildingHtml}
        ${summaryHtml}
      </div>`;

    // ── Render HTML with html2canvas → PDF ───────────────────────────
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.innerHTML = fullHtml;
    document.body.appendChild(container);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
      });

      const PDF_WIDTH_MM = 210;
      const PDF_HEIGHT_MM = 297;
      const pageHeightPx = Math.floor((PDF_HEIGHT_MM / PDF_WIDTH_MM) * canvas.width);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let yOffset = 0;
      let isFirstPage = true;

      while (yOffset < canvas.height) {
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        const sliceHeight = Math.min(pageHeightPx, canvas.height - yOffset);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const sliceDataUrl = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const sliceHeightMm = (sliceHeight / canvas.height) * (canvas.height / pageHeightPx) * PDF_HEIGHT_MM;
        pdf.addImage(sliceDataUrl, "JPEG", 0, 0, PDF_WIDTH_MM, Math.min(PDF_HEIGHT_MM, sliceHeightMm));

        yOffset += pageHeightPx;
      }

      pdf.save(`Building_Range_Report_${rangeName.replace(/\s+/g, "_")}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }

  public generateReceipt(data: any) {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    this.doc.setFontSize(22);
    this.doc.setTextColor(34, 197, 94); // Primary green
    this.doc.text("Touzi Maker", 74, 25, { align: "center" });
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text("OFFICIAL RECEIPT", 74, 35, { align: "center" });

    this.doc.setLineWidth(0.5);
    this.doc.line(15, 42, 133, 42);

    this.doc.setFontSize(11);
    this.doc.text(`Receipt ID: ${data.id.substring(0, 8).toUpperCase()}`, 15, 52);
    this.doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 133, 52, { align: "right" });

    this.doc.setFontSize(12);
    this.doc.text("Received With Thanks From:", 15, 67);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(data.headName || "N/A", 15, 75);

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Building: ${data.buildingNameEn}`, 15, 85);
    this.doc.text(`Flat: ${data.floorNameEn} - ${data.flatName}`, 15, 93);

    this.doc.setLineWidth(0.2);
    this.doc.line(15, 100, 133, 100);

    this.doc.setFontSize(14);
    this.doc.text("Amount Received:", 15, 115);
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(34, 197, 94);
    this.doc.text(`Tk. ${data.amount.toLocaleString()}`, 133, 115, { align: "right" });

    this.doc.setTextColor(40, 40, 40);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Collected By: ${data.collectorName}`, 15, 135);

    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text("This is an electronically generated receipt.", 74, 190, { align: "center" });

    this.doc.save(`Receipt_${data.id.substring(0, 8)}.pdf`);
  }
}
