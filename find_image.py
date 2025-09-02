import os
import pygame

def find_image_by_size(directory, target_width, target_height):
    """
    Varre um diretório em busca de imagens com uma resolução específica.
    """
    if not os.path.isdir(directory):
        print(f"Erro: O diretório '{directory}' não foi encontrado.")
        return

    pygame.init()
    found = False
    print(f"Procurando por imagens com tamanho {target_width}x{target_height} em '{directory}'...")

    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                path = os.path.join(root, filename)
                try:
                    image = pygame.image.load(path)
                    width, height = image.get_size()
                    if width == target_width and height == target_height:
                        # Normaliza o caminho para exibição
                        normalized_path = os.path.normpath(path).replace('\\', '/')
                        print(f"--- ENCONTRADO: {normalized_path} ---")
                        found = True
                except Exception as e:
                    print(f"Não foi possível carregar a imagem {path}: {e}")
    
    if not found:
        print("Nenhuma imagem com as dimensões especificadas foi encontrada.")
    
    pygame.quit()

# Execute a busca no diretório de imagens do seu projeto
find_image_by_size('assets/images', 256, 640)