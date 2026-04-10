import re

with open('saiten.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("row * (bubbleH + 1.5);", "row * (bubbleH + 1.0);")

with open('saiten.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed cy padding.")
