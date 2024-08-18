export class PointedModel {
    constructor() {
        this.worlds = new Set();
        this.selectedWorld = null;
        this.relations = [];
    }

    addWorld(world) {
        this.worlds.add(world);
    }

    removeWorld(world) {
        // Remove world
        this.worlds.delete(world);
        // Update accessibility relations
        for (const relation of this.relations) {
            relation.removeWorld(world);
        }
        // If the selected world is removed, set the attribute to null
        if (this.selectedWorld === world) {
            this.selectedWorld = null;
        }
    }

    setSelectedWorld(world) {
        if (this.worlds.has(world)) {
            this.selectedWorld = world;
        }
    }

    getSelectedWorld() {
        return this.selectedWorld;
    }

    addRelation(relation) {
        this.relations.push(relation);
    }

    removeRelation(relationName) {
        this.relations = this.relations.filter(relation => relation.getName() != relationName);
    }

    addLink(relationName, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getName() === relationName);
        if (relation) {
            relation.addLink(worldFrom, worldTo);
        }
    }

    removeLink(relationName, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getName() === relationName);
        if (relation) {
            relation.removeLink(worldFrom, worldTo);
        }
    }



}