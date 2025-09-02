import Item from './Item.js';

class Equipment extends Item {
    constructor(name, defense, resistance, regen, speed, attack, critical, stamina, mana, mana_regen, classe, condition, special, slot, texture, description, id = null) {
        super(name, "Equipment", texture, description, id);
        this.defense = defense;
        this.resistance = resistance;
        this.regen = regen;
        this.speed = speed;
        this.attack = attack;
        this.critical = critical;
        this.stamina = stamina;
        this.mana = mana;
        this.mana_regen = mana_regen;
        this.classe = classe;
        this.condition = condition;
        this.special = special;
        this.slot = slot;
    }

    toString() {
        return (
            `${this.name} (Equipamento)\n` +
            ` - Defesa: ${this.defense}   ` +
            ` - Resistência: ${this.resistance}\n` +
            ` - Regen: ${this.regen}   ` +
            ` - Velocidade: ${this.speed}\n` +
            ` - Ataque: ${this.attack}   ` +
            ` - Crítico: ${this.critical}\n` +
            ` - Stamina: ${this.stamina}   ` +
            ` - Mana: ${this.mana}\n` +
            ` - Regen Mana: ${this.mana_regen}   ` +
            ` - Classe: ${this.classe}\n` +
            ` - Condição: ${this.condition}   ` +
            ` - Especial: ${this.special}\n` +
            `Descrição: ${this.description}`
        );
    }

    toDict() {
        return {
            item_type: "Equipment",
            name: this.name,
            texture: this.texture,
            description: this.description,
            id: this.id,
            defense: this.defense,
            resistance: this.resistance,
            regen: this.regen,
            speed: this.speed,
            attack: this.attack,
            critical: this.critical,
            stamina: this.stamina,
            mana: this.mana,
            mana_regen: this.mana_regen,
            classe: this.classe,
            condition: this.condition,
            special: this.special,
            slot: this.slot
        };
    }
}


module.exports = Equipment;