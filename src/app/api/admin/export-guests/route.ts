import { NextResponse } from "next/server";
import { listGuests } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import QRCode from "qrcode";
import ExcelJS from "exceljs";

export async function GET() {
  // Reuse the admin login session (cookie) instead of re-prompting for the
  // password: the organizer is already authenticated to reach this button.
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guests = await listGuests();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("KLFW 2026 Guests");

    worksheet.columns = [
      { header: "Name", key: "name", width: 22 },
      { header: "Email", key: "email", width: 26 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Company", key: "company", width: 20 },
      { header: "Title", key: "title", width: 12 },
      { header: "Category", key: "category", width: 10 },
      { header: "After Party", key: "after_party", width: 12 },
      { header: "Ticket Code", key: "ticket_code", width: 14 },
      { header: "QR Code", key: "qr_code", width: 16 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D2BF0" },
    };
    worksheet.getRow(1).height = 26;

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
      row.height = 90;
      row.alignment = { vertical: "middle" };

      // Always generate the QR from the raw ticket_hash: that is exactly what
      // the door scanner decodes. (Do NOT reuse a stored blob that might encode
      // a URL, which would not scan.)
      const qrPng = await QRCode.toBuffer(guest.ticket_hash, {
        width: 300,
        margin: 2,
        color: { dark: "#1D2BF0", light: "#FFFFFF" },
      });
      const imageId = workbook.addImage({
        buffer: qrPng as unknown as ExcelJS.Buffer,
        extension: "png",
      });
      // Float the 84x84 image inside the QR Code cell (column index 8, 0-based).
      worksheet.addImage(imageId, {
        tl: { col: 8.15, row: idx + 1.08 },
        ext: { width: 84, height: 84 },
      });
    }

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
