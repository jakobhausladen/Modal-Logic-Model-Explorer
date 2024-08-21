import { PointedModel } from "./src/model/pointed-model.js";
import { AccessibilityRelation } from "./src/model/accessibility-relation.js";
import { ModelUI } from "./src/ui/model-ui.js";
import { Sidebar } from "./src/ui/sidebar.js";
import { FormulaUI } from "./src/ui/formula-ui.js";

const model = new PointedModel();

const relation = new AccessibilityRelation(1);
model.addRelation(relation);

const modelUI = new ModelUI(model, 5);
const sidebar = new Sidebar(model);
const formulaUI = new FormulaUI(model);