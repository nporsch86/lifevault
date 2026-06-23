from PIL import Image, ImageDraw

img = Image.new('RGB', (200, 200), '#1a1a2e')
d = ImageDraw.Draw(img)

# Rounded background with border
d.rounded_rectangle([(2,2),(197,197)], radius=40, fill='#1a1a2e', outline='#3B82F6', width=3)

# Book - two pages
d.polygon([(35,135),(35,75),(100,55),(100,140)], fill='#3B82F6')
d.polygon([(165,135),(165,75),(100,55),(100,140)], fill='#3B82F6')

# Lock body
d.rounded_rectangle([(75,105),(125,140)], radius=6, fill='#06B6D4')

# Lock shackle - arc at top
d.arc([80,72,120,108], 190, 350, fill='#06B6D4', width=7)

img.save('/home/team/shared/logo-icon-tiny.png', optimize=True)

import os
size = os.path.getsize('/home/team/shared/logo-icon-tiny.png')
print(f'Done: {size} bytes')
