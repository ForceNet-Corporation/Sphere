import { supabase } from "../lib/supabase-init.js";

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUserProfile(uid, { fullName, username, email, birthDate }) {
  const payload = {
    id: uid,
    full_name: fullName,
    username,
    email,
    birth_date: birthDate || null,
  };
  const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select().single();
  if (error) throw error;
  return data;
}

export async function isUsernameTaken(username) {
  const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getUserByUsername(username) {
  const { data, error } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(uid, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", uid).select().single();
  if (error) throw error;
  return data;
}

export async function searchUsers(term, max = 20) {
  const q = term.toLowerCase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .order("username")
    .limit(max);
  if (error) throw error;
  return data || [];
}
