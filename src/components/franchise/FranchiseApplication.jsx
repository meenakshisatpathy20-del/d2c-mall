import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import "./FranchiseApplication.css";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  model: "",
  investment: "",
  experience: "",
  storeArea: "",
  property: "",
  message: "",
};

const STATES = [
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Rajasthan",
  "Telangana",
  "Tamil Nadu",
  "West Bengal",
  "Jharkhand",
  "Uttar Pradesh",
  "Gujarat",
  "Other",
];

const MODELS = [
  "FOFO",
  "FOCO",
];

const INVESTMENTS = [
  "₹10L – ₹15L",
  "₹15L – ₹30L",
  "₹30L – ₹50L",
  "₹50L+",
];

export default function FranchiseApplication({
  onSubmit,
  onBack,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [submitted, setSubmitted] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim())
      nextErrors.name =
        "Enter your name";

    if (!form.email.trim())
      nextErrors.email =
        "Enter your email";

    if (!form.phone.trim())
      nextErrors.phone =
        "Enter your phone number";

    if (!form.city.trim())
      nextErrors.city =
        "Enter your preferred city";

    if (!form.state)
      nextErrors.state =
        "Select a state";

    if (!form.model)
      nextErrors.model =
        "Select a franchise model";

    if (!form.investment)
      nextErrors.investment =
        "Select an investment range";

    return nextErrors;
  };

  const submitApplication = (
    event
  ) => {
    event.preventDefault();

    const nextErrors =
      validate();

    if (
      Object.keys(nextErrors).length
    ) {
      setErrors(nextErrors);
      return;
    }

    const application = {
      ...form,
      applicationId: `FR-${Date.now()
        .toString()
        .slice(-8)}`,
      status: "New",
      submittedAt:
        new Date().toISOString(),
    };

    onSubmit?.(application);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="franchise-application-page">
        <motion.section
          className="franchise-success"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="franchise-success-icon">
            <CheckCircle2 size={34} />
          </div>

          <span>
            APPLICATION RECEIVED
          </span>

          <h1>
            Your franchise journey
            <br />
            has started.
          </h1>

          <p>
            Thank you for your interest in D2C Mall.
            Our franchise team can review your
            application and contact you with the next
            steps.
          </p>

          <div className="franchise-success-card">
            <span>
              APPLICATION ID
            </span>

            <strong>
              FR-
              {Date.now()
                .toString()
                .slice(-8)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() =>
              onBack?.()
            }
          >
            Back to Franchise
            <ArrowLeft size={15} />
          </button>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="franchise-application-page">
      <section className="franchise-application-header">
        <button
          type="button"
          onClick={() =>
            onBack?.()
          }
        >
          <ArrowLeft size={15} />
          Back to franchise
        </button>

        <div>
          <span>
            FRANCHISE APPLICATION
          </span>

          <h1>
            Tell us about
            <br />
            <em>your plan.</em>
          </h1>

          <p>
            Share a few details about yourself and
            your proposed D2C Mall opportunity.
          </p>
        </div>
      </section>

      <form
        className="franchise-form"
        onSubmit={submitApplication}
      >
        <section className="franchise-form-section">
          <div className="franchise-form-heading">
            <div>
              <UserRound size={17} />
            </div>

            <section>
              <span>01</span>
              <h2>Your details</h2>
              <p>
                How can our franchise team reach you?
              </p>
            </section>
          </div>

          <div className="franchise-form-grid">
            <label>
              <span>Full name *</span>
              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Your full name"
              />
              {errors.name && (
                <small>
                  {errors.name}
                </small>
              )}
            </label>

            <label>
              <span>Email *</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="you@example.com"
              />
              {errors.email && (
                <small>
                  {errors.email}
                </small>
              )}
            </label>

            <label>
              <span>Phone number *</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+91"
              />
              {errors.phone && (
                <small>
                  {errors.phone}
                </small>
              )}
            </label>

            <label>
              <span>
                Business experience
              </span>
              <input
                value={form.experience}
                onChange={(event) =>
                  updateField(
                    "experience",
                    event.target.value
                  )
                }
                placeholder="Retail, fashion, other..."
              />
            </label>
          </div>
        </section>

        <section className="franchise-form-section">
          <div className="franchise-form-heading">
            <div>
              <MapPin size={17} />
            </div>

            <section>
              <span>02</span>
              <h2>Choose your market</h2>
              <p>
                Tell us where you want to build.
              </p>
            </section>
          </div>

          <div className="franchise-form-grid">
            <label>
              <span>Preferred city *</span>
              <input
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                placeholder="Mumbai, Bengaluru..."
              />
              {errors.city && (
                <small>
                  {errors.city}
                </small>
              )}
            </label>

            <label>
              <span>State *</span>

              <div className="franchise-select">
                <select
                  value={form.state}
                  onChange={(event) =>
                    updateField(
                      "state",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select state
                  </option>

                  {STATES.map(
                    (state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={14}
                />
              </div>

              {errors.state && (
                <small>
                  {errors.state}
                </small>
              )}
            </label>

            <label>
              <span>
                Proposed store area
              </span>
              <input
                value={form.storeArea}
                onChange={(event) =>
                  updateField(
                    "storeArea",
                    event.target.value
                  )
                }
                placeholder="Approx. sq.ft."
              />
            </label>

            <label>
              <span>
                Do you have a property?
              </span>

              <div className="franchise-select">
                <select
                  value={form.property}
                  onChange={(event) =>
                    updateField(
                      "property",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select
                  </option>
                  <option value="Yes">
                    Yes
                  </option>
                  <option value="No">
                    No
                  </option>
                  <option value="Looking">
                    Looking for one
                  </option>
                </select>

                <ChevronDown
                  size={14}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="franchise-form-section">
          <div className="franchise-form-heading">
            <div>
              <Store size={17} />
            </div>

            <section>
              <span>03</span>
              <h2>Franchise model</h2>
              <p>
                Choose the operating structure you are
                interested in.
              </p>
            </section>
          </div>

          <div className="franchise-choice-grid">
            {MODELS.map(
              (model) => (
                <button
                  type="button"
                  className={
                    form.model === model
                      ? "selected"
                      : ""
                  }
                  key={model}
                  onClick={() =>
                    updateField(
                      "model",
                      model
                    )
                  }
                >
                  <strong>
                    {model}
                  </strong>

                  <span>
                    {model ===
                    "FOFO"
                      ? "Franchise Owned · Franchise Operated"
                      : "Franchise Owned · Company Operated"}
                  </span>

                  {form.model ===
                    model && (
                    <CheckCircle2
                      size={17}
                    />
                  )}
                </button>
              )
            )}
          </div>

          {errors.model && (
            <small className="form-wide-error">
              {errors.model}
            </small>
          )}
        </section>

        <section className="franchise-form-section">
          <div className="franchise-form-heading">
            <div>
              <Wallet size={17} />
            </div>

            <section>
              <span>04</span>
              <h2>Investment plan</h2>
              <p>
                Select the investment range you are
                considering.
              </p>
            </section>
          </div>

          <div className="franchise-investment-grid">
            {INVESTMENTS.map(
              (investment) => (
                <button
                  type="button"
                  className={
                    form.investment ===
                    investment
                      ? "selected"
                      : ""
                  }
                  key={investment}
                  onClick={() =>
                    updateField(
                      "investment",
                      investment
                    )
                  }
                >
                  {investment}

                  {form.investment ===
                    investment && (
                    <CheckCircle2
                      size={15}
                    />
                  )}
                </button>
              )
            )}
          </div>

          {errors.investment && (
            <small className="form-wide-error">
              {errors.investment}
            </small>
          )}
        </section>

        <section className="franchise-form-section">
          <div className="franchise-form-heading">
            <div>
              <Store size={17} />
            </div>

            <section>
              <span>05</span>
              <h2>Anything else?</h2>
              <p>
                Give the franchise team additional
                context.
              </p>
            </section>
          </div>

          <label className="franchise-message-field">
            <span>
              Tell us about your plan
            </span>

            <textarea
              value={form.message}
              onChange={(event) =>
                updateField(
                  "message",
                  event.target.value
                )
              }
              placeholder="Tell us about your retail experience, location, business plans or anything else you want us to know..."
              rows="6"
            />
          </label>
        </section>

        <div className="franchise-form-submit">
          <div>
            <ShieldCheck size={16} />

            <span>
              Your information is used only for
              franchise evaluation and communication.
            </span>
          </div>

          <button type="submit">
            Submit Application
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </main>
  );
}