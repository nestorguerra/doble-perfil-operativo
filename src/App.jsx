import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  LockKeyhole,
  LogOut,
  Map,
  Settings2,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeEmail,
  validateLoginForm,
  validateRegistrationForm,
} from "./lib/authValidation";
import { hasSupabaseConfig, isRegistrationEnabled, supabase } from "./lib/supabase";
import { profileSeed, sampleActivity } from "./lib/seed";

const navItems = [
  { label: "Dashboard", icon: Layers3 },
  { label: "Datos", icon: Database },
  { label: "Seguridad", icon: ShieldCheck },
  { label: "Staging", icon: GitBranch },
];

const authItems = [
  {
    code: "AUTH-01",
    title: "Pantalla de login",
    status: "Funcional",
    detail: "Formulario con email, contrasena, validacion, carga y errores comprensibles.",
  },
  {
    code: "AUTH-02",
    title: "Registro controlado",
    status: "Configurable",
    detail: "Alta con Supabase Auth cuando VITE_AUTH_REGISTRATION_ENABLED esta activo.",
  },
  {
    code: "AUTH-04",
    title: "Sesion persistente",
    status: "Funcional",
    detail: "La app lee la sesion al cargar y escucha cambios de Supabase Auth.",
  },
  {
    code: "AUTH-05",
    title: "Logout",
    status: "Funcional",
    detail: "Cierre de sesion visible en cabecera y limpieza de estado local.",
  },
  {
    code: "AUTH-06",
    title: "Rutas privadas",
    status: "Protegidas",
    detail: "El dashboard no se renderiza hasta confirmar una sesion autenticada.",
  },
  {
    code: "AUTH-07",
    title: "RLS",
    status: "Migracion",
    detail: "Politicas para bloquear anonimos y permitir lectura/escritura autenticada.",
  },
  {
    code: "ADMIN-03",
    title: "Roles simples",
    status: "user/admin",
    detail: "Rol guardado en user_profiles y disponible para condicionar acciones sensibles.",
  },
  {
    code: "QA-02 / QA-06",
    title: "Pruebas",
    status: "Documentadas",
    detail: "Matriz de login, sesion, logout y permisos anonimo/autenticado.",
  },
];

const mapSlots = [
  { day: "L", profile: "A", hours: "09:00-11:00", level: 2 },
  { day: "M", profile: "B", hours: "10:00-13:00", level: 3 },
  { day: "X", profile: "A+B", hours: "16:00-18:30", level: 4 },
  { day: "J", profile: "A", hours: "11:30-12:30", level: 1 },
  { day: "V", profile: "B", hours: "09:30-12:00", level: 3 },
];

const statusStyles = {
  Funcional: "green",
  Configurable: "blue",
  Protegidas: "rose",
  Migracion: "amber",
  "user/admin": "cyan",
  Documentadas: "green",
};

const initialAuthForm = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function App() {
  const [authStatus, setAuthStatus] = useState(hasSupabaseConfig ? "loading" : "unauthenticated");
  const [session, setSession] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [profiles, setProfiles] = useState(profileSeed);
  const [syncState, setSyncState] = useState(
    hasSupabaseConfig ? "Comprobando sesion segura..." : "Falta conectar Supabase",
  );

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function resolveSession() {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!active) return;

      setSession(activeSession);
      setAuthStatus(activeSession ? "authenticated" : "unauthenticated");
    }

    resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setCurrentUserProfile(null);
      setProfiles(profileSeed);
      if (!hasSupabaseConfig) setSyncState("Falta conectar Supabase");
      return;
    }

    let ignore = false;

    async function loadPrivateState() {
      setSyncState("Sincronizando datos privados...");

      const [profileResult, currentUserResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,description,color,display_order,is_active")
          .order("display_order", { ascending: true }),
        supabase
          .from("user_profiles")
          .select("id,display_name,role")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);

      if (ignore) return;

      if (profileResult.error || currentUserResult.error) {
        setSyncState("Supabase conectado, falta aplicar migraciones");
        return;
      }

      if (profileResult.data?.length) {
        setProfiles(profileResult.data);
      }

      if (currentUserResult.data) {
        setCurrentUserProfile(currentUserResult.data);
      }

      setSyncState("Sesion activa y datos protegidos");
    }

    loadPrivateState();

    const channel = supabase
      .channel("private-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadPrivateState(),
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUserProfile(null);
    setProfiles(profileSeed);
    setAuthStatus("unauthenticated");
    setSyncState("Sesion cerrada");
  }

  if (authStatus === "loading") {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthScreen syncState={syncState} />;
  }

  return (
    <PrivateDashboard
      currentUserProfile={currentUserProfile}
      onSignOut={handleSignOut}
      profiles={profiles}
      session={session}
      syncState={syncState}
    />
  );
}

