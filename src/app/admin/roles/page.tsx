"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, Plus, Edit, Trash2, X, Loader2, Check,
  Users, Lock, ChevronDown, ChevronRight, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type RoleData = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
};

type PermissionGroup = Record<string, { id: string; name: string; description: string; group: string }[]>;

const SYSTEM_ROLE_COLORS: Record<string, string> = {
  admin: "border-red-200 bg-red-50",
  staff: "border-blue-200 bg-blue-50",
  customer: "border-gray-200 bg-gray-50",
};

const SYSTEM_ROLE_TEXT: Record<string, string> = {
  admin: "text-red-700",
  staff: "text-blue-700",
  customer: "text-gray-700",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [grouped, setGrouped] = useState<PermissionGroup>({});
  const [allPermNames, setAllPermNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Expanded role for viewing permissions
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  // Expanded groups in form
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/admin/roles"),
        fetch("/api/admin/permissions"),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      setRoles(rolesData.roles || []);
      setGrouped(permsData.grouped || {});
      setAllPermNames((permsData.permissions || []).map((p: Any) => p.name));
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setEditId(null);
    setFormName("");
    setFormDesc("");
    setFormPerms(new Set());
    setShowForm(false);
    setExpandedGroups(new Set());
  };

  const handleEdit = (role: RoleData) => {
    setEditId(role.id);
    setFormName(role.name);
    setFormDesc(role.description || "");
    setFormPerms(new Set(role.permissions));
    setShowForm(true);
    setExpandedGroups(new Set(Object.keys(grouped)));
  };

  const handleSubmit = async () => {
    if (!editId && (!formName || formName.trim().length < 2)) {
      toast.error("Role name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      const perms = Array.from(formPerms);
      if (editId) {
        const res = await fetch(`/api/admin/roles/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: formDesc, permissions: perms }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Role updated");
      } else {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, description: formDesc, permissions: perms }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Role created");
      }
      resetForm();
      fetchData();
    } catch (e: Any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleData) => {
    if (role.isSystem) {
      toast.error("Cannot delete system roles");
      return;
    }
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Role deleted");
      fetchData();
    } catch (e: Any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const togglePerm = (perm: string) => {
    setFormPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (groupName: string) => {
    const permsInGroup = grouped[groupName]?.map((p) => p.name) || [];
    const allSelected = permsInGroup.every((p) => formPerms.has(p));
    setFormPerms((prev) => {
      const next = new Set(prev);
      permsInGroup.forEach((p) => {
        if (allSelected) next.delete(p);
        else next.add(p);
      });
      return next;
    });
  };

  const selectAll = () => setFormPerms(new Set(allPermNames));
  const selectNone = () => setFormPerms(new Set());

  const toggleExpandGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Roles & Permissions</h1>
          <p className="text-text-muted text-sm mt-1">
            {roles.length} roles — manage access control for your team
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); setExpandedGroups(new Set(Object.keys(grouped))); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> New Role
        </Button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text text-lg">
                {editId ? `Edit Role — ${formName}` : "Create New Role"}
              </h2>
              <button onClick={resetForm}>
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. manager, editor"
                  className="rounded-lg"
                  disabled={!!editId}
                />
                {editId && (
                  <p className="text-xs text-text-muted mt-1">Role names cannot be changed after creation</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Description</label>
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What can this role do?"
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text text-sm">
                  Permissions ({formPerms.size} of {allPermNames.length} selected)
                </h3>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-accent hover:underline font-medium">
                    Select All
                  </button>
                  <span className="text-text-muted">|</span>
                  <button onClick={selectNone} className="text-xs text-text-muted hover:underline font-medium">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {Object.entries(grouped).map(([groupName, perms]) => {
                  const allInGroup = perms.every((p) => formPerms.has(p.name));
                  const someInGroup = perms.some((p) => formPerms.has(p.name));
                  const isExpanded = expandedGroups.has(groupName);

                  return (
                    <div key={groupName}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-surface/50 hover:bg-surface cursor-pointer transition-colors"
                        onClick={() => toggleExpandGroup(groupName)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(groupName); }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            allInGroup
                              ? "bg-accent border-accent text-white"
                              : someInGroup
                              ? "bg-accent/30 border-accent"
                              : "border-border"
                          }`}
                        >
                          {allInGroup && <Check className="w-3 h-3" />}
                          {someInGroup && !allInGroup && <div className="w-2 h-0.5 bg-accent rounded" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-text">{groupName}</span>
                          <span className="text-xs text-text-muted ml-2">
                            ({perms.filter((p) => formPerms.has(p.name)).length}/{perms.length})
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 py-2 space-y-1 bg-white">
                              {perms.map((p) => (
                                <label
                                  key={p.name}
                                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface/50 cursor-pointer transition-colors"
                                >
                                  <button
                                    type="button"
                                    onClick={() => togglePerm(p.name)}
                                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      formPerms.has(p.name)
                                        ? "bg-accent border-accent text-white"
                                        : "border-border"
                                    }`}
                                  >
                                    {formPerms.has(p.name) && <Check className="w-3 h-3" />}
                                  </button>
                                  <div>
                                    <span className="text-sm font-medium text-text">{p.name}</span>
                                    {p.description && (
                                      <span className="text-xs text-text-muted ml-2">— {p.description}</span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editId ? "Update Role" : "Create Role"}
              </Button>
              <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roles List */}
      <div className="grid gap-4">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.id;
          const cardColor = SYSTEM_ROLE_COLORS[role.name] || "border-purple-200 bg-purple-50";
          const textColor = SYSTEM_ROLE_TEXT[role.name] || "text-purple-700";

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-xl border ${cardColor} flex items-center justify-center`}>
                  {role.name === "admin" ? (
                    <ShieldCheck className={`w-5 h-5 ${textColor}`} />
                  ) : role.name === "customer" ? (
                    <Users className={`w-5 h-5 ${textColor}`} />
                  ) : (
                    <Shield className={`w-5 h-5 ${textColor}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text">{role.name}</h3>
                    {role.isSystem && (
                      <span className="px-1.5 py-0.5 bg-surface text-text-muted text-[10px] font-semibold rounded-full border border-border uppercase">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{role.description || "No description"}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-text">{role.permissions.length}</p>
                    <p className="text-[10px] text-text-muted uppercase">Permissions</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-text">{role.userCount}</p>
                    <p className="text-[10px] text-text-muted uppercase">Users</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                      className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"
                      title="View permissions"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"
                      title="Edit role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded permissions view */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 border-t border-border pt-4">
                      {role.permissions.length === 0 ? (
                        <p className="text-sm text-text-muted italic flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          No admin permissions — storefront access only
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {Object.entries(grouped).map(([groupName, perms]) => {
                            const active = perms.filter((p) => role.permissions.includes(p.name));
                            if (active.length === 0) return null;
                            return (
                              <div key={groupName} className="space-y-1">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{groupName}</p>
                                {active.map((p) => (
                                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-text">
                                    <Check className="w-3 h-3 text-green-600 shrink-0" />
                                    {p.name}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
