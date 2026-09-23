export function conversationId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

export function likeId(postId, uid) {
  return `${postId}_${uid}`;
}

export function followId(followerId, followingId) {
  return `${followerId}_${followingId}`;
}

export function randomToken(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
