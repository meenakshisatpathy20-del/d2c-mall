import { useState } from "react";
import { Briefcase, Home, MapPin } from "lucide-react";
import { lookupPincode } from "../../data/logistics";
import { validateAddress } from "../../lib/services/account";
import { cx } from "../../lib/format";
import { Field } from "../common/ui";

const EMPTY = { name: "", phone: "", pincode: "", line1: "", line2: "", landmark: "", city: "", state: "", type: "Home", label: "", isDefault: false };

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = "Save address" }) {
  const [a, setA] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    const next = { ...a, [k]: v };
    if (k === "pincode" && /^\d{6}$/.test(v)) {
      const loc = lookupPincode(v);
      if (loc) {
        next.city = next.city || loc.city;
        next.state = loc.state.split(" / ")[0];
      }
    }
    setA(next);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validateAddress(a);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(a);
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <Field label="Full name" error={errors.name}>
        <input className={cx("input", errors.name && "invalid")} value={a.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <div className="input-group">
          <span className="addon">+91</span>
          <input className="input" inputMode="numeric" maxLength={10} value={a.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} autoComplete="tel-national" />
        </div>
      </Field>
      <Field label="Pincode" error={errors.pincode} hint={a.pincode.length === 6 && lookupPincode(a.pincode) ? `📍 ${lookupPincode(a.pincode).city}, ${lookupPincode(a.pincode).state}` : "City & state auto-fill from pincode"}>
        <input className={cx("input", errors.pincode && "invalid")} inputMode="numeric" maxLength={6} value={a.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
      </Field>
      <Field label="City / District" error={errors.city}>
        <input className={cx("input", errors.city && "invalid")} value={a.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
      </Field>
      <Field label="Flat, house no., building" error={errors.line1} className="span-2">
        <input className={cx("input", errors.line1 && "invalid")} value={a.line1} onChange={(e) => set("line1", e.target.value)} autoComplete="address-line1" />
      </Field>
      <Field label="Area, street, sector" className="span-2">
        <input className="input" value={a.line2} onChange={(e) => set("line2", e.target.value)} autoComplete="address-line2" />
      </Field>
      <Field label="Landmark (optional)">
        <input className="input" value={a.landmark} onChange={(e) => set("landmark", e.target.value)} />
      </Field>
      <Field label="State" error={errors.state}>
        <input className={cx("input", errors.state && "invalid")} value={a.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" />
      </Field>
      <div className="field span-2">
        <label>Save address as</label>
        <div className="row gap-6 wrap">
          {[["Home", Home], ["Work", Briefcase], ["Other", MapPin]].map(([t, Icon]) => (
            <button key={t} type="button" className={cx("chip", a.type === t && "active")} onClick={() => set("type", t)}>
              <Icon size={14} /> {t}
            </button>
          ))}
          {a.type === "Other" ? <input className="input" style={{ maxWidth: 220 }} placeholder="Label e.g. Parents' home" value={a.label} onChange={(e) => set("label", e.target.value)} /> : null}
        </div>
      </div>
      <label className="check span-2">
        <input type="checkbox" checked={a.isDefault} onChange={(e) => set("isDefault", e.target.checked)} /> Make this my default address
      </label>
      <div className="row gap-6 span-2">
        <button className="btn" type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="btn btn-outline" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
