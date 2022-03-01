export enum KeyboardShortcuts {
  'selectAll' = 'selectAll',

  'delete' = 'delete',
  'deleteBackward' = 'deleteBackward',
  'deleteForward' = 'deleteForward',
  'deleteToEndOfParagraph' = 'deleteToEndOfParagraph',
  'deleteWordForward' = 'deleteWordForward',
  'deleteWordBackward' = 'deleteWordBackward',
  'deleteToBeginningOfLine' = 'deleteToBeginningOfLine',
}

export type IKeyboardShortcut = keyof typeof KeyboardShortcuts;
