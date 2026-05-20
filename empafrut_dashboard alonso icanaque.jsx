import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

// ======================== EMPAFRUT DATA (from Excel) ========================
const EXCEL_DATA = {
  procesosEstrategicos: {
    AMBIENTAL:    { ideal: 0.12,  real: 0.11025,  display: "12%",  realDisplay: "11%",  meta: "100% RESIDUOS REAPROVECHADOS" },
    SEGURIDAD:    { ideal: 0.09,  real: 0.0875,   display: "9%",   realDisplay: "8.8%", meta: "100% EPPS ENTREGADOS" },
    LOGISTICA:    { ideal: 0.05,  real: 0.049875, display: "5%",   realDisplay: "5%",   meta: "100% PEDIDOS A TIEMPO" },
    MANTENIMIENTO:{ ideal: 0.07,  real: 0.06632,  display: "7%",   realDisplay: "6.6%", meta: "95% MANT. PREVENTIVO EJEC." },
    RRHH:         { ideal: 0.02,  real: 0.0175,   display: "2%",   realDisplay: "1.75%",meta: "8 HORAS CAPACITACION/MES" },
  },
  procesosOperativos: {
    RECEPCION:    { ideal: 0.12, real: 0.108, capacidad: 900,  unidad: "Kg/h",    meta: "1000 Kg/h" },
    DESINFECCION: { ideal: 0.06, real: 0.036, capacidad: 600,  unidad: "Kg/h",    meta: "1000 Kg/h" },
    SELECCION:    { ideal: 0.14, real: 0.14,  capacidad: 800,  unidad: "Kg/calibre 6", meta: "800 Kg/CALIBRE 6" },
    EMPACAR:      { ideal: 0.04, real: 0.04,  capacidad: 250,  unidad: "Cajas/h", meta: "250 CAJAS/h" },
    TRANSPORTAR:  { ideal: 0.04, real: 0.0316,capacidad: 1500, unidad: "Cajas/día",meta: "1900 CAJAS/DÍA" },
  },
  procesosApoyo: {
    PROVEEDORES:  { ideal: 0.06,  real: 0.01974, display: "6%",  realDisplay: "2%",  meta: "95% MATERIA PRIMA CONFORME" },
    FINANZAS:     { ideal: 0.06,  real: 0.0625,  display: "6%",  realDisplay: "6.3%",meta: "95% MARGEN OPERATIVO" },
    COMERCIAL:    { ideal: 0.04,  real: 0.035625,display: "4%",  realDisplay: "3.6%",meta: "100% PRODUCTO VENDIDO" },
    CALIDAD:      { ideal: 0.04,  real: 0.0375,  display: "4%",  realDisplay: "3.75%",meta:"95% PRODUCTO CONFORME" },
    PLANEAMIENTO: { ideal: 0.05,  real: 0.03158, display: "5%",  realDisplay: "3.2%",meta: "95% CUMPLIMIENTO PLAN PROD." },
  },
  efectividad: 0.8739605263157894,
  efectividadEstrategicos: 0.3314407894736842,
  efectividadOperativos: 0.355578947368421,
  efectividadApoyo: 0.1869407894736842,
  // Capacidades operativas en unidades absolutas
  capacidadOperativa: {
    RECEPCION:    { ideal: 90,  real: 90,   unit: "%" },
    SEGURIDAD:    { ideal: 100, real: 100,  unit: "%" },
    LOGISTICA:    { ideal: 95,  real: 95,   unit: "%" },
    MANTENIMIENTO:{ ideal: 90,  real: 90,   unit: "%" },
    RRHH:         { ideal: 8,   real: 8,    unit: "h/mes" },
    PROVEEDORES:  { ideal: 30,  real: 30,   unit: "%" },
    FINANZAS:     { ideal: 95,  real: 95,   unit: "%" },
    COMERCIAL:    { ideal: 95,  real: 95,   unit: "%" },
    CALIDAD:      { ideal: 95,  real: 95,   unit: "%" },
    PLANEAMIENTO: { ideal: 60,  real: 60,   unit: "%" },
  }
};

// ======================== COLORES & TEMA ========================
const COLORS = {
  bg:        "#0a0d14",
  surface:   "#0f1420",
  card:      "#141928",
  cardHover: "#1a2133",
  border:    "#1e2d4a",
  accent:    "#0d7ae8",
  accentGlow:"rgba(13,122,232,0.15)",
  cyan:      "#00c8e8",
  green:     "#00e5a0",
  yellow:    "#fbbf24",
  red:       "#ef4444",
  orange:    "#f97316",
  text:      "#e2e8f0",
  textMuted: "#64748b",
  textSub:   "#94a3b8",
  glass:     "rgba(255,255,255,0.03)",
};

const semaphore = (val, low=60, mid=80) => {
  if (val >= mid) return COLORS.green;
  if (val >= low) return COLORS.yellow;
  return COLORS.red;
};

const pct = (val) => `${(val * 100).toFixed(1)}%`;

// ======================== COMPONENTES BASE ========================
const styles = {
  app: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: COLORS.bg,
    minHeight: "100vh",
    color: COLORS.text,
    display: "flex",
  },
  sidebar: {
    width: 220,
    minHeight: "100vh",
    background: COLORS.surface,
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    overflow: "auto",
    background: COLORS.bg,
  },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
  },
  cardGlass: {
    background: "rgba(14,20,36,0.85)",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
    backdropFilter: "blur(12px)",
  },
};

