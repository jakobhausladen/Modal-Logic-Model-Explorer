import { AtomicFormula, Negation, Possibility,  Necessity, Conjunction, Disjunction, MaterialImplication, SetConjunction, SetDisjunction } from "./formulas.js";

export class FormulaParser {
    // Syntax: A := not B, poss B, nec B, (B and C), (B or C), (B then C)

    parse(input) {
        input = input.trim()
        // Determine formula type based on how the input begins and recursively parse the formula
        if (input.startsWith("not ")) {
            return new Negation(this.parse(input.substring(4)));
        } else if (input.startsWith("poss ")) {
            return new Possibility(this.parse(input.substring(5)));
        } else if (input.startsWith("nec ")) {
            return new Necessity(this.parse(input.substring(4)));
        } else if (input.startsWith("(")) {
            return this.parseBinaryFormula(input);
        } else {
            return this.parseAtomicFormula(input);
        }
    }

    parseAtomicFormula(input) {
        const reservedSymbols = ["not ", " and ", " or ", " then ", "nec ", "poss ", ",", "(", ")"];
        for (const symbol of reservedSymbols) {
            if (input.includes(symbol)) {
                throw new Error(`Atomic formula '${input}' contains a reserved symbol: '${symbol}'.`)
            }
        }
        return new AtomicFormula(input);
    }

    parseBinaryFormula(input) {
        input = input.trim()
        // Remove brackets
        input = input.slice(1, -1);

        const { operator, index } = this.findTopLevelOperator(input);
        const leftSubString = input.substring(0, index).trim();
        const rightSubString = input.slice(index + operator.length).trim();

        switch (operator) {
            case "and":
                return new Conjunction(this.parse(leftSubString), this.parse(rightSubString));
            case "or":
                return new Disjunction(this.parse(leftSubString), this.parse(rightSubString));
            case "then":
                return new MaterialImplication(this.parse(leftSubString), this.parse(rightSubString));
        }
    }

    findTopLevelOperator(input) {
        let nestingLevel = 0;
        const binaryOperators = ["and", "or", "then"];
    
        // Loop through chars
        for (let i = 0; i < input.length; i++) {
            // Determine nesting level
            if (input.charAt(i) === "(") {
                nestingLevel++;
            } else if (input.charAt(i) === ")") {
                nestingLevel--;
            }
    
            // At nesting level 0, look for occurrences of binary operators
            if (nestingLevel === 0) {
                for (const operator of binaryOperators) {
                    if (input.slice(i).startsWith(operator)) {
                        return { operator, index: i };
                    }
                }
            }
        }
        
        throw new Error("No top-level binary operator found in the input.");
    }    
}
