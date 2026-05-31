import React from "react";
import { THEME, SANS_EMOJI } from "../constants";
import { getAgeFromDOB } from "../../engine/index.js";

export function DOBPicker({ dob="", onChange, accentColor=THEME.accent, textColor=THEME.textPrimary, mutedColor=THEME.textMuted, borderColor=THEME.borderDark, bgColor=THEME.bgCard2 }) {
  const sans = SANS_EMOJI;
  const age  = getAgeFromDOB(dob);

  // Rango válido: 10–100 años atrás
  const maxDate = (() => { const d=new Date(); d.setFullYear(d.getFullYear()-10); return d.toISOString().split("T")[0]; })();
  const minDate = (() => { const d=new Date(); d.setFullYear(d.getFullYear()-100); return d.toISOString().split("T")[0]; })();

  const handleChange = (e) => {
    const val = e.target.value; // "YYYY-MM-DD"
    const computed = getAgeFromDOB(val);
    onChange(val, computed);
  };

  return (
    <div>
      <div style={{fontSize:10, color:mutedColor, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:sans}}>
        ¿Cuándo naciste?
      </div>
      <div style={{position:"relative"}}>
        {/* BUG FIX (mobile visual): we used to render <input type="date"> with
            appearance:none + colorScheme:dark. On iOS Safari that combination
            produces a tiny illegible widget — placeholder text is invisible,
            the calendar icon shrinks, and the user sees "a small box".
            Fix: drop appearance:none (let iOS render its native control),
            keep colorScheme:dark (aligns native picker to our theme), and
            make sure text color is always readable (not muted when empty).
            For empty state we show a visible label *above* the field instead
            of relying on the native placeholder, which iOS often hides. */}
        <input
          type="date"
          value={dob}
          min={minDate}
          max={maxDate}
          onChange={handleChange}
          style={{
            width:"100%", boxSizing:"border-box",
            // Step 7: paddingRight mayor cuando el badge de edad está visible
            // para que el texto del input no se solape con "XX años".
            padding:"14px " + (dob && age >= 10 && age <= 100 ? "68px" : "14px") + " 14px 14px",
            // Larger min height so iOS/Android render the wheel/calendar icon
            // at a usable size and the typed value never gets clipped.
            minHeight: 48,
            borderRadius:10,
            border:"1.5px solid "+(dob ? accentColor : borderColor),
            background:bgColor,
            // Always use textColor (not mutedColor). Even when empty, the
            // native day/month/year hint should be legible. On Android Chrome
            // the placeholder inherits this color directly.
            color: textColor,
            fontFamily:sans, fontSize:16, fontWeight:600,
            outline:"none",
            // Critical: colorScheme dark aligns the native control with our
            // theme on iOS 14+ and recent Android. DO NOT add appearance:none
            // here — it breaks the native picker rendering on iOS Safari.
            colorScheme:"dark",
          }}
        />
        {/* Badge de edad calculada — feedback inmediato al usuario */}
        {dob && age >= 10 && (
          <div style={{
            position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:accentColor+"22", border:"1px solid "+accentColor+"55",
            borderRadius:6, padding:"2px 8px",
            fontSize:12, fontWeight:700, color:accentColor, fontFamily:sans,
            pointerEvents:"none",
          }}>
            {age} años
          </div>
        )}
      </div>
      {/* Mensaje de error si la edad calculada está fuera del rango aceptable */}
      {dob && (age < 10 || age > 100) && (
        <div style={{fontSize:11, color:THEME.colorError, marginTop:5, fontFamily:sans}}>
          Introduce una fecha de nacimiento válida (10–100 años).
        </div>
      )}
    </div>
  );
}
