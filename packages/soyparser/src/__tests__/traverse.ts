import * as traverse from '../traverse';

describe('visit', () => {
  const nodeNames = [
    'BooleanLiteral',
    'Call',
    'DelTemplate',
    'FunctionCall',
    'Interpolation',
    'LetStatement',
    'MapItem',
    'MapLiteral',
    'NumberLital',
    'OtherCmd',
    'OtherExpression',
    'Param',
    'Program',
    'Reference',
    'StringLiteral',
    'Template',
    'Ternary'
  ];

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

  function mockAST() {
    return {
      mark: getMark(),
      body: nodeNames.map(name => ({
        mark: getMark(),
        type: name
      })),
      type: 'TestRoot'
    };
  }

  it('should call the visitor for each node', () => {
    const visitor = {};
    nodeNames.forEach(name => visitor[name] = jest.fn());

    traverse.visit(mockAST(), visitor);

    Object.keys(visitor).forEach(key => {
      const visitFunc = visitor[key];

      expect(visitFunc).toBeCalled();
    });
  });

  it('should call enter and exit for each node', () => {
    const visitor = {};
    nodeNames.forEach(name => {
      visitor[name] = {
        enter: jest.fn(),
        exit: jest.fn()
      };
    });

    traverse.visit(mockAST(), visitor);

    Object.keys(visitor).forEach(key => {
      const visitObj = visitor[key];

      expect(visitObj.enter).toBeCalled();
      expect(visitObj.exit).toBeCalled();
    });
  });
});
