import re
with open("js/admin.js", "r") as f:
    content = f.read()

# Replace the CSV export logic with an async-aware version
old_export = """            const snap = await db.ref(`projects/${projectId}/entries`).orderByChild('entryNumber').get();
            if (!snap.exists()) return;
            const rows = [['受付番号', '姓', '名', 'セイ', 'メイ', 'メールアドレス', '所属機関', '学年', 'エントリー名', '意気込み', '連絡事項', '状態', 'UUID']];
            snap.forEach(child => {
                const v = child.val();
                const stat = v.status === 'canceled' ? 'canceled' : v.checkedIn ? 'checkedIn' : 'registered';
                rows.push([
                    v.entryNumber, v.familyName, v.firstName, v.familyNameKana, v.firstNameKana,
                    v.email, v.affiliation, v.grade, v.entryName, `"${(v.message || '').replace(/"/g, '""')}"`,
                    `"${(v.inquiry || '').replace(/"/g, '""')}"`, stat, v.uuid
                ]);
            });"""

new_export = """            const snap = await db.ref(`projects/${projectId}/entries`).orderByChild('entryNumber').get();
            if (!snap.exists()) return;
            const rows = [['受付番号', '姓', '名', 'セイ', 'メイ', 'メールアドレス', '所属機関', '学年', 'エントリー名', '意気込み', '連絡事項', '状態', 'UUID']];
            
            const children = [];
            snap.forEach(child => { children.push(child.val()); });
            
            for (const v of children) {
                let pii = v;
                if (v.encryptedPII) {
                    try {
                        const privJwk = JSON.parse(session.get('privateKeyJwk'));
                        const jsonStr = await AppCrypto.decryptRSA(v.encryptedPII, privJwk);
                        pii = JSON.parse(jsonStr);
                    } catch(e) { console.error("Decryption failed", e); }
                }
                
                const stat = v.status === 'canceled' ? 'canceled' : v.checkedIn ? 'checkedIn' : 'registered';
                rows.push([
                    v.entryNumber, pii.familyName || '', pii.firstName || '', pii.familyNameKana || '', pii.firstNameKana || '',
                    pii.email || '', pii.affiliation || '', pii.grade || '', pii.entryName || '', `"${(pii.message || '').replace(/"/g, '""')}"`,
                    `"${(pii.inquiry || '').replace(/"/g, '""')}"`, stat, v.uuid
                ]);
            }"""

if old_export in content:
    content = content.replace(old_export, new_export)

with open("js/admin.js", "w") as f:
    f.write(content)
