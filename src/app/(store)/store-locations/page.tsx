"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const locations = [
  {
    id: 1,
    name: "Intact Ghana - East Legon (A&C Mall)",
    address: "East Legon, A&C Mall, Accra",
    region: "Greater Accra",
    phone: "+233 543 645 126",
    hours: "Mon-Sat: 8:00 AM - 6:00 PM",
    lat: 5.6416602,
    lng: -0.1520491,
    mapUrl: "https://maps.app.goo.gl/SouvPoRFKoaqTtaW7",
    isPrimary: true,
  },
  {
    id: 2,
    name: "Intact Ghana - Kumasi Branch",
    address: "Adum, Kumasi",
    region: "Ashanti",
    phone: "+233 543 008 475",
    hours: "Mon-Sat: 8:30 AM - 5:30 PM",
    mapUrl: "",
    isPrimary: false,
  },
  {
    id: 3,
    name: "Intact Ghana - Takoradi Branch",
    address: "Market Circle, Takoradi",
    region: "Western",
    phone: "+233 543 645 126",
    hours: "Mon-Sat: 9:00 AM - 5:00 PM",
    mapUrl: "",
    isPrimary: false,
  },
];

export default function StoreLocationsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Our <span className="gradient-text">Store Locations</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Visit any of our showrooms across Ghana to experience products firsthand.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-2xl border overflow-hidden ${
                loc.isPrimary ? "border-accent/30 ring-2 ring-accent/10" : "border-border/50"
              }`}
            >
              {loc.isPrimary && (
                <div className="bg-accent text-white text-xs font-bold text-center py-1.5">
                  HEAD OFFICE
                </div>
              )}
              <div className="p-6">
                <h3 className="font-bold text-text text-lg mb-4">{loc.name}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-text">{loc.address}</p>
                      <p className="text-text-muted">{loc.region} Region</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-accent shrink-0" />
                    <a href={`tel:${loc.phone}`} className="text-text hover:text-accent transition-colors">
                      {loc.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-text-light">{loc.hours}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-5 rounded-xl" asChild>
                  <a
                    href={loc.mapUrl || `https://www.google.com/maps/search/${encodeURIComponent(loc.address + " Ghana")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map Embed */}
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.5!2d-0.1520491!3d5.6416602!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf84aa4c54533d%3A0x396a5b445a00b402!2sIntact+Ghana+-+East+Legon+(A%26C+Mall)!5e0!3m2!1sen!2sgh!4v1"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Intact Ghana Store Locations"
          />
        </div>
      </div>
    </div>
  );
}
