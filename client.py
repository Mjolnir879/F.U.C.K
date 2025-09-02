import pygame
from pygame.locals import *
import yaml
import time
import socketio
import sys
import os

# --- INÍCIO: opção de OpenGL por software (Mesa) ---
# Para ativar: definir USE_SOFTWARE_GL=1 e MESA_DLL_PATH para a pasta com as DLLs do Mesa.
# Exemplo PowerShell:
# $env:USE_SOFTWARE_GL=1; $env:MESA_DLL_PATH='C:\mesa\bin'; python client.py
if os.getenv("USE_SOFTWARE_GL") == "1":
    mesa_dir = os.getenv("MESA_DLL_PATH")
    if mesa_dir:
        mesa_dir = os.path.abspath(mesa_dir)
        # Prepend mesa_dir ao PATH para que o loader do Windows carregue as DLLs do Mesa primeiro
        os.environ["PATH"] = mesa_dir + os.pathsep + os.environ.get("PATH", "")
        # Informa ao loader que preferimos fallback por software (útil em algumas builds)
        os.environ["LIBGL_ALWAYS_SOFTWARE"] = "1"
        print(f"Usando OpenGL por software (Mesa) em: {mesa_dir}")
    else:
        print("USE_SOFTWARE_GL=1 mas MESA_DLL_PATH não está definido. Defina MESA_DLL_PATH para a pasta de binários do Mesa.")
# --- FIM: opção Mesa ---

from OpenGL.GL import *

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.map import Map
from core.resources import load_sprite_from_db, draw_text
from utils.input import Input
from assets.classes.components import InterfaceManager, Mouse

sio = socketio.Client()
game_state = {}
my_player_id = None

@sio.event
def connect():
    print("Conectado ao servidor!")

@sio.event
def disconnect():
    print("Desconectado do servidor.")

@sio.event
def assign_id(player_id):
    global my_player_id
    my_player_id = player_id
    print(f"Você é o jogador: {my_player_id}")

@sio.on('game_state')
def handle_game_state(data):
    """
    Normaliza os dados recebidos do servidor para garantir que `game_state`
    seja sempre um dict com a chave 'entities' (mapa id -> entidade).
    """
    global game_state
    # Caso já seja dict com 'entities', usa diretamente
    if isinstance(data, dict) and 'entities' in data:
        game_state = data
        return

    # Se servidor enviou um dict de entidades (sem encapsular), tenta adaptar
    if isinstance(data, dict):
        # se as chaves parecem ser IDs de entidades, encapsula
        game_state = {'entities': data}
        return

    # Se servidor enviou uma lista de entidades, converte para dict por id (se possível)
    if isinstance(data, list):
        entities_map = {}
        for item in data:
            if isinstance(item, dict):
                # tenta obter um identificador comum
                eid = item.get('id') or item.get('entity_id') or item.get('uuid') or item.get('name')
                if eid is None:
                    # fallback: use índice como chave string
                    eid = str(len(entities_map))
                entities_map[str(eid)] = item
        game_state = {'entities': entities_map}
        return

    # Qualquer outro tipo: zera o estado
    game_state = {'entities': {}}

class GameClient:
    def __init__(self):
        with open('saves/config.yaml', 'r') as config_file:
            self.CONFIG = yaml.safe_load(config_file)
        
        pygame.init()
        self.screen = pygame.display.set_mode(
            (self.CONFIG['screen']['width'], self.CONFIG['screen']['height']), 
            DOUBLEBUF | OPENGL
        )
        
        glMatrixMode(GL_PROJECTION); glLoadIdentity()
        glOrtho(0, self.CONFIG['screen']['width'], self.CONFIG['screen']['height'], 0, -1, 1)
        glMatrixMode(GL_MODELVIEW)
        glEnable(GL_TEXTURE_2D); glEnable(GL_BLEND)
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
        
        pygame.display.set_caption(self.CONFIG['project']['window_name'])
        self.clock = pygame.time.Clock(); self.input = Input(); self.zoom = 2
        
        self.map = Map('assets/data/map.json', 'assets/images/layers/basic.png')
        self.mouse = Mouse(32, 32, 12, 11)
        pygame.mouse.set_visible(False)
        
        self.interface_manager = InterfaceManager(self.CONFIG['screen']['width'], self.CONFIG['screen']['height'])
        self.interface_manager.load_interface("hud", "gamehud.xml")
        self.interface_manager.show_interface("hud")
        
        self.running = True

    def run(self):
        while self.running:
            self.input.update()
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT or self.input.get_key_pressed("quit"):
                    self.running = False
            
            if sio.connected:
                keys = {k: v for k, v in self.input.keys.items() if v}
                sio.emit('player_input', {'keys': keys, 'mouse_pos': self.input.get_mouse_pos()})

            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
            glLoadIdentity()
            
            if isinstance(game_state, dict):
                entities = game_state.get('entities', {}) or {}
            else:
                # debug help: log unexpected game_state (type and short repr)
                print(f"Warning: game_state has unexpected type {type(game_state)}; preview: {repr(game_state)[:200]}")
                entities = {}

            player_entity = entities.get(my_player_id)

            camera_x = player_entity['x'] - (self.CONFIG["screen"]["width"] / (2 * self.zoom)) if player_entity else 0
            camera_y = player_entity['y'] - (self.CONFIG["screen"]["height"] / (2 * self.zoom)) if player_entity else 0

            self.map.render(camera_x, camera_y, self.zoom)

            for entity_id, entity in entities.items():

                sprite_id = entity.get("texture_id")
                if sprite_id:
                    sprite = load_sprite_from_db(sprite_id)
                    if sprite:
                        screen_x = (entity['x'] - camera_x) * self.zoom
                        screen_y = (entity['y'] - camera_y) * self.zoom
                        sprite.draw(screen_x, screen_y, 0, self.zoom)
            
            mx, my = self.input.get_mouse_pos()
            
            # A chamada para update agora passa a entidade do jogador.
            # Graças à sua alteração em components.py, isso não vai mais quebrar o jogo.
            self.interface_manager.update(mx, my, self.input.get_mouse_button(0), player=player_entity)
            
            # O 'draw' ainda é chamado condicionalmente, o que é uma boa prática.
            if player_entity:
                self.interface_manager.draw()
            
            self.mouse.update(mx, my, self.input.get_mouse_button(0))
            
            fps = self.clock.get_fps()
            draw_text(f"FPS: {fps:.0f}", 10, 10, size=16, color=(255, 255, 0, 255))
            
            pygame.display.flip()
            self.clock.tick(self.CONFIG['project']['FPS'])
        
        if sio.connected:
            sio.disconnect()

if __name__ == '__main__':
    ip = input("Digite o IP do servidor (ou pressione Enter para localhost): ") or "localhost"
    url = f"http://{ip}:3000"
    try:
        sio.connect(url); game = GameClient(); game.run()
    except socketio.exceptions.ConnectionError as e: print(f"Falha ao conectar: {e}")
    except Exception as e: print(f"Ocorreu um erro: {e}")
    finally:
        if sio.connected: sio.disconnect()
        pygame.quit(); sys.exit()