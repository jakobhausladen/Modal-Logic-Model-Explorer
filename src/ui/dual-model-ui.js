import { ModelUI } from "./model-ui.js";
import { FormulaUI } from "./formula-ui.js";
import { PartitionRefinement } from "../model/partition-refinement.js";

export class DualModelUI {
    constructor(leftModel, rightModel, worldUI, gridNumber) {
        this.leftModel = leftModel;
        this.rightModel = rightModel;
        this.attach()

        this.activeModel = this.leftModel;
        this.worldUI = worldUI;
        this.formulaUI = new FormulaUI(this.leftModel, this.setRightModel.bind(this));

        this.gridNumber = gridNumber;
        const MODEL_GROUP_WIDTH = 500 // Dimensions are hard-coded elsewhere; could make it adjustable sometime
        this.gridSize = MODEL_GROUP_WIDTH / (this.gridNumber + 1);
        this.radius = this.gridSize / 3;

        this.partitionRefinement = new PartitionRefinement();

        this.init();
    }

    init() {
        this.modelUIDiv = document.getElementById("model-ui");

        this.drawingBoardsDiv = document.createElement("div");
        this.drawingBoardsDiv.id = "drawing-boards";
        this.modelUIDiv.appendChild(this.drawingBoardsDiv);
    
        // Add the SVG element that will be the interface for adding/removing and displaying worlds and links
        this.svgNS = "http://www.w3.org/2000/svg";
        this.svgElement = document.createElementNS(this.svgNS, "svg");
        this.svgElement.setAttribute("width", "1000");
        this.svgElement.setAttribute("height", "500");
        this.drawingBoardsDiv.appendChild(this.svgElement);
    
        // Create group that covers the left half of the SVG
        const leftGroup = document.createElementNS(this.svgNS, "g");
        leftGroup.setAttribute("transform", "translate(0, 0)");
        this.svgElement.appendChild(leftGroup);
        const leftRect = document.createElementNS(this.svgNS, "rect");
        leftRect.setAttribute("width", 500);
        leftRect.setAttribute("height", 500);
        leftRect.setAttribute("fill", "white");
        leftGroup.appendChild(leftRect);
    
        // Create group that covers the right half of the SVG
        const rightGroup = document.createElementNS(this.svgNS, "g");
        rightGroup.setAttribute("transform", "translate(500, 0)");
        this.svgElement.appendChild(rightGroup);
        const rightRect = document.createElementNS(this.svgNS, "rect");
        rightRect.setAttribute("width", 500);
        rightRect.setAttribute("height", 500);
        rightRect.setAttribute("fill", "white");
        rightGroup.appendChild(rightRect);

        // Line separates the two drawing boards
        const line = document.createElementNS(this.svgNS, "line");
        line.classList.add("division-line");
        line.setAttribute("x1", 500);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", 500);
        line.setAttribute("y2", 500);
        line.setAttribute("stroke", "lightgrey");
        line.setAttribute("stroke-width", 1);
        this.svgElement.append(line);

        this.buttonsDiv = document.createElement("div");
        this.buttonsDiv.id = "model-buttons-container";
        this.modelUIDiv.appendChild(this.buttonsDiv);

        // Reduce model button
        this.reduceButton = document.createElement("button");
        this.reduceButton.id = "reduceButton";
        this.reduceButton.textContent = "Reduce Model";
        this.buttonsDiv.appendChild(this.reduceButton);

        this.reduceButton.addEventListener("click", (event) => {
            this.reduceLeftModel();
        });

        // Layer to draw cross-model links on
        this.linkLayer = document.createElementNS(this.svgNS, "g");
        this.svgElement.append(this.linkLayer);

        // Bisimulation button
        this.bisimButton = document.createElement("button");
        this.bisimButton.id = "bisimButton";
        this.bisimButton.textContent = "Bisimulation";
        this.buttonsDiv.appendChild(this.bisimButton);

        this.bisimButton.addEventListener("click", (event) => {
            this.clearLinkLayer();
            this.drawBisimulation();
        });

        // Download button
        this.downloadButton = document.createElement("button");
        this.downloadButton.id = "downloadButton";
        this.downloadButton.textContent = "Download SVG";
        this.buttonsDiv.appendChild(this.downloadButton);

        this.downloadButton.addEventListener("click", (event) => {
            this.downloadSVG();
        });

        // Instantiate UIs for the two models
        this.leftModelUI = new ModelUI(this.leftModel, this.gridNumber, leftGroup, this.clearLinkLayer.bind(this));
        this.rightModelUI = new ModelUI(this.rightModel, this.gridNumber, rightGroup, this.clearLinkLayer.bind(this));
    }
    
