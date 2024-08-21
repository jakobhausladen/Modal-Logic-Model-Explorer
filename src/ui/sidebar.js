import { WorldUI } from "./world-ui.js";

export class Sidebar {
    constructor(model) {
        this.sidebarContainer = document.getElementById("sidebar");
    
        this.init(model);
    }

    init(model) {
        // Create tabs
        const tabs = document.createElement("div");
        tabs.classList.add("tabs");
        this.sidebarContainer.appendChild(tabs);
        
        this.worldTab = document.createElement("button");
        this.worldTab.classList.add("tab");
        this.worldTab.textContent = "World";
        tabs.appendChild(this.worldTab);

        this.relationsTab = document.createElement("button");
        this.relationsTab.classList.add("tab");
        this.relationsTab.textContent = "Relations";
        tabs.appendChild(this.relationsTab);

        // Container for the content of the UI classes
        this.sidebarContent = document.createElement("div");
        this.sidebarContainer.appendChild(this.sidebarContent);

        // Instantiate UI classes
        this.worldUI = new WorldUI(model, this.sidebarContent);

        // Add event listener to tabs
        this.worldTab.addEventListener("click", () => {
            this.worldUI.activate();

            this.worldTab.classList.add("active");
            this.relationsTab.classList.remove("active");
        });

        this.relationsTab.addEventListener("click", () => {
            this.worldUI.deactivate();

            this.worldTab.classList.remove("active");
            this.relationsTab.classList.add("active");
        });

        // Activate the World tab by default
        this.worldUI.activate();
        this.worldTab.classList.add("active");
    }
}
