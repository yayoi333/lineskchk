import { useState, useCallback } from 'react';
import { StickerGroup } from '../types';
import { revokeManagedObjectURL } from '../utils/objectUrl';

export const useStickerGroups = () => {
  const [stickerGroups, setStickerGroups] = useState<StickerGroup[]>([]);
  const [emojiGroups, setEmojiGroups] = useState<StickerGroup[]>([]);
  const [activeStickerGroupId, setActiveStickerGroupId] = useState<string | null>(null);
  const [activeEmojiGroupId, setActiveEmojiGroupId] = useState<string | null>(null);

  const cleanupGroup = useCallback((group: StickerGroup) => {
    if (group.tabSticker) {
      revokeManagedObjectURL(group.tabSticker.url);
    }
    group.stickers.forEach(s => revokeManagedObjectURL(s.url));
  }, []);

  const addStickerGroup = useCallback((group: StickerGroup) => {
    setStickerGroups((prev) => [...prev, group]);
    setActiveStickerGroupId(group.id);
  }, []);

  const addEmojiGroup = useCallback((group: StickerGroup) => {
    setEmojiGroups((prev) => [...prev, group]);
    setActiveEmojiGroupId(group.id);
  }, []);

  const removeStickerGroup = useCallback((id: string) => {
    setStickerGroups((prev) => {
      const group = prev.find((g) => g.id === id);
      if (group) cleanupGroup(group);
      return prev.filter((g) => g.id !== id);
    });
    if (activeStickerGroupId === id) setActiveStickerGroupId(null);
  }, [activeStickerGroupId, cleanupGroup]);

  const removeEmojiGroup = useCallback((id: string) => {
    setEmojiGroups((prev) => {
      const group = prev.find((g) => g.id === id);
      if (group) cleanupGroup(group);
      return prev.filter((g) => g.id !== id);
    });
    if (activeEmojiGroupId === id) setActiveEmojiGroupId(null);
  }, [activeEmojiGroupId, cleanupGroup]);

  const clearAllGroups = useCallback(() => {
    stickerGroups.forEach(cleanupGroup);
    emojiGroups.forEach(cleanupGroup);
    setStickerGroups([]);
    setEmojiGroups([]);
    setActiveStickerGroupId(null);
    setActiveEmojiGroupId(null);
  }, [stickerGroups, emojiGroups, cleanupGroup]);

  return {
    stickerGroups,
    emojiGroups,
    activeStickerGroupId,
    activeEmojiGroupId,
    setActiveStickerGroupId,
    setActiveEmojiGroupId,
    addStickerGroup,
    addEmojiGroup,
    removeStickerGroup,
    removeEmojiGroup,
    clearAllGroups
  };
};
