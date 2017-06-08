import * as Util from '../util';

describe('toTemplateName', () => {
  test('should create a namespace object', () => {
    const result = Util.toTemplateName(['render']);

    expect(result).toMatchObject({
      name: 'render',
      namespace: null
    });
  })

  test('Should create a namespace object with namespace', () => {
    const result = Util.toTemplateName(['MyNamespace', 'render']);

    expect(result).toMatchObject({
      name: 'render',
      namespace: 'MyNamespace'
    });
  })

  test('Should create a namespace object with a nested namespace', () => {
    const result = Util.toTemplateName(['My', 'Nested', 'Namespace', 'render']);

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
