import re
t=open('src/template.html').read()
lib=open('src/qrcode.js').read().replace('</script','<\\/script')
eng=open('src/engine.js').read()
eng=eng.replace('typeof qrcode !== "undefined" ? qrcode : require("./qrcode.js")','typeof qrcode !== "undefined" ? qrcode : require("./qrcode.js")')
t=t.replace('/*QRLIB*/',lib).replace('/*ENGINE*/',eng.split('if (typeof module')[0])
open('index.html','w').write(t)
print(len(t))
