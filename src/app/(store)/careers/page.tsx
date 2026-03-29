"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, ArrowRight, Users, Zap, Heart, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const openPositions = [
  {
    id: 1,
    title: "Sales Associate",
    department: "Sales",
    location: "Accra",
    type: "Full-time",
    description: "Join our retail team and help customers find the perfect tech products.",
  },
  {
    id: 2,
    title: "E-Commerce Manager",
    department: "Digital",
    location: "Accra",
    type: "Full-time",
    description: "Lead our online store operations, optimize conversions, and drive digital growth.",
  },
  {
    id: 3,
    title: "Customer Support Specialist",
    department: "Support",
    location: "Remote / Accra",
    type: "Full-time",
    description: "Provide exceptional customer service via phone, email, and live chat.",
  },
  {
    id: 4,
    title: "Warehouse Assistant",
    department: "Operations",
    location: "Accra",
    type: "Full-time",
    description: "Help manage inventory, process orders, and ensure timely deliveries.",
  },
  {
    id: 5,
    title: "Social Media Intern",
    department: "Marketing",
    location: "Accra",
    type: "Internship",
    description: "Create engaging content and manage our social media presence across platforms.",
  },
];

const perks = [
  { icon: Heart, title: "Health Insurance", desc: "Comprehensive medical coverage for you and your family" },
  { icon: GraduationCap, title: "Learning Budget", desc: "Annual allowance for courses, conferences, and books" },
  { icon: Zap, title: "Staff Discounts", desc: "Exclusive discounts on all products in our store" },
  { icon: Users, title: "Great Culture", desc: "Work with passionate people who love technology" },
];

export default function CareersPage() {
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
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-border/50 p-6 text-center"
            >
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
        <div className="space-y-4">
          {openPositions.map((pos, i) => (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border/50 p-6 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-text text-lg">{pos.title}</h3>
                  <Badge variant="outline" className="text-xs">{pos.type}</Badge>
                </div>
                <p className="text-sm text-text-muted mb-2">{pos.description}</p>
                <div className="flex items-center gap-4 text-xs text-text-light">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{pos.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.location}</span>
                </div>
              </div>
              <Button className="rounded-xl shrink-0" asChild>
                <a href={`mailto:careers@intactghana.com?subject=Application: ${pos.title}`}>
                  Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* General Application */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-accent/10 to-gold/10 border border-accent/20 rounded-2xl p-8 text-center mt-12"
        >
          <h3 className="text-xl font-bold text-text mb-2">Don&apos;t see a role that fits?</h3>
          <p className="text-text-muted text-sm mb-4">
            Send us your CV and we&apos;ll keep you in mind for future opportunities.
          </p>
          <Button variant="outline" className="rounded-xl" asChild>
            <a href="mailto:careers@intactghana.com?subject=General Application">
              Send General Application
            </a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
