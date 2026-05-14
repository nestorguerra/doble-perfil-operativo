import { describe, expect, it } from "vitest";
import { normalizeWorkItemForm, validateWorkItemForm } from "./workItemValidation";

describe("work item validation", () => {
  it("requires a profile or activity association", () => {
    expect(validateWorkItemForm("note", { activityId: "", content: "Nota", profileId: "" })).toBe(
      "Asocia el item a un perfil o una actividad.",
    );
  });

  it("validates required fields by kind", () => {
    expect(validateWorkItemForm("note", { activityId: "a", content: " ", profileId: "" })).toBe(
      "La nota no puede estar vacia.",
    );
    expect(validateWorkItemForm("topic", { activityId: "a", profileId: "", title: " " })).toBe(
      "El tema necesita titulo.",
    );
    expect(validateWorkItemForm("tool", { activityId: "a", name: " ", profileId: "" })).toBe(
      "La herramienta necesita nombre.",
    );
    expect(validateWorkItemForm("task", { activityId: "a", profileId: "", title: " " })).toBe(
      "El pendiente necesita titulo.",
    );
  });

  it("normalizes pending tasks", () => {
    expect(
      normalizeWorkItemForm("task", {
        activityId: "activity-a",
        dueDate: "",
        priority: "high",
        profileId: "profile-a",
        status: "open",
        title: "  Revisar ",
      }),
    ).toEqual({
      activity_id: "activity-a",
      due_date: null,
      priority: "high",
      profile_id: "profile-a",
      status: "open",
      title: "Revisar",
    });
  });

  it("normalizes topic tags", () => {
    expect(
      normalizeWorkItemForm("topic", {
        activityId: "activity-a",
        description: "",
        profileId: "",
        tags: " estrategia, cliente,  ",
        title: "Tema",
      }),
    ).toEqual({
      activity_id: "activity-a",
      description: "",
      profile_id: null,
      tags: ["estrategia", "cliente"],
      title: "Tema",
    });
  });
});
