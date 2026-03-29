"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, User, Loader2, Check, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatar: string | null };
}

interface Props {
  productId: string;
  productRating: number;
  reviewCount: number;
}

function StarRow({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={interactive ? "button" : undefined}
          onClick={interactive ? () => onChange?.(i) : undefined}
          onMouseEnter={interactive ? () => setHovered(i) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={interactive ? "cursor-pointer focus:outline-none" : "cursor-default"}
        >
          <Star
            className={`${interactive ? "w-7 h-7" : "w-4 h-4"} transition-colors ${
              i <= display ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function DistributionBar({ count, total, label }: { count: number; total: number; label: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-text-muted">{label}</span>
      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="h-full bg-yellow-400 rounded-full"
        />
      </div>
      <span className="w-8 text-xs text-text-muted text-right">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const initials = review.user.name ? review.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-5 border-b border-border/50 last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
          {review.user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-sm text-text">{review.user.name ?? "Anonymous"}</p>
            <span className="text-xs text-text-muted">{date}</span>
          </div>
          <StarRow rating={review.rating} />
          {review.comment && (
            <p className="text-sm text-text-light leading-relaxed mt-2">{review.comment}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsSection({ productId, productRating, reviewCount }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [total, setTotal] = useState(reviewCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userExistingReview, setUserExistingReview] = useState<Review | null>(null);

  // Load auth user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user) setAuthUser(d.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // Load reviews
  const loadReviews = useCallback(async (p: number, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${p}`);
      const data = await res.json();
      setReviews((prev) => append ? [...prev, ...data.reviews] : data.reviews);
      setTotal(data.total);
      setDistribution(data.distribution);
      setHasMore(p * 10 < data.total);
      setPage(p);
    } catch { /* silent */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId]);

  useEffect(() => { loadReviews(1); }, [loadReviews]);

  // Check if logged-in user already reviewed this product
  useEffect(() => {
    if (authUser && reviews.length > 0) {
      const existing = reviews.find((r) => r.user.id === authUser.id) ?? null;
      if (existing) {
        setUserExistingReview(existing);
        setFormRating(existing.rating);
        setFormComment(existing.comment ?? "");
      }
    }
  }, [authUser, reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) { setSubmitError("Please select a star rating."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating: formRating, comment: formComment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Submission failed."); return; }
      setSubmitSuccess(true);
      setUserExistingReview(data.review);
      // Reload reviews to reflect update
      await loadReviews(1);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch { setSubmitError("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  const avgRating = total > 0 ? productRating : 0;

  return (
    <div className="max-w-3xl">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 p-6 bg-surface rounded-2xl mb-8">
        <div className="flex flex-col items-center justify-center sm:w-36 shrink-0">
          <span className="text-5xl font-black text-text">{avgRating.toFixed(1)}</span>
          <StarRow rating={Math.round(avgRating)} />
          <span className="text-sm text-text-muted mt-1">{total} review{total !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <DistributionBar key={star} label={star} count={distribution[star] ?? 0} total={total} />
          ))}
        </div>
      </div>

      {/* Review Form */}
      <div className="mb-8">
        {authLoading ? null : authUser ? (
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-bold text-text mb-1">
              {userExistingReview ? "Update Your Review" : "Write a Review"}
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Reviewing as <span className="font-medium text-accent">{authUser.name ?? authUser.email}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-2">Your Rating *</label>
                <StarRow rating={formRating} interactive onChange={setFormRating} />
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Your Review (optional)</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Share your experience with this product..."
                  className="w-full bg-surface border-0 rounded-xl px-4 py-3 text-sm text-text focus:ring-2 focus:ring-accent resize-none"
                />
                <p className="text-xs text-text-muted mt-1 text-right">{formComment.length}/1000</p>
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={submitting || formRating === 0}
                className="rounded-xl"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                ) : submitSuccess ? (
                  <><Check className="w-4 h-4 mr-2" />Submitted!</>
                ) : (
                  userExistingReview ? "Update Review" : "Submit Review"
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-dashed border-border">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Want to share your experience?</p>
              <p className="text-xs text-text-muted">Log in to leave a review for this product.</p>
            </div>
            <Link href="/account">
              <Button size="sm" variant="outline" className="rounded-xl shrink-0">
                <LogIn className="w-4 h-4 mr-1.5" />Log In
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <ThumbsUp className="w-10 h-10 text-border mx-auto mb-3" />
          <p className="font-medium text-text mb-1">No reviews yet</p>
          <p className="text-sm text-text-muted">Be the first to review this product!</p>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </AnimatePresence>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => loadReviews(page + 1, true)}
                disabled={loadingMore}
                className="rounded-xl"
              >
                {loadingMore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : "Load More Reviews"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
