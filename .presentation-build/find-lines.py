import zipfile,lxml.etree as E,re
p=r'C:/Users/User/Downloads/Waseem Construction Company - Editable Portfolio (1).pptx'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
with zipfile.ZipFile(p) as z:
 for n in z.namelist():
  if not re.match(r'ppt/slides/slide\d+.xml$',n):continue
  t=E.fromstring(z.read(n))
  for s in t.xpath('//p:sp',namespaces=ns):
   e=s.find('p:spPr/a:xfrm/a:ext',ns)
   if e is not None and 0<int(e.get('cx'))<=762000 and int(e.get('cy'))<=28575 and not s.xpath('.//a:t',namespaces=ns):print(n,s.find('p:nvSpPr/p:cNvPr',ns).attrib,e.attrib)
