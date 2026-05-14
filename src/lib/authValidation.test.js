import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  normalizeEmail,
  validateLoginForm,
  validateRegistrationForm,
} from "./authValidation";

describe("auth validation", () => {
  it("normalizes email input", () => {
    expect(normalizeEmail("  User@Empresa.COM ")).toBe("user@empresa.com");
  });

  it("accepts valid emails and rejects malformed emails", () => {
    expect(isValidEmail("persona@empresa.com")).toBe(true);
    expect(isValidEmail("persona-empresa")).toBe(false);
  });

  it("requires email and password for login", () => {
    expect(validateLoginForm({ email: "mal", password: "" })).toBe("Introduce un email valido.");
    expect(validateLoginForm({ email: "persona@empresa.com", password: "" })).toBe(
      "Introduce tu contrasena.",
    );
    expect(validateLoginForm({ email: "persona@empresa.com", password: "correcta" })).toBe("");
  });

  it("requires controlled registration fields", () => {
    expect(
      validateRegistrationForm({
        displayName: "",
        email: "persona@empresa.com",
        password: "12345678",
        confirmPassword: "12345678",
      }),
    ).toBe("Introduce el nombre visible del usuario.");

    expect(
      validateRegistrationForm({
        displayName: "Persona",
        email: "persona@empresa.com",
        password: "1234567",
        confirmPassword: "1234567",
      }),
    ).toBe("La contrasena debe tener al menos 8 caracteres.");

    expect(
      validateRegistrationForm({
        displayName: "Persona",
        email: "persona@empresa.com",
        password: "12345678",
        confirmPassword: "87654321",
      }),
    ).toBe("Las contrasenas no coinciden.");
  });
});
