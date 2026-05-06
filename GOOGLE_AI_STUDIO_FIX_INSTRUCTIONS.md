# Google AI Studio 修正指示書

## 最重要ルール

この指示書に書かれている内容以外は、絶対に変更・修正・リファクタリングしないでください。

- UIデザイン、配色、レイアウト、文言、アニメーションを勝手に変更しないこと。
- 既存機能の追加・削除・仕様変更を勝手に行わないこと。
- ファイル構成を勝手に変えないこと。
- コンポーネント分割、命名変更、大規模リファクタリングを行わないこと。
- 依存パッケージを勝手に追加しないこと。
- 指示対象外の警告・lint・型・スタイルをついでに直さないこと。
- トークルーム内のメッセージ、スタンプ、フキダシ削除仕様を変更しないこと。

今回やることは、以下の2点だけです。

1. スクショ機能が完全に削除されているか確認し、残骸があれば削除する。
2. アップロード済みスタンプ・絵文字一覧の削除ボタンで、該当アップロードグループだけ削除できるように直す。

## 現在確認できている状態

対象プロジェクトは React / TypeScript / Vite です。

主な関連ファイル:

- `src/App.tsx`
- `src/components/UploadSection.tsx`
- `src/components/PhonePreview.tsx`
- `src/components/StickerPanel.tsx`
- `src/hooks/useStickerGroups.ts`
- `src/types.ts`
- `package.json`

現状、`src/App.tsx` ではスクショボタン本体は削除済みで、ヘッダーに `{/* Removed capture button */}` だけが残っています。

ただし、スクショ機能の名残と思われるものが残っています。

- `src/App.tsx` の `phoneFrameRef`
- `src/components/PhonePreview.tsx` の `phoneFrameRef` prop と `ref={phoneFrameRef}`
- `src/components/PhonePreview.tsx` の `screenshot-ignore` class
- `package.json` の `html-to-image` / `html2canvas`

また、アップロード一覧側は `UploadSection` で `onRemoveGroup(group.id, 'sticker')` / `onRemoveGroup(group.id, 'emoji')` を呼ぶ構造です。

削除処理は `App.tsx` の `handleRemoveGroup` から `useStickerGroups.ts` の `removeStickerGroup` / `removeEmojiGroup` に渡っています。

## 修正1: スクショ機能の確認と残骸削除

スクショ機能は使えないため、復活させないでください。

やってよいこと:

- スクショ機能に関係する未使用コード、未使用ref、未使用class、未使用dependencyを削除する。
- `capture`, `screenshot`, `html2canvas`, `html-to-image`, `phoneFrameRef`, `screenshot-ignore` などを検索し、実際にスクショ用途だけで残っているものを削除する。

やってはいけないこと:

- スクショボタンを再追加しない。
- スクショ保存機能を実装しない。
- html2canvas / html-to-image を使った代替実装を作らない。
- トークルームの表示仕様を変えない。

具体的な修正方針:

1. `src/App.tsx`
   - `phoneFrameRef` がスクショ用途でしか使われていない場合は削除する。
   - `PhonePreview` へ渡している `phoneFrameRef={phoneFrameRef}` を削除する。
   - `{/* Removed capture button */}` のような空の名残コメントは削除してよい。
   - 空になった `div` が不要なら、その空要素だけ削除してよい。

2. `src/components/PhonePreview.tsx`
   - `PhonePreviewProps` から `phoneFrameRef` を削除する。
   - props 分割代入から `phoneFrameRef` を削除する。
   - ルート要素の `ref={phoneFrameRef}` を削除する。
   - `screenshot-ignore` class がスクショ除外用途だけなら削除し、通常の `div` に戻す。表示構造は変えない。

3. `package.json`
   - プロジェクト内で `html-to-image` と `html2canvas` がどこからも import / 使用されていないことを確認する。
   - 未使用であれば `dependencies` から `html-to-image` と `html2canvas` を削除する。
   - `package-lock.json` も整合するように更新する。
   - ただし、他用途で使われている場合は削除しない。

## 修正2: アップロード済み一覧の削除ボタンを正しく動かす

目的:

アップロード欄に表示されているスタンプ・絵文字グループの横の削除ボタンを押したら、そのアップロードグループだけを一覧とスタンプ選択パネルから削除してください。

絶対条件:

- トークルームにすでに送信・プレビュー済みのスタンプや絵文字は削除しない。
- トークルーム内のフキダシ、メッセージ、スタンプ表示はそのまま残す。
- `messages` state を変更しない。
- `inputText` state も、今回のアップロード一覧削除では変更しない。
- トークルーム内の削除ボタンは、今まで通りトークルーム内のメッセージだけを削除する。
- アップロード一覧の削除ボタンと、トークルーム内の削除ボタンの責務を混ぜない。

