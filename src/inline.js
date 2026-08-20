import { LanguageError } from './errors.js';

function append(nodes, node) {
  if (node.type === 'text' && node.value === '') return;
  const previous = nodes.at(-1);
  if (node.type === 'text' && previous?.type === 'text') {
    previous.value += node.value;
  } else {
    nodes.push(node);
  }
}

function rawHtmlIndex(value) {
  const match = /<(?:\/?[A-Za-z][^>]*|!--.*?--|![A-Za-z][^>]*|\?.*?\?)>/.exec(value);
  return match?.index ?? -1;
}

function linkDestinationEnd(value, start) {
  let depth = 1;
  for (let index = start; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
    } else if (value[index] === '(') {
      depth += 1;
    } else if (value[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

export function parseInline(value, location) {
  const htmlAt = rawHtmlIndex(value);
  if (htmlAt >= 0) {
    throw new LanguageError(
      location.path,
      location.line,
      location.column + htmlAt,
      'E_RAW_HTML',
      'raw HTML is not allowed',
    );
  }

  const nodes = [];
  let cursor = 0;

  while (cursor < value.length) {
    if (value.startsWith('**', cursor)) {
      const close = value.indexOf('**', cursor + 2);
      if (close > cursor + 2) {
        append(nodes, {
          type: 'strong',
          children: parseInline(value.slice(cursor + 2, close), {
            ...location,
            column: location.column + cursor + 2,
          }),
        });
        cursor = close + 2;
        continue;
      }
    }

    if (value[cursor] === '*') {
      const close = value.indexOf('*', cursor + 1);
      if (close > cursor + 1) {
        append(nodes, {
          type: 'emphasis',
          children: parseInline(value.slice(cursor + 1, close), {
            ...location,
            column: location.column + cursor + 1,
          }),
        });
        cursor = close + 1;
        continue;
      }
    }

    if (value[cursor] === '[') {
      const labelEnd = value.indexOf('](', cursor + 1);
      const urlEnd = labelEnd >= 0 ? linkDestinationEnd(value, labelEnd + 2) : -1;
      if (labelEnd > cursor + 1 && urlEnd > labelEnd + 2) {
        append(nodes, {
          type: 'link',
          url: value.slice(labelEnd + 2, urlEnd),
          children: parseInline(value.slice(cursor + 1, labelEnd), {
            ...location,
            column: location.column + cursor + 1,
          }),
        });
        cursor = urlEnd + 1;
        continue;
      }
    }

    let next = value.length;
    for (const token of ['**', '*', '[']) {
      const found = value.indexOf(token, cursor + 1);
      if (found >= 0) next = Math.min(next, found);
    }
    append(nodes, { type: 'text', value: value.slice(cursor, next) });
    cursor = next;
  }

  return nodes;
}

export function parseTickerInline(value, location) {
  const htmlAt = rawHtmlIndex(value);
  if (htmlAt >= 0) {
    throw new LanguageError(
      location.path,
      location.line,
      location.column + htmlAt,
      'E_RAW_HTML',
      'raw HTML is not allowed',
    );
  }

  const parts = [];
  let cursor = 0;
  while (cursor < value.length) {
    const open = value.indexOf('{{', cursor);
    const strayClose = value.indexOf('}}', cursor);
    if (strayClose >= 0 && (open < 0 || strayClose < open)) {
      throw new LanguageError(
        location.path,
        location.line,
        location.column + strayClose,
        'E_UNCLOSED_VERTICAL',
        'vertical alternatives have an unmatched closing brace',
      );
    }
    if (open < 0) {
      if (cursor < value.length) parts.push({ type: 'text', value: value.slice(cursor) });
      break;
    }
    if (open > cursor) parts.push({ type: 'text', value: value.slice(cursor, open) });

    const close = value.indexOf('}}', open + 2);
    if (close < 0) {
      throw new LanguageError(
        location.path,
        location.line,
        location.column + open,
        'E_UNCLOSED_VERTICAL',
        'vertical alternatives are missing closing braces',
      );
    }

    const rawChoices = value.slice(open + 2, close);
    const choices = rawChoices.split('|').map((choice) => choice.trim());
    const invalid = choices.length < 2
      || choices.some((choice) => choice === '' || choice.includes('{') || choice.includes('}'));
    if (invalid) {
      throw new LanguageError(
        location.path,
        location.line,
        location.column + open,
        'E_VERTICAL_CHOICES',
        'vertical alternatives require at least two non-empty choices',
      );
    }
    parts.push({ type: 'vertical', choices });
    cursor = close + 2;
  }

  return parts;
}
