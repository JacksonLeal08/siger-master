"""
Gerador de Ícones PWA 3D para o SIGER Master.
Cria icon-192x192.png, icon-512x512.png, maskable-icon-512x512.png e apple-touch-icon.png
com acabamento em titânio usinado, chanfros 3D, backlight glow neon verde cyber (#68D346 / #B7F365)
e safe-zone para Android Adaptive Icons e iOS.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def hex_to_rgba(h, a=255):
    return (*hex_to_rgb(h), a)

# Paleta SIGER Master / JIMMP Info
BG_COLOR = hex_to_rgb('#1E2024')
TITANIUM_LIGHT = hex_to_rgb('#7E8289')
TITANIUM_DARK = hex_to_rgb('#3C3F45')
TITANIUM_SPECULAR = hex_to_rgb('#D5D9DC')
NEON_GREEN = hex_to_rgb('#68D346')
NEON_LIME = hex_to_rgb('#B7F365')
DARK_EMERALD = hex_to_rgb('#14381C')

def create_master_icon(size=1024, is_maskable=False):
    # Renderizamos em 1024x1024 com supersampling para nitidez máxima
    img = Image.new('RGBA', (size, size), (*BG_COLOR, 255))
    
    # 1. Padrão de fundo em textura sutil de fibra metálica / grade de circuitos
    bg_draw = ImageDraw.Draw(img)
    grid_step = size // 32
    for x in range(0, size, grid_step):
        bg_draw.line([(x, 0), (x, size)], fill=(*hex_to_rgb('#24272D'), 160), width=1)
    for y in range(0, size, grid_step):
        bg_draw.line([(0, y), (size, y)], fill=(*hex_to_rgb('#24272D'), 160), width=1)

    # Margem e escala: maskable usa safe zone perimetral de 20% (diâmetro de 80% do canvas)
    scale = 0.68 if is_maskable else 0.82
    center_x, center_y = size / 2, size / 2

    # 2. Backlight Glow Verde Neon Cyber
    glow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_r = int((size * scale) * 0.46)
    glow_draw.ellipse(
        [center_x - glow_r, center_y - glow_r, center_x + glow_r, center_y + glow_r],
        fill=(*NEON_GREEN, 170)
    )
    glow_r_core = int(glow_r * 0.7)
    glow_draw.ellipse(
        [center_x - glow_r_core, center_y - glow_r_core, center_x + glow_r_core, center_y + glow_r_core],
        fill=(*NEON_LIME, 210)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=int(size * 0.08)))
    img.alpha_composite(glow_img)

    # 3. Escudo Tático Chanfrado 3D (Polígono do Escudo)
    # Definindo vértices do escudo em coordenadas normalizadas (-1 a +1)
    # Top-flat com chanfro nos cantos, descendo em ogiva tática
    def get_shield_points(s):
        w = s * 0.44
        top_y = -s * 0.42
        shoulder_y = -s * 0.15
        bottom_y = s * 0.44
        chamfer = s * 0.08
        pts = [
            (center_x, center_y + top_y),                          # Top center
            (center_x + w - chamfer, center_y + top_y),           # Top right start chamfer
            (center_x + w, center_y + top_y + chamfer),           # Top right end chamfer
            (center_x + w, center_y + shoulder_y),                # Shoulder right
            (center_x + w * 0.72, center_y + shoulder_y + s*0.25),# Mid right curve
            (center_x, center_y + bottom_y),                      # Bottom tip
            (center_x - w * 0.72, center_y + shoulder_y + s*0.25),# Mid left curve
            (center_x - w, center_y + shoulder_y),                # Shoulder left
            (center_x - w, center_y + top_y + chamfer),           # Top left end chamfer
            (center_x - w + chamfer, center_y + top_y),           # Top left start chamfer
        ]
        return pts

    # Sombra de Oclusão do Escudo
    shadow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_pts = [(x + 8, y + 24) for (x, y) in get_shield_points(size * scale)]
    shadow_draw.polygon(shadow_pts, fill=(0, 0, 0, 200))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=int(size * 0.03)))
    img.alpha_composite(shadow_img)

    # Corpo do Escudo em Titânio Escuro (Base Metálica)
    shield_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shield_layer)
    pts_outer = get_shield_points(size * scale)
    s_draw.polygon(pts_outer, fill=(*TITANIUM_DARK, 255))

    # Chanfros 3D de Luz (Metade esquerda com reflexo especular prateado, metade direita com titânio escovado)
    w_scale = size * scale
    # Face Esquerda (iluminada pela luz de 45° prata)
    left_face = [
        (center_x, center_y - w_scale * 0.42),
        (center_x - w_scale * 0.44 + w_scale * 0.08, center_y - w_scale * 0.42),
        (center_x - w_scale * 0.44, center_y - w_scale * 0.42 + w_scale * 0.08),
        (center_x - w_scale * 0.44, center_y - w_scale * 0.15),
        (center_x - w_scale * 0.44 * 0.72, center_y - w_scale * 0.15 + w_scale * 0.25),
        (center_x, center_y + w_scale * 0.44),
    ]
    s_draw.polygon(left_face, fill=(*TITANIUM_LIGHT, 255))

    # Face Interna Chanfrada (Inner Inset Shield)
    inner_pts = get_shield_points(size * scale * 0.86)
    s_draw.polygon(inner_pts, fill=(*hex_to_rgb('#181A1E'), 255))

    # Anel Perimetral Neon Verde Cyber
    s_draw.line(inner_pts + [inner_pts[0]], fill=(*NEON_GREEN, 240), width=int(size * 0.012))

    # 4. Nós de Circuito Cibernético nas Bordas
    # Linhas de microcircuito que conectam o perímetro
    circ_color = (*NEON_GREEN, 220)
    cw = max(2, int(size * 0.007))
    # Circuitos superiores
    s_draw.line([(center_x - w_scale * 0.32, center_y - w_scale * 0.28), (center_x - w_scale * 0.22, center_y - w_scale * 0.28)], fill=circ_color, width=cw)
    s_draw.line([(center_x - w_scale * 0.22, center_y - w_scale * 0.28), (center_x - w_scale * 0.14, center_y - w_scale * 0.20)], fill=circ_color, width=cw)
    s_draw.ellipse([center_x - w_scale * 0.14 - 6, center_y - w_scale * 0.20 - 6, center_x - w_scale * 0.14 + 6, center_y - w_scale * 0.20 + 6], fill=(*NEON_LIME, 255))

    s_draw.line([(center_x + w_scale * 0.32, center_y - w_scale * 0.28), (center_x + w_scale * 0.22, center_y - w_scale * 0.28)], fill=circ_color, width=cw)
    s_draw.line([(center_x + w_scale * 0.22, center_y - w_scale * 0.28), (center_x + w_scale * 0.14, center_y - w_scale * 0.20)], fill=circ_color, width=cw)
    s_draw.ellipse([center_x + w_scale * 0.14 - 6, center_y - w_scale * 0.20 - 6, center_x + w_scale * 0.14 + 6, center_y - w_scale * 0.20 + 6], fill=(*NEON_LIME, 255))

    # 5. Núcleo: Estrela da Vida / Chama de Intervenção Rápida Estilizada
    # Estrela da Vida (Cruz de 6 braços estilizada tática com corte cyber)
    core_scale = size * scale * 0.32
    arm_w = core_scale * 0.28
    arm_l = core_scale * 0.88
    
    # 6 braços com rotação de 60 graus
    for angle_deg in [0, 60, 120]:
        ang = math.radians(angle_deg)
        cos_a = math.cos(ang)
        sin_a = math.sin(ang)
        
        # Retângulo rotacionado
        p1 = (center_x + (-arm_w)*cos_a - (-arm_l)*sin_a, center_y + (-arm_w)*sin_a + (-arm_l)*cos_a)
        p2 = (center_x + ( arm_w)*cos_a - (-arm_l)*sin_a, center_y + ( arm_w)*sin_a + (-arm_l)*cos_a)
        p3 = (center_x + ( arm_w)*cos_a - ( arm_l)*sin_a, center_y + ( arm_w)*sin_a + ( arm_l)*cos_a)
        p4 = (center_x + (-arm_w)*cos_a - ( arm_l)*sin_a, center_y + (-arm_w)*sin_a + ( arm_l)*cos_a)
        
        s_draw.polygon([p1, p2, p3, p4], fill=(*TITANIUM_SPECULAR, 255))
        # Contorno neon
        s_draw.line([p1, p2, p3, p4, p1], fill=(*NEON_GREEN, 240), width=int(size * 0.008))

    # Chama Tática / Coração de Energia no Centro da Estrela
    flame_pts = [
        (center_x, center_y - core_scale * 0.75),                    # Apex
        (center_x + core_scale * 0.32, center_y - core_scale * 0.1),
        (center_x + core_scale * 0.28, center_y + core_scale * 0.42),
        (center_x + core_scale * 0.12, center_y + core_scale * 0.65),
        (center_x, center_y + core_scale * 0.55),
        (center_x - core_scale * 0.12, center_y + core_scale * 0.65),
        (center_x - core_scale * 0.28, center_y + core_scale * 0.42),
        (center_x - core_scale * 0.32, center_y - core_scale * 0.1),
    ]
    s_draw.polygon(flame_pts, fill=(*NEON_LIME, 255))
    
    # Núcleo quente branco no centro da chama
    inner_flame = [
        (center_x, center_y - core_scale * 0.45),
        (center_x + core_scale * 0.15, center_y + core_scale * 0.15),
        (center_x, center_y + core_scale * 0.4),
        (center_x - core_scale * 0.15, center_y + core_scale * 0.15),
    ]
    s_draw.polygon(inner_flame, fill=(255, 255, 255, 255))

    # Borda Chanfrada Superior Especular (Luz Prateada)
    top_bezel = [
        (center_x - w_scale * 0.44 + w_scale * 0.08, center_y - w_scale * 0.42),
        (center_x + w_scale * 0.44 - w_scale * 0.08, center_y - w_scale * 0.42),
        (center_x + w_scale * 0.44, center_y - w_scale * 0.42 + w_scale * 0.08),
        (center_x - w_scale * 0.44, center_y - w_scale * 0.42 + w_scale * 0.08),
    ]
    s_draw.line([(center_x - w_scale * 0.44 + w_scale * 0.08, center_y - w_scale * 0.42),
                 (center_x + w_scale * 0.44 - w_scale * 0.08, center_y - w_scale * 0.42)],
                fill=(*TITANIUM_SPECULAR, 255), width=int(size * 0.015))

    img.alpha_composite(shield_layer)

    return img

def main():
    icons_dir = os.path.abspath('public/icons')
    os.makedirs(icons_dir, exist_ok=True)

    print("Renderizando Master Icons em 1024x1024...")
    master_standard = create_master_icon(size=1024, is_maskable=False)
    master_maskable = create_master_icon(size=1024, is_maskable=True)

    # 1. icon-192x192.png
    print("Gerando icon-192x192.png...")
    icon_192 = master_standard.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(icons_dir, 'icon-192x192.png'), format='PNG', optimize=True)
    icon_192.save(os.path.join(icons_dir, 'icon-192.png'), format='PNG', optimize=True) # Compatibilidade

    # 2. icon-512x512.png
    print("Gerando icon-512x512.png...")
    icon_512 = master_standard.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(icons_dir, 'icon-512x512.png'), format='PNG', optimize=True)
    icon_512.save(os.path.join(icons_dir, 'icon-512.png'), format='PNG', optimize=True) # Compatibilidade

    # 3. maskable-icon-512x512.png (Safe-zone 80%)
    print("Gerando maskable-icon-512x512.png...")
    icon_maskable = master_maskable.resize((512, 512), Image.Resampling.LANCZOS)
    icon_maskable.save(os.path.join(icons_dir, 'maskable-icon-512x512.png'), format='PNG', optimize=True)

    # 4. apple-touch-icon.png (180x180)
    print("Gerando apple-touch-icon.png (180x180)...")
    icon_apple = master_standard.resize((180, 180), Image.Resampling.LANCZOS)
    icon_apple.save(os.path.join(icons_dir, 'apple-touch-icon.png'), format='PNG', optimize=True)

    print("Todos os ícones PWA 3D foram gerados com sucesso!")

if __name__ == '__main__':
    main()
