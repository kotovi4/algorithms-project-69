// Search function
// docs: Array<{ id: string, text: string }>
// query: строка запроса: одно или несколько слов через пробел(ы)
// Поведение:
//  - разделяет запрос на слова, дедуплицирует для подсчёта уникальных
//  - слово матчит только по целым токенам (границы: символы вне [A-Za-z0-9_])
//  - документ релевантен, если содержит хотя бы одно слово
// Ранжирование теперь основано на TF-IDF:
//  - tf(word, doc) = количество целых вхождений слова в документ (используем лог-нормализацию 1 + ln(tf) при tf > 0)
//  - idf(word) = ln(N / df(word)), где N — общее число документов, df — число документов, содержащих слово
// Итоговый ранжирующий набор метрик:
//  - uniqueScore(doc) = Σ idf(w) по всем уникальным словам запроса, присутствующим в документе
//  - freqScore(doc) = Σ (1 + ln(tf(w, d))) * idf(w)
// Сортировка (финальная схема):
// 1. uniqueScore desc (охват разных редких слов)
// 2. freqScore desc (усиление документов с большим числом вхождений при лог-нормализации)
// 3. Стабильный исходный порядок.
// Это уменьшает влияние повторного «спама» одного слова: сначала важен охват разных редких слов, затем минимальная избыточность.
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

  const rawWords = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (rawWords.length === 0) return [];
  const uniqueWords = Array.from(new Set(rawWords.map((w) => w.toLowerCase())));

  const totalDocs = docs.length;
  if (totalDocs === 0) return [];

  // Подсчёт tf для каждого документа и каждого слова + df для слов
  const dfMap = Object.create(null); // word -> df count
  const perDocCounts = []; // массив объектов word->tf для документа

  docs.forEach((doc, order) => {
    if (!doc || typeof doc.id !== 'string' || typeof doc.text !== 'string') {
      perDocCounts[order] = null;
      return;
    }
    const counts = {};
    let matchedAny = false;
    uniqueWords.forEach((word) => {
      const occ = countOccurrences(doc.text, word);
      if (occ > 0) {
        counts[word] = occ;
        matchedAny = true;
        dfMap[word] = (dfMap[word] || 0) + 1;
      }
    });
    perDocCounts[order] = matchedAny ? counts : null;
  });

  // Вычисление idf: log(N/df)
  const idfMap = Object.create(null);
  Object.entries(dfMap).forEach(([word, df]) => {
    // df >=1, df <= totalDocs => N/df >=1 => idf >=0
    idfMap[word] = Math.log(totalDocs / df);
  });

  const results = [];
  docs.forEach((doc, order) => {
    const counts = perDocCounts[order];
    if (!counts) return; // нет совпадений
    let uniqueScore = 0;
    let freqScore = 0;
    Object.entries(counts).forEach(([word, tf]) => {
      const idf = idfMap[word];
      if (idf === undefined) return;
      uniqueScore += idf;
      const tfWeight = 1 + Math.log(tf);
      freqScore += tfWeight * idf;
    });
    results.push({ id: doc.id, uniqueScore, freqScore, order });
  });

  results.sort((a, b) => {
    if (b.uniqueScore !== a.uniqueScore) return b.uniqueScore - a.uniqueScore;
    if (b.freqScore !== a.freqScore) return b.freqScore - a.freqScore;
    return a.order - b.order;
  });

  return results.map((r) => r.id);
}
