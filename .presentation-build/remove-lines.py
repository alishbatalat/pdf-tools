import zipfile,lxml.etree as E,re
src=r'C:/Users/User/Downloads/Waseem Construction Company - Editable Portfolio (1).pptx'
out=r'C:/Users/User/Downloads/pdf tools/.presentation-build/no-lines-candidate.pptx'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
changed=[]
with zipfile.ZipFile(src) as zi,zipfile.ZipFile(out,'w') as zo:
 for info in zi.infolist():
  data=zi.read(info.filename)
  if re.match(r'ppt/slides/slide\d+.xml$',info.filename):
   xml=data.decode('utf-8')
   def remove(m):
    el=E.fromstring(m.group(0),E.XMLParser(recover=True))
    ext=re.search(r'<a:ext cx="(\d+)" cy="(\d+)"',m.group(0))
    if ext and 0<int(ext[1])<=762000 and int(ext[2])<=28575 and '<a:t>' not in m.group(0):
     changed.append(info.filename);return ''
    return m.group(0)
   xml=re.sub(r'<p:sp>.*?</p:sp>',remove,xml,flags=re.S)
   data=xml.encode('utf-8');E.fromstring(data)
  zo.writestr(info,data)
with zipfile.ZipFile(src) as a,zipfile.ZipFile(out) as b:
 diffs=[n for n in a.namelist() if a.read(n)!=b.read(n)]
 assert sorted(diffs)==sorted(set(changed))
 for n in diffs:
  old=E.fromstring(a.read(n));new=E.fromstring(b.read(n));
  for s in list(old.xpath('//p:sp',namespaces=ns)):
   e=s.find('p:spPr/a:xfrm/a:ext',ns)
   if e is not None and 0<int(e.get('cx'))<=762000 and int(e.get('cy'))<=28575 and not s.xpath('.//a:t',namespaces=ns):s.getparent().remove(s)
  assert E.tostring(old)==E.tostring(new),n
print('Removed',len(changed),'accent lines; all other slide content and package entries unchanged.')
