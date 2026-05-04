import { VALIDATION_CRITERIA } from '../constants';
import { Sticker, ValidationError, ValidationWarning, ValidationResult } from '../types';

export const validateImageSize = (file: File): boolean => {
  return file.size <= 1024 * 1024; // 1MB
};

export const validateDimensions = (width: number, height: number): boolean => {
  return width <= 370 && height <= 320;
};

export const validateMainImage = (width: number, height: number): boolean => {
  return width === 240 && height === 240;
};

export const validateTabImage = (width: number, height: number): boolean => {
  return width === 96 && height === 74;
};

export const getBasename = (path: string): string => {
  return path.split(/[\\/]/).pop() || '';
};

export const performValidation = (
  extractedStickers: Sticker[],
  mainImg: Sticker | null,
  tabImg: Sticker | null,
  fileSize: number
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // ZIP Size check
  if (fileSize > 20 * 1024 * 1024) {
    errors.push({ id: 'zip_size', label: 'ZIPサイズ超過', description: 'ZIPファイル全体で20MB以下である必要があります。' });
  }

  // Count check
  const stickerCount = extractedStickers.length;
  if (!VALIDATION_CRITERIA.COUNT_VARIANTS.includes(stickerCount)) {
    errors.push({ 
      id: 'count', 
      label: '枚数エラー', 
      description: `スタンプは8, 16, 24, 32, 40枚のいずれかである必要があります。（現在: ${stickerCount}枚）` 
    });
  }

  // Main / Tab presence
  if (!mainImg) {
    errors.push({ id: 'missing_main', label: 'main.png欠如', description: 'メイン画像(main.png)が必要です。' });
  }
  if (!tabImg) {
    errors.push({ id: 'missing_tab', label: 'tab.png欠如', description: 'タブ画像(tab.png)が必要です。' });
  }

  // Dimension & Individual size checks
  [...extractedStickers, mainImg, tabImg].forEach(s => {
    if (!s) return;
    
    if (s.size && s.size > 1024 * 1024) {
      errors.push({ id: `size_${s.name}`, label: '画像サイズ超過', description: `${s.name}: 1MB以下である必要があります。` });
    }

    if (s.width && s.height) {
      if (s.isMain) {
        if (!validateMainImage(s.width, s.height)) {
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: 240x240pxである必要があります。（現在: ${s.width}x${s.height}）` });
        }
      } else if (s.isTab) {
        if (!validateTabImage(s.width, s.height)) {
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: 96x74pxである必要があります。（現在: ${s.width}x${s.height}）` });
        }
      } else {
        if (!validateDimensions(s.width, s.height)) {
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: W370xH320px以内である必要があります。（現在: ${s.width}x${s.height}）` });
        }
      }
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    counts: {
      stickers: stickerCount,
      hasMain: !!mainImg,
      hasTab: !!tabImg
    }
  };
};
