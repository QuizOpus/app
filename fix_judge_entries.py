import re
with open("js/judge.js", "r") as f:
    content = f.read()

old_logic = """            db.ref(`projects/${projectId}/entries`).once('value', snap => {
                if (snap.exists()) {
                    const masterData = {};
                    snap.forEach(c => {
                        const v = c.val();
                        if (v.entryNumber) masterData[v.entryNumber] = { name: `${v.familyName} ${v.firstName}` };
                    });
                    localStorage.setItem('masterData', JSON.stringify(masterData));
                }
            });"""

new_logic = """            db.ref(`projects/${projectId}/entries`).once('value', async snap => {
                if (snap.exists()) {
                    const masterData = {};
                    const privJwkStr = session.get('privateKeyJwk');
                    let privJwk = null;
                    if (privJwkStr) {
                        try { privJwk = JSON.parse(privJwkStr); } catch(e){}
                    }

                    const children = [];
                    snap.forEach(c => children.push(c.val()));
                    
                    for (const v of children) {
                        if (!v.entryNumber) continue;
                        let name = '回答者 ' + v.entryNumber;
                        if (v.encryptedPII && privJwk) {
                            try {
                                const jsonStr = await AppCrypto.decryptRSA(v.encryptedPII, privJwk);
                                const pii = JSON.parse(jsonStr);
                                name = `${pii.familyName} ${pii.firstName}`;
                            } catch(e) {}
                        } else if (!v.encryptedPII && v.familyName) {
                            name = `${v.familyName} ${v.firstName}`;
                        }
                        masterData[v.entryNumber] = { name };
                    }
                    localStorage.setItem('masterData', JSON.stringify(masterData));
                }
            });"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)

with open("js/judge.js", "w") as f:
    f.write(content)
