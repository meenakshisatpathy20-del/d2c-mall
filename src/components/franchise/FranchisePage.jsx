import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import "./FranchisePage.css";

const opportunities = [
  {
    city: "Mumbai",
    state: "Maharashtra",
    model: "FOFO",
    investment: "₹15L – ₹30L",
    area: "800 – 1500 sq.ft.",
    demand: "High",
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    model: "FOCO",
    investment: "₹20L – ₹40L",
    area: "1000 – 1800 sq.ft.",
    demand: "High",
  },
  {
    city: "Delhi NCR",
    state: "Delhi",
    model: "FOFO",
    investment: "₹15L – ₹30L",
    area: "800 – 1500 sq.ft.",
    demand: "High",
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    model: "FOFO",
    investment: "₹12L – ₹25L",
    area: "700 – 1300 sq.ft.",
    demand: "Growing",
  },
];

const benefits = [
  {
    icon: Store,
    title: "Physical + Digital",
    text: "Connect your local store with the D2C Mall online ecosystem.",
  },
  {
    icon: TrendingUp,
    title: "Growing Categories",
    text: "Access fashion, beauty, lifestyle, electronics and more.",
  },
  {
    icon: BarChart3,
    title: "Business Visibility",
    text: "Track enquiries, sales, inventory and store performance.",
  },
  {
    icon: ShieldCheck,
    title: "Operational Support",
    text: "Get structured support across supply, technology and operations.",
  },
];

const faqs = [
  {
    question: "What franchise models are available?",
    answer:
      "D2C Mall supports FOFO and FOCO-style opportunities depending on the location and business requirement.",
  },
  {
    question: "Can I apply for a specific city?",
    answer:
      "Yes. You can select your preferred city and provide your proposed store location during the application process.",
  },
  {
    question: "What information is required?",
    answer:
      "The application captures your contact details, preferred location, investment range, business experience and proposed store information.",
  },
  {
    question: "How is an application reviewed?",
    answer:
      "The franchise team reviews the submitted information, location suitability and business requirements before contacting the applicant.",
  },
];

