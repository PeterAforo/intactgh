"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Mail, Phone, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const customers = [
  { id: "1", name: "Kwame Mensah", email: "kwame@email.com", phone: "+233 543 111 222", orders: 12, spent: 45600, joined: "Jan 2025" },
  { id: "2", name: "Ama Serwaa", email: "ama@email.com", phone: "+233 543 333 444", orders: 8, spent: 32100, joined: "Feb 2025" },
  { id: "3", name: "Kofi Asante", email: "kofi@email.com", phone: "+233 543 555 666", orders: 3, spent: 8700, joined: "Mar 2025" },
  { id: "4", name: "Abena Osei", email: "abena@email.com", phone: "+233 543 777 888", orders: 15, spent: 67800, joined: "Nov 2024" },
  { id: "5", name: "Yaw Boateng", email: "yaw@email.com", phone: "+233 543 999 000", orders: 6, spent: 21300, joined: "Apr 2025" },
  { id: "6", name: "Efua Appiah", email: "efua@email.com", phone: "+233 244 111 222", orders: 4, spent: 15200, joined: "May 2025" },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Customers</h1>
        <p className="text-text-muted text-sm mt-1">Manage your customer base ({customers.length} customers)</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg bg-surface border-0"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Orders</th>
                <th className="px-5 py-4">Total Spent</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                        {customer.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-text">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className="text-xs">{customer.orders} orders</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-text">
                    {formatPrice(customer.spent)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{customer.joined}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
