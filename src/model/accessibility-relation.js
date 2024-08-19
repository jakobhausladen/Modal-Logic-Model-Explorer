import { DefaultMap } from "../utils/default-map.js";

export class AccessibilityRelation {
    constructor(name) {
        this.name = name;
        this.links = new DefaultMap(() => new Set());
    }

    getName() {
        return this.name;
    }

    addLink(worldFrom, worldTo) {
        this.links.get(worldFrom).add(worldTo);
    }

    removeLink(worldFrom, worldTo) {
        this.links.get(worldFrom).delete(worldTo);
    }

    removeWorld(world) {
        // Remove outgoing links
        this.links.delete(world);

        // Remove ingoing links
        for (const [worldFrom, accessibleWorlds] of this.links.entries()) {
            accessibleWorlds.delete(world);
        }
    }
}