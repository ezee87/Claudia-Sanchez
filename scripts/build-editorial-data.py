"""One-time extraction of the supplied copy; no remote writes."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = ROOT / 'codex-spec/claudia-codex-spec'
def sections(file):
    text = (spec / file).read_text(encoding='utf-8')
    return {re.search(r'`([^`]+)`', h).group(1): b.strip() for h,b in re.findall(r'^## ([^\n]+)\n(.*?)(?=^## |\Z)',text,re.M|re.S) if '`' in h}
def clean(s): return s.strip().strip('“”')
def title(b): return re.search(r'\*\*Título:\*\* (.+)',b).group(1)
def paras(b):
    return [x.strip() for x in b.split('\n\n') if x.strip() and not x.strip().startswith(('*','#','-'))]
def base(b):
    d={'title':title(b)}
    for i,p in enumerate(paras(b)): d[f'paragraph{i+1}']=p
    m=re.search(r'\*\*Cierre destacado:\*\* (.+)',b)
    if m:d['highlight']=m.group(1)
    return d
def items(values):return [{'_id':f'item-{i+1}','visible':1,**v} for i,v in enumerate(values)]
data={}
home=sections('02-COPY-INICIO.md'); people=sections('03-COPY-PERSONAS.md'); business=sections('04-COPY-EMPRESAS.md')
for route,blocks in [('/',home),('/personas',people),('/empresas',business)]:
    data[route]={}
    for key,b in blocks.items():
        if key in ['servicios','situaciones','desafios','proceso','testimonios']:continue
        data[route][key]=base(b)
    data[route]['hero']['eyebrow']={'/':'Claudia Sánchez Urencio','/personas':'Para personas','/empresas':'Para empresas'}[route]
    data[route]['hero']['cta']={'label':{'/':'Conoce mi trabajo','/personas':'Conoce mis servicios','/empresas':'Explora los servicios'}[route],'href':'#servicios'}
data['/']['hero'].update(image='/assets/claudia-sanchez/claudia-hero.png',alt='Claudia Sánchez Urencio')
data['/']['sobre-mi']['credentials']=items([{'title':x.split(': comprobar')[0].rstrip('.'),'status':'pendiente','visible':0} for x in re.findall(r'^- (.+)',home['sobre-mi'],re.M)])
data['/']['servicios']={'title':title(home['servicios']),'items':items([{'eyebrow':label,'title':t,'description':desc,'href':url} for label,t,desc,url in zip(['Para personas','Para empresas'],re.findall(r'\*\*Título:\*\* (.+)',home['servicios'])[1:],re.findall(r'\*\*Texto:\*\* (.+)',home['servicios']),['/personas','/empresas'])]),'cta':{'label':'Conversemos sobre tus necesidades','href':'/contacto'}}
for route,blocks,kind in [('/personas',people,'persona'),('/empresas',business,'empresa')]:
    services=[]
    for i,(heading,b) in enumerate(re.findall(r'^### Servicio \d — ([^\n]+)\n(.*?)(?=^### |\Z)',blocks['servicios'],re.M|re.S)):
        slug=(['coaching-ejecutivo','transicion-carrera','disena-tu-futuro'] if kind=='persona' else ['coaching-ejecutivo','desarrollo-equipos','cambio-transicion'])[i]
        label=re.search(r'\*\*Botón:\*\* (.+)',b).group(1).split(' →')[0].rstrip('.')
        sub=re.search(r'\*\*Subtítulo:\*\* (.+)',b)
        services.append({'title':heading.replace(' [PROVISIONAL]',''),'description':'\n\n'.join(paras(b)),'subtitle':sub.group(1) if sub else '', 'label':label,'href':'/disena-tu-futuro' if slug=='disena-tu-futuro' else f'/contacto?tipo={kind}&servicio={slug}'})
    data[route]['servicios']={'title':title(blocks['servicios']),'items':items(services)}
    key='situaciones' if kind=='persona' else 'desafios'
    b=blocks[key]; headings=re.findall(r'^\*\*(.+)\*\*\n\n([^*#\n].+)',b,re.M)
    data[route][key]={'title':title(b),'paragraph1':re.search(r'\*\*Texto:\*\* (.+)',b).group(1) if kind=='persona' else paras(b)[0], 'items':items([{'title':re.sub(r'^Situación \d — ','',h),'description':p} for h,p in headings if not h.endswith(':')])}
data['/empresas']['proceso']={'title':title(business['proceso']),'items':items([{'title':h,'description':p} for h,p in re.findall(r'\*\*\d\d\. (.+)\*\*\n\n(.+)',business['proceso'])])}
testimonials={
'/':[('Lucía López Sarre','Marketing Director.','Su metodología también marca una diferencia: es clara, profunda y totalmente accionable. No se queda en la teoría; te impulsa, te estructura y te hace avanzar.'),('Fabián Fuentes','','Lo que distingue a Claudia no es solo su experiencia en desarrollo de talento y liderazgo — que es amplia — sino su capacidad de hacer las preguntas correctas en el momento correcto, y de acompañar sin imponer.'),('Pedro Fondevila','','Claudia me ha ayudado, aprovechando su experiencia profesional, a transformar mi equipo en un equipo de alto rendimiento.')],
'/personas':[], '/empresas':[]}
for route,blocks in [('/personas',people),('/empresas',business)]:
    for name,quote in re.findall(r'\*\*([^*\n]+)\*\*\n\n“([^”]+)”',blocks['testimonios']):
        author,_,role=name.partition(' — ');testimonials[route].append((author,role,quote))
testimonials['/empresas'].insert(0,testimonials['/'][-1])
for route,blocks in [('/',home),('/personas',people),('/empresas',business)]:
    data[route]['testimonios']={'title':title(blocks['testimonios']),'paragraph1':re.search(r'\*\*Introducción:\*\* (.+)',blocks['testimonios']).group(1),'items':items([{'author':a,'role':r,'quote':q,'image':'','alt':''} for a,r,q in testimonials[route]])}
    label={'/':'Hablemos','/personas':'Hablemos de tu carrera','/empresas':'Conversemos'}[route]
    data[route]['contacto']['cta']={'label':label,'href':'/contacto'+({'/':'','/personas':'?tipo=persona','/empresas':'?tipo=empresa'}[route])}
data['/']['articulos']['cta']={'label':'Ver todos los artículos','href':'/articulos'}
# Preserve explicit section order from the supplied documents.
for route,blocks in [('/',home),('/personas',people),('/empresas',business)]:data[route]={k:data[route][k] for k in blocks}
contact=(spec/'05-COPY-CONTACTO-GRACIAS.md').read_text(encoding='utf-8')
intro=contact.split('## Contacto — 01')[1].split('## Contacto — 02')[0].split('\n',1)[1]
data['/contacto']={'intro':base(intro),'formulario':{
'nameLabel':'Nombre completo *','namePlaceholder':'Tu nombre','emailLabel':'Correo electrónico *','emailPlaceholder':'nombre@correo.com','typeLabel':'¿Qué tipo de consulta deseas realizar? *','personLabel':'Servicios para personas','companyLabel':'Servicios para empresas','otherLabel':'Otra consulta','companyFieldLabel':'Empresa','companyPlaceholder':'Nombre de la organización','messageLabel':'¿En qué puedo ayudarte? *','messagePlaceholder':'Cuéntame brevemente qué necesitas...','submitLabel':'Enviar consulta','pending':'El formulario todavía no está operativo. Puedes contactarme a través de LinkedIn.','error':'No fue posible enviar tu mensaje. Inténtalo nuevamente en unos momentos.','loading':'Enviando consulta…','successTitle':'¡Gracias por escribirme!','successText':'Recibí tu mensaje. Me pondré en contacto contigo lo antes posible.'},'contacto-directo':{'title':'¿Prefieres escribir directamente?','paragraph1':'También puedes contactarme por correo electrónico.','linkedin':{'label':'Claudia Sánchez Urencio','href':'https://www.linkedin.com/in/careertransitioncoachclau/'}}}
data['/gracias']={'neutral':{'title':'Tu próxima conversación','paragraph1':'Esta página aparece después de completar una reserva. Si todavía no has agendado una conversación, puedes regresar al programa.','cta':{'label':'Volver al programa','href':'/disena-tu-futuro'}},'confirmacion':{'title':'¡Gracias por agendar tu conversación!','paragraph1':'Tu reserva se realizó correctamente.','paragraph2':'Este es el primer paso para explorar cómo quieres construir tu siguiente etapa profesional y personal.','paragraph3':'Durante nuestra conversación podremos conocer tu situación actual, hablar sobre tus objetivos y explorar cómo puedo acompañarte.','highlight':'Revisa tu correo electrónico: recibirás los detalles de la reunión y el enlace para conectarte.','paragraph4':'Nos vemos pronto.','signature':'Claudia Sánchez Urencio'},'proximos-pasos':{'items':items([{'title':h,'description':p} for h,p in re.findall(r'\*\*([^*]+)\*\*\n\n([^*\n].+)',contact.split('## Gracias — 02')[1].split('## Gracias — 03')[0])])},'volver':{'cta':{'label':'Volver al inicio','href':'/'}}}
data['/articulos']={'intro':{'title':'Artículos','eyebrow':'How to Thrive Beyond 40','subtitle':'Un newsletter para líderes que buscan evolucionar más allá de los éxitos convencionales.','paragraph1':'Reflexiones sobre liderazgo, desarrollo profesional, transiciones de carrera y las decisiones que nos permiten construir nuevas etapas con claridad y propósito.'},'listado':{'empty':'Los artículos estarán disponibles próximamente.','readLabel':'Leer artículo','items':[]}}
data['/articulos/:slug']={'encabezado':{'collection':'How to Thrive Beyond 40'},'contenido':{'unavailable':'Este artículo todavía no está disponible.'},'pie-articulo':{'signature':'Por Claudia Sánchez Urencio','back':{'label':'Volver a Artículos','href':'/articulos'}}}
data['/404']={'intro':{'eyebrow':'404','title':'No encontramos esta página.','paragraph1':'Puedes volver al inicio para continuar explorando.','cta':{'label':'Volver al inicio','href':'/'}}}
data['/']['navbar']={'brand':{'label':'Claudia Sánchez Urencio','href':'/'},'home':{'label':'Inicio','href':'/'},'about':{'label':'Sobre mí','href':'/#sobre-mi'},'servicesLabel':'Servicios','people':{'label':'Para personas','href':'/personas'},'business':{'label':'Para empresas','href':'/empresas'},'articles':{'label':'Artículos','href':'/articulos'},'contact':{'label':'Contacto','href':'/contacto'},'openLabel':'Abrir menú','closeLabel':'Cerrar menú','skipLabel':'Saltar al contenido'}
data['/']['footer']={'brand':'Claudia Sánchez Urencio','line':'Coaching ejecutivo, desarrollo de liderazgo y estrategia de carrera.','linkedin':{'label':'LinkedIn','href':'https://www.linkedin.com/in/careertransitioncoachclau/'}}
for route,content in data.items():
    name={'/':'Inicio','/personas':'Para personas','/empresas':'Para empresas','/contacto':'Contacto','/gracias':'Gracias','/articulos':'Artículos','/articulos/:slug':'Artículo','/404':'Página no encontrada'}[route]
    first=next(iter(content.values()))
    content['seo']={'title':f'{name} | Claudia Sánchez Urencio','description':first.get('paragraph1',first.get('title',''))}
(ROOT/'src/data/institutional/content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


