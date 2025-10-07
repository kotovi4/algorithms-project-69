### Hexlet tests and linter status:
[![Actions Status](https://github.com/kotovi4/algorithms-project-69/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kotovi4/algorithms-project-69/actions)

# Exact Word Search Engine

Простой чёткий (по точному слову) поисковый движок.

## Установка

```bash
npm install
```

## Использование

```javascript
import search from '@hexlet/code';

const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
const doc3 = { id: 'doc3', text: "I'm your shooter." };
const docs = [doc1, doc2, doc3];

console.log(search(docs, 'shoot')); // ['doc1', 'doc2']
```

## Поведение
- Поиск по одному слову (строка без пробелов)
- Регистронезависимо
- Совпадения только по целому слову (границы слова учитываются)
- Возвращает массив идентификаторов документов в порядке их появления

## Команды

```bash
npm test      # Запуск тестов
npm run lint  # Запуск ESLint
```

## Лицензия
ISC
