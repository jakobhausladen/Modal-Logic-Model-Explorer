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

    getWorlds() {
        return this.worlds;
    }

    getWorldById(id) {
        for (const world of this.worlds) {
            if (world.getId() === id) {
                return world;
            }
        }
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

    removeRelation(relationId) {
        this.relations = this.relations.filter(relation => relation.getId() != relationId);
        this.notifyObservers();
    }

    addLink(relationId, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getId() === relationId);
        if (relation) {
            relation.addLink(worldFrom, worldTo);
        }
        this.notifyObservers();
    }

    removeLink(relationId, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getId() === relationId);
        if (relation) {
            relation.removeLink(worldFrom, worldTo);
        }
        this.notifyObservers();
    }

    getLinks() {
        // Returns an array of link objects of the form { worldFrom, worldTo, relationId }
        const allLinks = [];
        for (const relation of this.relations) {
            const relationLinks = relation.getLinks();
            allLinks.push(...relationLinks);
        }
        return allLinks;
    }

    getRelationLinks(relationId) {
        const relation = this.relations.find(relation => relation.getId() === relationId);
        return relation.getLinks();
    }

    isAccessible(relationId, worldFrom, worldTo) {
        const relation = this.relations.find(relation => relation.getId() === relationId);
        return relation.isAccessible(worldFrom, worldTo);
    }

    getAccessibleWorlds(relationId, worldFrom) {
        const relation = this.relations.find(relation => relation.getId() === relationId);
        return relation.getAccessibleWorlds(worldFrom);
    }

    getLinkingWorlds(relationId, worldTo) {
        // Returns worlds that link to a given world
        const relation = this.relations.find(relation => relation.getId() === relationId);
        return relation.getLinkingWorlds(worldTo);
    }

    setStateOfSelectedWorld(atoms) {
        this.selectedWorld.setState(atoms);
        this.notifyObservers();
    }

    setNameOfSelectedWorld(name) {
        this.selectedWorld.setName(name);
        this.notifyObservers();
    }
}