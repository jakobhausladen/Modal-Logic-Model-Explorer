export class World {
    constructor(name) {
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
}