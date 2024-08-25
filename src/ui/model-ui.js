import { UIComponent } from "./ui-component.js";
import { SVGDrawer } from "./svg-drawer.js";
import { World } from "../model/world.js";

export class ModelUI extends UIComponent {
    constructor(model, gridNumber, modelGroup, draggingCallback) {
        super(model);
        this.modelUIDiv = document.getElementById("model-ui");
        this.gridNumber = gridNumber;

        this.modelGroup = modelGroup;

        // Since dragging doesn't change the model state (and notify its observers), we need a callback so that the dualUI can remove cross model links when a world is dragged
        this.draggingCallback = draggingCallback;

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

        this.draggedWorld = null;

        this.init()
    }

    init() {
        // Instantiate the SVGDrawer class to draw the grid, worlds, and links
        this.svgDrawer = new SVGDrawer(this.modelGroup, this.gridNumber);

        // Draw the grid
        this.svgDrawer.drawGrid();

        // Event listeners to handle right and left clicks
        this.modelGroup.addEventListener("click", (event) => this.handleLeftClick(event));
        this.modelGroup.addEventListener("contextmenu", (event) => this.handleRightClick(event));

        // Event listeners for the dragging mechanism
        this.modelGroup.addEventListener("mousedown", (event) => this.handleMouseDown(event));
        this.modelGroup.addEventListener("mouseup", (event) => this.handleMouseUp(event));
    }

    update(model) {
        // Update the Model UI when the model state changes: clear layers, draw worlds, draw links
        this.svgDrawer.clear();

        // Draw worlds
        const selectedWorld = model.getSelectedWorld();
        for (const world of model.getWorlds()) {
            const { worldX, worldY } = this.worldPositions.get(world);
            const isSelected = world === selectedWorld;
            const worldName = world.getName();
            const atoms = Array.from(world.getState()).join(', ');
            this.svgDrawer.drawWorld(worldX, worldY, isSelected, worldName, atoms);
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

    handleMouseDown(event) {
        // Remove cross model links in the DualModelUI
        this.draggingCallback();

        // Find world at click position
        const clickCoords = this.getCoordinates(event);
        const worldX = this.snapToGrid(clickCoords.x);
        const worldY = this.snapToGrid(clickCoords.y);
        const world = this.getWorldAtPos(worldX, worldY);

        // Add mousemove event listener to world
        if (world) {
            this.draggedWorld = world;
            this.modelGroup.addEventListener("mousemove", this.handleMouseMove.bind(this));
        }
    }

    handleMouseMove(event) {
        if (!this.draggedWorld) return;

        const mouseCoords = this.getCoordinates(event);
        const newX = this.snapToGrid(mouseCoords.x);
        const newY = this.snapToGrid(mouseCoords.y);

        // Adjust click positions in linkClicks so that they do not change *relative* to the world positions
        this.updateLinkClickPositions({ worldX: newX, worldY: newY });

        // Update world position
        this.worldPositions.set(this.draggedWorld, { worldX: newX, worldY: newY });
        
        // Redraw model with the updated position
        this.update(this.model);
    }

    handleMouseUp(event) {
        // Remove mousemove event listener when the world is released
        this.modelGroup.removeEventListener("mousemove", this.handleMouseMove.bind(this));
        this.draggedWorld = null;
    }

    createLinkKey(worldFrom, worldTo, relationIndex) {
        return `${worldFrom.getIndex()}-${worldTo.getIndex()}-${relationIndex}`;
    }

    updateLinkClickPositions(newWorldPos) {
        // If worlds are dragged, adjust click positions in linkClicks so that they do not change *relative* to the world positions
        const draggedWorldPosition = this.worldPositions.get(this.draggedWorld);
        
        // Iterate over link click pairs
        for (const [linkKey, { clickFrom, clickTo }] of this.linkClicks.entries()) {
            // Parse link key and get worlds
            const [worldFromIndex, worldToIndex] = linkKey.split('-');
            const worldFrom = this.model.getWorldByIndex(parseInt(worldFromIndex));
            const worldTo = this.model.getWorldByIndex(parseInt(worldToIndex));
    
            // If the link does not feature the dragged world: continue
            if (worldFrom !== this.draggedWorld && worldTo !== this.draggedWorld) {
                continue;
            }
    
            // If the dragged world is the link's worldFrom, adjust clickFrom
            if (worldFrom === this.draggedWorld) {
                const offsetX = clickFrom.x - draggedWorldPosition.worldX;
                const offsetY = clickFrom.y - draggedWorldPosition.worldY;
                clickFrom.x = newWorldPos.worldX + offsetX;
                clickFrom.y = newWorldPos.worldY + offsetY;
            }
    
            // If the dragged world is the link's worldTo, adjust clickTo
            if (worldTo === this.draggedWorld) {
                const offsetX = clickTo.x - draggedWorldPosition.worldX;
                const offsetY = clickTo.y - draggedWorldPosition.worldY;
                clickTo.x = newWorldPos.worldX + offsetX;
                clickTo.y = newWorldPos.worldY + offsetY;
            }
        }
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

    getWorldPosition(world) {
        return this.worldPositions.get(world);
    }

    getCoordinates(event) {
        // Get mouse position relative to the SVG element
        const rect = this.modelGroup.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    snapToGrid(value) {
        const gridSize = this.svgDrawer.gridSize;
        // Round to the nearest multiple of gridSize
        let snappedValue = Math.round(value / gridSize) * gridSize;
        // Constrain value to be between gridSize and (gridNumber * gridSize)
        if (snappedValue < gridSize) {
            snappedValue = gridSize;
        } else if (snappedValue > this.gridNumber * gridSize) {
            snappedValue = this.gridNumber * gridSize;
        }
        return snappedValue;
    }
    

    attachGeneratedModel(newModel) {
        // Delete old drawing info
        this.worldPositions = new Map();
        this.linkClicks = new Map();

        // Generate new drawing info
        this.generateWorldPositions(newModel);
        this.generateLinkClicks(newModel);

        // Attach to new model
        console.log("modelUI:", this.model);
        console.log("modelUI detaching");
        this.detach();
        console.log("modelUI:", this.model);
        console.log("modelUI attaching to new model");
        this.attach(newModel);
        console.log("modelUI:", this.model);

        this.update(this.model);
    }

    generateWorldPositions(model) {
        const worlds = model.getWorlds();
        const positions = [];
    
        // Generate random positions
        do {
            let worldX = Math.random() * 500;
            let worldY = Math.random() * 500;
            worldX = this.snapToGrid(worldX);
            worldY = this.snapToGrid(worldY);
    
            const positionOccupied = positions.some(pos => pos.worldX === worldX && pos.worldY === worldY);
    
            if (!positionOccupied) {
                positions.push({ worldX, worldY });
            }
        } while (positions.length < worlds.size);
    
        // Add positions to the worldPositions Map
        let index = 0;
        for (const world of worlds) {
            this.worldPositions.set(world, positions[index]);
            index++;
        }
    }  

    generateLinkClicks(model) {
        const links = model.getLinks();

        for (const link of links) {
            const posFrom = this.worldPositions.get(link.worldFrom);
            const posTo = this.worldPositions.get(link.worldTo);

            const linkKey = this.createLinkKey(link.worldFrom, link.worldTo, link.relationIndex);
            this.linkClicks.set(linkKey, {clickFrom: {x: posFrom.worldX, y : posFrom.worldY}, clickTo: {x: posTo.worldX, y : posTo.worldY}});
        }
    }
}