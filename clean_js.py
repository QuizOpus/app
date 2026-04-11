import os, re

files = ['js/admin.js', 'js/judge.js', 'js/conflict.js', 'js/entry.js']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    lines = content.splitlines()
    new_lines = []
    prev_was_divider = False
    
    for line in lines:
        stripped = line.strip()
        
        # Simple string-replace for console lines
        if 'console.log(' in stripped or 'console.error(' in stripped:
            if stripped.startswith('console.log') or stripped.startswith('console.error'):
                continue
            # Handle inline catch
            line = re.sub(r'console\.log\([^)]*\);?', '', line)
            line = re.sub(r'console\.error\([^)]*\);?', '', line)
            
        if re.match(r'^//\s*={5,}$', stripped):
            if prev_was_divider:
                continue
            prev_was_divider = True
        else:
            prev_was_divider = False
            
        new_lines.append(line)
        
    final_text = '\n'.join(new_lines)
    # Remove empty lines if there are too many sequentially
    final_text = re.sub(r'\n{3,}', '\n\n', final_text)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(final_text)

print('Cleaned JS files')
