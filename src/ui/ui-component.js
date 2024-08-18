export class UIComponent {
    constructor(model) {
        this.model = model;
        this.model.attachObserver(this);
    }

    update(model) {
        throw new Error("Method 'update' must be implemented in subclasses of ModelObserver.");
    }

    detach() {
        this.model.detachObserver(this);
    }
}