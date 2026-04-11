with open("js/admin.js", 'r') as f:
    content = f.read()

import re

# Remove updateProjectPassword
content = re.sub(r'async function updateProjectPassword\(\) \{.*?(?=async function|function|\n\s*\n\s*\n)', '', content, flags=re.DOTALL)

# Fix updateProjectName
content = content.replace("db.ref(`projects/${projectId}/settings/projectName`).set(n)", "db.ref(`projects/${projectId}/publicSettings/projectName`).set(n)")

# Replace hashPassword with AppCrypto.hashPassword just in case
content = content.replace("hashPassword(", "AppCrypto.hashPassword(")

with open("js/admin.js", 'w') as f:
    f.write(content)
