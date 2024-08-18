export class DefaultMap extends Map {
    // Map with default values. Analogous to Python's default dict
    constructor(returnDefault, entries) {
        super(entries);
        this.returnDefault = returnDefault;
    }

    get(key) {
        if (!this.has(key)) {
            const defaultValue = this.returnDefault();
            this.set(key, defaultValue);
            return defaultValue;
        } else {
            return super.get(key);
        }
    }
}