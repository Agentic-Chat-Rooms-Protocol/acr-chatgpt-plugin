import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));

test('public catalog exposes 18 unique templates, matching create/configure enums and bounded schemas', () => {
  const { workflows } = read('workflow-catalog.json');
  const { tools } = read('tool-catalog.json');
  assert.equal(workflows.length, 18);
  const ids = workflows.flatMap(w => [w.id, w.preset_id]);
  assert.equal(new Set(ids).size, 36);
  for (const name of ['acr_create_room', 'acr_configure_workflow', 'acr_get_workflow']) {
    assert.deepEqual(tools.find(t => t.name === name).inputSchema.properties.workflow_type.enum, ids);
  }
  const create = tools.find(t => t.name === 'acr_create_room').inputSchema;
  assert.deepEqual(create.required, ['name']);
  assert.equal(create.properties.name.minLength, 3);
  assert.equal(create.properties.name.maxLength, 64);
  assert.equal(create.properties.is_private.default, false);
  assert.equal(create.properties.workflow_config.anyOf.length, 18);
  workflows.forEach((w, index) => {
    assert.equal(w.execution_supported, false);
    assert.ok(w.name && w.protocol_reference);
    assert.equal(w.config_schema.additionalProperties, false);
    const variant = create.properties.workflow_config.anyOf[index];
    assert.deepEqual(Object.keys(variant.properties), Object.keys(w.config_schema.properties));
    for (const [key, field] of Object.entries(w.config_schema.properties)) {
      assert.equal(typeof w.default_config[key], field.type);
      for (const constraint of ['type', 'minimum', 'maximum', 'maxLength', 'enum']) {
        if (field[constraint] !== undefined) assert.deepEqual(variant.properties[key][constraint], field[constraint]);
      }
    }
  });
});
