import { UIComponent } from "./ui-component.js"
import { FormulaParser } from "../language/formula-parser.js";
import { Tableaux } from "../model/tableaux.js";
import { PartitionRefinement } from "../model/partition-refinement.js";
import { Negation } from "../language/formulas.js";

export class FormulaUI extends UIComponent {
    constructor(model, generateCountermodelCallback) {
        super(model);
        this.generateCountermodelCallback = generateCountermodelCallback;
        this.formulaUIDiv = document.getElementById("formula-ui");
        this.formula = null;
        this.parser = new FormulaParser();
        this.tableaux = new Tableaux();
        this.partitionRefinement = new PartitionRefinement()

        this.init();
    }

    init() {
        // Input div
        const inputDiv = document.createElement("div");
        inputDiv.id = "input-container";
        this.formulaUIDiv.appendChild(inputDiv);

        // Create input field for formula
        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.placeholder = "Enter formula";
        this.input.id = "formula-input";
        inputDiv.appendChild(this.input);

        // Create button to submit formula
        this.evaluateButton = document.createElement("button");
        this.evaluateButton.id = "evaluate-button";
        this.evaluateButton.textContent = "Evaluate";
        inputDiv.appendChild(this.evaluateButton);

        // Event listener for button
        this.evaluateButton.addEventListener("click", (event) => {
            this.parseFormula();
        });

        // Create button to check valitity
        this.confirmButton = document.createElement("button");
        this.confirmButton.id = "countermodel-button";
        this.confirmButton.textContent = "Countermodel";
        inputDiv.appendChild(this.confirmButton);

        // Event listener for button
        this.confirmButton.addEventListener("click", (event) => {
            this.generateCountermodel();
        });

        // Create divs to display formula string representation and truth value
        this.formulaDisplay = document.createElement("div");
        this.formulaDisplay.id = "formula-display";
        this.formulaDisplay.style.paddingTop = "30px";
        this.formulaDisplay.style.fontSize = "25px";
        this.formulaUIDiv.appendChild(this.formulaDisplay);

        this.truthDisplay = document.createElement("div");
        this.truthDisplay.id = "truth-display";
        this.truthDisplay.style.paddingTop = "30px";
        this.truthDisplay.style.fontSize = "20px";
        this.formulaUIDiv.appendChild(this.truthDisplay);

    }

    parseFormula() {
        const formulaString = this.input.value.trim();
        if (formulaString) {
            try {
                this.formula = this.parser.parse(formulaString);
                this.displayFormula();
                this.displayTruth();
            } catch (error) {
                this.formulaDisplay.innerHTML = "Error parsing formula: " + error.message;
                this.truthDisplay.textContent = "";
            }
        }
    }

    update(model) {
        this.displayTruth();
    }

    displayFormula() {
        if (this.formula) {
            this.formulaDisplay.innerHTML = `\\(${this.formula.toLaTeX()}\\)`;
            MathJax.typesetPromise();
        } else {
            this.formulaDisplay.textContent = "No formula entered.";
        }
    }

    displayTruth() {
        if (this.formula) {
            const selectedWorld = this.model.getSelectedWorld();
            if (selectedWorld) {
                const truthValue = this.formula.isSatisfied(selectedWorld, this.model);
                this.truthDisplay.textContent = `is ${truthValue} at \\(${selectedWorld.getName()}\\)`;
                MathJax.typesetPromise();
            } else {
                this.truthDisplay.textContent = "";
            }
        } else {
            this.truthDisplay.textContent = "Enter a formula to evaluate.";
        }
    }

    generateCountermodel() {
        this.tableaux.setRoot(new Negation(this.formula));
        const countermodel = this.tableaux.constructModel();
        const minimalCountermodel = this.partitionRefinement.reduceModel(countermodel);
        if (minimalCountermodel) {
            this.generateCountermodelCallback(minimalCountermodel);
        }
    }
}