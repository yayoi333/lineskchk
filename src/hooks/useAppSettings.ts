import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const STORAGE_KEY = 'haechecker_settings';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaults: AppSettings = {
      backgroundColor: 'default',
      backgroundImage: null,
      senderType: 'me',
      showNotch: true,
      opponentName: '映えチェッカーくん',
      showReadStatus: false,
      readCount: 1,
      showStar: false,
      showOpponentNameInTalk: true,
      loopAnimations: false
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          // Don't restore BLOB URLs as they are invalid on reload
          backgroundImage: null,
          backgroundColor: parsed.backgroundColor === 'image' ? 'default' : parsed.backgroundColor,
          senderType: 'me' // Always default to 'me' on start
        };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    const toSave = {
      backgroundColor: settings.backgroundColor,
      showNotch: settings.showNotch,
      opponentName: settings.opponentName,
      showReadStatus: settings.showReadStatus,
      readCount: settings.readCount,
      showStar: settings.showStar,
      showOpponentNameInTalk: settings.showOpponentNameInTalk,
      loopAnimations: settings.loopAnimations
      // backgroundImage is purposefully not saved to disk if it's a blob URL
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [
    settings.backgroundColor, 
    settings.showNotch, 
    settings.opponentName,
    settings.showReadStatus,
    settings.readCount,
    settings.showStar,
    settings.showOpponentNameInTalk,
    settings.loopAnimations
  ]);

  return { settings, setSettings };
};
