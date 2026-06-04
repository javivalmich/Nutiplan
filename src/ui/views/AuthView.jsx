import { useState } from "react";
import { __PERF } from "../../data/runtime.js";
import { SDB } from "../../data/sdb.js";
import { PDB, SyncEngine } from "../../data/db.js";
import { THEME, SANS_EMOJI, SERIF_EMOJI, NUTIPLAN_LOGO } from "../constants";
import { EyeIcon, EyeOffIcon } from "../common/Icons";

// ═══════════════════════════════════════════════════════════════════════════
// AUTH VIEW — login / register (with two register flows)
// ═══════════════════════════════════════════════════════════════════════════
export function AuthView({ onLogin }) {
  __PERF.render("AuthView");  // PERF
  const serif = SERIF_EMOJI;
  const sans  = SANS_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted, accent:THEME.accent };

  const [tab,        setTab]        = useState("login"); // "login" | "register" | "forgot"
  const [regMode,    setRegMode]    = useState("auto");
  const [email,      setEmail]      = useState(() => {
    try {
      return localStorage.getItem("np_remembered_email") || "";
    } catch(e) {
      return "";
    }
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [pass,       setPass]       = useState("");
  const [role,       setRole]       = useState("user");
  const [nutriEmail, setNutriEmail] = useState("");
  const [error,        setError]        = useState("");
  const [info,         setInfo]         = useState(""); // mensaje éxito forgot
  const [loading,      setLoading]      = useState(false);
  const [showPass,     setShowPass]     = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false); // email confirmation pending
  const [applicationState, setApplicationState] = useState('none'); // 'none'|'submitted'|'pending'|'rejected'
  const [fullName,       setFullName]       = useState('');
  const [licenseNumber,  setLicenseNumber]  = useState('');
  const [specialty,      setSpecialty]      = useState('');
  const [phone,          setPhone]          = useState('');
  const [dni,            setDni]            = useState('');
  const [dniFile,        setDniFile]        = useState(null);
  const [dniFileError,   setDniFileError]   = useState("");

  const inp = { width:"100%", boxSizing:"border-box", padding:"11px 14px", borderRadius:8, border:"1.5px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:14, outline:"none" };

  const goTab = (t) => { setTab(t); setError(""); setInfo(""); setConfirmEmail(false); setApplicationState('none'); };
  const resetState = () => { setApplicationState('none'); setError(""); };

  // ── Validación de archivo DNI ──────────────────────────────────────────
  const handleDniFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "application/pdf"].includes(file.type)) {
      setDniFileError("Solo se aceptan archivos JPG o PDF");
      setDniFile(null); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDniFileError("El archivo no puede superar 5MB");
      setDniFile(null); return;
    }
    setDniFile(file);
    setDniFileError("");
  };

  // ── Recuperación de contraseña ─────────────────────────────────────────
  const handleForgot = async () => {
    setError(""); setInfo(""); setLoading(true);
    if (!email.trim()) {
      setError("Introduce tu email para recuperar la contraseña.");
      setLoading(false); return;
    }
    const { ok, error: sbErr } = await SDB.resetPassword(email.trim());
    if (!ok) {
      setError(sbErr || "No se pudo enviar el email. Inténtalo más tarde.");
    } else {
      setInfo("📬 Email enviado. Revisa tu bandeja (y spam). El link caduca en 1 hora.");
    }
    setLoading(false);
  };

  // ── Login / Registro ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setInfo(""); setLoading(true);
    try {
      if (tab === "login") {
        const u = await PDB.loginUser(email.trim(), pass);
        if (!u) {
          const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
          setError(isOffline ? "Sin conexión. Verifica tu internet." : "Email o contraseña incorrectos.");
          setLoading(false); return;
        }
        if (u.error === "CONFIRM_EMAIL") {
          setConfirmEmail(true);
          setLoading(false); return;
        }
        if (u.role === 'user') {
          const appStatus = await SDB.getNutriApplicationStatus(u.id);
          if (appStatus === 'pending')  { setApplicationState('pending');  setLoading(false); return; }
          if (appStatus === 'rejected') { setApplicationState('rejected'); setLoading(false); return; }
          // 'approved' or null → continue normal login flow
        }
        await SyncEngine.pullFromCloud(u.id);
        await SyncEngine.migrateExistingData();
        if (rememberMe && tab === "login") {
          try {
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail) {
              localStorage.setItem("np_remembered_email", normalizedEmail);
            }
            localStorage.removeItem("np_remembered_pass"); // migración: borra contraseñas guardadas en sesiones previas
          } catch(e) {}
        } else {
          try {
            localStorage.removeItem("np_remembered_email");
            localStorage.removeItem("np_remembered_pass");
          } catch(e) {}
        }
        onLogin(u);
      } else {
        if (!email.trim() || pass.length < 6) { setError("Completa todos los campos (mínimo 6 caracteres)."); setLoading(false); return; }

        if (role === 'nutritionist') {
          // Validate professional fields
          const dniRegex = /^[0-9]{8}[A-Za-z]$/;
          if (!fullName.trim())           { setError("El nombre completo es obligatorio."); setLoading(false); return; }
          if (!licenseNumber.trim())      { setError("El número de colegiado es obligatorio."); setLoading(false); return; }
          if (!specialty.trim())          { setError("La especialidad es obligatoria."); setLoading(false); return; }
          if (!phone.trim())              { setError("El teléfono es obligatorio."); setLoading(false); return; }
          if (!dniRegex.test(dni.trim())) { setError("DNI inválido — debe tener 8 dígitos y una letra (ej: 12345678A)."); setLoading(false); return; }
          if (!dniFile) { setError("El documento DNI es obligatorio."); setLoading(false); return; }

          // Create account always as role='user'
          const res = await PDB.createUser(email.trim(), pass, 'user');
          if (res.error) {
            if (res.error === "CONFIRM_EMAIL") { setConfirmEmail(true); setLoading(false); return; }
            const errMap = {
              "User already registered":     "Este email ya está registrado. Intenta iniciar sesión.",
              "Email already registered":    "Este email ya está registrado.",
              "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",
              "session_expired":             "Tu sesión expiró. Vuelve a iniciar sesión.",
            };
            const mapped = Object.entries(errMap).find(([k]) => String(res.error).includes(k));
            setError(mapped ? mapped[1] : (res.error || "Error al crear cuenta."));
            setLoading(false); return;
          }

          const uploadRes = await SDB.uploadDniDocument(res.user.id, dniFile);
          if (uploadRes.error) {
            setError("Error subiendo el documento. Inténtalo de nuevo.");
            setLoading(false); return;
          }

          const appRes = await SDB.submitNutriApplication(res.user.id, {
            full_name:        fullName.trim(),
            license_number:   licenseNumber.trim(),
            specialty:        specialty.trim(),
            phone:            phone.trim(),
            dni:              dni.trim(),
            dni_document_url: uploadRes.url,
          });
          if (appRes.error) {
            setError("Error enviando la solicitud. Intenta iniciar sesión para consultar el estado.");
            setLoading(false); return;
          }

          setApplicationState('submitted');
          setLoading(false); return;
        }

        // Normal user registration (role === 'user')
        const res = await PDB.createUser(email.trim(), pass, role);
        if (res.error) {
          if (res.error === "CONFIRM_EMAIL") {
            setConfirmEmail(true);
            setLoading(false); return;
          }
          const errMap = {
            "User already registered":     "Este email ya está registrado. Intenta iniciar sesión.",
            "Email already registered":    "Este email ya está registrado.",
            "Password should be at least": "La contraseña debe tener al menos 6 caracteres.",
            "session_expired":             "Tu sesión expiró. Vuelve a iniciar sesión.",
          };
          const mapped = Object.entries(errMap).find(([k]) => String(res.error).includes(k));
          setError(mapped ? mapped[1] : (res.error || "Error al crear cuenta."));
          setLoading(false); return;
        }
        if (role === "user" && regMode === "nutri") {
          const nutr = PDB.getUserByEmail(nutriEmail.trim());
          if (!nutr || nutr.role !== "nutritionist") {
            setError("No se encontró ningún nutricionista con ese email.");
            PDB.deleteUserLocal(res.user.id);
            setLoading(false); return;
          }
          PDB.assignClient(nutr.id, res.user.id);
        }
        await SyncEngine.pushToCloud(res.user.id);
        await SyncEngine.migrateExistingData();
        onLogin(res.user);
      }
    } catch(e) {
      setError("Error de conexión. Inténtalo de nuevo.");
      console.error("[AuthView]", e);
    }
    setLoading(false);
  };

  return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <div style={{width:"100%", maxWidth:400}}>
        <div style={{textAlign:"center", marginBottom:28}}>
          {/* Logo — PNG con alpha real. Sin fondo, sin filtros, aspect ratio preservado */}
          <img
            src={NUTIPLAN_LOGO}
            alt="NutiPlan"
            width={96}
            height={96}
            style={{
              display:"block",
              margin:"0 auto 8px",
              width:96,
              height:"auto",
              maxHeight:96,
              objectFit:"contain",
              background:"transparent",
              userSelect:"none",
            }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <h1 style={{fontFamily:serif, fontSize:26, color:Dk.text, margin:"0 0 4px"}}>NutiPlan</h1>
          <p style={{color:Dk.muted, fontSize:13, margin:0}}>Plataforma de nutrición personalizada</p>
        </div>

        <div style={{background:Dk.card, border:"1px solid "+Dk.border, borderRadius:16, padding:"22px 18px"}}>

          {/* ── Nutritionist application state screens ── */}
          {applicationState !== 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              {applicationState === 'submitted' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess, fontSize:14, lineHeight:1.6}}>
                    ✅ Solicitud enviada correctamente. El equipo la revisará en 1–3 días hábiles.
                  </div>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
              {applicationState === 'pending' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.accentBg18, border:"1px solid "+THEME.accent+"44", color:THEME.accent, fontSize:14, lineHeight:1.6}}>
                    🕐 Solicitud en revisión. El equipo está verificando tus credenciales.
                  </div>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
              {applicationState === 'rejected' && (
                <div style={{display:"flex", flexDirection:"column", gap:14}}>
                  <div style={{padding:"14px 16px", borderRadius:10, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:14, lineHeight:1.6}}>
                    ❌ Solicitud rechazada. Contacta con soporte para más información.
                  </div>
                  <button onClick={resetState} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ↩ Volver al formulario
                  </button>
                  <button onClick={() => goTab('login')} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab selector (oculto en forgot) ── */}
          {tab !== "forgot" && applicationState === 'none' && (
            <div style={{display:"flex", gap:4, marginBottom:20, background:Dk.card2, borderRadius:10, padding:4}}>
              {[["login","Iniciar sesión"],["register","Registrarse"]].map(([t,l]) => (
                <button key={t} onClick={() => goTab(t)} style={{flex:1, padding:"8px", borderRadius:7, border:"none", background:tab===t?THEME.accent:"transparent", color:tab===t?THEME.bgPage:Dk.muted, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>{l}</button>
              ))}
            </div>
          )}

          {/* ── Forgot password ── */}
          {tab === "forgot" && applicationState === 'none' && (
            <div>
              <button onClick={() => goTab("login")} style={{background:"none", border:"none", color:Dk.muted, cursor:"pointer", fontFamily:sans, fontSize:13, display:"flex", alignItems:"center", gap:4, padding:"0 0 16px", marginBottom:4}}>
                ← Volver al login
              </button>
              <div style={{fontFamily:serif, fontSize:18, color:Dk.text, marginBottom:6}}>🔑 Recuperar contraseña</div>
              <div style={{fontSize:12, color:Dk.muted, marginBottom:16, lineHeight:1.5}}>
                Te enviamos un link por email. Caduca en 1 hora.
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                <input type="email" placeholder="Tu email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleForgot()} style={inp}/>
                {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}
                {info  && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess,  fontSize:13, lineHeight:1.5}}>{info}</div>}
                <button onClick={handleForgot} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1}}>
                  {loading ? "Enviando..." : "Enviar link de recuperación →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Confirm email pending ── */}
          {confirmEmail && applicationState === 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <div style={{padding:"14px 16px", borderRadius:10, background:THEME.successBg18, border:"1px solid #16a34a44", color:THEME.colorSuccess, fontSize:14, lineHeight:1.6}}>
                Revisa tu bandeja de entrada y confirma tu email antes de continuar.
              </div>
              <button onClick={() => goTab("login")} style={{padding:"10px", borderRadius:10, border:"none", background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, cursor:"pointer"}}>
                ← Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* ── Login / Register form ── */}
          {tab !== "forgot" && !confirmEmail && applicationState === 'none' && (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={inp}/>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} placeholder="Contraseña (mín. 6 caracteres)" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={{...inp,paddingRight:42}}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>

              {tab === "login" && (
                <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", userSelect:"none"}}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{accentColor: THEME.accent, width:15, height:15, cursor:"pointer", flexShrink:0}}
                  />
                  <span style={{fontSize:13, color:Dk.muted, fontFamily:sans}}>Recuérdame</span>
                </label>
              )}

              {tab === "register" && (
                <>
                  <div>
                    <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>Tipo de cuenta</div>
                    <div style={{display:"flex", gap:8}}>
                      {[["user","👤","Usuario"],["nutritionist","🧑‍⚕️","Nutricionista"]].map(([r,ic,lbl]) => (
                        <button key={r} onClick={()=>setRole(r)} style={{flex:1, padding:"10px 6px", borderRadius:10, border:"2px solid "+(role===r?THEME.accent:Dk.border), background:role===r?THEME.accentBg18:Dk.card2, color:role===r?THEME.accent:Dk.muted, cursor:"pointer", fontFamily:sans}}>
                          <div style={{fontSize:22, marginBottom:3}}>{ic}</div>
                          <div style={{fontSize:12, fontWeight:700}}>{lbl}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {role === "user" && (
                    <div>
                      <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>¿Cómo quieres usar la app?</div>
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <button onClick={()=>setRegMode("auto")} style={{padding:"11px 14px", borderRadius:10, border:"2px solid "+(regMode==="auto"?THEME.accent:Dk.border), background:regMode==="auto"?THEME.accentBg18:Dk.card2, color:Dk.text, cursor:"pointer", fontFamily:sans, textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                          <span style={{fontSize:20}}>🤖</span>
                          <div><div style={{fontSize:13, fontWeight:700, color:regMode==="auto"?THEME.accent:Dk.text}}>Plan automático</div><div style={{fontSize:11, color:Dk.muted}}>El sistema genera tu plan según tu perfil</div></div>
                          {regMode==="auto" && <span style={{marginLeft:"auto", color:THEME.accent}}>✓</span>}
                        </button>
                        <button onClick={()=>setRegMode("nutri")} style={{padding:"11px 14px", borderRadius:10, border:"2px solid "+(regMode==="nutri"?THEME.colorPurple:Dk.border), background:regMode==="nutri"?THEME.purpleBg18:Dk.card2, color:Dk.text, cursor:"pointer", fontFamily:sans, textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                          <span style={{fontSize:20}}>🧑‍⚕️</span>
                          <div><div style={{fontSize:13, fontWeight:700, color:regMode==="nutri"?THEME.colorPurpleLight:Dk.text}}>Me recomienda mi nutricionista</div><div style={{fontSize:11, color:Dk.muted}}>Te vinculas automáticamente a su consulta</div></div>
                          {regMode==="nutri" && <span style={{marginLeft:"auto", color:THEME.colorPurpleLight}}>✓</span>}
                        </button>
                      </div>
                      {regMode === "nutri" && (
                        <div style={{marginTop:8}}>
                          <input type="email" placeholder="Email de tu nutricionista" value={nutriEmail} onChange={e=>setNutriEmail(e.target.value)} style={{...inp, borderColor:THEME.colorPurple}}/>
                          <div style={{fontSize:11, color:THEME.colorPurpleLight, marginTop:5}}>Tu cuenta quedará vinculada a su consulta automáticamente.</div>
                        </div>
                      )}
                    </div>
                  )}
                  {role === "nutritionist" && (
                    <div style={{display:"flex", flexDirection:"column", gap:8}}>
                      <div style={{fontSize:11, color:Dk.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4}}>Datos profesionales</div>
                      <input type="text" placeholder="Nombre completo" value={fullName} onChange={e=>setFullName(e.target.value)} style={inp}/>
                      <input type="text" placeholder="Número de colegiado / licencia" value={licenseNumber} onChange={e=>setLicenseNumber(e.target.value)} style={inp}/>
                      <input type="text" placeholder="Especialidad" value={specialty} onChange={e=>setSpecialty(e.target.value)} style={inp}/>
                      <input type="tel" placeholder="Teléfono" value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/>
                      <input type="text" placeholder="DNI (ej: 12345678A)" value={dni} onChange={e=>setDni(e.target.value)} style={inp}/>
                      <div>
                        <div style={{fontSize:11, color:Dk.muted, marginBottom:4}}>Documento DNI (JPG o PDF, máx 5MB) *</div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.pdf"
                          onChange={handleDniFileChange}
                          style={{...inp, padding:"8px"}}
                        />
                        {dniFileError && <div style={{padding:"6px 8px", borderRadius:6, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:12, marginTop:4}}>{dniFileError}</div>}
                      </div>
                      <div style={{fontSize:11, color:Dk.muted, lineHeight:1.5}}>Tu solicitud será revisada en 1–3 días hábiles. Recibirás acceso cuando sea aprobada.</div>
                    </div>
                  )}
                </>
              )}

              {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}

              <button onClick={handleSubmit} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4, opacity:loading?0.7:1}}>
                {loading ? "..." : tab==="login" ? "Entrar →" : "Crear cuenta →"}
              </button>

              {/* Enlace "¿Olvidaste tu contraseña?" solo en login */}
              {tab === "login" && (
                <button onClick={() => goTab("forgot")} style={{background:"none", border:"none", color:Dk.muted, cursor:"pointer", fontFamily:sans, fontSize:12, textDecoration:"underline", padding:"2px 0", textAlign:"center"}}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}

          {/* Demo accounts — solo en login */}
          {tab === "login" && applicationState === 'none' && (
            <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid "+Dk.border}}>
              <div style={{fontSize:11, color:Dk.muted, textAlign:"center", marginBottom:8}}>Cuentas demo (contraseña: demo123)</div>
              <div style={{display:"flex", flexDirection:"column", gap:5}}>
                {[["nutri@demo.com","🧑‍⚕️","Nutricionista"],["maria@demo.com","👤","Usuario (con nutricionista)"],["carlos@demo.com","👤","Usuario (con nutricionista)"]].map(([em,ic,lbl]) => (
                  <button key={em} onClick={()=>{setEmail(em);setPass("demo123");setTab("login");}} style={{padding:"7px 10px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:7, textAlign:"left"}}>
                    <span>{ic}</span><span style={{flex:1}}>{lbl}</span><span style={{color:Dk.border, fontSize:10}}>{em}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
