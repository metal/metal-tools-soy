'use strict';

import templates from './GrandChild.soy';
import Component from 'metal-component';
import Soy from 'metal-soy';

class GrandChild extends Component {
}
Soy.register(GrandChild, templates);

export { GrandChild };
export default GrandChild;
