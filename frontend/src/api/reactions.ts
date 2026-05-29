import api from "./axiosInstance";
import type { ReactionCounts } from "../types";

export interface ReactionState {
  counts: ReactionCounts;
  mine: string[];
}

export function getReactions(slug: string): Promise<ReactionState> {
  return api.get<ReactionState>(`/api/posts/${slug}/react/`).then((r) => r.data);
}

export function toggleReaction(slug: string, emoji: string): Promise<ReactionState> {
  return api
    .post<ReactionState>(`/api/posts/${slug}/react/`, { emoji })
    .then((r) => r.data);
}
