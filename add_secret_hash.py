import os, re

files = [
    'js/admin.js', 'js/judge.js', 'js/question.js', 'js/conflict.js', 
    'js/checkin.js', 'js/cancel.js', 'js/disclosure.js', 'js/entry_list.js'
]

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if "session.get('secretHash')" not in content:
            content = content.replace(
                "const scorerRole = session.get('scorer_role');",
                "const scorerRole = session.get('scorer_role');\nconst secretHash = session.get('secretHash');"
            )
            # In cases where scorerRole doesn't exist but projectId does
            if "const secretHash = session.get('secretHash');" not in content:
                content = content.replace(
                    "const projectId = session.get('projectId');",
                    "const projectId = session.get('projectId');\nconst secretHash = session.get('secretHash');"
                )

            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f'Added secretHash to {f}')
    except Exception as e:
        print(f"Error processing {f}: {e}")
