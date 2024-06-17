import type { RuleInline } from 'markdown-it/lib/parser_inline';
import type { PluginSimple } from 'markdown-it';

/**
 * Looks for mentions, which have the form: <@user_id>
 */
const mentionRule: RuleInline = (state, silent) => {
  if (silent) {
    return false;
  }

  const start = state.pos;
  if (state.src.charAt(start) !== '<') {
    return false;
  }

  if (start > 0 && state.src.charAt(start - 1) === '\\') {
    return false;
  }

  const max = state.posMax;
  if (start + 1 >= max || state.src.charAt(start + 1) !== '@') {
    return false;
  }

  state.pos += 2; // Skip opening "<@"
  while (state.pos < max) {
    if (
      state.src.charAt(state.pos) === '>' &&
      state.src.charAt(state.pos - 1) !== '\\'
    ) {
      break;
    }
    state.pos++;
  }

  if (state.pos >= max) {
    state.pos = start;
    return false;
  }

  state.pos++; // Skip closing ">"

  const token = state.push('mention', '', 0);
  token.content = state.src
    .substring(start + 1, state.pos - 1) // The part inside the "<>", including the "@".
    .replace('\\>', '>'); // Un-escape any escaped ">".
  return true;
};

export const mentionPlugin: PluginSimple = (md) => {
  md.inline.ruler.before('text', 'mention', mentionRule);
};
