export function validateWorkItemForm(kind, values) {
  if (!values.profileId && !values.activityId) {
    return "Asocia el item a un perfil o una actividad.";
  }

  if (kind === "note" && !(values.content ?? "").trim()) {
    return "La nota no puede estar vacia.";
  }

  if (kind === "topic" && !(values.title ?? "").trim()) {
    return "El tema necesita titulo.";
  }

  if (kind === "tool" && !(values.name ?? "").trim()) {
    return "La herramienta necesita nombre.";
  }

  if (kind === "task" && !(values.title ?? "").trim()) {
    return "El pendiente necesita titulo.";
  }

  return "";
}

export function normalizeWorkItemForm(kind, values) {
  const base = {
    activity_id: values.activityId || null,
    profile_id: values.profileId || null,
  };

  if (kind === "note") {
    return {
      ...base,
      content: (values.content ?? "").trim(),
    };
  }

  if (kind === "topic") {
    return {
      ...base,
      description: (values.description ?? "").trim(),
      title: (values.title ?? "").trim(),
    };
  }

  if (kind === "tool") {
    return {
      ...base,
      description: (values.description ?? "").trim(),
      name: (values.name ?? "").trim(),
    };
  }

  return {
    ...base,
    due_date: values.dueDate || null,
    priority: values.priority || "medium",
    status: values.status || "open",
    title: (values.title ?? "").trim(),
  };
}
