export class World {
    constructor(index, name=`w_{${index}}`) {
        this.index = index;
        this.name = name;
        this.atoms = new Set();
    }

    getIndex() {
        return this.index;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    addAtom(atom) {
        this.atoms.add(atom);
    }

    removeAtom(atom) {
        this.atoms.delete(atom);
    }

    hasAtom(atom) {
        return this.atoms.has(atom);
    }

    setState(atoms) {
        this.atoms.clear();
        for (const atom of atoms) {
            this.atoms.add(atom);
        }
    }

    getState() {
        return this.atoms;
    }

    sameState(world) {
        const atomsOther = world.getState();
        if (this.atoms.size !== atomsOther.size) {
            return false;
        }
        for (const atom of this.atoms) {
            if (!atomsOther.has(atom)) {
                return false;
            }
        }
        return true;
    }
}