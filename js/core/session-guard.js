import { supabase } from "../lib/supabase-init.js";
import { getUserProfile } from "../services/user.service.js";
import { setSessionUser } from "./state.js";

export async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    window.location.replace("../login.html");
    return new Promise(() => {});
  }
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    window.location.replace("../register.html");
    return new Promise(() => {});
  }
  setSessionUser(session.user, profile);
  return { user: session.user, profile };
}

export async function redirectIfAuthed() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) window.location.replace("app/messages.html");
  return session;
}
