import { useState } from "react";
import { THEME, NUTIPLAN_LOGO, SANS_EMOJI, SERIF_EMOJI } from "../constants";
import { SDB } from "../../data/sdb.js";
import { EyeIcon, EyeOffIcon } from "../common/Icons";

// ═══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD VIEW — shown when user arrives via Supabase recovery link
// ═══════════════════════════════════════════════════════════════════════════
export function ResetPasswordView({ token, onDone }) {
  const sans  = SANS_EMOJI;
  const serif = SERIF_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted };
  const inp = { width:"100%", boxSizing:"border-box", padding:"11px 14px", borderRadius:8, border:"1.5px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:14, outline:"none" };

  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [success,          setSuccess]          = useState(false);
  const [showNewPass,      setShowNewPass]      = useState(false);
  const [showConfirmPass,  setShowConfirmPass]  = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPass !== confirmPass) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const { ok, error: sbErr } = await SDB.withTemporaryToken(token, () => {
      return SDB.updatePassword(newPass);
    });
    setLoading(false);
    if (!ok) { setError(sbErr || "No se pudo actualizar la contraseña. El enlace puede haber caducado."); return; }
    setSuccess(true);
    setTimeout(() => onDone(), 3000);
  };

  return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <div style={{width:"100%", maxWidth:400}}>
        <div style={{textAlign:"center", marginBottom:28}}>
          <img src={NUTIPLAN_LOGO} alt="NutiPlan" style={{display:"block", margin:"0 auto 8px", width:96, height:"auto", maxHeight:96, objectFit:"contain", background:"transparent", userSelect:"none"}} onError={e => { e.currentTarget.style.display = "none"; }} />
          <h1 style={{fontFamily:serif, fontSize:26, color:Dk.text, margin:"0 0 4px"}}>NutiPlan</h1>
          <p style={{color:Dk.muted, fontSize:13, margin:0}}>Plataforma de nutrición personalizada</p>
        </div>
        <div style={{background:Dk.card, border:"1px solid "+Dk.border, borderRadius:16, padding:"22px 18px"}}>
          <div style={{fontFamily:serif, fontSize:18, color:Dk.text, marginBottom:6}}>🔐 Nueva contraseña</div>
          <div style={{fontSize:12, color:Dk.muted, marginBottom:16, lineHeight:1.5}}>
            Elige una contraseña nueva. Mínimo 8 caracteres.
          </div>
          {success ? (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"16px 0"}}>
              <div style={{fontSize:40}}>✅</div>
              <div style={{color:THEME.colorSuccess, fontSize:14, fontWeight:700, textAlign:"center"}}>¡Contraseña actualizada!</div>
              <div style={{color:Dk.muted, fontSize:12, textAlign:"center"}}>Redirigiendo al login en 3 segundos…</div>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              <div style={{position:"relative"}}>
                <input type={showNewPass?"text":"password"} placeholder="Nueva contraseña (mín. 8 caracteres)" value={newPass} onChange={e => setNewPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{...inp,paddingRight:42}} />
                <button type="button" onClick={()=>setShowNewPass(v=>!v)} aria-label={showNewPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showNewPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              <div style={{position:"relative"}}>
                <input type={showConfirmPass?"text":"password"} placeholder="Confirmar nueva contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{...inp,paddingRight:42}} />
                <button type="button" onClick={()=>setShowConfirmPass(v=>!v)} aria-label={showConfirmPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:0,top:0,height:"100%",width:40,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:Dk.muted,padding:0,flexShrink:0}}>
                  {showConfirmPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              {error && <div style={{padding:"8px 12px", borderRadius:8, background:THEME.errorBg18, border:"1px solid #e05a5a44", color:THEME.colorError2, fontSize:13}}>{error}</div>}
              <button onClick={handleSubmit} disabled={loading} style={{padding:"12px", borderRadius:10, border:"none", background:THEME.gradAccent, color:THEME.bgPage, fontFamily:sans, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4, opacity:loading?0.7:1}}>
                {loading ? "Actualizando…" : "Guardar contraseña →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
