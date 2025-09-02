import sqlite3 from 'sqlite3';
import path from 'path'; // 1. Importa o módulo 'path'

// 2. Constrói o caminho absoluto para o banco de dados
// __dirname é o diretório do arquivo atual (models/)
// path.join sobe dois níveis ('..', '..') para a raiz do projeto e encontra o arquivo.
const dbPath = path.join(__dirname, '..', '..', 'data-server.db');

class Layer {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Map {
    constructor(json_src) {
        //carrega o json tiled do mapa
        // Nota: require() com uma variável pode ser problemático se o módulo não for um JSON.
        // Se json_src for um caminho, considere usar 'fs.readFileSync' para ler o arquivo.
        this.data = require(json_src);
        this.tilewidth = this.data.tilewidth;
        this.tileheight = this.data.tileheight;
        this.map_width = this.data.width;
        this.map_height = this.data.height;
        this.layers = [];
        for (const layer of this.data.layers) {
            this.layers.push(new Layer(layer.id, layer.name));
        }
        //Cria uma matriz 3D com os dados dos tiles
        this.matriz = [];
        for (let z = 0; z < this.layers.length; z++) {
            const layer = this.layers[z];
            this.matriz[z] = [];
            for (let y = 0; y < this.map_height; y++) {
                this.matriz[z][y] = [];
                for (let x = 0; x < this.map_width; x++) {
                    const tile = layer.data[y * this.map_width + x];
                    this.matriz[z][y][x] = tile ? tile : 0;
                }
            }
        }
        // 3. Usa a variável dbPath para se conectar ao banco de dados
        let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error(err.message);
            }
        });

        // Executa a consulta
        let col = {};

        db.all("SELECT * FROM tile", [], (err, rows) => {
            if (err) {
                throw err;
            }

            // Cria objeto col mapeando row[0] para row[2]
            rows.forEach((row) => {
                col[row.id] = row.col;
            });

            console.log(col);
        });

        // Fecha conexão
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    check_col(x, y, layer) {
        let tile_x = x / this.tilewidth;
        let tile_y = y / this.tileheight;
        if (0 <= tile_x < this.map_width && 0 <= tile_y < this.map_height) {
            let tile_id = this.matriz[layer][Math.floor(tile_y)][Math.floor(tile_x)];
            return this.col[tile_id];
        }
    }
}
module.exports = Map;