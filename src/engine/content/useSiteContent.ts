"use client";
/**
 * Public reads of editable site content (gallery albums, coaches with their
 * photos, home page media overrides) and the staff editor for home page
 * media. Coach profiles are edited with useCoachEditor.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CONFIG_FACTS } from "@/engine/siteFacts";
import type { PublicRules } from "@/engine/types";
import { getCoaches, getGallery, getPublicRules, getReviews, getSiteMedia, resetSiteMedia, setSiteMedia } from "@/engine/api";
import { checkFiles } from "@/engine/content/permissions";
import type { MediaItem } from "@/engine/types";

/** Published albums for the site's gallery section. */
export function useGallery() {
  const { data: albums = [], isLoading } = useQuery({ queryKey: ["site-gallery"], queryFn: getGallery, staleTime: 60_000 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = albums.find((a) => a.id === activeId) ?? albums[0] ?? null;
  return { albums, loading: isLoading, active, setActive: setActiveId };
}

/** Published player reviews and the overall score. */
export function useReviews() {
  const { data, isLoading } = useQuery({ queryKey: ["site-reviews"], queryFn: getReviews, staleTime: 5 * 60_000 });
  return { reviews: data?.reviews ?? [], average: data?.average ?? 0, count: data?.count ?? 0, loading: isLoading };
}

/** Booking window, gateway hold and refund ladder currently in force. */
export function usePublicRules() {
  const { data, isLoading } = useQuery({ queryKey: ["site-rules"], queryFn: getPublicRules, staleTime: 10 * 60_000 });
  return { rules: data, loading: isLoading };
}

/** The rules in force, with the venue config until the server answers. */
export function useRules(): PublicRules {
  return usePublicRules().rules ?? CONFIG_FACTS.rules;
}

/** Coaches with their current photos. */
export function useCoaches() {
  const { data: coaches = [], isLoading } = useQuery({ queryKey: ["coaches"], queryFn: getCoaches, staleTime: 60_000 });
  return { coaches, loading: isLoading };
}

/** Stable empty value so effects that depend on the media map don't re-run every render. */
const NO_MEDIA: Record<string, MediaItem> = {};

/** Home page media: `src(slot, fallback)` gives the replaced file or the site's default. */
export function useSiteMedia() {
  const { data = NO_MEDIA } = useQuery({ queryKey: ["site-media"], queryFn: getSiteMedia, staleTime: 60_000 });
  return { src: (slot: string, fallback: string) => data[slot]?.url ?? fallback, replaced: data };
}

/** Staff: replace a home page slot's photo or video, or put the default back. */
export function useSiteMediaEditor() {
  const client = useQueryClient();
  const media = useSiteMedia();
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [error, setError] = useState<{ slot: string; text: string } | null>(null);
  const act = async (slot: string, task: () => Promise<unknown>) => {
    setBusySlot(slot);
    setError(null);
    try {
      await task();
      client.invalidateQueries({ queryKey: ["site-media"] });
      client.invalidateQueries({ queryKey: ["admin-audit"] });
    } catch (ex) {
      setError({ slot, text: (ex as Error).message });
    } finally {
      setBusySlot(null);
    }
  };
  return {
    ...media, busySlot, error,
    replace: (slot: string, kind: "image" | "video", list: FileList | null) => {
      const { ok, errors } = checkFiles(list, kind === "video" ? "image+video" : "image", 1);
      const file = ok[0];
      if (!file) return setError({ slot, text: errors.join("؛ ") || "فایلی انتخاب نشد" });
      if (kind === "video" && !file.type.startsWith("video/")) return setError({ slot, text: "این جایگاه ویدیو می‌خواهد (MP4 یا WEBM)" });
      act(slot, () => setSiteMedia(slot, file));
    },
    reset: (slot: string) => act(slot, () => resetSiteMedia(slot)),
  };
}
