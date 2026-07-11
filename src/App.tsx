/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Developed by yayoi, 2026.
// X/Threads: @yayoi_threee

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { 
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

// Types and Constants
import { 
  Sticker, 
  StickerGroup,
  Message, 
  ValidationResult
} from './types';

// Hooks
import { useAppSettings } from './hooks/useAppSettings';
import { useStickerGroups } from './hooks/useStickerGroups';

// Utilities
import { generateId } from './utils/id';
import { createManagedObjectURL, revokeManagedObjectURL } from './utils/objectUrl';
import { performValidation, getBasename } from './utils/stickerValidation';
import { isApng, toInfiniteLoopApng } from './utils/apng';

// Components
import { PhonePreview } from './components/PhonePreview';
import { ValidationPanel } from './components/ValidationPanel';
import { UploadSection } from './components/UploadSection';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  // --- Hooks ---
  const { settings, setSettings } = useAppSettings();
  const { 
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
  } = useStickerGroups();

  const handleRemoveGroup = (group: StickerGroup) => {
    // 使用している環境(iframe)によってはconfirmが即座にキャンセルされる場合があるため、setTimeoutで囲います
    setTimeout(() => {
      const text = `「${group.name}」を削除しますか？\n(送信済みのメッセージは消えません)`;
      if (window.confirm(text)) {
        if (group.category === 'sticker') {
          removeStickerGroup(group.id);
        } else {
          removeEmojiGroup(group.id);
        }
        setValidationResult(null);
      }
    }, 10);
  };

  // --- State ---
  const [inputText, setInputText] = useState<(string | Sticker)[]>([]);
  const [currentTyping, setCurrentTyping] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [activePanelTab, setActivePanelTab] = useState<'sticker' | 'emoji' | 'settings'>('sticker');
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // --- Refs ---
  const talkRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (talkRef.current) {
      talkRef.current.scrollTop = talkRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Utilities ---
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const stickerToPreviewSticker = async (sticker: Sticker): Promise<Sticker> => {
    if (!sticker.blob) return { ...sticker };
    try {
      const dataUrl = await blobToDataUrl(sticker.blob);

      // APNG(動くスタンプ)なら、連続再生用に無限ループ版のData URLも用意する
      let isAnimated = false;
      let loopUrl: string | undefined;
      try {
        const bytes = new Uint8Array(await sticker.blob.arrayBuffer());
        isAnimated = isApng(bytes);
        if (isAnimated) {
          const loopedBytes = toInfiniteLoopApng(bytes);
          if (loopedBytes) {
            loopUrl = await blobToDataUrl(new Blob([loopedBytes], { type: 'image/png' }));
          }
        }
      } catch (apngErr) {
        console.error('Failed to analyze APNG', apngErr);
      }

      return {
        ...sticker,
        url: dataUrl,
        isAnimated,
        loopUrl,
        blob: undefined, // No longer need blob for the preview copy
      };
    } catch (err) {
      console.error('Failed to convert sticker to Data URL', err);
      return { ...sticker };
    }
  };

  // --- Handlers ---
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji' = 'sticker') => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];

    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extractedStickers: Sticker[] = [];
      let mainImg: Sticker | null = null;
      let tabImg: Sticker | null = null;

      const fileEntries = Object.entries(content.files);
      for (const [path, zipEntry] of fileEntries) {
        if (zipEntry.dir) continue;
        const filename = getBasename(path);
        if (!filename.toLowerCase().endsWith('.png')) continue;

        const blob = await zipEntry.async('blob');
        const url = createManagedObjectURL(blob);
        const img = new Image();
        
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
              revokeManagedObjectURL(url);
              reject(new Error(`Failed to load image: ${filename}`));
            };
            img.src = url;
          });
        } catch (imageErr) {
          console.warn(imageErr);
          continue; 
        }

        const sticker: Sticker = {
          id: generateId(),
          name: filename,
          url,
          blob,
          width: img.width,
          height: img.height,
          size: blob.size,
          type: 'image/png'
        };

        const lowerName = filename.toLowerCase();
        if (lowerName === 'main.png') {
          sticker.isMain = true;
          mainImg = sticker;
        } else if (lowerName === 'tab.png') {
          sticker.isTab = true;
          tabImg = sticker;
        } else {
          // Collect any other PNG as a sticker
          extractedStickers.push(sticker);
        }
      }

      extractedStickers.sort((a, b) => a.name.localeCompare(b.name));

      const newGroup: StickerGroup = {
        id: generateId(),
        name: file.name.replace(/\.zip$/i, ''),
        tabSticker: tabImg || extractedStickers[0] || null,
        stickers: extractedStickers,
        category
      };

      if (category === 'sticker') {
        addStickerGroup(newGroup);
        const v = performValidation(extractedStickers, mainImg, tabImg, file.size, category);
        setValidationResult(v);
      } else {
        addEmojiGroup(newGroup);
        const v = performValidation(extractedStickers, mainImg, tabImg, file.size, category);
        setValidationResult(v);
      }
      setActivePanelTab(category);

    } catch (err) {
      console.error(err);
      alert('ZIPファイルの解析に失敗しました。');
    }
  };

  const handlePngUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji' = 'sticker') => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList); // Copy to array to be safe since e.target.value is cleared

    const newStickers: Sticker[] = [];
    for (const file of files) {
      if (!file.type.includes('png')) continue;

      const url = createManagedObjectURL(file);
      const img = new Image();
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Load error: ${file.name}`));
          img.src = url;
        });

        newStickers.push({
          id: generateId(),
          name: file.name,
          url,
          blob: file,
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type
        });
      } catch (err) {
        console.error(err);
        revokeManagedObjectURL(url);
        continue;
      }
    }

    if (newStickers.length === 0) return;

    const newGroup: StickerGroup = {
      id: generateId(),
      name: `Upload_${new Date().toLocaleTimeString()}`,
      tabSticker: newStickers[0],
      stickers: newStickers,
      category
    };

    if (category === 'sticker') {
      addStickerGroup(newGroup);
    } else {
      addEmojiGroup(newGroup);
    }
    setActivePanelTab(category);
    setValidationResult(null);
  };

  const sendMessage = async () => {
    const fullContent = [...inputText];
    if (currentTyping.trim()) {
      fullContent.push(currentTyping);
    }

    if (fullContent.length === 0) return;

    const filteredContent = fullContent.filter(item => typeof item !== 'string' || item.trim() !== '');
    if (filteredContent.length === 0) return;

    // Convert any stickers/emojis in content to standalone Data URLs
    const finalContent = await Promise.all(filteredContent.map(async (item) => {
      if (typeof item === 'string') return item;
      return stickerToPreviewSticker(item);
    }));

    let type: Message['type'] = 'text';
    const isOnlyEmojis = finalContent.every(item => typeof item !== 'string');
    
    if (isOnlyEmojis) {
      if (finalContent.length === 1) {
        type = 'sticker';
      } else if (finalContent.length <= 3) {
        type = 'emoji-combined';
      }
    }
    
    // Check if it's emoji-based sticker (for single emoji case)
    const isEmoji = isOnlyEmojis;

    const newMessage: Message = {
      id: generateId(),
      sender: settings.senderType,
      timestamp: new Date(),
      type: type,
      isEmoji: isEmoji,
      stickerId: (type === 'sticker' && typeof finalContent[0] !== 'string') ? (finalContent[0] as Sticker).id : undefined,
      content: [...finalContent]
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText([]);
    setCurrentTyping("");
  };

  const handleSelectionClick = async (item: Sticker) => {
    if (reactionTargetId) {
      // Reaction selection mode
      const previewSticker = await stickerToPreviewSticker(item);
      setMessages(prev => prev.map(m => m.id === reactionTargetId ? { ...m, reactions: [...(m.reactions || []), previewSticker] } : m));
      setReactionTargetId(null);
      return;
    }

    const previewSticker = await stickerToPreviewSticker(item);
    if (activePanelTab === 'sticker') {
      const newMessage: Message = {
        id: generateId(),
        sender: settings.senderType,
        timestamp: new Date(),
        type: 'sticker',
        isEmoji: false,
        stickerId: previewSticker.id,
        content: [previewSticker]
      };
      setMessages((prev) => [...prev, newMessage]);
    } else {
      if (currentTyping) {
        setInputText((prev) => [...prev, currentTyping]);
        setCurrentTyping("");
      }
      setInputText((prev) => [...prev, previewSticker]);
    }
  };

  const toggleMessageSender = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, sender: msg.sender === 'me' ? 'opponent' : 'me' } 
        : msg
    ));
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = createManagedObjectURL(file);
    setSettings((prev) => ({ ...prev, backgroundImage: url, backgroundColor: 'image' as const }));
  };

  const getContrastColor = (color: string) => {
    if (color === 'default') return 'white';
    if (color === 'image') return 'white';
    const hex = color.replace('#', '');
    if (hex.length !== 6) return 'black';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7 ? 'black' : 'white';
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-900">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#06C755] rounded-xl flex items-center justify-center text-white shadow-sm">
            <CheckCircle2 size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight truncate">映えチェッカーくん</h1>
            <p className="text-xs text-gray-500 truncate">LINEスタンプ見映え確認ツール</p>
          </div>
        </div>
        <div className="flex gap-2">
        </div>
      </header>

      <main className={`pt-20 pb-4 px-1 sm:px-4 max-w-[1400px] mx-auto grid grid-cols-1 ${isMobileFullscreen ? '' : 'lg:grid-cols-[400px_1fr]'} gap-4 items-start`}>
        
        <section className={`flex flex-col items-center w-full pb-4 z-10 ${isMobileFullscreen ? 'fixed inset-0 p-0 bg-white z-[60]' : 'lg:sticky lg:top-20'}`}>
          <PhonePreview 
            settings={settings}
            messages={messages}
            inputText={inputText}
            currentTyping={currentTyping}
            onSendMessage={sendMessage}
            onRemoveInputItem={(i: number) => setInputText((prev) => prev.filter((_, idx) => idx !== i))}
            onRemoveMessage={(id: string) => setMessages((prev) => prev.filter((m) => m.id !== id))}
            setCurrentTyping={setCurrentTyping}
            talkRef={talkRef}
            messagesEndRef={messagesEndRef}
            activePanelTab={activePanelTab}
            setActivePanelTab={setActivePanelTab}
            stickerGroups={stickerGroups}
            emojiGroups={emojiGroups}
            activeStickerGroupId={activeStickerGroupId}
            activeEmojiGroupId={activeEmojiGroupId}
            setActiveStickerGroupId={setActiveStickerGroupId}
            setActiveEmojiGroupId={setActiveEmojiGroupId}
            handleSelectionClick={handleSelectionClick}
            formatTime={(d: Date) => d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
            getContrastColor={getContrastColor}
            isMobileFullscreen={isMobileFullscreen}
            setIsMobileFullscreen={setIsMobileFullscreen}
            onToggleSender={toggleMessageSender}
            onAddReaction={(id) => {
              setReactionTargetId(id);
              setActivePanelTab('emoji');
            }}
            setSettings={setSettings}
            onBgUpload={handleBgUpload}
            bgInputRef={bgInputRef}
            onClearHistory={() => { if (confirm('トーク履歴をクリアしますか？')) setMessages([]); }}
          />

          {!isMobileFullscreen && (
            <div className="mt-6 flex flex-col gap-4 w-full max-w-[375px]">
              <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 relative flex overflow-hidden">
                <button 
                  onClick={() => setSettings((prev) => ({ ...prev, senderType: 'opponent' as const }))}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all relative z-10 ${settings.senderType === 'opponent' ? 'text-white' : 'text-gray-500'}`}
                >
                  受信
                </button>
                <button 
                  onClick={() => setSettings((prev) => ({ ...prev, senderType: 'me' as const }))}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all relative z-10 ${settings.senderType === 'me' ? 'text-white' : 'text-gray-500'}`}
                >
                  送信
                </button>
                <motion.div 
                  className="absolute inset-1.5 w-[calc(50%-6px)] bg-[#06C755] rounded-xl"
                  initial={false}
                  animate={{ x: settings.senderType === 'opponent' ? 0 : '100%' }}
                />
              </div>
            </div>
          )}
        </section>

        <section className={`flex flex-col gap-6 w-full max-w-2xl mx-auto lg:mx-0 ${isMobileFullscreen ? 'hidden' : ''}`}>
          <UploadSection 
            onZipUpload={handleZipUpload}
            onPngUpload={handlePngUpload}
            stickerGroupsCount={stickerGroups.length}
            emojiGroupsCount={emojiGroups.length}
            stickerGroups={stickerGroups}
            emojiGroups={emojiGroups}
            onRemoveGroup={handleRemoveGroup}
          />

          <ValidationPanel 
            validation={validationResult}
            onClear={() => setValidationResult(null)}
          />

          <SettingsPanel 
            settings={settings}
            setSettings={setSettings}
            onBgUpload={handleBgUpload}
            onClearHistory={() => { if (confirm('トーク履歴をクリアしますか？')) setMessages([]); }}
            backgroundImageInputRef={bgInputRef}
            isMobileFullscreen={isMobileFullscreen}
            setIsMobileFullscreen={setIsMobileFullscreen}
          />
        </section>
      </main>

      <footer className={`pb-10 pt-4 text-center transition-opacity ${isMobileFullscreen ? 'hidden' : 'opacity-100'}`}>
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-wider">
          Developed by yayoi 2026
        </p>
      </footer>
    </div>
  );
}
