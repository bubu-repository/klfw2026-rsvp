import { NextResponse } from "next/server";
import { listGuests } from "@/lib/db";
import QRCode from "qrcode";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pwd = url.searchParams.get("password");

  if (pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guests = await listGuests();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("KLFW 2026 Guests");

    // Setup columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Company", key: "company", width: 20 },
      { header: "Title", key: "title", width: 12 },
      { header: "Category", key: "category", width: 10 },
      { header: "After Party", key: "after_party", width: 12 },
      { header: "Ticket Code", key: "ticket_code", width: 12 },
      { header: "QR Code", key: "qr_code", width: 25 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1d2bf0" },
    };

    // Add guest rows
    for (let idx = 0; idx < guests.length; idx++) {
      const guest = guests[idx];
      const row = worksheet.addRow({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        company: guest.company,
        title: guest.title,
        category: guest.category === "vip" ? "VIP" : "Regular",
        after_party: guest.attending_after_party ? "Yes" : "No",
        ticket_code: guest.ticket_hash.slice(0, 8).toUpperCase(),
      });

      // Add QR code image: from database or generate on-the-fly
      let qrBuffer = guest.qr_code;
      if (!qrBuffer || qrBuffer.length === 0) {
        // Generate QR on-the-fly for guests without stored QR (legacy)
        const qrUrl = `${process.env.APP_URL}/ticket/${guest.ticket_hash}`;
        qrBuffer = await QRCode.toBuffer(qrUrl, { margin: 4, width: 400 });
      }

      if (qrBuffer && qrBuffer.length > 0) {
        const imageId = workbook.addImage({
          buffer: qrBuffer as any,
          extension: "png",
        });
        worksheet.addImage(imageId, {
          tl: { col: 8, row: idx + 1 },
          ext: { width: 80, height: 80 },
        });
        row.height = 85;
      }
    }

    // Adjust row heights for header
    worksheet.getRow(1).height = 25;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="klfw_2026_guests.xlsx"',
      },
    });
  } catch (err) {
    console.error("[api/admin/export-guests]", err);
    return NextResponse.json(
      { error: "Failed to export guests" },
      { status: 500 }
    );
  }
}
