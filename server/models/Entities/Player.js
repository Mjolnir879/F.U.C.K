import { Entity } from '../Entity.js';
import { Status } from '../Status.js';
import Inventory from '../Inventory.js';
import Equiped from '../Equiped.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Constrói o caminho absoluto para o banco de dados
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', '..', 'data-server.db');

// Configuração do SQLite (a conexão permanece aberta)
const dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
});

export default class Player extends Entity {
    constructor(idPlayer, idCliente) {
        // O ID do jogador (idPlayer) será definido no init, começamos com 0
        super(0, 0, 0, 32, 32, 0); 
        this.idCliente = idCliente;
    }

    async init() {
        // ALTERAÇÃO 1: Carrega sempre o jogador com ID 1
        this.playerData = await this.loadPlayerData(1); 

        // Adiciona um check para garantir que os dados foram carregados
        if (!this.playerData) {
            console.error("FALHA CRÍTICA: Não foi possível carregar os dados do jogador com ID 1 do banco de dados.");
            return; // Interrompe a inicialização se os dados não existirem
        }

        this.id = this.playerData.id; // Atualiza o ID da entidade
        this.stats = new Status(this.playerData.hp, this.playerData.maxHp, this.playerData.hpRegen, this.playerData.maxMana, this.playerData.mana, this.playerData.manaRegen, this.playerData.stamina, this.playerData.maxStamina, this.playerData.staminaRegen, this.playerData.damage, this.playerData.critical, this.playerData.defense, this.playerData.speed, this.playerData.aceleration);
        this.posx = this.playerData.posx;
        this.posy = this.playerData.posy;
        this.info = {
            name: this.playerData.name,
            level: this.playerData.level,
            xp: this.playerData.xp,
            skillpoints: this.playerData.skillpoints
        };
        this.inv = new Inventory(35);
        this.equip = new Equiped();
        // Aqui você poderia popular o inventário e equipamentos com os dados de jsonInv e jsonEquips
    }

    async loadPlayerData(idPlayer) {
        const db = await dbPromise;

        // ALTERAÇÃO 2: Consulta SQL corrigida para buscar todas as colunas necessárias
        const row = await db.get(`
            SELECT id, playerName, level, xp, skillpoints, maxHp, hpRegen, maxMana, manaRegen, 
                   maxStamina, staminaRegen, damage, critical, defense, speed, ace, 
                   posx, posy, jsonInv, jsonEquips
            FROM Player WHERE id = ?
        `, [idPlayer]);
        
        // ALTERAÇÃO 3: REMOVIDO "await db.close()" para manter a conexão ativa

        if (row) {
            // Retorna o objeto com os nomes corretos das propriedades
            return {
                id: row.id,
                name: row.playerName,
                level: row.level,
                xp: row.xp,
                skillpoints: row.skillpoints,
                maxHp: row.maxHp,
                hp: row.maxHp, // Assumindo HP cheio ao carregar
                hpRegen: row.hpRegen,
                maxMana: row.maxMana,
                mana: row.maxMana, // Assumindo Mana cheia ao carregar
                manaRegen: row.manaRegen,
                maxStamina: row.maxStamina,
                stamina: row.maxStamina, // Assumindo Stamina cheia ao carregar
                staminaRegen: row.staminaRegen,
                damage: row.damage,
                critical: row.critical,
                defense: row.defense,
                speed: row.speed,
                aceleration: row.ace,
                posx: row.posx,
                posy: row.posy,
                jsonEquips: JSON.parse(row.jsonEquips || '{}'),
                jsonInv: JSON.parse(row.jsonInv || '[]')
            };
        } else {
            return null; // Retorna null se nenhum jogador for encontrado
        }
    }
}