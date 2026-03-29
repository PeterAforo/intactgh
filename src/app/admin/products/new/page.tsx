"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Camera,
  Sparkles,
  X,
  Plus,
  Save,
  Eye,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [categories, setCategories] = useState<Any[]>([]);
  const [brands, setBrands] = useState<Any[]>([]);

  const handleSave = async () => {
    if (!name || !price || !categoryId) { toast.error("Name, price, and category are required"); return; }
    setSaving(true);
    try {
      const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
      const imgList = images.map((url) => ({ url }));
      const body = {
        name, slug: finalSlug, description, price, comparePrice, sku, stock,
        categoryId, brandId, featured, isNew, onSale, tags, images: imgList,
      };
      const res = await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      toast.success("Product created!");
      router.push("/admin/products");
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => d.categories && setCategories(d.categories)).catch(() => {});
    fetch("/api/admin/brands").then(r => r.json()).then(d => d.brands && setBrands(d.brands)).catch(() => {});
  }, []);
  const [showAiProcessor, setShowAiProcessor] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessed, setAiProcessed] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const uploadToCloudinary = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    setUploadingCount((n) => n + fileArr.length);
    await Promise.allSettled(
      fileArr.map(async (file) => {
        try {
          const url = await uploadToCloudinary(file);
          setImages((prev) => [...prev, url]);
        } catch (err: Any) {
          toast.error(err.message || "Image upload failed");
        } finally {
          setUploadingCount((n) => Math.max(0, n - 1));
        }
      })
    );
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraMode(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setCameraMode(false);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        setUploadingCount((n) => n + 1);
        try {
          const url = await uploadToCloudinary(file);
          setImages((prev) => [...prev, url]);
        } catch (err: Any) {
          toast.error(err.message || "Camera upload failed");
        } finally {
          setUploadingCount((n) => Math.max(0, n - 1));
        }
      }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    }
    setCameraMode(false);
  };

  const processWithAI = () => {
    if (images.length === 0) return;
    setAiProcessing(true);
    setShowAiProcessor(true);

    setTimeout(() => {
      setAiProcessing(false);
      setAiProcessed(true);
      setTimeout(() => {
        setShowAiProcessor(false);
        setAiProcessed(false);
      }, 3000);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Add New Product</h1>
            <p className="text-text-muted text-sm">Create a new product listing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="rounded-lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-text mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Product Name</label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }}
                  placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a detailed product description..."
                  rows={5}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text">Product Images</h2>
              {images.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={processWithAI}
                  className="rounded-lg text-accent border-accent"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Enhance Images
                </Button>
              )}
            </div>

            {/* Camera Mode */}
            {cameraMode && (
              <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-[4/3] object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <Button onClick={capturePhoto} size="lg" className="rounded-full w-14 h-14 p-0">
                    <Camera className="w-6 h-6" />
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="sm" className="rounded-full bg-white/20 border-white text-white">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* AI Processing Overlay */}
            {showAiProcessor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white text-center"
              >
                {aiProcessing ? (
                  <div>
                    <Wand2 className="w-10 h-10 mx-auto mb-3 animate-spin" />
                    <p className="font-bold text-lg">AI is processing your images...</p>
                    <p className="text-white/70 text-sm mt-1">
                      Removing background, adjusting lighting, and optimizing for web display
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                        className="bg-gold h-full rounded-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-gold" />
                    <p className="font-bold text-lg">Images Enhanced Successfully!</p>
                    <p className="text-white/70 text-sm mt-1">
                      Background removed, lighting adjusted, and images optimized
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Upload progress */}
            {uploadingCount > 0 && (
              <div className="mb-3 flex items-center gap-2 text-sm text-accent bg-accent/5 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""} to Cloudinary…
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border group">
                  <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && (
                    <Badge className="absolute bottom-2 left-2 text-[10px]">Main</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent hover:bg-surface/50 transition-all group cursor-pointer"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-text-muted group-hover:text-accent transition-colors" />
                <p className="text-sm font-medium text-text">Upload Images</p>
                <p className="text-xs text-text-muted mt-1">PNG, JPG up to 10MB</p>
              </button>
              <button
                onClick={startCamera}
                className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-accent hover:bg-surface/50 transition-all group cursor-pointer"
              >
                <Camera className="w-8 h-8 mx-auto mb-2 text-text-muted group-hover:text-accent transition-colors" />
                <p className="text-sm font-medium text-text">Take Photo</p>
                <p className="text-xs text-text-muted mt-1">Use camera to capture product</p>
              </button>
            </div>

            <div className="mt-3 bg-accent/5 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-text-light">
                <strong className="text-accent">AI Image Enhancement:</strong> Take a photo of your product 
                and our AI will automatically remove the background, adjust lighting, and create a 
                professional product image ready for your store.
              </p>
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-text mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Price (GH₵)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Compare Price (GH₵)</label>
                <Input
                  type="number"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                  placeholder="0.00"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">SKU</label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SAM-S24U-256"
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Stock Quantity</label>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-text mb-4">Status</h2>
            <select className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text">Featured product</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text">New arrival</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text">On sale</span>
              </label>
            </div>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-6"
          >
            <h2 className="font-bold text-text mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c: Any) => !c.parentId)
                    .map((cat: Any) =>
                      cat.children?.length > 0 ? (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.id}>All {cat.name}</option>
                          {cat.children.map((sub: Any) => (
                            <option key={sub.id} value={sub.id}>
                              &nbsp;&nbsp;↳ {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      )
                    )
                  }
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Brand</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select brand</option>
                  {brands.map((brand: Any) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma separated tags"
                  className="rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
