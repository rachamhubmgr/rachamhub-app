import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Order } from "@/lib/types";
import * as XLSX from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateDisplay(input: Date) {
  return new Date(input).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

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
    "Merchant",
    "Items",
    "Total Amount",
    "Delivery Address",
    "WH Status",
    "FOM Status",
    "Inventory Status",
    "FOM Assigned",
    "FOM Assigned At",
    "Rider Name",
    "Rider Price",
    "Rider Assigned At",
    "Landmark",
    "Payment Method",
    "Bank",
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
      order.merchant || "",
      order.items?.map((i) => `${i.quantity}x ${i.name}`).join("; ") || "",
      total.toFixed(2),
      order.delivery_address || "",
      order.warehouse_delivery_status || "",
      order.fom_delivery_status || "",
      (order as any).inventory_status || "",
      fomUser?.display_name || "",
      formatDateDisplay(new Date(order.fom_assigned_at)),
      (order as any).rider_name || "",
      riderPrice.toFixed(2),
      formatDateDisplay(new Date(order.rider_assigned_at)),
      (order as any).landmark || "",
      (order as any).payment_method || "",
      (order as any).bank || "",
      (order as any).payment_confirmed ? "Yes" : "No",
      formatDateDisplay(new Date(order.payment_verified_at)),
      (total - riderPrice).toFixed(2),
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

export const handleExport = (
  orders: Order[],
  fomUsers: any[] = [],
  ccUsers: any[] = [],
  type: "csv" | "xlsx" = "csv",
) => {
  if (type === "xlsx") {
    const { headers, rows } = prepareExportData(orders, fomUsers, ccUsers);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(
      workbook,
      `rachamhub-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    return;
  }

  const csv = buildCsv(orders, fomUsers, ccUsers);
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
