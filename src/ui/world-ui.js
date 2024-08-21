import { UIComponent } from "./ui-component.js";

export class WorldUI extends UIComponent {
    constructor(model, sidebarContentDiv) {
        super(model);
        this.sidebarContentDiv = sidebarContentDiv;
        this.isActive = false;
    }

    init() {
        // Create the container that will hold all WorldUI content
        this.worldUIContainer = document.createElement("div");
        this.worldUIContainer.id = "world-ui-container";
        this.sidebarContentDiv.appendChild(this.worldUIContainer);

        // Create title
        this.title = document.createElement("h2");
        this.title.textContent = "Selected World";
        this.worldUIContainer.appendChild(this.title);

        // Create name input
        const nameTitle = document.createElement("h3");
        nameTitle.textContent = "Name";
        this.worldUIContainer.appendChild(nameTitle);

        this.nameInput = document.createElement("input");
        this.nameInput.type = "text";
        this.nameInput.className = "world-input";
        this.worldUIContainer.appendChild(this.nameInput);

        this.nameInput.addEventListener("input", (event) => {
            this.model.setNameOfSelectedWorld(this.nameInput.value);
        });

        // Create name input
        const propositionTitle = document.createElement("h3");
        propositionTitle.textContent = "Propositions";
        this.worldUIContainer.appendChild(propositionTitle);

        // Create input elements
        this.inputs = [];
        for (let i = 0; i < 6; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "world-input";

            // Add input event listener
            input.addEventListener("input", (event) => this.handleInputChange(event));

            this.inputs.push(input);
            this.worldUIContainer.appendChild(input);
        }
    }

    update(model) {
        if (!this.isActive) return;

        // Clear inputs
        this.clear();
        
        // Populate the World UI with information about the selected world
        const selectedWorld = model.getSelectedWorld();
        if (selectedWorld) {
            // The title should display the selected world's name
            const name = selectedWorld.getName();
            this.title.textContent = `World: \\(${name}\\)`;
            MathJax.typesetPromise([this.title]);

            // Set value of name input to name of selected world
            this.nameInput.value = name;

            // Fill in the atom inputs and add a placeholder to the first empty input
            const atoms = Array.from(selectedWorld.getState());
            for (let i = 0; i < this.inputs.length; i++) {
                this.inputs[i].value = atoms[i] || "";
            }
            this.inputs[atoms.length].placeholder = "Add proposition...";
        }
    }

    handleInputChange(event) {
        // Collect inputs and set state of selected world
        const selectedWorld = this.model.getSelectedWorld();
        if (selectedWorld) {
            const newAtoms = new Set();
            this.inputs.forEach(input => {
                const atom = input.value.trim();
                if (atom) {
                    newAtoms.add(atom);
                }
            });
            this.model.setStateOfSelectedWorld(newAtoms);
        }
    }

    clear() {
        this.inputs.forEach(input => {
            input.value = "";
            input.placeholder = "";
        });
    }

    activate() {
        if (!this.isActive) {
            this.init();
            this.isActive = true;
            this.update(this.model);
        }
    }

    deactivate() {
        this.isActive = false;
        this.worldUIContainer.remove();
    }
}