// ======================== HEADER TOP ========================
function TopBar({ active, setActive }) {
  const now = new Date();
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 24px", background: COLORS.surface,
      borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff" }}>E</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: 1 }}>EMPAFRUT</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 2 }}>INDUSTRIAL OPERATIONS CENTER</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}`,
          borderRadius: 20, padding: "4px 12px", fontSize: 11, color: COLORS.cyan, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green,
            boxShadow: `0 0 6px ${COLORS.green}` }} />
          SISTEMA EN LÍNEA
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>
          {now.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: 11, color: COLORS.cyan, fontWeight: 600 }}>
          {now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ======================== SIDEBAR ========================
const NAV_ITEMS = [
  { id: "dashboard",    icon: "⬛", label: "Dashboard" },
  { id: "mapa",         icon: "🗺",  label: "Mapa de Procesos" },
  { id: "simulador",    icon: "⚙",  label: "Simulador" },
  { id: "kpis",         icon: "📊", label: "Panel KPIs" },
  { id: "calidad",      icon: "✅", label: "Calidad" },
  { id: "mermas",       icon: "📉", label: "Análisis Mermas" },
  { id: "almacen",      icon: "🏭", label: "Almacén" },
  { id: "trazabilidad", icon: "🔍", label: "Trazabilidad" },
  { id: "reportes",     icon: "📋", label: "Reportes" },
  { id: "alertas",      icon: "🔔", label: "Alertas" },
];

function Sidebar({ active, setActive }) {
  return (
    <div style={styles.sidebar}>
      <div style={{ padding: "20px 16px 10px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 2, marginBottom: 4 }}>NAVEGACIÓN</div>
      </div>
      <div style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: active === item.id ? `linear-gradient(90deg, ${COLORS.accentGlow}, transparent)` : "transparent",
            borderLeft: active === item.id ? `3px solid ${COLORS.accent}` : "3px solid transparent",
            color: active === item.id ? COLORS.text : COLORS.textMuted,
            fontSize: 12, fontWeight: active === item.id ? 600 : 400, textAlign: "left",
            transition: "all 0.15s", marginBottom: 2,
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center" }}>
          Efectividad Global
        </div>
        <div style={{ textAlign: "center", fontSize: 22, fontWeight: 700,
          color: semaphore(EXCEL_DATA.efectividad * 100, 70, 85), marginTop: 4 }}>
          {(EXCEL_DATA.efectividad * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ======================== KPI CARD ========================
function KpiCard({ label, value, unit = "", sublabel, color, trend }) {
  const c = color || COLORS.cyan;
  return (
    <div style={{ ...styles.card, display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: c }}>{value}</span>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{unit}</span>
      </div>
      {sublabel && <div style={{ fontSize: 10, color: COLORS.textSub }}>{sublabel}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 10, color: trend >= 0 ? COLORS.green : COLORS.red }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs ideal
        </div>
      )}
    </div>
  );
}

// ======================== GAUGE COMPONENT ========================
function Gauge({ value, max = 100, label, size = 100 }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const r = size * 0.4;
  const cx = size / 2, cy = size * 0.55;
  const startX = cx - r, startY = cy;
  const rad = (angle - 180) * Math.PI / 180;
  const endX = cx + r * Math.cos(rad);
  const endY = cy + r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  const color = semaphore(value, 60, 80);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={COLORS.border} strokeWidth={size * 0.06} strokeLinecap="round" />
        {pct > 0 && (
          <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
            fill="none" stroke={color} strokeWidth={size * 0.06} strokeLinecap="round" />
        )}
        <text x={cx} y={cy * 0.85} textAnchor="middle" fill={color}
          fontSize={size * 0.2} fontWeight="700">{value.toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: -8 }}>{label}</div>
    </div>
  );
}

// ======================== DASHBOARD PRINCIPAL ========================
function Dashboard() {
  const efectividad = (EXCEL_DATA.efectividad * 100).toFixed(1);
  const efEstr = (EXCEL_DATA.efectividadEstrategicos * 100).toFixed(1);
  const efOper = (EXCEL_DATA.efectividadOperativos * 100).toFixed(1);
  const efApoyo = (EXCEL_DATA.efectividadApoyo * 100).toFixed(1);

  const radarData = [
    { subject: "Ambiental",    ideal: 12,  real: 11 },
    { subject: "Seguridad",    ideal: 9,   real: 8.8 },
    { subject: "Logística",    ideal: 5,   real: 5 },
    { subject: "Mantenimiento",ideal: 7,   real: 6.6 },
    { subject: "RRHH",         ideal: 2,   real: 1.75 },
  ];

  const barDataOper = Object.entries(EXCEL_DATA.procesosOperativos).map(([k,v]) => ({
    name: k.substring(0,7),
    ideal: +(v.ideal * 100).toFixed(1),
    real:  +(v.real  * 100).toFixed(1),
  }));

  const pieData = [
    { name: "Estratégicos", value: 33.1, color: COLORS.accent },
    { name: "Operativos",   value: 35.6, color: COLORS.cyan },
    { name: "Apoyo",        value: 18.7, color: COLORS.green },
  ];

  const lineData = [
    { mes: "Ene", recepcion: 85, seleccion: 78, empacar: 92 },
    { mes: "Feb", recepcion: 88, seleccion: 82, empacar: 89 },
    { mes: "Mar", recepcion: 90, seleccion: 86, empacar: 91 },
    { mes: "Abr", recepcion: 87, seleccion: 89, empacar: 88 },
    { mes: "May", recepcion: 92, seleccion: 91, empacar: 94 },
    { mes: "Jun", recepcion: 91, seleccion: 90, empacar: 96 },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Dashboard Ejecutivo</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Centro de Operaciones EMPAFRUT — Procesamiento y Exportación de Mango</div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Efectividad Global" value={`${efectividad}%`} color={semaphore(+efectividad, 70, 85)} sublabel="Índice general de desempeño" />
        <KpiCard label="Proc. Estratégicos" value={`${efEstr}%`} color={semaphore(+efEstr, 30, 25)} sublabel="5 procesos estratégicos" />
        <KpiCard label="Proc. Operativos" value={`${efOper}%`} color={semaphore(+efOper, 30, 25)} sublabel="5 procesos operativos" />
        <KpiCard label="Proc. de Apoyo" value={`${efApoyo}%`} color={semaphore(+efApoyo, 15, 20)} sublabel="5 procesos de apoyo" />
      </div>

      {/* Segunda fila KPIs operativos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {Object.entries(EXCEL_DATA.procesosOperativos).map(([k, v]) => (
          <KpiCard key={k} label={k} value={v.capacidad} unit={v.unidad.split(" ")[0]}
            color={semaphore((v.real / v.ideal) * 100, 70, 85)}
            sublabel={`Meta: ${v.meta}`}
            trend={(v.real / v.ideal - 1) * 100}
          />
        ))}
      </div>

      {/* Gráficos principales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16, marginBottom: 20 }}>
        {/* Line chart tendencia */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Tendencia de Rendimiento por Proceso</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="mes" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} domain={[70, 100]} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="recepcion" stroke={COLORS.accent} strokeWidth={2} dot={false} name="Recepción" />
              <Line type="monotone" dataKey="seleccion" stroke={COLORS.cyan} strokeWidth={2} dot={false} name="Selección" />
              <Line type="monotone" dataKey="empacar" stroke={COLORS.green} strokeWidth={2} dot={false} name="Empacar" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart procesos */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Ideal vs Real — Procesos Operativos (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barDataOper}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="ideal" fill={COLORS.accent} name="Ideal" radius={[3, 3, 0, 0]} />
              <Bar dataKey="real" fill={COLORS.cyan} name="Real" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut distribución */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Distribución por Tipo</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                <span style={{ color: COLORS.textSub }}>{d.name}</span>
                <span style={{ marginLeft: "auto", color: d.color, fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gauges row */}
      <div style={{ ...styles.card, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>Gauges de Cumplimiento — Procesos Estratégicos</div>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap" }}>
          {Object.entries(EXCEL_DATA.procesosEstrategicos).map(([k, v]) => (
            <Gauge key={k} value={(v.real / v.ideal) * 100} label={k} size={110} />
          ))}
        </div>
      </div>

      {/* Radar + tabla apoyo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Radar — Procesos Estratégicos</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={COLORS.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 15]} tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
              <Radar name="Ideal" dataKey="ideal" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.15} />
              <Radar name="Real" dataKey="real" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Estado Procesos de Apoyo</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Proceso", "Ideal", "Real", "Cumplimiento", "Estado"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textMuted, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(EXCEL_DATA.procesosApoyo).map(([k, v]) => {
                const cumpl = (v.real / v.ideal) * 100;
                const c = semaphore(cumpl, 60, 85);
                return (
                  <tr key={k} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "7px 8px", color: COLORS.text, fontWeight: 500 }}>{k}</td>
                    <td style={{ padding: "7px 8px", color: COLORS.textSub }}>{v.display}</td>
                    <td style={{ padding: "7px 8px", color: COLORS.textSub }}>{v.realDisplay}</td>
                    <td style={{ padding: "7px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, background: COLORS.border, borderRadius: 4, height: 4 }}>
                          <div style={{ width: `${Math.min(cumpl, 100)}%`, background: c, height: 4, borderRadius: 4 }} />
                        </div>
                        <span style={{ color: c, minWidth: 36 }}>{cumpl.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "7px 8px" }}>
                      <span style={{ background: c + "22", color: c, border: `1px solid ${c}40`,
                        borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>
                        {cumpl >= 85 ? "✓ OK" : cumpl >= 60 ? "⚠ MED" : "✗ BAJO"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ======================== MAPA DE PROCESOS ========================
function MapaProcesos({ setActive, setSimProceso }) {
  const [hovered, setHovered] = useState(null);

  const ProcessBox = ({ id, name, value, ideal, meta, onClick, color = COLORS.accent }) => {
    const cumpl = ideal > 0 ? (value / ideal) * 100 : 100;
    const c = semaphore(cumpl, 70, 85);
    const isHov = hovered === id;
    return (
      <div onClick={onClick} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)}
        style={{
          background: isHov ? COLORS.cardHover : COLORS.card,
          border: `1px solid ${isHov ? color : COLORS.border}`,
          borderRadius: 10, padding: "10px 14px", cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s", transform: isHov ? "translateY(-2px)" : "none",
          boxShadow: isHov ? `0 4px 20px ${color}30` : "none",
          minWidth: 130, textAlign: "center",
        }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{cumpl.toFixed(0)}%</div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{meta}</div>
        {onClick && <div style={{ fontSize: 9, color: color, marginTop: 4 }}>▶ Ver simulación</div>}
      </div>
    );
  };

  const openSim = (proceso) => {
    setSimProceso(proceso);
    setActive("simulador");
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Mapa de Procesos Interactivo</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>Cadena de Valor EMPAFRUT — Haz clic en procesos operativos para simular</div>

      {/* Procesos Estratégicos */}
      <div style={{ ...styles.card, marginBottom: 16, borderTop: `3px solid ${COLORS.accent}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, letterSpacing: 2, marginBottom: 14 }}>PROCESOS ESTRATÉGICOS</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(EXCEL_DATA.procesosEstrategicos).map(([k, v]) => (
            <ProcessBox key={k} id={k} name={k} value={v.real * 100} ideal={v.ideal * 100} meta={v.meta} color={COLORS.accent} />
          ))}
        </div>
      </div>

      {/* Flecha */}
      <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 20, marginBottom: 8 }}>↓</div>

      {/* Procesos Operativos */}
      <div style={{ ...styles.card, marginBottom: 16, borderTop: `3px solid ${COLORS.cyan}`,
        background: "linear-gradient(180deg, rgba(0,200,232,0.05) 0%, transparent 100%)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.cyan, letterSpacing: 2, marginBottom: 14 }}>
          PROCESOS OPERATIVOS — INTERACTIVOS
        </div>
        <div style={{ display: "flex", gap: 0, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(EXCEL_DATA.procesosOperativos).map(([k, v], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center" }}>
              <ProcessBox id={k} name={k} value={v.real * 100} ideal={v.ideal * 100}
                meta={v.meta} color={COLORS.cyan}
                onClick={() => openSim(k)} />
              {i < Object.keys(EXCEL_DATA.procesosOperativos).length - 1 && (
                <div style={{ color: COLORS.cyan, fontSize: 20, padding: "0 4px" }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Flecha */}
      <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 20, marginBottom: 8 }}>↓</div>

      {/* Procesos de Apoyo */}
      <div style={{ ...styles.card, borderTop: `3px solid ${COLORS.green}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.green, letterSpacing: 2, marginBottom: 14 }}>PROCESOS DE APOYO</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(EXCEL_DATA.procesosApoyo).map(([k, v]) => (
            <ProcessBox key={k} id={k} name={k} value={v.real * 100} ideal={v.ideal * 100} meta={v.meta} color={COLORS.green} />
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ marginTop: 20, display: "flex", gap: 24, justifyContent: "center" }}>
        {[["ALTO ≥80%", COLORS.green], ["MEDIO 60-80%", COLORS.yellow], ["BAJO <60%", COLORS.red]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ color: COLORS.textSub }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== SIMULADOR ========================
function Simulador({ procesoInicial }) {
  const [proceso, setProceso] = useState(procesoInicial || "RECEPCION");
  const [params, setParams] = useState({
    kilosIngresados:   1000,
    kilosProcesados:   900,
    kilosTerminados:   800,
    kilosAlmacenados:  750,
    kilosRechazados:   100,
    tiempoProceso:     8,
    capacidadInstalada:1200,
    tiempoMuerto:      30,
    temperatura:       12,
    pedidosPendientes: 25,
    operarios:         12,
    turnosActivos:     2,
  });

  useEffect(() => { if (procesoInicial) setProceso(procesoInicial); }, [procesoInicial]);

  const merma       = ((params.kilosRechazados / params.kilosIngresados) * 100).toFixed(1);
  const rendimiento = ((params.kilosTerminados / params.kilosIngresados) * 100).toFixed(1);
  const eficiencia  = ((params.kilosProcesados / params.kilosIngresados) * 100).toFixed(1);
  const capacidadUtil = ((params.kilosIngresados / params.capacidadInstalada) * 100).toFixed(1);
  const productividad = (params.kilosProcesados / (params.tiempoProceso || 1)).toFixed(1);
  const oee = ((parseFloat(rendimiento) / 100) * ((100 - params.tiempoMuerto / params.tiempoProceso / 60 * 100) / 100) * (parseFloat(eficiencia) / 100) * 100).toFixed(1);

  const Slider = ({ label, key2, min, max, unit = "" }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.textMuted, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: COLORS.cyan, fontWeight: 600 }}>{params[key2]} {unit}</span>
      </div>
      <input type="range" min={min} max={max} value={params[key2]}
        onChange={e => setParams(p => ({ ...p, [key2]: +e.target.value }))}
        style={{ width: "100%", accentColor: COLORS.accent, cursor: "pointer" }} />
    </div>
  );

  const barData = [
    { name: "Ingresados", kg: params.kilosIngresados },
    { name: "Procesados", kg: params.kilosProcesados },
    { name: "Terminados", kg: params.kilosTerminados },
    { name: "Almacenados",kg: params.kilosAlmacenados },
    { name: "Rechazados", kg: params.kilosRechazados },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Simulador de Producción</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.keys(EXCEL_DATA.procesosOperativos).map(p => (
          <button key={p} onClick={() => setProceso(p)} style={{
            padding: "6px 14px", borderRadius: 20, border: `1px solid ${proceso === p ? COLORS.cyan : COLORS.border}`,
            background: proceso === p ? COLORS.cyan + "22" : "transparent",
            color: proceso === p ? COLORS.cyan : COLORS.textMuted, fontSize: 11, cursor: "pointer",
          }}>{p}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        {/* Panel de controles */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.cyan, marginBottom: 16 }}>
            ⚙ CONTROLES — {proceso}
          </div>
          <Slider label="Kilos Ingresados" key2="kilosIngresados" min={100} max={5000} unit="Kg" />
          <Slider label="Kilos Procesados" key2="kilosProcesados" min={50}  max={params.kilosIngresados} unit="Kg" />
          <Slider label="Kilos Terminados" key2="kilosTerminados" min={50}  max={params.kilosProcesados} unit="Kg" />
          <Slider label="Kilos Almacenados"key2="kilosAlmacenados" min={0} max={params.kilosTerminados} unit="Kg" />
          <Slider label="Kilos Rechazados" key2="kilosRechazados" min={0}  max={params.kilosIngresados} unit="Kg" />
          <Slider label="Tiempo de Proceso" key2="tiempoProceso" min={1}  max={24} unit="h" />
          <Slider label="Cap. Instalada" key2="capacidadInstalada" min={500} max={5000} unit="Kg" />
          <Slider label="Tiempo Muerto" key2="tiempoMuerto" min={0} max={120} unit="min" />
          <Slider label="Temperatura" key2="temperatura" min={0} max={30} unit="°C" />
          <Slider label="Operarios" key2="operarios" min={1} max={50} unit="" />
        </div>

        {/* Resultados */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* KPIs calculados */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <KpiCard label="% Merma" value={`${merma}%`} color={semaphore(100 - +merma, 70, 85)} sublabel="Kilos rechazados/ingresados" />
            <KpiCard label="Rendimiento" value={`${rendimiento}%`} color={semaphore(+rendimiento, 70, 85)} sublabel="Terminados/Ingresados" />
            <KpiCard label="Eficiencia" value={`${eficiencia}%`} color={semaphore(+eficiencia, 70, 85)} sublabel="Procesados/Ingresados" />
            <KpiCard label="Cap. Utilizada" value={`${capacidadUtil}%`} color={semaphore(+capacidadUtil, 50, 80)} sublabel="vs Cap. Instalada" />
            <KpiCard label="Productividad" value={productividad} unit="Kg/h" color={COLORS.cyan} sublabel="Kilos por hora" />
            <KpiCard label="OEE Industrial" value={`${Math.min(+oee, 100).toFixed(1)}%`} color={semaphore(+oee, 65, 85)} sublabel="Overall Equip. Effectiveness" />
          </div>

          {/* Gráfico de flujo */}
          <div style={styles.card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>
              Flujo de Kilogramos — {proceso}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v.toLocaleString()} Kg`, "Kilogramos"]} />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}
                  fill={COLORS.accent}
                  label={{ position: "top", fill: COLORS.textSub, fontSize: 10,
                    formatter: v => v.toLocaleString() }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alertas dinámicas */}
          <div style={styles.card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Alertas Operativas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {+merma > 15 && <Alert nivel="danger" msg={`Merma crítica: ${merma}% — supera el 15% permitido`} />}
              {+rendimiento < 70 && <Alert nivel="danger" msg={`Rendimiento bajo: ${rendimiento}% — requiere acción inmediata`} />}
              {+capacidadUtil > 95 && <Alert nivel="warning" msg={`Capacidad al ${capacidadUtil}% — riesgo de saturación`} />}
              {params.temperatura > 18 && <Alert nivel="danger" msg={`Temperatura ${params.temperatura}°C — excede límite de 18°C`} />}
              {params.tiempoMuerto > 60 && <Alert nivel="warning" msg={`Tiempo muerto ${params.tiempoMuerto} min — impacta OEE`} />}
              {+merma <= 15 && +rendimiento >= 70 && +capacidadUtil <= 95 && params.temperatura <= 18 && params.tiempoMuerto <= 60 && (
                <Alert nivel="ok" msg="Todos los parámetros dentro de rango operativo normal" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Alert({ nivel, msg }) {
  const c = nivel === "danger" ? COLORS.red : nivel === "warning" ? COLORS.yellow : COLORS.green;
  const icon = nivel === "danger" ? "⚠" : nivel === "warning" ? "⚡" : "✓";
  return (
    <div style={{ background: c + "11", border: `1px solid ${c}33`, borderRadius: 8, padding: "8px 12px",
      fontSize: 11, color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: c, fontSize: 14 }}>{icon}</span>{msg}
    </div>
  );
}

// ======================== PANEL KPIs ========================
function PanelKPIs() {
  const kpis = [
    { cat: "Producción",  items: [
      { label: "Eficiencia Operativa",    value: 87.4, unit: "%", low: 70, mid: 85 },
      { label: "Rendimiento Producción",  value: 80.0, unit: "%", low: 70, mid: 85 },
      { label: "Tasa de Merma",           value: 12.0, unit: "%", low: 5,  mid: 10, inverse: true },
      { label: "OEE Industrial",          value: 78.5, unit: "%", low: 65, mid: 85 },
      { label: "Productividad/hora",      value: 112,  unit: "Kg/h", low: 80, mid: 100 },
    ]},
    { cat: "Calidad",  items: [
      { label: "% Fruta Apta",            value: 88.0, unit: "%", low: 80, mid: 90 },
      { label: "Índice Inocuidad",        value: 95.0, unit: "%", low: 85, mid: 95 },
      { label: "Cumplimiento HACCP",      value: 92.0, unit: "%", low: 80, mid: 90 },
      { label: "Cumplimiento BPM",        value: 96.0, unit: "%", low: 85, mid: 95 },
      { label: "% Producto Exportable",   value: 85.0, unit: "%", low: 75, mid: 85 },
    ]},
    { cat: "Logística",  items: [
      { label: "Cumplimiento Pedidos",    value: 95.0, unit: "%", low: 85, mid: 95 },
      { label: "Nivel de Inventario",     value: 74.0, unit: "%", low: 60, mid: 80 },
      { label: "Rotación Almacén",        value: 5.2,  unit: "x", low: 3,  mid: 5 },
      { label: "Tiempo Despacho",         value: 4.5,  unit: "h", low: 8,  mid: 6, inverse: true },
      { label: "Nivel Logístico",         value: 91.0, unit: "%", low: 80, mid: 90 },
    ]},
    { cat: "Maquinaria",  items: [
      { label: "Disponibilidad Maquinaria",value: 90.0, unit: "%", low: 75, mid: 85 },
      { label: "Utilización Capacidad",   value: 87.4, unit: "%", low: 70, mid: 85 },
      { label: "Mantenimiento Preventivo",value: 95.0, unit: "%", low: 80, mid: 90 },
      { label: "Índice de Rechazo",       value: 6.5,  unit: "%", low: 5,  mid: 10, inverse: true },
      { label: "Tiempo Muerto",           value: 3.2,  unit: "%", low: 10, mid: 5, inverse: true },
    ]},
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Panel de KPIs</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>Indicadores Clave de Desempeño Industrial</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {kpis.map(cat => (
          <div key={cat.cat} style={styles.card}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, letterSpacing: 1, marginBottom: 12 }}>{cat.cat.toUpperCase()}</div>
            {cat.items.map(item => {
              const score = item.inverse ? (item.mid > item.value ? 100 : item.value < item.low ? 100 : 50) : item.value;
              const c = item.inverse
                ? (item.value <= item.mid ? COLORS.green : item.value <= item.low ? COLORS.yellow : COLORS.red)
                : semaphore(item.value, item.low, item.mid);
              return (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: COLORS.textSub }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{item.value}{item.unit}</span>
                  </div>
                  <div style={{ background: COLORS.border, borderRadius: 4, height: 6 }}>
                    <div style={{
                      width: `${Math.min(item.value, 100)}%`,
                      background: c, height: 6, borderRadius: 4,
                      transition: "width 0.5s",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== PANEL CALIDAD ========================
function PanelCalidad() {
  const [lote, setLote] = useState("LT-2024-001");
  const lotes = ["LT-2024-001", "LT-2024-002", "LT-2024-003", "LT-2024-004"];

  const qualityData = [
    { proceso: "Recepción",    aptos: 92, rechazos: 8,  temperatura: 12, humedad: 85 },
    { proceso: "Desinfección", aptos: 96, rechazos: 4,  temperatura: 10, humedad: 80 },
    { proceso: "Selección",    aptos: 88, rechazos: 12, temperatura: 11, humedad: 82 },
    { proceso: "Empaque",      aptos: 95, rechazos: 5,  temperatura: 10, humedad: 78 },
    { proceso: "Transporte",   aptos: 97, rechazos: 3,  temperatura: 9,  humedad: 75 },
  ];

  const normas = [
    { norma: "HACCP", cumplimiento: 92, meta: 95 },
    { norma: "BPM",   cumplimiento: 96, meta: 95 },
    { norma: "ISO 22000", cumplimiento: 88, meta: 90 },
    { norma: "GlobalG.A.P", cumplimiento: 91, meta: 90 },
    { norma: "SENASA", cumplimiento: 98, meta: 100 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Panel de Calidad</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Lote:</span>
        {lotes.map(l => (
          <button key={l} onClick={() => setLote(l)} style={{
            padding: "5px 12px", borderRadius: 20, border: `1px solid ${lote === l ? COLORS.green : COLORS.border}`,
            background: lote === l ? COLORS.green + "22" : "transparent",
            color: lote === l ? COLORS.green : COLORS.textMuted, fontSize: 11, cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Fruta Apta" value="88%" color={COLORS.green} sublabel={lote} />
        <KpiCard label="Índice Inocuidad" value="95%" color={COLORS.cyan} sublabel="Dentro de norma" />
        <KpiCard label="Temp. Promedio" value="10.4°C" color={COLORS.accent} sublabel="Rango: 8-14°C ✓" />
        <KpiCard label="Humedad Prom." value="80%" color={COLORS.green} sublabel="Rango: 70-90% ✓" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Tabla calidad por proceso */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Calidad por Proceso — {lote}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Proceso", "Aptos %", "Rechazo %", "Temp.", "Hum."].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textMuted, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qualityData.map(row => (
                <tr key={row.proceso} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "7px 8px", color: COLORS.text }}>{row.proceso}</td>
                  <td style={{ padding: "7px 8px", color: semaphore(row.aptos, 80, 90) }}>{row.aptos}%</td>
                  <td style={{ padding: "7px 8px", color: row.rechazos > 10 ? COLORS.red : COLORS.yellow }}>{row.rechazos}%</td>
                  <td style={{ padding: "7px 8px", color: COLORS.textSub }}>{row.temperatura}°C</td>
                  <td style={{ padding: "7px 8px", color: COLORS.textSub }}>{row.humedad}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Normas de calidad */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Cumplimiento de Normas</div>
          {normas.map(n => {
            const c = semaphore(n.cumplimiento / n.meta * 100, 85, 95);
            return (
              <div key={n.norma} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: COLORS.textSub, fontWeight: 600 }}>{n.norma}</span>
                  <span style={{ fontSize: 11, color: c, fontWeight: 700 }}>{n.cumplimiento}% / Meta: {n.meta}%</span>
                </div>
                <div style={{ background: COLORS.border, borderRadius: 4, height: 8, position: "relative" }}>
                  <div style={{ width: `${n.cumplimiento}%`, background: c, height: 8, borderRadius: 4 }} />
                  <div style={{ position: "absolute", left: `${n.meta}%`, top: -2, bottom: -2,
                    width: 2, background: COLORS.yellow, borderRadius: 1 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ======================== ANÁLISIS MERMAS ========================
function AnalisisMermas() {
  const mermasData = [
    { proceso: "Recepción",    ideal: 12, real: 10.8, unidad: "%" },
    { proceso: "Desinfección", ideal: 6,  real: 3.6,  unidad: "%" },
    { proceso: "Selección",    ideal: 14, real: 14.0, unidad: "%" },
    { proceso: "Empaque",      ideal: 4,  real: 4.0,  unidad: "%" },
    { proceso: "Transporte",   ideal: 4,  real: 3.16, unidad: "%" },
  ];

  const areaData = [
    { dia: "Lun", fisico: 8, biologico: 3, operacional: 5 },
    { dia: "Mar", fisico: 10, biologico: 4, operacional: 6 },
    { dia: "Mie", fisico: 7, biologico: 2, operacional: 4 },
    { dia: "Jue", fisico: 9, biologico: 5, operacional: 7 },
    { dia: "Vie", fisico: 6, biologico: 3, operacional: 5 },
    { dia: "Sab", fisico: 12, biologico: 6, operacional: 8 },
  ];

  const total = mermasData.reduce((s, m) => s + m.real, 0).toFixed(1);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Análisis de Mermas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Merma Total" value={`${total}%`} color={semaphore(100 - +total, 60, 75)} sublabel="Suma de procesos" />
        <KpiCard label="Mayor Merma" value="Selección" color={COLORS.orange} sublabel="14% del proceso" />
        <KpiCard label="Pérdida Kg/día" value="350" unit="Kg" color={COLORS.red} sublabel="Estimado 3 turnos" />
        <KpiCard label="Pérdida USD/día" value="$420" color={COLORS.red} sublabel="~$1.2/Kg exportable" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Merma Ideal vs Real por Proceso (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mermasData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
              <XAxis type="number" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis type="category" dataKey="proceso" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="ideal" fill={COLORS.border} name="Ideal" radius={[0, 3, 3, 0]} />
              <Bar dataKey="real" fill={COLORS.orange} name="Real" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Merma por Tipo — Tendencia Semanal (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="dia" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="fisico" stroke={COLORS.red} fill={COLORS.red + "33"} name="Físico" stackId="1" />
              <Area type="monotone" dataKey="biologico" stroke={COLORS.orange} fill={COLORS.orange + "33"} name="Biológico" stackId="1" />
              <Area type="monotone" dataKey="operacional" stroke={COLORS.yellow} fill={COLORS.yellow + "33"} name="Operacional" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ======================== GESTIÓN ALMACÉN ========================
function GestionAlmacen() {
  const [stock, setStock] = useState(850);
  const stockData = [
    { categoria: "Mango Kent",    stock: 420, capacidad: 600, min: 100 },
    { categoria: "Mango Tommy",   stock: 280, capacidad: 400, min: 80 },
    { categoria: "Mango Edward",  stock: 150, capacidad: 300, min: 50 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Gestión de Almacén</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Stock Total" value={`${stock}`} unit="Cajas" color={COLORS.cyan} />
        <KpiCard label="Capacidad" value="1,300" unit="Cajas" color={COLORS.accent} sublabel="Máx. instalada" />
        <KpiCard label="Ocupación" value={`${((stock/1300)*100).toFixed(0)}%`} color={semaphore((stock/1300)*100, 50, 80)} />
        <KpiCard label="Temperatura" value="10°C" color={COLORS.green} sublabel="Rango OK: 8-14°C" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Stock por Categoría</div>
          {stockData.map(item => {
            const pctUsed = (item.stock / item.capacidad) * 100;
            const c = semaphore(pctUsed, 30, 60);
            return (
              <div key={item.categoria} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: COLORS.text }}>{item.categoria}</span>
                  <span style={{ fontSize: 11, color: c }}>{item.stock} / {item.capacidad} Cajas</span>
                </div>
                <div style={{ background: COLORS.border, borderRadius: 6, height: 10, position: "relative" }}>
                  <div style={{ width: `${pctUsed}%`, background: c, height: 10, borderRadius: 6, transition: "width 0.5s" }} />
                  <div style={{ position: "absolute", left: `${(item.min / item.capacidad) * 100}%`,
                    top: -2, bottom: -2, width: 2, background: COLORS.red }} />
                </div>
                <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>Mín: {item.min} | {pctUsed.toFixed(0)}% utilizado</div>
              </div>
            );
          })}
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Rotación de Inventario</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { mes: "Ene", rotacion: 4.2 }, { mes: "Feb", rotacion: 5.1 },
              { mes: "Mar", rotacion: 4.8 }, { mes: "Abr", rotacion: 5.5 },
              { mes: "May", rotacion: 5.2 }, { mes: "Jun", rotacion: 4.9 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="mes" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="rotacion" fill={COLORS.accent} name="Rotación (x)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ======================== TRAZABILIDAD ========================
function Trazabilidad() {
  const [loteQ, setLoteQ] = useState("LT-2024-001");
  const trazas = {
    "LT-2024-001": [
      { etapa: "Recepción MP",     fecha: "2024-01-15 06:00", estado: "OK",  operario: "J. Rodríguez",   kg: 1000, obs: "MP conforme" },
      { etapa: "Desinfección",     fecha: "2024-01-15 08:30", estado: "OK",  operario: "M. García",      kg: 980,  obs: "Cloro 200ppm" },
      { etapa: "Clasificación",    fecha: "2024-01-15 10:00", estado: "OK",  operario: "L. Torres",      kg: 860,  obs: "Calibre 6 seleccionado" },
      { etapa: "Empaque",          fecha: "2024-01-15 13:00", estado: "OK",  operario: "A. Sánchez",     kg: 820,  obs: "250 cajas empacadas" },
      { etapa: "Control Calidad",  fecha: "2024-01-15 15:00", estado: "OK",  operario: "Jefa Calidad",   kg: 820,  obs: "95% conforme BPM" },
      { etapa: "Almacenamiento",   fecha: "2024-01-15 16:00", estado: "OK",  operario: "Almacenero",     kg: 820,  obs: "Temp: 10°C" },
      { etapa: "Despacho",         fecha: "2024-01-16 04:00", estado: "PEND",operario: "Logística",      kg: 820,  obs: "Pendiente camión frío" },
    ]
  };
  const traza = trazas[loteQ] || trazas["LT-2024-001"];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Trazabilidad por Lote</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Lote:</span>
        <input value={loteQ} onChange={e => setLoteQ(e.target.value)}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
            padding: "6px 12px", color: COLORS.text, fontSize: 12, outline: "none" }} />
      </div>
      <div style={styles.card}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>
          Historial de Trazabilidad — {loteQ}
        </div>
        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: COLORS.border }} />
          {traza.map((t, i) => {
            const c = t.estado === "OK" ? COLORS.green : COLORS.yellow;
            return (
              <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10,
                  borderRadius: "50%", background: c, border: `2px solid ${COLORS.bg}` }} />
                <div style={{ background: COLORS.cardHover, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{t.etapa}</span>
                    <span style={{ background: c + "22", color: c, border: `1px solid ${c}44`,
                      borderRadius: 20, padding: "2px 8px", fontSize: 10 }}>{t.estado}</span>
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>{t.fecha} | Op: {t.operario}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 10 }}>
                    <span style={{ color: COLORS.textSub }}>📦 {t.kg} Kg</span>
                    <span style={{ color: COLORS.textSub }}>📝 {t.obs}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ======================== REPORTES ========================
function Reportes() {
  const reportData = [
    { mes: "Ene", produccion: 42000, exportado: 36000, rechazado: 3200, merma: 7.6 },
    { mes: "Feb", produccion: 45000, exportado: 39000, rechazado: 2800, merma: 6.2 },
    { mes: "Mar", produccion: 38000, exportado: 32000, rechazado: 3600, merma: 9.5 },
    { mes: "Abr", produccion: 50000, exportado: 44000, rechazado: 2900, merma: 5.8 },
    { mes: "May", produccion: 47000, exportado: 41000, rechazado: 3100, merma: 6.6 },
    { mes: "Jun", produccion: 52000, exportado: 46000, rechazado: 2600, merma: 5.0 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Reportes y Estadísticas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Producción Semestral" value="274,000" unit="Kg" color={COLORS.accent} />
        <KpiCard label="Total Exportado" value="238,000" unit="Kg" color={COLORS.green} />
        <KpiCard label="Total Rechazado" value="18,200" unit="Kg" color={COLORS.red} />
        <KpiCard label="% Merma Prom." value="6.8%" color={COLORS.yellow} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Producción vs Exportación (Kg)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="mes" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }}
                formatter={(v, n) => [`${v.toLocaleString()} Kg`, n]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="produccion" fill={COLORS.accent} name="Producción" radius={[3, 3, 0, 0]} />
              <Bar dataKey="exportado"  fill={COLORS.green}  name="Exportado"  radius={[3, 3, 0, 0]} />
              <Bar dataKey="rechazado"  fill={COLORS.red}    name="Rechazado"  radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Tendencia de Merma Mensual (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="mes" stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
              <YAxis stroke={COLORS.textMuted} tick={{ fill: COLORS.textMuted, fontSize: 10 }} domain={[4, 12]} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="merma" stroke={COLORS.orange} strokeWidth={2.5}
                dot={{ fill: COLORS.orange, r: 4 }} name="Merma %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ======================== ALERTAS ========================
function Alertas() {
  const alertasList = [
    { nivel: "CRÍTICO", proceso: "Selección", msg: "Merma de selección al 14% — igual al límite máximo", time: "Hoy 09:15", icon: "⚠" },
    { nivel: "CRÍTICO", proceso: "Desinfección", msg: "Rendimiento real 3.6% vs ideal 6% — desviación significativa", time: "Hoy 08:45", icon: "⚠" },
    { nivel: "ADVERTENCIA", proceso: "Transporte", msg: "Capacidad real 3.16% vs ideal 4% — por debajo del objetivo", time: "Hoy 07:30", icon: "⚡" },
    { nivel: "ADVERTENCIA", proceso: "RRHH", msg: "Horas capacitación: 1.75% vs 2% ideal — revisar plan", time: "Ayer 16:00", icon: "⚡" },
    { nivel: "INFO", proceso: "Seguridad", msg: "100% de EPPS entregados — proceso en óptimas condiciones", time: "Ayer 08:00", icon: "ℹ" },
    { nivel: "OK", proceso: "Logística", msg: "100% pedidos entregados a tiempo este mes", time: "Lun 06:00", icon: "✓" },
    { nivel: "OK", proceso: "Comercial", msg: "100% producto vendido — sin stock sin movimiento", time: "Lun 08:00", icon: "✓" },
    { nivel: "OK", proceso: "BPM", msg: "96% de cumplimiento BPM — por encima del 95% requerido", time: "Lun 09:00", icon: "✓" },
  ];

  const colorMap = { CRÍTICO: COLORS.red, ADVERTENCIA: COLORS.yellow, INFO: COLORS.cyan, OK: COLORS.green };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Alertas Operativas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[["CRÍTICO", 2, COLORS.red], ["ADVERTENCIA", 2, COLORS.yellow], ["INFO", 1, COLORS.cyan], ["OK", 3, COLORS.green]].map(([tipo, n, c]) => (
          <KpiCard key={tipo} label={tipo} value={n} unit="alertas" color={c} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alertasList.map((a, i) => {
          const c = colorMap[a.nivel];
          return (
            <div key={i} style={{ background: COLORS.card, border: `1px solid ${c}33`,
              borderLeft: `4px solid ${c}`, borderRadius: 8, padding: "12px 16px",
              display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: c + "22", color: c, border: `1px solid ${c}44`,
                      borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{a.nivel}</span>
                    <span style={{ fontSize: 11, color: COLORS.textSub }}>{a.proceso}</span>
                  </div>
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>{a.time}</span>
                </div>
                <p style={{ fontSize: 12, color: COLORS.text, margin: 0 }}>{a.msg}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================== APP PRINCIPAL ========================
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [simProceso, setSimProceso] = useState("RECEPCION");

  const renderContent = () => {
    switch (active) {
      case "dashboard":    return <Dashboard />;
      case "mapa":         return <MapaProcesos setActive={setActive} setSimProceso={setSimProceso} />;
      case "simulador":    return <Simulador procesoInicial={simProceso} />;
      case "kpis":         return <PanelKPIs />;
      case "calidad":      return <PanelCalidad />;
      case "mermas":       return <AnalisisMermas />;
      case "almacen":      return <GestionAlmacen />;
      case "trazabilidad": return <Trazabilidad />;
      case "reportes":     return <Reportes />;
      case "alertas":      return <Alertas />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div style={styles.app}>
      <Sidebar active={active} setActive={setActive} />
      <div style={styles.main}>
        <TopBar active={active} setActive={setActive} />
        <div style={{ overflow: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
