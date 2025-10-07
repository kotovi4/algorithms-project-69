// Search function
// docs: Array<{ id: string, text: string }>
// query: строка запроса: одно или несколько слов через пробел(ы)
// Поведение:
//  - разделяет запрос на слова, дедуплицирует для подсчёта уникальных
//  - слово матчит только по целым токенам (границы: символы вне [A-Za-z0-9_])
//  - документ релевантен, если содержит хотя бы одно слово
//  - ранжирование: сначала по количеству уникальных совпавших слов (desc), затем по суммарному числу всех вхождений (desc), затем стабильность исходного порядка
// Возвращает: массив id документов в порядке убывания релевантности
// Регистронезависимо
// Поддержка спецсимволов в словах (например: $5)

const isWordChar = (ch) => /[A-Za-z0-9_]/.test(ch);

const countOccurrences = (text, needle) => {
  if (!needle) return 0;
  const lower = text.toLowerCase();
  const needleLower = needle.toLowerCase();
  const nLen = needleLower.length;
  if (nLen === 0) return 0;
  let fromIndex = 0;
  let count = 0;
  while (true) {
    const idx = lower.indexOf(needleLower, fromIndex);
    if (idx === -1) break;
    const beforeChar = idx > 0 ? text[idx - 1] : null;
    const afterPos = idx + nLen;
    const afterChar = afterPos < text.length ? text[afterPos] : null;
    const beforeOk = beforeChar == null || !isWordChar(beforeChar);
    const afterOk = afterChar == null || !isWordChar(afterChar);
    if (beforeOk && afterOk) {
      count += 1;
      fromIndex = idx + nLen;
    } else {
      fromIndex = idx + 1;
    }
  }
  return count;
};

export function buildInvertedIndex(docs) {
  if (!Array.isArray(docs)) return {};
  const index = {};
  docs.forEach((doc) => {
    if (!doc || typeof doc.id !== 'string' || typeof doc.text !== 'string') return;
    // Токенизация: последовательности символов [A-Za-z0-9_$']
    const matches = doc.text.match(/[A-Za-z0-9_$']+/g);
    if (!matches) return;
    const seen = new Set();
    matches.forEach((raw) => {
      const word = raw.toLowerCase();
      if (word.length === 0) return;
      if (seen.has(word)) return; // избегаем повторного добавления doc.id для этого слова
      seen.add(word);
      if (!index[word]) index[word] = [];
      index[word].push(doc.id);
    });
  });
  return index;
}

export default function search(docs, query) {
  if (!Array.isArray(docs) || typeof query !== 'string') {
    return [];
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  // Разрешаем несколько слов: разбиваем по пробельным символам
  const rawWords = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (rawWords.length === 0) return [];

  // Набор уникальных искомых слов (дедупликация для метрик)
  const uniqueWords = Array.from(new Set(rawWords.map((w) => w.toLowerCase())));

  const results = [];

  docs.forEach((doc, order) => {
    if (!doc || typeof doc.id !== 'string' || typeof doc.text !== 'string') return;
    let uniqueMatched = 0;
    let totalOccurrences = 0;

    uniqueWords.forEach((word) => {
      const occ = countOccurrences(doc.text, word);
      if (occ > 0) {
        uniqueMatched += 1;
        totalOccurrences += occ;
      }
    });

    if (uniqueMatched > 0) {
      results.push({ id: doc.id, uniqueMatched, totalOccurrences, order });
    }
  });

  results.sort((a, b) => {
    if (b.uniqueMatched !== a.uniqueMatched) return b.uniqueMatched - a.uniqueMatched; // больше уникальных слов
    if (b.totalOccurrences !== a.totalOccurrences) return b.totalOccurrences - a.totalOccurrences; // затем суммарные вхождения
    return a.order - b.order; // стабильность
  });

  return results.map((r) => r.id);
}
