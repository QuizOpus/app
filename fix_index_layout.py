import re
with open("index.html", "r") as f:
    content = f.read()

# I will add the specific body flex rules back to index.html's <style>
# First, let's find the closing </style> tag in index.html
style_patch = """
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      /* min-height: 100vh is already in design_system.css */
    }
"""

if "display: flex;" not in content[:content.find("</style>")]:
    content = content.replace("</style>", style_patch + "</style>")
    with open("index.html", "w") as f:
        f.write(content)
