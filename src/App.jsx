import {
  Activity,
  AlertCircle,
  CalendarRange,
  Clock3,
  Filter,
  GitBranch,
  History,
  Layers3,
  LockKeyhole,
  LogOut,
  Map,
  Pencil,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeEmail,
  validateLoginForm,
  validateRegistrationForm,
} from "./lib/authValidation";
import { hasSupabaseConfig, isRegistrationEnabled, supabase } from "./lib/supabase";
import { profileSeed } from "./lib/seed";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Layers3 },
  { key: "profiles", label: "Perfiles", icon: UserRound },
  { key: "activities", label: "Actividades", icon: Activity },
  { key: "settings", label: "Ajustes", icon: Settings2 },
];

const statusFilters = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendiente" },
  { key: "in_progress", label: "En curso" },
  { key: "paused", label: "Pausada" },
  { key: "completed", label: "Completada" },
];

const statusLabel = {
  pending: "Pendiente",
  in_progress: "En curso",
  paused: "Pausada",
  completed: "Completada",
  archived: "Archivada",
  open: "Abierto",
  cancelled: "Cancelado",
};

const priorityRank = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const initialAuthForm = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emptyOperationalData = {
  activities: [],
  notes: [],
  pendingTasks: [],
  scheduleEntries: [],
  changes: [],
  tools: [],
  topics: [],
};

