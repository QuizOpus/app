import re
with open("index.html", "r") as f:
    content = f.read()

# Remove the `.btn-micro` and `.label-row` CSS
content = re.sub(r'\.btn-micro \{.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'\.label-row \{.*?\}\n', '', content, flags=re.DOTALL)

# In section-create, remove the password fields block
content = re.sub(r'<div class="label-row">\s*<label><i class="fa-solid fa-crown".*?id="toggle-icon-create1"></i></span>\s*</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<div class="label-row">\s*<label><i class="fa-solid fa-users".*?id="toggle-icon-create2"></i></span>\s*</div>', '', content, flags=re.DOTALL)

# In section-import, remove the password fields block
content = re.sub(r'<div class="label-row">\s*<label><i class="fa-solid fa-crown".*?id="toggle-icon-import1"></i></span>\s*</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<div class="label-row">\s*<label><i class="fa-solid fa-users".*?id="toggle-icon-import2"></i></span>\s*</div>', '', content, flags=re.DOTALL)

# Add admin password output to section-success
old_success = """<label>参加ID (URLの一部になります)</label>
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: nowrap;">
          <input type="text" id="success-id" readonly style="margin-bottom: 0; min-width: 0;" />
          <button class="btn" style="width: auto; padding: 0 16px; font-size: 14px; flex-shrink: 0; background: #2563eb;" onclick="copyToClipboard('success-id', this)">コピー</button>
        </div>"""
new_success = """<label><i class="fa-solid fa-crown" style="color: #fbbf24;"></i> 管理者用 マスターパスワード (コピーして大切に保管)</label>
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: nowrap;">
          <input type="text" id="success-admin-pwd" readonly style="margin-bottom: 0; min-width: 0; border-color: rgba(251, 191, 36, 0.4);" />
          <button class="btn" style="width: auto; padding: 0 16px; font-size: 14px; flex-shrink: 0; background: #f59e0b;" onclick="copyToClipboard('success-admin-pwd', this)">コピー</button>
        </div>
        <label>参加ID (URLの一部になります)</label>
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: nowrap;">
          <input type="text" id="success-id" readonly style="margin-bottom: 0; min-width: 0;" />
          <button class="btn" style="width: auto; padding: 0 16px; font-size: 14px; flex-shrink: 0; background: #2563eb;" onclick="copyToClipboard('success-id', this)">コピー</button>
        </div>"""
if old_success in content:
    content = content.replace(old_success, new_success)

# Update success instructions wording
content = content.replace("以下の情報を採点用スタッフにのみ共有してください。<br>（マスターパスワードは共有しないでください）", "以下の情報をコピーして安全な場所に保存してください。<br>（マスターパスワードは絶対に他人へ共有しないでください）")

with open("index.html", "w") as f:
    f.write(content)
