import { AtomicFormula, Negation, Conjunction, Disjunction, MaterialImplication, Possibility, Necessity } from "../language/formulas.js";
import { World } from "./world.js";
import { AccessibilityRelation } from "./accessibility-relation.js";
import { PointedModel } from "./pointed-model.js";

class Node {
    constructor(formula, world) {
        this.formula = formula;
        this.world = world;
        // unprocessed: 0; needs to be processed by a second rule: 1; fully processed: 2
        this.processed = 0;
        this.children = [];
    }
}

export class Tableaux {
    constructor(formula) {
        this.rootNode = new Node(formula, 0);
        this.openBranches = [];
        this.rules = [
            // Non-branching rules
            this.conjunctionRuleLeft.bind(this),
            this.conjunctionRuleRight.bind(this),
            this.doubleNegationRule.bind(this),
            this.negatedPossibilityRule.bind(this),
            this.negatedNecessityRule.bind(this),
            this.possibilityRule.bind(this),
            this.necessityRule.bind(this),
            this.negatedDisjunctionRuleLeft.bind(this),
            this.negatedDisjunctionRuleRight.bind(this),
            this.negatedImplicationRuleLeft.bind(this),
            this.negatedImplicationRuleRight.bind(this),
            // Branching rules
            this.implicationRule.bind(this),
            this.disjunctionRule.bind(this),
            this.negatedConjunctionRule.bind(this)
        ];

        this.growTree(this.rootNode, [], [0], [], []);
    }

    growTree(node, ancestorNodes, worlds, links, literals) {
        // Create a copy of the parameters for the current level of recursion
        const currentAncestorNodes = [...ancestorNodes, node];
        const currentWorlds = [...worlds];
        const currentLinks = [...links];
        const newLiterals = this.findLiterals(currentAncestorNodes);
        const currentLiterals = [...literals, ...newLiterals];

        const closed = this.branchClosed(currentLiterals);
        if (closed) { return };

        const result = this.applyRule(currentAncestorNodes, currentWorlds, currentLinks);

        // If (result != null), a rule has successfully been applied to the ancestor nodes
        if (result) {
            const { children, processedNode, newWorld, newLink } = result;

            node.children = children;
            if (newWorld) { currentWorlds.push(newWorld) };
            if (newLink) { currentLinks.push(newLink) };

            // Process children
            for (const child of node.children) {
                this.growTree(child, currentAncestorNodes, currentWorlds, currentLinks, currentLiterals);
            }

            // Restore the status of the node that has been marked as processed or partially processed
            processedNode.node.processed = processedNode.prevStatus;

        } else {
            // If the branch is not closed and cannot be further developed, store its literals, worlds, and links
            this.openBranches.push({ literals: currentLiterals, worlds: currentWorlds, links: currentLinks });
        }
    }

    applyRule(ancestorNodes, worlds, links) {
        for (const rule of this.rules) {
            const result = rule(ancestorNodes, worlds, links);
            if (result) {
                console.log("Processed node:", result.processedNode.node.formula.toLaTeX(), result.processedNode.node.world);
                for (const newChild of result.children) {
                    console.log("created new child:", newChild.formula.toLaTeX(), newChild.world);
                }
                return result;
            }
        }
        return null;
    }
    
