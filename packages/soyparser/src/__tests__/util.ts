import * as Util from '../util';

describe('parseTemplateName', () => {
  test('should parse template name', () => {
    const result = Util.parseTemplateName('.render');

    expect(result).toMatchObject({
      name: 'render',
      namespace: null
    });
  })

  test('should parse a namespace', () => {
    const result = Util.parseTemplateName('MyNamespace.render');

    expect(result).toMatchObject({
      name: 'render',
      namespace: 'MyNamespace'
    });
  })

  test('should parse nested namespaces', () => {
    const result = Util.parseTemplateName('My.Nested.Namespace.render');

    expect(result).toMatchObject({
      name: 'render',
      namespace: 'My.Nested.Namespace'
    });
  })
});

describe('reverseJoin', () => {
  test('should combine two elements', () => {
    const result = Util.reverseJoin(1, 2);

    expect(result).toEqual([1, 2]);
  });

  test('should combine an element and an array of elements', () => {
    const result = Util.reverseJoin(1, [2, 3, 4]);

    expect(result).toEqual([1, 2, 3, 4,]);
  });
});
