import { DefaultMap } from "../utils/default-map.js";

export class AccessibilityRelation {
    constructor(id, name=`Relation ${id}`) {
        this.id = id;
        this.name = name;
        this.links = new DefaultMap(() => new Set());
    }

    getId() {
        return this.id;
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
        // Returns an array of link objects of the form { worldFrom, worldTo, relationId }
        const linkObjects = [];
        for (const [worldFrom, accessibleWorlds] of this.links.entries()) {
            for (const worldTo of accessibleWorlds) {
                linkObjects.push({ worldFrom, worldTo, relationId: this.id });
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
        return Array.from(this.links.get(worldFrom));
    }

    getLinkingWorlds(worldTo) {
        // Returns worlds that link to a given world
        const linkingWorlds = [];
        for (const [worldFrom, accessibleWorlds] of this.links.entries()) {
            if (accessibleWorlds.has(worldTo)) {
                linkingWorlds.push(worldFrom);
            }
        }
        return linkingWorlds;
    }
}