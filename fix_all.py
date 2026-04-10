import re

with open('saiten.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Grid Height
content = content.replace("const maxGridHeight = 192;", "const maxGridHeight = 232;")

old_layout = r"        // 3\. 受付番号マークシート \(Bottom Left\).*?doc\.text\(\"氏名\", nameBoxX \+ L4 \+ \(L5-L4\)\/2, nameBoxY \+ 13, \{ align: \'center\', baseline: \'middle\' \}\);"

new_layout = """        // 3. 受付番号マークシート (Bottom Left)
        const bottomY = gridMarginTop + maxGridHeight + 5; 
        doc.setFontSize(10);
        doc.text("受付番号", 15, bottomY + 2);

        const markSheetX = 15;
        const markSheetY = bottomY + 5;
        const bubbleW = 3.2;
        const bubbleH = 5.0;
        
        doc.setFontSize(8);
        for (let row = 0; row < 3; row++) {
          // 手書き枠 (左側)
          const boxY = markSheetY + row * (bubbleH + 2);
          doc.rect(markSheetX, boxY, 5, 5, 'S');

          for (let col = 0; col < 10; col++) {
            // バブル間隔を限界まで詰める
            const cx = markSheetX + 7 + col * (bubbleW + 1.2);
            const cy = boxY;
            
            doc.ellipse(cx + bubbleW/2, cy + bubbleH/2, bubbleW/2, bubbleH/2, 'S');
            doc.text(col.toString(), cx + bubbleW/2, cy + bubbleH/2, { align: 'center', baseline: 'middle' });
            
            config.markCells.push({ x: cx, y: cy, w: bubbleW, h: bubbleH, row: row, col: col });
          }
        }

        // 4. 名前・所属・学年枠 (Bottom Right)
        const nameBoxX = 75;
        const nameBoxY = bottomY;
        const boxW = 120;
        // 合計の高さ: markSheetYから3行分 (およそ 3*(5+2) = 21mm)
        const nameBoxH = 22; 
        doc.rect(nameBoxX, nameBoxY, boxW, nameBoxH, 'S');
        
        // 区切り線 (氏名を一番広くする)
        const L1 = 8;   // 学年ラベル
        const L2 = 18;  // 学年記入枠
        const L3 = 26;  // 所属ラベル
        const L4 = 60;  // 所属記入枠 (34mm)
        const L5 = 68;  // 氏名ラベル
        // 氏名枠は残り 120 - 68 = 52mm ! 広大!
        
        doc.line(nameBoxX + L1, nameBoxY, nameBoxX + L1, nameBoxY + nameBoxH, 'S');
        doc.line(nameBoxX + L2, nameBoxY, nameBoxX + L2, nameBoxY + nameBoxH, 'S');
        doc.line(nameBoxX + L3, nameBoxY, nameBoxX + L3, nameBoxY + nameBoxH, 'S');
        doc.line(nameBoxX + L4, nameBoxY, nameBoxX + L4, nameBoxY + nameBoxH, 'S');
        doc.line(nameBoxX + L5, nameBoxY, nameBoxX + L5, nameBoxY + nameBoxH, 'S');

        // ラベル
        doc.setFontSize(8);
        doc.text("学年", nameBoxX + L1/2, nameBoxY + nameBoxH/2, { align: 'center', baseline: 'middle' });
        doc.text("所属", nameBoxX + L2 + (L3-L2)/2, nameBoxY + nameBoxH/2, { align: 'center', baseline: 'middle' });
        doc.text("氏名", nameBoxX + L4 + (L5-L4)/2, nameBoxY + nameBoxH/2, { align: 'center', baseline: 'middle' });"""

content = re.sub(old_layout, new_layout, content, flags=re.DOTALL)

with open('saiten.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed layout accurately.")
