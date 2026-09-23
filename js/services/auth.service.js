import { supabase } from "../lib/supabase-init.js";
import { createUserProfile, getUserProfile, isUsernameTaken } from "./user.service.js";
import { normalizeUsername } from "../utils/validators.js";

export function watchAuthState(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function registerWithEmail({ fullName, username, email, password, birthDate }) {
  const cleanUsername = normalizeUsername(username);
  if (await isUsernameTaken(cleanUsername)) throw new Error("USERNAME_TAKEN");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("NO_USER");
  return { user: data.user, email, fullName, username: cleanUsername, birthDate };
}

export async function verifySignupOtp(email, token, profileData) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) throw error;
  await createUserProfile(data.user.id, { ...profileData, email });
  return data.user;
}

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function logout() { await supabase.auth.signOut(); }

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`,
  });
  if (error) throw error;
}
