import { UIComponent } from "./ui-component.js"
import { FormulaParser } from "../language/formula-parser.js";

export class FormulaUI extends UIComponent {
    constructor(model) {
        super(model);
        this.formulaUIDiv = document.getElementById("formula-ui");
        this.formula = null;
        this.parser = new FormulaParser();

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
        this.confirmButton = document.createElement("button");
        this.confirmButton.id = "formulaButton";
        this.confirmButton.textContent = "Confirm";
        inputDiv.appendChild(this.confirmButton);

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

        // Event listener for button
        this.confirmButton.addEventListener("click", (event) => {
            this.parseFormula();
        });
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
                this.truthDisplay.textContent = "Truth value: " + truthValue;
            } else {
                this.truthDisplay.textContent = "";
            }
        } else {
            this.truthDisplay.textContent = "Enter a formula to evaluate.";
        }
    }
}