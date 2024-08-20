import { UIComponent } from "./ui-component.js";
import { SVGDrawer } from "./svg-drawer.js";
import { World } from "../model/world.js";

export class ModelUI extends UIComponent {
    constructor(model, gridNumber) {
        super(model);
        this.modelUIDiv = document.getElementById("model-ui");
        this.gridNumber = gridNumber;

        // Stores world positions with world as key
        this.worldPositions = new Map();
        // For each link, remember the clicks used to create it
        this.linkClicks = new Map();

        // Counter serves as index for newly created worlds
        this.worldCounter = 0;

        // Relation index 1 is hardcoded for now; later we want the be able to switch between relations
        this.selectedRelation = 1;
        // Stores selected world and click position of the first of two clicks used to create a link 
        this.linkStartPoint = null;

        this.init()
    }

    init() {
        // Add the SVG element that will be the interface for adding/removing and displaying worlds and links
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
            const { worldX, worldY } = this.worldPositions.get(world);
            const isSelected = world === selectedWorld;
            this.svgDrawer.drawWorld(worldX, worldY, isSelected);
        }

        // Draw links
        for (const link of model.getLinks()) {
            const { worldFrom, worldTo, relationIndex } = link;
            const linkKey = this.createLinkKey(worldFrom, worldTo, relationIndex);
            const worldFromPos = this.worldPositions.get(worldFrom);
            const worldToPos = this.worldPositions.get(worldTo);
            const { clickFrom, clickTo } = this.linkClicks.get(linkKey);
            this.svgDrawer.drawLink(worldFromPos, clickFrom, worldToPos, clickTo, relationIndex);
        }
    }

    handleRightClick(event) {
        // Prevent context menu from popping up
        event.preventDefault();
        const clickCoords = this.getCoordinates(event);
        const worldX = this.snapToGrid(clickCoords.x);
        const worldY = this.snapToGrid(clickCoords.y);

        const worldToRemove = this.getWorldAtPos(worldX, worldY);
        // If there exists a world at the mouse position: remove it, else add a new world
        if (worldToRemove) {
            this.worldPositions.delete(worldToRemove);
            this.model.removeWorld(worldToRemove);
        } else {
            // Instantiate new world
            this.worldCounter += 1;
            const newWorld = new World(this.worldCounter);
            // Store world position and add world to model
            this.worldPositions.set(newWorld, { worldX, worldY });
            this.model.addWorld(newWorld);
        }
    }

    handleLeftClick(event) {
        const clickCoords = this.getCoordinates(event);
        const worldX = this.snapToGrid(clickCoords.x);
        const worldY = this.snapToGrid(clickCoords.y);

        const world = this.getWorldAtPos(worldX, worldY);
        if (event.shiftKey) {
            // If shift is pressed...
            if (this.linkStartPoint && world) {
                // ... and first world for link has already been selected
                const worldFrom = this.linkStartPoint.world;
                const linkExists = this.model.isAccessible(this.selectedRelation, worldFrom, world);
                if (linkExists) {
                    // ...and link already exists: remove link
                    this.model.removeLink(this.selectedRelation, worldFrom, world);
                    this.linkStartPoint = null;
                } else {
                    // ...and link doesn't yet  exists: add link
                    const clickFrom = this.linkStartPoint.clickPosition;
                    const linkKey = this.createLinkKey(worldFrom, world, this.selectedRelation);
                    this.linkClicks.set(linkKey, { clickFrom, clickTo: clickCoords });
                    this.model.addLink(this.selectedRelation, worldFrom, world);
                    this.linkStartPoint = null;
                }
            } else if (world) {
                //  ... and first world for link hasn't been clicked yet: remember world and click position
                this.linkStartPoint = { world: world, clickPosition: { x: clickCoords.x, y: clickCoords.y } };
            }
        } else {
            // If shift is not pressed, select world
            this.model.setSelectedWorld(world);
        }
    }

    createLinkKey(worldFrom, worldTo, relationIndex) {
        return `${worldFrom.getIndex()}-${worldTo.getIndex()}-${relationIndex}`;
    }

    getWorldAtPos(x, y) {
        // Returns the world object at a given position (or null if no world is found)
        for (const [world, pos] of this.worldPositions.entries()) {
            if (pos.worldX === x && pos.worldY === y) {
                return world;
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