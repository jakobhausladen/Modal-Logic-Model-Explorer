import { UIComponent } from "./ui-component.js";
import { SVGDrawer } from "./svg-drawer.js";
import { World } from "../model/world.js";

export class ModelUI extends UIComponent {
    constructor(model, gridNumber) {
        super(model);
        this.modelUIDiv = document.getElementById("model-ui");
        this.gridNumber = gridNumber;

        // Stores world positions with world index as key
        this.worldPositions = new Map();
        // Counter for serves as index for newly created worlds
        this.worldCounter = 0;

        this.init()
    }

    init() {
        // Add the SVG element which will be the interface to add/remove and display worlds and links
        this.svgNS = "http://www.w3.org/2000/svg";
        this.svgElement = document.createElementNS(this.svgNS, "svg");
        this.svgElement.setAttribute("width", "500");
        this.svgElement.setAttribute("height", "500");
        this.modelUIDiv.appendChild(this.svgElement);

        // Instantiate the SVGDrawer class to draw the grid, worlds, and links
        this.svgDrawer = new SVGDrawer(this.svgElement, this.svgNS, this.gridNumber);

        // Draw the grid
        this.svgDrawer.drawGrid();

        // Event listeners to handle right and left clicks
        this.svgElement.addEventListener("click", (event) => this.handleLeftClick(event));
        this.svgElement.addEventListener("contextmenu", (event) => this.handleRightClick(event));
    }

    update(model) {
        // Update the Model UI when the model state changes: clear layers, draw worlds, draw links
        this.svgDrawer.clear();

        // Draw worlds
        const selectedWorld = model.getSelectedWorld();
        for (const world of model.getWorlds()) {
            const worldIndex = world.getIndex();
            const { worldX, worldY } = this.worldPositions.get(worldIndex);
            const isSelected = world === selectedWorld;
            this.svgDrawer.drawWorld(worldX, worldY, isSelected);
        }
    }

    handleRightClick(event) {
        // Prevent context menu from popping up
        event.preventDefault();
        const clickCoords = this.getCoordinates(event);
        const worldX = this.snapToGrid(clickCoords.x);
        const worldY = this.snapToGrid(clickCoords.y);

        const indexToRemove = this.getWorldIndexAtPos(worldX, worldY);
        // If there exists a world at the mouse position: remove it, else add a new world
        if (indexToRemove) {
            this.worldPositions.delete(indexToRemove);
            this.model.removeWorldByIndex(indexToRemove);
        } else {
            // Instantiate new world
            this.worldCounter += 1;
            const newWorld = new World(this.worldCounter, `World ${this.worldCounter}`);
            // Store world position and add world to model
            this.worldPositions.set(newWorld.getIndex(), { worldX, worldY });
            this.model.addWorld(newWorld);
        }
    }

    getWorldIndexAtPos(x, y) {
        // Returns index (key of worldPositions) of the world at a given position (or null)
        for (const [index, pos] of this.worldPositions.entries()) {
            if (pos.worldX === x && pos.worldY === y) {
                return index;
            }
        }
        return null;
    }

    getCoordinates(event) {
        // Get mouse position relative to the SVG element
        const rect = this.svgElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    snapToGrid(value) {
        // Round value to multiple of gridSize
        const gridSize = this.svgDrawer.gridSize;
        return Math.round(value / gridSize) * gridSize;
    }
}