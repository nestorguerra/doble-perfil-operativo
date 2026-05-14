import {
  Activity,
  AlertCircle,
  CalendarRange,
  CheckCircle2,
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
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { normalizeActivityForm, validateActivityForm } from "./lib/activityValidation";
import {
  normalizeEmail,
  validateLoginForm,
  validateRegistrationForm,
} from "./lib/authValidation";
import { hasSupabaseConfig, isRegistrationEnabled, supabase } from "./lib/supabase";
import { calculateMinutes, normalizeScheduleForm, validateScheduleForm } from "./lib/timeValidation";
import { normalizeWorkItemForm, validateWorkItemForm } from "./lib/workItemValidation";
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
          .neq("status", "archived")
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("schedule_entries")
          .select("id,activity_id,profile_id,work_date,start_time,end_time,total_minutes,notes")
          .order("work_date", { ascending: false })
          .limit(200),
        supabase
          .from("pending_tasks")
          .select("id,title,status,priority,due_date,profile_id,activity_id,created_by,updated_by,created_at,updated_at")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(50),
        supabase
          .from("notes")
          .select("id,profile_id,activity_id,content,created_by,updated_by,created_at,updated_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("topics")
          .select("id,profile_id,activity_id,title,description,created_by,updated_by,created_at,updated_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("tools")
          .select("id,profile_id,activity_id,name,description,created_by,updated_by,created_at,updated_at")
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
        setSyncState("Supabase conectado, falta aplicar migraciones pendientes");
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

  async function handleCreateActivity(values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateActivityForm(values);
    if (validationError) return { error: validationError };

    const normalized = normalizeActivityForm(values);
    const { data: createdActivity, error: activityError } = await supabase
      .from("activities")
      .insert({
        description: normalized.description,
        status: normalized.status,
        title: normalized.title,
      })
      .select("id,title,description,status,updated_at,created_at")
      .single();

    if (activityError) return { error: readableDatabaseError(activityError.message) };

    const links = normalized.profileIds.map((profileId) => ({
      activity_id: createdActivity.id,
      profile_id: profileId,
    }));
    const { error: linkError } = await supabase.from("activity_profiles").insert(links);

    if (linkError) return { error: readableDatabaseError(linkError.message) };

    const hydratedActivity = {
      ...createdActivity,
      activity_profiles: links.map((link) => ({ profile_id: link.profile_id })),
    };

    setOperationalData((current) => ({
      ...current,
      activities: [hydratedActivity, ...current.activities],
    }));

    return { data: hydratedActivity };
  }

  async function handleUpdateActivity(activityId, values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateActivityForm(values);
    if (validationError) return { error: validationError };

    const normalized = normalizeActivityForm(values);
    const { data: updatedActivity, error: activityError } = await supabase
      .from("activities")
      .update({
        description: normalized.description,
        status: normalized.status,
        title: normalized.title,
      })
      .eq("id", activityId)
      .select("id,title,description,status,updated_at,created_at")
      .single();

    if (activityError) return { error: readableDatabaseError(activityError.message) };

    const { error: deleteLinksError } = await supabase
      .from("activity_profiles")
      .delete()
      .eq("activity_id", activityId);

    if (deleteLinksError) return { error: readableDatabaseError(deleteLinksError.message) };

    const links = normalized.profileIds.map((profileId) => ({
      activity_id: activityId,
      profile_id: profileId,
    }));
    const { error: insertLinksError } = await supabase.from("activity_profiles").insert(links);

    if (insertLinksError) return { error: readableDatabaseError(insertLinksError.message) };

    const hydratedActivity = {
      ...updatedActivity,
      activity_profiles: links.map((link) => ({ profile_id: link.profile_id })),
    };

    setOperationalData((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === activityId ? hydratedActivity : activity,
      ),
    }));

    return { data: hydratedActivity };
  }

  async function handleArchiveActivity(activityId) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const { error } = await supabase
      .from("activities")
      .update({ status: "archived" })
      .eq("id", activityId);

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      activities: current.activities.filter((activity) => activity.id !== activityId),
    }));

    return { data: true };
  }

  async function handleCreateScheduleEntry(values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateScheduleForm(values);
    if (validationError) return { error: validationError };

    const payload = normalizeScheduleForm(values);
    const { data, error } = await supabase
      .from("schedule_entries")
      .insert(payload)
      .select("id,activity_id,profile_id,work_date,start_time,end_time,total_minutes,notes")
      .single();

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      scheduleEntries: [data, ...current.scheduleEntries],
    }));

    return { data };
  }

  async function handleUpdateScheduleEntry(entryId, values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateScheduleForm(values);
    if (validationError) return { error: validationError };

    const payload = normalizeScheduleForm(values);
    const { data, error } = await supabase
      .from("schedule_entries")
      .update(payload)
      .eq("id", entryId)
      .select("id,activity_id,profile_id,work_date,start_time,end_time,total_minutes,notes")
      .single();

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      scheduleEntries: current.scheduleEntries.map((entry) => (entry.id === entryId ? data : entry)),
    }));

    return { data };
  }

  async function handleDeleteScheduleEntry(entryId) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const { error } = await supabase.from("schedule_entries").delete().eq("id", entryId);

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      scheduleEntries: current.scheduleEntries.filter((entry) => entry.id !== entryId),
    }));

    return { data: true };
  }

  async function handleCreateWorkItem(kind, values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateWorkItemForm(kind, values);
    if (validationError) return { error: validationError };

    const table = workItemTable(kind);
    const payload = normalizeWorkItemForm(kind, values);
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select(workItemSelect(kind))
      .single();

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      [workItemStateKey(kind)]: [data, ...current[workItemStateKey(kind)]],
    }));

    return { data };
  }

  async function handleUpdateWorkItem(kind, itemId, values) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const validationError = validateWorkItemForm(kind, values);
    if (validationError) return { error: validationError };

    const table = workItemTable(kind);
    const payload = normalizeWorkItemForm(kind, values);
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", itemId)
      .select(workItemSelect(kind))
      .single();

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      [workItemStateKey(kind)]: current[workItemStateKey(kind)].map((item) =>
        item.id === itemId ? data : item,
      ),
    }));

    return { data };
  }

  async function handleDeleteWorkItem(kind, itemId) {
    if (!supabase) {
      return { error: "Supabase no esta configurado." };
    }

    const { error } = await supabase.from(workItemTable(kind)).delete().eq("id", itemId);

    if (error) return { error: readableDatabaseError(error.message) };

    setOperationalData((current) => ({
      ...current,
      [workItemStateKey(kind)]: current[workItemStateKey(kind)].filter((item) => item.id !== itemId),
    }));

    return { data: true };
  }

  async function handleToggleTask(taskId, nextStatus) {
    const task = operationalData.pendingTasks.find((item) => item.id === taskId);
    if (!task) return { error: "No encuentro el pendiente." };

    return handleUpdateWorkItem("task", taskId, {
      activityId: task.activity_id || "",
      dueDate: task.due_date || "",
      priority: task.priority,
      profileId: task.profile_id || "",
      status: nextStatus,
      title: task.title,
    });
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
      onArchiveActivity={handleArchiveActivity}
      onCreateActivity={handleCreateActivity}
      onCreateScheduleEntry={handleCreateScheduleEntry}
      onDeleteScheduleEntry={handleDeleteScheduleEntry}
      onDeleteWorkItem={handleDeleteWorkItem}
      onSignOut={handleSignOut}
      onToggleTask={handleToggleTask}
      onUpdateActivity={handleUpdateActivity}
      onUpdateProfile={handleUpdateProfile}
      onUpdateScheduleEntry={handleUpdateScheduleEntry}
      onCreateWorkItem={handleCreateWorkItem}
      onUpdateWorkItem={handleUpdateWorkItem}
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
            <p className="chrome-label">Sprint 5</p>
            <h1>Doble Perfil</h1>
          </div>
        </div>
        <div className="auth-copy">
          <p className="chrome-label">Trabajo diario completo</p>
          <h2>Acceso protegido antes de gestionar contexto</h2>
          <p>
            Notas, temas, pendientes, herramientas y horarios se cargan solo cuando Supabase
            confirma una sesion valida.
          </p>
        </div>
        <div className="auth-security-grid">
          <SecurityPoint icon={LockKeyhole} title="Auth real" body="Email y contrasena gestionados por Supabase." />
          <SecurityPoint icon={Layers3} title="Contexto diario" body="Notas, temas, pendientes y herramientas." />
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
  onArchiveActivity,
  onCreateActivity,
  onCreateScheduleEntry,
  onCreateWorkItem,
  onDeleteScheduleEntry,
  onDeleteWorkItem,
  onSignOut,
  onToggleTask,
  onUpdateActivity,
  onUpdateProfile,
  onUpdateScheduleEntry,
  onUpdateWorkItem,
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
            <p className="chrome-label">Sprint 5</p>
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
            <p className="chrome-label">Trabajo diario completo</p>
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
            onCreateWorkItem={onCreateWorkItem}
            onDeleteWorkItem={onDeleteWorkItem}
            onToggleTask={onToggleTask}
            onUpdateWorkItem={onUpdateWorkItem}
            onUpdateProfile={onUpdateProfile}
            profiles={profiles}
            selectedProfile={selectedProfile}
            setSelectedProfileId={setSelectedProfileId}
          />
        )}

        {activeView === "activities" && (
          <ActivitiesView
            data={operationalData}
            onArchiveActivity={onArchiveActivity}
            onCreateActivity={onCreateActivity}
            onCreateScheduleEntry={onCreateScheduleEntry}
            onCreateWorkItem={onCreateWorkItem}
            onDeleteScheduleEntry={onDeleteScheduleEntry}
            onDeleteWorkItem={onDeleteWorkItem}
            onUpdateActivity={onUpdateActivity}
            onUpdateScheduleEntry={onUpdateScheduleEntry}
            onToggleTask={onToggleTask}
            onUpdateWorkItem={onUpdateWorkItem}
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

      <section className="content-grid">
        <article className="glass-panel activity-panel">
          <div className="section-heading">
            <div>
              <p className="chrome-label">NOTE-05</p>
              <h3>Notas recientes</h3>
            </div>
            <span className="small-badge blue">{model.recentNotes.length} notas</span>
          </div>
          {model.recentNotes.length ? (
            <div className="compact-list">
              {model.recentNotes.slice(0, 5).map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <EmptyState
              action="Anadir nota"
              icon={History}
              text="Las notas creadas en perfiles o actividades apareceran aqui ordenadas por fecha."
              title="Sin notas recientes"
            />
          )}
        </article>

        <article className="glass-panel backlog-panel">
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
        </article>
      </section>
    </>
  );
}

function ProfilesView({
  data,
  model,
  onCreateWorkItem,
  onDeleteWorkItem,
  onToggleTask,
  onUpdateProfile,
  onUpdateWorkItem,
  profiles,
  selectedProfile,
  setSelectedProfileId,
}) {
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
  const linkedSchedule = data.scheduleEntries.filter((entry) => entry.profile_id === selectedProfile.id);
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

      <WorkContextPanel
        data={data}
        onCreateWorkItem={onCreateWorkItem}
        onDeleteWorkItem={onDeleteWorkItem}
        onToggleTask={onToggleTask}
        onUpdateWorkItem={onUpdateWorkItem}
        target={{ profileId: selectedProfile.id }}
        title="Trabajo diario del perfil"
      />
    </>
  );
}

