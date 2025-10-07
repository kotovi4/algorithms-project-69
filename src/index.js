// Exact word search function
// docs: array of objects { id: string, text: string }
// term: string to search (single word)
// Returns array of document ids containing the term as a whole word (case-insensitive)

const isWordChar = (ch) => /[A-Za-z0-9_]/.test(ch);

export default function search(docs, term) {
  if (!Array.isArray(docs) || typeof term !== 'string' || term.length === 0) {
    return [];
  }
  if (/\s/.test(term)) {
    return [];
  }
  const needle = term.toLowerCase();
  const nLen = needle.length;
  if (nLen === 0) return [];

  const collected = [];

  docs.forEach((doc, order) => {
    if (!doc || typeof doc.id !== 'string' || typeof doc.text !== 'string') return;
    const text = doc.text;
    const lower = text.toLowerCase();
    let fromIndex = 0;
    let count = 0;
    while (true) {
      const idx = lower.indexOf(needle, fromIndex);
      if (idx === -1) break;
      const beforeChar = idx > 0 ? text[idx - 1] : null;
      const afterPos = idx + nLen;
      const afterChar = afterPos < text.length ? text[afterPos] : null;
      const beforeOk = beforeChar == null || !isWordChar(beforeChar);
      const afterOk = afterChar == null || !isWordChar(afterChar);
      if (beforeOk && afterOk) {
        count += 1;
        fromIndex = idx + nLen; // пропускаем найденное слово
      } else {
        fromIndex = idx + 1; // сдвиг на один символ если не границы слова
      }
    }
    if (count > 0) {
      collected.push({ id: doc.id, count, order });
    }
  });

  collected.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count; // большее количество выше
    return a.order - b.order; // стабильность исходного порядка
  });

  return collected.map((d) => d.id);
}
