import { describe, expect, it } from "vitest";
import { autosaveStatusLabel, autosaveStatusTone } from "./autosave";

describe("autosave helpers", () => {
  it("labels autosave states", () => {
    expect(autosaveStatusLabel("dirty")).toBe("Cambios pendientes");
    expect(autosaveStatusLabel("saving")).toBe("Guardando...");
    expect(autosaveStatusLabel("saved")).toBe("Guardado");
    expect(autosaveStatusLabel("error")).toBe("Error al guardar");
  });

  it("maps autosave states to badge tones", () => {
    expect(autosaveStatusTone("dirty")).toBe("amber");
    expect(autosaveStatusTone("saving")).toBe("amber");
    expect(autosaveStatusTone("saved")).toBe("green");
    expect(autosaveStatusTone("error")).toBe("rose");
  });
});
