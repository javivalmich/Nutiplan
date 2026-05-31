import React, { useState } from "react";
import { THEME } from "../constants";

export function Stepper({label,value,onChange,min,max,step=1,unit}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(String(value));
  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };
  return (
    <div style={{background:THEME.bgCard2,borderRadius:10,padding:"12px 14px",border:"1px solid #30363d"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,color:"#8b949e",letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>onChange(Math.max(min,value-step))} style={{width:28,height:28,borderRadius:"50%",border:"1px solid #444c56",background:THEME.bgCard,color:THEME.textPrimary,fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>-</button>
          {editing
            ? <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
                style={{width:64,textAlign:"center",fontSize:22,fontWeight:700,color:THEME.accent,fontFamily:"'Playfair Display',Georgia,serif",background:"transparent",border:"none",borderBottom:"2px solid #e8a045",outline:"none"}}/>
            : <div style={{textAlign:"center",minWidth:64,cursor:"text"}} onClick={()=>{setDraft(String(value));setEditing(true);}}>
                <span style={{fontSize:22,fontWeight:700,color:THEME.accent,fontFamily:"'Playfair Display',Georgia,serif"}}>{value}</span>
                {unit&&<span style={{fontSize:10,color:THEME.textMuted,marginLeft:3}}>{unit}</span>}
              </div>
          }
          <button onClick={()=>onChange(Math.min(max,value+step))} style={{width:28,height:28,borderRadius:"50%",border:"1px solid #444c56",background:THEME.bgCard,color:THEME.textPrimary,fontSize:16,cursor:"pointer",lineHeight:1,flexShrink:0}}>+</button>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:THEME.accent,cursor:"pointer",height:4}}/>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#555f6b",marginTop:4}}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}
