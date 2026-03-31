"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, MapPin, ArrowRight, Users, Zap, Heart, GraduationCap,
  X, Send, Loader2, CheckCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const perks = [
  { icon: Zap, title: "Career Growth", desc: "Fast-track your career in Ghana's booming tech industry" },
  { icon: GraduationCap, title: "Hands-on Training", desc: "Learn directly from experienced professionals and industry leaders" },
  { icon: Heart, title: "Supportive Team", desc: "Join a close-knit team that celebrates wins together" },
  { icon: Users, title: "Great Culture", desc: "Work with passionate people who love technology" },
];

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements?: string;
}

const EMPTY_FORM = { name: "", email: "", phone: "", coverLetter: "" };

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [applyTarget, setApplyTarget] = useState<Job | null>(null);
  const [isGeneral, setIsGeneral] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/careers")
      .then(r => r.json())
      .then(d => setJobs(d.jobs || []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const openApply = (job: Job | null, general = false) => {
    setApplyTarget(job);
    setIsGeneral(general);
    setForm({ ...EMPTY_FORM });
    setSubmitted(false);
  };
  const closeApply = () => { setApplyTarget(null); setIsGeneral(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: applyTarget?.id || null, ...form }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try emailing careers@intactghana.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Join the <span className="gradient-text">Intact Ghana</span> Team
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Help us bring the best technology to Ghana. We&apos;re always looking for talented and passionate people.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-text text-center mb-8">Why Work With Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {perks.map((perk, i) => (
            <motion.div key={perk.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-border/50 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <perk.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-text mb-1">{perk.title}</h3>
              <p className="text-sm text-text-muted">{perk.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Open Positions */}
        <h2 className="text-2xl font-bold text-text mb-6">Open Positions</h2>

        {loadingJobs ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border/50">
            <Briefcase className="w-12 h-12 text-border mx-auto mb-3" />
            <p className="text-text-muted">No open positions at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((pos, i) => (
              <motion.div key={pos.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-text text-lg">{pos.title}</h3>
                      <Badge variant="outline" className="text-xs">{pos.type}</Badge>
                    </div>
                    <p className="text-sm text-text-muted mb-2 line-clamp-2">{pos.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-light">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{pos.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pos.requirements && (
                      <Button variant="ghost" size="sm" className="rounded-xl"
                        onClick={() => setExpandedJob(expandedJob === pos.id ? null : pos.id)}>
                        {expandedJob === pos.id ? "Less" : "Details"}
                      </Button>
                    )}
                    <Button className="rounded-xl" onClick={() => openApply(pos)}>
                      Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedJob === pos.id && pos.requirements && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border/50">
                      <div className="p-6 pt-4">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Requirements</p>
                        <p className="text-sm text-text whitespace-pre-line">{pos.requirements}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* General Application */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-gradient-to-r from-accent/10 to-gold/10 border border-accent/20 rounded-2xl p-8 text-center mt-12">
          <h3 className="text-xl font-bold text-text mb-2">Don&apos;t see a role that fits?</h3>
          <p className="text-text-muted text-sm mb-4">
            Send us your details and we&apos;ll keep you in mind for future opportunities.
          </p>
          <Button variant="outline" className="rounded-xl" onClick={() => openApply(null, true)}>
            Send General Application
          </Button>
        </motion.div>
      </section>

      {/* Apply Modal */}
      <AnimatePresence>
        {(applyTarget !== null || isGeneral) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-text">
                    {isGeneral ? "General Application" : `Apply — ${applyTarget?.title}`}
                  </h2>
                  {applyTarget && (
                    <p className="text-sm text-text-muted">{applyTarget.department} · {applyTarget.location}</p>
                  )}
                </div>
                <button onClick={closeApply} className="p-2 hover:bg-surface rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">Application Submitted!</h3>
                    <p className="text-text-muted text-sm mb-6">
                      Thank you, {form.name}! We&apos;ll review your application and get back to you at {form.email}.
                    </p>
                    <Button onClick={closeApply} className="rounded-xl">Close</Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Full Name *</label>
                        <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Your full name" className="rounded-lg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">Email *</label>
                        <Input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="your@email.com" className="rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Phone</label>
                      <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+233..." className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Cover Letter / Message</label>
                      <textarea value={form.coverLetter} onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                        rows={4} placeholder="Tell us why you'd be a great fit..."
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-xs">
                      <Clock className="w-4 h-4 shrink-0" />
                      We typically respond within 3–5 business days.
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full rounded-xl">
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" />Submit Application</>}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
