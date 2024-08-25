export class UIComponent {
    constructor(model) {
        this.attach(model);
    }

    update(model) {
        throw new Error("Method 'update' must be implemented in subclasses of UIComponent.");
    }

    attach(model) {
        this.model = model;
        this.model.attachObserver(this);
    }

    detach() {
        this.model.detachObserver(this);
    }
}