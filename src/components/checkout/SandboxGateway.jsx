/*
 * Razorpay-style sandbox checkout used when VITE_RAZORPAY_KEY_ID is not set.
 * Lets you simulate success, failure and cancellation to exercise the
 * reserve → pay → verify → confirm / release pipeline end-to-end.
 */
import { useEffect, useState } from "react";
import { Building2, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Wallet, X } from "lucide-react";
import { onSandboxRequest } from "../../lib/services/payments";
import { formatINR, cx } from "../../lib/format";
import { Modal } from "../common/ui";

const APPS = [
  { id: "gpay", name: "GPay", color: "#1a73e8" },
  { id: "phonepe", name: "PhonePe", color: "#5f259f" },
  { id: "paytm", name: "Paytm", color: "#00baf2" },
  { id: "bhim", name: "BHIM", color: "#f47216" },
];
const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra", "Yes Bank"];
const WALLETS = ["Paytm Wallet", "Amazon Pay", "Simpl (Pay later)", "LazyPay"];

export default function SandboxGateway() {
  const [req, setReq] = useState(null);
  const [tab, setTab] = useState("upi");
  const [upiApp, setUpiApp] = useState("gpay");
  const [vpa, setVpa] = useState("");
  const [card, setCard] = useState({ number: "4111 1111 1111 1111", expiry: "12/30", cvv: "123", name: "" });
  const [bank, setBank] = useState(BANKS[0]);
  const [wallet, setWallet] = useState(WALLETS[0]);
  const [processing, setProcessing] = useState(null);

  useEffect(
    () =>
      onSandboxRequest((r) => {
        setReq(r);
        setTab(r.method === "cod" ? "upi" : r.method);
        setProcessing(null);
        setCard((c) => ({ ...c, name: r.user?.name?.toUpperCase() || "" }));
      }),
    []
  );

  const finish = (status) => {
    if (!req) return;
    if (status === "dismissed") {
      req.resolve({ status: "dismissed" });
      setReq(null);
      return;
    }
    setProcessing(status);
    const instrument =
      tab === "upi" ? `UPI · ${vpa || `${(req.user?.name || "user").split(" ")[0].toLowerCase()}@ok${upiApp}`}` :
      tab === "card" ? `Card •••• ${card.number.replace(/\s/g, "").slice(-4)}` :
      tab === "netbanking" ? `NetBanking · ${bank}` : `Wallet · ${wallet}`;
    setTimeout(() => {
      req.resolve(status === "success" ? { status: "success", instrument } : { status: "failed", error: tab === "card" ? "Card declined by issuing bank" : "Payment was declined" });
      setReq(null);
      setProcessing(null);
    }, 1400);
  };

  const methods = [
    { id: "upi", label: "UPI / QR", icon: Smartphone },
    { id: "card", label: "Cards", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", icon: Landmark },
    { id: "wallet", label: "Wallets", icon: Wallet },
  ];

  return (
    <Modal open={!!req} onClose={() => !processing && finish("dismissed")} size="mid" hideHead>
      {req ? (
        <div className="gw">
          <aside className="gw-side">
            <div className="gw-brand">
              <img src="/favicon.svg" alt="" width={32} height={32} />
              <div>
                D2C Mall
                <div className="xs" style={{ opacity: 0.7, fontWeight: 600 }}>
                  Order {req.orderId}
                </div>
              </div>
            </div>
            <div>
              <div className="xs" style={{ opacity: 0.7 }}>Amount payable</div>
              <div className="gw-amount">{formatINR(req.amount)}</div>
            </div>
            <div className="gw-methods">
              {methods.map((m) => (
                <button key={m.id} type="button" className={cx(tab === m.id && "active")} onClick={() => setTab(m.id)}>
                  <m.icon size={16} /> {m.label}
                </button>
              ))}
            </div>
            <div className="xs row gap-6" style={{ marginTop: "auto", opacity: 0.75 }}>
              <Lock size={13} /> Secured by Razorpay · Test mode
            </div>
          </aside>

          <section className="gw-main">
            <div className="row between">
              <span className="badge badge-soft-amber">Sandbox · no real money is charged</span>
              <button className="icon-btn sm" onClick={() => finish("dismissed")} disabled={!!processing} aria-label="Cancel payment">
                <X size={18} />
              </button>
            </div>

            {tab === "upi" ? (
              <>
                <span className="label">Pay using any UPI app</span>
                <div className="upi-apps">
                  {APPS.map((a) => (
                    <button key={a.id} type="button" className={cx(upiApp === a.id && "active")} onClick={() => setUpiApp(a.id)}>
                      <span className="logo" style={{ background: a.color }}>{a.name[0]}</span>
                      {a.name}
                    </button>
                  ))}
                </div>
                <div className="row gap-16">
                  <div className="qr" aria-label="UPI QR code" />
                  <div className="col gap-6 grow">
                    <span className="small muted">Scan the QR with any UPI app, or enter your UPI ID</span>
                    <input className="input" placeholder="yourname@okhdfcbank" value={vpa} onChange={(e) => setVpa(e.target.value)} />
                  </div>
                </div>
              </>
            ) : null}

            {tab === "card" ? (
              <div className="form-grid">
                <div className="field span-2">
                  <label>Card number</label>
                  <input className="input" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                </div>
                <div className="field">
                  <label>Expiry</label>
                  <input className="input" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                </div>
                <div className="field">
                  <label>CVV</label>
                  <input className="input" type="password" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                </div>
                <div className="field span-2">
                  <label>Name on card</label>
                  <input className="input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                </div>
                <p className="xs muted span-2">Test cards: 4111 1111 1111 1111 (success) · use "Simulate failure" to test declines.</p>
              </div>
            ) : null}

            {tab === "netbanking" ? (
              <div className="grid grid-2">
                {BANKS.map((b) => (
                  <button key={b} type="button" className={cx("radio-card", bank === b && "active")} onClick={() => setBank(b)}>
                    <Building2 size={16} className="text-blue" /> <span className="small bold">{b}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {tab === "wallet" ? (
              <div className="grid grid-2">
                {WALLETS.map((w) => (
                  <button key={w} type="button" className={cx("radio-card", wallet === w && "active")} onClick={() => setWallet(w)}>
                    <Wallet size={16} className="text-blue" /> <span className="small bold">{w}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="col gap-6" style={{ marginTop: "auto" }}>
              <button className="btn btn-blue btn-lg btn-block" onClick={() => finish("success")} disabled={!!processing}>
                {processing === "success" ? <span className="spinner" /> : <ShieldCheck size={18} />}
                {processing === "success" ? "Processing payment…" : `Pay ${formatINR(req.amount)}`}
              </button>
              <button className="btn btn-outline btn-block" onClick={() => finish("failed")} disabled={!!processing}>
                {processing === "failed" ? <span className="spinner" /> : null} Simulate payment failure
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
