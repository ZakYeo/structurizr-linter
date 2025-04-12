// src/tokenizer.ts
import moo from "moo";

export const lexer = moo.compile({
  ws:      { match: /[ \t]+/, lineBreaks: false },
  newline: { match: /\r?\n/, lineBreaks: true },
  comment: /\/\/.*?$/,
  lbrace:  '{',
  rbrace:  '}',
  arrow:   '->',
  equals:  '=',
  string:  /"(?:\\["\\]|[^\n"\\])*"/,
  hex:     /#[0-9a-fA-F]{6}/,
  star:    '*',
  path: /[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_-]+)+/,
  ident:   /[a-zA-Z_][a-zA-Z0-9_-]*/,
});


export function tokenize(input: string) {
  lexer.reset(input);
  return Array.from(lexer);
}

