"use client";
/**
 * Public reads of editable site content (gallery albums, coaches with their
 * photos, home page media overrides) and the staff editors for coach photos
 * and home page media.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoaches, getGallery, getSiteMedia, resetSiteMedia, setCoachPhoto, setSiteMedia } from "@/engine/api";
import { checkFiles } from "@/engine/content/permissions";
import type { MediaItem } from "@/engine/types";

/** Published albums for the site's gallery section. */
export function useGallery() {
  const { data: albums = [], isLoading } = useQuery({ queryKey: ["site-gallery"], queryFn: getGallery, staleTime: 60_000 });
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = albums.find((a) => a.id === activeId) ?? albums[0] ?? null;
  return { albums, loading: isLoading, active, setActive: setActiveId };
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

/** Staff: replace or remove a coach's photo. */
export function useCoachPhotos() {
  const client = useQueryClient();
  const { coaches, loading } = useCoaches();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  const act = async (id: string, file: File | null) => {
    setBusyId(id);
    setError(null);
    try {
      await setCoachPhoto(id, file);
      client.invalidateQueries({ queryKey: ["coaches"] });
      client.invalidateQueries({ queryKey: ["admin-audit"] });
    } catch (ex) {
      setError({ id, text: (ex as Error).message });
    } finally {
      setBusyId(null);
    }
  };
  return {
    coaches, loading, busyId, error,
    replace: (id: string, list: FileList | null) => {
      const { ok, errors } = checkFiles(list, "image", 1);
      if (!ok.length) return setError({ id, text: errors.join("؛ ") || "فایلی انتخاب نشد" });
      act(id, ok[0]);
    },
    clear: (id: string) => act(id, null),
  };
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
