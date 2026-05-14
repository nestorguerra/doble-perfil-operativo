export const activityStatuses = ["pending", "in_progress", "paused", "completed"];

export function validateActivityForm({ title, profileIds }) {
  if (!title.trim()) {
    return "El titulo de la actividad es obligatorio.";
  }

  if (!profileIds.length) {
    return "Asocia al menos un perfil.";
  }

  return "";
}

export function normalizeActivityForm(values) {
  return {
    description: values.description.trim(),
    profileIds: [...new Set(values.profileIds)],
    status: activityStatuses.includes(values.status) ? values.status : "pending",
    title: values.title.trim(),
  };
}
