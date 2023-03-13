# Walk through the directory and make any file called notes.md into a webpage 
# at the same location.

import os 
path = os.path.dirname(__file__)

template = """<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="stylesheet" type="text/css" href="/style.css">
  </head>
  <body>
  <section>
    <span><a href="/">←Back</a></span>
  </section>
  <section class="note">
    {content}
  </section>
  </body>
</html>"""


# Support a super basic set of markdown 
tags = {
  '#': 'h1',
  '##': 'h2',
  '###': 'h3',
  '-': 'li'
}


# Turn the note markdown into content html.
def note_to_html (note) : 
  
  # Split by line and ignore empties
  lines = [l for l in note.split('\n') if l]

  html = "<{tag}>{content}</{tag}>"
  out = []

  for line in lines :
    line = line.strip()
    flag = line.split(' ')[0]
    if flag in tags :
      start = len(flag) + 1
      out.append(html.format(tag = tags[flag], content = line[start::]))
    else :
      out.append(html.format(tag = 'p', content = line))

  return '\n    '.join(out)




for (root, dirs, file) in os.walk(path) :

  for f in file : 
    if 'notes.md' in f :
      content = open(root + '/' + f)
      note = content.read()
      content.close()

      content = note_to_html(note)
      page = template.format(title = 'Notes', content = content)

      f2 = open(root + '/' + 'notes.html', 'w');
      f2.write(page);
      f2.close();
      print('Wrote note at ' + root)