    attach() {
        // Start observing left and right model
        this.leftModel.attachObserver(this);
        this.rightModel.attachObserver(this);
    }

    detach() {
        // Stop observing left and right model
        this.leftModel.detachObserver(this);
        this.rightModel.detachObserver(this);
    }

    update(model) {
        // If one of the observed models notifies a change: attach worldUI and formulaUI to this model
        if (model !== this.activeModel) {
            this.activeModel = model;
            this.worldUI.detach();
            this.formulaUI.detach();
            this.worldUI.attach(this.activeModel);
            this.formulaUI.attach(this.activeModel);
        }
        
        // Remove bisimulation if one of the models changes
        this.clearLinkLayer();
    }

    reduceLeftModel() {
        // Instatiate reduced model
        const reducedModel = this.partitionRefinement.reduceModel(this.leftModel);
        this.setRightModel(reducedModel);
    }

    setRightModel(model) {
        // Remove cross-model links
        this.clearLinkLayer()
        // Let right modelUI generate drawing information and attach to the model
        this.rightModelUI.attachGeneratedModel(model);
        // Set rightModel to the new model
        this.rightModel = model;
        // Stop observing the pevious right model and start observing the new right model
        this.detach();
        this.attach();
    }

    drawBisimulation() {
        const bisimulation = this.partitionRefinement.constructBisimulation(this.leftModel, this.rightModel);
        for (const { w1, w2 } of bisimulation) {
            const world1Pos = this.leftModelUI.getWorldPosition(w1);
            // Adjust the x position by 500 (original is relative to the right drawing board) and create copy to avoid modifying the original position
            const world2Pos = { ...this.rightModelUI.getWorldPosition(w2), worldX: this.rightModelUI.getWorldPosition(w2).worldX + 500 };

            this.drawCrossModelLink(world1Pos, world2Pos);
        }
    } 

    drawCrossModelLink(worldFromPos, worldToPos) {
        // Calculate angle
        const angle = Math.atan2(worldToPos.worldY - worldFromPos.worldY, worldToPos.worldX - worldFromPos.worldX);
    
        // Small gap between world edge and link start/endpoint
        const DISTANCE_FACTOR = 1.4;
        const distToCenter = this.radius * DISTANCE_FACTOR;
        // Determine start and end points
        const startX = worldFromPos.worldX + distToCenter * Math.cos(angle);
        const startY = worldFromPos.worldY + distToCenter * Math.sin(angle);
        const endX = worldToPos.worldX - distToCenter * Math.cos(angle);
        const endY = worldToPos.worldY - distToCenter * Math.sin(angle);
    
        console.log(startX, startY, endX, endY);

        // Draw line
        this.drawStraightLine(startX, startY, endX, endY);
    }

    drawStraightLine(x1, y1, x2, y2) {
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "red");
        line.setAttribute("stroke-width", "1px");
        line.setAttribute("stroke-dasharray", "5,5");

        this.linkLayer.appendChild(line);
    }

    clearLinkLayer() {
        const layer = this.linkLayer;
        while (layer.firstChild) {
            layer.removeChild(layer.firstChild);
        }
    }

    downloadSVG() {
        // Create copy of SVG
        const svgCopy = this.svgElement.cloneNode(true);

        // Remove line that seperates the two models and all grid markers
        const elementsToRemove = svgCopy.querySelectorAll('.division-line, .grid-marker');
        elementsToRemove.forEach(element => element.remove());
        
        // Turn SVG into a Data URL
        const svgData = new XMLSerializer().serializeToString(svgCopy);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        // Temporary <a> element
        const downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "model.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

}