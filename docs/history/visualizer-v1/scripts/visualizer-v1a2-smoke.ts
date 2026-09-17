import assert from "node:assert/strict";

import { DEFAULT_CONFIGURATION } from "../src/domain/ProductConfiguration";
import { resolveVisualizerScene } from "../src/components/calculator/visualizer/visualizer-asset-resolver";
import { createVisualizerState } from "../src/components/calculator/visualizer/visualizer-state";

const winterGarden = createVisualizerState({
  ...DEFAULT_CONFIGURATION,
  productType: "winter_garden",
  frameColor: "white",
  length: 550,
  width: 306,
  roof: "polycarbonate_grey",
  walls: "glass_tinted",
  hasFrontZip: true,
  hasLeftZip: true,
  hasAwning: true,
  hasCob: true,
});

const winterScene = resolveVisualizerScene(winterGarden);

assert.equal(winterGarden.frameColor, "white");
assert.equal(winterGarden.lighting, "cct");
assert.equal(winterScene.primaryAssetKey, "winter_garden_led_strip");
assert.ok(winterScene.stateKey.includes("550x306"));
assert.deepEqual(winterScene.plannedLayers, [
  "frame:white",
  "roof:polycarbonate_grey",
  "walls:glass_tinted",
  "zip:front",
  "zip:left",
  "awning",
  "lighting:cct",
]);

const terraceRoof = createVisualizerState({
  ...DEFAULT_CONFIGURATION,
  productType: "terrace_roof",
  frameColor: "brown",
  roof: "polycarbonate_clear",
  walls: "none",
  hasLed: true,
});

const terraceScene = resolveVisualizerScene(terraceRoof);

assert.equal(terraceScene.primaryAssetKey, "terrace_roof_evening_led");
assert.deepEqual(terraceScene.plannedLayers, [
  "frame:brown",
  "roof:polycarbonate_clear",
  "lighting:spot",
]);

console.log("V1A.2 smoke test: OK");
console.log(`Winter state: ${winterScene.stateKey}`);
console.log(`Winter layers: ${winterScene.plannedLayers.join(", ")}`);
console.log(`Terrace state: ${terraceScene.stateKey}`);
console.log(`Terrace layers: ${terraceScene.plannedLayers.join(", ")}`);
