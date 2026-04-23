"use client";

import React, { useEffect, useState } from "react";
import { Truck, Package, Clock, CheckCircle, XCircle, Loader2, ChevronDown } from "lucide-react";

interface OrderItem {
  id: string; quantity: number; price: number;
  product: { name: string; images: { url: string }[] };
}

interface Order {
  id: string; orderNumber: string; total: number; commission: number; status: string;
  shippingName: string | null; shippingPhone: string | null; shippingAddress: string | null; shippingCity: string | null;
  createdAt: string; items: OrderItem[];
  reseller: { storeName: string; user: { name: string } };
  client: { name: string; phone: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function ResellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/admin/reseller-orders${params}`).then(r => r.json()).then(setOrders).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/admin/reseller-orders/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Truck className="w-6 h-6 text-accent" /> Reseller Orders
        </h1>
        <p className="text-text-muted text-sm">View all reseller orders and update delivery status</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${filter === s ? "bg-accent text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Truck className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No reseller orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-bold text-text text-sm">{order.orderNumber}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Reseller: <strong>{order.reseller.user.name}</strong> ({order.reseller.storeName})
                    &bull; Customer: {order.shippingName || order.client?.name || "N/A"}
                    &bull; {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-text text-sm">GH₵{order.total.toFixed(2)}</p>
                  <p className="text-xs text-green-600">+GH₵{order.commission.toFixed(2)}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
              </div>

              {expandedId === order.id && (
                <div className="border-t border-border p-4 bg-surface/30">
                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product.images[0] && <img src={item.product.images[0].url} alt="" className="w-8 h-8 rounded object-contain bg-white" />}
                        <div className="flex-1 text-sm">
                          <p className="text-text truncate">{item.product.name}</p>
                          <p className="text-xs text-text-muted">x{item.quantity} @ GH₵{item.price.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-medium text-text">GH₵{(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Shipping */}
                  <div className="bg-white rounded-lg p-3 text-sm mb-4">
                    <p className="font-medium text-text">{order.shippingName || order.client?.name}</p>
                    <p className="text-text-muted">{order.shippingPhone || order.client?.phone}</p>
                    {order.shippingAddress && <p className="text-text-muted">{order.shippingAddress}, {order.shippingCity}</p>}
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Update status:</span>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(order.id, s)} disabled={updating === order.id || order.status === s}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize disabled:opacity-40 ${order.status === s ? STATUS_COLORS[s] : "bg-white border border-border text-text-muted hover:bg-surface"}`}>
                        {updating === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