    disjunctionRule(ancestorNodes, worlds, links) {
        // Get unprocessed disjunctions
        const disjunctions = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Disjunction);
        if (disjunctions.length > 0) {
            const node = disjunctions[0];
            node.processed = 2;
            const leftChild = new Node(node.formula.subLeft, node.world);
            const rightChild = new Node(node.formula.subRight, node.world);
            return {
                children: [leftChild, rightChild],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    conjunctionRuleLeft(ancestorNodes, worlds, links) {
        // Get unprocessed conjunctions
        const conjunctions = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Conjunction);
        if (conjunctions.length > 0) {
            const node = conjunctions[0];
            node.processed = 1;
            return {
                children: [new Node(node.formula.subLeft, node.world)],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    conjunctionRuleRight(ancestorNodes, worlds, links) {
        // Get conjunctions where the left conjunct has been processed
        const conjunctions = ancestorNodes.filter(node => node.processed === 1 && node.formula instanceof Conjunction);
        if (conjunctions.length > 0) {
            const node = conjunctions[0];
            node.processed = 2;
            return {
                children: [new Node(node.formula.subRight, node.world)],
                processedNode: { node, prevStatus: 1},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    implicationRule(ancestorNodes, worlds, links) {
        // Get unprocessed implications
        const implications = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof MaterialImplication);
        if (implications.length > 0) {
            const node = implications[0];
            node.processed = 2;
            const leftChild = new Node(new Negation(node.formula.subLeft), node.world);
            const rightChild = new Node(node.formula.subRight, node.world);
            return {
                children: [leftChild, rightChild],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    possibilityRule(ancestorNodes, worlds, links) {
        // Get unprocessed possibility formulas
        const possibilities = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Possibility);
        if (possibilities.length > 0) {
            const node = possibilities[0];
            node.processed = 2;
            const newWorld = Math.max(...worlds) + 1;
            return {
                children: [new Node(node.formula.subFormula, newWorld)],
                processedNode: { node, prevStatus: 0},
                newWorld: newWorld,
                newLink: { worldFrom: node.world, worldTo: newWorld }
            };
        } else {
            return null;
        }
    }

    necessityRule(ancestorNodes, worlds, links) {
        // Get all necessity formulas
        const necessities = ancestorNodes.filter(node => node.formula instanceof Necessity);
        for (const node of necessities) {
            const outgoingLinks = links.filter(link => link.worldFrom  === node.world);
            for (const link of outgoingLinks) {
                const worldTo = link.worldTo;
                // We don't create a new instance of the necessites subformula so it is legitimate to compare ancestor.formula === node.formula.subFormula
                const formulaWorldTo = ancestorNodes.find(ancestor => ancestor.formula === node.formula.subFormula && ancestor.world === worldTo);
                if (!formulaWorldTo) {
                    return {
                        children: [new Node(node.formula.subFormula, worldTo)],
                        processedNode: { node, prevStatus: 0},
                        newWorld: null,
                        newLink: null
                    };
                }
            }
        }
        return null;
    }

    doubleNegationRule(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        // Get unprocessed double negations
        const doubleNegations = negations.filter(node => node.formula.subFormula instanceof Negation);
        if (doubleNegations.length > 0) {
            const node = doubleNegations[0];
            node.processed = 2;
            return {
                children: [new Node(node.formula.subFormula.subFormula, node.world)],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedPossibilityRule(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        // Get unprocessed negated possibilities
        const negatedPossibilities = negations.filter(node => node.formula.subFormula instanceof Possibility);
        if (negatedPossibilities.length > 0) {
            const node = negatedPossibilities[0];
            node.processed = 2;
            return {
                children: [new Node(new Necessity(new Negation(node.formula.subFormula.subFormula)), node.world)],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedNecessityRule(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        // Get unprocessed negated necessities
        const negatedNecessities = negations.filter(node => node.formula.subFormula instanceof Necessity);
        if (negatedNecessities.length > 0) {
            const node = negatedNecessities[0];
            node.processed = 2;
            return {
                children: [new Node(new Possibility(new Negation(node.formula.subFormula.subFormula)), node.world)],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedConjunctionRule(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        // Get unprocessed negated conjunctions
        const negatedConjunctions = negations.filter(node => node.formula.subFormula instanceof Conjunction);
        if (negatedConjunctions.length > 0) {
            const node = negatedConjunctions[0];
            node.processed = 2;
            const leftChild = new Node(new Negation(node.formula.subFormula.subLeft), node.world);
            const rightChild = new Node(new Negation(node.formula.subFormula.subRight), node.world);
            return {
                children: [leftChild, rightChild],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedDisjunctionRuleLeft(ancestorNodes, worlds, links) {
         // Get unprocessed negations
         const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
         // Get unprocessed negated disjunctions
         const negatedDisjunctions = negations.filter(node => node.formula.subFormula instanceof Disjunction);
        if (negatedDisjunctions.length > 0) {
            const node = negatedDisjunctions[0];
            node.processed = 1;
            return {
                children: [new Node(new Negation(node.formula.subFormula.subLeft), node.world)],
                processedNode: { node, prevStatus: 0},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedDisjunctionRuleRight(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 1 && node.formula instanceof Negation);
        // Get negated conjunctions where the left disjunct has been processed
        const negatedDisjunctions = negations.filter(node => node.formula.subFormula instanceof Disjunction);
        if (negatedDisjunctions.length > 0) {
            const node = negatedDisjunctions[0];
            node.processed = 2;
            return {
                children: [new Node(new Negation(node.formula.subFormula.subRight), node.world)],
                processedNode: { node, prevStatus: 1},
                newWorld: null,
                newLink: null
            };
        } else {
            return null;
        }
    }

    negatedImplicationRuleLeft(ancestorNodes, worlds, links) {
        // Get unprocessed negations
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        // Get unprocessed negated implications
        const negatedImplications = negations.filter(node => node.formula.subFormula instanceof MaterialImplication);
       if (negatedImplications.length > 0) {
           const node = negatedImplications[0];
           node.processed = 1;
           return {
               children: [new Node(node.formula.subFormula.subLeft, node.world)],
               processedNode: { node, prevStatus: 0},
               newWorld: null,
               newLink: null
           };
       } else {
           return null;
       }
   }

   negatedImplicationRuleRight(ancestorNodes, worlds, links) {
       // Get unprocessed negations
       const negations = ancestorNodes.filter(node => node.processed === 1 && node.formula instanceof Negation);
       // Get negated implications where the antecedent has been processed
       const negatedImplications = negations.filter(node => node.formula.subFormula instanceof MaterialImplication);
       if (negatedImplications.length > 0) {
           const node = negatedImplications[0];
           node.processed = 2;
           return {
               children: [new Node(new Negation(node.formula.subFormula.subRight), node.world)],
               processedNode: { node, prevStatus: 1},
               newWorld: null,
               newLink: null
           };
       } else {
           return null;
       }
   }

    findLiterals(ancestorNodes) {
        // Get unprocessed atomic formulas
        const atoms = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof AtomicFormula);
        const negations = ancestorNodes.filter(node => node.processed === 0 && node.formula instanceof Negation);
        const negatedAtoms = negations.filter(node => node.formula.subFormula instanceof AtomicFormula);

        const newLiterals = [];
        for (const literal of [...atoms, ...negatedAtoms]) {
            literal.processed = 2;
            newLiterals.push({ formula: literal.formula, world: literal.world});
        }
        return newLiterals;
    }

    branchClosed(literals) {
        const negations = literals.filter(literal => literal.formula instanceof Negation);
        const atoms = literals.filter(literal => literal.formula instanceof AtomicFormula);
        for (const negation of negations) {
            for (const atom of atoms) {
                if (negation.formula.subFormula.atom === atom.formula.atom) {
                    return true;
                }
            }
        }
        return false;
    }

    printTree(node = this.rootNode, depth = 0) {
        const indentation = "    ".repeat(depth);
        console.log(`${indentation}${node.formula.toLaTeX()} [World: ${node.world}]`);
        
        // Recursively print each child node
        for (const child of node.children) {
            this.printTree(child, depth + 1);
        }
    }

    hasModel() {
        return this.openBranches.length > 0;
    }

    constructModel() {
        if (this.hasModel()) {
            // Create new model
            const model = new PointedModel();
            const relation = new AccessibilityRelation(1);
            model.addRelation(relation);

            // Get first open branch
            const { literals, worlds, links } = this.openBranches[0];

            // Add worlds based on branch
            for (const index of worlds) {
                const newWorld = new World(index);
                for (const { formula, world } of literals) {
                    if (world === index && formula instanceof AtomicFormula) {
                        newWorld.addAtom(formula.atom);
                    }
                }
                model.addWorld(newWorld);
            }

            // Add links based on branch
            for (const { worldFrom, worldTo } of links) {
                model.addLink(1, model.getWorldByIndex(worldFrom), model.getWorldByIndex(worldTo));
            }

            return model;
        } else {
            return null;
        }
    } 

}
