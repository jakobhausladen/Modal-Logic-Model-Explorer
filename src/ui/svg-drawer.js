export class SVGDrawer {
    constructor(svgElement, svgNS, gridNumber) {
        this.svgElement = svgElement;
        this.svgNS = svgNS;

        // Calculate width/height of grid cells based on number of cells per dimension
        this.gridNumber = gridNumber;
        this.gridSize = parseFloat(this.svgElement.getAttribute("width")) / (this.gridNumber + 1);
        // Radius of worlds
        this.radius = this.gridSize / 3;

        this.init()
    }

    init() {
        // Add seperate layers for grid, worlds, and links to the svgElement
        this.gridLayer = document.createElementNS(this.svgNS, "g");
        this.linkLayer = document.createElementNS(this.svgNS, "g");
        this.worldLayer = document.createElementNS(this.svgNS, "g");
        this.svgElement.appendChild(this.gridLayer);
        this.svgElement.appendChild(this.linkLayer);
        this.svgElement.appendChild(this.worldLayer);
    }

    drawGrid() {
        for (let i = 1; i <= this.gridNumber; i++) {
            for (let j = 1; j <= this.gridNumber; j++) {
                const x = this.gridSize * i;
                const y = this.gridSize * j;

                const gridMarker = document.createElementNS(this.svgNS, "circle");
                gridMarker.setAttribute("cx", x);
                gridMarker.setAttribute("cy", y);
                gridMarker.setAttribute("r", 2);
                gridMarker.setAttribute("fill", "grey");

                this.gridLayer.appendChild(gridMarker);
            }
        }
    }

    drawWorld(worldX, worldY, isSelected) {
        const world = document.createElementNS(this.svgNS, "circle");
        world.setAttribute("cx", worldX);
        world.setAttribute("cy", worldY);
        world.setAttribute("r", this.radius);
        // Highlight world if it is selected
        if (isSelected) {
            world.setAttribute("fill", "lightyellow");
        } else {
            world.setAttribute("fill", "lightgrey");
        }
        world.setAttribute("stroke", "black");
        world.setAttribute("stroke-width", "1px");
        this.worldLayer.appendChild(world);
    }

    clear() {
        this.clearLayer(this.worldLayer);
        this.clearLayer(this.linkLayer);
    }
  
    clearLayer(layer) {
        // Remove all elements from layer
        while (layer.firstChild) {
        layer.removeChild(layer.firstChild);
        }
    }

}