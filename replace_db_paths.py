import os, re

files = [
    'js/admin.js', 'js/judge.js', 'js/question.js', 'js/conflict.js', 
    'js/checkin.js', 'js/cancel.js', 'js/disclosure.js', 'js/entry_list.js'
]

targets = [
    'config', 'answers', 'answers_text', 'scores', 'disclosure', 'entryConfig'
]

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        original_content = content
        
        for tgt in targets:
            content = content.replace(f'`projects/${{projectId}}/{tgt}', f'`projects/${{projectId}}/protected/${{secretHash}}/{tgt}')
            content = content.replace(f"projects/' + projectId + '/{tgt}", f"projects/' + projectId + '/protected/' + secretHash + '/{tgt}")
            content = content.replace(f'projects/" + projectId + "/{tgt}', f'projects/" + projectId + "/protected/" + secretHash + "/{tgt}')

        # Add secretHash variable at the top of functions or where projectId is grabbed
        
        if content != original_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f'Updated DB paths in {f}')
    except Exception as e:
        print(f"Error processing {f}: {e}")
