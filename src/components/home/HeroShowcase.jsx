import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { heroBanners } from "../../data/catalog";
import "./HeroShowcase.css";

const AUTO_PLAY_MS = 5500;

function getInitialIndex(banners) {
  if (!Array.isArray(banners) || banners.length === 0) {
    return 0;
  }

  const activeIndex = banners.findIndex(
    (banner) =>
      banner?.active !== false &&
      (!banner?.startsAt ||
        new Date(banner.startsAt) <= new Date()) &&
      (!banner?.endsAt ||
        new Date(banner.endsAt) >= new Date())
  );

  return activeIndex >= 0 ? activeIndex : 0;
}

function isBannerVisible(banner) {
  if (!banner || banner.active === false) {
    return false;
  }

  const now = Date.now();

  if (
    banner.startsAt &&
    new Date(banner.startsAt).getTime() > now
  ) {
    return false;
  }

  if (
    banner.endsAt &&
    new Date(banner.endsAt).getTime() < now
  ) {
    return false;
  }

  return true;
}

function resolveImage(banner) {
  return (
    banner?.desktopImage ||
    banner?.image ||
    banner?.imageUrl ||
    banner?.media?.desktop ||
    banner?.media?.url ||
    ""
  );
}

function resolveMobileImage(banner) {
  return (
    banner?.mobileImage ||
    banner?.mobileImageUrl ||
    banner?.media?.mobile ||
    resolveImage(banner)
  );
}