function App() {
  const [authStatus, setAuthStatus] = useState(hasSupabaseConfig ? "loading" : "unauthenticated");
  const [session, setSession] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [profiles, setProfiles] = useState(profileSeed);
  const [operationalData, setOperationalData] = useState(emptyOperationalData);
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
      setOperationalData(emptyOperationalData);
      if (!hasSupabaseConfig) setSyncState("Falta conectar Supabase");
      return;
    }

    let ignore = false;

    async function loadPrivateState() {
      setSyncState("Sincronizando dashboard...");

      const [
        profileResult,
        currentUserResult,
        activitiesResult,
        scheduleResult,
        pendingResult,
        notesResult,
        topicsResult,
        toolsResult,
        changesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,description,color,visible_role,display_order,is_active,updated_at")
          .order("display_order", { ascending: true }),
        supabase
          .from("user_profiles")
          .select("id,display_name,role")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("activities")
          .select("id,title,description,status,updated_at,created_at,activity_profiles(profile_id)")
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("schedule_entries")
          .select("id,activity_id,profile_id,work_date,start_time,end_time,total_minutes,notes")
          .order("work_date", { ascending: false })
          .limit(200),
        supabase
          .from("pending_tasks")
          .select("id,title,status,priority,due_date,profile_id,activity_id,updated_at")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(50),
        supabase
          .from("notes")
          .select("id,profile_id,activity_id,content,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("topics")
          .select("id,profile_id,activity_id,title,description,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("tools")
          .select("id,profile_id,activity_id,name,description,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("change_history")
          .select("id,entity_type,entity_id,change_type,changed_by,summary,changed_at")
          .order("changed_at", { ascending: false })
          .limit(12),
      ]);

      if (ignore) return;

      const hasError = [
        profileResult,
        currentUserResult,
        activitiesResult,
        scheduleResult,
        pendingResult,
        notesResult,
        topicsResult,
        toolsResult,
        changesResult,
      ].some((result) => result.error);

      if (hasError) {
        setSyncState("Supabase conectado, falta aplicar migraciones de Sprint 2");
        return;
      }

      setProfiles(profileResult.data?.length ? profileResult.data : profileSeed);
      setCurrentUserProfile(currentUserResult.data ?? null);
      setOperationalData({
        activities: activitiesResult.data ?? [],
        notes: notesResult.data ?? [],
        scheduleEntries: scheduleResult.data ?? [],
        pendingTasks: pendingResult.data ?? [],
        changes: changesResult.data ?? [],
        tools: toolsResult.data ?? [],
        topics: topicsResult.data ?? [],
      });
      setSyncState("Dashboard sincronizado");
    }

    loadPrivateState();

    const tables = [
      "profiles",
      "activities",
      "activity_profiles",
      "schedule_entries",
      "pending_tasks",
      "notes",
      "topics",
      "tools",
      "change_history",
    ];
    const channel = supabase.channel("sprint-2-dashboard-realtime");

    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => loadPrivateState());
    });

    channel.subscribe();

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
    setOperationalData(emptyOperationalData);
    setAuthStatus("unauthenticated");
    setSyncState("Sesion cerrada");
  }

  async function handleUpdateProfile(profileId, values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      color: values.color,
      visible_role: values.visible_role.trim(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profileId)
      .select("id,name,description,color,visible_role,display_order,is_active,updated_at")
      .single();

    if (error) return { error: readableDatabaseError(error.message) };

    setProfiles((current) =>
      current.map((profile) => (profile.id === profileId ? { ...profile, ...data } : profile)),
    );

    return { data };
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
      onUpdateProfile={handleUpdateProfile}
      operationalData={operationalData}
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
            <p className="chrome-label">Sprint 2</p>
            <h1>Doble Perfil</h1>
          </div>
        </div>
        <div className="auth-copy">
          <p className="chrome-label">Dashboard y perfiles interconectados</p>
          <h2>Acceso protegido antes de mostrar datos privados</h2>
          <p>
            El dashboard operativo, las fichas de perfil y los indicadores de actividad se cargan
            solo cuando Supabase confirma una sesion valida.
          </p>
        </div>
        <div className="auth-security-grid">
          <SecurityPoint icon={LockKeyhole} title="Auth real" body="Email y contrasena gestionados por Supabase." />
          <SecurityPoint icon={Layers3} title="Dashboard" body="Resumen, filtros, horas, cambios y pendientes." />
          <SecurityPoint icon={UserRoundPlus} title="Perfiles" body="Dos perfiles editables e interconectados." />
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

function PrivateDashboard({
  currentUserProfile,
  onSignOut,
  onUpdateProfile,
  operationalData,
  profiles,
  session,
  syncState,
}) {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!selectedProfileId && profiles[0]?.id) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  const role = currentUserProfile?.role ?? "user";
  const displayName = currentUserProfile?.display_name || session.user.email;
  const dashboardModel = useMemo(
    () => buildDashboardModel(profiles, operationalData),
    [profiles, operationalData],
  );
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  return (
    <main className="app-shell">
      <aside className="sidebar glass-panel">
        <div className="brand-block">
          <div className="brand-mark">
            <Map size={22} />
          </div>
          <div>
            <p className="chrome-label">Sprint 2</p>
            <h1>Doble Perfil</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegacion principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.key ? "nav-item is-active" : "nav-item"}
                key={item.key}
                onClick={() => setActiveView(item.key)}
                type="button"
              >
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
            <p className="chrome-label">Dashboard y perfiles interconectados</p>
            <h2>{viewTitle(activeView, selectedProfile)}</h2>
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

        {activeView === "dashboard" && (
          <DashboardView
            model={dashboardModel}
            onOpenActivities={() => setActiveView("activities")}
            onOpenProfile={(profileId) => {
              setSelectedProfileId(profileId);
              setActiveView("profiles");
            }}
            setStatusFilter={setStatusFilter}
          />
        )}

        {activeView === "profiles" && (
          <ProfilesView
            data={operationalData}
            model={dashboardModel}
            onUpdateProfile={onUpdateProfile}
            profiles={profiles}
            selectedProfile={selectedProfile}
            setSelectedProfileId={setSelectedProfileId}
          />
        )}

        {activeView === "activities" && (
          <ActivitiesView
            activities={operationalData.activities}
            profiles={profiles}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}

        {activeView === "settings" && (
          <SettingsView
            onUpdateProfile={onUpdateProfile}
            profiles={profiles}
            role={role}
          />
        )}
      </section>
    </main>
  );
}

