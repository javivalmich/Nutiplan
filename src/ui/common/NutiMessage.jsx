import React from "react";
import { THEME, SANS_EMOJI, NUTIPLAN_LOGO } from "../constants";

export function NutiMessage({ message, variant="tip", compact=false, style:extraStyle={} }) {
  const sans = SANS_EMOJI;
  const variants = {
    tip:     { bg:"#e8a04512", border:"#e8a04533", icon:"💡", color:THEME.accent },
    success: { bg:"#16a34a12", border:"#16a34a33", icon:"✅", color:THEME.colorSuccess },
    info:    { bg:"#0369a112", border:"#0369a133", icon:"ℹ️", color:THEME.colorInfo },
    nudge:   { bg:"#7c3aed12", border:"#7c3aed33", icon:"⚡", color:THEME.colorPurpleLight },
  };
  const v = variants[variant] || variants.tip;

  if (compact) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,background:v.bg,border:"1px solid "+v.border,fontFamily:sans,...extraStyle}}>
        <span style={{fontSize:14,flexShrink:0}}>{v.icon}</span>
        <span style={{fontSize:12,color:v.color,lineHeight:1.4}}>{message}</span>
      </div>
    );
  }

  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:12,background:v.bg,border:"1px solid "+v.border,fontFamily:sans,...extraStyle}}>
      {/* Avatar Nuti */}
      <div style={{width:32,height:32,borderRadius:"50%",background:v.color+"22",border:"1.5px solid "+v.color+"55",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
        <img
            src={NUTIPLAN_LOGO}
            alt="Nuti"
            style={{
              display:"block",
              width:"auto",
              height:22,
              maxHeight:22,
              objectFit:"contain",
              background:"transparent",
              borderRadius:"50%",
            }}
            onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement.textContent="🥗";}}
          />
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,color:v.color,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Nuti</div>
        <div style={{fontSize:13,color:THEME.textPrimary,lineHeight:1.5}}>{message}</div>
      </div>
    </div>
  );
}
