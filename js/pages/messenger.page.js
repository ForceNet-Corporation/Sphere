import { requireSession } from "../core/session-guard.js";
import { icon } from "../utils/icons.js";
import { initials, escapeHtml, qs } from "../utils/dom.js";
import { formatClock, timeAgo } from "../utils/time-format.js";
import { getUserProfile, searchUsers } from "../services/user.service.js";
import { ensureConversation, sendMessage, watchConversations, watchMessages } from "../services/message.service.js";
import { logout } from "../services/auth.service.js";

const { user, profile } = await requireSession();
const app = document.querySelector(".messenger-app");
document.querySelectorAll("[data-icon]").forEach(n => n.innerHTML = icon(n.dataset.icon, "icon-sm"));
const list = qs("[data-conversation-list]"), header = qs("[data-chat-header]"), thread = qs("[data-thread]"), modal = qs("[data-modal]"), userResults = qs("[data-user-results]");
const peerCache = new Map();
let activeConv = null, stopMessages = null;

const pName = p => p?.full_name || "Пользователь";
const pUsername = p => p?.username || "sphere";
const avatarHtml = (p, size="") => p?.avatar_url ? `<img class="avatar ${size}" src="${escapeHtml(p.avatar_url)}" alt="${escapeHtml(pName(p))}">` : `<div class="avatar-fallback ${size}">${initials(pName(p))}</div>`;
qs("[data-profile]").innerHTML = `${avatarHtml(profile)}<div><strong>${escapeHtml(pName(profile))}</strong><span>@${escapeHtml(pUsername(profile))}</span></div>`;
qs("[data-logout]").onclick = async () => { await logout(); location.replace("../login.html"); };
async function peer(uid){ if(peerCache.has(uid)) return peerCache.get(uid); const p=await getUserProfile(uid); peerCache.set(uid,p); return p; }

function emptyThread(){
  stopMessages?.(); activeConv=null; app.classList.remove("thread-open");
  header.innerHTML=`<div class="mobile-brand"><img src="../assets/brand/logo-mark.png" alt="">Sphere</div><div class="chat-header-empty">Выберите диалог</div>`;
  thread.innerHTML=`<div class="thread-empty"><div class="sphere-mark"><img src="../assets/brand/logo-mark.png" alt=""></div><h1>Sphere</h1><p>Выберите диалог или начните новый чат.</p><button class="btn btn-primary" data-new-chat>Новый чат</button></div>`;
  thread.querySelector("[data-new-chat]").onclick=openModal;
}

async function renderConversations(convs){
  if(!convs.length){ list.innerHTML=`<div class="empty-state"><h3>Пока нет чатов</h3><p>Нажми «Новый чат», чтобы начать переписку.</p></div>`; return; }
  list.innerHTML="";
  for(const c of convs){
    const uid=c.user_a===user.id?c.user_b:c.user_a, p=await peer(uid);
    const row=document.createElement("button"); row.className="conversation-item "+(c.id===activeConv?"active":"");
    row.innerHTML=`${avatarHtml(p)}<div class="conversation-meta"><strong>${escapeHtml(pName(p))}</strong><p>${escapeHtml(c.last_message||"Начните переписку")}</p></div><span class="conversation-time">${timeAgo(c.updated_at)}</span>`;
    row.onclick=()=>openThread(c.id,p); list.append(row);
  }
}
watchConversations(user.id, renderConversations, e=>{ console.error(e); list.innerHTML=`<div class="empty-state"><h3>Не удалось загрузить чаты</h3><p>${escapeHtml(e.message||"Проверьте таблицы и Realtime в Supabase.")}</p></div>`; });

async function openThread(convId,p){
  activeConv=convId; app.classList.add("thread-open"); stopMessages?.();
  header.innerHTML=`<div class="thread-head">${avatarHtml(p)}<div class="thread-peer"><strong>${escapeHtml(pName(p))}</strong><span>@${escapeHtml(pUsername(p))}</span></div><button class="btn-icon" data-back title="Назад">‹</button></div>`;
  thread.innerHTML=`<div class="thread-body" data-body></div><form class="thread-composer" data-form><div class="input-wrap"><input autocomplete="off" maxlength="4000" placeholder="Написать сообщение..." data-input></div><button class="btn-icon" type="submit" title="Отправить">${icon("paper-plane","icon-sm")}</button></form>`;
  header.querySelector("[data-back]").onclick=emptyThread;
  const body=thread.querySelector("[data-body]");
  stopMessages=watchMessages(convId,msgs=>{ body.innerHTML=msgs.map(m=>`<div class="message-line ${m.sender_id===user.id?"own":""}"><div class="message-bubble">${escapeHtml(m.text)}</div><span class="message-time">${formatClock(m.created_at)}</span></div>`).join(""); requestAnimationFrame(()=>body.scrollTop=body.scrollHeight); }, console.error);
  thread.querySelector("[data-form]").onsubmit=async e=>{ e.preventDefault(); const input=thread.querySelector("[data-input]"), text=input.value.trim(); if(!text)return; const btn=e.submitter; btn.disabled=true; try{await sendMessage(convId,{senderId:user.id,text});input.value="";}catch(err){alert(err.message||"Не удалось отправить сообщение.");}finally{btn.disabled=false;input.focus();} };
}

function openModal(){ modal.hidden=false; qs("[data-user-search]").focus(); userResults.innerHTML=`<div class="empty-state">Начни вводить имя или юзернейм.</div>`; }
function closeModal(){ modal.hidden=true; }
document.querySelectorAll("[data-new-chat]").forEach(b=>b.onclick=openModal); qs("[data-close]").onclick=closeModal; modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
let searchTimer;
qs("[data-user-search]").addEventListener("input",e=>{ clearTimeout(searchTimer); const term=e.target.value.trim().replace(/^@/,""); if(term.length<2){userResults.innerHTML=`<div class="empty-state">Начни вводить имя или юзернейм.</div>`;return;} searchTimer=setTimeout(async()=>{ try{const users=(await searchUsers(term,15)).filter(p=>p.id!==user.id); userResults.innerHTML=users.length?users.map(p=>`<button class="user-result" data-uid="${p.id}">${avatarHtml(p)}<div><strong>${escapeHtml(pName(p))}</strong><span>@${escapeHtml(pUsername(p))}</span></div></button>`).join(""):`<div class="empty-state">Пользователь не найден.</div>`; userResults.querySelectorAll("[data-uid]").forEach(b=>b.onclick=async()=>{const p=users.find(x=>x.id===b.dataset.uid);closeModal();openThread(await ensureConversation(user.id,p.id),p);});}catch(err){console.error(err);userResults.innerHTML=`<div class="empty-state">Поиск временно недоступен.</div>`;} },250); });
qs("[data-search]").addEventListener("input",e=>{const term=e.target.value.toLowerCase().trim();list.querySelectorAll(".conversation-item").forEach(row=>row.style.display=row.innerText.toLowerCase().includes(term)?"flex":"none");});
