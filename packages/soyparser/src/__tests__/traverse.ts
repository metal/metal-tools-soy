import * as traverse from '../traverse';
import * as S from '../types';

describe('visit', () => {
  function mockIndex() {
    return {
      offset: 0,
      line: 0,
      column: 0
    };
  }

  function getMark() {
    return {
      start: mockIndex(),
      end: mockIndex()
    };
  }

  function mockAST(): S.Program {
    return {
      mark: getMark(),
      body: [{
        attributes: [],
        body: [],
        doc: null,
        id: {
          name: 'FooTemplate',
          namespace: null
        },
        mark: getMark(),
        params: [],
        type: 'Template'
      }],
      namespace: 'Foo',
      type: 'Program'
    };
  }

  it('should call the visitor for each node', () => {
    const Template = jest.fn();
    const Foo = jest.fn();

    const visitor = {
      Template,
      Foo
    };

    traverse.visit(mockAST(), visitor);

    expect(Template).toBeCalled();
    expect(Foo).not.toBeCalled();
  });

  it('should call enter and exit for each node', () => {
    const templateEnter = jest.fn();
    const templateExit = jest.fn();
    const fooEnter = jest.fn();
    const fooExit = jest.fn();

    const visitor = {
      Template: {
        enter: templateEnter,
        exit: templateExit
      },
      Foo: {
        enter: fooEnter,
        exit: fooExit
      }
    };

    traverse.visit(mockAST(), visitor);

    expect(templateEnter).toBeCalled();
    expect(fooEnter).not.toBeCalled();

    expect(templateExit).toBeCalled();
    expect(fooExit).not.toBeCalled();
  });
});
