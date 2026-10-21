"use client";
/**
 * Staff gallery editor: albums (create, rename, publish, delete — albums
 * permission) and their photos (add, caption, reorder, cover, remove —
 * gallery permission).
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addAlbumPhotos, createAlbum, deleteAlbum, getAlbums, removeAlbumPhoto, reorderAlbum, updateAlbum, updateAlbumPhoto } from "@/engine/api";
import { checkFiles, useCan } from "@/engine/content/permissions";

export function useAlbums() {
  const client = useQueryClient();
  const { can } = useCan();
  const { data: albums = [], isLoading } = useQuery({ queryKey: ["staff-albums"], queryFn: getAlbums });
  const [openId, setOpenId] = useState<string | null>(null);
  const album = albums.find((a) => a.id === openId) ?? null;
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["staff-albums"] });
    client.invalidateQueries({ queryKey: ["site-gallery"] });
    client.invalidateQueries({ queryKey: ["admin-audit"] });
  };
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await task();
      refresh();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    albums, loading: isLoading, album, busy, error,
    canEditAlbums: can("albums"),
    canEditPhotos: can("gallery"),
    open: (id: string | null) => { setOpenId(id); setConfirmDelete(false); setError(""); },

    newTitle, setNewTitle,
    create: () =>
      run(async () => {
        const t = newTitle.trim();
        if (t.length < 2 || t.length > 60) throw new Error("نام آلبوم بین ۲ تا ۶۰ حرف باشد");
        const a = await createAlbum(t);
        setNewTitle("");
        setOpenId(a.id);
      }),
    rename: (title: string) => album && run(() => updateAlbum(album.id, { title: title.trim().slice(0, 60) })),
    setPublished: (published: boolean) => album && run(() => updateAlbum(album.id, { published })),
    setCover: (itemId: string) => album && run(() => updateAlbum(album.id, { coverId: itemId })),
    confirmDelete, askDelete: () => setConfirmDelete(true), cancelDelete: () => setConfirmDelete(false),
    remove: () => album && run(async () => { await deleteAlbum(album.id); setOpenId(null); setConfirmDelete(false); }),

    addPhotos: (list: FileList | File[] | null) =>
      album &&
      run(async () => {
        const { ok, errors } = checkFiles(list, "image");
        if (errors.length && !ok.length) throw new Error(errors.join("؛ "));
        if (ok.length) await addAlbumPhotos(album.id, ok);
        if (errors.length) setError(errors.join("؛ "));
      }),
    caption: (itemId: string, caption: string) => album && run(() => updateAlbumPhoto(album.id, itemId, { caption: caption.slice(0, 120), alt: caption.slice(0, 120) || undefined })),
    removePhoto: (itemId: string) => album && run(() => removeAlbumPhoto(album.id, itemId)),
    move: (itemId: string, dir: -1 | 1) =>
      album &&
      run(async () => {
        const ids = album.items.map((i) => i.id);
        const i = ids.indexOf(itemId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        await reorderAlbum(album.id, ids);
      }),
  };
}
