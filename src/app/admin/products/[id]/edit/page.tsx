"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, Camera, Sparkles, X, Plus, Save,
  Wand2, Tag, RefreshCw, TrendingUp, TrendingDown,
  Video, Crop, Maximize2, ScanLine, Layers, Zap, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface SpecRow { key: string; value: string; }
interface VariantOption { value: string; priceAdd: number; }
interface VariantRow { name: string; options: VariantOption[]; }
interface AiOptions { removeBg: boolean; crop: boolean; straighten: boolean; proportional: boolean; upscale: boolean; }

function applyCloudinaryTransforms(url: string, opts: AiOptions): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const t: string[] = [];
  if (opts.removeBg) t.push("e_background_removal");
  if (opts.upscale) t.push("e_upscale");
  if (opts.crop) t.push("c_fill,ar_1:1");
  else if (opts.proportional) t.push("c_fit,w_900,h_900");
  if (opts.straighten) t.push("e_straighten");
  if (!t.length) return url;
  return url.replace("/upload/", `/upload/${t.join("/")}/`);
}

function generateTags(name: string, categoryName: string, brandName: string): string {
  const stopWords = new Set(["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with"]);
  const words = [name, categoryName, brandName].join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 8).join(", ");
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function ProfitBadge({ cost, price }: { cost: string; price: string }) {
  const c = parseFloat(cost); const p = parseFloat(price);
  if (!c || !p || isNaN(c) || isNaN(p)) return null;
  const profit = p - c; const margin = ((profit / p) * 100).toFixed(1);
  const isProfit = profit >= 0;
  return (
    <div className={`flex items-center gap-3 mt-3 p-3 rounded-xl text-sm ${isProfit ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
      {isProfit ? <TrendingUp className="w-4 h-4 text-green-600 shrink-0" /> : <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />}
      <div className="flex-1">
        <span className={`font-semibold ${isProfit ? "text-green-700" : "text-red-700"}`}>
          {isProfit ? "Profit" : "Loss"}: GH₵{Math.abs(profit).toFixed(2)} | Margin: {Math.abs(parseFloat(margin))}%
        </span>
        {isProfit && parseFloat(margin) > 30 && <p className="text-green-600 text-xs mt-0.5">💡 Good margin — discount up to {(parseFloat(margin) - 15).toFixed(0)}% safely</p>}
        {isProfit && parseFloat(margin) <= 30 && parseFloat(margin) > 0 && <p className="text-amber-600 text-xs mt-0.5">⚠️ Thin margin — max suggested discount: {(parseFloat(margin) / 2).toFixed(0)}%</p>}
        {!isProfit && <p className="text-red-600 text-xs mt-0.5">❌ Selling below cost — review pricing</p>}
      </div>
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("active");

  const [images, setImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [cameraMode, setCameraMode] = useState(false);

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiOptions, setAiOptions] = useState<AiOptions>({ removeBg: false, crop: false, straighten: false, proportional: false, upscale: false });
  const [aiApplying, setAiApplying] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [onSale, setOnSale] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [categories, setCategories] = useState<Any[]>([]);
  const [brands, setBrands] = useState<Any[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Load categories, brands, and the product
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/brands").then(r => r.json()),
      fetch(`/api/admin/products/${productId}`).then(r => r.json()),
    ]).then(([catData, brandData, prodData]) => {
      if (catData.categories) setCategories(catData.categories);
      if (brandData.brands) setBrands(brandData.brands);
      const p = prodData.product;
      if (p) {
        setName(p.name ?? "");
        setSlug(p.slug ?? "");
        setDescription(p.description ?? "");
        setPrice(String(p.price ?? ""));
        setComparePrice(p.comparePrice ? String(p.comparePrice) : "");
        setCostPrice(p.costPrice ? String(p.costPrice) : "");
        setSku(p.sku ?? "");
        setStock(String(p.stock ?? ""));
        setStatus(p.status ?? "active");
        setCategoryId(p.categoryId ?? "");
        setBrandId(p.brandId ?? "");
        setTags(p.tags ?? "");
        setFeatured(!!p.featured);
        setIsNew(!!p.isNew);
        setOnSale(!!p.onSale);
        setVideoUrl(p.videoUrl ?? "");
        setImages(p.images?.map((img: Any) => img.url) ?? []);
        // Load variants
        if (p.variants?.length) {
          setVariants(p.variants.map((v: Any) => {
            let opts: VariantOption[] = [];
            try {
              const raw = JSON.parse(v.options);
              if (raw.length > 0 && typeof raw[0] === "string") {
                opts = raw.map((s: string) => ({ value: s, priceAdd: 0 }));
              } else {
                opts = raw.map((o: Any) => ({ value: String(o.value || o), priceAdd: Number(o.priceAdd || 0) }));
              }
            } catch { opts = [{ value: "", priceAdd: 0 }]; }
            return { name: v.name, options: opts };
          }));
        }
        // Parse specs JSON
        if (p.specs) {
          try {
            const parsed = JSON.parse(p.specs);
            const rows = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
            setSpecs(rows.length ? rows : [{ key: "", value: "" }]);
          } catch { setSpecs([{ key: "", value: "" }]); }
        }
      }
    }).catch(() => toast.error("Failed to load product"))
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  const selectedCatName = categories.find((c: Any) => c.id === categoryId)?.name
    ?? categories.flatMap((c: Any) => c.children ?? []).find((c: Any) => c.id === categoryId)?.name ?? "";
  const selectedBrandName = brands.find((b: Any) => b.id === brandId)?.name ?? "";

  const specsToJson = useCallback(() => {
    const obj: Record<string, string> = {};
    specs.forEach(({ key, value }) => { if (key.trim()) obj[key.trim()] = value; });
    return Object.keys(obj).length ? JSON.stringify(obj) : null;
  }, [specs]);

  const handleSave = async () => {
    if (!name || !price || !categoryId) { toast.error("Name, price, and category are required"); return; }
    setSaving(true);
    try {
      const imgList = images.map((url) => ({ url }));
      const cleanVariants = variants
        .filter((v) => v.name.trim() && v.options.some((o) => o.value.trim()))
        .map((v) => ({ name: v.name.trim(), options: v.options.filter((o) => o.value.trim()) }));
      const body = {
        name, slug, description, price, comparePrice, costPrice,
        sku, stock, categoryId, brandId, featured, isNew, onSale,
        tags, images: imgList, specs: specsToJson(),
        videoUrl: videoUrl || null, status,
        variants: cleanVariants,
      };
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Product updated!");
      router.push("/admin/products");
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const uploadToCloudinary = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return;
    setUploadingCount((n) => n + files.length);
    await Promise.allSettled(Array.from(files).map(async (file) => {
      try { const url = await uploadToCloudinary(file); setImages((prev) => [...prev, url]); }
      catch (err: Any) { toast.error(err.message || "Upload failed"); }
      finally { setUploadingCount((n) => Math.max(0, n - 1)); }
    }));
    e.target.value = "";
  };

  const startCamera = async () => {
    setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraMode(false); }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current; const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setCameraMode(false);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploadingCount((n) => n + 1);
      try { const url = await uploadToCloudinary(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })); setImages((prev) => [...prev, url]); }
      catch (err: Any) { toast.error(err.message || "Camera failed"); }
      finally { setUploadingCount((n) => Math.max(0, n - 1)); }
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setCameraMode(false);
  };

  const applyAiEnhancement = () => {
    if (!images.length || !Object.values(aiOptions).some(Boolean)) { toast.error("Select at least one option"); return; }
    setAiApplying(true);
    setTimeout(() => {
      setImages((prev) => { const u = [...prev]; u[selectedImageIdx] = applyCloudinaryTransforms(u[selectedImageIdx], aiOptions); return u; });
      setAiApplying(false); setAiDone(true);
      setTimeout(() => { setAiDone(false); setShowAiPanel(false); }, 2500);
    }, 1800);
  };

  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="rounded-lg"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Edit Product</h1>
            <p className="text-text-muted text-sm truncate max-w-[300px]">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/product/${slug}`} target="_blank">
            <Button variant="outline" className="rounded-lg text-sm">View on Store</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="rounded-lg">
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info + Specs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
            <label className="text-sm font-medium text-text block mb-1.5">Product Name</label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }}
              placeholder="Product name" className="rounded-lg mb-4" />
            <div className="flex border-b border-border mb-4">
              {(["description", "specs"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text"}`}>
                  {tab === "specs" ? "Specifications" : "Description"}
                </button>
              ))}
            </div>
            {activeTab === "description" && (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6}
                placeholder="Product description…"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
            )}
            {activeTab === "specs" && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted mb-2">Key/value specifications shown on the product page (e.g. RAM → 16GB)</p>
                {specs.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={row.key} onChange={(e) => setSpecs((p) => { const n = [...p]; n[i] = { ...n[i], key: e.target.value }; return n; })} placeholder="Spec name" className="rounded-lg flex-1 text-sm" />
                    <Input value={row.value} onChange={(e) => setSpecs((p) => { const n = [...p]; n[i] = { ...n[i], value: e.target.value }; return n; })} placeholder="Value" className="rounded-lg flex-1 text-sm" />
                    <button onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))} disabled={specs.length === 1} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setSpecs((p) => [...p, { key: "", value: "" }])} className="rounded-lg mt-1">
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Spec
                </Button>
              </div>
            )}
          </motion.div>

          {/* Product Media */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text">Product Media</h2>
              {images.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowAiPanel(!showAiPanel)} className="rounded-lg text-accent border-accent">
                  <Wand2 className="w-4 h-4 mr-2" />AI Enhance
                  {showAiPanel ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </Button>
              )}
            </div>

            {cameraMode && (
              <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  <Button onClick={capturePhoto} size="lg" className="rounded-full w-14 h-14 p-0"><Camera className="w-6 h-6" /></Button>
                  <Button onClick={stopCamera} variant="outline" size="sm" className="rounded-full bg-white/20 border-white text-white"><X className="w-4 h-4 mr-1" />Cancel</Button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {showAiPanel && images.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  <div className="bg-gradient-to-br from-[#0041a8]/5 to-[#0052cc]/10 border border-[#0052cc]/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-text mb-1">AI Image Enhancement</p>
                    <p className="text-xs text-text-muted mb-3">Select image and enhancements to apply:</p>
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setSelectedImageIdx(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIdx === i ? "border-accent" : "border-border"}`}>
                          <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {([
                        { key: "removeBg", label: "Remove Background", icon: <Layers className="w-4 h-4" /> },
                        { key: "crop", label: "Crop to Square", icon: <Crop className="w-4 h-4" /> },
                        { key: "proportional", label: "Proportional Fit", icon: <Maximize2 className="w-4 h-4" /> },
                        { key: "straighten", label: "Straighten", icon: <ScanLine className="w-4 h-4" /> },
                        { key: "upscale", label: "Upscale Quality", icon: <Zap className="w-4 h-4" /> },
                      ] as { key: keyof AiOptions; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                        <label key={key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none ${aiOptions[key] ? "bg-accent/10 border-accent text-accent" : "bg-white border-border text-text hover:border-accent/50"}`}>
                          <input type="checkbox" checked={aiOptions[key]} onChange={(e) => setAiOptions((p) => ({ ...p, [key]: e.target.checked }))} className="sr-only" />
                          {icon}{label}{aiOptions[key] && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={applyAiEnhancement} disabled={aiApplying} className="rounded-lg bg-accent hover:bg-accent/90 text-white text-sm">
                        {aiApplying ? <><svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Applying…</> : <><Sparkles className="w-4 h-4 mr-2" />Apply to Image {selectedImageIdx + 1}</>}
                      </Button>
                      {aiDone && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Done!</span>}
                    </div>
                    <p className="text-[11px] text-text-muted mt-2 flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />Background removal &amp; upscale require Cloudinary AI add-on.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {uploadingCount > 0 && (
              <div className="mb-3 flex items-center gap-2 text-sm text-accent bg-accent/5 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""}…
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i} onClick={() => setSelectedImageIdx(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-surface border-2 group cursor-pointer transition-all ${selectedImageIdx === i && showAiPanel ? "border-accent" : "border-border"}`}>
                  <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setImages((p) => p.filter((_, j) => j !== i)); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <Badge className="absolute bottom-2 left-2 text-[10px]">Main</Badge>}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-accent hover:bg-surface/50 transition-all group cursor-pointer">
                <Upload className="w-7 h-7 mx-auto mb-2 text-text-muted group-hover:text-accent transition-colors" />
                <p className="text-sm font-medium text-text">Upload Images</p>
                <p className="text-xs text-text-muted mt-0.5">PNG, JPG up to 10MB</p>
              </button>
              <button onClick={startCamera} className="flex-1 border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-accent hover:bg-surface/50 transition-all group cursor-pointer">
                <Camera className="w-7 h-7 mx-auto mb-2 text-text-muted group-hover:text-accent transition-colors" />
                <p className="text-sm font-medium text-text">Take Photo</p>
                <p className="text-xs text-text-muted mt-0.5">Use device camera</p>
              </button>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <label className="text-sm font-medium text-text flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-red-500" />Product Video (YouTube)
              </label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="rounded-lg text-sm" />
              {videoUrl && !embedUrl && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Invalid YouTube URL</p>}
              {embedUrl && (
                <div className="mt-3 rounded-xl overflow-hidden aspect-video border border-border">
                  <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Variants */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-text">Product Variants</h2>
                <p className="text-xs text-text-muted mt-0.5">e.g. Color: Red, Blue | Storage: 128GB, 256GB</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg"
                onClick={() => setVariants((p) => [...p, { name: "", options: [{ value: "", priceAdd: 0 }] }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add Option
              </Button>
            </div>
            {variants.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-sm text-text-muted">No variants added.</p>
                <p className="text-xs text-text-muted mt-1">Click &quot;Add Option&quot; to add Color, Size, Storage, etc.</p>
              </div>
            )}
            <div className="space-y-4">
              {variants.map((variant, vi) => (
                <div key={vi} className="bg-surface rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={variant.name}
                      onChange={(e) => setVariants((p) => { const n = [...p]; n[vi] = { ...n[vi], name: e.target.value }; return n; })}
                      placeholder="Option name (e.g. Color, Storage)"
                      className="rounded-lg flex-1 text-sm font-medium"
                    />
                    <button
                      onClick={() => setVariants((p) => p.filter((_, i) => i !== vi))}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {variant.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          value={opt.value}
                          onChange={(e) => setVariants((p) => {
                            const n = [...p]; n[vi] = { ...n[vi], options: n[vi].options.map((o, i) => i === oi ? { ...o, value: e.target.value } : o) }; return n;
                          })}
                          placeholder={`Option ${oi + 1} (e.g. Red)`}
                          className="rounded-lg text-sm flex-1"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">+GH₵</span>
                          <Input
                            type="number" min="0" step="0.01"
                            value={opt.priceAdd || ""}
                            onChange={(e) => setVariants((p) => {
                              const n = [...p]; n[vi] = { ...n[vi], options: n[vi].options.map((o, i) => i === oi ? { ...o, priceAdd: parseFloat(e.target.value) || 0 } : o) }; return n;
                            })}
                            placeholder="0"
                            className="rounded-lg text-sm pl-9"
                          />
                        </div>
                        {variant.options.length > 1 && (
                          <button
                            onClick={() => setVariants((p) => { const n = [...p]; n[vi] = { ...n[vi], options: n[vi].options.filter((_, i) => i !== oi) }; return n; })}
                            className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setVariants((p) => { const n = [...p]; n[vi] = { ...n[vi], options: [...n[vi].options, { value: "", priceAdd: 0 }] }; return n; })}
                    className="mt-2 text-xs text-accent hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" />Add value
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Cost Price (GH₵) <span className="text-text-muted font-normal text-xs">— internal</span></label>
                <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Selling Price (GH₵) <span className="text-red-500">*</span></label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="rounded-lg" />
              </div>
            </div>
            <ProfitBadge cost={costPrice} price={price} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Compare Price (GH₵)</label>
                <Input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="0.00" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Stock</label>
                <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="rounded-lg" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text">SKU</label>
              </div>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. INT00001" className="rounded-lg font-mono text-sm" />
            </div>
          </motion.div>
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">Status</h2>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="mt-4 space-y-3">
              {[{ label: "Featured product", val: featured, set: setFeatured }, { label: "New arrival", val: isNew, set: setIsNew }, { label: "On sale", val: onSale, set: setOnSale }].map(({ label, val, set }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                  <span className="text-sm text-text">{label}</span>
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Category <span className="text-red-500">*</span></label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                  <option value="">Select category</option>
                  {categories.filter((c: Any) => !c.parentId).map((cat: Any) =>
                    cat.children?.length > 0 ? (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>All {cat.name}</option>
                        {cat.children.map((sub: Any) => <option key={sub.id} value={sub.id}>&nbsp;&nbsp;↳ {sub.name}</option>)}
                      </optgroup>
                    ) : (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Brand</label>
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                  <option value="">Select brand</option>
                  {brands.map((b: Any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</label>
                  <button onClick={() => setTags(generateTags(name, selectedCatName, selectedBrandName))}
                    className="text-xs text-accent hover:underline flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />Auto-generate
                  </button>
                </div>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated tags" className="rounded-lg text-sm" />
              </div>
            </div>
          </motion.div>

          {costPrice && price && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Pricing Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Cost</span><span className="font-medium">GH₵{parseFloat(costPrice).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Selling</span><span className="font-medium">GH₵{parseFloat(price).toFixed(2)}</span></div>
                {comparePrice && <div className="flex justify-between"><span className="text-text-muted">Was</span><span className="line-through text-text-muted">GH₵{parseFloat(comparePrice).toFixed(2)}</span></div>}
                <div className="border-t border-border my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Gross Profit</span>
                  <span className={(parseFloat(price) - parseFloat(costPrice)) >= 0 ? "text-green-600" : "text-red-600"}>
                    GH₵{(parseFloat(price) - parseFloat(costPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
