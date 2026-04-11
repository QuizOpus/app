import re
with open("js/admin.js", "r") as f:
    content = f.read()

old_logic = """                tbody.innerHTML = '';
                snap.forEach(child => {
                    const v = child.val();
                    const tr = document.createElement('tr');
                    if (v.status === 'canceled') tr.style.opacity = '0.5';
                    const statText = v.status === 'canceled' ? '<span style="color:#ef5350">ｷｬﾝｾﾙ</span>'
                        : v.checkedIn ? '<span style="color:#4caf50">受付済</span>' : '未受付';

                    tr.innerHTML = `
                    <td style="padding:8px;border:1px solid #444;">${v.entryNumber || '-'}</td>
                    <td style="padding:8px;border:1px solid #444;">${v.familyName} ${v.firstName}<br><span style="font-size:11px;color:#aaa">${v.familyNameKana} ${v.firstNameKana}</span></td>
                    <td style="padding:8px;border:1px solid #444;">${v.entryName || ''}</td>
                    <td style="padding:8px;border:1px solid #444;">${v.affiliation || ''}</td>
                    <td style="padding:8px;border:1px solid #444;">${v.grade || ''}</td>
                    <td style="padding:8px;border:1px solid #444;"><span style="font-size:11px;color:#aaa">${v.email || ''}</span><br>${v.inquiry || '-'}</td>
                    <td style="padding:8px;border:1px solid #444;font-weight:bold;">${statText}</td>
                `;
                    tbody.appendChild(tr);
                });"""

new_logic = """                tbody.innerHTML = '';
                const children = [];
                snap.forEach(c => { children.push(c.val()); });
                
                for (const v of children) {
                    let pii = v;
                    if (v.encryptedPII) {
                        try {
                            const privJwk = JSON.parse(session.get('privateKeyJwk'));
                            const jsonStr = await AppCrypto.decryptRSA(v.encryptedPII, privJwk);
                            pii = JSON.parse(jsonStr);
                        } catch(e) { console.error("Decryption failed", e); }
                    }
                    
                    const tr = document.createElement('tr');
                    if (v.status === 'canceled') tr.style.opacity = '0.5';
                    const statText = v.status === 'canceled' ? '<span style="color:#ef5350">ｷｬﾝｾﾙ</span>'
                        : v.checkedIn ? '<span style="color:#4caf50">受付済</span>' : '未受付';

                    tr.innerHTML = `
                    <td style="padding:8px;border:1px solid #444;">${v.entryNumber || '-'}</td>
                    <td style="padding:8px;border:1px solid #444;">${pii.familyName || '-'} ${pii.firstName || '-'}<br><span style="font-size:11px;color:#aaa">${pii.familyNameKana || ''} ${pii.firstNameKana || ''}</span></td>
                    <td style="padding:8px;border:1px solid #444;">${pii.entryName || ''}</td>
                    <td style="padding:8px;border:1px solid #444;">${pii.affiliation || ''}</td>
                    <td style="padding:8px;border:1px solid #444;">${pii.grade || ''}</td>
                    <td style="padding:8px;border:1px solid #444;"><span style="font-size:11px;color:#aaa">${pii.email || ''}</span><br>${pii.inquiry || '-'}</td>
                    <td style="padding:8px;border:1px solid #444;font-weight:bold;">${statText}</td>
                `;
                    tbody.appendChild(tr);
                }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)

with open("js/admin.js", "w") as f:
    f.write(content)
