import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { ValidationResult } from '../types';

interface ValidationPanelProps {
  validation: ValidationResult | null;
  onClear: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validation, onClear }) => {
  if (!validation) return null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-500 flex items-center gap-2">
          <Info size={16} /> 2. ステータス
        </h2>
        <button 
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} /> 結果を消去
        </button>
      </div>
      
      <div className="space-y-3">
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${validation.passed ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {validation.passed ? <CheckCircle2 className="shrink-0" /> : <XCircle className="shrink-0" />}
          <div>
            <p className="font-bold text-sm">{validation.passed ? 'LINE準拠チェック合格' : '不備が見つかりました'}</p>
            <p className="text-xs opacity-80">{validation.passed ? 'おめでとうございます！そのままZIP化して申請可能です。' : '以下の項目を修正してください。'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold mb-1">スタンプ数</span>
            <span className={`text-lg font-bold ${validation.counts.stickers > 0 ? 'text-gray-700' : 'text-red-500'}`}>{validation.counts.stickers}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold mb-1">main.png</span>
            <span className={validation.counts.hasMain ? 'text-green-500' : 'text-red-500'}>
              {validation.counts.hasMain ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-bold mb-1">tab.png</span>
            <span className={validation.counts.hasTab ? 'text-green-500' : 'text-red-500'}>
              {validation.counts.hasTab ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </span>
          </div>
        </div>

        {validation.errors.length > 0 && (
          <div className="space-y-2">
            {validation.errors.map((error) => (
              <div key={error.id} className="flex gap-2 p-2 bg-red-50/50 rounded-lg text-xs text-red-600 border border-red-100">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{error.label}</p>
                  <p className="opacity-80 leading-relaxed">{error.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