export default function HeroShowcase({
  banners,
  loading = false,
  onBannerClick,
  onCtaClick,
}) {
  const sourceBanners =
    banners?.length > 0 ? banners : heroBanners;

  const visibleBanners = useMemo(
    () => sourceBanners.filter(isBannerVisible),
    [sourceBanners]
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    getInitialIndex(visibleBanners)
  );

  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setActiveIndex((current) => {
      if (visibleBanners.length === 0) {
        return 0;
      }

      return Math.min(
        current,
        visibleBanners.length - 1
      );
    });
  }, [visibleBanners.length]);

  useEffect(() => {
    setImageLoaded(false);
  }, [activeIndex]);

  useEffect(() => {
    if (
      isPaused ||
      visibleBanners.length <= 1
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) =>
          (current + 1) % visibleBanners.length
      );
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, visibleBanners.length]);

  const currentBanner =
    visibleBanners[activeIndex];

  const goNext = () => {
    if (!visibleBanners.length) {
      return;
    }

    setActiveIndex(
      (current) =>
        (current + 1) % visibleBanners.length
    );

    setIsPaused(true);
  };

  const goPrevious = () => {
    if (!visibleBanners.length) {
      return;
    }

    setActiveIndex(
      (current) =>
        (current -
          1 +
          visibleBanners.length) %
        visibleBanners.length
    );

    setIsPaused(true);
  };

  const handleBannerClick = () => {
    if (!currentBanner) {
      return;
    }

    if (onBannerClick) {
      onBannerClick(currentBanner);
      return;
    }

    if (currentBanner.href) {
      window.location.href =
        currentBanner.href;
    }
  };

  const handleCtaClick = (event, cta) => {
    event.stopPropagation();

    if (onCtaClick) {
      onCtaClick(cta, currentBanner);
      return;
    }

    if (cta?.href) {
      window.location.href = cta.href;
    }
  };

  if (loading) {
    return (
      <section className="hero-showcase hero-showcase-loading">
        <div className="hero-loading-shimmer" />

        <div className="hero-loading-content">
          <div className="hero-loading-line hero-loading-small" />
          <div className="hero-loading-line hero-loading-large" />
          <div className="hero-loading-line hero-loading-medium" />
          <div className="hero-loading-button" />
        </div>
      </section>
    );
  }

  if (!currentBanner) {
    return (
      <section className="hero-showcase hero-showcase-empty">
        <div className="hero-empty-icon">
          <Sparkles size={24} />
        </div>

        <div>
          <strong>Fresh drops are loading</strong>
          <span>
            New campaigns will appear here.
          </span>
        </div>
      </section>
    );
  }

  const image = resolveImage(currentBanner);
  const mobileImage =
    resolveMobileImage(currentBanner);

  const ctas = Array.isArray(
    currentBanner.ctas
  )
    ? currentBanner.ctas.filter(Boolean)
    : currentBanner.cta
      ? [currentBanner.cta]
      : [];

  return (
    <section
      className="hero-showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.article
          key={
            currentBanner.id ||
            currentBanner._id ||
            activeIndex
          }
          className="hero-slide"
          initial={{
            opacity: 0,
            scale: 1.025,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.985,
          }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          onClick={handleBannerClick}
        >
          <div className="hero-background">
            {image ? (
              <picture>
                <source
                  media="(max-width: 700px)"
                  srcSet={mobileImage}
                />

                <img
                  src={image}
                  alt={
                    currentBanner.alt ||
                    currentBanner.title ||
                    ""
                  }
                  className={`hero-image ${
                    imageLoaded
                      ? "hero-image-loaded"
                      : ""
                  }`}
                  onLoad={() =>
                    setImageLoaded(true)
                  }
                  draggable="false"
                />
              </picture>
            ) : (
              <div
                className="hero-generated-background"
                style={{
                  background:
                    currentBanner.background ||
                    "linear-gradient(115deg, #07132f, #2457ff, #ff6b00)",
                }}
              />
            )}

            <div className="hero-overlay" />
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />
          </div>

          <div className="hero-content">
            <div className="hero-content-inner">
              {currentBanner.eyebrow && (
                <motion.div
                  className="hero-eyebrow"
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.1,
                  }}
                >
                  <Zap
                    size={13}
                    fill="currentColor"
                  />
                  {currentBanner.eyebrow}
                </motion.div>
              )}

              {currentBanner.title && (
                <motion.h1
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.16,
                  }}
                >
                  {currentBanner.title}
                </motion.h1>
              )}

              {currentBanner.subtitle && (
                <motion.p
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.22,
                  }}
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}

              {ctas.length > 0 && (
                <motion.div
                  className="hero-ctas"
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.28,
                  }}
                >
                  {ctas.map((cta, index) => (
                    <button
                      key={
                        cta.id ||
                        `${cta.label}-${index}`
                      }
                      type="button"
                      className={`hero-cta ${
                        cta.variant ===
                        "secondary"
                          ? "hero-cta-secondary"
                          : "hero-cta-primary"
                      }`}
                      onClick={(event) =>
                        handleCtaClick(
                          event,
                          cta
                        )
                      }
                    >
                      {cta.icon ===
                        "sparkle" && (
                        <Sparkles size={16} />
                      )}

                      <span>
                        {cta.label}
                      </span>

                      <ArrowRight size={16} />
                    </button>
                  ))}
                </motion.div>
              )}

              {currentBanner.microcopy && (
                <motion.div
                  className="hero-microcopy"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.34,
                  }}
                >
                  {currentBanner.microcopy}
                </motion.div>
              )}
            </div>
          </div>

          {currentBanner.badge && (
            <motion.div
              className="hero-floating-badge"
              initial={{
                opacity: 0,
                x: 18,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              transition={{
                delay: 0.3,
              }}
            >
              <Sparkles size={14} />
              <span>
                {currentBanner.badge}
              </span>
            </motion.div>
          )}
        </motion.article>
      </AnimatePresence>

      {visibleBanners.length > 1 && (
        <>
          <button
            type="button"
            className="hero-arrow hero-arrow-left"
            aria-label="Previous banner"
            onClick={(event) => {
              event.stopPropagation();
              goPrevious();
            }}
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            className="hero-arrow hero-arrow-right"
            aria-label="Next banner"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight size={21} />
          </button>

          <div className="hero-controls">
            <div className="hero-dots">
              {visibleBanners.map(
                (banner, index) => (
                  <button
                    key={
                      banner.id ||
                      banner._id ||
                      index
                    }
                    type="button"
                    className={`hero-dot ${
                      index ===
                      activeIndex
                        ? "active"
                        : ""
                    }`}
                    aria-label={`Go to banner ${
                      index + 1
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex(index);
                      setIsPaused(true);
                    }}
                  >
                    <span />
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              className="hero-play-toggle"
              aria-label={
                isPaused
                  ? "Resume banners"
                  : "Pause banners"
              }
              onClick={(event) => {
                event.stopPropagation();
                setIsPaused(
                  (current) => !current
                );
              }}
            >
              {isPaused ? (
                <Play size={13} />
              ) : (
                <Pause size={13} />
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
}