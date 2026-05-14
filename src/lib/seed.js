export const profileSeed = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Perfil A",
    description: "Primer perfil operativo conectado al mapa de actividad.",
    color: "#007aff",
    display_order: 1,
    is_active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Perfil B",
    description: "Segundo perfil operativo con horarios, notas y pendientes propios.",
    color: "#30d158",
    display_order: 2,
    is_active: true,
  },
];

export const technicalItems = [
  {
    code: "DATA-01",
    title: "Usuarios y Auth",
    status: "Base preparada",
    detail: "Supabase Auth + tabla user_profiles para nombre visible, rol y preferencias.",
  },
  {
    code: "DATA-02",
    title: "Perfiles",
    status: "SQL + seed",
    detail: "Dos perfiles iniciales con color, orden y estado activo.",
  },
  {
    code: "DATA-03",
    title: "Actividades",
    status: "Modelo listo",
    detail: "Actividades vinculables a uno o ambos perfiles mediante activity_profiles.",
  },
  {
    code: "DATA-04",
    title: "Horarios",
    status: "Modelo listo",
    detail: "Bloques por actividad, perfil, fecha, hora de inicio y hora de fin.",
  },
  {
    code: "DATA-05",
    title: "Notas",
    status: "Modelo listo",
    detail: "Notas vinculadas a perfil, actividad o ambas entidades.",
  },
  {
    code: "DATA-06",
    title: "Pendientes",
    status: "Modelo listo",
    detail: "Pendientes con estado, prioridad, fecha objetivo y relaciones flexibles.",
  },
  {
    code: "DATA-07",
    title: "Herramientas",
    status: "Modelo listo",
    detail: "Registro de herramientas por perfil, actividad o ambas.",
  },
  {
    code: "DATA-08",
    title: "Temas",
    status: "Modelo listo",
    detail: "Temas trabajados consultables desde perfil y actividad.",
  },
  {
    code: "DATA-09",
    title: "Historial",
    status: "Auditoria base",
    detail: "Triggers de cambios para entidades clave con resumen y datos JSON.",
  },
  {
    code: "DATA-10",
    title: "Indices",
    status: "Incluidos",
    detail: "Indices para activity_id, profile_id, date, created_by y updated_at.",
  },
  {
    code: "DATA-11",
    title: "Relaciones",
    status: "Constraints",
    detail: "Foreign keys, defaults y checks para estados y prioridades.",
  },
  {
    code: "UI-01",
    title: "Sistema visual",
    status: "Base creada",
    detail: "Tokens CSS, paneles glass, botones, inputs, badges, tabs y estados.",
  },
];

export const sampleActivity = {
  title: "Mapa operativo inicial",
  description:
    "Actividad semilla para validar la relacion entre perfiles, horarios, notas y cambios.",
  status: "in_progress",
};
