import {joinErrors, toResult, Result} from './util';
import * as chalk from 'chalk';
import * as jsHelpers from './js-helpers';
import * as S from './soy-types';
import * as soyHelpers from './soy-helpers';
import * as T from 'babel-types';

export default function validateParams(soyAst: S.Program, jsAst: T.Node): Result {
  /**
   * We just skip validation if the default class does not extend from Component.
   * TODO: See if we can resolve and parse the parent class' STATE.
   */
  if (jsHelpers.getSuperClassImportPath(jsAst) !== 'metal-component') {
    return toResult(true);
  }

  const jsParams = jsHelpers.getParamNames(jsAst);
  const classMethods = jsHelpers.getClassMethodNames(jsAst);

  const missingParams = soyHelpers.getSoyParams(soyAst)
    .map(param => param.name)
    .filter(param => !jsParams.includes(param) && !classMethods.includes(param));

  if (missingParams.length) {
    return toResult(
      false,
      `These params can't be found in ${chalk.yellow('STATE')} or your ${chalk.yellow('Class')}:\n\n` +
      joinErrors(missingParams));
  }

  return toResult(true);
};
