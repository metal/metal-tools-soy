'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.templates = exports.Text = undefined;

var _metalComponent = require('metal-component');

var _metalComponent2 = _interopRequireDefault(_metalComponent);

var _metalSoy = require('metal-soy');

var _metalSoy2 = _interopRequireDefault(_metalSoy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* jshint ignore:start */


var templates;
goog.loadModule(function (exports) {
  var soy = goog.require('soy');
  var soydata = goog.require('soydata');
  // This file was automatically generated from Text.soy.
  // Please don't edit this file by hand.

  /**
   * @fileoverview Templates in namespace Text.
   * @public
   */

  goog.module('Text.incrementaldom');

  goog.require('goog.soy.data.SanitizedContent');
  var incrementalDom = goog.require('incrementaldom');
  goog.require('soy.asserts');
  var soyIdom = goog.require('soy.idom');

  var $templateAlias1 = _metalSoy2.default.getTemplate('FieldBase.incrementaldom', 'render');

  /**
   * @param {$render.Params} opt_data
   * @param {Object<string, *>=} opt_ijData
   * @param {Object<string, *>=} opt_ijData_deprecated
   * @return {void}
   * @suppress {checkTypes|uselessCode}
   */
  var $render = function $render(opt_data, opt_ijData, opt_ijData_deprecated) {
    opt_ijData = opt_ijData_deprecated || opt_ijData;
    opt_data = opt_data || {};
    /** @type {*|null|undefined} */
    var _handleFieldChange = opt_data._handleFieldChange;
    /** @type {boolean|null|undefined} */
    var editable = soy.asserts.assertType(opt_data.editable == null || goog.isBoolean(opt_data.editable) || opt_data.editable === 1 || opt_data.editable === 0, 'editable', opt_data.editable, 'boolean|null|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var helpText = soy.asserts.assertType(opt_data.helpText == null || goog.isString(opt_data.helpText) || opt_data.helpText instanceof goog.soy.data.SanitizedContent, 'helpText', opt_data.helpText, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var id = soy.asserts.assertType(opt_data.id == null || goog.isString(opt_data.id) || opt_data.id instanceof goog.soy.data.SanitizedContent, 'id', opt_data.id, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var label = soy.asserts.assertType(opt_data.label == null || goog.isString(opt_data.label) || opt_data.label instanceof goog.soy.data.SanitizedContent, 'label', opt_data.label, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var placeholder = soy.asserts.assertType(opt_data.placeholder == null || goog.isString(opt_data.placeholder) || opt_data.placeholder instanceof goog.soy.data.SanitizedContent, 'placeholder', opt_data.placeholder, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {boolean|null|undefined} */
    var required = soy.asserts.assertType(opt_data.required == null || goog.isBoolean(opt_data.required) || opt_data.required === 1 || opt_data.required === 0, 'required', opt_data.required, 'boolean|null|undefined');
    /** @type {boolean|null|undefined} */
    var showLabel = soy.asserts.assertType(opt_data.showLabel == null || goog.isBoolean(opt_data.showLabel) || opt_data.showLabel === 1 || opt_data.showLabel === 0, 'showLabel', opt_data.showLabel, 'boolean|null|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var spritemap = soy.asserts.assertType(opt_data.spritemap == null || goog.isString(opt_data.spritemap) || opt_data.spritemap instanceof goog.soy.data.SanitizedContent, 'spritemap', opt_data.spritemap, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var value = soy.asserts.assertType(opt_data.value == null || goog.isString(opt_data.value) || opt_data.value instanceof goog.soy.data.SanitizedContent, 'value', opt_data.value, '!goog.soy.data.SanitizedContent|null|string|undefined');
    var param766 = function param766() {
      $content({ editable: editable, _handleFieldChange: _handleFieldChange, id: id, placeholder: placeholder, value: value }, opt_ijData);
    };
    $templateAlias1({ contentRenderer: param766, helpText: helpText, id: id, label: label, required: required, showLabel: showLabel, spritemap: spritemap }, opt_ijData);
  };
  exports.render = $render;
  /**
   * @typedef {{
   *  _handleFieldChange: (*|null|undefined),
   *  editable: (boolean|null|undefined),
   *  helpText: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  id: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  label: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  placeholder: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  required: (boolean|null|undefined),
   *  showLabel: (boolean|null|undefined),
   *  spritemap: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  value: (!goog.soy.data.SanitizedContent|null|string|undefined),
   * }}
   */
  $render.Params;
  if (goog.DEBUG) {
    $render.soyTemplateName = 'Text.render';
  }

  /**
   * @param {$content.Params} opt_data
   * @param {Object<string, *>=} opt_ijData
   * @param {Object<string, *>=} opt_ijData_deprecated
   * @return {void}
   * @suppress {checkTypes|uselessCode}
   */
  var $content = function $content(opt_data, opt_ijData, opt_ijData_deprecated) {
    opt_ijData = opt_ijData_deprecated || opt_ijData;
    opt_data = opt_data || {};
    /** @type {boolean|null|undefined} */
    var editable = soy.asserts.assertType(opt_data.editable == null || goog.isBoolean(opt_data.editable) || opt_data.editable === 1 || opt_data.editable === 0, 'editable', opt_data.editable, 'boolean|null|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var id = soy.asserts.assertType(opt_data.id == null || goog.isString(opt_data.id) || opt_data.id instanceof goog.soy.data.SanitizedContent, 'id', opt_data.id, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var placeholder = soy.asserts.assertType(opt_data.placeholder == null || goog.isString(opt_data.placeholder) || opt_data.placeholder instanceof goog.soy.data.SanitizedContent, 'placeholder', opt_data.placeholder, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {!goog.soy.data.SanitizedContent|null|string|undefined} */
    var value = soy.asserts.assertType(opt_data.value == null || goog.isString(opt_data.value) || opt_data.value instanceof goog.soy.data.SanitizedContent, 'value', opt_data.value, '!goog.soy.data.SanitizedContent|null|string|undefined');
    /** @type {*|null|undefined} */
    var _handleFieldChange = opt_data._handleFieldChange;
    var attributes__soy807 = function attributes__soy807() {
      incrementalDom.attr('class', 'form-control');
      if (id) {
        incrementalDom.attr('id', id);
      }
      if (placeholder) {
        incrementalDom.attr('placeholder', placeholder);
      }
      incrementalDom.attr('type', 'text');
      incrementalDom.attr('data-oninput', _handleFieldChange);
      if (!editable) {
        incrementalDom.attr('disabled', 'disabled');
      }
      if (value) {
        incrementalDom.attr('value', value);
      }
    };
    incrementalDom.elementOpenStart('input');
    attributes__soy807();
    incrementalDom.elementOpenEnd();
    incrementalDom.elementClose('input');
  };
  exports.content = $content;
  /**
   * @typedef {{
   *  editable: (boolean|null|undefined),
   *  id: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  placeholder: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  value: (!goog.soy.data.SanitizedContent|null|string|undefined),
   *  _handleFieldChange: (*|null|undefined),
   * }}
   */
  $content.Params;
  if (goog.DEBUG) {
    $content.soyTemplateName = 'Text.content';
  }

  exports.render.params = ["_handleFieldChange", "editable", "helpText", "id", "label", "placeholder", "required", "showLabel", "spritemap", "value"];
  exports.render.types = { "_handleFieldChange": "any", "editable": "bool", "helpText": "string", "id": "string", "label": "string", "placeholder": "string", "required": "bool", "showLabel": "bool", "spritemap": "string", "value": "string" };
  exports.content.params = ["editable", "id", "placeholder", "value", "_handleFieldChange"];
  exports.content.types = { "editable": "bool", "id": "string", "placeholder": "string", "value": "string", "_handleFieldChange": "any" };
  exports.templates = templates = exports;
  return exports;
});

var Text = function (_Component) {
  _inherits(Text, _Component);

  function Text() {
    _classCallCheck(this, Text);

    return _possibleConstructorReturn(this, (Text.__proto__ || Object.getPrototypeOf(Text)).apply(this, arguments));
  }

  return Text;
}(_metalComponent2.default);

_metalSoy2.default.register(Text, templates);
exports.Text = Text;
exports.templates = templates;
exports.default = templates;
/* jshint ignore:end */
//# sourceMappingURL=Text.soy.js.map