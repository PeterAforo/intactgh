"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Copy,
  Check,
  RefreshCw,
  Plus,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type ActiveTool = "image-enhancer" | "description-generator" | "chatbot-settings";

// ─────────────────────────────────────────────────────────────────────────────
// Image Enhancer sub-component
// ─────────────────────────────────────────────────────────────────────────────
function ImageEnhancerTool() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState("enhance");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setSelectedImage(ev.target?.result as string); setProcessedImage(null); setError(null); };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!selectedImage) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage, action: aiAction }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Processing failed"); return; }
      setProcessedImage(data.url);
      toast.success("Image enhanced successfully!");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => { setSelectedImage(null); setProcessedImage(null); setProcessing(false); setError(null); };

  const downloadImage = async () => {
    if (!processedImage) return;
    const a = document.createElement("a");
    a.href = processedImage;
    a.download = `enhanced-product-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  };

  const actions = [
    { id: "enhance", label: "Enhance Quality" },
    { id: "resize", label: "Resize & Crop (800×800)" },
    { id: "remove-bg", label: "Remove Background" },
    { id: "all", label: "Full Enhancement" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-bold text-text">Product Image Enhancer</h2>
          <p className="text-xs text-text-muted">Transform any product photo into a professional e-commerce image via Cloudinary AI</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {actions.map((action) => (
          <button key={action.id} onClick={() => setAiAction(action.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              aiAction === action.id ? "bg-accent text-white shadow-md" : "bg-surface text-text-light hover:bg-surface-dark"
            }`}>
            {action.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-text mb-3">Original Image</h3>
          {selectedImage ? (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border">
              <Image src={selectedImage} alt="Original" fill className="object-contain" />
              <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-surface/50">
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-lg">
                  <Upload className="w-4 h-4 mr-2" />Upload
                </Button>
                <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="rounded-lg">
                  <Camera className="w-4 h-4 mr-2" />Camera
                </Button>
              </div>
              <p className="text-xs text-text-muted">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-text mb-3">Enhanced Image</h3>
          <div className="aspect-square rounded-xl border border-border overflow-hidden bg-surface flex items-center justify-center">
            {processing ? (
              <div className="text-center p-6">
                <Wand2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
                <p className="font-bold text-text mb-1">Processing with Cloudinary AI...</p>
                <p className="text-xs text-text-muted">
                  {aiAction === "remove-bg" && "Removing background (requires Cloudinary add-on)..."}
                  {aiAction === "enhance" && "Enhancing image quality..."}
                  {aiAction === "resize" && "Resizing to 800×800..."}
                  {aiAction === "all" && "Applying full enhancement..."}
                </p>
                <div className="w-48 mx-auto bg-border rounded-full h-1.5 mt-4 overflow-hidden">
                  <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 8, ease: "linear" }} className="bg-accent h-full rounded-full" />
                </div>
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <Button size="sm" variant="outline" onClick={() => setError(null)} className="rounded-lg">Try Again</Button>
              </div>
            ) : processedImage ? (
              <div className="relative w-full h-full">
                <Image src={processedImage} alt="Enhanced" fill className="object-contain" unoptimized />
                <div className="absolute bottom-3 right-3">
                  <Button size="sm" onClick={downloadImage} className="rounded-lg shadow-lg">
                    <Download className="w-3.5 h-3.5 mr-1" />Download
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="bg-success text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />AI Enhanced
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

      {selectedImage && !processedImage && !error && (
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
            <RotateCcw className="w-4 h-4 mr-2" />Process Another
          </Button>
          <Button onClick={() => { navigator.clipboard.writeText(processedImage); toast.success("URL copied!"); }} variant="outline" className="rounded-lg">
            <Copy className="w-4 h-4 mr-2" />Copy URL
          </Button>
        </div>
      )}

      <div className="mt-6 bg-accent/5 rounded-xl p-4 text-xs text-text-light space-y-1">
        <p className="font-semibold text-text mb-1">How it works:</p>
        <p>• <strong>Enhance Quality</strong> — Auto-improves brightness, contrast & sharpness using Cloudinary AI</p>
        <p>• <strong>Resize & Crop</strong> — Centers product and pads to 800×800px with white background</p>
        <p>• <strong>Remove Background</strong> — Requires Cloudinary Background Removal add-on (paid plan)</p>
        <p>• <strong>Full Enhancement</strong> — Combines all transformations for best result</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Description Generator sub-component
// ─────────────────────────────────────────────────────────────────────────────
function DescriptionGeneratorTool() {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!productName.trim()) { toast.error("Enter a product name first"); return; }
    setGenerating(true);
    setDescription("");
    try {
      const res = await fetch("/api/admin/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, brand, category, features, tone }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Generation failed"); return; }
      setDescription(data.description);
      toast.success("Description generated!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Description copied to clipboard!");
  };

  const wordCount = description.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-info" />
        </div>
        <div>
          <h2 className="font-bold text-text">AI Product Description Generator</h2>
          <p className="text-xs text-text-muted">Generate compelling HTML descriptions using GPT-4o</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Product Name <span className="text-red-500">*</span></label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. HP EliteBook 840 G10" className="rounded-lg" />
        </div>
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Brand</label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. HP" className="rounded-lg" />
        </div>
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Category</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Laptops" className="rounded-lg" />
        </div>
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}
            className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
            <option value="professional">Professional</option>
            <option value="casual">Casual & Friendly</option>
            <option value="technical">Technical / Spec-focused</option>
            <option value="sales">Sales / Persuasive</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-text block mb-1.5">Key Features / Specifications</label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder={"e.g.\n- Intel Core i7-1355U, 16GB RAM\n- 512GB NVMe SSD\n- 14\" FHD IPS display\n- Windows 11 Pro"}
            rows={4}
            className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Button onClick={generate} disabled={generating || !productName.trim()} className="rounded-lg">
          {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Description</>}
        </Button>
        {description && (
          <Button onClick={generate} disabled={generating} variant="outline" className="rounded-lg">
            <RefreshCw className="w-4 h-4 mr-2" />Regenerate
          </Button>
        )}
      </div>

      {description && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-surface px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text">Generated Description</span>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{wordCount} words</span>
            </div>
            <button onClick={copy} className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
          <div className="p-4">
            <div className="prose prose-sm max-w-none text-text-light" dangerouslySetInnerHTML={{ __html: description }} />
          </div>
          <div className="bg-surface px-4 py-2 border-t border-border">
            <p className="text-xs text-text-muted font-mono truncate">{description.slice(0, 80)}...</p>
          </div>
        </div>
      )}

      {!description && !generating && (
        <div className="bg-accent/5 rounded-xl p-4 text-xs text-text-light">
          <p className="font-semibold text-text mb-1">Tips for best results:</p>
          <p>• Include specific specs like processor, RAM, storage, screen size</p>
          <p>• Mention any unique features or selling points</p>
          <p>• Choose <strong>Technical</strong> tone for laptops/computers, <strong>Casual</strong> for accessories</p>
          <p>• Generated HTML works directly in the product description field</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chatbot Settings sub-component
// ─────────────────────────────────────────────────────────────────────────────
function ChatbotSettingsTool() {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [botName, setBotName] = useState("Kwaku");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi there! 👋 I'm **Kwaku**, your personal shopping assistant for Intact Ghana. I can help you find products, track orders, answer questions, and more. How can I help you today?"
  );
  const [personality, setPersonality] = useState(
    "Friendly, helpful, knowledgeable about electronics. Stays on-topic for Intact Ghana products. Uses simple language and guides customers to the right products."
  );
  const [quickReplies, setQuickReplies] = useState([
    "🛍️ Browse products",
    "📦 Track my order",
    "💳 Payment options",
    "🔄 Return policy",
  ]);
  const [newReply, setNewReply] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) {
        const s = data.settings;
        if (s.chatbot_enabled !== undefined) setEnabled(s.chatbot_enabled === "true");
        if (s.chatbot_name) setBotName(s.chatbot_name);
        if (s.chatbot_welcome) setWelcomeMessage(s.chatbot_welcome);
        if (s.chatbot_personality) setPersonality(s.chatbot_personality);
        if (s.chatbot_quick_replies) {
          try { setQuickReplies(JSON.parse(s.chatbot_quick_replies)); } catch { /* keep default */ }
        }
      }
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbot_enabled: String(enabled),
          chatbot_name: botName,
          chatbot_welcome: welcomeMessage,
          chatbot_personality: personality,
          chatbot_quick_replies: JSON.stringify(quickReplies),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Chatbot settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addReply = () => {
    const t = newReply.trim();
    if (!t || quickReplies.includes(t)) return;
    setQuickReplies([...quickReplies, t]);
    setNewReply("");
  };

  const removeReply = (i: number) => setQuickReplies(quickReplies.filter((_, idx) => idx !== i));

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-bold text-text">Chatbot Settings</h2>
            <p className="text-xs text-text-muted">Configure Kwaku — your AI shopping assistant</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-lg">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
          <div>
            <p className="text-sm font-semibold text-text">Chatbot Enabled</p>
            <p className="text-xs text-text-muted">Show the AI chat widget on the storefront</p>
          </div>
          <button onClick={() => setEnabled(!enabled)} className="flex items-center gap-2">
            {enabled
              ? <ToggleRight className="w-10 h-10 text-success" />
              : <ToggleLeft className="w-10 h-10 text-border" />}
            <span className={`text-sm font-medium ${enabled ? "text-success" : "text-text-muted"}`}>
              {enabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Bot Name</label>
          <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Kwaku" className="rounded-lg max-w-xs" />
          <p className="text-xs text-text-muted mt-1">The name customers see in the chat widget</p>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Welcome Message</label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={3}
            className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent resize-none"
            placeholder="Hi there! I'm your shopping assistant..."
          />
          <p className="text-xs text-text-muted mt-1">Supports **bold** markdown. Shown when chat opens.</p>
        </div>

        {/* Personality */}
        <div>
          <label className="text-sm font-medium text-text block mb-1.5">Personality / Behavior</label>
          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            rows={3}
            className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent resize-none"
            placeholder="Friendly and helpful, focused on electronics..."
          />
          <p className="text-xs text-text-muted mt-1">Describes the bot&apos;s personality and behavior guidelines to the AI</p>
        </div>

        {/* Quick Replies */}
        <div>
          <label className="text-sm font-medium text-text block mb-3">Quick Reply Buttons</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReplies.map((r, i) => (
              <div key={i} className="flex items-center gap-1 bg-surface border border-border rounded-full px-3 py-1.5">
                <span className="text-sm text-text">{r}</span>
                <button onClick={() => removeReply(i)} className="ml-1 text-text-muted hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addReply()}
              placeholder="e.g. 🔥 Best deals"
              className="rounded-lg"
            />
            <Button onClick={addReply} variant="outline" className="rounded-lg shrink-0">
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-1">Shown as clickable buttons when chat opens. Max 4 recommended. Supports emojis.</p>
        </div>

        {/* Preview */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs font-semibold text-text mb-3">Preview</p>
          <div className="bg-white rounded-xl border border-border p-4 max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-text">{botName || "Bot"}</span>
            </div>
            <div className="bg-surface rounded-lg p-3 text-xs text-text-light mb-3">
              {welcomeMessage.replace(/\*\*/g, "")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickReplies.slice(0, 4).map((r, i) => (
                <span key={i} className="bg-accent/10 text-accent text-[10px] px-2 py-1 rounded-full">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminAiToolsPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("image-enhancer");

  const tools = [
    {
      id: "image-enhancer" as ActiveTool,
      icon: ImageIcon,
      title: "Product Image Enhancer",
      description: "Upload a product photo — AI will enhance quality, resize, or remove background via Cloudinary.",
      color: "bg-accent/10 text-accent",
    },
    {
      id: "description-generator" as ActiveTool,
      icon: MessageSquare,
      title: "AI Product Description",
      description: "Generate compelling HTML product descriptions from name and key features using GPT-4o.",
      color: "bg-info/10 text-info",
    },
    {
      id: "chatbot-settings" as ActiveTool,
      icon: Bot,
      title: "Chatbot Settings",
      description: "Configure the AI chatbot name, welcome message, quick replies and personality.",
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">AI Tools</h1>
        <p className="text-text-muted text-sm mt-1">AI-powered tools to enhance your store</p>
      </div>

      {/* Tool selector cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveTool(tool.id)}
            className={`text-left bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-md ${
              activeTool === tool.id ? "border-accent shadow-md" : "border-border hover:border-accent/50"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
              <tool.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-text mb-2">{tool.title}</h3>
            <p className="text-sm text-text-light leading-relaxed">{tool.description}</p>
            {activeTool === tool.id && (
              <span className="inline-block mt-3 text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Active</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Active tool */}
      <motion.div key={activeTool} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {activeTool === "image-enhancer" && <ImageEnhancerTool />}
        {activeTool === "description-generator" && <DescriptionGeneratorTool />}
        {activeTool === "chatbot-settings" && <ChatbotSettingsTool />}
      </motion.div>
    </div>
  );
}
