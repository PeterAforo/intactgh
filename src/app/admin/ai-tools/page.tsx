"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Camera,
  Upload,
  Wand2,
  X,
  Download,
  RotateCcw,
  Zap,
  ImageIcon,
  MessageSquare,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAiToolsPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState("remove-bg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = () => {
    if (!selectedImage) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessedImage(selectedImage);
      setProcessing(false);
    }, 3000);
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">AI Tools</h1>
        <p className="text-text-muted text-sm mt-1">AI-powered tools to enhance your store</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: ImageIcon,
            title: "Product Image Enhancer",
            description: "Upload or capture a product photo and AI will remove the background, adjust lighting, and create a professional product image.",
            color: "bg-accent/10 text-accent",
            active: true,
          },
          {
            icon: MessageSquare,
            title: "AI Product Description",
            description: "Generate compelling product descriptions from product name and key features using AI.",
            color: "bg-info/10 text-info",
            active: false,
          },
          {
            icon: Bot,
            title: "Chatbot Settings",
            description: "Configure the AI chatbot responses, personality, and product recommendations.",
            color: "bg-success/10 text-success",
            active: false,
          },
        ].map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-2xl border-2 p-6 transition-all ${
              tool.active ? "border-accent shadow-md" : "border-border opacity-70"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
              <tool.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-text mb-2">{tool.title}</h3>
            <p className="text-sm text-text-light leading-relaxed">{tool.description}</p>
            {!tool.active && (
              <span className="inline-block mt-3 text-xs bg-surface px-2 py-1 rounded-full text-text-muted">Coming Soon</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Image Enhancer Tool */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-text">Product Image Enhancer</h2>
            <p className="text-xs text-text-muted">Transform any product photo into a professional e-commerce image</p>
          </div>
        </div>

        {/* AI Action Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "remove-bg", label: "Remove Background" },
            { id: "enhance", label: "Enhance Quality" },
            { id: "resize", label: "Resize & Crop" },
            { id: "all", label: "Full Enhancement" },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => setAiAction(action.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                aiAction === action.id
                  ? "bg-accent text-white shadow-md"
                  : "bg-surface text-text-light hover:bg-surface-dark"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Image Processing Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <h3 className="text-sm font-medium text-text mb-3">Original Image</h3>
            {selectedImage ? (
              <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
                <Image src={selectedImage} alt="Original" fill className="object-contain" />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-surface/50">
                <div className="flex gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="rounded-lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                </div>
                <p className="text-xs text-text-muted">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>

          {/* Output */}
          <div>
            <h3 className="text-sm font-medium text-text mb-3">Enhanced Image</h3>
            <div className="aspect-square rounded-xl border border-border overflow-hidden bg-surface flex items-center justify-center">
              {processing ? (
                <div className="text-center p-6">
                  <Wand2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
                  <p className="font-bold text-text mb-1">Processing with AI...</p>
                  <p className="text-xs text-text-muted">
                    {aiAction === "remove-bg" && "Removing background..."}
                    {aiAction === "enhance" && "Enhancing image quality..."}
                    {aiAction === "resize" && "Resizing and cropping..."}
                    {aiAction === "all" && "Applying full enhancement..."}
                  </p>
                  <div className="w-48 mx-auto bg-border rounded-full h-1.5 mt-4 overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="bg-accent h-full rounded-full"
                    />
                  </div>
                </div>
              ) : processedImage ? (
                <div className="relative w-full h-full">
                  <Image src={processedImage} alt="Enhanced" fill className="object-contain" />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <Button size="sm" className="rounded-lg shadow-lg">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-success text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Enhanced
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <Zap className="w-12 h-12 text-border mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Enhanced image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Process Button */}
        {selectedImage && !processedImage && (
          <div className="mt-6 text-center">
            <Button size="lg" onClick={processImage} disabled={processing} className="rounded-xl">
              <Wand2 className="w-5 h-5 mr-2" />
              {processing ? "Processing..." : "Enhance with AI"}
            </Button>
          </div>
        )}

        {processedImage && (
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset} variant="outline" className="rounded-lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Process Another
            </Button>
            <Button className="rounded-lg">
              Use as Product Image
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-accent/5 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text mb-1">How AI Image Enhancement Works</p>
            <ul className="text-xs text-text-light space-y-1">
              <li>• <strong>Remove Background:</strong> Automatically detects and removes the background, leaving a clean white or transparent backdrop</li>
              <li>• <strong>Enhance Quality:</strong> Improves lighting, contrast, sharpness, and color balance for professional results</li>
              <li>• <strong>Resize & Crop:</strong> Automatically centers the product and resizes to standard e-commerce dimensions</li>
              <li>• <strong>Full Enhancement:</strong> Applies all enhancements for the best possible product image</li>
            </ul>
            <p className="text-xs text-text-muted mt-2 italic">
              Note: This is a demo. In production, this would connect to an AI image processing API (e.g., Remove.bg, Cloudinary AI, or custom ML model).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
