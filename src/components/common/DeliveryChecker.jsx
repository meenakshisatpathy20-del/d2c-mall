import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Banknote, Crosshair, MapPin, PackageCheck, RotateCcw, ShieldCheck, Truck, Warehouse, Zap } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { lookupPincode, popularPincodes } from "../../data/logistics";
import { planFulfilment } from "../../lib/delivery";
import { dayLabel } from "../../lib/format";
import { useCurrentUser } from "../../lib/services/account";
import { Modal } from "./ui";

/** Pincode-based serviceability + ETA + confidence for one product (PDP / Quick view). */
export function DeliveryChecker({ product, compact }) {
  const { pincode, setPincode, inventory } = useShop();
  const [value, setValue] = useState(pincode?.pincode || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (pincode?.pincode) setValue(pincode.pincode);
  }, [pincode]);

  const plan = useMemo(() => {
    if (!pincode?.pincode) return null;
    return planFulfilment(pincode.pincode, [{ productId: product.id, qty: 1, weightKg: product.weightKg }], inventory);
  }, [pincode, product, inventory]);

  const check = (e) => {
    e?.preventDefault();
    const loc = lookupPincode(value);
    if (!loc) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    setError("");
    setPincode(value, { city: loc.city, state: loc.state });
  };

  const ship = plan?.ok ? plan.shipments[0] : null;

  return (
    <div className="dcheck">
      <div className="row between mb-8">
        <span className="bold row gap-6">
          <MapPin size={16} className="text-orange" /> Delivery options
        </span>
        {pincode?.city ? <span className="xs muted">{pincode.city}</span> : null}
      </div>
      <form className="dcheck-form" onSubmit={check}>
        <div className="input-group">
          <input
            className="input"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter delivery pincode"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            aria-label="Pincode"
          />
          <button className="btn btn-sm btn-ghost" type="submit" style={{ color: "var(--blue)" }}>
            Check
          </button>
        </div>
      </form>
      {error ? <p className="xs text-red mt-8">{error}</p> : null}

      {plan && !plan.ok ? <div className="notice error mt-12">{plan.reason}</div> : null}

      {plan?.ok ? (
        <div className="dcheck-result fade-up">
          <div className="dcheck-line">
            <Truck size={17} />
            <span>
              Get it by <b>{dayLabel(plan.eta)}</b>
              {ship?.pastCutoff ? null : <span className="xs text-green"> · order before {ship?.warehouse.cutoff}</span>}
            </span>
          </div>
          {plan.expressAvailable ? (
            <div className="dcheck-line">
              <Zap size={17} />
              <span>
                Express: <b>{dayLabel(plan.expressEta)}</b> <span className="muted">(+₹99)</span>
              </span>
            </div>
          ) : null}
          <div className="dcheck-line">
            <Banknote size={17} />
            <span>{plan.codAvailable && product.cod ? "Cash on Delivery available" : <span className="text-red">COD not available for this pincode</span>}</span>
          </div>
          {!compact ? (
            <>
              <div className="dcheck-line">
                <RotateCcw size={17} />
                <span>{product.returnDays ? `${product.returnDays}-day easy return${product.exchange ? " & exchange" : ""}` : "Non-returnable (hygiene product)"}</span>
              </div>
              <div className="confidence">
                <div className="ring" style={{ "--p": plan.confidence }}>
                  <b>{plan.confidence}%</b>
                </div>
                <div className="small">
                  <b className="text-green">{plan.confidenceLabel} delivery confidence</b>
                  <div className="xs muted">Based on stock, courier SLA & distance for {plan.location.city}</div>
                </div>
              </div>
              {ship ? (
                <div className="wh-route">
                  <Warehouse size={14} />
                  <span className="dot" style={{ background: ship.warehouse.color }} />
                  <b>{ship.warehouse.short}</b>
                  <span className="line" />
                  <span>{ship.km} km</span>
                  <span className="line" />
                  <MapPin size={14} />
                  <b>{plan.location.city}</b>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {!plan && !compact ? (
        <div className="row wrap gap-16 mt-12 xs muted">
          <span className="row gap-4"><ShieldCheck size={14} /> 100% authentic</span>
          <span className="row gap-4"><PackageCheck size={14} /> Ships from 4 hubs</span>
          <span className="row gap-4"><BadgeCheck size={14} /> Verified brand</span>
        </div>
      ) : null}
    </div>
  );
}

/** Global "Deliver to" modal (header). */
export function PincodeModal() {
  const { pincodeOpen, closePincode, setPincode, pincode } = useShop();
  const user = useCurrentUser();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const apply = (pin) => {
    const loc = lookupPincode(pin);
    if (!loc) {
      setError("Please enter a valid 6-digit Indian pincode");
      return;
    }
    const plan = planFulfilment(pin, [], {});
    if (!plan.ok) {
      setError(plan.reason);
      return;
    }
    setPincode(pin, { city: loc.city, state: loc.state });
    setError("");
    setValue("");
    closePincode();
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Location is not available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Map to nearest known metro pincode (reverse geocoding happens on the backend in production)
        const { latitude, longitude } = pos.coords;
        const metros = [
          ["110001", 28.61, 77.21], ["400001", 19.07, 72.88], ["560001", 12.97, 77.59], ["302001", 26.91, 75.79],
          ["500001", 17.39, 78.49], ["600001", 13.08, 80.27], ["700001", 22.57, 88.36], ["831001", 22.8, 86.2],
        ];
        const best = metros.sort((a, b) => Math.hypot(a[1] - latitude, a[2] - longitude) - Math.hypot(b[1] - latitude, b[2] - longitude))[0];
        setLocating(false);
        apply(best[0]);
      },
      () => {
        setLocating(false);
        setError("We couldn't access your location. Please enter your pincode.");
      },
      { timeout: 8000 }
    );
  };

  return (
    <Modal open={pincodeOpen} onClose={closePincode} title="Choose your delivery location">
      <p className="small muted mb-16">Delivery speed, COD and offers depend on your location. We ship from Bhiwandi, Delhi NCR, Jaipur and Bengaluru.</p>

      {user?.addresses?.length ? (
        <div className="col gap-6 mb-16">
          <span className="label">Saved addresses</span>
          {user.addresses.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`radio-card ${pincode?.pincode === a.pincode ? "active" : ""}`}
              onClick={() => apply(a.pincode)}
            >
              <MapPin size={16} className="text-blue" />
              <span className="grow" style={{ textAlign: "left" }}>
                <b className="small">
                  {a.name} · {a.pincode}
                </b>
                <span className="xs muted" style={{ display: "block" }}>
                  {a.line1}, {a.city}
                </span>
              </span>
              <span className="badge badge-soft-gray">{a.type}</span>
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(value);
        }}
        className="row"
      >
        <input
          className="input"
          autoFocus
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn btn-blue" type="submit">
          Apply
        </button>
      </form>
      {error ? <p className="xs text-red mt-8">{error}</p> : null}

      <button type="button" className="link mt-12" onClick={locate} disabled={locating}>
        <Crosshair size={15} /> {locating ? "Detecting location…" : "Use my current location"}
      </button>

      <div className="mt-16">
        <span className="label">Popular cities</span>
        <div className="row wrap gap-6 mt-8">
          {popularPincodes.map((p) => (
            <button key={p.pincode} type="button" className="chip" onClick={() => apply(p.pincode)}>
              {p.city} <span className="count">{p.pincode}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