重要:

アップロードグループ削除時に `URL.revokeObjectURL` / `revokeManagedObjectURL` を呼ぶと、トークルーム内に残っている送信済みスタンプ画像まで表示できなくなる可能性があります。

そのため、今回の「アップロード一覧から削除」では、原則として該当グループの object URL を revoke しないでください。

削除するのは以下だけです。

- `stickerGroups` または `emojiGroups` から該当 `group.id` のグループを取り除く。
- 削除したグループが active group だった場合、残っている同カテゴリの先頭グループを active にする。残りがなければ `null` にする。

## 推奨実装

`src/hooks/useStickerGroups.ts` の `removeStickerGroup` / `removeEmojiGroup` を、現在の配列に基づいて次の active group を決める形に修正してください。

現在の問題になりやすい点:

- `removeStickerGroup` / `removeEmojiGroup` が `prev.filter(...)` だけで終わっている。
- active id の更新が別 state と別タイミングになっており、削除後の表示が残って見える可能性がある。
- 削除対象が active だった場合の次の active group が明確に設定されていない。

実装方針:

```ts
const removeStickerGroup = useCallback((id: string) => {
  setStickerGroups((prev) => {
    const next = prev.filter((g) => g.id !== id);
    setActiveStickerGroupId((current) => {
      if (current !== id) return current;
      return next[0]?.id ?? null;
    });
    return next;
  });
}, []);

const removeEmojiGroup = useCallback((id: string) => {
  setEmojiGroups((prev) => {
    const next = prev.filter((g) => g.id !== id);
    setActiveEmojiGroupId((current) => {
      if (current !== id) return current;
      return next[0]?.id ?? null;
    });
    return next;
  });
}, []);
```

この方針から大きく外れないでください。

必要であれば `handleRemoveGroup` の `confirm` は残してよいです。削除できない原因が `confirm` にあると判断できる場合だけ、確認文言を維持した上で最小限の修正をしてください。

## UploadSection の扱い

`src/components/UploadSection.tsx` は、現状の見た目を変えないでください。

やってよいこと:

- 削除ボタンが確実にクリックできるように、必要最小限の `type="button"` / `onClick` / `disabled` / `aria-label` などを調整する。
- `onRemoveGroup(group.id, 'sticker')` と `onRemoveGroup(group.id, 'emoji')` の呼び出しを維持する。

やってはいけないこと:

- 一覧のデザインを変えない。
- アップロードボタンの文言を変えない。
- ファイル読み込みロジックを変えない。
- ZIP / PNG の検証仕様を変えない。
- スタンプや絵文字の件数制限を変えない。

## トークルーム側の削除仕様

`PhonePreview` / `MessageBubble` 側の削除は、トークルーム内のメッセージ削除だけにしてください。

現在の `App.tsx` では以下のような責務で問題ありません。

```tsx
onRemoveMessage={(id: string) => setMessages((prev) => prev.filter((m) => m.id !== id))}
```

この処理をアップロード済みグループ削除と連動させないでください。

## 受け入れ条件

修正後、以下を必ず確認してください。

1. スタンプPNGをアップロードする。
2. アップロード一覧に表示されたスタンプグループ横の削除ボタンを押す。
3. そのグループがアップロード一覧から消える。
4. そのグループがトークルーム下部のスタンプ選択パネルからも消える。
5. 事前にトークルームへ送信していたスタンプメッセージは消えない。
6. 事前にトークルームへ送信していたスタンプ画像も表示されたまま。
7. 絵文字PNGでも同じ動作になる。
8. トークルーム内のメッセージ削除ボタンは、従来通りそのメッセージだけを削除する。
9. スクショボタン、スクショ保存機能、スクショ関連UIが復活していない。
10. `npm run lint` が通る。
11. `npm run build` が通る。

## 最終報告で必ず書くこと

修正後、以下だけを簡潔に報告してください。

- 変更したファイル名
- スクショ機能の残骸を削除したかどうか
- アップロード一覧の削除ボタンで削除できるようになったか
- トークルーム内の送信済みスタンプ・絵文字を残す仕様を守ったか
- `npm run lint` / `npm run build` の結果

## 再確認

この修正では、指示されていない改善やリファクタリングは禁止です。

「ついでに良くする」「気になったところを直す」「構造を整理する」はしないでください。

今回のゴールは、スクショ残骸の整理と、アップロード済み一覧の削除ボタン修正だけです。
