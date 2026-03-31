"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  Check,
  Truck,
  MapPin,
  Store,
  Wallet,
  Clock,
  Loader2,
  LocateFixed,
  UserPlus,
  Eye,
  EyeOff,
  Package,
  AlertCircle,
  Bike,
  Car,
  Gift,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

type PaymentMethod = "cod" | "pickup" | "hubtel" | "canpay";
type DeliveryOption = "yango" | "bolt" | "pickup" | "standard";

// Store coordinates (Intact Ghana - East Legon, A&C Mall, Greater Accra, Ghana)
const STORE_LOCATION = { lat: 5.6369, lng: -0.1654, address: "East Legon, A&C Mall, Greater Accra, Ghana" };

const STORE_LOCATIONS = [
  { id: "accra", name: "Accra Main - East Legon (A&C Mall)", region: "Greater Accra" },
  { id: "kumasi", name: "Kumasi Branch - Adum", region: "Ashanti" },
  { id: "takoradi", name: "Takoradi Branch - Market Circle", region: "Western" },
];

const DELIVERY_PROVIDERS = [
  {
    id: "yango" as const,
    name: "Yango Delivery",
    icon: Car,
    desc: "Fast delivery via Yango — usually within 1-3 hours",
    estimatedTime: "1-3 hours",
    baseFee: 25,
    color: "text-[#FF5A36]",
    bgColor: "bg-[#FF5A36]",
  },
  {
    id: "bolt" as const,
    name: "Bolt Delivery",
    icon: Bike,
    desc: "Affordable delivery by Bolt courier",
    estimatedTime: "1-4 hours",
    baseFee: 20,
    color: "text-[#34D186]",
    bgColor: "bg-[#34D186]",
  },
  {
    id: "standard" as const,
    name: "Standard Delivery",
    icon: Truck,
    desc: "Intact Ghana dispatch — 2-5 business days",
    estimatedTime: "2-5 days",
    baseFee: 50,
    color: "text-accent",
    bgColor: "bg-accent",
  },
  {
    id: "pickup" as const,
    name: "Pickup from Store",
    icon: Store,
    desc: "Collect from any Intact Ghana location — no delivery fee",
    estimatedTime: "Ready in 24hrs",
    baseFee: 0,
    color: "text-gold",
    bgColor: "bg-gold",
  },
];

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo",
  "Oti", "North East", "Savannah", "Western North",
];

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("hubtel");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("yango");
  const [pickupStoreId, setPickupStoreId] = useState("accra");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [wantsAccount, setWantsAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<{ fee: number; time: string } | null>(null);
  const [estimatingDelivery, setEstimatingDelivery] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardApplied, setGiftCardApplied] = useState<{ code: string; pin: string; balance: number; applied: number } | null>(null);
  const [giftCardChecking, setGiftCardChecking] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setLoggedInUserId(d.user.id);
          setIsLoggedIn(true);
          const nameParts = (d.user.name || "").split(" ");
          setShipping((prev) => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(" ") || prev.lastName,
            email: d.user.email || prev.email,
            phone: d.user.phone || prev.phone,
          }));
        } else {
          // Guest: try pre-fill from Kwaku chatbot session
          try {
            const prefill = JSON.parse(sessionStorage.getItem("kwaku_prefill") ?? "{}");
            if (prefill.firstName || prefill.phone) {
              setShipping((prev) => ({
                ...prev,
                firstName: prefill.firstName || prev.firstName,
                phone: prefill.phone || prev.phone,
              }));
              sessionStorage.removeItem("kwaku_prefill");
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    region: "",
    gpsAddress: "",
    lat: "",
    lng: "",
    notes: "",
    password: "",
    confirmPassword: "",
  });

  const subtotal = getTotal();
  const selectedProvider = DELIVERY_PROVIDERS.find((p) => p.id === deliveryOption);
  const deliveryFee =
    deliveryOption === "pickup"
      ? 0
      : deliveryEstimate
      ? deliveryEstimate.fee
      : selectedProvider?.baseFee || 0;
  const freeDeliveryThreshold = 3000;
  const finalDeliveryFee = subtotal >= freeDeliveryThreshold && deliveryOption === "standard" ? 0 : deliveryFee;
  const giftCardDiscount = giftCardApplied ? Math.min(giftCardApplied.applied, subtotal + finalDeliveryFee) : 0;
  const total = subtotal + finalDeliveryFee - giftCardDiscount;

  // --- Validation ---
  const validateShipping = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!shipping.firstName.trim()) e.firstName = "First name is required";
    if (!shipping.lastName.trim()) e.lastName = "Last name is required";
    if (!shipping.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) e.email = "Invalid email address";
    if (!shipping.phone.trim()) e.phone = "Phone number is required";
    else if (shipping.phone.replace(/\s/g, "").length < 10) e.phone = "Enter a valid phone number";
    if (!shipping.street.trim()) e.street = "Street address is required";
    if (!shipping.city.trim()) e.city = "City is required";
    if (!shipping.region) e.region = "Region is required";
    if (wantsAccount) {
      if (!shipping.password) e.password = "Password is required";
      else if (shipping.password.length < 8) e.password = "Password must be at least 8 characters";
      if (shipping.password !== shipping.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [shipping, wantsAccount]);

  // --- GPS Location ---
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setShipping((prev) => ({
          ...prev,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          gpsAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        // Try reverse geocoding with Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "User-Agent": "IntactGhana/1.0" } }
          );
          const data = await res.json();
          if (data.display_name) {
            setShipping((prev) => ({
              ...prev,
              gpsAddress: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.village || prev.city,
              street: data.address?.road ? `${data.address.house_number || ""} ${data.address.road}`.trim() : prev.street,
            }));
          }
        } catch {
          // GPS coords already set, geocoding is a bonus
        }
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied. Please enable location access in your browser settings.");
        } else {
          alert("Could not get your location. Please enter your address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // --- Delivery Estimation ---
  const estimateDeliveryFee = useCallback(async (provider: DeliveryOption) => {
    if (provider === "pickup" || provider === "standard") {
      setDeliveryEstimate(null);
      return;
    }
    if (!shipping.lat || !shipping.lng) return;

    setEstimatingDelivery(true);
    try {
      const res = await fetch("/api/delivery/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          pickupLat: STORE_LOCATION.lat,
          pickupLng: STORE_LOCATION.lng,
          dropoffLat: parseFloat(shipping.lat),
          dropoffLng: parseFloat(shipping.lng),
          pickupAddress: STORE_LOCATION.address,
          dropoffAddress: shipping.gpsAddress || shipping.street,
        }),
      });
      const data = await res.json();
      if (data.fee !== undefined) {
        setDeliveryEstimate({ fee: data.fee, time: data.estimatedTime || selectedProvider?.estimatedTime || "" });
      }
    } catch {
      // Fall back to base fee
      setDeliveryEstimate(null);
    }
    setEstimatingDelivery(false);
  }, [shipping.lat, shipping.lng, shipping.gpsAddress, shipping.street, selectedProvider?.estimatedTime]);

  // --- Step Navigation ---
  const goToStep = (target: number) => {
    if (target === 2 && step === 1) {
      if (!validateShipping()) return;
    }
    setStep(target);
  };

  // --- Place Order ---
  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      if (paymentMethod === "hubtel") {
        const description = items.map((i) => `${i.product.name} x${i.quantity}`).join(", ");
        const res = await fetch("/api/payments/hubtel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: shipping.email,
            amount: total,
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            phone: shipping.phone,
            label: description,
          }),
        });
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      } else if (paymentMethod === "canpay") {
        // 1. Create order first so callback can find it by orderNumber
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price })),
            shipping: {
              firstName: shipping.firstName, lastName: shipping.lastName,
              email: shipping.email, phone: shipping.phone,
              street: shipping.street, city: shipping.city,
              region: shipping.region, notes: shipping.notes,
            },
            subtotal, deliveryFee: finalDeliveryFee, total, giftCardCode: giftCardApplied?.code,
            paymentMethod: "canpay",
            ...(loggedInUserId ? { userId: loggedInUserId } : {}),
          }),
        });
        const orderData = await orderRes.json();
        const pendingOrderNumber = orderData.order?.orderNumber;

        // 2. Call CanPay with the real order number
        const description = items.map((i) => `${i.product.name} x${i.quantity}`).join(", ");
        const cpRes = await fetch("/api/payments/canpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total, description,
            customerName: `${shipping.firstName} ${shipping.lastName}`,
            customerEmail: shipping.email,
            orderNumber: pendingOrderNumber,
          }),
        });
        const cpData = await cpRes.json();
        if (cpData.redirectUrl) {
          clearCart();
          window.location.href = cpData.redirectUrl;
          return;
        }
        // CanPay not configured — show success with the created order
        if (pendingOrderNumber) {
          setOrderNumber(pendingOrderNumber);
          setOrderPlaced(true);
          clearCart();
        }
        return;
      }

      // COD / Pickup — place order directly
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price })),
          shipping: {
            firstName: shipping.firstName,
            lastName: shipping.lastName,
            email: shipping.email,
            phone: shipping.phone,
            street: shipping.street,
            city: shipping.city,
            region: shipping.region,
            notes: shipping.notes,
          },
          subtotal,
          deliveryFee: finalDeliveryFee,
          total,
          paymentMethod,
          giftCardCode: giftCardApplied?.code,
          ...(loggedInUserId ? { userId: loggedInUserId } : {}),
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.order?.orderNumber) {
        setOrderNumber(orderData.order.orderNumber);
        if (giftCardApplied) {
          await fetch("/api/gift-cards/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: giftCardApplied.code, pin: giftCardApplied.pin,
              amountToUse: giftCardApplied.applied,
              orderId: orderData.order.orderNumber,
            }),
          });
        }
      }
      setOrderPlaced(true);
      clearCart();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Field helper ---
  const fieldClass = (name: string) =>
    `rounded-lg ${errors[name] ? "border-red-400 ring-1 ring-red-400" : ""}`;

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {errors[name]}
      </p>
    ) : null;

  // ========== ORDER PLACED ==========
  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-3">Order Placed!</h1>
          <p className="text-text-muted mb-2">Thank you for shopping with Intact Ghana.</p>
          <p className="text-sm text-text-light mb-8">
            Your order <span className="font-mono font-bold text-accent">{orderNumber || "Processing..."}</span> has
            been confirmed. You&apos;ll receive an email confirmation shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop">
              <Button size="lg" className="rounded-xl">Continue Shopping</Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" size="lg" className="rounded-xl">View Orders</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== EMPTY CART ==========
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-text mb-3">Your cart is empty</h1>
        <p className="text-text-muted mb-6">Add some products before checking out.</p>
        <Link href="/shop">
          <Button size="lg" className="rounded-xl">Go to Shop</Button>
        </Link>
      </div>
    );
  }

  // ========== MAIN CHECKOUT ==========
  const STEPS = [
    { num: 1, label: "Shipping" },
    { num: 2, label: "Delivery" },
    { num: 3, label: "Payment" },
    { num: 4, label: "Review" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Checkout</h1>
            <p className="text-sm text-text-muted">Complete your order</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => s.num <= step && goToStep(s.num)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  step === s.num
                    ? "bg-accent text-white shadow-md"
                    : step > s.num
                    ? "bg-success/10 text-success cursor-pointer"
                    : "bg-white text-text-muted border border-border"
                }`}
              >
                {step > s.num ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                    {s.num}
                  </span>
                )}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border min-w-4" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">

            {/* ==================== STEP 1: SHIPPING ==================== */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-bold text-text">Shipping Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={shipping.firstName}
                        onChange={(e) => { setShipping({ ...shipping, firstName: e.target.value }); setErrors((p) => ({ ...p, firstName: "" })); }}
                        placeholder="Kwame"
                        className={fieldClass("firstName")}
                      />
                      <FieldError name="firstName" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={shipping.lastName}
                        onChange={(e) => { setShipping({ ...shipping, lastName: e.target.value }); setErrors((p) => ({ ...p, lastName: "" })); }}
                        placeholder="Mensah"
                        className={fieldClass("lastName")}
                      />
                      <FieldError name="lastName" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={shipping.email}
                        onChange={(e) => { setShipping({ ...shipping, email: e.target.value }); setErrors((p) => ({ ...p, email: "" })); }}
                        placeholder="kwame@email.com"
                        className={fieldClass("email")}
                      />
                      <FieldError name="email" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={shipping.phone}
                        onChange={(e) => { setShipping({ ...shipping, phone: e.target.value }); setErrors((p) => ({ ...p, phone: "" })); }}
                        placeholder="024 XXX XXXX"
                        className={fieldClass("phone")}
                      />
                      <FieldError name="phone" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-text block mb-1.5">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={shipping.street}
                        onChange={(e) => { setShipping({ ...shipping, street: e.target.value }); setErrors((p) => ({ ...p, street: "" })); }}
                        placeholder="123 Main Street"
                        className={fieldClass("street")}
                      />
                      <FieldError name="street" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={shipping.city}
                        onChange={(e) => { setShipping({ ...shipping, city: e.target.value }); setErrors((p) => ({ ...p, city: "" })); }}
                        placeholder="Accra"
                        className={fieldClass("city")}
                      />
                      <FieldError name="city" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">
                        Region <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shipping.region}
                        onChange={(e) => { setShipping({ ...shipping, region: e.target.value }); setErrors((p) => ({ ...p, region: "" })); }}
                        className={`w-full bg-surface border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent ${errors.region ? "border-red-400 ring-1 ring-red-400" : "border-border"}`}
                      >
                        <option value="">Select Region</option>
                        {GHANA_REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <FieldError name="region" />
                    </div>

                    {/* GPS Location */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-text block mb-1.5">
                        GPS / Digital Address
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={shipping.gpsAddress}
                          onChange={(e) => setShipping({ ...shipping, gpsAddress: e.target.value })}
                          placeholder="e.g. GA-145-7890 or click to detect"
                          className="rounded-lg flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={gpsLoading}
                          className="rounded-lg shrink-0 gap-2"
                        >
                          {gpsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LocateFixed className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{gpsLoading ? "Locating..." : "My Location"}</span>
                        </Button>
                      </div>
                      {shipping.lat && shipping.lng && (
                        <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Location detected: {shipping.lat}, {shipping.lng}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-text block mb-1.5">Order Notes (optional)</label>
                      <textarea
                        value={shipping.notes}
                        onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                        placeholder="Any special instructions for delivery..."
                        rows={3}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Register Option - only for guests */}
                {isLoggedIn && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-700 font-medium">You&apos;re signed in — your order will be linked to your account automatically.</p>
                  </div>
                )}
                {!isLoggedIn && <div className="bg-white rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <UserPlus className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-bold text-text">Create an Account?</h2>
                  </div>
                  <p className="text-sm text-text-muted mb-4">
                    Save your details for faster checkout next time, track orders, and earn rewards.
                  </p>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setWantsAccount(false)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        !wantsAccount
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border text-text-muted hover:border-accent/30"
                      }`}
                    >
                      Continue as Guest
                    </button>
                    <button
                      onClick={() => setWantsAccount(true)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        wantsAccount
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border text-text-muted hover:border-accent/30"
                      }`}
                    >
                      <UserPlus className="w-4 h-4 inline mr-1.5" />
                      Create Account
                    </button>
                  </div>

                  {wantsAccount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                    >
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={shipping.password}
                            onChange={(e) => { setShipping({ ...shipping, password: e.target.value }); setErrors((p) => ({ ...p, password: "" })); }}
                            placeholder="Min. 8 characters"
                            className={`${fieldClass("password")} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FieldError name="password" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text block mb-1.5">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={shipping.confirmPassword}
                          onChange={(e) => { setShipping({ ...shipping, confirmPassword: e.target.value }); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                          placeholder="Re-enter password"
                          className={fieldClass("confirmPassword")}
                        />
                        <FieldError name="confirmPassword" />
                      </div>
                    </motion.div>
                  )}
                </div>}

                <div className="flex justify-end">
                  <Button onClick={() => goToStep(2)} size="lg" className="rounded-xl">
                    Continue to Delivery
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 2: DELIVERY ==================== */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-text">Delivery Method</h2>
                </div>

                {!shipping.lat && deliveryOption !== "pickup" && deliveryOption !== "standard" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Location not detected</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Go back to Shipping and use &quot;My Location&quot; to get GPS coordinates for accurate delivery pricing from Yango/Bolt.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {DELIVERY_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setDeliveryOption(provider.id);
                        if (provider.id === "pickup") {
                          setPaymentMethod("pickup");
                        } else if (paymentMethod === "pickup") {
                          setPaymentMethod("hubtel");
                        }
                        if (provider.id === "yango" || provider.id === "bolt") {
                          estimateDeliveryFee(provider.id);
                        } else {
                          setDeliveryEstimate(null);
                        }
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryOption === provider.id
                          ? "border-accent bg-accent/5 shadow-sm"
                          : "border-border hover:border-accent/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        deliveryOption === provider.id ? `${provider.bgColor} text-white` : "bg-surface text-text-muted"
                      }`}>
                        <provider.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text">{provider.name}</p>
                          {provider.id === "pickup" && (
                            <span className="bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{provider.desc}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-medium text-text-light">
                            {provider.id === "pickup" ? "Free" : `From ${formatPrice(provider.baseFee)}`}
                          </span>
                          <span className="text-xs text-text-muted">• {provider.estimatedTime}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        deliveryOption === provider.id ? "border-accent" : "border-border"
                      }`}>
                        {deliveryOption === provider.id && (
                          <div className="w-2.5 h-2.5 bg-accent rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pickup store selector */}
                {deliveryOption === "pickup" && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="w-4 h-4 text-gold" />
                      <p className="text-sm font-medium text-text">Select Pickup Location</p>
                    </div>
                    <div className="space-y-2">
                      {STORE_LOCATIONS.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => setPickupStoreId(store.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            pickupStoreId === store.id
                              ? "border-accent bg-accent/5"
                              : "border-border bg-white hover:border-accent/30"
                          }`}
                        >
                          <p className="text-sm font-medium text-text">{store.name}</p>
                          <p className="text-xs text-text-muted">{store.region} Region</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-3">
                      Your order will be ready within 24 hours. You&apos;ll receive an SMS when ready.
                    </p>
                  </div>
                )}

                {/* Delivery estimate */}
                {(deliveryOption === "yango" || deliveryOption === "bolt") && deliveryEstimate && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">Estimated Delivery Fee</p>
                        <p className="text-xs text-text-muted">Based on your location</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-accent">{formatPrice(deliveryEstimate.fee)}</p>
                        <p className="text-xs text-text-muted">{deliveryEstimate.time}</p>
                      </div>
                    </div>
                  </div>
                )}

                {estimatingDelivery && (
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Estimating delivery fee...
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">Back</Button>
                  <Button onClick={() => goToStep(3)} size="lg" className="rounded-xl">
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 3: PAYMENT ==================== */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-text">Payment Method</h2>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    {
                      id: "hubtel" as const,
                      icon: Wallet,
                      label: "Pay with Hubtel",
                      desc: "MoMo, Visa, Mastercard — instant secure checkout",
                      badge: "Recommended",
                      badgeColor: "bg-success",
                    },
                    {
                      id: "canpay" as const,
                      icon: Clock,
                      label: "Pay with CanPay BNPL",
                      desc: "Buy Now, Pay Later — split into easy installments",
                      badge: "Buy Now Pay Later",
                      badgeColor: "bg-[#0A7BFF]",
                    },
                    {
                      id: "cod" as const,
                      icon: Banknote,
                      label: "Payment on Delivery",
                      desc: "Pay cash when your order arrives at your doorstep",
                      badge: null,
                      badgeColor: "",
                      hidden: deliveryOption === "pickup",
                    },
                    {
                      id: "pickup" as const,
                      icon: Store,
                      label: "Pay at Store",
                      desc: "Pay when you collect your order at the store",
                      badge: "No delivery fee",
                      badgeColor: "bg-gold",
                      hidden: deliveryOption !== "pickup",
                    },
                  ]
                    .filter((m) => !m.hidden)
                    .map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === method.id
                            ? "border-accent bg-accent/5 shadow-sm"
                            : "border-border hover:border-accent/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === method.id ? "bg-accent text-white" : "bg-surface text-text-muted"
                        }`}>
                          <method.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text">{method.label}</p>
                            {method.badge && (
                              <span className={`${method.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                                {method.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">{method.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id ? "border-accent" : "border-border"
                        }`}>
                          {paymentMethod === method.id && (
                            <div className="w-2.5 h-2.5 bg-accent rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>

                {paymentMethod === "hubtel" && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-success" />
                      <p className="text-sm font-medium text-text">Hubtel Secure Checkout</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      You&apos;ll be redirected to Hubtel&apos;s secure payment page to complete your purchase via MTN MoMo, Vodafone Cash, AirtelTigo Money, Visa, or Mastercard.
                    </p>
                  </div>
                )}
                {paymentMethod === "canpay" && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#0A7BFF]" />
                      <p className="text-sm font-medium text-text">CanPay Buy Now, Pay Later</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      You&apos;ll be redirected to CanPay to set up your installment plan. Split your payment into manageable monthly installments with 0% interest.
                    </p>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="w-4 h-4 text-accent" />
                      <p className="text-sm font-medium text-text">Payment on Delivery</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      Pay with cash or mobile money when your order is delivered. Please have the exact amount ready.
                    </p>
                  </div>
                )}
                {paymentMethod === "pickup" && (
                  <div className="bg-surface rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-gold" />
                      <p className="text-sm font-medium text-text">Pay at Store</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      Pay when you collect your order. We accept cash, mobile money, and card payments at all locations.
                    </p>
                  </div>
                )}

                {/* Gift Card */}
                <div className="bg-surface rounded-xl p-4 mb-6 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold text-text">Apply Gift Card</p>
                  </div>
                  {giftCardApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-xs font-mono font-bold text-green-800">{giftCardApplied.code}</p>
                        <p className="text-xs text-green-700">GH₵{giftCardApplied.applied.toFixed(2)} discount applied</p>
                      </div>
                      <button onClick={() => setGiftCardApplied(null)} className="p-1 rounded-lg hover:bg-green-100">
                        <X className="w-4 h-4 text-green-700" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          placeholder="INTGC-XXXX-XXXX-XXXX" className="rounded-lg flex-1 font-mono text-xs" />
                        <Input value={giftCardPin} onChange={(e) => setGiftCardPin(e.target.value)}
                          placeholder="PIN" maxLength={6} className="rounded-lg w-20 font-mono text-center" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full rounded-lg" disabled={giftCardChecking}
                        onClick={async () => {
                          if (!giftCardCode.trim() || !giftCardPin.trim()) return;
                          setGiftCardChecking(true);
                          try {
                            const res = await fetch("/api/gift-cards/validate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ code: giftCardCode.trim(), pin: giftCardPin.trim() }),
                            });
                            const data = await res.json();
                            if (!res.ok) { alert(data.error || "Invalid gift card"); return; }
                            const applyAmt = Math.min(data.balance, subtotal + finalDeliveryFee);
                            setGiftCardApplied({ code: data.code, pin: giftCardPin.trim(), balance: data.balance, applied: applyAmt });
                            setGiftCardCode(""); setGiftCardPin("");
                          } catch { alert("Could not validate gift card."); }
                          finally { setGiftCardChecking(false); }
                        }}>
                        {giftCardChecking ? "Checking…" : "Apply Gift Card"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">Back</Button>
                  <Button onClick={() => goToStep(4)} size="lg" className="rounded-xl">
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 4: REVIEW ==================== */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Shipping summary */}
                <div className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      Shipping Address
                    </h3>
                    <button onClick={() => setStep(1)} className="text-sm text-accent hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-text">{shipping.firstName} {shipping.lastName}</p>
                  <p className="text-sm text-text-light">{shipping.street}</p>
                  <p className="text-sm text-text-light">{shipping.city}{shipping.region ? `, ${shipping.region}` : ""}</p>
                  <p className="text-sm text-text-light">{shipping.phone}</p>
                  {shipping.gpsAddress && (
                    <p className="text-xs text-text-muted mt-1">GPS: {shipping.gpsAddress}</p>
                  )}
                </div>

                {/* Delivery summary */}
                <div className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text flex items-center gap-2">
                      <Truck className="w-4 h-4 text-accent" />
                      Delivery Method
                    </h3>
                    <button onClick={() => setStep(2)} className="text-sm text-accent hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-text">{selectedProvider?.name}</p>
                  <p className="text-xs text-text-muted">
                    {deliveryOption === "pickup"
                      ? `Pickup from: ${STORE_LOCATIONS.find((s) => s.id === pickupStoreId)?.name}`
                      : `Est. ${selectedProvider?.estimatedTime} • ${finalDeliveryFee === 0 ? "FREE" : formatPrice(finalDeliveryFee)}`}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-text flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-accent" />
                      Payment Method
                    </h3>
                    <button onClick={() => setStep(3)} className="text-sm text-accent hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-text">
                    {paymentMethod === "hubtel" && "Hubtel (MoMo / Card)"}
                    {paymentMethod === "canpay" && "CanPay Buy Now Pay Later"}
                    {paymentMethod === "cod" && "Payment on Delivery"}
                    {paymentMethod === "pickup" && "Pay at Store"}
                  </p>
                </div>

                {/* Items */}
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-text mb-4">
                    <Package className="w-4 h-4 text-accent inline mr-2" />
                    Order Items ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{item.product.name}</p>
                          <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-text shrink-0">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(3)} className="rounded-xl">Back</Button>
                  <Button onClick={handlePlaceOrder} size="lg" className="rounded-xl" disabled={isProcessing}>
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : paymentMethod === "hubtel" ? (
                      <><Wallet className="w-4 h-4 mr-2" /> Pay with Hubtel — {formatPrice(total)}</>
                    ) : paymentMethod === "canpay" ? (
                      <><Clock className="w-4 h-4 mr-2" /> Pay with CanPay — {formatPrice(total)}</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" /> Place Order — {formatPrice(total)}</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ==================== ORDER SUMMARY SIDEBAR ==================== */}
          <div>
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="font-bold text-text mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-light truncate mr-2">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium text-text shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Delivery ({selectedProvider?.name?.split(" ")[0]})</span>
                  <span className="font-medium">
                    {finalDeliveryFee === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      formatPrice(finalDeliveryFee)
                    )}
                  </span>
                </div>
                {giftCardApplied && giftCardDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1"><Gift className="w-3.5 h-3.5" />Gift Card</span>
                    <span className="font-medium text-green-600">−{formatPrice(giftCardDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-text">Total</span>
                  <span className="font-bold text-xl text-accent">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure checkout powered by SSL</span>
              </div>

              {deliveryOption !== "pickup" && (
                <div className="mt-4 bg-surface rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-text">Estimated Delivery</p>
                      <p className="text-xs text-text-muted">
                        {deliveryEstimate?.time || selectedProvider?.estimatedTime || "2-5 business days"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
