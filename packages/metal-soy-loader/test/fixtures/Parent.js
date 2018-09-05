'use strict';

import templates from './Parent.soy';
import Component from 'metal-component';
import Soy from 'metal-soy';

import './Child';

class Parent extends Component {
}
Soy.register(Parent, templates);

export { Parent };
export default Parent;
