/*
 * POST /api/admin/login → { token, admin }
 * Admin credentials are configured via ADMIN_USERS (JSON array) with
 * scrypt-hashed passwords — never plain text. Generate a hash with:
 *   node -e "import('./api/_lib/auth.js').then(m=>console.log(m.hashPassword('YourPass@123')))"
 * ADMIN_USERS='[{"email":"ops@d2cmall.in","name":"Ops","role":"super_admin","warehouseId":null,"hash":"scrypt$..."}]'
 */
import { ApiError, handler, readJson, validate } from "../../_lib/http.js";
import { signJwt, verifyPassword } from "../../_lib/auth.js";

export default handler(
  ["POST"],
  async (req) => {
    const b = await readJson(req);
    validate(b, { email: ["email"], password: ["string"] });
    let users = [];
    try {
      users = JSON.parse(process.env.ADMIN_USERS || "[]");
    } catch {
      throw new ApiError(503, "NOT_CONFIGURED", "ADMIN_USERS is not valid JSON");
    }
    const u = users.find((x) => x.email.toLowerCase() === b.email.toLowerCase());
    if (!u || !verifyPassword(b.password, u.hash)) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid admin ID or password");
    const token = signJwt({ sub: u.email, role: u.role, warehouseId: u.warehouseId || null }, { expiresIn: 8 * 3600 });
    return { token, admin: { email: u.email, name: u.name, role: u.role, warehouseId: u.warehouseId || null } };
  },
  { limit: 10, key: "admin-login" }
);
