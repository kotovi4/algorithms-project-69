import search from '../src/index.js';

describe('search', () => {
  test('example from task', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const doc3 = { id: 'doc3', text: "I'm your shooter." };
    const docs = [doc1, doc2, doc3];

    // doc2 содержит 3 вхождения 'shoot', doc1 одно -> doc2 должен быть раньше
    expect(search(docs, 'shoot')).toEqual(['doc2', 'doc1']);
  });

  test('empty documents', () => {
    expect(search([], 'shoot')).toEqual([]);
  });

  test('no matches', () => {
    const docs = [
      { id: 'a', text: 'alpha beta gamma' },
      { id: 'b', text: 'delta epsilon zeta' },
    ];
    expect(search(docs, 'shoot')).toEqual([]);
  });

  test('case insensitive and word boundary', () => {
    const docs = [
      { id: 'a', text: 'Shoot me again' },
      { id: 'b', text: 'SHOOTING stars' },
      { id: 'c', text: 'time to SHOOT.' },
    ];
    // should not include b because SHOOTING is different word
    expect(search(docs, 'shoot')).toEqual(['a', 'c']);
  });

  test('term with regex special chars', () => {
    const docs = [
      { id: 'a', text: 'Price is $5 today' },
      { id: 'b', text: 'Just 5 dollars' },
    ];
    expect(search(docs, '$5')).toEqual(['a']);
  });

  test('invalid inputs', () => {
    expect(search(null, 'x')).toEqual([]);
    expect(search([{ id: 'a', text: 'hello' }], '')).toEqual([]);
  });

  test('word with punctuation boundaries', () => {
    const docs = [
      { id: 'a', text: 'shoot,' },
      { id: 'b', text: 'shoot!' },
      { id: 'c', text: '(shoot)' },
      { id: 'd', text: 'shooting,' },
    ];
    expect(search(docs, 'shoot')).toEqual(['a', 'b', 'c']);
  });

  test('hyphen boundary', () => {
    const docs = [
      { id: 'a', text: 'pre-shoot-post' },
      { id: 'b', text: 'shoot-pre' },
      { id: 'c', text: 'preshoot' },
      { id: 'd', text: 'shoot' },
    ];
    expect(search(docs, 'shoot')).toEqual(['a', 'b', 'd']);
  });

  test('partial alphanumeric token should not match', () => {
    const docs = [
      { id: 'a', text: 'shoot1' },
      { id: 'b', text: '1shoot' },
      { id: 'c', text: 'shoot_underscore' },
      { id: 'd', text: 'underscore_shoot' },
      { id: 'e', text: 'shoot' },
    ];
    // underscore counts as word char, so tokens including it should not count as whole word
    expect(search(docs, 'shoot')).toEqual(['e']);
  });

  test('multiple occurrences still returns doc once', () => {
    const docs = [
      { id: 'a', text: 'shoot shoot shoot' },
      { id: 'b', text: 'no match here' },
    ];
    expect(search(docs, 'shoot')).toEqual(['a']);
  });

  test('ranking ordering and stable tie-breaker', () => {
    const docs = [
      { id: 'd1', text: 'shoot shoot once more shoot' }, // 3
      { id: 'd2', text: 'shoot something shoot' }, // 2
      { id: 'd3', text: 'just one shoot here' }, // 1
      { id: 'd4', text: 'shoot and shoot' }, // 2
      { id: 'd5', text: 'shoot shoot shoot shoot' }, // 4
    ];
    // expect order by count desc: d5 (4), d1 (3), then among 2-count keep original order d2, d4, then d3
    expect(search(docs, 'shoot')).toEqual(['d5', 'd1', 'd2', 'd4', 'd3']);
  });

  test('fuzzy multi-word example from task', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const doc3 = { id: 'doc3', text: "I'm your shooter." };
    const docs = [doc1, doc2, doc3];
    // query words: shoot, at, me
    // doc2: shoot(3) at(1) me(1) => unique=3 total=5
    // doc1: shoot(1) at(0) me(0) => unique=1 total=1
    expect(search(docs, 'shoot at me')).toEqual(['doc2', 'doc1']);
  });

  test('ranking: more unique words outrank higher total of a single word', () => {
    const docs = [
      { id: 'a', text: 'alpha alpha alpha alpha' }, // alpha x4 (unique=1 total=4)
      { id: 'b', text: 'alpha beta' }, // alpha x1, beta x1 (unique=2 total=2)
      { id: 'c', text: 'beta beta beta' }, // beta x3 (unique=1 total=3)
    ];
    expect(search(docs, 'alpha beta')).toEqual(['b', 'a', 'c']);
  });

  test('ranking: tie on unique -> order by total occurrences desc', () => {
    const docs = [
      { id: 'd2', text: 'alpha gamma gamma gamma' }, // alpha1 gamma3 => unique=2 total=4
      { id: 'd1', text: 'alpha beta beta' }, // alpha1 beta2 => unique=2 total=3
      { id: 'd3', text: 'beta gamma' }, // beta1 gamma1 => unique=2 total=2
    ];
    expect(search(docs, 'alpha beta gamma')).toEqual(['d2', 'd1', 'd3']);
  });

  test('query duplicates are deduplicated for unique count', () => {
    const docs = [
      { id: 'x', text: 'shoot me shoot' }, // shoot2 me1
      { id: 'y', text: 'shoot' }, // shoot1
    ];
    // query words (raw): shoot, shoot, me -> unique: shoot, me
    // x: unique=2 total=3; y: unique=1 total=1
    expect(search(docs, 'shoot   shoot   me')).toEqual(['x', 'y']);
  });

  test('multi-word: case insensitivity and trimming', () => {
    const docs = [
      { id: 'a', text: 'Shoot me again' }, // shoot, me
      { id: 'b', text: 'shoot SHOOT shoot' }, // shoot x3
    ];
    // query words: shoot, me ->
    // b: unique=1 total=3; a: unique=2 total=2 -> a выше, так как больше уникальных слов
    expect(search(docs, '  SHOOT   me  ')).toEqual(['a', 'b']);
  });

  test('multi-word: includes unknown word (ignored for matching)', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const docs = [doc1, doc2];
    // query words: shoot, xyzunknown, me
    // doc2: shoot(3) me(1) => unique=2 total=4
    // doc1: shoot(1) => unique=1 total=1
    expect(search(docs, 'shoot xyzunknown me')).toEqual(['doc2', 'doc1']);
  });

  test('multi-word: only spaces query returns empty', () => {
    const docs = [ { id: 'x', text: 'alpha beta' } ];
    expect(search(docs, '    ')).toEqual([]);
  });
});
