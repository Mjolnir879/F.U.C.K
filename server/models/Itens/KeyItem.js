const Item = require('./Item.js');

class KeyItem extends Item {
    constructor(name, special, texture, description, id = null) {
        super(name, "KeyItem", texture, description, id);
        this.special = special;
    }

    toString() {
        return (
            `${this.name} (Item-Chave)\n` +
            ` - Função: ${this.special}\n` +
            `Descrição: ${this.description}`
        );
    }

    toDict() {
        return {
            item_type: "KeyItem",
            name: this.name,
            texture: this.texture,
            special: this.special,
            description: this.description,
            id: this.id
        };
    }
}

module.exports = KeyItem;
