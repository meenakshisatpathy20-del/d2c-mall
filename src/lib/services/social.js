import { setState, useStore } from "../store";
import { toast } from "../toast";
import { uid } from "../format";

export function useSocial() {
  return useStore((s) => s.social);
}

function toggle(bucket, id) {
  let now = false;
  setState((st) => {
    const cur = st.social[bucket] || {};
    now = !cur[id];
    const next = { ...cur };
    if (now) next[id] = true;
    else delete next[id];
    return { ...st, social: { ...st.social, [bucket]: next } };
  });
  return now;
}

export const toggleLike = (postId) => toggle("likes", postId);
export function toggleSave(postId) {
  const on = toggle("saves", postId);
  toast(on ? "Saved to your collection" : "Removed from saved", { type: on ? "success" : "info" });
}
export function toggleFollow(creatorId, name) {
  const on = toggle("follows", creatorId);
  toast(on ? `Following ${name}` : `Unfollowed ${name}`, { type: on ? "success" : "info" });
}

export function addComment(postId, user, text) {
  const c = { id: uid("cm"), name: user?.name || "Guest", text, at: Date.now() };
  setState((st) => ({
    ...st,
    social: { ...st.social, comments: { ...st.social.comments, [postId]: [...(st.social.comments[postId] || []), c] } },
  }));
}

export async function sharePost(post, creator) {
  const url = `${window.location.origin}/d2c-street?post=${post.id}`;
  const data = { title: `${creator?.name} on D2C Street`, text: post.caption, url };
  try {
    if (navigator.share) {
      await navigator.share(data);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied — share it anywhere");
  } catch {
    /* user cancelled */
  }
}
