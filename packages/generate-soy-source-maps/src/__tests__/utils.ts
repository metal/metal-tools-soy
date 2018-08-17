/**
 * Copyright (c) 2018, Matuzalém Teles.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {implTemplateName} from '../utils';

describe('Utils', () => {
	it('should return the implementation of the Template Name', () => {
		const name: string = 'render';
		const namespace: string = 'Foo';
		const expected: string = `${namespace}.${name}`;

		expect(implTemplateName(name, namespace)).toBe(expected);
	});
});