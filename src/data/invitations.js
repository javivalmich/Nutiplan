import { SDB, _sbToLocalPlan } from "./sdb.js";
import { PDB, SyncEngine } from "./db.js";
import { __TRACE } from "./runtime.js";

// ── Token helpers ─────────────────────────────────────────────────────────
function _genToken() {
  // 6-char uppercase alphanumeric, URL-safe, easy to type
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  let t = "";
  for (let i = 0; i < 6; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

// PDB layer — localStorage store for invitations (offline / fallback)
export const InvitationStore = {
  _all: () => PDB.getInvitations(),
  _save: (arr) => PDB.saveInvitations(arr),

  create: (ownerUid, planId) => {
    let token;
    // Retry until we get a unique token (astronomically unlikely to collide)
    do { token = _genToken(); }
    while (InvitationStore._all().find(i => i.token === token));

    const inv = {
      token,
      ownerUid,
      planId,
      usedBy:    null,
      usedAt:    null,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    };
    InvitationStore._save([...InvitationStore._all(), inv]);
    // Mirror to Supabase async
    SyncEngine.push(() => SDB.createInvitation(
      inv.token,
      inv.ownerUid,
      inv.planId,
      new Date(inv.expiresAt).toISOString(),
    ));
    return token;
  },

  // Returns:
  //   { ok:true,  invitation: { token, planId, plan, ownerUid } }
  //   { ok:false, errorCode, errorMsg }
  //
  // errorCode values:
  //   "empty"            — token vacío o longitud incorrecta (sin llamada a red)
  //   "session_expired"  — JWT caducado, _rest devolvió 401
  //   "timeout"          — la petición superó el límite de tiempo
  //   "rpc_missing"      — la función no existe en Supabase (migration pendiente)
  //                        o respuesta inesperada (data vacío)
  //   "network"          — error de red genérico, el usuario puede reintentar
  //   "token_not_found"  — el código no existe en la base de datos
  //   "token_expired"    — el código existe pero ha caducado (y no fue usado)
  //   "token_already_used" — el código ya fue canjeado por otro usuario
  //   "self_redemption"  — el propietario intenta canjear su propio código
  //   "plan_not_found"   — el token es válido pero el plan ya no existe;
  //                        el token NO se consume
  //   "invalid_or_used"  — fallback genérico (reason desconocido de la RPC,
  //                        o token no encontrado en modo offline)
  //
  // Paths:
  //  • Online (SDB._token presente):
  //      RPC redeem_invitation_and_get_plan devuelve SETOF jsonb, siempre 1 fila.
  //      { success:true,  plan }        → token reclamado atómicamente, ok:true
  //      { success:false, reason }      → mapeado a errorCode específico, ok:false
  //      error HTTP/_rest               → errorCode de red/auth, ok:false
  //  • Offline (SDB._token ausente):
  //      Busca en localStorage; solo útil en demo o mismo dispositivo.
  validate: async (token) => {
    if (typeof token !== "string") return { ok:false, errorCode:"empty", errorMsg:"Código vacío." };
    const clean = token.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 6) {
      return { ok:false, errorCode:"empty", errorMsg:"El código debe tener 6 caracteres." };
    }

    console.info("[INVITE_VALIDATE] token:", clean, "uid:", SDB.getUid(), "online:", !!SDB._token);
    __TRACE.log("invitation:validate:start", { tokenInput: token, tokenClean: clean, hasSdbToken: !!SDB._token, sdbUid: SDB.getUid() });

    // 1. Online path — transactional: validate + claim + fetch plan in one RPC.
    //    redeem_invitation_and_get_plan devuelve SETOF jsonb (siempre 1 fila):
    //      { success:true,  plan:{…} }         → éxito, token reclamado
    //      { success:false, reason:"TOKEN_*" } → razón explícita del fallo
    if (SDB._token) {
      console.info("[INVITE_REDEEM] calling redeem_invitation_and_get_plan");
      const { data, error } = await SDB.redeemInvitation(clean, SDB.getUid());
      __TRACE.log("invitation:rpc:response", {
        dataLen: Array.isArray(data) ? data.length : typeof data,
        error,
      });

      if (error) {
        // _rest devuelve string para errores de red/timeout/401,
        // pero un objeto PostgREST {code,message,hint,details,status} para errores HTTP.
        // Normalizar a string antes de clasificar.
        const errStr =
          typeof error === "string"
            ? error
            : (error?.message || error?.code || error?.hint || JSON.stringify(error));

        const errorCode =
          errStr === "session_expired"
            ? "session_expired"
          : errStr.includes("timeout")
            ? "timeout"
          : (errStr.includes("PGRST") || errStr.includes("404") ||
             errStr.includes("could not find") || errStr.includes("does not exist"))
            ? "rpc_missing"
          : "network";

        const errorMsg =
          errorCode === "session_expired"
            ? "Tu sesión ha caducado. Inicia sesión otra vez."
          : errorCode === "timeout"
            ? "El servidor tardó demasiado. Inténtalo de nuevo."
          : errorCode === "rpc_missing"
            ? "Error de configuración del servidor. Ejecuta la migration SQL y vuelve a intentarlo."
          : "Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.";

        console.warn("[INVITE_REDEEM] RPC error:", error, "→ errorCode:", errorCode, "errStr:", errStr);
        return { ok: false, errorCode, errorMsg };
      }

      // La RPC siempre devuelve exactamente 1 fila JSONB
      if (!Array.isArray(data) || data.length === 0) {
        return { ok:false, errorCode:"rpc_missing",
                 errorMsg:"Respuesta inesperada del servidor. Inténtalo de nuevo." };
      }

      const rpcResult = data[0];

      // Error con reason explícito — el token NO fue reclamado
      if (!rpcResult.success) {
        const REASON_MAP = {
          TOKEN_NOT_FOUND:    { errorCode:"token_not_found",    errorMsg:"El código no existe. Comprueba que lo has escrito bien." },
          TOKEN_EXPIRED:      { errorCode:"token_expired",      errorMsg:"Este código ha caducado. Pide uno nuevo a tu amigo." },
          TOKEN_ALREADY_USED: { errorCode:"token_already_used", errorMsg:"Este código ya fue canjeado. Cada código es de un solo uso." },
          SELF_REDEMPTION:    { errorCode:"self_redemption",    errorMsg:"No puedes canjear tu propio código de invitación." },
          PLAN_NOT_FOUND:     { errorCode:"plan_not_found",     errorMsg:"El plan de este código ya no existe. Pide uno nuevo a tu amigo." },
        };
        const mapped = REASON_MAP[rpcResult.reason]
          || { errorCode:"invalid_or_used", errorMsg:"Código no válido." };
        console.info("[INVITE_REDEEM] rejected — reason:", rpcResult.reason);
        __TRACE.log("invitation:rpc:rejected", { reason: rpcResult.reason });
        return { ok:false, ...mapped };
      }

      // Éxito — rpcResult.plan es la fila de plans serializada por row_to_json
      const planRow = rpcResult.plan;
      const planId  = planRow.id;
      const plan    = _sbToLocalPlan(planRow);

      const all = InvitationStore._all().map(i =>
        i.token === clean ? { ...i, usedBy: SDB.getUid(), usedAt: Date.now() } : i
      );
      InvitationStore._save(all);
      console.info("[INVITE_REDEEM] claimed — planId:", planId);
      __TRACE.log("invitation:rpc:claimed", { planId });
      return { ok:true, invitation: { token:clean, planId, plan, ownerUid:null } };
    }

    // 2. Offline fallback: localStorage only. Only useful for demo/single-device.
    const inv = InvitationStore._all().find(
      i => i.token === clean && !i.usedBy && i.expiresAt > Date.now()
    );
    if (!inv) {
      return { ok:false, errorCode:"invalid_or_used",
               errorMsg:"Código no encontrado o ya utilizado (modo offline)." };
    }
    const all = InvitationStore._all().map(i =>
      i.token === clean ? { ...i, usedBy: "offline", usedAt: Date.now() } : i
    );
    InvitationStore._save(all);
    __TRACE.log("invitation:offline:claimed", { planId: inv.planId });
    return { ok:true, invitation:inv };
  },

  // claim() kept for cases where validate() already claimed atomically via RPC.
  // Only needed for the offline localStorage fallback path.
  claim: async (token, claimantUid) => {
    const clean = token.trim().toUpperCase();
    const all = InvitationStore._all().map(i =>
      i.token === clean ? { ...i, usedBy: claimantUid, usedAt: Date.now() } : i
    );
    InvitationStore._save(all);
    // Mirror to Supabase only if RPC wasn't already used (offline recovery)
    SyncEngine.push(() => SDB.markInvitationUsed(clean, claimantUid));
  },
};
