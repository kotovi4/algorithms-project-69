// Exact word search function
// docs: array of objects { id: string, text: string }
// term: string to search (single word)
// Returns array of document ids containing the term as a whole word (case-insensitive)

const isWordChar = (ch) => /[A-Za-z0-9_]/.test(ch);

export default function search(docs, term) {
  if (!Array.isArray(docs) || typeof term !== 'string' || term.length === 0) {
    return [];
  }
  // Считаем, что поиск только по одному слову без пробелов
  if (/\s/.test(term)) {
    return [];
  }
  const needle = term.toLowerCase();
  const nLen = needle.length;
  if (nLen === 0) return [];

  const result = [];

  for (const doc of docs) {
    if (!doc || typeof doc.id !== 'string' || typeof doc.text !== 'string') continue;
    const text = doc.text;
    const lower = text.toLowerCase();
    let found = false;
    let fromIndex = 0;
    while (true) {
      const idx = lower.indexOf(needle, fromIndex);
      if (idx === -1) break;
      const beforeChar = idx > 0 ? text[idx - 1] : null;
      const afterPos = idx + nLen;
      const afterChar = afterPos < text.length ? text[afterPos] : null;
      const beforeOk = beforeChar == null || !isWordChar(beforeChar);
      const afterOk = afterChar == null || !isWordChar(afterChar);
      if (beforeOk && afterOk) {
        found = true;
        break; // достаточно одного совпадения на документ
      }
      fromIndex = idx + 1; // продолжаем поиск дальше
    }
    if (found) result.push(doc.id);
  }

  return result;
}
