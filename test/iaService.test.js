const test = require("node:test");
const assert = require("node:assert/strict");
const { validarBache } = require("../src/services/iaService");

test("iaService: exporta validarBache como función", () => {
  assert.strictEqual(typeof validarBache, "function");
});
