"use client";

import React, { useEffect, useState } from "react";
import { FileBox, ChevronDown } from "lucide-react";

interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; total: number; }
interface Invoice {
  id: string; invoiceNumber: string; subtotal: number; tax: number; total: number;
  amountPaid: number; status: string; dueDate: string | null; notes: string | null;
  createdAt: string;
  reseller: { storeName: string; user: { name: string } };
  client: { name: string; email: string | null; phone: string | null } | null;
  items: InvoiceItem[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700", confirmed: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700", cancelled: "bg-red-100 text-red-700",
};

export default function ResellerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/admin/reseller-invoices${params}`).then(r => r.json()).then(setInvoices).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <FileBox className="w-6 h-6 text-accent" /> Reseller Invoices
        </h1>
        <p className="text-text-muted text-sm">View all reseller invoices — paid/confirmed invoices need product delivery</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["all", "draft", "sent", "confirmed", "paid", "overdue", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === s ? "bg-accent text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <FileBox className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No reseller invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const needsDelivery = ["paid", "confirmed"].includes(inv.status);
            return (
              <div key={inv.id} className={`bg-white rounded-xl border overflow-hidden ${needsDelivery ? "border-green-300" : "border-border"}`}>
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-bold text-text text-sm">{inv.invoiceNumber}</p>
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[inv.status] || ""}`}>
                        {inv.status}
                      </span>
                      {needsDelivery && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                          NEEDS DELIVERY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      Reseller: <strong>{inv.reseller.user.name}</strong> ({inv.reseller.storeName})
                      &bull; Client: {inv.client?.name || "N/A"}
                      &bull; {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-text text-sm">GH₵{inv.total.toFixed(2)}</p>
                    {inv.amountPaid > 0 && <p className="text-xs text-green-600">Paid: GH₵{inv.amountPaid.toFixed(2)}</p>}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedId === inv.id ? "rotate-180" : ""}`} />
                </div>

                {expandedId === inv.id && (
                  <div className="border-t border-border p-4 bg-surface/30">
                    {/* Client Info */}
                    {inv.client && (
                      <div className="bg-white rounded-lg p-3 text-sm mb-4">
                        <p className="text-xs text-text-muted uppercase font-semibold mb-1">Client</p>
                        <p className="font-medium text-text">{inv.client.name}</p>
                        {inv.client.email && <p className="text-text-muted">{inv.client.email}</p>}
                        {inv.client.phone && <p className="text-text-muted">{inv.client.phone}</p>}
                      </div>
                    )}

                    {/* Items Table */}
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-surface">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-text-muted">Description</th>
                            <th className="text-center px-2 py-2 text-xs font-medium text-text-muted w-16">Qty</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-text-muted w-24">Price</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-text-muted w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.items.map(item => (
                            <tr key={item.id} className="border-t border-border">
                              <td className="px-3 py-2 text-text">{item.description}</td>
                              <td className="px-2 py-2 text-center text-text-muted">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-text-muted">GH₵{item.unitPrice.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-medium text-text">GH₵{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>GH₵{inv.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Tax</span><span>GH₵{inv.tax.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>GH₵{inv.total.toFixed(2)}</span></div>
                      {inv.amountPaid > 0 && <div className="flex justify-between text-green-600"><span>Amount Paid</span><span>GH₵{inv.amountPaid.toFixed(2)}</span></div>}
                    </div>

                    {inv.notes && (
                      <div className="mt-3 text-sm text-text-muted"><strong>Notes:</strong> {inv.notes}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
