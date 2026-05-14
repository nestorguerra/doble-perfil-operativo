export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validateLoginForm({ email, password }) {
  if (!isValidEmail(email)) {
    return "Introduce un email valido.";
  }

  if (!password) {
    return "Introduce tu contrasena.";
  }

  return "";
}

export function validateRegistrationForm({ displayName, email, password, confirmPassword }) {
  if (!displayName.trim()) {
    return "Introduce el nombre visible del usuario.";
  }

  if (!isValidEmail(email)) {
    return "Introduce un email valido.";
  }

  if (password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres.";
  }

  if (password !== confirmPassword) {
    return "Las contrasenas no coinciden.";
  }

  return "";
}
