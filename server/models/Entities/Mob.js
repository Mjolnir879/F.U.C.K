import { Entity } from '../Entity.js';
import { Status } from '../Status.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path'; // <-- ADICIONE
import { fileURLToPath } from 'url'; // <-- ADICIONE

// Constrói o caminho absoluto para o banco de dados
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Sobe três níveis (de /models/Entities/Mob.js para a raiz do projeto) e encontra o DB
const dbPath = path.join(__dirname, '..', '..', '..', 'data-server.db');

// Configuração do SQLite
const dbPromise = open({
    filename: dbPath, // <-- ALTERE AQUI
    driver: sqlite3.Database
});

export default class Mob extends Entity {
    constructor(x, y, idMob) {
        console.log('Criando novo Mob:', { x, y, idMob });
        super(idMob, x, y, 0, 0, 0);
        this.idMob = idMob;
        this.posx = x;
        this.posy = y;
        console.log('Mob criado:', this);
    }

    async init() {
        console.log('Iniciando inicialização do Mob:', this.idMob);
        this.mobData = await this.loadMobData(this.idMob);
        if (this.mobData) {
            this.name = this.mobData.name;
            this.sizex = this.mobData.sizex;
            this.sizey = this.mobData.sizey;
            this.texture = this.mobData.idTextura;
            this.behavior = this.mobData.behaviors;
            this.stats = new Status(
                this.mobData.maxHp,
                this.mobData.maxHp,
                this.mobData.hpRegen,
                this.mobData.maxMana,
                this.mobData.manaRegen,
                this.mobData.maxStamina,
                this.mobData.staminaRegen,
                this.mobData.damage,
                this.mobData.critical,
                this.mobData.defense,
                this.mobData.speed,
                this.mobData.aceleration
            );
        } else {
            console.error("falha ao carregar o Mob " + this.idMob);
            this.name = "Unknown";
            this.sizex = 0;
            this.sizey = 0;
            this.texture = 0;
            this.behavior = null;
        }
    }

    async loadMobData(idMob) {
        try {
            console.log('Iniciando loadMobData para ID:', idMob);
            console.log('Caminho do banco:', '../../data-server.db');
            const db = await dbPromise;
            console.log('Conexão com banco estabelecida');

            const row = await db.get(`
                SELECT maxHp, regenHp, maxMana, regenMana, maxStamina, regenStamina, 
                       damage, critical, defense, speed, aceleration, name, behaviors, 
                       sizex, sizey, idTextura
                FROM Creature WHERE id = ?
            `, [idMob]);


            if (row) {
                console.log('Dados encontrados para o mob:', row);
                return {
                    maxHp: row.maxHp,
                    hpRegen: row.regenHp,
                    maxMana: row.maxMana,
                    manaRegen: row.regenMana,
                    maxStamina: row.maxStamina,
                    staminaRegen: row.regenStamina,
                    damage: row.damage,
                    critical: row.critical,
                    defense: row.defense,
                    speed: row.speed,
                    aceleration: row.aceleration,
                    name: row.name,
                    id: idMob,
                    behaviors: row.behaviors,
                    sizex: row.sizex,
                    sizey: row.sizey,
                    idTextura: row.idTextura
                };
            } else {
                console.log('Nenhum mob encontrado com ID:', idMob);
                return null;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do mob:', error);
            return null;
        }
    }
}