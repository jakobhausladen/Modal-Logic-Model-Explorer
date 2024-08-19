export class PointedModel {
    constructor() {
        this.worlds = new Set();
        this.selectedWorld = null;
        this.relations = [];
        this.observers = [];
    }

    attachObserver(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    detachObserver(observer) {
        this.observers = this.observers.filter(obs => obs != observer);
    }

    notifyObservers() {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    addWorld(world) {
        this.worlds.add(world);
        this.notifyObservers();
    }

    getWorldByIndex(index) {
        // Find a world based on its index
        for (const world of this.worlds) {
            if (world.getIndex() === index) {
                return world;
            }
        }
        return undefined;
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
        this.notifyObservers();
    }

    removeWorldByIndex(index) {
        const worldToRemove = this.getWorldByIndex(index);
        if (worldToRemove) {
            this.removeWorld(worldToRemove);
        }
    }

    getWorlds() {
        return this.worlds;
    }

    setSelectedWorld(world) {
        if (this.worlds.has(world)) {
            this.selectedWorld = world;
        }
        this.notifyObservers();
    }

    getSelectedWorld() {
        return this.selectedWorld;
    }

    addRelation(relation) {
        this.relations.push(relation);
        this.notifyObservers();
    }

    removeRelation(relationName) {
        this.relations = this.relations.filter(relation => relation.getName() != relationName);
        this.notifyObservers();
    }

    addLink(relationName, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getName() === relationName);
        if (relation) {
            relation.addLink(worldFrom, worldTo);
        }
        this.notifyObservers();
    }

    removeLink(relationName, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getName() === relationName);
        if (relation) {
            relation.removeLink(worldFrom, worldTo);
        }
        this.notifyObservers();
    }

}