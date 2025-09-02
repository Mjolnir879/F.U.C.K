import pygame
import sqlite3
import json
import os
from OpenGL.GL import *

# Dicionário para guardar sprites já carregados e evitar acessos repetidos ao BD.
sprite_cache_by_id = {}

def load_texture(path):
    """Carrega uma imagem e a converte para uma textura OpenGL."""
    try:
        image = pygame.image.load(path).convert_alpha()
    except Exception as e:
        raise FileNotFoundError(f"Não foi possível carregar a textura: '{path}'. Verifique se o arquivo existe e o caminho no data.db está correto.")
    
    image = pygame.transform.flip(image, False, True)
    image_data = pygame.image.tostring(image, "RGBA", True)
    width, height = image.get_size()
    texture_id = glGenTextures(1)
    glBindTexture(GL_TEXTURE_2D, texture_id)
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, image_data)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST)
    return texture_id, width, height

class Sprite:
    def __init__(self, src, linhas, colunas, animations):
        self.src = src; self.linhasSprite = linhas; self.colunasSprite = colunas
        try:
            self.texture_id, self.sheet_width, self.sheet_height = load_texture(src)
            self.sprite_width = self.sheet_width // colunas
            self.sprite_height = self.sheet_height // linhas
            self.valid = True
        except Exception as e:
            print(f"Erro ao processar a textura '{src}': {e}")
            self.valid = False
        self.anim = animations; self.numFrame = 0; self.speed = 1/7

    def get_frame_coords(self, row, column):
        x = column * self.sprite_width; y = row * self.sprite_height
        tx1 = x / self.sheet_width; ty1 = y / self.sheet_height
        tx2 = (x + self.sprite_width) / self.sheet_width
        ty2 = (y + self.sprite_height) / self.sheet_height
        return tx1, ty1, tx2, ty2

    def draw(self, x, y, anim_row, zoom):
        if not self.valid: return
        try:
            frame_index = int(self.numFrame) % len(self.anim[anim_row])
            frame = self.anim[anim_row][frame_index]
            row, col = frame
            tx1, ty1, tx2, ty2 = self.get_frame_coords(row, col)
            sprite_w = self.sprite_width * zoom; sprite_h = self.sprite_height * zoom
            glBindTexture(GL_TEXTURE_2D, self.texture_id)
            glBegin(GL_QUADS)
            glTexCoord2f(tx1, ty1); glVertex2f(x, y)
            glTexCoord2f(tx2, ty1); glVertex2f(x + sprite_w, y)
            glTexCoord2f(tx2, ty2); glVertex2f(x + sprite_w, y + sprite_h)
            glTexCoord2f(tx1, ty2); glVertex2f(x, y + sprite_h)
            glEnd()
            self.numFrame += self.speed
            if self.numFrame >= len(self.anim[anim_row]): self.numFrame = 0
        except Exception as e: print(f"Erro ao desenhar sprite: {e}")

def load_sprite_from_db(id_sprite):
    """
    Busca um sprite no cache. Se não encontrar, busca no banco de dados local,
    corrige o caminho da imagem e o carrega.
    """
    if id_sprite in sprite_cache_by_id:
        return sprite_cache_by_id[id_sprite]

    try:
        conn = sqlite3.connect("assets/data/data.db")
        cursor = conn.cursor()
        cursor.execute("SELECT src, linhas, colunas, animations FROM Sprite WHERE id = ?", (id_sprite,))
        row = cursor.fetchone()
        conn.close()

        if row:
            src, linhas, colunas, anim_json = row
            
            # Garante que o caminho da imagem sempre comece com 'assets/'
            if not src.startswith('assets/'):
                src = os.path.join('assets', src)

            # --- NOVA ATUALIZAÇÃO ---
            # Normaliza o caminho para usar as barras corretas do sistema (ex: '\' no Windows)
            # e depois substitui todas por barras normais ('/') para máxima compatibilidade.
            src = os.path.normpath(src).replace('\\', '/')

            animations = json.loads(anim_json)
            print(f"Carregando sprite ID {id_sprite} do BD local: {src}")
            
            novo_sprite = Sprite(src, linhas, colunas, animations)
            
            # Guarda o sprite no cache para não carregar de novo e o retorna.
            sprite_cache_by_id[id_sprite] = novo_sprite
            return novo_sprite
        else:
            print(f"Sprite com ID {id_sprite} não encontrado no banco de dados local.")
            sprite_cache_by_id[id_sprite] = None
            return None
            
    except Exception as e:
        print(f"Erro ao carregar sprite {id_sprite} do BD local: {e}")
        return None

def draw_text(text, x, y, size=16, color=(255, 255, 255, 255), font_name=None, align='left'):
    try:
        if text is None or text == "": return 0, 0
        if not pygame.font.get_init(): pygame.font.init()
        if isinstance(color, (list, tuple)) and len(color) == 3: r, g, b = color; a = 255
        elif isinstance(color, (list, tuple)) and len(color) == 4: r, g, b, a = color
        else: r, g, b, a = 255, 255, 255, 255
        font = pygame.font.SysFont(font_name, size)
        lines = str(text).splitlines(); line_height = font.get_linesize()
        total_height = 0; max_width = 0; start_y = int(y)
        for idx, line in enumerate(lines):
            render_text = line if line != "" else " "
            surface = font.render(render_text, True, (r, g, b, a))
            width, height = surface.get_size(); max_width = max(max_width, width)
            if align == 'center': draw_x = int(x - width // 2)
            elif align == 'right': draw_x = int(x - width)
            else: draw_x = int(x)
            draw_y = start_y + total_height
            surface = pygame.transform.flip(surface, False, True)
            image_data = pygame.image.tostring(surface, "RGBA", True)
            tex_id = glGenTextures(1); glBindTexture(GL_TEXTURE_2D, tex_id)
            glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, image_data)
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST)
            glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST)
            glEnable(GL_TEXTURE_2D); glEnable(GL_BLEND); glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
            glBegin(GL_QUADS)
            glTexCoord2f(0.0, 0.0); glVertex2f(draw_x, draw_y)
            glTexCoord2f(1.0, 0.0); glVertex2f(draw_x + width, draw_y)
            glTexCoord2f(1.0, 1.0); glVertex2f(draw_x + width, draw_y + height)
            glTexCoord2f(0.0, 1.0); glVertex2f(draw_x, draw_y + height)
            glEnd()
            glBindTexture(GL_TEXTURE_2D, 0)
            try: glDeleteTextures(int(tex_id))
            except Exception: pass
            total_height += line_height
        return max_width, total_height if total_height > 0 else line_height
    except Exception as e:
        print(f"Erro ao desenhar texto: {e}")
        return 0, 0