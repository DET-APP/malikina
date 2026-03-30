#!/usr/bin/env python3
from PIL import Image, ImageDraw

# Couleur theme: #28655c
color = (40, 101, 92)
text_color = (255, 255, 255)

icons_path = '/Users/user/Desktop/projects/personnel-projects/malikina/public/icons'

# Icon 192x192
img = Image.new('RGB', (192, 192), color)
draw = ImageDraw.Draw(img)
draw.text((96, 96), "AM", fill=text_color, anchor="mm")
img.save(f'{icons_path}/icon-192.png')
print(f"✅ Created icon-192.png")

# Icon 192x192 maskable
img = Image.new('RGB', (192, 192), (255, 255, 255))
draw = ImageDraw.Draw(img)
draw.ellipse([40, 40, 152, 152], fill=color)
draw.text((96, 96), "AM", fill=text_color, anchor="mm")
img.save(f'{icons_path}/icon-192-maskable.png')
print(f"✅ Created icon-192-maskable.png")

# Icon 512x512
img = Image.new('RGB', (512, 512), color)
draw = ImageDraw.Draw(img)
draw.text((256, 256), "AM", fill=text_color, anchor="mm")
img.save(f'{icons_path}/icon-512.png')
print(f"✅ Created icon-512.png")

# Icon 512x512 maskable
img = Image.new('RGB', (512, 512), (255, 255, 255))
draw = ImageDraw.Draw(img)
draw.ellipse([100, 100, 412, 412], fill=color)
draw.text((256, 256), "AM", fill=text_color, anchor="mm")
img.save(f'{icons_path}/icon-512-maskable.png')
print(f"✅ Created icon-512-maskable.png")

print(f"\n✅ All PWA icons created in {icons_path}!")
