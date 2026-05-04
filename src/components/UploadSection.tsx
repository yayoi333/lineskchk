import React, { useRef } from 'react';
import { Upload, ImageIcon, Smile } from 'lucide-react';

interface UploadSectionProps {
  onZipUpload: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void;
  onPngUpload: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void;
  stickerGroupsCount: number;
  emojiGroupsCount: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  onZipUpload, 
  onPngUpload, 
  stickerGroupsCount, 
  emojiGroupsCount 
}) => {
  const stickerZipRef = useRef<HTMLInputElement>(null);
  const stickerPngRef = useRef<HTMLInputElement>(null);
  const emojiZipRef = useRef<HTMLInputElement>(null);
  const emojiPngRef = useRef<HTMLInputElement>(null);

  const handleResetAndCall = (
    e: React.ChangeEvent<HTMLInputElement>, 
    callback: (e: React.ChangeEvent<HTMLInputElement>, category: 'sticker' | 'emoji') => void, 
    category: 'sticker' | 'emoji'
  ) => {
    callback(e, category);
    e.target.value = ''; // Reset so the same file can be selected again
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
      {/* Sticker Upload */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <Upload size={16} /> 1. スタンプをアップロード
        </h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={stickerZipRef} 
            className="hidden" 
            accept=".zip" 
            onChange={(e) => handleResetAndCall(e, onZipUpload, 'sticker')} 
          />
          <button 
            onClick={() => stickerZipRef.current?.click()}
            disabled={stickerGroupsCount >= 5}
            className="flex-1 bg-[#06C755] text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#05b34d] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:active:scale-100 shadow-sm shadow-green-200"
          >
            <Upload size={18} />
            <div className="text-left">
              <p className="text-[13px]">ZIPで一括追加</p>
              <p className="text-[9px] opacity-70 font-normal">main.png / tab.png 必須</p>
            </div>
          </button>
          
          <input 
            type="file" 
            ref={stickerPngRef} 
            className="hidden" 
            accept=".png" 
            multiple 
            onChange={(e) => handleResetAndCall(e, onPngUpload, 'sticker')} 
          />
          <button 
            onClick={() => stickerPngRef.current?.click()}
            disabled={stickerGroupsCount >= 5}
            className="flex-1 bg-white text-[#06C755] border-2 border-[#06C755] py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <ImageIcon size={18} />
            <div className="text-left">
              <p className="text-[13px]">PNGで追加</p>
              <p className="text-[9px] opacity-70 font-normal">複数選択可能</p>
            </div>
          </button>
        </div>
      </div>

      {/* Emoji Upload */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
          <Smile size={16} /> 絵文字をアップロード (任意)
        </h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={emojiZipRef} 
            className="hidden" 
            accept=".zip" 
            onChange={(e) => handleResetAndCall(e, onZipUpload, 'emoji')} 
          />
          <button 
            onClick={() => emojiZipRef.current?.click()}
            disabled={emojiGroupsCount >= 5}
            className="flex-1 bg-gray-100 text-gray-500 py-2.5 px-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <p className="text-xs">ZIP追加</p>
          </button>
          <input 
            type="file" 
            ref={emojiPngRef} 
            className="hidden" 
            accept=".png" 
            multiple 
            onChange={(e) => handleResetAndCall(e, onPngUpload, 'emoji')} 
          />
          <button 
            onClick={() => emojiPngRef.current?.click()}
            disabled={emojiGroupsCount >= 5}
            className="flex-1 bg-white text-gray-400 border border-gray-200 py-2.5 px-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <p className="text-xs">PNG追加</p>
          </button>
        </div>
      </div>
    </div>
  );
};
