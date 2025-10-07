import { buildInvertedIndex } from '../src/index.js';

describe('buildInvertedIndex', () => {
  test('example from task', () => {
    const doc1 = { id: 'doc1', text: 'some text' };
    const doc2 = { id: 'doc2', text: 'some text too' };
    const index = buildInvertedIndex([doc1, doc2]);
    expect(index).toEqual({
      some: ['doc1', 'doc2'],
      text: ['doc1', 'doc2'],
      too: ['doc2'],
    });
  });

  test('no duplication of same doc id per word', () => {
    const doc = { id: 'd', text: 'repeat repeat repeat' };
    const index = buildInvertedIndex([doc]);
    expect(index).toEqual({ repeat: ['d'] });
  });

  test('case insensitivity and mixed tokens', () => {
    const docs = [
      { id: 'a', text: "Alpha ALPHA alpha" },
      { id: 'b', text: "alpha's $alpha ALPHA" },
    ];
    const index = buildInvertedIndex(docs);
    // tokenization keeps $ and apostrophe groups as separate tokens
    expect(index.alpha).toEqual(['a', 'b']);
    expect(index["alpha's"]).toEqual(['b']);
    expect(index.$alpha).toEqual(['b']);
  });

  test('handles invalid inputs gracefully', () => {
    expect(buildInvertedIndex(null)).toEqual({});
    expect(buildInvertedIndex(undefined)).toEqual({});
  });

  test('ignores docs without proper id/text', () => {
    const docs = [
      { id: 'ok', text: 'one two' },
      { id: 'bad', text: null },
      { id: 7, text: 'ignored id type' },
    ];
    const index = buildInvertedIndex(docs);
    expect(index).toEqual({ one: ['ok'], two: ['ok'] });
  });
});

