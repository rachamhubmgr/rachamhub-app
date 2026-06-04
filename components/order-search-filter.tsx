"use client";

import React from "react";

interface Props {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  merchantOptions?: string[];
  filterMerchant: string | null;
  onFilterMerchantChange: (v: string | null) => void;
}

export default function OrderSearchFilter({
  searchTerm,
  onSearchTermChange,
  merchantOptions = [],
  filterMerchant,
  onFilterMerchantChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <h1 className="text-lg font-semibold text-foreground w-full md:w-auto">
        Search & Filter
      </h1>
      <input
        aria-label="Search orders"
        placeholder="Search by customer, address, order id or merchant"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="rounded-md border border-input px-3 py-2 text-sm w-full max-w-md"
      />
      {merchantOptions.length > 0 && (
        <select
          value={filterMerchant ?? ""}
          onChange={(e) =>
            onFilterMerchantChange(e.target.value ? e.target.value : null)
          }
          className="rounded-md border border-input px-3 py-2 text-sm"
        >
          <option value="">All merchants</option>
          {merchantOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
