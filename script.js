import { PointedModel } from "./src/model/pointed-model.js";
import { AccessibilityRelation } from "./src/model/accessibility-relation.js";
import { DualModelUI } from "./src/ui/dual-model-ui.js";
import { FormulaUI } from "./src/ui/formula-ui.js";
import { WorldUI } from "./src/ui/world-ui.js";

const leftModel = new PointedModel();
const rightModel = new PointedModel();

const relation1 = new AccessibilityRelation(1);
leftModel.addRelation(relation1);

const relation2 = new AccessibilityRelation(1);
rightModel.addRelation(relation2);

const formulaUI = new FormulaUI(leftModel);
const worldUI = new WorldUI(leftModel, document.getElementById("sidebar"));

const duaModelUI = new DualModelUI(leftModel, rightModel, worldUI, formulaUI, 5);