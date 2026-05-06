import React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Smile } from 'lucide-react';
import { Sticker, StickerGroup } from '../types';

interface StickerPanelProps {
  activePanelTab: 'sticker' | 'emoji';
  setActivePanelTab: React.Dispatch<React.SetStateAction<'sticker' | 'emoji'>>;
  stickerGroups: StickerGroup[];
  emojiGroups: StickerGroup[];
  activeStickerGroupId: string | null;
  activeEmojiGroupId: string | null;
  setActiveStickerGroupId: (id: string | null) => void;
  setActiveEmojiGroupId: (id: string | null) => void;
  onSelect: (item: Sticker) => void;
}

export const StickerPanel: React.FC<StickerPanelProps> = ({
  activePanelTab,
  setActivePanelTab,
  stickerGroups,
  emojiGroups,
  activeStickerGroupId,
  activeEmojiGroupId,
  setActiveStickerGroupId,
  setActiveEmojiGroupId,
  onSelect
}) => {
  const currentGroups = activePanelTab === 'sticker' ? stickerGroups : emojiGroups;
  const activeGroupId = activePanelTab === 'sticker' ? activeStickerGroupId : activeEmojiGroupId;
  const activeGroup = currentGroups.find(g => g.id === activeGroupId) || currentGroups[0];

  return (
    <div className="h-56 bg-white border-t border-gray-200 shrink-0 flex flex-col">
      {/* Category Switcher bar */}
      <div className="h-12 px-3 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 h-full">
          {/* Toggle Switch */}
          <div 
            onClick={() => setActivePanelTab(prev => prev === 'sticker' ? 'emoji' : 'sticker')}
            className="relative w-[50px] h-[30px] bg-[#2D3340] rounded-full cursor-pointer flex items-center p-0.5 transition-all overflow-hidden"
          >
            <motion.div 
              className="absolute w-[24px] h-[24px] bg-white rounded-full z-10 shadow-sm"
              animate={{ x: activePanelTab === 'sticker' ? 0 : 22 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
            <div className="flex w-full h-full relative items-center justify-around z-20">
              <Smile size={20} className={`transition-all duration-300 ${activePanelTab === 'sticker' ? 'text-[#2D3340]' : 'text-white opacity-40'}`} />
              <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all duration-300 ${activePanelTab === 'emoji' ? 'text-[#2D3340]' : 'text-white opacity-40'}`}>
                <path fill="currentColor" d="M4.5,10.6c0-1.8,1.5-3.3,3.3-3.3c0.4,0,0.8,0.1,1.1,0.2c1.1-1.2,2.7-2,4.4-2s3.3,0.8,4.4,2c0.3-0.1,0.7-0.2,1.1-0.2c1.8,0,3.3,1.5,3.3,3.3c0,1.2-0.7,2.3-1.7,2.8c0.1,0.5,0.2,1.1,0.2,1.6c0,4.4-3.6,8-8,8s-8-3.59-8-8c0-0.5,0.1-1.1,0.2-1.6C5.2,12.9,4.5,11.8,4.5,10.6z M12,14c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,14,12,14z M8,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S8.6,12,8,12z M16,12c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S16.6,12,16,12z"/>
              </svg>
            </div>
          </div>

          {/* Group Tabs */}
          <div className="flex h-full items-center gap-1">
            {currentGroups.map(group => (
              <button
                key={group.id}
                onClick={() => {
                  if (activePanelTab === 'sticker') setActiveStickerGroupId(group.id);
                  else setActiveEmojiGroupId(group.id);
                }}
                className={`h-full px-2 flex items-center justify-center transition-all min-w-[40px] rounded-t-lg ${activeGroup?.id === group.id ? 'bg-gray-100 shadow-inner' : 'opacity-40 hover:opacity-100 hover:bg-gray-50'}`}
              >
                {group.tabSticker ? (
                  <img src={group.tabSticker.url} alt="Tab" className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
                ) : (
                   <ImageIcon size={18} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {!activeGroup ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <ImageIcon size={32} />
            <p className="text-xs">{activePanelTab === 'sticker' ? 'スタンプ' : '絵文字'}がありません</p>
          </div>
        ) : (
          <div className={`grid ${activePanelTab === 'sticker' ? 'grid-cols-5 gap-2' : 'grid-cols-9 gap-1'}`}>
            {activeGroup.stickers.map(s => (
              <button 
                key={s.id}
                onClick={() => {
                  onSelect(s);
                }}
                className={`aspect-square p-1 hover:bg-gray-50 rounded-md transition-all active:scale-95 flex items-center justify-center ${activePanelTab === 'emoji' ? 'scale-110' : ''}`}
              >
                <img src={s.url} alt={s.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-4 flex items-center justify-between px-3 bg-white" />
    </div>
  );
};