function ActivitiesView({
  data,
  onArchiveActivity,
  onCreateActivity,
  onCreateScheduleEntry,
  onCreateWorkItem,
  onDeleteScheduleEntry,
  onDeleteWorkItem,
  onUpdateActivity,
  onUpdateScheduleEntry,
  onToggleTask,
  onUpdateWorkItem,
  profiles,
  statusFilter,
  setStatusFilter,
}) {
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const activities = data.activities;
  const visibleActivities = activities.filter(
    (activity) => statusFilter === "all" || activity.status === statusFilter,
  );
  const selectedActivity =
    activities.find((activity) => activity.id === selectedActivityId) ?? visibleActivities[0] ?? activities[0];

  useEffect(() => {
    if (!selectedActivityId && selectedActivity?.id) {
      setSelectedActivityId(selectedActivity.id);
    }
  }, [selectedActivity?.id, selectedActivityId]);

  return (
    <>
      <section className="glass-panel backlog-panel">
        <div className="section-heading">
          <div>
            <p className="chrome-label">ACT-01 / ACT-03</p>
            <h3>Actividades</h3>
          </div>
          <div className="section-actions">
            <button className="ghost-button" onClick={() => setIsCreating((current) => !current)} type="button">
              {isCreating ? <X size={16} /> : <Activity size={16} />}
              {isCreating ? "Cerrar" : "Nueva actividad"}
            </button>
          </div>
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

        {isCreating && (
          <ActivityForm
            onCancel={() => setIsCreating(false)}
            onSubmit={async (values) => {
              const result = await onCreateActivity(values);
              if (!result.error) {
                setIsCreating(false);
                setSelectedActivityId(result.data.id);
              }
              return result;
            }}
            profiles={profiles}
          />
        )}

        {visibleActivities.length ? (
          <div className="activity-table">
            {visibleActivities.map((activity) => (
              <button
                className={activity.id === selectedActivity?.id ? "activity-table-row is-selected" : "activity-table-row"}
                key={activity.id}
                onClick={() => setSelectedActivityId(activity.id)}
                type="button"
              >
                <div>
                  <h4>{activity.title}</h4>
                  <p>{activity.description || "Sin descripcion."}</p>
                </div>
                <div className="activity-profile-stack">
                  {renderActivityProfiles(activity, profiles)}
                </div>
                <Badge tone={statusTone(activity.status)}>{statusLabel[activity.status] ?? activity.status}</Badge>
              </button>
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

      {selectedActivity ? (
        <ActivityDetail
          activity={selectedActivity}
          data={data}
          onArchiveActivity={onArchiveActivity}
          onCreateScheduleEntry={onCreateScheduleEntry}
          onCreateWorkItem={onCreateWorkItem}
          onDeleteScheduleEntry={onDeleteScheduleEntry}
          onDeleteWorkItem={onDeleteWorkItem}
          onUpdateActivity={onUpdateActivity}
          onUpdateScheduleEntry={onUpdateScheduleEntry}
          onToggleTask={onToggleTask}
          onUpdateWorkItem={onUpdateWorkItem}
          profiles={profiles}
          setSelectedActivityId={setSelectedActivityId}
        />
      ) : (
        <EmptyPanel
          icon={Activity}
          text="Crea una actividad para ver su detalle operativo."
          title="Sin detalle de actividad"
        />
      )}
    </>
  );
}

function ActivityDetail({
  activity,
  data,
  onArchiveActivity,
  onCreateScheduleEntry,
  onCreateWorkItem,
  onDeleteScheduleEntry,
  onDeleteWorkItem,
  onUpdateActivity,
  onUpdateScheduleEntry,
  onToggleTask,
  onUpdateWorkItem,
  profiles,
  setSelectedActivityId,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeProfileFilter, setTimeProfileFilter] = useState("all");
  const profileIds = getActivityProfileIds(activity);
  const schedules = data.scheduleEntries.filter((entry) => entry.activity_id === activity.id);
  const visibleSchedules = schedules.filter(
    (entry) => timeProfileFilter === "all" || entry.profile_id === timeProfileFilter,
  );
  const changes = data.changes.filter((change) => change.entity_id === activity.id).slice(0, 6);

  return (
    <section className="glass-panel activity-detail-panel">
      <div className="activity-detail-head">
        <div>
          <p className="chrome-label">ACT-04</p>
          <h3>{activity.title}</h3>
          <p>{activity.description || "Sin descripcion."}</p>
        </div>
        <div className="detail-actions">
          <Badge tone={statusTone(activity.status)}>{statusLabel[activity.status] ?? activity.status}</Badge>
          <button className="ghost-button" onClick={() => setIsEditing((current) => !current)} type="button">
            {isEditing ? <X size={16} /> : <Pencil size={16} />}
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          <ArchiveActivityButton
            activityId={activity.id}
            onArchiveActivity={async (activityId) => {
              const result = await onArchiveActivity(activityId);
              if (!result.error) setSelectedActivityId("");
              return result;
            }}
          />
        </div>
      </div>

      <div className="activity-profile-stack detail-stack">
        {profileIds.length ? renderActivityProfiles(activity, profiles) : <span className="small-badge">Sin perfiles</span>}
      </div>

      {isEditing && (
        <ActivityForm
          activity={activity}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            const result = await onUpdateActivity(activity.id, values);
            if (!result.error) setIsEditing(false);
            return result;
          }}
          profiles={profiles}
        />
      )}

      <ActivityTimeSection
        activity={activity}
        onCreateScheduleEntry={onCreateScheduleEntry}
        onDeleteScheduleEntry={onDeleteScheduleEntry}
        onUpdateScheduleEntry={onUpdateScheduleEntry}
        profileFilter={timeProfileFilter}
        profiles={profiles.filter((profile) => profileIds.includes(profile.id))}
        schedules={visibleSchedules}
        setProfileFilter={setTimeProfileFilter}
      />

      <div className="detail-grid">
        <DetailBucket
          emptyText="No hay horarios vinculados a esta actividad."
          icon={CalendarRange}
          items={visibleSchedules.map((entry) => `${formatDate(entry.work_date)} · ${entry.start_time?.slice(0, 5)}-${entry.end_time?.slice(0, 5)} · ${formatHours(entry.total_minutes)}`)}
          title="Horarios"
        />
        <DetailBucket
          emptyText="No hay cambios registrados para esta actividad."
          icon={History}
          items={changes.map((change) => `${change.summary} · ${formatDate(change.changed_at)}`)}
          title="Cambios"
        />
      </div>

      <WorkContextPanel
        data={data}
        onCreateWorkItem={onCreateWorkItem}
        onDeleteWorkItem={onDeleteWorkItem}
        onToggleTask={onToggleTask}
        onUpdateWorkItem={onUpdateWorkItem}
        target={{ activityId: activity.id, defaultProfileId: profileIds[0] || "" }}
        title="Contexto diario de la actividad"
      />
    </section>
  );
}

function ActivityForm({ activity, onCancel, onSubmit, profiles }) {
  const [form, setForm] = useState(() => toActivityForm(activity, profiles));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(toActivityForm(activity, profiles));
  }, [activity, profiles]);

  function toggleProfile(profileId) {
    setForm((current) => {
      const nextProfileIds = current.profileIds.includes(profileId)
        ? current.profileIds.filter((id) => id !== profileId)
        : [...current.profileIds, profileId];

      return { ...current, profileIds: nextProfileIds };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const validationError = validateActivityForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    const result = await onSubmit(form);
    setIsSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Actividad guardada.");
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Titulo
          <input
            onChange={(event) => setFormField(setForm, "title", event.target.value)}
            placeholder="Nuevo bloque de trabajo"
            value={form.title}
          />
        </label>
        <label>
          Estado
          <select
            onChange={(event) => setFormField(setForm, "status", event.target.value)}
            value={form.status}
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En curso</option>
            <option value="paused">Pausada</option>
            <option value="completed">Completada</option>
          </select>
        </label>
      </div>
      <label>
        Descripcion
        <textarea
          onChange={(event) => setFormField(setForm, "description", event.target.value)}
          placeholder="Describe de que trata esta actividad"
          rows="3"
          value={form.description}
        />
      </label>
      <div className="profile-check-grid">
        {profiles.map((profile) => (
          <label className="profile-check" key={profile.id} style={{ "--profile-color": profile.color }}>
            <input
              checked={form.profileIds.includes(profile.id)}
              onChange={() => toggleProfile(profile.id)}
              type="checkbox"
            />
            <span className="profile-dot" />
            {profile.name}
          </label>
        ))}
      </div>
      {message && (
        <p className={message.includes("guardada") ? "form-message is-success" : "form-message is-error"}>
          {message}
        </p>
      )}
      <div className="form-actions">
        <button className="primary-button" disabled={isSaving} type="submit">
          <Save size={16} />
          {isSaving ? "Guardando..." : activity ? "Guardar actividad" : "Crear actividad"}
        </button>
        <button className="ghost-button" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ActivityTimeSection({
  activity,
  onCreateScheduleEntry,
  onDeleteScheduleEntry,
  onUpdateScheduleEntry,
  profileFilter,
  profiles,
  schedules,
  setProfileFilter,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const totalMinutes = sumMinutes(schedules);
  const weekDays = buildWeekDays(schedules);
  const heatmapDays = buildHeatmapDays(schedules, profiles);

  useEffect(() => {
    if (profileFilter !== "all" && !profiles.some((profile) => profile.id === profileFilter)) {
      setProfileFilter("all");
    }
  }, [profileFilter, profiles, setProfileFilter]);

  return (
    <section className="time-section">
      <div className="section-heading">
        <div>
          <p className="chrome-label">TIME-01 / MAP-01</p>
          <h3>Horarios y mapa visual</h3>
        </div>
        <div className="section-actions">
          <span className="small-badge green">{formatHours(totalMinutes)} registradas</span>
          <button className="ghost-button" onClick={() => setIsAdding((current) => !current)} type="button">
            {isAdding ? <X size={16} /> : <Clock3 size={16} />}
            {isAdding ? "Cerrar" : "Anadir bloque"}
          </button>
        </div>
      </div>

      <div className="filter-row">
        <button
          className={profileFilter === "all" ? "filter-chip is-selected" : "filter-chip"}
          onClick={() => setProfileFilter("all")}
          type="button"
        >
          Todos los perfiles
        </button>
        {profiles.map((profile) => (
          <button
            className={profileFilter === profile.id ? "filter-chip is-selected" : "filter-chip"}
            key={profile.id}
            onClick={() => setProfileFilter(profile.id)}
            style={{ "--profile-color": profile.color }}
            type="button"
          >
            <span className="profile-dot" />
            {profile.name}
          </button>
        ))}
      </div>

      {isAdding && (
        <ScheduleForm
          activityId={activity.id}
          onCancel={() => setIsAdding(false)}
          onSubmit={async (values) => {
            const result = await onCreateScheduleEntry(values);
            if (!result.error) setIsAdding(false);
            return result;
          }}
          profiles={profiles}
        />
      )}

      <div className="time-visual-grid">
        <article className="weekly-panel">
          <div className="section-heading compact-heading">
            <h4>Semana de trabajo</h4>
            <CalendarRange size={17} />
          </div>
          <div className="week-grid">
            {weekDays.map((day) => (
              <div className="week-day" key={day.key} title={day.tooltip}>
                <strong>{day.label}</strong>
                <span>{formatHours(day.minutes)}</span>
                <div className="week-block-stack">
                  {day.entries.slice(0, 3).map((entry) => (
                    <span
                      key={entry.id}
                      style={{ "--profile-color": profileColor(entry.profile_id, profiles) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="heatmap-panel">
          <div className="section-heading compact-heading">
            <h4>Heatmap por actividad</h4>
            <Map size={17} />
          </div>
          <div className="heatmap-grid">
            {heatmapDays.map((day) => (
              <div
                className={`heatmap-cell intensity-${day.intensity}`}
                key={day.key}
                style={{ "--profile-color": day.color }}
                title={day.tooltip}
              >
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {schedules.length ? (
        <div className="schedule-list">
          {schedules.map((entry) => (
            <ScheduleEntryEditor
              entry={entry}
              key={entry.id}
              onDeleteScheduleEntry={onDeleteScheduleEntry}
              onUpdateScheduleEntry={onUpdateScheduleEntry}
              profiles={profiles}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          action="Anadir bloque horario"
          icon={Clock3}
          text="Registra fecha, hora de inicio, fin y perfil para alimentar el mapa."
          title="Sin bloques horarios"
        />
      )}
    </section>
  );
}

function ScheduleForm({ activityId, entry, onCancel, onSubmit, profiles }) {
  const [form, setForm] = useState(() => toScheduleForm(activityId, entry, profiles));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const calculatedMinutes = calculateScheduleFormMinutes(form);

  useEffect(() => {
    setForm(toScheduleForm(activityId, entry, profiles));
  }, [activityId, entry, profiles]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const validationError = validateScheduleForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    const result = await onSubmit(form);
    setIsSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Bloque horario guardado.");
  }

  return (
    <form className="schedule-form" onSubmit={handleSubmit}>
      <div className="schedule-form-grid">
        <label>
          Fecha
          <input
            onChange={(event) => setFormField(setForm, "workDate", event.target.value)}
            type="date"
            value={form.workDate}
          />
        </label>
        <label>
          Inicio
          <input
            onChange={(event) => setFormField(setForm, "startTime", event.target.value)}
            type="time"
            value={form.startTime}
          />
        </label>
        <label>
          Fin
          <input
            onChange={(event) => setFormField(setForm, "endTime", event.target.value)}
            type="time"
            value={form.endTime}
          />
        </label>
        <label>
          Perfil
          <select
            onChange={(event) => setFormField(setForm, "profileId", event.target.value)}
            value={form.profileId}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Nota
        <input
          onChange={(event) => setFormField(setForm, "notes", event.target.value)}
          placeholder="Contexto opcional del bloque"
          value={form.notes}
        />
      </label>
      <div className="schedule-form-footer">
        <span className="small-badge green">{formatHours(Math.max(0, calculatedMinutes))}</span>
        {message && (
          <p className={message.includes("guardado") ? "form-message is-success" : "form-message is-error"}>
            {message}
          </p>
        )}
        <button className="primary-button" disabled={isSaving} type="submit">
          <Save size={16} />
          {isSaving ? "Guardando..." : entry ? "Guardar bloque" : "Anadir bloque"}
        </button>
        <button className="ghost-button" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ScheduleEntryEditor({ entry, onDeleteScheduleEntry, onUpdateScheduleEntry, profiles }) {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const profile = profiles.find((item) => item.id === entry.profile_id);

  async function handleDelete() {
    const result = await onDeleteScheduleEntry(entry.id);
    if (result.error) setMessage(result.error);
  }

  return (
    <article className="schedule-entry-row" style={{ "--profile-color": profile?.color ?? "#007aff" }}>
      {isEditing ? (
        <ScheduleForm
          activityId={entry.activity_id}
          entry={entry}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            const result = await onUpdateScheduleEntry(entry.id, values);
            if (!result.error) setIsEditing(false);
            return result;
          }}
          profiles={profiles}
        />
      ) : (
        <>
          <div>
            <h4>{formatDateLong(entry.work_date)}</h4>
            <p>
              {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)} · {profile?.name ?? "Perfil"}
            </p>
            {entry.notes && <p>{entry.notes}</p>}
          </div>
          <div className="row-meta">
            <span className="small-badge green">{formatHours(entry.total_minutes)}</span>
            <button className="icon-button" onClick={() => setIsEditing(true)} title="Editar bloque" type="button">
              <Pencil size={15} />
            </button>
            <button className="icon-button danger-icon" onClick={handleDelete} title="Eliminar bloque" type="button">
              <Trash2 size={15} />
            </button>
          </div>
          {message && <p className="form-message is-error">{message}</p>}
        </>
      )}
    </article>
  );
}

function ArchiveActivityButton({ activityId, onArchiveActivity }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleArchive() {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    const result = await onArchiveActivity(activityId);
    setIsDeleting(false);

    if (result.error) {
      setMessage(result.error);
      setIsConfirming(false);
    }
  }

  return (
    <div className="archive-action">
      <button className={isConfirming ? "danger-button is-confirming" : "danger-button"} onClick={handleArchive} type="button">
        <Trash2 size={16} />
        {isDeleting ? "Eliminando..." : isConfirming ? "Confirmar" : "Eliminar"}
      </button>
      {isConfirming && (
        <button className="ghost-button compact-button" onClick={() => setIsConfirming(false)} type="button">
          Cancelar
        </button>
      )}
      {message && <p className="form-message is-error">{message}</p>}
    </div>
  );
}

function DetailBucket({ emptyText, icon: Icon, items, title }) {
  return (
    <article className="detail-bucket">
      <div className="detail-bucket-head">
        <Icon size={17} />
        <strong>{title}</strong>
      </div>
      {items.length ? (
        items.slice(0, 6).map((item) => <span key={`${title}-${item}`}>{item}</span>)
      ) : (
        <p>{emptyText}</p>
      )}
    </article>
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

function NoteRow({ note }) {
  return (
    <article className="compact-row">
      <div>
        <h4>{truncateText(note.content, 56)}</h4>
        <p>
          {formatDate(note.updated_at || note.created_at)} · {shortUserId(note.updated_by || note.created_by)}
        </p>
      </div>
      <span className="small-badge blue">Nota</span>
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

function WorkContextPanel({
  data,
  onCreateWorkItem,
  onDeleteWorkItem,
  onToggleTask,
  onUpdateWorkItem,
  target,
  title,
}) {
  const itemsByKind = {
    note: filterWorkItems(data.notes, target),
    task: filterWorkItems(data.pendingTasks, target),
    tool: filterWorkItems(data.tools, target),
    topic: filterWorkItems(data.topics, target),
  };

  return (
    <section className="glass-panel work-context-panel">
      <div className="section-heading">
        <div>
          <p className="chrome-label">Sprint 5</p>
          <h3>{title}</h3>
        </div>
        <span className="small-badge green">
          {Object.values(itemsByKind).reduce((total, items) => total + items.length, 0)} items
        </span>
      </div>
      <div className="work-grid">
        <WorkItemColumn
          emptyText="Crea notas libres para capturar contexto."
          icon={History}
          items={itemsByKind.note}
          kind="note"
          onCreateWorkItem={onCreateWorkItem}
          onDeleteWorkItem={onDeleteWorkItem}
          onUpdateWorkItem={onUpdateWorkItem}
          target={target}
          title="Notas"
        />
        <WorkItemColumn
          emptyText="Registra temas trabajados y avances."
          icon={Layers3}
          items={itemsByKind.topic}
          kind="topic"
          onCreateWorkItem={onCreateWorkItem}
          onDeleteWorkItem={onDeleteWorkItem}
          onUpdateWorkItem={onUpdateWorkItem}
          target={target}
          title="Temas"
        />
        <WorkItemColumn
          emptyText="Anade pendientes con prioridad y fecha."
          icon={AlertCircle}
          items={itemsByKind.task}
          kind="task"
          onCreateWorkItem={onCreateWorkItem}
          onDeleteWorkItem={onDeleteWorkItem}
          onToggleTask={onToggleTask}
          onUpdateWorkItem={onUpdateWorkItem}
          target={target}
          title="Pendientes"
        />
        <WorkItemColumn
          emptyText="Documenta herramientas usadas."
          icon={SlidersHorizontal}
          items={itemsByKind.tool}
          kind="tool"
          onCreateWorkItem={onCreateWorkItem}
          onDeleteWorkItem={onDeleteWorkItem}
          onUpdateWorkItem={onUpdateWorkItem}
          target={target}
          title="Herramientas"
        />
      </div>
    </section>
  );
}

function WorkItemColumn({
  emptyText,
  icon: Icon,
  items,
  kind,
  onCreateWorkItem,
  onDeleteWorkItem,
  onToggleTask,
  onUpdateWorkItem,
  target,
  title,
}) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <article className="work-column">
      <div className="work-column-head">
        <div>
          <Icon size={17} />
          <strong>{title}</strong>
        </div>
        <button className="icon-button" onClick={() => setIsCreating((current) => !current)} type="button">
          {isCreating ? <X size={15} /> : <Pencil size={15} />}
        </button>
      </div>

      {isCreating && (
        <WorkItemForm
          kind={kind}
          onCancel={() => setIsCreating(false)}
          onSubmit={async (values) => {
            const result = await onCreateWorkItem(kind, values);
            if (!result.error) setIsCreating(false);
            return result;
          }}
          target={target}
        />
      )}

      {items.length ? (
        <div className="work-item-list">
          {items.map((item) => (
            <WorkItemRow
              item={item}
              key={item.id}
              kind={kind}
              onDeleteWorkItem={onDeleteWorkItem}
              onToggleTask={onToggleTask}
              onUpdateWorkItem={onUpdateWorkItem}
              target={target}
            />
          ))}
        </div>
      ) : (
        <EmptyState action="Nuevo item" icon={Icon} text={emptyText} title={`Sin ${title.toLowerCase()}`} />
      )}
    </article>
  );
}

function WorkItemRow({ item, kind, onDeleteWorkItem, onToggleTask, onUpdateWorkItem, target }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    const result = await onDeleteWorkItem(kind, item.id);
    if (result.error) {
      setMessage(result.error);
      setIsConfirmingDelete(false);
    }
  }

  async function handleToggleTask() {
    const result = await onToggleTask(item.id, item.status === "completed" ? "open" : "completed");
    if (result.error) setMessage(result.error);
  }

  return (
    <article className={kind === "task" && item.status === "completed" ? "work-item-row is-completed" : "work-item-row"}>
      {isEditing ? (
        <WorkItemForm
          item={item}
          kind={kind}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            const result = await onUpdateWorkItem(kind, item.id, values);
            if (!result.error) setIsEditing(false);
            return result;
          }}
          target={target}
        />
      ) : (
        <>
          <div>
            <h4>{workItemTitle(kind, item)}</h4>
            <p>{workItemDescription(kind, item)}</p>
            <small>
              {formatDate(item.updated_at || item.created_at)} · {shortUserId(item.updated_by || item.created_by)}
            </small>
          </div>
          <div className="work-item-actions">
            {kind === "task" && (
              <button className="icon-button" onClick={handleToggleTask} title="Completar pendiente" type="button">
                <CheckCircleIcon />
              </button>
            )}
            <button className="icon-button" onClick={() => setIsEditing(true)} title="Editar" type="button">
              <Pencil size={15} />
            </button>
            <button className="icon-button danger-icon" onClick={handleDelete} title="Eliminar" type="button">
              {isConfirmingDelete ? <CheckCircleIcon /> : <Trash2 size={15} />}
            </button>
          </div>
          {message && <p className="form-message is-error">{message}</p>}
        </>
      )}
    </article>
  );
}

function WorkItemForm({ item, kind, onCancel, onSubmit, target }) {
  const [form, setForm] = useState(() => toWorkItemForm(kind, item, target));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(toWorkItemForm(kind, item, target));
  }, [item, kind, target]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const validationError = validateWorkItemForm(kind, form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    const result = await onSubmit(form);
    setIsSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Guardado.");
  }

  return (
    <form className="work-item-form" onSubmit={handleSubmit}>
      {kind === "note" ? (
        <textarea
          onChange={(event) => setFormField(setForm, "content", event.target.value)}
          placeholder="Escribe una nota"
          rows="3"
          value={form.content}
        />
      ) : (
        <input
          onChange={(event) => setFormField(setForm, kind === "tool" ? "name" : "title", event.target.value)}
          placeholder={kind === "tool" ? "Nombre de herramienta" : kind === "task" ? "Titulo del pendiente" : "Tema trabajado"}
          value={kind === "tool" ? form.name : form.title}
        />
      )}

      {(kind === "topic" || kind === "tool") && (
        <input
          onChange={(event) => setFormField(setForm, "description", event.target.value)}
          placeholder="Descripcion opcional"
          value={form.description}
        />
      )}

      {kind === "task" && (
        <div className="work-task-grid">
          <select onChange={(event) => setFormField(setForm, "priority", event.target.value)} value={form.priority}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <input onChange={(event) => setFormField(setForm, "dueDate", event.target.value)} type="date" value={form.dueDate} />
        </div>
      )}

      {message && <p className={message === "Guardado." ? "form-message is-success" : "form-message is-error"}>{message}</p>}
      <div className="form-actions">
        <button className="primary-button" disabled={isSaving} type="submit">
          <Save size={16} />
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <button className="ghost-button" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CheckCircleIcon() {
  return <CheckCircle2 size={15} />;
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
    recentNotes: [...data.notes].sort((left, right) =>
      String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)),
    ),
    totalMinutes,
    upcomingTasks,
  };
}

function getActivityProfileIds(activity) {
  return (activity.activity_profiles ?? [])
    .map((link) => link.profile_id)
    .filter(Boolean);
}

function renderActivityProfiles(activity, profiles) {
  return getActivityProfileIds(activity).map((profileId) => {
    const profile = profiles.find((item) => item.id === profileId);
    return profile ? (
      <span className="profile-mini" key={profileId} style={{ "--profile-color": profile.color }}>
        {profile.name}
      </span>
    ) : null;
  });
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

function formatDateLong(dateValue) {
  if (!dateValue) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function shortUserId(userId) {
  if (!userId) return "sin usuario";
  return `${userId.slice(0, 8)}...`;
}

function toScheduleForm(activityId, entry, profiles) {
  return {
    activityId,
    endTime: entry?.end_time?.slice(0, 5) || "10:00",
    notes: entry?.notes || "",
    profileId: entry?.profile_id || profiles[0]?.id || "",
    startTime: entry?.start_time?.slice(0, 5) || "09:00",
    workDate: entry?.work_date || new Date().toISOString().slice(0, 10),
  };
}

function calculateScheduleFormMinutes(form) {
  return calculateMinutes(form.startTime, form.endTime);
}

function profileColor(profileId, profiles) {
  return profiles.find((profile) => profile.id === profileId)?.color ?? "#007aff";
}

function buildWeekDays(entries) {
  const today = new Date();
  const start = startOfWeek(today);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const dayEntries = entries.filter((entry) => entry.work_date === key);
    const minutes = sumMinutes(dayEntries);

    return {
      entries: dayEntries,
      key,
      label: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date),
      minutes,
      tooltip: buildDayTooltip(key, dayEntries),
    };
  });
}

function buildHeatmapDays(entries, profiles) {
  const today = new Date();
  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    const dayEntries = entries.filter((entry) => entry.work_date === key);
    const minutes = sumMinutes(dayEntries);
    const dominantProfileId = dominantProfile(dayEntries);

    return {
      color: dominantProfileId ? profileColor(dominantProfileId, profiles) : "rgba(67, 82, 106, 0.22)",
      intensity: heatmapIntensity(minutes),
      key,
      label: new Intl.DateTimeFormat("es-ES", { day: "2-digit" }).format(date),
      profileId: dominantProfileId,
      tooltip: buildDayTooltip(key, dayEntries),
    };
  });
}

function dominantProfile(entries) {
  const minutesByProfile = entries.reduce((acc, entry) => {
    acc[entry.profile_id] = (acc[entry.profile_id] ?? 0) + (Number(entry.total_minutes) || 0);
    return acc;
  }, {});

  return Object.entries(minutesByProfile).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "";
}

function heatmapIntensity(minutes) {
  if (!minutes) return 0;
  if (minutes < 60) return 1;
  if (minutes < 180) return 2;
  if (minutes < 360) return 3;
  return 4;
}

function buildDayTooltip(dateKey, entries) {
  if (!entries.length) return `${formatDateLong(dateKey)} · sin trabajo registrado`;

  const minutes = sumMinutes(entries);
  const profiles = [...new Set(entries.map((entry) => entry.profile_id))].length;
  return `${formatDateLong(dateKey)} · ${formatHours(minutes)} · ${profiles} perfil${profiles === 1 ? "" : "es"}`;
}

function startOfWeek(date) {
  const normalized = new Date(date);
  const day = normalized.getDay() || 7;
  normalized.setDate(normalized.getDate() - day + 1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
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

function workItemTable(kind) {
  return {
    note: "notes",
    task: "pending_tasks",
    tool: "tools",
    topic: "topics",
  }[kind];
}

function workItemStateKey(kind) {
  return {
    note: "notes",
    task: "pendingTasks",
    tool: "tools",
    topic: "topics",
  }[kind];
}

function workItemSelect(kind) {
  if (kind === "note") return "id,profile_id,activity_id,content,created_by,updated_by,created_at,updated_at";
  if (kind === "tool") return "id,profile_id,activity_id,name,description,created_by,updated_by,created_at,updated_at";
  if (kind === "topic") return "id,profile_id,activity_id,title,description,created_by,updated_by,created_at,updated_at";
  return "id,title,status,priority,due_date,profile_id,activity_id,created_by,updated_by,created_at,updated_at";
}

function filterWorkItems(items, target) {
  return items.filter((item) => {
    const matchesProfile = target.profileId ? item.profile_id === target.profileId : true;
    const matchesActivity = target.activityId ? item.activity_id === target.activityId : true;
    return matchesProfile && matchesActivity;
  });
}

function toWorkItemForm(kind, item, target) {
  const base = {
    activityId: item?.activity_id || target.activityId || "",
    profileId: item?.profile_id || target.profileId || target.defaultProfileId || "",
  };

  if (kind === "note") {
    return { ...base, content: item?.content || "" };
  }

  if (kind === "topic") {
    return { ...base, description: item?.description || "", title: item?.title || "" };
  }

  if (kind === "tool") {
    return { ...base, description: item?.description || "", name: item?.name || "" };
  }

  return {
    ...base,
    dueDate: item?.due_date || "",
    priority: item?.priority || "medium",
    status: item?.status || "open",
    title: item?.title || "",
  };
}

function workItemTitle(kind, item) {
  if (kind === "note") return truncateText(item.content, 48);
  if (kind === "tool") return item.name;
  return item.title;
}

function workItemDescription(kind, item) {
  if (kind === "note") return "Nota libre";
  if (kind === "topic") return item.description || "Sin descripcion";
  if (kind === "tool") return item.description || "Sin descripcion";

  const priority = `Prioridad ${item.priority || "medium"}`;
  const dueDate = item.due_date ? `Fecha limite: ${formatDate(item.due_date)}` : "Sin fecha limite";
  const status = statusLabel[item.status] ?? item.status;
  return `${priority} · ${dueDate} · ${status}`;
}

function truncateText(value, maxLength) {
  const text = value || "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function toProfileForm(profile) {
  return {
    color: profile.color || "#007aff",
    description: profile.description || "",
    name: profile.name || "",
    visible_role: profile.visible_role || "",
  };
}

function toActivityForm(activity, profiles) {
  return {
    description: activity?.description || "",
    profileIds: activity ? getActivityProfileIds(activity) : profiles.map((profile) => profile.id).slice(0, 1),
    status: activity?.status === "archived" ? "pending" : activity?.status || "pending",
    title: activity?.title || "",
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
    return "Falta aplicar las migraciones pendientes.";
  }

  return "No se han podido guardar los cambios.";
}

export default App;
