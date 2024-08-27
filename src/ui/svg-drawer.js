export class SVGDrawer {
    constructor(modelGroup, gridNumber) {
        this.modelGroup = modelGroup;
        this.svgNS = "http://www.w3.org/2000/svg";

        // Calculate width/height of grid cells based on number of cells per dimension
        this.gridNumber = gridNumber;
        const MODEL_GROUP_WIDTH = 500 // Dimensions are hard-coded elsewhere; could make it adjustable sometime
        this.gridSize = MODEL_GROUP_WIDTH / (this.gridNumber + 1);
        // Radius of worlds
        this.radius = this.gridSize / 3;

        this.init()
    }

    init() {
        // Add seperate layers for grid, worlds, and links to the modelGroup
        this.gridLayer = document.createElementNS(this.svgNS, "g");
        this.linkLayer = document.createElementNS(this.svgNS, "g");
        this.worldLayer = document.createElementNS(this.svgNS, "g");
        this.modelGroup.appendChild(this.gridLayer);
        this.modelGroup.appendChild(this.linkLayer);
        this.modelGroup.appendChild(this.worldLayer);

        // Create arrowhead marker for links drawing
        this.initArrowheadMarker()
    }

    drawGrid() {
        for (let i = 1; i <= this.gridNumber; i++) {
            for (let j = 1; j <= this.gridNumber; j++) {
                const x = this.gridSize * i;
                const y = this.gridSize * j;

                const gridMarker = document.createElementNS(this.svgNS, "circle");
                gridMarker.classList.add("grid-marker");
                gridMarker.setAttribute("cx", x);
                gridMarker.setAttribute("cy", y);
                gridMarker.setAttribute("r", 2);
                gridMarker.setAttribute("fill", "lightgrey");

                this.gridLayer.appendChild(gridMarker);
            }
        }
    }

    drawWorld(worldX, worldY, isSelected, worldName, atoms) {
        // Draw the world (circle)
        const world = document.createElementNS(this.svgNS, "circle");
        world.classList.add("world");
        world.setAttribute("cx", worldX);
        world.setAttribute("cy", worldY);
        world.setAttribute("r", this.radius);

        // Highlight the world if it is selected
        if (isSelected) {
            world.setAttribute("fill", "lightyellow");
        } else {
            world.setAttribute("fill", "lightgrey");
        }
        world.setAttribute("stroke", "black");
        world.setAttribute("stroke-width", "1px");
        this.worldLayer.appendChild(world);

        // Render atoms list as SVG using MathJax
        const mathJaxOutput = MathJax.tex2svg(atoms);
        const mathJaxSVG = mathJaxOutput.querySelector("svg");

        // Set the width, so the atoms list doesnt extend beyond the circle
        const MAX_WIDTH = this.radius * 1.6;
        mathJaxSVG.setAttribute("width", MAX_WIDTH);
        this.worldLayer.appendChild(mathJaxSVG);

        // Get height of rendered atoms list to adjust the y position
        const bbox = mathJaxSVG.getBoundingClientRect();
        const height = bbox.height;

        // Adjust the position to center the SVG element
        mathJaxSVG.setAttribute("x", worldX - MAX_WIDTH / 2);
        mathJaxSVG.setAttribute("y", worldY - height / 2);
    }

    drawLink(worldFromPos, clickFrom, worldToPos, clickTo, relationId) {
        // relationId currently not used, but will be relevant if we have more than one relation
        const reflexive = this.sameWorldClicked(worldFromPos, worldToPos);
        const straight = this.worldCentersClicked(worldFromPos, clickFrom, worldToPos, clickTo);

        if (reflexive) {
            this.drawReflexiveLink(worldToPos, clickTo);
        } else if (straight) {
            this.drawStraightLink(worldFromPos, worldToPos);
        } else {
            this.drawCurvedLink(worldFromPos, clickFrom, worldToPos, clickTo);
        }
    }

    sameWorldClicked(worldFromPos, worldToPos) {
        return worldFromPos === worldToPos;
    }

    worldCentersClicked(worldFromPos, clickFrom, worldToPos, clickTo) {
        function distanceLessThan(worldPos, clickPosition, d) {
            const sqD = (clickPosition.x - worldPos.worldX) ** 2 + (clickPosition.y - worldPos.worldY) ** 2;
            return sqD < d ** 2;
        }
        const d = this.radius / 2;
        return distanceLessThan(worldFromPos, clickFrom, d) && distanceLessThan(worldToPos, clickTo, d);
    }

    drawReflexiveLink(worldPos, clickPosition) {
        const angleRoundingFactor = Math.PI / 4;
        const angularOffset = Math.PI / 10;
        const controlFactor = 3.5;
        const controlOffset = Math.PI / 5;

        // Get angle between world and clickTo and round to multiple of 45 degrees
        const angle = Math.atan2(clickPosition.y - worldPos.worldY, clickPosition.x - worldPos.worldX);
        const roundedAngle = Math.round(angle / angleRoundingFactor) * angleRoundingFactor;

        // Determine start and end points
        const startX = worldPos.worldX + this.radius * Math.cos(roundedAngle - angularOffset);
        const startY = worldPos.worldY + this.radius * Math.sin(roundedAngle - angularOffset);
        const endX = worldPos.worldX + this.radius * Math.cos(roundedAngle + angularOffset);
        const endY = worldPos.worldY + this.radius * Math.sin(roundedAngle + angularOffset);

        // Determine control points
        const c1X = worldPos.worldX + this.radius * controlFactor * Math.cos(roundedAngle - controlOffset);
        const c1Y = worldPos.worldY + this.radius * controlFactor * Math.sin(roundedAngle - controlOffset);
        const c2X = worldPos.worldX + this.radius * controlFactor * Math.cos(roundedAngle + controlOffset);
        const c2Y = worldPos.worldY + this.radius * controlFactor * Math.sin(roundedAngle + controlOffset);
        
        // Draw Bezier curve
        this.drawCubicBezier(startX, startY, endX, endY, c1X, c1Y, c2X, c2Y);
    }
    
    drawStraightLink(worldFromPos, worldToPos) {
        // Calculate angle
        const angle = Math.atan2(worldToPos.worldY - worldFromPos.worldY, worldToPos.worldX - worldFromPos.worldX);
    
        // Determine start and end points
        const startX = worldFromPos.worldX + this.radius * Math.cos(angle);
        const startY = worldFromPos.worldY + this.radius * Math.sin(angle);
        const endX = worldToPos.worldX - this.radius * Math.cos(angle);
        const endY = worldToPos.worldY - this.radius * Math.sin(angle);
    
        // Draw line
        this.drawStraightLine(startX, startY, endX, endY);
    }

    drawCurvedLink(worldFromPos, clickFrom, worldToPos, clickTo) {
        // Curve style parameters
        const angularOffset = Math.PI / 3;
        // Control distance is dependent on the Euclidean distance between worlds
        const euclD = Math.sqrt((worldToPos.worldX - worldFromPos.worldX) ** 2 + (worldToPos.worldY - worldFromPos.worldY) ** 2);
        let controlDist = euclD;
        const controlAngle = Math.PI / 4;

        // Determine link type from clicks
        const linkType = this.getLinkType(worldFromPos, clickFrom, worldToPos, clickTo);

        // Check if we need to add or subtract angles
        let angularOffsetStart, angularOffsetEnd, controlAngleStart, controlAngleEnd;
        switch (linkType) {
            case "left-right-below-below":
            case "right-left-above-above":
                controlDist = controlDist / 3;
                angularOffsetStart = angularOffset;
                angularOffsetEnd = -angularOffset;
                controlAngleStart = controlAngle;
                controlAngleEnd = -controlAngle;
                break;
            case "left-right-above-above":
            case "right-left-below-below":
                controlDist = controlDist / 3;
                angularOffsetStart = -angularOffset;
                angularOffsetEnd = angularOffset;
                controlAngleStart = -controlAngle;
                controlAngleEnd = controlAngle;
                break;
            case "left-right-below-above":
            case "right-left-above-below":
                controlDist = controlDist / 2;
                angularOffsetStart = angularOffset;
                angularOffsetEnd = angularOffset;
                controlAngleStart = controlAngle;
                controlAngleEnd = controlAngle;
                break;
            case "left-right-above-below":
            case "right-left-below-above":
                controlDist = controlDist / 2;
                angularOffsetStart = -angularOffset;
                angularOffsetEnd = -angularOffset;
                controlAngleStart = -controlAngle;
                controlAngleEnd = -controlAngle;
                break;
            default:
                throw new Error("Style parameter not found or not accepted.");
        }

        // Determine start and endpoints
        const angle = Math.atan2(worldToPos.worldY - worldFromPos.worldY, worldToPos.worldX - worldFromPos.worldX);
        const startX = worldFromPos.worldX + this.radius * Math.cos(angularOffsetStart + angle);
        const startY = worldFromPos.worldY + this.radius * Math.sin(angularOffsetStart + angle);
        const endX = worldToPos.worldX - this.radius * Math.cos(angularOffsetEnd + angle);
        const endY = worldToPos.worldY - this.radius * Math.sin(angularOffsetEnd + angle);

        // Determine control points
        const controlStartX = startX + controlDist * Math.cos(controlAngleStart + angle);
        const controlStartY = startY + controlDist * Math.sin(controlAngleStart + angle);
        const controlEndX = endX - controlDist * Math.cos(controlAngleEnd + angle);
        const controlEndY = endY - controlDist * Math.sin(controlAngleEnd + angle);

        this.drawCubicBezier(startX, startY, endX, endY, controlStartX, controlStartY, controlEndX, controlEndY);
    }

    initArrowheadMarker() {
        const marker = document.createElementNS(this.svgNS, "marker");
        // Marker can be referenced by its id "arrowhead"
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "10"); // Tip at line end
        marker.setAttribute("refY", "3.5"); // Centered
        marker.setAttribute("orient", "auto");

        const path = document.createElementNS(this.svgNS, "path");
        path.setAttribute("d", "M 0 0 L 10 3.5 L 0 7 Z"); // Triangle
        path.setAttribute("fill", "black");
        marker.appendChild(path);

        // Append marker to the SVG
        this.modelGroup.appendChild(marker);
    }

    drawStraightLine(x1, y1, x2, y2) {
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", "1px");
        line.setAttribute("marker-end", "url(#arrowhead)");
        this.linkLayer.appendChild(line);
    }
    
    drawCubicBezier(x1, y1, x2, y2, cx1, cy1, cx2, cy2) {
        const path = document.createElementNS(this.svgNS, "path");
        const d = `M ${x1},${y1} C ${cx1},${cy1}, ${cx2},${cy2}, ${x2},${y2}`;
        path.setAttribute("d", d);
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "1px");
        path.setAttribute("fill", "none");
        path.setAttribute("marker-end", "url(#arrowhead)");
        this.linkLayer.appendChild(path);
    }

    getLinkType(worldFromPos, clickFrom, worldToPos, clickTo) {
        // Returns the position of the clicks relative to the world centers and if the connection is drawn left-right or right-left
        const relClickPosFrom = this.getRelativeClickPosition(worldFromPos, worldToPos, clickFrom);
        const relClickPosTo = this.getRelativeClickPosition(worldFromPos, worldToPos, clickTo);
        const relWorldPos = this.getRelativeWorldPosition(worldFromPos, worldToPos);
        // String is used to determine appropriate control points for the Bezier curves
        return `${relWorldPos}-${relClickPosFrom}-${relClickPosTo}`;
    }

    getRelativeWorldPosition(worldFromPos, worldToPos) {
        // Checks if worldFrom is to the left (below) or to the right (above) from worldTo
        if (worldFromPos.worldX === worldToPos.worldX) {
            if (worldFromPos.worldY < worldToPos.worldY) {
                return "right-left";
            } else {
                return "left-right";
            }
        } else if (worldFromPos.worldX < worldToPos.worldX) {
            return "left-right";
        } else {
            return "right-left";
        }
    }

    getRelativeClickPosition(worldFromPos, worldToPos, clickPosition) {
        // Checks if the click is above or below the line connecting the two world centers
        // Vertical case
        if (worldFromPos.worldX === worldToPos.worldX) {
            if (clickPosition.x >= worldFromPos.worldX) {
                return "below";
            } else {
                return "above";
            }
        }
    
        // Calculate coeffs of line equation
        const slope = (worldToPos.worldY - worldFromPos.worldY) / (worldToPos.worldX - worldFromPos.worldX);
        const intercept = worldFromPos.worldY - slope * worldFromPos.worldX;
        // Get the y value of the line at the x position of the click
        const y = slope * clickPosition.x + intercept;
        if (clickPosition.y >= y) {
            return "below";
        } else {
            return "above";
        }
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