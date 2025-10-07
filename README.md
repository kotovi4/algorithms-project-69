### Hexlet tests and linter status:
[![Actions Status](https://github.com/kotovi4/algorithms-project-69/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kotovi4/algorithms-project-69/actions)

# Exact Word Search Engine

Простой поисковый движок с поддержкой:
- Чёткого поиска по целым словам
- Нечёткого многословного запроса (документ попадает в результаты, если содержит хотя бы одно слово из запроса)
- Ранжирования результатов по релевантности

## Релевантность (метрика)
Используется модифицированный TF-IDF с антиспам-логикой.

Определения базовых величин:
- tf(w, d) — количество целых вхождений слова w в документ d
- Нормализация TF: tf' = 1 + ln(tf)
- df(w) — количество документов, содержащих слово w
- idf(w) = ln(N / df(w)), где N — общее число документов

Промежуточные метрики:
- uniqueScore(d) = Σ idf(w) по всем уникальным словам запроса, встречающимся в документе
- freqScore(d) = Σ (1 + ln(tf(w, d))) * idf(w)

Сортировка результатов:
1. uniqueScore по убыванию (охват редких слов важнее)
2. Если запрос состоит из одного слова — freqScore по убыванию (больше точных вхождений выше)
   Иначе (несколько слов) — freqScore по возрастанию (меньше «спама» предпочтительнее при одинаковом охвате)
3. Стабильный исходный порядок при полном равенстве

Замечания:
- Слова, встречающиеся во всех документах (idf = 0), не влияют на счёт.
- Повторяющиеся слова в запросе дедуплицируются — повтор не увеличивает вклад напрямую.

## Пример (одно слово)
```javascript
import search from '@hexlet/code';

const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
const doc3 = { id: 'doc3', text: "I'm your shooter." };
const docs = [doc1, doc2, doc3];

console.log(search(docs, 'shoot')); // ['doc2', 'doc1']
```

## Пример (нечёткий многословный запрос)
```javascript
console.log(search(docs, 'shoot at me')); // ['doc2', 'doc1']
```
Разбор:
- Запрос: shoot, at, me
- doc2: shoot ×3, at ×1, me ×1 => уникальных 3, всего 5
- doc1: shoot ×1 => уникальных 1, всего 1

## Поведение
- Регистронезависимо
- Целые слова: границы — символы вне [A-Za-z0-9_]
- Повторяющиеся слова в запросе не увеличивают счётчик «уникальных»
- Спецсимволы внутри слова (например `$5`) поддерживаются

## Команды
```bash
npm test      # Запуск тестов
npm run lint  # Запуск ESLint
```

## Лицензия
ISC

## Обратный индекс
Функция `buildInvertedIndex(docs)` возвращает объект вида слово -> массив id документов, где встречается слово (каждый документ максимум один раз на слово).

Пример:
```javascript
import { buildInvertedIndex } from '@hexlet/code';

const doc1 = { id: 'doc1', text: 'some text' };
const doc2 = { id: 'doc2', text: 'some text too' };

console.log(buildInvertedIndex([doc1, doc2]));
// {
//   some: ['doc1', 'doc2'],
//   text: ['doc1', 'doc2'],
//   too: ['doc2']
// }
```
