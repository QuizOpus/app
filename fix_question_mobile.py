import re
with open("question.html", "r") as f:
    content = f.read()

# Add CSS for mobile action bar
css_to_add = """
        .shortcut-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #0f3460;
            border-top: 1px solid #444;
            padding: 8px 20px;
            display: flex;
            gap: 20px;
            justify-content: center;
            font-size: 12px;
            color: #90caf9;
            z-index: 100;
        }

        .mobile-action-bar {
            display: none;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: rgba(15, 36, 64, 0.95);
            backdrop-filter: blur(10px);
            border-top: 2px solid #2196f3;
            padding: 12px 16px;
            gap: 12px;
            z-index: 100;
        }
        .mobile-action-bar .btn {
            flex: 1;
            padding: 16px;
            font-size: 18px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .mobile-action-bar .btn span {
            font-size: 12px;
            font-weight: bold;
        }
        @media (hover: none) and (pointer: coarse) {
            .shortcut-bar { display: none; }
            .mobile-action-bar { display: flex; }
            .answer-grid { padding-bottom: 120px; }
        }
"""
content = re.sub(r'\.shortcut-bar \{.*?\nz-index: 100;\n        \}', css_to_add, content, flags=re.DOTALL)

html_to_add = """    <div class="shortcut-bar">
        <span><kbd>M</kbd> 正解</span>
        <span><kbd>X</kbd> 不正解</span>
        <span><kbd>H</kbd> 保留</span>
        <span><kbd>←→↑↓</kbd> 移動</span>
    </div>

    <div class="mobile-action-bar" id="mobile-action-bar">
        <button class="btn" style="background:#1b5e20;color:white;" onclick="scoreSelected('correct')"><i class="fa-solid fa-check"></i><span>正解</span></button>
        <button class="btn" style="background:#c62828;color:white;" onclick="scoreSelected('wrong')"><i class="fa-solid fa-xmark"></i><span>不正解</span></button>
        <button class="btn" style="background:#f57c00;color:white;" onclick="scoreSelected('hold')"><i class="fa-solid fa-triangle-exclamation"></i><span>保留</span></button>
    </div>"""

content = re.sub(r'<div class="shortcut-bar">.*?</div>', html_to_add, content, flags=re.DOTALL)

with open("question.html", "w") as f:
    f.write(content)
