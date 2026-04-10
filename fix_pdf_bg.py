import re

with open('scoring.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace my old fillStyle attempt with the proper alpha channel flattener after rendering
old_block = r"                // PDF透過背景対策: 描画前に白で塗りつぶす\n                workCtx\.fillStyle = '#ffffff';\n                workCtx\.fillRect\(0, 0, workCanvas\.width, workCanvas\.height\);\n                await page\.render\(\{ canvasContext: workCtx, viewport \}\)\.promise;"

new_block = """                await page.render({ canvasContext: workCtx, viewport, background: 'rgba(255,255,255,1)' }).promise;

                // 念のため、キャンバスの透明ピクセルを白に強制置換 (pdf.jsのバージョン対策)
                const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                for (let i = 0; i < imgData.data.length; i += 4) {
                    if (imgData.data[i + 3] < 255) {
                        // 透明度に応じて白をミックスするか、単純に白で塗りつぶす
                        const alpha = imgData.data[i + 3] / 255;
                        imgData.data[i] = imgData.data[i] * alpha + 255 * (1 - alpha);
                        imgData.data[i + 1] = imgData.data[i + 1] * alpha + 255 * (1 - alpha);
                        imgData.data[i + 2] = imgData.data[i + 2] * alpha + 255 * (1 - alpha);
                        imgData.data[i + 3] = 255;
                    }
                }
                workCtx.putImageData(imgData, 0, 0);"""

content = re.sub(old_block, new_block, content, count=1)

with open('scoring.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied robust canvas transparency fix.")
