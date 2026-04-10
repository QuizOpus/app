import re

with open('saiten.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix maxGridHeight
old_height = "// グリッドの高さを確保 (全高297 - 上20 - 下(マークシート分)35 = 242)\n      const maxGridHeight = 242;"
new_height = "// グリッドの高さを確保 (全高297 - 上20 - 下(マークシート分)85 = 192)\n      const maxGridHeight = 192;"

content = content.replace("const maxGridHeight = 242;", "const maxGridHeight = 192;")

with open('saiten.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed maxGridHeight.")
