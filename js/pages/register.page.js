import { icon } from "../utils/icons.js";
import { qs, qsa } from "../utils/dom.js";
import { registerWithEmail, verifySignupOtp } from "../services/auth.service.js";
import { redirectIfAuthed } from "../core/session-guard.js";
import { isValidUsername, passwordStrength } from "../utils/validators.js";

qsa("[data-icon]").forEach((node) => { node.innerHTML = icon(node.dataset.icon, "icon-sm"); });
await redirectIfAuthed();

const form = qs("[data-register-form]");
const otpForm = qs("[data-otp-form]");
const errorEl = qs("[data-form-error]");
const submitBtn = qs("[data-submit-btn]");
let pending = null;

function errorText(error) {
  if (error?.message === "USERNAME_TAKEN") return "Этот юзернейм уже занят.";
  if (error?.code === "23505") return "Этот юзернейм уже занят.";
  if (error?.code === "email_exists") return "Эта почта уже зарегистрирована.";
  if (error?.code === "weak_password") return "Пароль слишком простой.";
  if (error?.code === "otp_expired") return "Код истёк. Запросите новый код.";
  if (error?.code === "otp_disabled") return "Подтверждение email отключено в Supabase.";
  return error?.message || "Не удалось выполнить операцию.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.style.color = "var(--danger)";
  errorEl.textContent = "";
  const fullName = qs("#fullName").value.trim();
  const username = qs("#username").value.trim().toLowerCase();
  const email = qs("#regEmail").value.trim().toLowerCase();
  const password = qs("#regPassword").value;
  const birthDate = qs("#birthDate").value;
  if (fullName.length < 2) return (errorEl.textContent = "Введите имя и фамилию.");
  if (!isValidUsername(username)) return (errorEl.textContent = "Юзернейм: 3–20 символов, только латиница, цифры и _.");
  if (!email.includes("@")) return (errorEl.textContent = "Введите корректную почту.");
  if (passwordStrength(password) < 2) return (errorEl.textContent = "Пароль должен содержать минимум 8 символов, включая буквы и цифры.");

  submitBtn.disabled = true;
  try {
    pending = { fullName, username, email, birthDate };
    await registerWithEmail({ ...pending, password });
    form.hidden = true;
    qs("[data-otp-step]").hidden = false;
    qs("[data-otp-email]").textContent = email;
    qs("#otp").focus();
  } catch (error) {
    pending = null;
    errorEl.textContent = errorText(error);
  } finally { submitBtn.disabled = false; }
});

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  const token = qs("#otp").value.trim();
  if (!/^\d{6}$/.test(token)) return (errorEl.textContent = "Введите 6-значный код из письма.");
  const btn = qs("[data-verify-btn]"); btn.disabled = true;
  try {
    await verifySignupOtp(pending.email, token, pending);
    window.location.replace("app/messages.html");
  } catch (error) { errorEl.textContent = errorText(error); }
  finally { btn.disabled = false; }
});
