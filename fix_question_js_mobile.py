import re
with open("js/question.js", "r") as f:
    content = f.read()

# Add the scoreSelected function to window so the HTML buttons can call it
js_to_add = """
        window.scoreSelected = function(status) {
            if (entryNumbers.length === 0) return;
            const entryNum = entryNumbers[selectedIndex];
            
            // UI visual feedback
            const card = Object.values(document.querySelectorAll('.answer-card')).find(el => {
                const badge = el.querySelector('.entry-num');
                return badge && badge.textContent === entryNum;
            });
            
            if (card) {
                card.style.transform = 'scale(1.05)';
                setTimeout(() => card.style.transform = 'scale(1)', 150);
            }

            db.ref(`projects/${projectId}/protected/${secretHash}/scores/${entryNum}/q${currentQ}/${scorerName}`).set(status);

            // 最後の回答でなければ自動で次の回答へ移動
            if (selectedIndex < entryNumbers.length - 1) {
                selectedIndex++;
                updateSelection();
            }
        };

        // Re-use logic in keydown
"""

content = content.replace("document.addEventListener('keydown', (e) => {", js_to_add + "document.addEventListener('keydown', (e) => {")

key_logic = """            if (key === 'm' || key === 'M') {
                e.preventDefault();
                const entryNum = entryNumbers[selectedIndex];
                db.ref(`projects/${projectId}/protected/${secretHash}/scores/${entryNum}/q${currentQ}/${scorerName}`).set('correct');
                if (selectedIndex < entryNumbers.length - 1) {
                    selectedIndex++;
                    updateSelection();
                }
            } else if (key === 'x' || key === 'X') {
                e.preventDefault();
                const entryNum = entryNumbers[selectedIndex];
                db.ref(`projects/${projectId}/protected/${secretHash}/scores/${entryNum}/q${currentQ}/${scorerName}`).set('wrong');
                if (selectedIndex < entryNumbers.length - 1) {
                    selectedIndex++;
                    updateSelection();
                }
            } else if (key === 'h' || key === 'H') {
                e.preventDefault();
                const entryNum = entryNumbers[selectedIndex];
                db.ref(`projects/${projectId}/protected/${secretHash}/scores/${entryNum}/q${currentQ}/${scorerName}`).set('hold');
                if (selectedIndex < entryNumbers.length - 1) {
                    selectedIndex++;
                    updateSelection();
                }
            }"""

new_key_logic = """            if (key === 'm' || key === 'M') {
                e.preventDefault();
                window.scoreSelected('correct');
            } else if (key === 'x' || key === 'X') {
                e.preventDefault();
                window.scoreSelected('wrong');
            } else if (key === 'h' || key === 'H') {
                e.preventDefault();
                window.scoreSelected('hold');
            }"""

content = content.replace(key_logic, new_key_logic)

with open("js/question.js", "w") as f:
    f.write(content)
