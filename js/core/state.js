const state = {
  currentUser: null,
  profile: null,
};

const listeners = new Set();

export function setSessionUser(user, profile) {
  state.currentUser = user;
  state.profile = profile;
  listeners.forEach((fn) => fn(state));
}

export function getSession() {
  return state;
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
