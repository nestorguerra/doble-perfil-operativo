export const AUTOSAVE_DELAY_MS = 800;

export function autosaveStatusLabel(status) {
  if (status === "dirty") return "Cambios pendientes";
  if (status === "saving") return "Guardando...";
  if (status === "saved") return "Guardado";
  if (status === "error") return "Error al guardar";
  return "Sin cambios";
}

export function autosaveStatusTone(status) {
  if (status === "saving" || status === "dirty") return "amber";
  if (status === "saved") return "green";
  if (status === "error") return "rose";
  return "";
}
