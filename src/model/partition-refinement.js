import { World } from "./world.js";
import { AccessibilityRelation } from "./accessibility-relation.js";
import { PointedModel } from "./pointed-model.js";

export class PartitionRefinement {

    getInitialPartition(model) {
        // Determine initial partitioning based on state identity
        const initialPartition = new Set();

        const worlds = model.getWorlds();
        for (const world of worlds) {
            let addedToExistingClass = false;
            for (const block of initialPartition) {
                const representative = block.values().next().value;
                if (world.sameState(representative)) {
                    block.add(world);
                    addedToExistingClass = true;
                    break;
                }
            }
            if (!addedToExistingClass) {
                const newBlock = new Set([world]);
                initialPartition.add(newBlock);
            }
        }

        return initialPartition;
    }

    getEquivClass(partition, world) {
        // Returns the equiv class of "partition" that contains "world"
        for (const equivClass of partition) {
            if (equivClass.has(world)) {
                return equivClass;
            }
        }
    }

    getPredecessors(model, world) {
        // Return the set of all worlds linking to "world"
        const linkingWorlds = model.getLinkingWorlds(1, world);
        return new Set(linkingWorlds);
    }

    deepCopyPartition(partition) {
        // Create a deep copy of a set of sets (world references still shared)
        const copy = new Set();
        for (const equivClass of partition) {
            copy.add(new Set(equivClass));
        }
        return copy;
    }

    refinePartition(partition, splitter, model) {
        // Newly created equivalence classes are stored in a map that associated them with the classes their members originally come from
        const newEquivClasses = new Map();

        for (const w of splitter) {
            const preW = this.getPredecessors(model, w);

            for (const v of preW) {
                const equivClass = this.getEquivClass(partition, v);

                // Multiple worlds of the splitter might try to move the same world if it is part of their preW, so we need to check if the equiv class still exists
                if (equivClass) {
                    // For each equivalence class, create a new class where we move its members that are in preW
                    if (newEquivClasses.has(equivClass)) {
                        newEquivClasses.get(equivClass).add(v);
                    } else {
                        newEquivClasses.set(equivClass, new Set([v]));
                    }

                    // Delete it from the original equivalence class, so that it only keeps the members that are not in preW
                    equivClass.delete(v);
                    // Remove class if it is empty after removing the world
                    if (equivClass.size === 0) {
                        partition.delete(equivClass);
                    }
                }
            }
        }
        // Add the new classes to the partition
        for (const [key, equivClass] of newEquivClasses.entries()) {
            partition.add(equivClass);
        }
    }

    kanellakisSmolkaAlgorithm(model) {
        const partition = this.getInitialPartition(model);

        console.log("Initial partition:")
        for (const equivClass of partition) {
            console.log("class:");
            for (const world of equivClass) {
                console.log(world.getIndex());
            }
        }

        let oldPartition;

        do {
            oldPartition = this.deepCopyPartition(partition);

            for (const equivClass of oldPartition) {
                this.refinePartition(partition, equivClass, model);
            }

            console.log("New partition:")
            for (const equivClass of partition) {
                console.log("class:");
                for (const world of equivClass) {
                    console.log(world.getIndex());
                }
            }

        } while (partition.size !== oldPartition.size);

        return partition;
    }

    getInducedModel(origModel, bisimPartition) {
        const partition = Array.from(bisimPartition);
        const newModel = new PointedModel();

        for (const [index, equivClass] of partition.entries()) {
            const newWorld = new World(index);
            console.log(equivClass);
            const atoms = equivClass.values().next().value.getState();
            newWorld.setState(atoms);
            newModel.addWorld(newWorld);

            if (equivClass.has(origModel.getSelectedWorld())) {
                newModel.setSelectedWorld(newWorld);
            }
        }

        // Relation with index 1: { worldFrom, worldTo, relationIndex }
        const origLinks = origModel.getRelationLinks(1);

        const newRelation = new AccessibilityRelation(1);
        newModel.addRelation(newRelation);

        for (const link of origLinks) {
            const indexFrom = partition.findIndex(equivClass => equivClass.has(link.worldFrom));
            const worldFrom = newModel.getWorldByIndex(indexFrom);
            const indexTo = partition.findIndex(equivClass => equivClass.has(link.worldTo));
            const worldTo = newModel.getWorldByIndex(indexTo);

            newModel.addLink(1, worldFrom, worldTo);
        }
        
        return newModel;
    }

    reduceModel(model) {
        const partition = this.kanellakisSmolkaAlgorithm(model);
        const inducedModel = this.getInducedModel(model, partition);
        return inducedModel;
    }

    combineModels(model1, model2) {
        const worlds1 = model1.getWorlds();
        const worlds2 = model2.getWorlds();
        const worldsUnion = new Set([...worlds1, ...worlds2]);
    
        const links1 = model1.getLinks();
        const links2 = model2.getLinks();
        const linksUnion = [...links1, ...links2];
    
        // Create new model and add worlds and links
        const combinedModel = new PointedModel();
        const relation = new AccessibilityRelation(1);
        combinedModel.addRelation(relation);

        for (const world of worldsUnion) {
            combinedModel.addWorld(world);
        }
        for (const { worldFrom, worldTo, relationIndex } of linksUnion) {
            combinedModel.addLink(relationIndex, worldFrom, worldTo);
        }
    
        return combinedModel;
    }

    constructBisimulation(model1, model2) {
        const combinedModel = this.combineModels(model1, model2);
        const partition = this.kanellakisSmolkaAlgorithm(combinedModel);

        const worlds1 = model1.getWorlds();
        const worlds2 = model2.getWorlds();

        const bisimulation = [];

        for (const equivClass of partition) {
            for (const w1 of equivClass) {
                for (const w2 of equivClass) {
                    if (worlds1.has(w1) && worlds2.has(w2)) {
                        bisimulation.push({w1, w2});
                    }
                }
            }
        }

        return bisimulation;
    }
    
}