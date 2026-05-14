import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  LockKeyhole,
  Map,
  NotebookPen,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { profileSeed, sampleActivity, technicalItems } from "./lib/seed";

const navItems = [
  { label: "Fundacion", icon: Layers3 },
  { label: "Datos", icon: Database },
  { label: "UI", icon: Sparkles },
  { label: "Staging", icon: GitBranch },
];

const mapSlots = [
  { day: "L", profile: "A", hours: "09:00-11:00", level: 2 },
  { day: "M", profile: "B", hours: "10:00-13:00", level: 3 },
  { day: "X", profile: "A+B", hours: "16:00-18:30", level: 4 },
  { day: "J", profile: "A", hours: "11:30-12:30", level: 1 },
  { day: "V", profile: "B", hours: "09:30-12:00", level: 3 },
];

const statusStyles = {
  "Base preparada": "blue",
  "SQL + seed": "green",
  "Modelo listo": "cyan",
  "Auditoria base": "amber",
  Incluidos: "green",
  Constraints: "rose",
  "Base creada": "blue",
};

function App() {
  const [profiles, setProfiles] = useState(profileSeed);
  const [sessionEmail, setSessionEmail] = useState("");
  const [syncState, setSyncState] = useState(
    hasSupabaseConfig ? "Conectando con Supabase..." : "Modo local hasta conectar Supabase",
  );

  useEffect(() => {
    if (!supabase) return;

    let ignore = false;

    async function loadInitialState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!ignore && session?.user?.email) {
        setSessionEmail(session.user.email);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,description,color,display_order,is_active")
        .order("display_order", { ascending: true });

      if (ignore) return;

      if (error) {
        setSyncState("Supabase configurado, falta aplicar la migracion SQL");
        return;
      }

      if (data?.length) {
        setProfiles(data);
        setSyncState("Sincronizado con Supabase");
      } else {
        setSyncState("Supabase listo, pendiente de seed de perfiles");
      }
    }

    loadInitialState();

    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadInitialState(),
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const completedItems = useMemo(
    () => technicalItems.filter((item) => item.status !== "Pendiente").length,
    [],
  );

  return (
    <main className="app-shell">
      <aside className="sidebar glass-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <Map size={22} />
          </div>
          <div>
            <p className="chrome-label">Sprint 0</p>
            <h1>Doble Perfil</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegacion principal">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button className={index === 0 ? "nav-item is-active" : "nav-item"} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <ShieldCheck size={18} />
          <span>{syncState}</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="chrome-label">Fundacion tecnica</p>
            <h2>Base lista para desarrollar sin rehacer estructura</h2>
          </div>
          <div className="topbar-actions">
            <span className={hasSupabaseConfig ? "status-dot is-online" : "status-dot"} />
            <span>{hasSupabaseConfig ? "Backend conectado" : "Backend pendiente"}</span>
          </div>
        </header>

        <section className="hero-grid">
          <article className="summary-panel glass-panel">
            <div className="summary-copy">
              <p className="chrome-label">Gate de salida</p>
              <h3>Repositorio, modelo de datos y sistema visual preparados</h3>
              <p>
                Esta primera version deja montada la estructura tecnica: frontend ejecutable,
                Supabase documentado, migracion SQL, seed de perfiles, RLS, indices y base visual.
              </p>
            </div>
            <div className="metrics-row">
              <Metric label="Items Sprint 0" value={technicalItems.length} icon={CheckCircle2} />
              <Metric label="Cubiertos" value={completedItems} icon={Activity} />
              <Metric label="Perfiles" value={profiles.length} icon={UserRound} />
            </div>
          </article>

          <article className="login-card glass-panel">
            <div className="section-title">
              <LockKeyhole size={18} />
              <span>Acceso seguro</span>
            </div>
            <label>
              Email
              <input value={sessionEmail} onChange={(event) => setSessionEmail(event.target.value)} placeholder="usuario@empresa.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Gestionado por Supabase Auth" />
            </label>
            <button className="primary-button" type="button">
              Preparado para login real
            </button>
          </article>
        </section>

        <section className="content-grid">
          <article className="glass-panel profiles-panel">
            <div className="section-heading">
              <div>
                <p className="chrome-label">DATA-02</p>
                <h3>Perfiles operativos</h3>
              </div>
              <button className="ghost-button" type="button">
                <Settings2 size={16} />
                Editar
              </button>
            </div>
            <div className="profile-list">
              {profiles.map((profile) => (
                <div className="profile-card" key={profile.id} style={{ "--profile-color": profile.color }}>
                  <div className="profile-avatar">{profile.name.replace("Perfil ", "")}</div>
                  <div>
                    <h4>{profile.name}</h4>
                    <p>{profile.description}</p>
                  </div>
                  <span className="small-badge">Activo</span>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-panel activity-panel">
            <div className="section-heading">
              <div>
                <p className="chrome-label">DATA-03 / DATA-04</p>
                <h3>{sampleActivity.title}</h3>
              </div>
              <span className="small-badge blue">En curso</span>
            </div>
            <p className="activity-description">{sampleActivity.description}</p>
            <div className="activity-map" aria-label="Mapa semanal de actividad">
              {mapSlots.map((slot) => (
                <div className={`map-slot level-${slot.level}`} key={`${slot.day}-${slot.profile}`}>
                  <strong>{slot.day}</strong>
                  <span>{slot.profile}</span>
                  <small>{slot.hours}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="glass-panel backlog-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">Items, epicas y aceptacion</p>
              <h3>Cobertura Sprint 0</h3>
            </div>
            <span className="small-badge green">Listo para QA</span>
          </div>
          <div className="item-grid">
            {technicalItems.map((item) => (
              <article className="item-card" key={item.code}>
                <div className="item-card-header">
                  <span>{item.code}</span>
                  <Badge tone={statusStyles[item.status]}>{item.status}</Badge>
                </div>
                <h4>{item.title}</h4>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="foundation-rail">
          <RailItem icon={Database} title="Base de datos" body="SQL inicial con relaciones, constraints, indices, RLS y triggers." />
          <RailItem icon={CalendarDays} title="Horarios" body="Bloques por dia, perfil y actividad, listos para mapa de carga." />
          <RailItem icon={NotebookPen} title="Notas" body="Notas y pendientes ya modelados para perfil, actividad o ambos." />
          <RailItem icon={Wrench} title="Herramientas" body="Registro trazable de herramientas y temas trabajados." />
          <RailItem icon={Clock3} title="Cambios" body="Historial tecnico preparado para auditoria por usuario y fecha." />
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <Icon size={18} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  return <span className={`small-badge ${tone}`}>{children}</span>;
}

function RailItem({ icon: Icon, title, body }) {
  return (
    <article className="rail-item">
      <Icon size={18} />
      <div>
        <h4>{title}</h4>
        <p>{body}</p>
      </div>
    </article>
  );
}

export default App;
