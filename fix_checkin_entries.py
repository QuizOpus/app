import re
with open("js/checkin.js", "r") as f:
    content = f.read()

old_logic = """                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding:10px;border-bottom:1px solid #444;">${v.entryNumber}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;">${v.familyName} ${v.firstName}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;">${v.affiliation || '-'}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;font-weight:bold;color:${v.checkedIn ? '#4caf50' : '#aaa'}">${v.checkedIn ? '<i class="fa-solid fa-check"></i> 完了' : '未完了'}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;text-align:right;">
                            <button class="btn" style="padding:6px 12px;font-size:14px;${v.checkedIn ? 'background:#444' : ''}" onclick="completeCheckin('${v.uuid}')">${v.checkedIn ? '取消' : '受付完了'}</button>
                        </td>
                    `;
                    tbody.appendChild(row);"""

# wait, checkin.js needs the entire snap.forEach modified as well
content = re.sub(r"snap\.forEach\(child => \{(.*?)\}\);", 
r"""                const children = [];
                snap.forEach(c => children.push(c.val()));
                for (const v of children) {
                    let pii = v;
                    if (v.encryptedPII) {
                        try {
                            const privJwk = JSON.parse(session.get('privateKeyJwk'));
                            const jsonStr = await AppCrypto.decryptRSA(v.encryptedPII, privJwk);
                            pii = JSON.parse(jsonStr);
                        } catch(e) {}
                    }
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding:10px;border-bottom:1px solid #444;">${v.entryNumber}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;">${pii.familyName || '-'} ${pii.firstName || '-'}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;">${pii.affiliation || '-'}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;font-weight:bold;color:${v.checkedIn ? '#4caf50' : '#aaa'}">${v.checkedIn ? '<i class="fa-solid fa-check"></i> 完了' : '未完了'}</td>
                        <td style="padding:10px;border-bottom:1px solid #444;text-align:right;">
                            <button class="btn" style="padding:6px 12px;font-size:14px;${v.checkedIn ? 'background:#444' : ''}" onclick="completeCheckin('${v.uuid}')">${v.checkedIn ? '取消' : '受付完了'}</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                }""", content, flags=re.DOTALL)

with open("js/checkin.js", "w") as f:
    f.write(content)
