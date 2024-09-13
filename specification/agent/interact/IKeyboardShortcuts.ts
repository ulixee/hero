export enum KeyboardShortcuts {
  'selectAll' = 'selectAll',

  'copy' = 'copy',
  'cut' = 'cut',
  'paste' = 'paste',
  'pasteAndMatchStyle' = 'pasteAndMatchStyle',
  'undo' = 'undo',
  'redo' = 'redo',
  'deleteToEndOfParagraph' = 'deleteToEndOfParagraph',
  'deleteWordForward' = 'deleteWordForward',
  'deleteWordBackward' = 'deleteWordBackward',
  'deleteToBeginningOfLine' = 'deleteToBeginningOfLine',
}

export type IKeyboardShortcut = keyof typeof KeyboardShortcuts;
