import re
with open("js/index.js", "r") as f:
    content = f.read()

# Update createProject
old_create = """	const adminPwd = document.getElementById('create-admin-password').value;
	const scorerPwd = document.getElementById('create-scorer-password').value;
	const name = document.getElementById('create-name').value.trim();
	const btn = document.getElementById('create-btn');

	if (!pName || !adminPwd || !scorerPwd || !name) {
		showError('全ての項目を入力してください');
		return;
	}

	const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/;
	if (!pwdRegex.test(adminPwd)) {
		showError('管理者パスワードは英大文字、英小文字、数字をそれぞれ1つ以上含む8文字以上が必要です');
		return;
	}
	if (adminPwd === scorerPwd) {
		showError('管理者パスワードと採点者コードは必ず違うものにしてください');
		return;
	}"""
	
new_create = """	const adminPwd = generateStrongPassword();
	const scorerPwd = generateStrongPassword();
	const name = document.getElementById('create-name').value.trim();
	const btn = document.getElementById('create-btn');

	if (!pName || !name) {
		showError('全ての項目を入力してください');
		return;
	}"""

if old_create in content:
    content = content.replace(old_create, new_create)

# Update importProject
old_import = """	const adminPwd = document.getElementById('import-admin-password').value;
	const scorerPwd = document.getElementById('import-scorer-password').value;
	const name = document.getElementById('import-name').value.trim();
	const btn = document.getElementById('import-btn');

	if (!file || !pName || !adminPwd || !scorerPwd || !name) {
		showError('全ての項目を入力・選択してください');
		return;
	}

	const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/;
	if (!pwdRegex.test(adminPwd)) {
		showError('管理者パスワードは英大文字、英小文字、数字をそれぞれ1つ以上含む8文字以上が必要です');
		return;
	}"""

new_import = """	const adminPwd = generateStrongPassword();
	const scorerPwd = generateStrongPassword();
	const name = document.getElementById('import-name').value.trim();
	const btn = document.getElementById('import-btn');

	if (!file || !pName || !name) {
		showError('全ての項目を入力・選択してください');
		return;
	}"""

if old_import in content:
    content = content.replace(old_import, new_import)

# Show admin password in success form
content = content.replace("document.getElementById('success-id').value = pid;", "document.getElementById('success-id').value = pid;\n\t\tdocument.getElementById('success-admin-pwd').value = adminPwd;")

# Remove autoGenPwd logic
content = re.sub(r'function autoGenPwd.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'if \(tab === \'create\'\) \{.*?\} else if \(tab === \'import\'\) \{.*?\}', '', content, flags=re.DOTALL)

with open("js/index.js", "w") as f:
    f.write(content)
