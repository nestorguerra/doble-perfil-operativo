import { describe, expect, it } from "vitest";
import { normalizeActivityForm, validateActivityForm } from "./activityValidation";

describe("activity validation", () => {
  it("requires a title", () => {
    expect(validateActivityForm({ title: "   ", profileIds: ["profile-a"] })).toBe(
      "El titulo de la actividad es obligatorio.",
    );
  });

  it("requires at least one linked profile", () => {
    expect(validateActivityForm({ title: "Nueva actividad", profileIds: [] })).toBe(
      "Asocia al menos un perfil.",
    );
  });

  it("normalizes activity payloads", () => {
    expect(
      normalizeActivityForm({
        description: "  Detalle ",
        profileIds: ["a", "a", "b"],
        status: "unknown",
        title: "  Actividad ",
      }),
    ).toEqual({
      description: "Detalle",
      profileIds: ["a", "b"],
      status: "pending",
      title: "Actividad",
    });
  });
});
