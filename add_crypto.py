import glob, sys

files = ['admin.html', 'judge.html', 'entry.html', 'index.html', 'conflict.html', 'checkin.html', 'question.html']

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        if 'src="js/crypto.js"' not in content:
            content = content.replace('<script src="js/config.js"></script>', '<script src="js/config.js"></script>\n  <script src="js/crypto.js"></script>')

            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f'Added crypto.js to {f}')
    except Exception as e:
        print(e)
