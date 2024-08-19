import { PointedModel } from "./src/model/pointed-model.js";
import { AccessibilityRelation } from "./src/model/accessibility-relation.js";
import { ModelUI } from "./src/ui/model-ui.js";

const model = new PointedModel();

const relation = new AccessibilityRelation("R");
model.addRelation(relation);

const modelUI = new ModelUI(model, 5);