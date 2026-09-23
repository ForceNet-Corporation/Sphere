import { icon } from "../utils/icons.js";
import { qs, qsa } from "../utils/dom.js";
import { loginWithEmail, resetPassword } from "../services/auth.service.js";
import { redirectIfAuthed } from "../core/session-guard.js";

qsa("[data-icon]").forEach((node) => { node.innerHTML = icon(node.dataset.icon, "icon-sm"); });
await redirectIfAuthed();
const form = qs("[data-login-form]");
const errorEl = qs("[data-form-error]");
const submitBtn = qs("[data-submit-btn]");
const passwordInput = qs("#password");

qs("[data-toggle-password]").addEventListener("click", () => passwordInput.type = passwordInput.type === "password" ? "text" : "password");
qs("[data-forgot]").addEventListener("click", async () => {
  const email = qs("#email").value.trim();
  if (!email) return (errorEl.textContent = "Введите почту для восстановления доступа.");
  try { await resetPassword(email); errorEl.style.color = "var(--success)"; errorEl.textContent = "Письмо для восстановления отправлено."; }
  catch (e) { errorEl.style.color = "var(--danger)"; errorEl.textContent = e.message || "Не удалось отправить письмо."; }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault(); errorEl.style.color = "var(--danger)"; errorEl.textContent = ""; submitBtn.disabled = true;
  try { await loginWithEmail(qs("#email").value.trim().toLowerCase(), passwordInput.value); window.location.replace("app/messages.html"); }
  catch (error) {
    errorEl.textContent = error?.message?.toLowerCase().includes("email not confirmed") ? "Сначала подтвердите email кодом из письма." : "Неверная почта или пароль.";
  } finally { submitBtn.disabled = false; }
});
