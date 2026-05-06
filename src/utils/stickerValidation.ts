import { VALIDATION_CRITERIA } from '../constants';
import { Sticker, ValidationError, ValidationWarning, ValidationResult } from '../types';

export const validateImageSize = (file: File): boolean => {
  return file.size <= 1024 * 1024; // 1MB
};

export const validateDimensions = (width: number, height: number, category: 'sticker' | 'emoji' = 'sticker'): boolean => {
  const criteria = category === 'emoji' ? VALIDATION_CRITERIA.EMOJI : VALIDATION_CRITERIA.STICKER;
  return width <= criteria.WIDTH && height <= criteria.HEIGHT;
};

export const validateMainImage = (width: number, height: number): boolean => {
  return width === VALIDATION_CRITERIA.MAIN_SIZE.w && height === VALIDATION_CRITERIA.MAIN_SIZE.h;
};

export const validateTabImage = (width: number, height: number): boolean => {
  return width === VALIDATION_CRITERIA.TAB_SIZE.w && height === VALIDATION_CRITERIA.TAB_SIZE.h;
};

export const getBasename = (path: string): string => {
  return path.split(/[\\/]/).pop() || '';
};

export const performValidation = (
  extractedStickers: Sticker[],
  mainImg: Sticker | null,
  tabImg: Sticker | null,
  fileSize: number,
  category: 'sticker' | 'emoji' = 'sticker'
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const criteria = category === 'emoji' ? VALIDATION_CRITERIA.EMOJI : VALIDATION_CRITERIA.STICKER;
  const labelPrefix = category === 'emoji' ? '絵文字' : 'スタンプ';

  // ZIP Size check
  if (fileSize > 20 * 1024 * 1024) {
    errors.push({ id: 'zip_size', label: 'ZIPサイズ超過', description: 'ZIPファイル全体で20MB以下である必要があります。' });
  }

  // Count check
  const stickerCount = extractedStickers.length;
  if (!criteria.COUNT_VARIANTS.includes(stickerCount)) {
    errors.push({ 
      id: 'count', 
      label: '枚数エラー', 
      description: `${labelPrefix}は${criteria.COUNT_VARIANTS.join(', ')}枚のいずれかである必要があります。（現在: ${stickerCount}枚）` 
    });
  }

  // Main / Tab presence
  if (!mainImg) {
    warnings.push({ id: 'missing_main', label: 'main.png欠損', description: 'メイン画像(main.png)が見つかりません。' });
  }
  if (!tabImg) {
    warnings.push({ id: 'missing_tab', label: 'tab.png欠損', description: 'タブ画像(tab.png)が見つかりません。一番最初のスタンプが代用されます。' });
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
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: ${VALIDATION_CRITERIA.MAIN_SIZE.w}x${VALIDATION_CRITERIA.MAIN_SIZE.h}pxである必要があります。（現在: ${s.width}x${s.height}）` });
        }
      } else if (s.isTab) {
        if (!validateTabImage(s.width, s.height)) {
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: ${VALIDATION_CRITERIA.TAB_SIZE.w}x${VALIDATION_CRITERIA.TAB_SIZE.h}pxである必要があります。（現在: ${s.width}x${s.height}）` });
        }
      } else {
        if (!validateDimensions(s.width, s.height, category)) {
          errors.push({ id: `dim_${s.name}`, label: 'サイズ不備', description: `${s.name}: ${criteria.DIMENSIONS}である必要があります。（現在: ${s.width}x${s.height}）` });
        }
      }
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    category,
    counts: {
      stickers: stickerCount,
      hasMain: !!mainImg,
      hasTab: !!tabImg
    }
  };
};
