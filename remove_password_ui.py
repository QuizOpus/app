with open("admin.html", 'r') as f:
    content = f.read()

# Using regex to remove the password change UI section
import re
new_content = re.sub(r'<h3 style="margin-top:20px;">パスワード変更</h3>.*?更新</button>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
new_content = re.sub(r'<h3 style="margin-top:20px;">パスワード変更</h3>.*?パスワードを変更</button>\s*</div>', '', new_content, flags=re.DOTALL)

with open("admin.html", 'w') as f:
    f.write(new_content)
