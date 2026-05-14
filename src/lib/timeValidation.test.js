import { describe, expect, it } from "vitest";
import { calculateMinutes, normalizeScheduleForm, validateScheduleForm } from "./timeValidation";

describe("time validation", () => {
  it("calculates minutes between start and end time", () => {
    expect(calculateMinutes("09:15", "11:45")).toBe(150);
  });

  it("rejects invalid schedule blocks", () => {
    expect(
      validateScheduleForm({
        activityId: "",
        endTime: "10:00",
        profileId: "profile-a",
        startTime: "09:00",
        workDate: "2026-05-14",
      }),
    ).toBe("El bloque debe estar asociado a una actividad.");

    expect(
      validateScheduleForm({
        activityId: "activity-a",
        endTime: "09:00",
        profileId: "profile-a",
        startTime: "10:00",
        workDate: "2026-05-14",
      }),
    ).toBe("La hora de fin debe ser posterior a la hora de inicio.");
  });

  it("normalizes payloads for Supabase", () => {
    expect(
      normalizeScheduleForm({
        activityId: "activity-a",
        endTime: "12:00",
        notes: "  Revision ",
        profileId: "profile-a",
        startTime: "10:00",
        workDate: "2026-05-14",
      }),
    ).toEqual({
      activity_id: "activity-a",
      end_time: "12:00",
      notes: "Revision",
      profile_id: "profile-a",
      start_time: "10:00",
      work_date: "2026-05-14",
    });
  });
});
