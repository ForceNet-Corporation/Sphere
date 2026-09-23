import { supabase } from "../lib/supabase-init.js";

export async function ensureConversation(uidA, uidB) {
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(user_a.eq.${uidA},user_b.eq.${uidB}),and(user_a.eq.${uidB},user_b.eq.${uidA})`)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_a: uidA, user_b: uidB })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(user_a.eq.${uidA},user_b.eq.${uidB}),and(user_a.eq.${uidB},user_b.eq.${uidA})`)
        .single();
      if (retryError) throw retryError;
      return retry.id;
    }
    throw error;
  }
  return data.id;
}

export async function sendMessage(conversationId, { senderId, text }) {
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, text });
  if (error) throw error;
}

export async function listConversations(uid) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,user_a,user_b,last_message,last_sender_id,updated_at")
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function watchConversations(uid, callback, onError = () => {}) {
  let alive = true;
  const load = async () => {
    try { callback(await listConversations(uid)); } catch (e) { if (alive) onError(e); }
  };
  load();
  const channel = supabase.channel(`conversations:${uid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
    .subscribe((status) => { if (status === "CHANNEL_ERROR") onError(new Error("Realtime не подключён")); });
  return () => { alive = false; supabase.removeChannel(channel); };
}

export async function listMessages(conversationId) {
  const { data, error } = await supabase.from("messages").select("id,sender_id,text,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export function watchMessages(conversationId, callback, onError = () => {}) {
  let alive = true;
  const load = async () => { try { callback(await listMessages(conversationId)); } catch (e) { if (alive) onError(e); } };
  load();
  const channel = supabase.channel(`messages:${conversationId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, load)
    .subscribe((status) => { if (status === "CHANNEL_ERROR") onError(new Error("Realtime не подключён")); });
  return () => { alive = false; supabase.removeChannel(channel); };
}
