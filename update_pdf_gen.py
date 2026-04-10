import re

with open('saiten.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific lines inside generateAndSave
old_font = r"        // フォント設定\n        doc\.setFontSize\(8\);\n        doc\.setTextColor\(50\);"

new_font = """        // フォントの読み込み (日本語対応)
        const fontRes = await fetch("fonts/BIZUDGothic-Regular.ttf");
        const fontBuffer = await fontRes.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(fontBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const fontBase64 = window.btoa(binary);
        doc.addFileToVFS('BIZUDGothic.ttf', fontBase64);
        doc.addFont('BIZUDGothic.ttf', 'BIZUDGothic', 'normal');
        doc.setFont('BIZUDGothic');
        doc.setFontSize(8);
        doc.setTextColor(50);
"""

content = re.sub(old_font, new_font, content, count=1)

old_layout = r"        // 3\. 受付番号マークシート \(Bottom Left\).*?doc\.text\(\"Name / Affiliation\", nameBoxX \+ 2, nameBoxY \+ 10\);"

new_layout = """        // 3. 受付番号マークシート (Bottom Left)
        const bottomY = gridMarginTop + maxGridHeight + 5; // y = 267
        doc.setFontSize(10);
        doc.text("受付番号", 15, bottomY + 4);

        const markSheetX = 35;
        const markSheetY = bottomY + 8;
        const bubbleW = 4;
        const bubbleH = 6;
        
        doc.setFontSize(8);
        for (let col = 0; col < 3; col++) {
          // 手書き枠
          const cx = markSheetX + col * (bubbleW + 2);
          doc.rect(cx, markSheetY - 7, bubbleW, 6, 'S');

          for (let row = 0; row < 10; row++) {
            const cy = markSheetY + row * (bubbleH + 1.5);
            
            doc.ellipse(cx + bubbleW/2, cy + bubbleH/2, bubbleW/2, bubbleH/2, 'S');
            doc.text(row.toString(), cx + bubbleW/2, cy + bubbleH/2, { align: 'center', baseline: 'middle' });
            
            // scoring.html は cell.row を 桁数(0-2)、cell.col を 値(0-9) とみなす
            config.markCells.push({ x: cx, y: cy, w: bubbleW, h: bubbleH, row: col, col: row });
          }
        }

        // 4. 名前・所属枠 (Bottom Right)
        const nameBoxX = 75;
        const nameBoxY = bottomY - 3;
        const boxW = 120;
        doc.rect(nameBoxX, nameBoxY, boxW, 26, 'S');
        doc.line(nameBoxX + boxW/3, nameBoxY, nameBoxX + boxW/3, nameBoxY + 26, 'S');
        doc.line(nameBoxX + (boxW*2)/3, nameBoxY, nameBoxX + (boxW*2)/3, nameBoxY + 26, 'S');

        // 上部ラベル
        doc.setFontSize(8);
        doc.text("学年", nameBoxX + 2, nameBoxY + 4);
        doc.text("氏名", nameBoxX + boxW/3 + 2, nameBoxY + 4);
        doc.text("所属", nameBoxX + (boxW*2)/3 + 2, nameBoxY + 4);
"""

content = re.sub(old_layout, new_layout, content, flags=re.DOTALL, count=1)

with open('saiten.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated saiten.html with new layout and font.")
