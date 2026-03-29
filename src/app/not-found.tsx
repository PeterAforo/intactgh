"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="text-[120px] md:text-[160px] font-black leading-none gradient-text mb-4">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text mb-3">
          Page Not Found
        </h1>
        <p className="text-text-muted mb-8">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="rounded-xl w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg" className="rounded-xl w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Browse Shop
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
