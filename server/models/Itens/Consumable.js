class Consumable extends Item {
    constructor(name, heal, mana, stamina, effect, texture = "", description = "", id = null) {
        super(name, "Consumable", texture, description, id);
        this.heal = heal;
        this.mana = mana;
        this.stamina = stamina;
        this.effect = effect;
    }

    toString() {
        return (
            `${this.name} (Consumível)\n` +
            ` - Cura: ${this.heal}\n` +
            ` - Mana: ${this.mana}\n` +
            ` - Stamina: ${this.stamina}\n` +
            ` - Efeito: ${this.effect}\n` +
            `Descrição: ${this.description}`
        );
    }

    toDict() {
        return {
            item_type: "Consumable",
            name: this.name,
            texture: this.texture,
            description: this.description,
            id: this.id,
            heal: this.heal,
            mana: this.mana,
            stamina: this.stamina,
            effect: this.effect
        };
    }

    use(player) {
        // Aplica cura
        if (this.heal) {
            player.stats.hp = Math.min(player.stats.hp + this.heal, player.stats.maxHp);
        }
        // Aplica mana
        if (this.mana) {
            player.stats.mana = Math.min(player.stats.mana + this.mana, player.stats.maxMana);
        }
        // Aplica stamina
        if (this.stamina) {
            player.stats.stamina = Math.min(player.stats.stamina + this.stamina, player.stats.maxStamina);
        }
        // Efeito especial
        // if (this.effect && this.effect.toLowerCase() !== "nenhum") {
        //     // Implement special effect logic here
        // }
    }
}
module.exports = Consumable;
        