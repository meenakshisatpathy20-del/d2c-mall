import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Send,
  Star,
  ThumbsUp,
  UserRound
} from "lucide-react";
import "./ProductReviews.css";

const initialReviews = [
  {
    id: "review-001",
    name: "Ananya Sharma",
    rating: 5,
    title: "Really good quality",
    text: "The fabric feels premium and the fit is exactly what I expected. Delivery was also quick.",
    date: "18 Sep 2026",
    verified: true,
    helpful: 34,
    images: [],
    size: "M"
  },
  {
    id: "review-002",
    name: "Riya Mehta",
    rating: 4,
    title: "Good for the price",
    text: "Nice material and comfortable to wear. The colour looks very close to the product pictures.",
    date: "12 Sep 2026",
    verified: true,
    helpful: 21,
    images: [],
    size: "S"
  },
  {
    id: "review-003",
    name: "Karan Verma",
    rating: 5,
    title: "Would buy again",
    text: "Good quality, proper packaging and arrived before the expected delivery date.",
    date: "07 Sep 2026",
    verified: true,
    helpful: 18,
    images: [],
    size: "L"
  }
];

const ratingBreakdown = [
  { rating: 5, count: 328 },
  { rating: 4, count: 91 },
  { rating: 3, count: 32 },
  { rating: 2, count: 14 },
  { rating: 1, count: 8 }
];

function RatingStars({ rating, size = 16 }) {
  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= rating ? "currentColor" : "none"}
          strokeWidth={1.8}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }) {
  const percentage = total ? (count / total) * 100 : 0;

  return (
    <div className="rating-bar-row">
      <span>{rating}</span>
      <Star size={12} fill="currentColor" />
      <div className="rating-bar">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <small>{count}</small>
    </div>
  );
}

function ReviewCard({ review, onHelpful }) {
  return (
    <article className="review-card">
      <div className="review-card-top">
        <div className="review-user">
          <div className="review-avatar">
            <UserRound size={17} />
          </div>

          <div>
            <strong>{review.name}</strong>

            <div className="review-user-meta">
              {review.verified && (
                <span>
                  <CheckCircle2 size={12} />
                  Verified Purchase
                </span>
              )}

              {review.size && <span>Size {review.size}</span>}
            </div>
          </div>
        </div>

        <span className="review-date">{review.date}</span>
      </div>

      <div className="review-card-rating">
        <RatingStars rating={review.rating} size={14} />
      </div>

      <h3>{review.title}</h3>

      <p>{review.text}</p>

      {review.images?.length > 0 && (
        <div className="review-images">
          {review.images.map((image, index) => (
            <img
              src={image}
              alt={`Customer review ${index + 1}`}
              key={`${review.id}-${index}`}
            />
          ))}
        </div>
      )}

      <button
        className="review-helpful"
        type="button"
        onClick={() => onHelpful?.(review)}
      >
        <ThumbsUp size={14} />
        Helpful
        <span>{review.helpful}</span>
      </button>
    </article>
  );
}

function ReviewForm({ onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    if (!title.trim()) {
      setError("Please add a review title.");
      return;
    }

    if (!text.trim()) {
      setError("Please write your review.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onSubmit?.({
        rating,
        title: title.trim(),
        text: text.trim(),
        createdAt: new Date().toISOString()
      });

      setRating(0);
      setTitle("");
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form-card">
      <div className="review-form-header">
        <div>
          <span>YOUR EXPERIENCE</span>
          <h3>Write a review</h3>
        </div>

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="review-form-rating">
          <span>Your rating</span>

          <div>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={star <= rating ? "active" : ""}
                onClick={() => setRating(star)}
                aria-label={`${star} stars`}
              >
                <Star
                  size={27}
                  fill={star <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </div>

        <label>
          <span>Review title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summarize your experience"
            maxLength={80}
          />
        </label>

        <label>
          <span>Your review</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What did you like about the product?"
            rows={5}
            maxLength={500}
          />
          <small>{text.length}/500</small>
        </label>

        <button type="button" className="review-image-button">
          <ImagePlus size={16} />
          Add photos
        </button>

        {error && <div className="review-form-error">{error}</div>}

        <div className="review-form-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" disabled={submitting}>
            <Send size={15} />
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProductReviews({
  product,
  reviews = initialReviews,
  rating = 4.5,
  reviewCount = 473,
  canReview = true,
  onSubmitReview,
  onHelpful
}) {
  const [sort, setSort] = useState("Most Relevant");
  const [showForm, setShowForm] = useState(false);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];

    if (sort === "Highest Rated") {
      return list.sort((a, b) => b.rating - a.rating);
    }

    if (sort === "Lowest Rated") {
      return list.sort((a, b) => a.rating - b.rating);
    }

    if (sort === "Newest") {
      return list.reverse();
    }

    return list;
  }, [reviews, sort]);

  const totalRatings = ratingBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const handleSubmit = async (payload) => {
    await onSubmitReview?.({
      productId: product?.id,
      ...payload
    });

    setShowForm(false);
  };

  return (
    <section className="product-reviews">
      <div className="reviews-heading">
        <div>
          <span>REAL CUSTOMER FEEDBACK</span>
          <h2>Ratings & Reviews</h2>
          <p>See what customers are saying about this product.</p>
        </div>

        {canReview && (
          <button
            className="write-review-button"
            type="button"
            onClick={() => setShowForm((value) => !value)}
          >
            <Star size={17} />
            Write a review
          </button>
        )}
      </div>

      {showForm && (
        <ReviewForm
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="reviews-summary">
        <div className="overall-rating">
          <strong>{rating.toFixed(1)}</strong>
          <RatingStars rating={Math.round(rating)} size={19} />
          <span>{reviewCount.toLocaleString("en-IN")} ratings</span>
        </div>

        <div className="rating-breakdown">
          {ratingBreakdown.map((item) => (
            <RatingBar
              key={item.rating}
              rating={item.rating}
              count={item.count}
              total={totalRatings}
            />
          ))}
        </div>

        <div className="review-trust">
          <CheckCircle2 size={22} />
          <strong>Verified purchases</strong>
          <span>
            Reviews from customers who purchased this product through D2C Mall.
          </span>
        </div>
      </div>

      <div className="reviews-toolbar">
        <div>
          <strong>{reviews.length} reviews</strong>
        </div>

        <label className="review-sort">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Most Relevant</option>
            <option>Newest</option>
            <option>Highest Rated</option>
            <option>Lowest Rated</option>
          </select>
          <ChevronDown size={15} />
        </label>
      </div>

      <div className="reviews-list">
        {sortedReviews.length ? (
          sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={onHelpful}
            />
          ))
        ) : (
          <div className="reviews-empty">
            <Star size={28} />
            <h3>No reviews yet</h3>
            <p>Be the first customer to review this product.</p>
            {canReview && (
              <button type="button" onClick={() => setShowForm(true)}>
                Write the first review
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}