export function calculateMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

export function validateScheduleForm({ activityId, endTime, profileId, startTime, workDate }) {
  if (!activityId) {
    return "El bloque debe estar asociado a una actividad.";
  }

  if (!profileId) {
    return "Selecciona el perfil que trabajo.";
  }

  if (!workDate) {
    return "Selecciona una fecha.";
  }

  if (!startTime || !endTime) {
    return "Introduce hora de inicio y fin.";
  }

  if (calculateMinutes(startTime, endTime) <= 0) {
    return "La hora de fin debe ser posterior a la hora de inicio.";
  }

  return "";
}

export function normalizeScheduleForm(values) {
  return {
    activity_id: values.activityId,
    end_time: values.endTime,
    notes: values.notes.trim(),
    profile_id: values.profileId,
    start_time: values.startTime,
    work_date: values.workDate,
  };
}
