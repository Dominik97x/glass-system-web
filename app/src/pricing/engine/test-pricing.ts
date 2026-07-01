import { calculateQuote } from "./PricingEngine";

const quote = calculateQuote({
  width: 306,
  length: 300,

  walls: "glass_clear",
  roof: "polycarbonate_clear",

  hasFrontZip: false,
  hasLeftZip: false,
  hasRightZip: false,

  hasAwning: false,
  hasLed: false,
  hasCob: false,

  hasHandles: false,
  hasBrushes: false,
  hasLevelingProfile: false,
});

console.log(quote);