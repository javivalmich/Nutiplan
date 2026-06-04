import { useState, useEffect } from "react";
import { SDB } from "../../data/sdb.js";
import { THEME, SANS_EMOJI } from "../constants";

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL — visible only to javivalmich@gmail.com
// ═══════════════════════════════════════════════════════════════════════════
export const AdminPanel = ({ currentUser }) => {
  const sans  = SANS_EMOJI;
  const Dk    = { bg: THEME.bgPage, card: THEME.bgCard, card2: THEME.bgCard2, border: THEME.borderDark, text: THEME.textPrimary, muted: THEME.textMuted, accent: THEME.accent };

  const [section,      setSection]      = useState("applications");
  const [applications, setApplications] = useState([]);
  const [users,        setUsers]        = useState([]);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading,setActionLoading]= useState({}); // { [id]: true }
  const [error,        setError]        = useState(null);
  const [appErrors,    setAppErrors]    = useState({});

  const isSuperAdmin = currentUser.email === 'javivalmich@gmail.com';

  const loadApplications = async () => {
    setLoadingApps(true);
    const res = await SDB.adminGetApplications();
    setLoadingApps(false);
    if (res.error) { setError("Error cargando solicitudes"); return; }
    setApplications(res.data);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await SDB.adminGetUsers();
    setLoadingUsers(false);
    if (res.error) { setError("Error cargando usuarios"); return; }
    setUsers(res.data);
  };

  useEffect(() => {
    loadApplications();
    loadUsers();
  }, []);

  const withAction = async (id, fn) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    setError(null);
    try { await fn(); } catch(e) { setError(e.message || "Error"); }
    setActionLoading(prev => ({ ...prev, [id]: false }));
  };

  const handleApprove = (appId) => withAction(appId, async () => {
    const res = await SDB.adminApproveApplication(appId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadApplications();
    await loadUsers();
  });

  const handleReject = (appId) => withAction(appId, async () => {
    const res = await SDB.adminRejectApplication(appId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadApplications();
  });

  const handleSetRole = (userId, role) => withAction(userId + "_role", async () => {
    const res = await SDB.adminSetUserRole(userId, role);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handleSetActive = (userId, active) => withAction(userId + "_active", async () => {
    const res = await SDB.adminSetUserActive(userId, active);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handlePromote = (userId) => withAction(userId + "_promote", async () => {
    const res = await SDB.adminPromoteToAdmin(userId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const handleDemote = (userId) => withAction(userId + "_demote", async () => {
    const res = await SDB.adminDemoteFromAdmin(userId);
    if (res.error) throw new Error(JSON.stringify(res.error));
    await loadUsers();
  });

  const cardStyle = { background: Dk.card, borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 10 };
  const labelStyle = { fontSize: 10, color: Dk.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 };
  const valueStyle = { fontSize: 13, color: Dk.text, fontWeight: 500 };
  const btnBase = { border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer" };

  const pendingApps = applications.filter(a => a.status === "pending");

  return (
    <div style={{ fontFamily: sans }}>
      {/* Section switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ key: "applications", label: "Solicitudes" + (pendingApps.length ? ` (${pendingApps.length})` : "") },
          { key: "users",        label: "Usuarios" }].map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            ...btnBase,
            background: section === s.key ? Dk.accent : Dk.card2,
            color:      section === s.key ? "#fff" : Dk.text,
            border:     "1px solid " + (section === s.key ? Dk.accent : Dk.border),
          }}>{s.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: THEME.bgErrorLight, border: "1px solid " + THEME.colorError, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: THEME.colorErrorDark, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: THEME.colorErrorDark }}>✕</button>
        </div>
      )}

      {/* ── Solicitudes ── */}
      {section === "applications" && (
        <div>
          {loadingApps && <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>Cargando…</div>}
          {!loadingApps && applications.length === 0 && (
            <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>No hay solicitudes.</div>
          )}
          {applications.map(app => {
            const busy = !!actionLoading[app.id];
            const isPending = app.status === "pending";
            return (
              <div key={app.id} style={{ ...cardStyle, opacity: busy ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Dk.text }}>{app.full_name}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: app.status === "approved" ? THEME.successBg18 : app.status === "rejected" ? THEME.errorBg18 : THEME.accentBg22,
                    color:      app.status === "approved" ? THEME.colorSuccessDark : app.status === "rejected" ? THEME.colorErrorDark : Dk.accent,
                  }}>{app.status}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginBottom: 10 }}>
                  {[
                    ["Email",       app.email        || "—"],
                    ["Colegiado",   app.license_number],
                    ["Especialidad",app.specialty],
                    ["Teléfono",    app.phone],
                    ["DNI",         app.dni],
                    ["Fecha",       app.submitted_at ? new Date(app.submitted_at).toLocaleDateString("es-ES") : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={labelStyle}>{k}</div>
                      <div style={valueStyle}>{v}</div>
                    </div>
                  ))}
                </div>
                {app.dni_document_url && (
                  <div style={{ marginBottom: 8 }}>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setAppErrors(prev => ({ ...prev, [app.id]: null }));
                        const res = await SDB.getDniDocumentUrl(app.user_id, app.dni_document_url);
                        if (res.error) {
                          setAppErrors(prev => ({ ...prev, [app.id]: "Error abriendo el documento DNI." }));
                        } else {
                          window.open(res.signedUrl, "_blank");
                        }
                      }}
                      style={{ ...btnBase, background: Dk.card2, color: Dk.text, border: "1px solid " + Dk.border }}
                    >
                      📄 Ver DNI
                    </button>
                    {appErrors[app.id] && (
                      <div style={{ fontSize: 11, color: THEME.colorError2, marginTop: 4 }}>{appErrors[app.id]}</div>
                    )}
                  </div>
                )}
                {isPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={busy} onClick={() => handleApprove(app.id)} style={{ ...btnBase, background: THEME.colorSuccessDark, color: "#fff", flex: 1 }}>
                      {busy ? "…" : "✅ Aprobar"}
                    </button>
                    <button disabled={busy} onClick={() => handleReject(app.id)} style={{ ...btnBase, background: THEME.colorErrorDark, color: "#fff", flex: 1 }}>
                      {busy ? "…" : "❌ Rechazar"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Usuarios ── */}
      {section === "users" && (
        <div>
          {loadingUsers && <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>Cargando…</div>}
          {!loadingUsers && users.length === 0 && (
            <div style={{ color: Dk.muted, fontSize: 13, padding: "12px 0" }}>No hay usuarios.</div>
          )}
          {users.filter(u => u.id !== currentUser.id).map(u => {
            const busyRole    = !!actionLoading[u.id + "_role"];
            const busyActive  = !!actionLoading[u.id + "_active"];
            const busyPromote = !!actionLoading[u.id + "_promote"];
            const busyDemote  = !!actionLoading[u.id + "_demote"];
            const busy        = busyRole || busyActive || busyPromote || busyDemote;
            const isAdminUser = u.role === 'admin';
            const isSuperAdminUser = u.email === 'javivalmich@gmail.com';

            return (
              <div key={u.id} style={{ ...cardStyle, opacity: busy ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: Dk.text, wordBreak: "break-all" }}>
                    {u.email}
                    {isSuperAdminUser && <span style={{ marginLeft: 6, fontSize: 10, color: THEME.colorPurpleLight, fontWeight: 700 }}>⭐ super_admin</span>}
                    {isAdminUser && !isSuperAdminUser && <span style={{ marginLeft: 6, fontSize: 10, color: Dk.accent, fontWeight: 700 }}>🔑 admin</span>}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, marginLeft: 8, flexShrink: 0,
                    background: u.is_active ? THEME.successBg18 : THEME.errorBg18,
                    color:      u.is_active ? THEME.colorSuccessDark : THEME.colorErrorDark,
                  }}>{u.is_active ? "activo" : "inactivo"}</span>
                </div>
                <div style={{ fontSize: 11, color: Dk.muted, marginBottom: 10 }}>
                  Registro: {u.created_at ? new Date(u.created_at).toLocaleDateString("es-ES") : "—"}
                </div>

                {/* Admin / super_admin row: only super_admin sees the demote button */}
                {(isAdminUser || isSuperAdminUser) ? (
                  isSuperAdmin && !isSuperAdminUser && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={busy}
                        onClick={() => handleDemote(u.id)}
                        style={{ ...btnBase, background: THEME.colorErrorDark, color: "#fff" }}
                      >
                        {busyDemote ? "…" : "✕ Quitar admin"}
                      </button>
                    </div>
                  )
                ) : (
                  /* user / nutritionist row */
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      value={u.role}
                      disabled={busy}
                      onChange={e => handleSetRole(u.id, e.target.value)}
                      style={{ flex: 1, minWidth: 120, padding: "7px 10px", borderRadius: 8, border: "1px solid " + Dk.border, background: Dk.card2, color: Dk.text, fontFamily: sans, fontSize: 12, cursor: "pointer" }}
                    >
                      <option value="user">user</option>
                      <option value="nutritionist">nutritionist</option>
                    </select>
                    <button
                      disabled={busy}
                      onClick={() => handleSetActive(u.id, !u.is_active)}
                      style={{ ...btnBase, background: u.is_active ? THEME.colorErrorDark : THEME.colorSuccessDark, color: "#fff", whiteSpace: "nowrap" }}
                    >
                      {busyActive ? "…" : u.is_active ? "Desactivar" : "Activar"}
                    </button>
                    {isSuperAdmin && (
                      <button
                        disabled={busy}
                        onClick={() => handlePromote(u.id)}
                        style={{ ...btnBase, background: Dk.accent, color: "#fff", whiteSpace: "nowrap" }}
                      >
                        {busyPromote ? "…" : "⭐ Admin"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
