### Hexlet tests and linter status:
[![Actions Status](https://github.com/kotovi4/algorithms-project-69/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kotovi4/algorithms-project-69/actions)

# Exact Word Search Engine

Простой поисковый движок с поддержкой:
- Чёткого поиска по целым словам
- Нечёткого многословного запроса (документ попадает в результаты, если содержит хотя бы одно слово из запроса)
- Ранжирования результатов по релевантности

## Релевантность (метрика)
Порядок сортировки результатов:
1. Количество уникальных слов из запроса, найденных в документе (по убыванию)
2. Суммарное количество всех вхождений этих слов (по убыванию)
3. Стабильность: исходный порядок документов при равенстве 1 и 2

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
