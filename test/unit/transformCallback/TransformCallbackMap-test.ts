import type { IQuadMatcher } from '../../../lib/quadmatcher/IQuadMatcher';
import { TransformCallbackMap } from '../../../lib/transformCallback/TransformCallbackMap';

describe('TransformCallbackMap', () => {
  let matchers: IQuadMatcher[];
  let fieldToMap: 'subject' | 'predicate' | 'object' | 'graph';
  let columns: string[];
  let file: string;
  let transformCallbackMap: TransformCallbackMap;

  beforeEach(() => {
    // Initialize mock data
    matchers = []; // Add mock matchers here for future tests
    fieldToMap = 'subject';
    columns = [ 'original', 'transformed' ];
    file = 'output.csv';

    // Instantiate the class
    transformCallbackMap = new TransformCallbackMap(
      matchers,
      fieldToMap,
      columns,
      file,
    );
  });

  it('should be instantiated correctly', () => {
    expect(transformCallbackMap).toBeInstanceOf(TransformCallbackMap);
  });
});
