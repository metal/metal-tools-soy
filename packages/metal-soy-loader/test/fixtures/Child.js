'use strict';

import templates from './Child.soy';
import Component from 'metal-component';
import Soy from 'metal-soy';

import './GrandChild';

class Child extends Component {
}
Soy.register(Child, templates);

export { Child };
export default Child;
