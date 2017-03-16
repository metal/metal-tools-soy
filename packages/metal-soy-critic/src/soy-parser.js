const P = require('parsimmon');
const {parseTemplateName} = require('./util');

/* Parsers */

const lb = P.string('{');
const rb = P.string('}');
const cb = P.string('/}');
const dquote = P.string('"');

const html = P.noneOf('{}').many().desc("Html Char");
const namespace = joined(P.letter, P.digit, P.string('.'));
const paramName = joined(P.letter, P.digit);
const templateName = joined(P.letter, P.digit, P.string('.'));
const typeName = joined(P.letter, P.digit, P.oneOf('<>?'));

const boolean = P.alt(
  P.string('true').result(true),
  P.string('false').result(false)
);

const namespaceCmd = P.string('{namespace')
  .skip(P.whitespace)
  .then(namespace)
  .skip(rb);

const param = P.lazy(() => P.seqMap(
  P.string('{param')
    .then(spaced(paramName)),
  orAny(P.alt(
    cb.result([]),
    rb.then(bodyFor('param')))),
  Param
));

const paramDeclaration = P.seqMap(
  P.string('{@param')
    .then(optional(P.string('?')))
    .map(value => !value),
  spaced(paramName),
  spaced(P.string(':'))
    .then(spaced(typeName))
    .skip(rb),
  ParamDeclaration
);

const call = P.seqMap(
  P.string('{call')
    .skip(P.whitespace)
    .then(templateName),
  P.alt(
    spaced(cb).result([]),
    rb.then(spaced(param).many())
      .skip(spaced(closeCmd('call')))),
  Call
);

const template = P.seqMap(
  orAny(P.string('{template'))
    .skip(P.whitespace)
    .then(templateName),
  P.seq(P.whitespace, P.string('private="'))
    .then(boolean)
    .skip(dquote)
    .fallback(false),
  spaced(rb).then(spaced(paramDeclaration).many()),
  bodyFor('template'),
  Template
);

const delTemplate = P.seqMap(
  orAny(P.string('{deltemplate'))
    .skip(P.whitespace)
    .then(templateName),
  optional(P.seq(P.whitespace, P.string('variant='))
    .then(interpolation('"'))),
  rb.then(spaced(paramDeclaration).many()),
  bodyFor('deltemplate'),
  DelTemplate
);

const program = P.seqMap(
  namespaceCmd,
  P.alt(template, delTemplate)
    .atLeast(1)
    .skip(spaced(P.eof)),
  Program
);

const parser = program;

/* Higher-order Parsers */

function optional(parser) {
  return parser.atMost(1).map(values => values[0] || null);
}

function interpolation(start, end = start) {
  return P.string(start).then(withAny(P.string(end))).map(Interpolation);
}

function cmd(name, ...inter) {
  return openCmd(name).then(
    bodyFor(name, ...inter).map(body => MakeCmd(name, body))
  );
}

function bodyFor(name, ...inter) {
  const bodyParser = P.lazy(() =>
    html.then(P.alt(
      closeCmd(name).result([]),
      P.alt(...inter.map(openCmd))
        .result([])
        .then(bodyParser),
      P.seqMap(
        P.alt(
          call,
          cmd('if', 'elseif', 'else'),
          cmd('foreach', 'ifempty'),
          cmd('msg', 'fallbackmsg'),
          cmd('switch'),
          cmd('let'),
          cmd('literal'),
          interpolation('{', '}')),
        bodyParser,
        (left, right) => [left, ...right])))
  );

  return bodyParser;
}

function orAny(parser) {
  const newParser = P.lazy(() =>
    parser.or(P.any.then(newParser))
  );

  return newParser;
}

function withAny(parser) {
  const newParser = P.lazy(() =>
    P.alt(
      parser.result(''),
      P.seqMap(
        P.any,
        newParser,
        (s, next) => s + next))
  );

  return newParser;
}

function spaced(parser) {
  return P.optWhitespace
    .then(parser)
    .skip(P.optWhitespace);
}

function joined(...parsers) {
  return P.alt(...parsers)
    .many()
    .map(values => values.join(''));
}

function closeCmd(name) {
  return P.string(`{/${name}}`);
}

function openCmd(name) {
  return P.string(`{${name}`).skip(orAny(rb));
}

/* Nodes */

function Program(namespace, body) {
  return {
    body,
    namespace,
    type: 'Program'
  };
}

function Template(rawName, isPrivate, params = [], body = []) {
  const {name, namespace} = parseTemplateName(rawName);

  return {
    body,
    name,
    namespace,
    params,
    private: isPrivate,
    type: 'Template'
  };
}

function DelTemplate(rawName, variant, params = [], body = []) {
  const {name, namespace} = parseTemplateName(rawName);

  return {
    body,
    name,
    namespace,
    params,
    variant,
    type: 'DelTemplate'
  };
}

function Interpolation(content) {
  return {
    content,
    type: 'Interpolation'
  };
}

function Param(name, body = []) {
  return {
    body,
    name,
    type: 'Param'
  };
}

function ParamDeclaration(required, name, paramType) {
  return {
    name,
    paramType,
    required,
    type: 'ParamDeclaration'
  };
}

function Call(rawName, body = []) {
  const {name, namespace} = parseTemplateName(rawName);

  return {
    body,
    name,
    namespace,
    type: 'Call'
  };
}

function MakeCmd(name, body = []) {
  return {
    body,
    type: name.charAt(0).toUpperCase() + name.slice(1)
  };
}

module.exports = function parse(input) {
  const result = parser.parse(input);
  if (!result.status) {
    throw result;
  }
  return result.value;
};
