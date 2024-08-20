import { DefaultMap } from "../utils/default-map.js";

export class AccessibilityRelation {
    constructor(index, name=`Relation ${index}`) {
        this.index = index;
        this.name = name;
        this.links = new DefaultMap(() => new Set());
    }

    getIndex() {
        return this.index;
    }

    getName() {
        return this.name;
    }

    setName(name) {
        this.name = name;
    }

    addLink(worldFrom, worldTo) {
        this.links.get(worldFrom).add(worldTo);
    }

    removeLink(worldFrom, worldTo) {
        this.links.get(worldFrom).delete(worldTo);
    }

    getLinks() {
        // Returns an array of link objects of the form { worldFrom, worldTo, relationIndex }
        const linkObjects = [];
        for (const [worldFrom, accessibleWorlds] of this.links.entries()) {
            for (const worldTo of accessibleWorlds) {
                linkObjects.push({ worldFrom, worldTo, relationIndex: this.index });
            }
        }
        return linkObjects;
    }

    removeWorld(world) {
        // Remove outgoing links
        this.links.delete(world);

        // Remove ingoing links
        for (const [worldFrom, accessibleWorlds] of this.links.entries()) {
            accessibleWorlds.delete(world);
        }
    }

    isAccessible(worldFrom, worldTo) {
        return this.links.get(worldFrom).has(worldTo);
    }

    getAccessibleWorlds(worldFrom) {
        return this.links.get(worldFrom);
    }
}