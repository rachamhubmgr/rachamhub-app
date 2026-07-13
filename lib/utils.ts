import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Order } from "@/lib/types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "./supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateDisplay(input: Date) {
  return new Date(input).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const getOrders = async (startDate?: Date, endDate?: Date) => {
  let query = supabase!.from("orders").select("*");

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte("created_at", end.toISOString());
  }

  const { data, error: fetchError } = await query.order("created_at", {
    ascending: false,
  });

  return { data, fetchError };
};

export const prepareExportData = (
  orders: Order[],
  fomUsers: any[] = [],
  ccUsers: any[] = [],
) => {
  const headers = [
    "Order ID",
    "Created At",
    "Customer Name",
    "Phone Numbers",
    "Delivery Address",
    "Items",
    "Total Amount",
    "Merchant",
    "WH Status",
    "Inventory Status",
    "FOM Assigned",
    "FOM Assigned At",
    "Rider Name",
    "Rider Price",
    "Rider Assigned At",
    "FOM Status",
    "Landmark",
    "Payment Method",
    "Bank",
    "Quantity Delivered",
    "Amount Paid",
    "Payment Confirmed",
    "Payment Confirmed At",
    "Payment To Merchant",
    "CC Note",
    "WH Note",
    "FOM Note",
    "Entered By",
  ];

  const rows = orders.map((order) => {
    const fomUser = fomUsers.find((u) => u.id === (order as any).fom_assigned);
    const ccUser = ccUsers.find((u) => u.id === order.extracted_by);
    const riderPrice = Number((order as any).payment_to_rider || 0);
    const total = Number(order.total_amount || 0);

    return [
      `${order.id.split("-")[0]}`,
      formatDateDisplay(new Date(order.created_at)),
      order.customer_name || "",
      Array.isArray(order.phone_numbers) ? order.phone_numbers.join(", ") : "",
      order.delivery_address || "",
      order.items?.map((i) => `${i.quantity}x ${i.name}`).join("; ") || "",
      total.toFixed(2),
      order.merchant || "",
      (order as any).warehouse_status || "",
      order.inventory_status || "",
      fomUser?.display_name || "",
      formatDateDisplay(new Date(order.fom_assigned_at)),
      (order as any).rider_name || "",
      riderPrice.toFixed(2),
      formatDateDisplay(new Date(order.rider_assigned_at)),
      order.fom_delivery_status || "",
      (order as any).landmark || "",
      (order as any).payment_method || "",
      (order as any).bank || "",
      (order as any).quantity_delivered || "",
      (order as any).amount_paid || "",
      (order as any).payment_confirmed ? "Yes" : "No",
      formatDateDisplay(new Date(order.payment_verified_at)),
      order.payment_to_merchant || "",
      (order as any).cc_comment || "",
      (order as any).warehouse_comment || "",
      (order as any).fom_comment || "",
      ccUser?.display_name || "",
    ];
  });

  return { headers, rows };
};

export const buildCsv = (
  orders: Order[],
  fomUsers: any[] = [],
  ccUsers: any[] = [],
) => {
  const { headers, rows } = prepareExportData(orders, fomUsers, ccUsers);
  const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeValue(String(value))).join(","))
    .join("\n");
};

export const handleExport = async (
  fomUsers: any[] = [],
  ccUsers: any[] = [],
  type: "csv" | "xlsx" = "csv",
  startDate?: Date,
  endDate?: Date,
) => {
  const { data: orders } = await getOrders(startDate, endDate);
  if (type === "xlsx") {
    const { headers, rows } = prepareExportData(orders!, fomUsers, ccUsers);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(
      workbook,
      `rachamhub-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    return;
  }

  const csv = buildCsv(orders!, fomUsers, ccUsers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rachamhub-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printTicket = (order: Order) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });
  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const ticketId = order.id.split("-")[0].toUpperCase();
  let cursorY = 16;

  pdf.setProperties({ title: `Order Ticket - ${ticketId}` });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("RACHAMHUB LIMITED TICKET", pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 8;
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(11);
  pdf.text("* Call before going *", pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 10;

  const addField = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`${label}:`, margin, cursorY);
    const valueX = margin + pdf.getTextWidth(`${label}: `);
    const lines = pdf.splitTextToSize(value, pageWidth - margin - valueX);
    pdf.setFont("helvetica", "normal");
    pdf.text(lines, valueX, cursorY);
    cursorY += Math.max(6, lines.length * 5) + 1;
  };

  addField("Customer", order.customer_name || "-");
  addField("Phone", order.phone_numbers?.join(", ") || "-");
  addField("Address", order.delivery_address || "-");
  addField("Order ID", `#${ticketId}`);
  addField("Merchant", order.merchant || "-");

  autoTable(pdf, {
    startY: cursorY + 2,
    head: [["Product Name", "Qty"]],
    body: order.items?.map((item) => [item.name, String(item.quantity)]) || [],
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    columnStyles: { 1: { halign: "center", cellWidth: 20 } },
  });
  const tableEndY = (pdf as jsPDF & {
    lastAutoTable: { finalY: number };
  }).lastAutoTable.finalY;
  cursorY = tableEndY + 9;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(
    `Total Amount: ₦${Number(order.total_amount || 0).toLocaleString()}`,
    pageWidth - margin,
    cursorY,
    { align: "right" },
  );
  cursorY += 9;
  addField("Comment", order.cc_comment || "-");

  pdf.save(`rachamhub-order-ticket-${ticketId}.pdf`);
};
