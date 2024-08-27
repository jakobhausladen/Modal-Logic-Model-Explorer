class Formula {
    // Truth clause for the recursive evaluation of formulas
    isSatisfied(world, model) {
        throw new Error("Method 'isSatisfied' must be implemented in subclasses of 'Formula'.");
    }

    // Method for the recursive generation of LaTeX-style string representations of formulas
    toLaTeX() {
        throw new Error("Method 'toLaTeX' must be implemented in subclasses of 'Formula'.");
    }
}

export class AtomicFormula extends Formula {
    // Atomic formula without sub-formulas
    constructor(atom) {
        super();
        this.atom = atom;
    }

    isSatisfied(world, model) {
        return world.hasAtom(this.atom);
    }

    toLaTeX() {
        return `${this.atom}`;
    }
}

class UnaryFormula extends Formula {
    // Abstract class whose sub-classes implement formulas with one sub-formula
    constructor(subFormula) {
        super();
        this.subFormula = subFormula;
    }
}

export class Negation extends UnaryFormula {
    isSatisfied(world, model) {
        return !this.subFormula.isSatisfied(world, model);
    }

    toLaTeX() {
        return `\\neg ${this.subFormula.toLaTeX()}`;
    }
}

export class Possibility extends UnaryFormula {
    constructor(subFormula, relationId=1) {
        super(subFormula);
        this.relationId = relationId;
    }

    isSatisfied(world, model) {
        // Relation hard coded for now
        const accessibleWorlds = model.getAccessibleWorlds(this.relationId, world);
        return accessibleWorlds.some((accessibleWorld) => this.subFormula.isSatisfied(accessibleWorld, model));
    }

    toLaTeX() {
        return `\\Diamond ${this.subFormula.toLaTeX()}`;
    }
}

export class Necessity extends UnaryFormula {
    constructor(subFormula, relationId=1) {
        super(subFormula);
        this.relationId = relationId;
    }

    isSatisfied(world, model) {
        // Relation hard coded for now
        const accessibleWorlds = model.getAccessibleWorlds(this.relationId, world);
        return accessibleWorlds.every((accessibleWorld) => this.subFormula.isSatisfied(accessibleWorld, model));
    }

    toLaTeX() {
        return `\\Box ${this.subFormula.toLaTeX()}`;
    }
}

class BinaryFormula extends Formula {
    // Abstract class whose sub-classes implement formulas with two sub-formulas
    constructor(subLeft, subRight) {
        super();
        this.subLeft = subLeft;
        this.subRight = subRight;
    }
}

export class Conjunction extends BinaryFormula {
    isSatisfied(world, model) {
        return this.subLeft.isSatisfied(world, model) && this.subRight.isSatisfied(world, model);
    }

    toLaTeX() {
        return `(${this.subLeft.toLaTeX()} \\land ${this.subRight.toLaTeX()})`;
    }
}

export class Disjunction extends BinaryFormula {
    isSatisfied(world, model) {
        return this.subLeft.isSatisfied(world, model) || this.subRight.isSatisfied(world, model);
    }
    
    toLaTeX() {
        return `(${this.subLeft.toLaTeX()} \\lor ${this.subRight.toLaTeX()})`;
    }
}

export class MaterialImplication extends BinaryFormula {
    isSatisfied(world, model) {
        return (!this.subLeft.isSatisfied(world, model)) || this.subRight.isSatisfied(world, model);
    }

    toLaTeX() {
        return `(${this.subLeft.toLaTeX()} \\rightarrow ${this.subRight.toLaTeX()})`;
    }
}

class SetFormula extends Formula {
    // Abstract class whose sub-classes implement formulas with a set of sub-formulas
    constructor(subFormulas) {
        super();
        this.subFormulas = subFormulas;
    }
}

export class SetConjunction extends SetFormula {
    isSatisfied(world, model)  {
        return this.subFormulas.every((subF) => subF.isSatisfied(world, model));
    }

    toLaTeX() {
        return `\\bigwedge \\{${this.subFormulas.map(f => f.toLaTeX()).join(', ')}\\}`;
    }
}

export class SetDisjunction extends SetFormula {
    isSatisfied(world, model)  {
        return this.subFormulas.some((subF) => subF.isSatisfied(world, model));
    }

    toLaTeX() {
        return `\\bigvee \\{${this.subFormulas.map(f => f.toLaTeX()).join(', ')}\\}`;
    }
}
