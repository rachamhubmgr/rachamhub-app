import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Order } from "@/lib/types";
import * as XLSX from "xlsx";
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
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const itemsHtml =
    order.items
      ?.map(
        (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `,
      )
      .join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Order Ticket - ${order.id.split("-")[0]}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
          .ticket { border: 2px solid #000; padding: 20px; max-width: 500px; margin: auto; }
          h1 { text-align: center; margin-top: 0; font-size: 1.4rem; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .call { text-align: center; font-size: 1.1rem; margin: 10px 0; font-style: italic; color: #555; }
          .field { margin-bottom: 10px; font-size: 1rem; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { border-bottom: 2px solid #000; text-align: left; padding: 8px; }
          .total { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; font-size: 1.2rem; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>RACHAMHUB LIMITED TICKET</h1>
          <h2 class="call">* Call before going *</h2>
          <div class="field"><span class="label">Customer:</span> ${order.customer_name}</div>
          <div class="field"><span class="label">Phone:</span> ${order.phone_numbers?.join(", ") || "-"}</div>
          <div class="field"><span class="label">Address:</span> ${order.delivery_address}</div>
          <div class="field"><span class="label">Order ID:</span> #${order.id.split("-")[0].toUpperCase()}</div>
          
          <table>
            <thead>
              <tr><th>Product Name</th><th style="text-align:center">Qty</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="total">Total Amount: ₦${Number(order.total_amount).toLocaleString()}</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