function AuthScreen({ syncState }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialAuthForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = mode === "register";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    const validationError = isRegisterMode
      ? validateRegistrationForm(form)
      : validateLoginForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!supabase) {
      setError("Conecta Supabase en .env para activar login real.");
      return;
    }

    if (isRegisterMode && !isRegistrationEnabled) {
      setError("El registro esta cerrado. Activalo solo cuando quieras crear accesos.");
      return;
    }

    setIsSubmitting(true);

    const email = normalizeEmail(form.email);
    const result = isRegisterMode
      ? await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              display_name: form.displayName.trim(),
            },
          },
        })
      : await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });

    setIsSubmitting(false);

    if (result.error) {
      setError(readableAuthError(result.error.message));
      return;
    }

    if (isRegisterMode) {
      setStatus("Usuario creado. Si Supabase pide confirmacion, revisa el email antes de entrar.");
      setMode("login");
      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      return;
    }

    setStatus("Entrando...");
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero glass-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <Map size={22} />
          </div>
          <div>
            <p className="chrome-label">Sprint 1</p>
            <h1>Doble Perfil</h1>
          </div>
        </div>
        <div className="auth-copy">
          <p className="chrome-label">Login y base segura</p>
          <h2>Acceso protegido antes de mostrar datos privados</h2>
          <p>
            El dashboard queda bloqueado hasta que Supabase confirme una sesion valida. La sesion
            persiste al recargar y los datos operativos se leen solo con usuario autenticado.
          </p>
        </div>
        <div className="auth-security-grid">
          <SecurityPoint icon={LockKeyhole} title="Auth real" body="Email y contrasena gestionados por Supabase." />
          <SecurityPoint icon={ShieldCheck} title="RLS" body="Anonimos bloqueados en tablas privadas." />
          <SecurityPoint icon={UserRoundPlus} title="Roles" body="Base user/admin preparada para administracion." />
        </div>
      </section>

      <section className="auth-panel glass-panel">
        <div className="auth-panel-head">
          <div>
            <p className="chrome-label">Acceso</p>
            <h2>{isRegisterMode ? "Crear usuario" : "Entrar"}</h2>
          </div>
          <span className={hasSupabaseConfig ? "small-badge green" : "small-badge amber"}>
            {hasSupabaseConfig ? "Supabase listo" : "Config pendiente"}
          </span>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Modo de autenticacion">
          <button
            aria-selected={!isRegisterMode}
            className={!isRegisterMode ? "is-selected" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            aria-selected={isRegisterMode}
            className={isRegisterMode ? "is-selected" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Registro
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <label>
              Nombre visible
              <input
                autoComplete="name"
                onChange={(event) => updateField("displayName", event.target.value)}
                placeholder="Nombre del usuario"
                value={form.displayName}
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="usuario@empresa.com"
              type="email"
              value={form.email}
            />
          </label>
          <label>
            Contrasena
            <input
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimo 8 caracteres"
              type="password"
              value={form.password}
            />
          </label>
          {isRegisterMode && (
            <label>
              Confirmar contrasena
              <input
                autoComplete="new-password"
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repite la contrasena"
                type="password"
                value={form.confirmPassword}
              />
            </label>
          )}

          {error && <p className="form-message is-error">{error}</p>}
          {status && <p className="form-message is-success">{status}</p>}
          {!hasSupabaseConfig && (
            <p className="form-message is-info">
              {syncState}. Rellena las variables de entorno para activar autenticacion real.
            </p>
          )}
          {isRegisterMode && !isRegistrationEnabled && hasSupabaseConfig && (
            <p className="form-message is-info">
              Registro controlado cerrado por configuracion.
            </p>
          )}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Procesando..." : isRegisterMode ? "Crear acceso" : "Entrar al dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PrivateDashboard({ currentUserProfile, onSignOut, profiles, session, syncState }) {
  const completedItems = useMemo(() => authItems.length, []);
  const role = currentUserProfile?.role ?? "user";
  const displayName = currentUserProfile?.display_name || session.user.email;

  return (
    <main className="app-shell">
      <aside className="sidebar glass-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <Map size={22} />
          </div>
          <div>
            <p className="chrome-label">Sprint 1</p>
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
            <p className="chrome-label">Login y base segura</p>
            <h2>Dashboard privado con sesion persistente</h2>
          </div>
          <div className="topbar-actions user-chip">
            <span className="status-dot is-online" />
            <div>
              <strong>{displayName}</strong>
              <span>{role === "admin" ? "Administrador" : "Usuario"}</span>
            </div>
            <button className="icon-button" onClick={onSignOut} title="Cerrar sesion" type="button">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <article className="summary-panel glass-panel">
            <div className="summary-copy">
              <p className="chrome-label">Gate de salida</p>
              <h3>Usuario real puede entrar, recargar y cerrar sesion</h3>
              <p>
                La informacion privada solo se monta despues de validar la sesion. El frontend ya
                consume el rol desde `user_profiles` y deja acciones admin preparadas.
              </p>
            </div>
            <div className="metrics-row">
              <Metric label="Items Sprint 1" value={authItems.length} icon={CheckCircle2} />
              <Metric label="Cubiertos" value={completedItems} icon={Activity} />
              <Metric label="Rol activo" value={role} icon={UserRound} />
            </div>
          </article>

          <article className="login-card glass-panel">
            <div className="section-title">
              <LockKeyhole size={18} />
              <span>Sesion persistente</span>
            </div>
            <div className="secure-state">
              <span className="status-dot is-online" />
              <div>
                <strong>Ruta privada desbloqueada</strong>
                <p>Si recargas, Supabase recupera la sesion guardada.</p>
              </div>
            </div>
            <button className="ghost-button full-width" onClick={onSignOut} type="button">
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </article>
        </section>

        <section className="content-grid">
          <article className="glass-panel profiles-panel">
            <div className="section-heading">
              <div>
                <p className="chrome-label">Datos protegidos</p>
                <h3>Perfiles operativos</h3>
              </div>
              <button className="ghost-button" disabled={role !== "admin"} type="button">
                <Settings2 size={16} />
                Admin
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
                <p className="chrome-label">Mapa privado</p>
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
              <h3>Cobertura Sprint 1</h3>
            </div>
            <span className="small-badge green">Listo para QA</span>
          </div>
          <div className="item-grid">
            {authItems.map((item) => (
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
          <RailItem icon={LockKeyhole} title="Login" body="Formulario real conectado a Supabase Auth." />
          <RailItem icon={UserRoundPlus} title="Registro" body="Alta controlada por variable de entorno." />
          <RailItem icon={ShieldCheck} title="RLS" body="Sin sesion no hay lectura ni escritura de tablas privadas." />
          <RailItem icon={UserRound} title="Roles" body="`user` y `admin` disponibles en frontend y base." />
          <RailItem icon={Clock3} title="Sesion" body="Persistencia, recarga y logout cubiertos." />
        </section>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-shell single">
      <section className="auth-panel glass-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="chrome-label">Sesion</p>
            <h1>Comprobando acceso</h1>
          </div>
        </div>
        <div className="loader-bar" />
      </section>
    </main>
  );
}

function SecurityPoint({ icon: Icon, title, body }) {
  return (
    <article className="security-point">
      <Icon size={18} />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
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

function readableAuthError(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login credentials")) {
    return "Email o contrasena incorrectos.";
  }

  if (lowerMessage.includes("email")) {
    return "Revisa el email introducido.";
  }

  if (lowerMessage.includes("password")) {
    return "Revisa la contrasena.";
  }

  return "No se ha podido completar la operacion. Prueba de nuevo.";
}

export default App;
