import search from '../src/index.js';

describe('search', () => {
  test('example from task', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const doc3 = { id: 'doc3', text: "I'm your shooter." };
    const docs = [doc1, doc2, doc3];

    expect(search(docs, 'shoot')).toEqual(['doc1', 'doc2']);
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
});
