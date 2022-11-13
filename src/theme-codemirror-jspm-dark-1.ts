import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const chalky = "#e5c07b";
const cyan = "#56b6c2";
const invalid = "#ffffff";
const ivory = "#abb2bf";
const stone = "#7d8799"; // Brightened compared to original to increase contrast
const malibu = "#61afef";
const violet = "#c678dd";
const darkBackground = "#21252b";
const highlightBackground = "#2c313a";
const background = "#282c34";
const tooltipBackground = "#353a42";
const selection = "#3E4451";
const cursor = "#528bff";

const coral = "#fb4934";
const name = "#ebdbb2";
const sage = "#b8bb26";
const whiskey = "#fabd2f";

/// The colors used in the theme, as CSS color strings.
export const color = {
  chalky,
  coral,
  cyan,
  invalid,
  ivory,
  stone,
  malibu,
  sage,
  whiskey,
  violet,
  darkBackground,
  highlightBackground,
  background,
  tooltipBackground,
  selection,
  cursor,
};
const settings = {
  background: "#000000",
  foreground: "#fff3b0",
  caret: "#fd9e02",
  selection: "#14213d",
  lineHighlight: "#212c54",
  gutterBackground: "#000000",
  gutterForeground: "#b51fc97d",
};
/// The editor theme styles for One Dark.
export const oneDarkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: settings.background,
      color: settings.foreground,
    },

    ".cm-content": {
      caretColor: settings.caret,
      fontFamily: "DM Mono",
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: settings.caret },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: settings.selection },

    ".cm-panels": { backgroundColor: darkBackground, color: ivory },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },

    ".cm-searchMatch": {
      backgroundColor: "#72a1ff59",
      outline: "1px solid #457dff",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#6199ff2f",
    },

    ".cm-activeLine": { backgroundColor: settings.lineHighlight },
    ".cm-selectionMatch": { backgroundColor: "#aafe661a" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "#bad0f847",
      outline: "1px solid #515a6b",
    },

    ".cm-gutters": {
      backgroundColor: settings.gutterBackground,
      color: settings.gutterForeground,
      border: "none",
    },

    ".cm-activeLineGutter": {
      backgroundColor: settings.lineHighlight,
    },

    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: "#ddd",
    },

    ".cm-tooltip": {
      border: "none",
      backgroundColor: tooltipBackground,
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: tooltipBackground,
      borderBottomColor: tooltipBackground,
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: highlightBackground,
        color: ivory,
      },
    },
  },
  { dark: true }
);

/// The highlighting style for code in the One Dark theme.
export const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  {
    tag: t.variableName,
    color: "#ffbe0b",
  },
  {
    tag: [t.string],
    color: "#fefae0",
  },
  {
    tag: t.null,
    color: "#fb5607",
  },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: name,
  },

  {
    tag: t.angleBracket,
    color: "#06d6a0",
  },
  { tag: [t.function(t.variableName), t.labelName], color: malibu },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: ivory },
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: "#ff595e",
  },
  {
    tag: [
      t.operator,
      t.operatorKeyword,
      t.url,
      t.escape,
      t.regexp,
      t.link,
      t.special(t.string),
    ],
    color: "#ef476f",
  },
  { tag: [t.meta, t.comment], color: stone },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: stone, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: coral },
  {
    tag: [t.special(t.brace)],
    color: "#06d6a0",
  },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#ef233c" },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#fefae0' },
  { tag: t.invalid, color: invalid },

  {
    tag: t.tagName,
    color: "#ff006e",
  },
  {
    tag: t.url,
    color: violet,
  },
]);

/// Extension to enable the One Dark theme (both the editor theme and
/// the highlight style).
export const jspmDark: Extension = [
  oneDarkTheme,
  syntaxHighlighting(oneDarkHighlightStyle),
];