export default function FranchisePage({
  onApply,
  onViewOpportunity,
}) {
  const [openFaq, setOpenFaq] =
    useState(null);

  return (
    <main className="franchise-page">
      <section className="franchise-hero">
        <div className="franchise-hero-copy">
          <span className="franchise-eyebrow">
            BUILD WITH D2C MALL
          </span>

          <h1>
            Bring D2C Mall
            <br />
            <em>to your city.</em>
          </h1>

          <p>
            Build a modern retail business powered by
            the D2C Mall ecosystem — online discovery,
            offline experience and operational support
            in one platform.
          </p>

          <div className="franchise-hero-actions">
            <button
              type="button"
              onClick={() =>
                onApply?.()
              }
            >
              Apply for Franchise
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                document
                  .getElementById(
                    "franchise-opportunities"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore Opportunities
            </button>
          </div>

          <div className="franchise-hero-stats">
            <div>
              <strong>4+</strong>
              <span>
                Major operating hubs
              </span>
            </div>

            <div>
              <strong>2</strong>
              <span>
                Franchise models
              </span>
            </div>

            <div>
              <strong>Pan India</strong>
              <span>
                Expansion vision
              </span>
            </div>
          </div>
        </div>

        <div className="franchise-hero-visual">
          <div className="franchise-store-card">
            <div className="franchise-store-top">
              <span>D2C MALL</span>
              <span>STORE</span>
            </div>

            <div className="franchise-store-main">
              <Store size={48} />
              <strong>
                Your City.
                <br />
                Your Store.
              </strong>
              <span>
                Connected to a larger
                <br />
                D2C ecosystem.
              </span>
            </div>

            <div className="franchise-store-bottom">
              <span>
                ONLINE + OFFLINE
              </span>
              <ArrowRight size={17} />
            </div>
          </div>

          <div className="franchise-floating-card location">
            <MapPin size={15} />
            <div>
              <strong>
                Local presence
              </strong>
              <span>
                Connected retail
              </span>
            </div>
          </div>

          <div className="franchise-floating-card growth">
            <TrendingUp size={15} />
            <div>
              <strong>
                Growth focused
              </strong>
              <span>
                Data-led operations
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="franchise-benefits">
        <div className="franchise-section-heading">
          <span>WHY D2C MALL</span>
          <h2>
            More than a storefront.
          </h2>
          <p>
            A franchise becomes part of the larger
            customer, commerce and operations network.
          </p>
        </div>

        <div className="franchise-benefit-grid">
          {benefits.map(
            ({
              icon: Icon,
              title,
              text,
            }) => (
              <motion.article
                key={title}
                whileHover={{
                  y: -4,
                }}
              >
                <div>
                  <Icon size={20} />
                </div>

                <h3>{title}</h3>

                <p>{text}</p>
              </motion.article>
            )
          )}
        </div>
      </section>

      <section
        id="franchise-opportunities"
        className="franchise-opportunities"
      >
        <div className="franchise-section-heading">
          <span>AVAILABLE OPPORTUNITIES</span>
          <h2>
            Find your market.
          </h2>
          <p>
            Explore example franchise opportunities
            by city, model and investment range.
          </p>
        </div>

        <div className="franchise-opportunity-table">
          <div className="franchise-table-head">
            <span>LOCATION</span>
            <span>MODEL</span>
            <span>INVESTMENT</span>
            <span>STORE AREA</span>
            <span>DEMAND</span>
            <span />
          </div>

          {opportunities.map(
            (item) => (
              <motion.div
                className="franchise-table-row"
                key={`${item.city}-${item.model}`}
                whileHover={{
                  x: 3,
                }}
              >
                <div className="franchise-location">
                  <div>
                    <MapPin size={14} />
                  </div>

                  <section>
                    <strong>
                      {item.city}
                    </strong>
                    <span>
                      {item.state}
                    </span>
                  </section>
                </div>

                <strong>
                  {item.model}
                </strong>

                <span>
                  {item.investment}
                </span>

                <span>
                  {item.area}
                </span>

                <span
                  className={`franchise-demand ${item.demand
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {item.demand}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onViewOpportunity?.(
                      item
                    )
                  }
                >
                  View
                  <ChevronRight
                    size={14}
                  />
                </button>
              </motion.div>
            )
          )}
        </div>
      </section>

      <section className="franchise-models">
        <div className="franchise-section-heading">
          <span>CHOOSE YOUR MODEL</span>
          <h2>
            Two ways to build.
          </h2>
        </div>

        <div className="franchise-model-grid">
          <article>
            <div className="franchise-model-number">
              01
            </div>

            <h3>FOFO</h3>

            <span>
              Franchise Owned · Franchise
              Operated
            </span>

            <p>
              You own and operate the store while
              becoming part of the D2C Mall retail
              ecosystem.
            </p>

            <ul>
              <li>
                <CheckCircle2 size={14} />
                Store ownership
              </li>
              <li>
                <CheckCircle2 size={14} />
                Local operations
              </li>
              <li>
                <CheckCircle2 size={14} />
                D2C Mall ecosystem
              </li>
            </ul>
          </article>

          <article>
            <div className="franchise-model-number">
              02
            </div>

            <h3>FOCO</h3>

            <span>
              Franchise Owned · Company
              Operated
            </span>

            <p>
              Own the franchise while D2C Mall manages
              agreed operational responsibilities.
            </p>

            <ul>
              <li>
                <CheckCircle2 size={14} />
                Franchise ownership
              </li>
              <li>
                <CheckCircle2 size={14} />
                Operational support
              </li>
              <li>
                <CheckCircle2 size={14} />
                Centralized systems
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="franchise-process">
        <div className="franchise-section-heading">
          <span>HOW IT WORKS</span>
          <h2>
            From application to launch.
          </h2>
        </div>

        <div className="franchise-process-grid">
          {[
            [
              "01",
              "Apply",
              "Tell us about yourself, your city and your proposed location.",
            ],
            [
              "02",
              "Review",
              "Our franchise team evaluates the opportunity and location.",
            ],
            [
              "03",
              "Plan",
              "Finalize the model, store plan and operating structure.",
            ],
            [
              "04",
              "Launch",
              "Open your store and connect it to the D2C Mall ecosystem.",
            ],
          ].map(
            ([number, title, text]) => (
              <article key={number}>
                <strong>{number}</strong>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            )
          )}
        </div>
      </section>

      <section className="franchise-application">
        <div>
          <span>
            READY TO BUILD?
          </span>

          <h2>
            Your next store could be
            <br />
            <em>the one everyone talks about.</em>
          </h2>

          <p>
            Submit your interest and the franchise team
            can take the conversation forward.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onApply?.()
          }
        >
          Start Application
          <ArrowRight size={17} />
        </button>
      </section>

      <section className="franchise-faq">
        <div className="franchise-section-heading">
          <span>FAQ</span>
          <h2>
            Questions, answered.
          </h2>
        </div>

        <div className="franchise-faq-list">
          {faqs.map(
            (faq, index) => {
              const isOpen =
                openFaq === index;

              return (
                <div
                  className={`franchise-faq-item ${
                    isOpen
                      ? "open"
                      : ""
                  }`}
                  key={faq.question}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(
                        isOpen
                          ? null
                          : index
                      )
                    }
                  >
                    <span>
                      {faq.question}
                    </span>

                    <ChevronDown
                      size={16}
                    />
                  </button>

                  {isOpen && (
                    <p>
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
      </section>
    </main>
  );
}