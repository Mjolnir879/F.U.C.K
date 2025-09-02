const Item = require('./Item.js');
const { loadSpriteFromDb } = require('./utils.js'); // Assumindo função externa para carregar sprite

class Weapon extends Item {
    constructor(name, classe, damage, critical, range, speed, move, special, ability, texture, texture_action = null, description = "", id = null) {
        super(name, "Weapon", texture, description, id);
        this.classe = classe;
        this.damage = damage;
        this.critical = critical;
        this.range = range;
        this.speed = speed;
        this.move = move;
        this.projectile = special;
        this.ability = ability;
        this.texture_action = texture_action ? loadSpriteFromDb(texture_action) : null;
        this.cooldown = 0;
        this.max_cooldown = Math.floor(120 / this.speed);
        
    }

    

    toString() {
        return (
            `${this.name} (Arma)\n` +
            ` - Classe: ${this.classe}\n` +
            ` - Dano: ${this.damage}\n` +
            ` - Crítico: ${this.critical}\n` +
            ` - Alcance: ${this.range}\n` +
            ` - Velocidade: ${this.speed}\n` +
            ` - Movimento: ${this.move}\n` +
            ` - Projétil: ${this.projectile}\n` +
            ` - Habilidade: ${this.ability}\n` +
            `Descrição: ${this.description}`
        );
    }

    toDict() {
        return {
            item_type: "Weapon",
            name: this.name,
            texture: this.texture,
            description: this.description,
            id: this.id,
            classe: this.classe,
            damage: this.damage,
            critical: this.critical,
            range: this.range,
            speed: this.speed,
            move: this.move,
            projectile: this.projectile,
            ability: this.ability,
            texture_action: this.texture_action,
            cooldown: this.cooldown,
            max_cooldown: this.max_cooldown,
            slot: this.slot
        };
    }

}

module.exports = Weapon;
 