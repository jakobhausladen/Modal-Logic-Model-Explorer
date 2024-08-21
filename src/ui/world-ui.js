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

        // Create atoms container
        this.atomContainer = document.createElement("div");
        this.atomContainer.id = "atoms";

        // Create input elements
        this.inputs = [];
        for (let i = 0; i < 8; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "atom-input";

            // Add input event listener
            input.addEventListener("input", (event) => this.handleInputChange(event));

            this.inputs.push(input);
            this.atomContainer.appendChild(input);
        }

        // Append atoms container to worldUIContainer
        this.worldUIContainer.appendChild(this.atomContainer);
    }

    update(model) {
        if (!this.isActive) return;

        // Clear inputs
        this.clear();
        
        // Populate inputs with atoms of the selected world
        const selectedWorld = model.getSelectedWorld();
        if (selectedWorld) {
            this.title.textContent = selectedWorld.getName();
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
