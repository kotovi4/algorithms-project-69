import search from '../src/index.js';

describe('search', () => {
  test('example from task', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const doc3 = { id: 'doc3', text: "I'm your shooter." };
    const docs = [doc1, doc2, doc3];

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
    expect(search(docs, 'shoot')).toEqual(['e']);
  });

  test('multiple occurrences still returns doc once (single match set)', () => {
    const docs = [
      { id: 'a', text: 'shoot shoot shoot' },
      { id: 'b', text: 'no match here' },
    ];
    expect(search(docs, 'shoot')).toEqual(['a']);
  });

  // --- TF-IDF specific tests ---

  test('tf-idf: rare word beats many repetitions of common word', () => {
    const docs = [
      { id: 'a', text: 'common common common common common' },
      { id: 'b', text: 'common rare' },
    ];
    expect(search(docs, 'common rare')).toEqual(['b', 'a']);
  });

  test('tf-idf: single common word present in all docs keeps original order (idf=0)', () => {
    const docs = [
      { id: 'd1', text: 'shoot shoot shoot' },
      { id: 'd2', text: 'shoot' },
      { id: 'd3', text: 'shoot again shoot' },
    ];
    expect(search(docs, 'shoot')).toEqual(['d1', 'd2', 'd3']);
  });

  test('tf-idf: tie scores fallback to original order', () => {
    const docs = [
      { id: 'x1', text: 'alpha beta beta' }, // tf alpha1 beta2
      { id: 'x2', text: 'alpha alpha gamma' }, // tf alpha2 gamma1
      { id: 'x3', text: 'beta gamma' }, // tf beta1 gamma1
    ];
    // query words produce same idf for all (each appears in 2 of 3 docs) => idf = ln(3/2)
    // scores: x1 = 3k, x2 = 3k, x3 = 2k -> x1 and x2 tie, preserve order
    expect(search(docs, 'alpha beta gamma')).toEqual(['x1', 'x2', 'x3']);
  });

  test('fuzzy multi-word example from task still valid', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const doc3 = { id: 'doc3', text: "I'm your shooter." };
    const docs = [doc1, doc2, doc3];
    expect(search(docs, 'shoot at me')).toEqual(['doc2', 'doc1']);
  });

  test('query duplicates are deduplicated (tf-idf unaffected)', () => {
    const docs = [
      { id: 'x', text: 'shoot me shoot' },
      { id: 'y', text: 'shoot' },
    ];
    expect(search(docs, 'shoot   shoot   me')).toEqual(['x', 'y']);
  });

  test('multi-word: case insensitivity and trimming preserved', () => {
    const docs = [
      { id: 'a', text: 'Shoot me again' },
      { id: 'b', text: 'shoot SHOOT shoot' },
    ];
    expect(search(docs, '  SHOOT   me  ')).toEqual(['a', 'b']);
  });

  test('multi-word: includes unknown word ignored', () => {
    const doc1 = { id: 'doc1', text: "I can't shoot straight unless I've had a pint!" };
    const doc2 = { id: 'doc2', text: "Don't shoot shoot shoot that thing at me." };
    const docs = [doc1, doc2];
    expect(search(docs, 'shoot xyzunknown me')).toEqual(['doc2', 'doc1']);
  });

  test('multi-word: only spaces query returns empty', () => {
    const docs = [{ id: 'x', text: 'alpha beta' }];
    expect(search(docs, '    ')).toEqual([]);
  });

  test('multi-word anti-spam ordering', () => {
    const docs = [
      { id: 'd1', text: 'Garbage patch overview and context' }, // garbage(1) patch(1)
      { id: 'd2', text: 'New initiative for garbage patch cleanup' }, // garbage(1) patch(1)
      { id: 'd3', text: 'garbage patch garbage patch garbage patch data' }, // garbage(3) patch(3)
    ];
    // Query has two words => multiword ranking: uniqueScore equal, then totalOccurrences asc => d1,d2 before d3
    expect(search(docs, 'garbage patch')).toEqual(['d1', 'd2', 'd3']);
  });

  test('single-word frequency priority', () => {
    const docs = [
      { id: 's1', text: 'garbage topic' }, // 1
      { id: 's2', text: 'garbage garbage topic' }, // 2
      { id: 's3', text: 'garbage garbage garbage topic' }, // 3
    ];
    // Single word query => higher freq first
    expect(search(docs, 'garbage')).toEqual(['s3', 's2', 's1']);
  });
});
