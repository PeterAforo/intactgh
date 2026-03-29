"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import {
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Share2,
  ChevronRight,
  Check,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import { useCartStore, type CartProduct } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import ProductCard from "@/components/products/ProductCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [addedToCart, setAddedToCart] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => product ? s.isInWishlist(product.id) : false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/products/${slug}`).then(r => r.json()).then(d => {
      if (d.product) setProduct(d.product);
      if (d.relatedProducts) setRelatedProducts(d.relatedProducts);
    }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [selectedImage]);

  const discount = product?.comparePrice
    ? getDiscountPercentage(product.price, product.comparePrice)
    : 0;

  if (!product) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading product...</div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.images[0]?.url || "",
      stock: product.stock,
    };
    addItem(cartProduct, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-accent">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-accent">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/shop/${product.category.slug}`} className="hover:text-accent">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div ref={imageRef} className="relative aspect-square bg-surface rounded-2xl overflow-hidden mb-4">
              {product.images[selectedImage]?.url ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Package className="w-16 h-16 text-border" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">No Image</span>
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 text-sm">-{discount}%</Badge>
              )}
              {product.isNew && (
                <Badge variant="new" className="absolute top-4 right-4 text-sm">NEW</Badge>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img: Any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? "border-accent" : "border-border hover:border-accent/50"
                    }`}
                  >
                    <Image src={img.url} alt={img.alt || ""} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {product.brand && (
              <Link href={`/brands/${product.brand.slug}`} className="text-accent font-semibold text-sm uppercase tracking-wider mb-2 hover:underline">
                {product.brand.name}
              </Link>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? "text-gold fill-gold" : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-text-muted">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl md:text-4xl font-black text-accent">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xl text-text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="success" className="text-sm">Save {discount}%</Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-text-light leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {product.stock > 0 ? (
                <>
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-success">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-accent">Out of Stock</span>
              )}
              {product.sku && (
                <span className="text-xs text-text-muted ml-auto">SKU: {product.sku}</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-3 hover:bg-surface transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-3 font-semibold text-center min-w-[50px] border-x border-border">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-3 hover:bg-surface transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="xl"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 rounded-xl"
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isInWishlist
                    ? "border-accent bg-accent text-white"
                    : "border-border hover:border-accent hover:text-accent"
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Truck, label: "Free Delivery", desc: "Over GH₵3,000" },
                { icon: RotateCcw, label: "Easy Returns", desc: "5 days" },
                { icon: ShieldCheck, label: "Warranty", desc: "Guaranteed" },
              ].map((feature) => (
                <div key={feature.label} className="bg-surface rounded-xl p-3 text-center">
                  <feature.icon className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xs font-semibold text-text">{feature.label}</p>
                  <p className="text-[10px] text-text-muted">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Share2 className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Share this product</span>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex items-center gap-1 border-b border-border mb-8">
            {[
              { id: "description", label: "Description" },
              { id: "specs", label: "Specifications" },
              { id: "reviews", label: `Reviews (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none text-text-light leading-relaxed">
                <p>{product.description}</p>
                <p className="mt-4">
                  At Intact Ghana, we ensure all our products are 100% authentic and come with 
                  manufacturer warranty. Enjoy free delivery on orders over GH₵3,000 and our 
                  5-day money-back guarantee for complete peace of mind.
                </p>
              </div>
            )}
            {activeTab === "specs" && (
              <div className="space-y-3">
                {[
                  ["Brand", product.brand?.name || "N/A"],
                  ["Category", product.category.name],
                  ["SKU", product.sku || "N/A"],
                  ["Stock", `${product.stock} units`],
                  ["Condition", "Brand New"],
                  ["Warranty", "Manufacturer Warranty"],
                ].map(([key, value]) => (
                  <div key={key} className="flex items-center py-3 border-b border-border/50">
                    <span className="w-40 text-sm font-medium text-text">{key}</span>
                    <span className="text-sm text-text-light">{value}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center py-12 text-text-muted">
                <Star className="w-12 h-12 mx-auto mb-3 text-border" />
                <p className="text-lg font-medium mb-2">Customer reviews coming soon</p>
                <p className="text-sm">Be the first to review this product after purchase!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-text mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
