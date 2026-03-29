"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-black mb-4">Get In Touch</h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Have a question or need help? We&apos;re here for you 24/7.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            {[
              {
                icon: Phone,
                title: "Call Us",
                lines: ["+233 543 645 126", "+233 543 008 475"],
                color: "bg-accent/10 text-accent",
              },
              {
                icon: Mail,
                title: "Email Us",
                lines: ["info@intactghana.com", "sales@intactghana.com"],
                color: "bg-info/10 text-info",
              },
              {
                icon: MapPin,
                title: "Visit Us",
                lines: ["East Legon, A&C Mall, Accra", "Greater Accra, Ghana"],
                color: "bg-success/10 text-success",
              },
              {
                icon: Clock,
                title: "Working Hours",
                lines: ["Mon - Sat: 8:00 AM - 6:00 PM", "Sun: 10:00 AM - 4:00 PM"],
                color: "bg-gold/10 text-gold",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border p-5 flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text mb-1">{item.title}</h3>
                  {item.lines.map((line) => (
                    <p key={line} className="text-sm text-text-light">{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-text">Send Us a Message</h2>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">Message Sent!</h3>
                <p className="text-text-muted">We&apos;ll get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Full Name</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Email</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+233..."
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Subject</label>
                    <Input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help?"
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1.5">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-xl">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Map Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl overflow-hidden border border-border h-80"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.5!2d-0.1520491!3d5.6416602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf84aa4c54533d%3A0x396a5b445a00b402!2sIntact+Ghana+-+East+Legon+(A%26C+Mall)!5e0!3m2!1sen!2sgh!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </div>
  );
}
