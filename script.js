import { PointedModel } from "./src/model/pointed-model.js";
import { AccessibilityRelation } from "./src/model/accessibility-relation.js";
import { ModelUI } from "./src/ui/model-ui.js";

const model = new PointedModel();

const relation = new AccessibilityRelation(1);
model.addRelation(relation);

const modelUI = new ModelUI(model, 5);