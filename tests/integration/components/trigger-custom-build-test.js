import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('trigger-custom-build', 'Integration | Component | trigger custom build', {
  integration: true
});

test('it renders', function (assert) {
  this.render(hbs`{{trigger-custom-build}}`);

  assert.equal(this.$().find('h2').text().trim(), 'Trigger a custom build');
});
