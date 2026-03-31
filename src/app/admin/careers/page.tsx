"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Trash2, Edit2, Save, X, Users, Eye,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const DEPARTMENTS = ["Sales", "Digital", "Support", "Operations", "Marketing", "Engineering", "Finance", "Management"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  shortlisted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const EMPTY_FORM = { title: "", department: "Sales", location: "Accra", type: "Full-time", description: "", requirements: "", status: "active" };

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<Any[]>([]);
  const [applications, setApplications] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState("");

  const fetchJobs = async () => {
    const res = await fetch("/api/admin/careers/jobs");
    const data = await res.json();
    setJobs(data.jobs || []);
  };

  const fetchApplications = async () => {
    const res = await fetch("/api/admin/careers/applications");
    const data = await res.json();
    setApplications(data.applications || []);
  };

  useEffect(() => {
    Promise.all([fetchJobs(), fetchApplications()]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditingJob(null); setShowForm(true); };
  const openEdit = (job: Any) => { setForm({ title: job.title, department: job.department, location: job.location, type: job.type, description: job.description, requirements: job.requirements || "", status: job.status }); setEditingJob(job); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title || !form.description) { toast.error("Title and description are required"); return; }
    setSaving(true);
    try {
      const url = editingJob ? `/api/admin/careers/jobs/${editingJob.id}` : "/api/admin/careers/jobs";
      const method = editingJob ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingJob ? "Job updated" : "Job created");
      setShowForm(false);
      fetchJobs();
    } catch { toast.error("Failed to save job"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting? All applications linked to it will be unlinked.")) return;
    const res = await fetch(`/api/admin/careers/jobs/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Job deleted"); fetchJobs(); } else { toast.error("Failed to delete"); }
  };

  const handleAppStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/careers/applications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) { toast.success("Status updated"); fetchApplications(); } else { toast.error("Failed to update status"); }
  };

  const filteredApps = applications.filter(a =>
    !appFilter || a.name.toLowerCase().includes(appFilter.toLowerCase()) ||
    a.email.toLowerCase().includes(appFilter.toLowerCase()) ||
    a.job?.title?.toLowerCase().includes(appFilter.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Careers Management</h1>
          <p className="text-text-muted text-sm mt-1">{jobs.length} job posting{jobs.length !== 1 ? "s" : ""} · {applications.length} application{applications.length !== 1 ? "s" : ""}</p>
        </div>
        {activeTab === "jobs" && (
          <Button onClick={openCreate} className="rounded-lg">
            <Plus className="w-4 h-4 mr-2" /> Add Job Posting
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit">
        {[{ id: "jobs", label: "Job Postings", icon: Briefcase }, { id: "applications", label: "Applications", icon: Users }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white shadow-sm text-accent" : "text-text-muted hover:text-text"}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === "applications" && applications.filter(a => a.status === "new").length > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {applications.filter(a => a.status === "new").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Job Postings Tab */}
      {activeTab === "jobs" && (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border">
              <Briefcase className="w-12 h-12 text-border mx-auto mb-3" />
              <p className="text-text-muted">No job postings yet. Create your first one!</p>
            </div>
          ) : (
            jobs.map((job) => (
              <motion.div key={job.id} layout className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-text">{job.title}</h3>
                      <Badge variant={job.status === "active" ? "success" : "outline"} className="text-xs">{job.status}</Badge>
                      <Badge variant="outline" className="text-xs">{job.type}</Badge>
                    </div>
                    <p className="text-sm text-text-muted">{job.department} · {job.location}</p>
                    <p className="text-xs text-text-muted mt-1">
                      <Users className="w-3 h-3 inline mr-1" />{job._count?.applications || 0} application{(job._count?.applications || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(job)}
                      className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(job.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                      {expandedJob === job.id ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedJob === job.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border">
                      <div className="p-5 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Description</p>
                          <p className="text-sm text-text whitespace-pre-line">{job.description}</p>
                        </div>
                        {job.requirements && (
                          <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Requirements</p>
                            <p className="text-sm text-text whitespace-pre-line">{job.requirements}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          <Input placeholder="Filter by name, email, or job title..." value={appFilter} onChange={e => setAppFilter(e.target.value)} className="rounded-xl max-w-sm" />
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border">
              <Users className="w-12 h-12 text-border mx-auto mb-3" />
              <p className="text-text-muted">No applications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => (
                <motion.div key={app.id} layout className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-accent font-bold text-sm">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-text">{app.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{app.email} {app.phone && `· ${app.phone}`}</p>
                      {app.job && <p className="text-xs text-accent mt-0.5"><Briefcase className="w-3 h-3 inline mr-1" />{app.job.title} — {app.job.department}</p>}
                      {app.coverLetter && (
                        <div className="mt-2 p-3 bg-surface rounded-lg">
                          <p className="text-xs font-semibold text-text-muted mb-1">Cover Letter</p>
                          <p className="text-sm text-text whitespace-pre-line line-clamp-4">{app.coverLetter}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-text-muted mt-2">{new Date(app.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {[
                        { s: "reviewed", icon: Eye, label: "Review" },
                        { s: "shortlisted", icon: CheckCircle, label: "Shortlist" },
                        { s: "rejected", icon: XCircle, label: "Reject" },
                      ].map(({ s, icon: Icon, label }) => (
                        <button key={s} onClick={() => handleAppStatus(app.id, s)}
                          disabled={app.status === s}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            app.status === s ? "bg-surface border-border text-text-muted cursor-default" : "bg-white border-border hover:border-accent hover:text-accent"
                          }`}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-bold text-text">{editingJob ? "Edit Job Posting" : "New Job Posting"}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-surface rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-text block mb-1.5">Job Title *</label>
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sales Associate" className="rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Department</label>
                    <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Employment Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm">
                      {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Location</label>
                    <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Accra" className="rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm">
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-text block mb-1.5">Description *</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={4} placeholder="Describe the role and responsibilities..."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-text block mb-1.5">Requirements</label>
                    <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
                      rows={3} placeholder="List qualifications, skills, experience required..."
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="rounded-xl flex-1">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />{editingJob ? "Save Changes" : "Create Job"}</>}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