function DashboardView({ model, onOpenActivities, onOpenProfile, setStatusFilter }) {
  return (
    <>
      <section className="dashboard-grid">
        {model.profileSummaries.map((profile) => (
          <button
            className="profile-summary glass-panel"
            key={profile.id}
            onClick={() => onOpenProfile(profile.id)}
            style={{ "--profile-color": profile.color }}
            type="button"
          >
            <div className="profile-avatar">{profile.name.replace("Perfil ", "")}</div>
            <div>
              <p className="chrome-label">{profile.visible_role || "Perfil operativo"}</p>
              <h3>{profile.name}</h3>
              <p>{profile.description || "Sin descripcion todavia."}</p>
            </div>
            <div className="profile-summary-stats">
              <MiniStat label="Horas" value={formatHours(profile.totalMinutes)} />
              <MiniStat label="Activas" value={profile.activeActivities} />
              <MiniStat label="Pendientes" value={profile.openTasks} />
            </div>
          </button>
        ))}
      </section>

      <section className="content-grid">
        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">DASH-02</p>
              <h3>Actividades activas</h3>
            </div>
            <button className="ghost-button" onClick={onOpenActivities} type="button">
              <Activity size={16} />
              Ver todas
            </button>
          </div>
          {model.activeActivities.length ? (
            <div className="compact-list">
              {model.activeActivities.slice(0, 5).map((activity) => (
                <ActivityRow activity={activity} key={activity.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Crear primera actividad"
              icon={Activity}
              text="Cuando anadas actividades pendientes, en curso o pausadas apareceran aqui."
              title="Sin actividades activas"
            />
          )}
        </article>

        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">DASH-04</p>
              <h3>Pendientes proximos</h3>
            </div>
            <span className="small-badge amber">{model.upcomingTasks.length} abiertos</span>
          </div>
          {model.upcomingTasks.length ? (
            <div className="compact-list">
              {model.upcomingTasks.slice(0, 5).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Anadir pendiente"
              icon={AlertCircle}
              text="Los pendientes abiertos ordenados por prioridad y fecha limite apareceran aqui."
              title="Sin pendientes abiertos"
            />
          )}
        </article>
      </section>

      <section className="content-grid">
        <article className="glass-panel profiles-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">DASH-05</p>
              <h3>Horas por perfil</h3>
            </div>
            <span className="small-badge green">{formatHours(model.totalMinutes)} totales</span>
          </div>
          <div className="hours-bars">
            {model.profileSummaries.map((profile) => (
              <div className="hours-row" key={profile.id} style={{ "--profile-color": profile.color }}>
                <div>
                  <strong>{profile.name}</strong>
                  <span>{formatHours(profile.totalMinutes)}</span>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${profile.hoursPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">DASH-03</p>
              <h3>Ultimos cambios</h3>
            </div>
            <History size={18} />
          </div>
          {model.recentChanges.length ? (
            <div className="timeline-list">
              {model.recentChanges.map((change) => (
                <ChangeRow change={change} key={change.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Editar un perfil"
              icon={History}
              text="Las actualizaciones guardadas en change_history apareceran ordenadas aqui."
              title="Sin cambios recientes"
            />
          )}
        </article>
      </section>

      <section className="glass-panel backlog-panel">
        <div className="section-heading">
          <div>
            <p className="chrome-label">DASH-07</p>
            <h3>Filtros rapidos de actividad</h3>
          </div>
          <Filter size={18} />
        </div>
        <div className="filter-row">
          {statusFilters.map((filter) => (
            <button
              className="filter-chip"
              key={filter.key}
              onClick={() => {
                setStatusFilter(filter.key);
                onOpenActivities();
              }}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function ProfilesView({ data, model, onUpdateProfile, profiles, selectedProfile, setSelectedProfileId }) {
  if (!selectedProfile) {
    return (
      <EmptyPanel
        icon={UserRound}
        title="No hay perfiles"
        text="Ejecuta las migraciones para crear Perfil A y Perfil B."
      />
    );
  }

  const selectedSummary = model.profileSummaries.find((profile) => profile.id === selectedProfile.id);
  const linkedActivities = data.activities.filter((activity) =>
    getActivityProfileIds(activity).includes(selectedProfile.id),
  );
  const linkedTasks = data.pendingTasks.filter((task) => task.profile_id === selectedProfile.id);
  const linkedSchedule = data.scheduleEntries.filter((entry) => entry.profile_id === selectedProfile.id);
  const linkedNotes = data.notes.filter((note) => note.profile_id === selectedProfile.id);
  const linkedTopics = data.topics.filter((topic) => topic.profile_id === selectedProfile.id);
  const linkedTools = data.tools.filter((tool) => tool.profile_id === selectedProfile.id);
  const sharedActivities = linkedActivities.filter((activity) => getActivityProfileIds(activity).length > 1);

  return (
    <>
      <section className="profile-tabs">
        {profiles.map((profile) => (
          <button
            className={profile.id === selectedProfile.id ? "profile-tab is-selected" : "profile-tab"}
            key={profile.id}
            onClick={() => setSelectedProfileId(profile.id)}
            style={{ "--profile-color": profile.color }}
            type="button"
          >
            <span className="profile-dot" />
            {profile.name}
          </button>
        ))}
      </section>

      <section className="content-grid">
        <article className="glass-panel profile-detail-panel">
          <div className="profile-detail-head" style={{ "--profile-color": selectedProfile.color }}>
            <div className="profile-avatar large">{selectedProfile.name.replace("Perfil ", "")}</div>
            <div>
              <p className="chrome-label">{selectedProfile.visible_role || "Perfil operativo"}</p>
              <h3>{selectedProfile.name}</h3>
              <p>{selectedProfile.description || "Sin descripcion todavia."}</p>
            </div>
          </div>
          <div className="metrics-row">
            <Metric label="Horas acumuladas" value={formatHours(selectedSummary?.totalMinutes ?? 0)} icon={Clock3} />
            <Metric label="Actividades" value={linkedActivities.length} icon={Activity} />
            <Metric label="Compartidas" value={sharedActivities.length} icon={GitBranch} />
          </div>
        </article>

        <ProfileEditor profile={selectedProfile} onUpdateProfile={onUpdateProfile} />
      </section>

      <section className="content-grid">
        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">PROF-04 / PROF-05</p>
              <h3>Actividades vinculadas</h3>
            </div>
            <span className="small-badge blue">{sharedActivities.length} compartidas</span>
          </div>
          {linkedActivities.length ? (
            <div className="compact-list">
              {linkedActivities.map((activity) => (
                <ActivityRow activity={activity} key={activity.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Asociar actividad"
              icon={Activity}
              text="Las actividades asignadas a este perfil apareceran aqui."
              title="Sin actividades vinculadas"
            />
          )}
        </article>

        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">PROF-06</p>
              <h3>Horarios resumidos</h3>
            </div>
            <span className="small-badge green">{formatHours(sumMinutes(linkedSchedule))}</span>
          </div>
          {linkedSchedule.length ? (
            <div className="compact-list">
              {linkedSchedule.slice(0, 6).map((entry) => (
                <ScheduleRow entry={entry} key={entry.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Anadir bloque horario"
              icon={CalendarRange}
              text="Los bloques horarios del perfil se resumiran por fecha y duracion."
              title="Sin horarios registrados"
            />
          )}
        </article>
      </section>

      <section className="content-grid">
        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">Pendientes</p>
              <h3>Trabajo abierto</h3>
            </div>
            <span className="small-badge amber">{linkedTasks.filter((task) => task.status === "open").length} abiertos</span>
          </div>
          {linkedTasks.length ? (
            <div className="compact-list">
              {linkedTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Crear pendiente"
              icon={AlertCircle}
              text="Los pendientes relacionados con este perfil apareceran aqui."
              title="Sin pendientes del perfil"
            />
          )}
        </article>

        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">Notas, temas y herramientas</p>
              <h3>Contexto operativo</h3>
            </div>
            <span className="small-badge">{linkedNotes.length + linkedTopics.length + linkedTools.length} items</span>
          </div>
          {linkedNotes.length || linkedTopics.length || linkedTools.length ? (
            <div className="context-grid">
              <ContextBucket title="Notas" items={linkedNotes.map((note) => note.content)} />
              <ContextBucket title="Temas" items={linkedTopics.map((topic) => topic.title)} />
              <ContextBucket title="Herramientas" items={linkedTools.map((tool) => tool.name)} />
            </div>
          ) : (
            <EmptyState
              action="Anadir contexto"
              icon={SlidersHorizontal}
              text="Notas, temas y herramientas relacionados con este perfil apareceran aqui."
              title="Sin contexto operativo"
            />
          )}
        </article>
      </section>
    </>
  );
}

function ActivitiesView({ activities, profiles, statusFilter, setStatusFilter }) {
  const visibleActivities = activities.filter(
    (activity) => statusFilter === "all" || activity.status === statusFilter,
  );

  return (
    <section className="glass-panel backlog-panel">
      <div className="section-heading">
        <div>
          <p className="chrome-label">DASH-07</p>
          <h3>Actividades</h3>
        </div>
        <div className="filter-row compact">
          {statusFilters.map((filter) => (
            <button
              className={statusFilter === filter.key ? "filter-chip is-selected" : "filter-chip"}
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {visibleActivities.length ? (
        <div className="activity-table">
          {visibleActivities.map((activity) => (
            <article className="activity-table-row" key={activity.id}>
              <div>
                <h4>{activity.title}</h4>
                <p>{activity.description || "Sin descripcion."}</p>
              </div>
              <div className="activity-profile-stack">
                {getActivityProfileIds(activity).map((profileId) => {
                  const profile = profiles.find((item) => item.id === profileId);
                  return profile ? (
                    <span className="profile-mini" key={profileId} style={{ "--profile-color": profile.color }}>
                      {profile.name}
                    </span>
                  ) : null;
                })}
              </div>
              <Badge tone={statusTone(activity.status)}>{statusLabel[activity.status] ?? activity.status}</Badge>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          action="Crear actividad"
          icon={Activity}
          text="No hay actividades para este filtro. Cambia el filtro o crea una nueva actividad."
          title="Sin actividades que mostrar"
        />
      )}
    </section>
  );
}

function SettingsView({ onUpdateProfile, profiles, role }) {
  return (
    <section className="glass-panel backlog-panel">
      <div className="section-heading">
        <div>
          <p className="chrome-label">ADMIN-04</p>
          <h3>Configuracion de perfiles</h3>
        </div>
        <span className={role === "admin" ? "small-badge green" : "small-badge"}>
          {role === "admin" ? "Admin activo" : "Edicion basica"}
        </span>
      </div>
      <div className="settings-grid">
        {profiles.map((profile) => (
          <ProfileEditor key={profile.id} profile={profile} onUpdateProfile={onUpdateProfile} compact />
        ))}
      </div>
    </section>
  );
}

function ProfileEditor({ compact = false, onUpdateProfile, profile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(toProfileForm(profile));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(toProfileForm(profile));
  }, [profile]);

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    if (!form.name.trim()) {
      setMessage("El nombre del perfil es obligatorio.");
      return;
    }

    setIsSaving(true);
    const result = await onUpdateProfile(profile.id, form);
    setIsSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Perfil actualizado.");
    setIsEditing(false);
  }

  return (
    <article className={compact ? "glass-panel editor-panel compact-editor" : "glass-panel editor-panel"}>
      <div className="section-heading">
        <div>
          <p className="chrome-label">PROF-02</p>
          <h3>{compact ? profile.name : "Editar perfil"}</h3>
        </div>
        <button className="icon-button" onClick={() => setIsEditing((current) => !current)} type="button">
          {isEditing ? <X size={16} /> : <Pencil size={16} />}
        </button>
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={handleSave}>
          <label>
            Nombre
            <input value={form.name} onChange={(event) => setFormField(setForm, "name", event.target.value)} />
          </label>
          <label>
            Rol visible
            <input
              value={form.visible_role}
              onChange={(event) => setFormField(setForm, "visible_role", event.target.value)}
              placeholder="Ej. Coordinacion"
            />
          </label>
          <label>
            Descripcion
            <input
              value={form.description}
              onChange={(event) => setFormField(setForm, "description", event.target.value)}
              placeholder="Descripcion del perfil"
            />
          </label>
          <label>
            Color
            <input
              className="color-input"
              value={form.color}
              onChange={(event) => setFormField(setForm, "color", event.target.value)}
              type="color"
            />
          </label>
          {message && <p className={message.includes("actualizado") ? "form-message is-success" : "form-message is-error"}>{message}</p>}
          <button className="primary-button" disabled={isSaving} type="submit">
            <Save size={16} />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      ) : (
        <div className="editor-readonly" style={{ "--profile-color": profile.color }}>
          <span className="profile-dot" />
          <strong>{profile.visible_role || "Perfil operativo"}</strong>
          <p>{profile.description || "Sin descripcion todavia."}</p>
          {message && <p className="form-message is-success">{message}</p>}
        </div>
      )}
    </article>
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

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  return <span className={`small-badge ${tone}`}>{children}</span>;
}

function ActivityRow({ activity }) {
  const sharedCount = getActivityProfileIds(activity).length;

  return (
    <article className="compact-row">
      <div>
        <h4>{activity.title}</h4>
        <p>{activity.description || "Sin descripcion."}</p>
      </div>
      <div className="row-meta">
        {sharedCount > 1 && <span className="small-badge cyan">Compartida</span>}
        <Badge tone={statusTone(activity.status)}>{statusLabel[activity.status] ?? activity.status}</Badge>
      </div>
    </article>
  );
}

function TaskRow({ task }) {
  return (
    <article className="compact-row">
      <div>
        <h4>{task.title}</h4>
        <p>{task.due_date ? `Fecha limite: ${formatDate(task.due_date)}` : "Sin fecha limite"}</p>
      </div>
      <div className="row-meta">
        <span className={`small-badge ${priorityTone(task.priority)}`}>{task.priority}</span>
        <Badge tone={task.status === "open" ? "amber" : "green"}>{statusLabel[task.status] ?? task.status}</Badge>
      </div>
    </article>
  );
}

function ScheduleRow({ entry }) {
  return (
    <article className="compact-row">
      <div>
        <h4>{formatDate(entry.work_date)}</h4>
        <p>
          {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
        </p>
      </div>
      <span className="small-badge green">{formatHours(entry.total_minutes)}</span>
    </article>
  );
}

function ChangeRow({ change }) {
  return (
    <article className="change-row">
      <span />
      <div>
        <h4>{change.summary || `${change.entity_type} ${change.change_type}`}</h4>
        <p>
          {change.entity_type} · {shortUserId(change.changed_by)} · {formatDate(change.changed_at)}
        </p>
      </div>
    </article>
  );
}

function ContextBucket({ items, title }) {
  return (
    <div className="context-bucket">
      <strong>{title}</strong>
      {items.length ? (
        items.slice(0, 4).map((item) => <span key={`${title}-${item}`}>{item}</span>)
      ) : (
        <p>Sin datos</p>
      )}
    </div>
  );
}

function EmptyPanel({ icon: Icon, text, title }) {
  return (
    <section className="glass-panel backlog-panel">
      <EmptyState icon={Icon} text={text} title={title} />
    </section>
  );
}

function EmptyState({ action, icon: Icon, text, title }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <h4>{title}</h4>
      <p>{text}</p>
      {action && <span>{action}</span>}
    </div>
  );
}

function buildDashboardModel(profiles, data) {
  const activeActivities = data.activities.filter((activity) =>
    ["pending", "in_progress", "paused"].includes(activity.status),
  );
  const upcomingTasks = [...data.pendingTasks]
    .filter((task) => task.status === "open")
    .sort((left, right) => {
      const priorityDiff = (priorityRank[left.priority] ?? 99) - (priorityRank[right.priority] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return String(left.due_date ?? "9999-12-31").localeCompare(String(right.due_date ?? "9999-12-31"));
    });
  const totalMinutes = sumMinutes(data.scheduleEntries);

  const profileSummaries = profiles.map((profile) => {
    const profileActivities = data.activities.filter((activity) =>
      getActivityProfileIds(activity).includes(profile.id),
    );
    const profileSchedule = data.scheduleEntries.filter((entry) => entry.profile_id === profile.id);
    const profileMinutes = sumMinutes(profileSchedule);
    const profileTasks = data.pendingTasks.filter((task) => task.profile_id === profile.id && task.status === "open");

    return {
      ...profile,
      activeActivities: profileActivities.filter((activity) =>
        ["pending", "in_progress", "paused"].includes(activity.status),
      ).length,
      hoursPercent: totalMinutes ? Math.max(8, Math.round((profileMinutes / totalMinutes) * 100)) : 0,
      openTasks: profileTasks.length,
      totalMinutes: profileMinutes,
    };
  });

  return {
    activeActivities,
    profileSummaries,
    recentChanges: data.changes,
    totalMinutes,
    upcomingTasks,
  };
}

function getActivityProfileIds(activity) {
  return (activity.activity_profiles ?? [])
    .map((link) => link.profile_id)
    .filter(Boolean);
}

function sumMinutes(entries) {
  return entries.reduce((total, entry) => total + (Number(entry.total_minutes) || 0), 0);
}

function formatHours(minutes) {
  const numericMinutes = Number(minutes) || 0;
  const hours = numericMinutes / 60;
  if (hours === 0) return "0h";
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

function formatDate(dateValue) {
  if (!dateValue) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(dateValue));
}

function shortUserId(userId) {
  if (!userId) return "sin usuario";
  return `${userId.slice(0, 8)}...`;
}

function statusTone(status) {
  if (status === "completed") return "green";
  if (status === "paused") return "amber";
  if (status === "pending") return "rose";
  return "blue";
}

function priorityTone(priority) {
  if (priority === "urgent" || priority === "high") return "rose";
  if (priority === "medium") return "amber";
  return "green";
}

function toProfileForm(profile) {
  return {
    color: profile.color || "#007aff",
    description: profile.description || "",
    name: profile.name || "",
    visible_role: profile.visible_role || "",
  };
}

function setFormField(setForm, field, value) {
  setForm((current) => ({ ...current, [field]: value }));
}

function viewTitle(activeView, selectedProfile) {
  if (activeView === "profiles") return selectedProfile?.name ?? "Perfiles operativos";
  if (activeView === "activities") return "Actividades y filtros";
  if (activeView === "settings") return "Ajustes de perfiles";
  return "Resumen operativo";
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

function readableDatabaseError(message) {
  if (message.toLowerCase().includes("visible_role")) {
    return "Falta aplicar la migracion de Sprint 2.";
  }

  return "No se han podido guardar los cambios.";
}

export default App;
