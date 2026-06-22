import { useState, useCallback, useEffect } from "react";
import { __PERF, _bcGet, _bcPost, _bc, getWeekNumber } from "../../data/runtime.js";
import { PDB, loadMealMemory, saveMealMemory } from "../../data/db.js";
import { SDB } from "../../data/sdb.js";
import { FREEFORM_POOL } from "../../data/freeformPool.js";
import { buildPlan, calcTDEE, calcTarget, getPastProteinFrequency } from "../../engine/index.js";
import { THEME, STRATEGIES, GOAL_LABELS, NUTIPLAN_LOGO, SANS_EMOJI, SERIF_EMOJI, AD_SLOTS } from "../constants";
import { AdBanner } from "../common/AdBanner";

// ═══════════════════════════════════════════════════════════════════════════
// NUTRITIONIST DASHBOARD — full editable plan per client
// ═══════════════════════════════════════════════════════════════════════════
export function NutritionistDashboard({ currentUser, onLogout }) {
  __PERF.render("NutritionistDashboard");  // PERF
  // EMOJI FIX: use emoji-safe font stacks
  const serif = SERIF_EMOJI;
  const sans  = SANS_EMOJI;
  const Dk = { bg:THEME.bgPage, card:THEME.bgCard, card2:THEME.bgCard2, border:THEME.borderDark, text:THEME.textPrimary, muted:THEME.textMuted, accent:THEME.accent };

  const [view, setView]   = useState("clients"); // "clients" | "client_detail" | "plan_editor"
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [sel, setSel]     = useState(null); // selected client data
  const [clientTab, setClientTab] = useState("plan");
  // Server-side client search
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = idle, [] = no results
  const [searchLoading, setSearchLoading] = useState(false);
  const [requestingId, setRequestingId]   = useState(null);   // cid currently in-flight
  const [requestedIds, setRequestedIds]   = useState({});     // { [cid]: true } after success
  const [requestErrors, setRequestErrors] = useState({});     // { [cid]: "message" }
  // Plan editor state
  const [editPlan, setEditPlan] = useState(null); // { days, strategy, calories, profile }
  const [editDay, setEditDay]   = useState(0);
  const [editMeal, setEditMeal] = useState(null); // {dayIdx, mealIdx}
  const [saving, setSaving]     = useState(false);

  const refresh = useCallback(async () => {
    setLoadingClients(true);
    try {
      // N+1 known cost: getUserData + getActivePlan per active client.
      // Batching would require a new SDB contract (RESERVED); acceptable for now.
      const asgns      = await SDB.getAssignmentsForNutritionist(currentUser.id);
      const identities = await SDB.getClientsProfiles(currentUser.id);
      const identityMap = Object.fromEntries(identities.map(p => [p.id, p]));
      const rows = await Promise.all(asgns.map(async a => {
        const identity = identityMap[a.cid];
        if (!identity) return null;
        const user = { id: identity.id, email: identity.email, display_name: identity.display_name };
        const [profile, plan] = await Promise.all([
          SDB.getUserData(a.cid, "profile"),
          SDB.getActivePlan(a.cid),
        ]);
        return { a, user, profile: profile || null, plan, checkins: [] };
      }));
      setClients(rows.filter(c => c && c.user));
    } catch(e) {
      console.warn("[NutritionistDashboard] refresh error:", e.message);
    } finally {
      setLoadingClients(false);
    }
  }, [currentUser.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // FIX 11: listen for plan-change broadcasts so dashboard auto-refreshes
  // when a client submits a check-in or a plan is saved in another tab.
  useEffect(() => {
    if (!_bcGet()) return;  // browser doesn't support BroadcastChannel — no-op
    const onMsg = (e) => {
      if (e.data?.type === "PLAN_UPDATED") refresh();
    };
    _bc.addEventListener("message", onMsg);
    return () => _bc.removeEventListener("message", onMsg);
  }, [refresh]);


  const handleOpenPlanEditor = (c) => {
    if (!c.profile) { alert("El cliente no ha configurado su perfil todavía."); return; }
    // FIX 2: no uid swap needed — PDB uses explicit uid params
    const kcal = calcTarget(calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity), c.profile.goal, 0);
    const generated = c.plan
      ? { days:[...c.plan.days], strategy:c.plan.strategy, weekWarnings:c.plan.weekWarnings, weekScore:c.plan.weekScore }
      : __PERF.time("buildPlan:nutriEditor", () => buildPlan(c.profile, kcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(c.user.id)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(c.user.id,wk,L,D),weekNumber:getWeekNumber(),userId:c.user.id,perf:__PERF}));  // PERF
    setEditPlan({ days: JSON.parse(JSON.stringify(generated.days)), strategy: generated.strategy, calories: kcal, profile: c.profile, clientId: c.user.id, originalPlanMeta: c.plan });
    setEditDay(0); setEditMeal(null);
    setView("plan_editor"); setSel(c);
  };

  const updateMealField = (dayIdx, mealIdx, field, value) => {
    setEditPlan(ep => {
      const days = JSON.parse(JSON.stringify(ep.days));
      if (days[dayIdx] && days[dayIdx].meals[mealIdx]) days[dayIdx].meals[mealIdx][field] = value;
      return { ...ep, days };
    });
  };

  const handleSavePlan = () => {
    setSaving(true);

    // 1. Deep-clone days before persisting — immutability guaranteed
    const planDays = JSON.parse(JSON.stringify(editPlan.days));

    // 2. Persist to PDB (localStorage + SyncEngine → Supabase)
    PDB.addPlan(editPlan.clientId, {
      created_by: "nutritionist", nutritionist_id: currentUser.id,
      strategy:   editPlan.strategy,
      calories:   editPlan.calories,
      profile:    editPlan.profile,
      days:       planDays,
      weekNum:    getWeekNumber(),
      extras:     {},
    });

    // 3. Broadcast to user's tab(s) instantly
    _bcPost({ type:"PLAN_UPDATED", uid: editPlan.clientId, ts: Date.now() });

    // 4. Optimistic update from PDB local (sync, plan is here immediately).
    //    refresh() is async and reads SDB — SDB won't have the plan yet (push
    //    is fire-and-forget). Patching sel + clients from PDB avoids the stale
    //    display; the async reconcile from SDB happens on the next natural
    //    refresh (mount / BroadcastChannel), by which time the push has landed.
    const freshPlan    = PDB.getActivePlan(editPlan.clientId);
    const freshProfile = PDB.getClientProfile(editPlan.clientId) || freshPlan?.profile || editPlan.profile;
    const freshClient  = {
      a:        sel?.a,                               // preserves status (2E)
      user:     sel?.user || PDB.getUserById(editPlan.clientId),
      plan:     freshPlan,
      profile:  freshProfile,
      checkins: [],
    };
    setSel(freshClient);
    setClients(prev => {
      const i = prev.findIndex(c => c.user?.id === editPlan.clientId);
      if (i === -1) return [...prev, freshClient];
      const next = [...prev]; next[i] = freshClient; return next;
    });

    setSaving(false);
    // refresh() intentionally NOT called here — calling it would clobber the
    // optimistic patch with stale SDB data (push hasn't landed yet).
    setView("client_detail");
  };

  // ── CLIENTS LIST ────────────────────────────────────────────────────────
  if (view === "clients") return (
    <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* LOGO FIX: NutiPlan logo in nutritionist dashboard header */}
      <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <img
            src={NUTIPLAN_LOGO}
            alt=""
            aria-hidden="true"
            loading="lazy"
            style={{
              display:"block",
              width:"auto",
              height:40,
              maxHeight:40,
              objectFit:"contain",
              background:"transparent",
              flexShrink:0,
            }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
          <div>
            <h1 style={{fontFamily:serif, fontSize:18, color:Dk.text, margin:0}}>Mis clientes</h1>
            <p style={{color:Dk.muted, fontSize:11, margin:0}}>{currentUser.email}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{padding:"7px 14px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:12, cursor:"pointer"}}>Salir</button>
      </div>

      <div style={{maxWidth:600, margin:"0 auto", padding:"16px 14px"}}>
        {/* ── Búsqueda server-side ─────────────────────────────────────────── */}
        <div style={{background:Dk.card, borderRadius:14, padding:16, border:"1px solid "+Dk.border, marginBottom:16}}>
          <div style={{fontSize:12, color:Dk.muted, marginBottom:10, fontWeight:600}}>Buscar cliente por nombre o email</div>
          <div style={{display:"flex", gap:8}}>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSearchResults(null); }}
              onKeyDown={async e => {
                if (e.key !== "Enter" || !searchQuery.trim()) return;
                setSearchLoading(true); setSearchResults(null);
                const res = await SDB.findClient(searchQuery.trim());
                setSearchLoading(false);
                if (res.error) { setSearchResults([]); } else { setSearchResults(res.data || []); }
              }}
              placeholder="Nombre o email…"
              style={{flex:1, padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", minWidth:0}}
            />
            <button
              onClick={async () => {
                if (!searchQuery.trim()) return;
                setSearchLoading(true); setSearchResults(null);
                const res = await SDB.findClient(searchQuery.trim());
                setSearchLoading(false);
                if (res.error) { setSearchResults([]); } else { setSearchResults(res.data || []); }
              }}
              style={{padding:"9px 16px", borderRadius:8, background:Dk.card2, color:Dk.accent, border:"1px solid "+Dk.border, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0}}
            >Buscar</button>
          </div>
          {searchLoading && <div style={{fontSize:12, color:Dk.muted, marginTop:8}}>Buscando…</div>}
          {searchResults !== null && !searchLoading && (
            searchResults.length === 0
              ? <div style={{fontSize:12, color:Dk.muted, marginTop:8}}>Sin resultados.</div>
              : <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:6}}>
                  {searchResults.map((r, i) => {
                    const isRequesting = requestingId === r.id;
                    const isDone       = !!requestedIds[r.id];
                    const rowError     = requestErrors[r.id];
                    const handleRequest = async () => {
                      setRequestingId(r.id);
                      setRequestErrors(prev => { const n = {...prev}; delete n[r.id]; return n; });
                      const res = await SDB.requestAssignment(r.id);
                      setRequestingId(null);
                      if (res.error) {
                        const msg = typeof res.error === "string" ? res.error
                          : res.error?.message || res.error?.msg || JSON.stringify(res.error);
                        const friendly =
                          msg.includes("unauthorized")     ? "No autorizado."
                          : msg.includes("not found")      ? "Cliente no encontrado."
                          : msg.includes("already active") ? "Ya es tu cliente."
                          : msg.includes("already pending")? "Solicitud ya enviada."
                          : "Error al solicitar: " + msg;
                        setRequestErrors(prev => ({...prev, [r.id]: friendly}));
                      } else {
                        setRequestedIds(prev => ({...prev, [r.id]: true}));
                        refresh();
                      }
                    };
                    return (
                      <div key={i}>
                        <div style={{display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, background:Dk.card2, border:"1px solid "+Dk.border}}>
                          <div style={{width:30, height:30, borderRadius:"50%", background:THEME.accentBg22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0}}>👤</div>
                          <div style={{flex:1, minWidth:0}}>
                            <div style={{fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.display_name || r.email}</div>
                            {r.display_name && <div style={{fontSize:11, color:Dk.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.email}</div>}
                          </div>
                          <button
                            disabled={isRequesting || isDone}
                            onClick={handleRequest}
                            style={{padding:"6px 12px", borderRadius:8, border:"none", background: isDone ? "#16a34a22" : Dk.accent, color: isDone ? "#16a34a" : THEME.bgPage, fontFamily:sans, fontSize:12, fontWeight:700, cursor: isRequesting || isDone ? "default" : "pointer", flexShrink:0, opacity: isRequesting ? 0.6 : 1}}
                          >{isRequesting ? "Enviando…" : isDone ? "✓ Solicitado" : "Solicitar"}</button>
                        </div>
                        {rowError && <div style={{fontSize:11, color:THEME.colorError2, padding:"4px 10px 0"}}>{rowError}</div>}
                      </div>
                    );
                  })}
                </div>
          )}
        </div>

        {loadingClients
          ? <div style={{textAlign:"center", padding:"40px 0", color:Dk.muted}}>Cargando clientes…</div>
          : clients.length === 0
          ? <div style={{textAlign:"center", padding:"40px 0", color:Dk.muted}}><div style={{fontSize:40, marginBottom:12}}>👥</div><div>Sin clientes asignados aún.</div></div>
          : clients.map((c, i) => {
              const status = c.a?.status || "active";
              const isBlocked = status === "pending" || status === "rejected";
              const STATUS_LABEL = { pending: "⏳ Pendiente", rejected: "❌ Rechazado" };
              const STATUS_BG    = { pending: "#f59e0b22", rejected: "#ef444422" };
              const STATUS_COLOR = { pending: "#f59e0b",   rejected: "#ef4444" };
              return (
                <div key={i} onClick={()=>{setSel(c);setClientTab("plan");setView("client_detail");}} style={{background:Dk.card, borderRadius:14, padding:16, border:"1px solid "+Dk.border, marginBottom:10, cursor:"pointer", animation:"fi 0.3s ease"}}>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <div style={{width:42, height:42, borderRadius:"50%", background:THEME.accentBg22, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20}}>👤</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:14, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.user.email}</div>
                      {isBlocked
                        ? <div style={{fontSize:11, color:STATUS_COLOR[status], marginTop:2}}>{STATUS_LABEL[status]}</div>
                        : c.profile
                          ? <div style={{fontSize:11, color:Dk.muted, marginTop:2}}>{GOAL_LABELS[c.profile.goal]} · {c.profile.weight}kg · {c.profile.age}a</div>
                          : <div style={{fontSize:11, color:THEME.accent}}>Sin perfil aún</div>
                      }
                    </div>
                    <div style={{textAlign:"right", flexShrink:0}}>
                      {isBlocked
                        ? <div style={{fontSize:10, padding:"3px 8px", borderRadius:99, background:STATUS_BG[status], color:STATUS_COLOR[status], fontWeight:700}}>{STATUS_LABEL[status]}</div>
                        : <div style={{fontSize:10, padding:"3px 8px", borderRadius:99, background:c.plan?(c.plan.created_by==="nutritionist"?"#7c3aed22":THEME.accentBg22):"#e05a5a22", color:c.plan?(c.plan.created_by==="nutritionist"?THEME.colorPurpleLight:Dk.accent):THEME.colorError2, fontWeight:700}}>
                            {c.plan ? (c.plan.created_by==="nutritionist"?"🔒 Manual":"🤖 Auto") : "Sin plan"}
                          </div>
                      }
                    </div>
                  </div>
                </div>
              );
            })
        }

        {/* AD PLACEMENT 4: nutritionist dashboard — below clients list, above the fold */}
        <div style={{padding:"0 16px 16px"}}>
          <AdBanner
            slot={AD_SLOTS.nutriDashboard}
            format="horizontal"
            responsive={true}
            style={{ borderRadius:8, overflow:"hidden" }}
          />
        </div>

      </div>
    </div>
  );

  // ── CLIENT DETAIL ────────────────────────────────────────────────────────
  if (view === "client_detail" && sel) {
    // BUG FIX: derive c from the refreshed `clients` state so that after
    // handleSavePlan runs refresh(), the detail view sees the saved plan.
    // Falls back to sel if clients hasn't updated yet (first render).
    const c = clients.find(x => x.user?.id === sel.user?.id) || sel;
    const detailStatus  = c.a?.status || "active";
    const detailBlocked = detailStatus === "pending" || detailStatus === "rejected";
    const D_LABEL = { pending: "⏳ Pendiente", rejected: "❌ Rechazado" };
    const D_BG    = { pending: "#f59e0b22",   rejected: "#ef444422" };
    const D_COLOR = { pending: "#f59e0b",     rejected: "#ef4444" };
    return (
      <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
        <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", gap:12}}>
          <button onClick={()=>setView("clients")} style={{background:"none", border:"none", color:Dk.muted, fontSize:20, cursor:"pointer", padding:0}}>←</button>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
              <h1 style={{fontFamily:serif, fontSize:17, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.user.email}</h1>
              {detailBlocked && <span style={{fontSize:10, padding:"2px 7px", borderRadius:99, background:D_BG[detailStatus], color:D_COLOR[detailStatus], fontWeight:700, whiteSpace:"nowrap"}}>{D_LABEL[detailStatus]}</span>}
            </div>
            {!detailBlocked && c.profile && <p style={{color:Dk.muted, margin:0, fontSize:11}}>{GOAL_LABELS[c.profile.goal]} · {c.profile.weight}kg</p>}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>handleOpenPlanEditor(c)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:Dk.accent,color:THEME.bgPage,fontFamily:sans,fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {c.plan ? "✏️ Editar plan" : "+ Crear plan"}
            </button>
            <button onClick={async()=>{
              if(!confirm("¿Dar de baja a este paciente? Se le generará un plan automático.")) return;
              await removePatient(currentUser.id, c.user.id);
              refresh(); setView("clients"); setSel(null);
            }} style={{padding:"8px 10px",borderRadius:8,border:"1px solid #7f1d1d",background:"#7f1d1d18",color:THEME.colorError,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer"}}>🚫</button>
          </div>
        </div>

        <div style={{display:"flex", borderBottom:"1px solid "+Dk.border}}>
          {[["plan","📋 Plan"],["checkins","📊 Check-ins"],["perfil","👤 Perfil"]].map(([t,l]) => (
            <button key={t} onClick={()=>setClientTab(t)} style={{flex:1, padding:"10px 0", border:"none", background:"none", color:clientTab===t?Dk.accent:Dk.muted, fontFamily:sans, fontSize:12, fontWeight:700, cursor:"pointer", borderBottom:clientTab===t?"2px solid "+Dk.accent:"2px solid transparent"}}>{l}</button>
          ))}
        </div>

        <div style={{maxWidth:600, margin:"0 auto", padding:"16px 14px 100px", animation:"fi 0.3s ease"}}>
          {clientTab === "plan" && (
            detailBlocked
              ? <div style={{textAlign:"center", padding:"32px 0", color:D_COLOR[detailStatus]}}><div style={{fontSize:40}}>{detailStatus === "pending" ? "⏳" : "❌"}</div><div style={{marginTop:12}}>{detailStatus === "pending" ? "Solicitud pendiente de aceptación." : "Solicitud rechazada."}</div></div>
              : !c.plan
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>📋</div><div style={{marginTop:12, marginBottom:16}}>Sin plan activo</div>{c.profile && <button onClick={()=>handleOpenPlanEditor(c)} style={{padding:"11px 24px", borderRadius:10, border:"none", background:Dk.accent, color:THEME.bgPage, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>Crear plan →</button>}</div>
              : <>
                  <div style={{padding:"10px 14px", borderRadius:12, background:c.plan.created_by==="nutritionist"?THEME.purpleBg18:THEME.accentBg18, border:"1px solid "+(c.plan.created_by==="nutritionist"?"#7c3aed44":"#e8a04544"), marginBottom:12}}>
                    <div style={{fontSize:12, fontWeight:700, color:c.plan.created_by==="nutritionist"?THEME.colorPurpleLight:Dk.accent}}>{c.plan.created_by==="nutritionist"?"🔒 Plan manual — tuyo":"🤖 Plan automático"}</div>
                    <div style={{fontSize:11, color:Dk.muted, marginTop:2}}>Semana {c.plan.weekNum} · {c.plan.calories} kcal · {(STRATEGIES[c.plan.strategy]||{}).label}</div>
                  </div>
                  {(c.plan.days||[]).map((d, di) => (
                    <div key={di} style={{background:Dk.card, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+Dk.border}}>
                      <div style={{fontSize:13, fontWeight:700, color:Dk.accent, marginBottom:8}}>{d.name} {d.special==="entrenamiento"?"🏋️":d.special==="libre"?"🎉":""}</div>
                      {(d.meals||[]).filter(Boolean).map((m,mi)=>(
                        <div key={mi} style={{fontSize:11, color:Dk.muted, padding:"3px 0", borderBottom:mi<d.meals.filter(Boolean).length-1?"1px solid "+Dk.border+"66":"none"}}>
                          <span style={{color:Dk.text, fontWeight:600}}>{m.time}:</span> {m.p1}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
          )}

          {clientTab === "checkins" && (
            c.checkins.length === 0
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>📊</div><div style={{marginTop:12}}>Sin check-ins aún.</div></div>
              : [...c.checkins].reverse().map((ci, i) => (
                  <div key={i} style={{background:Dk.card, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+Dk.border}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                      <div style={{fontSize:12, fontWeight:700, color:Dk.accent}}>Check-in #{c.checkins.length-i}</div>
                      <div style={{fontSize:11, color:Dk.muted}}>{new Date(ci.created_at).toLocaleDateString("es-ES")}</div>
                    </div>
                    <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
                      {[["Peso",ci.pesoTrend==="baja"?"📉 Bajó":ci.pesoTrend==="sube"?"📈 Subió":"➡️ Igual"],["Hambre","★".repeat(ci.hambre||3)],["Energía","★".repeat(ci.energia||3)],["Adherencia","★".repeat(ci.adherencia||3)]].map(([k,v])=>(
                        <div key={k} style={{fontSize:11}}><div style={{color:Dk.muted, marginBottom:1}}>{k}</div><div style={{color:Dk.text, fontWeight:600}}>{v}</div></div>
                      ))}
                    </div>
                    {ci.pesoActual && <div style={{marginTop:6, fontSize:11, color:Dk.accent}}>Peso: {ci.pesoActual} kg</div>}
                  </div>
                ))
          )}

          {clientTab === "perfil" && (
            detailBlocked
              ? <div style={{textAlign:"center", padding:"32px 0", color:D_COLOR[detailStatus]}}><div style={{fontSize:40}}>{detailStatus === "pending" ? "⏳" : "❌"}</div><div style={{marginTop:12}}>{detailStatus === "pending" ? "Solicitud pendiente de aceptación." : "Solicitud rechazada."}</div></div>
              : !c.profile
              ? <div style={{textAlign:"center", padding:"32px 0", color:Dk.muted}}><div style={{fontSize:40}}>👤</div><div style={{marginTop:12}}>Sin perfil configurado.</div></div>
              : <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  {[["Género",c.profile.gender==="female"?"Mujer":"Hombre"],["Edad",c.profile.age+" años"],["Peso",c.profile.weight+" kg"],["Altura",c.profile.height+" cm"],["Objetivo",GOAL_LABELS[c.profile.goal]],["Actividad",c.profile.activity],["Comidas/día",c.profile.mealsPerDay],["TDEE","~"+calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity)+" kcal"],["Objetivo kcal",calcTarget(calcTDEE(c.profile.gender,c.profile.age,c.profile.weight,c.profile.height,c.profile.activity),c.profile.goal,0)+" kcal"],["Intolerancias",(c.profile.intolerances||[]).join(", ")||"Ninguna"]].map(([k,v])=>(
                    <div key={k} style={{background:Dk.card, borderRadius:10, padding:"10px 14px", border:"1px solid "+Dk.border, display:"flex", justifyContent:"space-between"}}>
                      <span style={{fontSize:12, color:Dk.muted}}>{k}</span><span style={{fontSize:13, fontWeight:600}}>{String(v)}</span>
                    </div>
                  ))}
                </div>
          )}
        </div>

        <div style={{position:"fixed", bottom:0, left:0, right:0, padding:"10px 16px", background:Dk.bg+"f0", backdropFilter:"blur(8px)", borderTop:"1px solid "+Dk.border}}>
          <div style={{maxWidth:600, margin:"0 auto"}}>
            <button onClick={()=>handleOpenPlanEditor(c)} style={{width:"100%", padding:"12px", borderRadius:10, border:"none", background:THEME.gradPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer"}}>
              {c.plan ? "✏️ Editar / actualizar plan" : "📋 Crear plan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAN EDITOR — full editable meals ────────────────────────────────────
  if (view === "plan_editor" && editPlan) {
    const day = editPlan.days[editDay];
    return (
      <div style={{background:Dk.bg, minHeight:"100vh", fontFamily:sans, color:Dk.text}}>
        <style>{`@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{padding:"14px 16px", borderBottom:"1px solid "+Dk.border, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, background:Dk.bg, zIndex:10}}>
          <button onClick={()=>setView("client_detail")} style={{background:"none", border:"none", color:Dk.muted, fontSize:20, cursor:"pointer", padding:0}}>←</button>
          <div style={{flex:1, minWidth:0}}>
            <h1 style={{fontFamily:serif, fontSize:17, margin:0}}>✏️ Editor de plan</h1>
            <p style={{color:Dk.muted, margin:0, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{sel&&sel.user.email}</p>
          </div>
          <button onClick={handleSavePlan} disabled={saving} style={{padding:"9px 16px", borderRadius:8, border:"none", background:THEME.colorPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, opacity:saving?0.7:1}}>
            {saving ? "..." : "✅ Guardar"}
          </button>
        </div>

        {/* Day tabs */}
        <div style={{display:"flex", overflowX:"auto", padding:"10px 14px 0", gap:6, scrollbarWidth:"none", borderBottom:"1px solid "+Dk.border}}>
          {editPlan.days.map((d, di) => (
            <button key={di} onClick={()=>{setEditDay(di);setEditMeal(null);}} style={{flexShrink:0, padding:"6px 12px", borderRadius:8, border:"2px solid "+(editDay===di?THEME.colorPurple:Dk.border), background:editDay===di?"#7c3aed22":Dk.card2, color:editDay===di?THEME.colorPurpleLight:Dk.muted, fontFamily:sans, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap"}}>
              {d.name.slice(0,3)} {d.special==="entrenamiento"?"🏋️":d.special==="libre"?"🎉":""}
            </button>
          ))}
        </div>

        <div style={{maxWidth:600, margin:"0 auto", padding:"14px 14px 100px"}}>
          {/* Day header note */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11, color:Dk.muted, marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase"}}>Nota del día (visible para el cliente)</div>
            <textarea
              value={day.dayNote||""}
              onChange={e=>setEditPlan(ep=>{const days=JSON.parse(JSON.stringify(ep.days));days[editDay].dayNote=e.target.value;return{...ep,days};})}
              placeholder="Ej: Día de entrenamiento — asegúrate de comer el post-entreno dentro de los 30 min."
              style={{width:"100%", boxSizing:"border-box", padding:"10px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:60}}
            />
          </div>

          {/* Meals editor */}
          {(day.meals||[]).filter(Boolean).map((meal, mi) => {
            const isEditing = editMeal && editMeal.dayIdx===editDay && editMeal.mealIdx===mi;
            return (
              <div key={mi} style={{background:Dk.card, borderRadius:14, marginBottom:10, border:"1px solid "+(isEditing?THEME.colorPurple:Dk.border), overflow:"hidden"}}>
                <button onClick={()=>setEditMeal(isEditing?null:{dayIdx:editDay,mealIdx:mi})} style={{width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10}}>
                  <span style={{fontSize:18}}>{meal.emoji||"🍽️"}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11, color:Dk.muted, marginBottom:2}}>{meal.time}</div>
                    <div style={{fontSize:13, fontWeight:700, color:Dk.text, lineHeight:1.3}}>{meal.p1||"—"}</div>
                    {meal.p2 && <div style={{fontSize:11, color:Dk.muted, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{meal.p2}</div>}
                  </div>
                  <span style={{color:Dk.muted, fontSize:14, flexShrink:0, transform:isEditing?"rotate(180deg)":"none", transition:"transform 0.2s"}}>▼</span>
                </button>

                {isEditing && (
                  <div style={{padding:"0 14px 14px", borderTop:"1px solid "+Dk.border+"66", animation:"fi 0.2s ease"}}>
                    <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
                      {/* Emoji */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Emoji</div>
                        <input value={meal.emoji||""} onChange={e=>updateMealField(editDay,mi,"emoji",e.target.value)} placeholder="🍽️" style={{width:60, padding:"8px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:18, textAlign:"center", outline:"none"}}/>
                      </div>
                      {/* Title */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Título del plato</div>
                        <input value={meal.title||""} onChange={e=>updateMealField(editDay,mi,"title",e.target.value)} placeholder="Ej: Salmón al horno con quinoa" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none"}}/>
                      </div>
                      {/* Plate 1 */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Descripción principal (p1)</div>
                        <textarea value={meal.p1||""} onChange={e=>updateMealField(editDay,mi,"p1",e.target.value)} placeholder="Ej: 150g salmón · 80g quinoa · 200g espinacas salteadas" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", resize:"vertical", minHeight:60}}/>
                      </div>
                      {/* Plate 2 */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Descripción secundaria (p2, opcional)</div>
                        <textarea value={meal.p2||""} onChange={e=>updateMealField(editDay,mi,"p2",e.target.value)} placeholder="Ej: Aliño: AOVE + limón + eneldo · Postre: fruta de temporada" style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:13, outline:"none", resize:"vertical", minHeight:50}}/>
                      </div>
                      {/* Shopping list */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Lista de la compra (una por línea)</div>
                        <textarea value={(meal.shopping||[]).join("\n")} onChange={e=>updateMealField(editDay,mi,"shopping",e.target.value.split("\n"))} placeholder={"150g salmón fresco\n80g quinoa\n200g espinacas"} style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:70, lineHeight:1.8}}/>
                      </div>
                      {/* Recipe */}
                      <div>
                        <div style={{fontSize:10, color:Dk.muted, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>Receta (un paso por línea)</div>
                        <textarea value={(meal.recipe||[]).join("\n")} onChange={e=>updateMealField(editDay,mi,"recipe",e.target.value.split("\n"))} placeholder={"Enjuaga la quinoa y cocina con el doble de agua 15 min.\nSaltea las espinacas con AOVE y ajo.\nMarca el salmón en la sartén 3 min por lado."} style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:80, lineHeight:1.8}}/>
                      </div>
                      {/* Nutritionist note */}
                      <div>
                        <div style={{fontSize:10, color:THEME.colorPurpleLight, marginBottom:5, letterSpacing:"0.08em", textTransform:"uppercase"}}>🧑‍⚕️ Nota tuya para este plato (visible para el cliente)</div>
                        <textarea value={meal.nutriNote||""} onChange={e=>updateMealField(editDay,mi,"nutriNote",e.target.value)} placeholder="Ej: Si entrenas hoy, añade un plátano de postre para reponer glucógeno." style={{width:"100%", boxSizing:"border-box", padding:"9px 12px", borderRadius:8, border:"1px solid #7c3aed44", background:"#7c3aed12", color:Dk.text, fontFamily:sans, fontSize:12, outline:"none", resize:"vertical", minHeight:50}}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Calories info */}
          <div style={{background:Dk.card, borderRadius:12, padding:"12px 14px", border:"1px solid "+Dk.border, marginTop:4}}>
            <div style={{fontSize:11, color:Dk.muted, marginBottom:4}}>Calorías del plan: <strong style={{color:Dk.accent}}>{editPlan.calories} kcal/día</strong></div>
            <div style={{fontSize:11, color:Dk.muted}}>Estrategia: <strong style={{color:Dk.text}}>{(STRATEGIES[editPlan.strategy]||{}).label||editPlan.strategy}</strong></div>
          </div>
        </div>

        <div style={{position:"fixed", bottom:0, left:0, right:0, padding:"10px 16px", background:Dk.bg+"f0", backdropFilter:"blur(8px)", borderTop:"1px solid "+Dk.border}}>
          <div style={{maxWidth:600, margin:"0 auto", display:"flex", gap:8}}>
            <button onClick={()=>setView("client_detail")} style={{flex:1, padding:"12px", borderRadius:10, border:"1px solid "+Dk.border, background:Dk.card2, color:Dk.muted, fontFamily:sans, fontSize:13, fontWeight:600, cursor:"pointer"}}>Cancelar</button>
            <button onClick={handleSavePlan} disabled={saving} style={{flex:2, padding:"12px", borderRadius:10, border:"none", background:THEME.gradPurple, color:THEME.bgWhite, fontFamily:sans, fontSize:13, fontWeight:700, cursor:"pointer", opacity:saving?0.7:1}}>
              {saving ? "Guardando..." : "✅ Guardar plan del cliente →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// REMOVE PATIENT — nutritionist removes a client safely
// ═══════════════════════════════════════════════════════════════════════════

// Removes the nutritionist→client link and regenerates an auto system plan
// for the client. The client's account and all their data remain intact.
async function removePatient(nutritionistId, clientId) {
  // (P) Read client profile — active-plan profile takes priority, stored profile as fallback
  const activePlan = PDB.getActivePlan(clientId);
  const clientProf = activePlan?.profile || PDB.getClientProfile(clientId);

  // (P) Build system plan if profile is available; null triggers the early-return guard in PDB
  let systemPlan = null;
  if (clientProf) {
    const tdee  = calcTDEE(clientProf.gender, clientProf.age, clientProf.weight,
                            clientProf.height, clientProf.activity);
    const kcal  = calcTarget(tdee, clientProf.goal, clientProf.kcalAdjust || 0);
    const built = __PERF.time("buildPlan:removePatient", () => buildPlan(clientProf, kcal, {month:new Date().getMonth(),pastProteins:getPastProteinFrequency(loadMealMemory(clientId)),freeFormPool:FREEFORM_POOL,saveMealMemory:(wk,L,D)=>saveMealMemory(clientId,wk,L,D),weekNumber:getWeekNumber(),userId:clientId,perf:__PERF}));  // PERF
    const wk    = getWeekNumber();
    systemPlan = {
      created_by:      "system",
      nutritionist_id: null,
      strategy:        built.strategy,
      calories:        kcal,
      profile:         clientProf,
      days:            JSON.parse(JSON.stringify(built.days)),
      weekNum:         wk,
      extras:          {},
    };
  }

  // (D) All data operations delegated to PDB.removePatient
  const { ok, newPlan } = await PDB.removePatient(nutritionistId, clientId, systemPlan);
  return { ok, newPlan };
}
