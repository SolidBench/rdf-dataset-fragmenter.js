import { DataFactory } from 'rdf-data-factory';
import { ValueModifierRegexReplaceGroup } from '../../../../lib/transform/value/ValueModifierRegexReplaceGroup';

const DF = new DataFactory();

describe('ValueModifierRegexReplaceGroup', () => {
  let modifier: ValueModifierRegexReplaceGroup;

  describe('for a regex taking everything after the last slash', () => {
    beforeEach(() => {
      modifier = new ValueModifierRegexReplaceGroup('^.*/([^/]*)$');
    });

    it('should handle an applicable value', () => {
      expect(modifier.apply(DF.namedNode('http://example.org/abc/A_B')))
        .toEqual(DF.literal('A_B'));
    });
  });
});
