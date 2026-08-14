import os, re, csv, json, time, html, zipfile
from pathlib import Path
from typing import Any, Dict, List
import requests
from dotenv import load_dotenv

load_dotenv()
WEBHOOK=(os.getenv("BITRIX_WEBHOOK") or "").strip().rstrip("/")+"/"
TEST_DEAL_ID=(os.getenv("BITRIX_TEST_DEAL_ID") or "").strip()
OUT=Path(os.getenv("BITRIX_AUDIT_OUT") or "bitrix_audit")
if not WEBHOOK or "/rest/" not in WEBHOOK:
    raise SystemExit("Brak BITRIX_WEBHOOK w pliku .env")
OUT.mkdir(parents=True, exist_ok=True)
(OUT/"templates").mkdir(exist_ok=True)

s=requests.Session()
s.headers.update({"Accept":"application/json","Content-Type":"application/json","User-Agent":"MoonGlass-Bitrix-Audit/1.0"})

def call(method, params=None, timeout=60):
    r=s.post(f"{WEBHOOK}{method}.json", json=params or {}, timeout=timeout)
    r.raise_for_status()
    d=r.json()
    if d.get("error"):
        raise RuntimeError(f"{method}: {d.get('error')} — {d.get('error_description')}")
    return d

def paged(method, params=None, result_key=None):
    params=dict(params or {})
    start=0; out=[]
    while True:
        p=dict(params); p["start"]=start
        d=call(method,p); result=d.get("result")
        if result_key: result=(result or {}).get(result_key,{})
        if isinstance(result,dict): out.extend(result.values())
        elif isinstance(result,list): out.extend(result)
        elif result is not None: out.append(result)
        if d.get("next") is None: break
        start=int(d["next"]); time.sleep(.12)
    return out

def save(name,obj):
    (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2,default=str),encoding="utf-8")

def nonempty(v):
    if v is None or v is False: return False
    if isinstance(v,str): return v.strip() not in ("","0","N","Nie","nie")
    if isinstance(v,(list,tuple,dict,set)): return bool(v)
    return True

def safe_name(x):
    return re.sub(r'[<>:"/\\|?*]+',"_",x)[:140]

def placeholders(path):
    out=set()
    try:
        with zipfile.ZipFile(path) as z:
            for n in z.namelist():
                if n.startswith("word/") and n.endswith(".xml"):
                    txt=z.read(n).decode("utf-8","ignore")
                    txt=html.unescape(re.sub(r"<[^>]+>","",txt))
                    out.update(re.findall(r"\{[^{}]{1,250}\}",txt))
    except zipfile.BadZipFile:
        pass
    return sorted(out)

print("1/8 pola...")
fields=call("crm.item.fields",{"entityTypeId":2,"useOriginalUfNames":"Y"}).get("result",{}).get("fields",{})
save("01_deal_fields.json",fields)

ufs=paged("crm.deal.userfield.list",{"filter":{"LANG":"pl"},"order":{"SORT":"ASC","ID":"ASC"}})
save("02_deal_userfields.json",ufs)

print("2/8 lejki...")
cats=call("crm.category.list",{"entityTypeId":2}).get("result",{}).get("categories",[])
save("03_pipelines.json",cats)
stages=[]
for c in cats:
    cid=int(c["id"]); eid="DEAL_STAGE" if cid==0 else f"DEAL_STAGE_{cid}"
    arr=paged("crm.status.list",{"filter":{"ENTITY_ID":eid},"order":{"SORT":"ASC"}})
    for x in arr:
        x["_categoryId"]=cid; x["_categoryName"]=c.get("name")
    stages += arr
save("04_stages.json",stages)

print("3/8 układ kart...")
cards=[]
for c in cats:
    for scope in ("C","P"):
        try:
            cfg=call("crm.item.details.configuration.get",{
                "entityTypeId":2,"scope":scope,"extras":{"dealCategoryId":int(c["id"])}
            }).get("result")
            cards.append({"categoryId":c["id"],"categoryName":c.get("name"),"scope":scope,"configuration":cfg})
        except Exception as e:
            cards.append({"categoryId":c["id"],"categoryName":c.get("name"),"scope":scope,"error":str(e)})
save("05_deal_card_configurations.json",cards)

print("4/8 szablony dokumentów...")
templates=paged("crm.documentgenerator.template.list",{"select":["*","entityTypeId","users"]},result_key="templates")
templates_report=[]; ph_rows=[]; field_cards=[]
for t in templates:
    tid=str(t.get("id")); name=t.get("name") or f"template_{tid}"
    tr=dict(t)
    if tr.get("downloadMachine"): tr["downloadMachine"]="[REDACTED]"
    templates_report.append(tr)
    local=None
    if t.get("downloadMachine") and str(t.get("isDeleted","N"))!="Y":
        try:
            rr=s.get(t["downloadMachine"],timeout=90); rr.raise_for_status()
            local=OUT/"templates"/f"{tid}_{safe_name(name)}.docx"
            local.write_bytes(rr.content)
        except Exception as e:
            tr["_download_error"]=str(e)
    ph_rows.append({"templateId":tid,"templateName":name,"placeholders":placeholders(local) if local else []})

    binds=[str(x) for x in (t.get("entityTypeId") or [])]
    if TEST_DEAL_ID and any(x=="2" or x.startswith("2_category_") for x in binds):
        try:
            tf=call("crm.documentgenerator.template.getfields",{
                "id":int(tid),"entityTypeId":2,"entityId":int(TEST_DEAL_ID)
            }).get("result",{}).get("templateFields",{})
            stripped={}
            for k,v in tf.items():
                if isinstance(v,dict):
                    stripped[k]={q:v.get(q) for q in ("title","required","type","group","chain")}
            field_cards.append({"templateId":tid,"templateName":name,"fields":stripped})
        except Exception as e:
            field_cards.append({"templateId":tid,"templateName":name,"error":str(e)})
save("06_document_templates.json",templates_report)
save("07_document_template_placeholders.json",ph_rows)
save("08_document_template_fields.json",field_cards)

print("5/8 workflow...")
try:
    bp=paged("bizproc.workflow.template.list",{
        "SELECT":["ID","MODULE_ID","ENTITY","DOCUMENT_TYPE","AUTO_EXECUTE","NAME","TEMPLATE","PARAMETERS","VARIABLES","CONSTANTS","MODIFIED","SYSTEM_CODE"],
        "FILTER":{"MODULE_ID":"crm","ENTITY":"CCrmDocumentDeal"},
        "ORDER":{"ID":"ASC"},
    })
except Exception as e:
    bp=[{"_error":str(e)}]
save("09_bizproc_deal_templates.json",bp)
pat=re.compile(r"UF_CRM_[A-Z0-9_]+",re.I)
bp_refs=[]
for x in bp:
    refs=sorted(set(m.upper() for m in pat.findall(json.dumps(x,ensure_ascii=False,default=str))))
    bp_refs.append({"id":x.get("ID"),"name":x.get("NAME"),"refs":refs})
save("10_bizproc_field_refs.json",bp_refs)

print("6/8 użycie pól w dealach...")
deals=paged("crm.item.list",{
    "entityTypeId":2,
    "useOriginalUfNames":"Y",
    "order":{"id":"ASC"}
}, result_key="items")
usage={k:{"nonempty":0,"total":len(deals)} for k in fields}
for d in deals:
    for k in usage:
        if nonempty(d.get(k)): usage[k]["nonempty"]+=1
save("11_deal_field_usage.json",usage)

print("7/8 podsumowanie...")
card_refs={}
for cfg in cards:
    for sec in (cfg.get("configuration") or []):
        for el in sec.get("elements",[]) or []:
            if el.get("name"):
                card_refs.setdefault(el["name"],[]).append(f'{cfg.get("categoryName")} [{cfg.get("scope")}] / {sec.get("title")}')

bp_map={}
for x in bp_refs:
    for ref in x["refs"]:
        bp_map.setdefault(ref,[]).append(x.get("name") or str(x.get("id")))

doc_map={}
for t in field_cards:
    for code,meta in (t.get("fields") or {}).items():
        for ref in pat.findall(json.dumps(meta.get("chain"),ensure_ascii=False,default=str)):
            doc_map.setdefault(ref.upper(),[]).append(f'{t.get("templateName")} :: {code}')

ufmap={str(u.get("FIELD_NAME","")).upper():u for u in ufs}
rows=[]
for api,desc in fields.items():
    u=ufmap.get(api.upper(),{})
    rows.append({
        "field_api":api,
        "field_id":u.get("ID",""),
        "label":u.get("EDIT_FORM_LABEL") or desc.get("title") or api,
        "type":u.get("USER_TYPE_ID") or desc.get("type",""),
        "mandatory":u.get("MANDATORY","") or str(desc.get("isRequired","")),
        "multiple":u.get("MULTIPLE","") or str(desc.get("isMultiple","")),
        "sort":u.get("SORT",""),
        "deals_nonempty":usage.get(api,{}).get("nonempty",0),
        "deals_total":len(deals),
        "visible_in_card":" | ".join(card_refs.get(api,[])),
        "bizproc_refs":" | ".join(bp_map.get(api.upper(),[])),
        "document_refs":" | ".join(doc_map.get(api.upper(),[])),
        "decision":"",
        "notes":"",
    })
cols=list(rows[0].keys()) if rows else []
with (OUT/"12_field_audit_summary.csv").open("w",newline="",encoding="utf-8-sig") as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); w.writerows(rows)

print("8/8 gotowe")
(OUT/"README.txt").write_text(
    f"Pola: {len(fields)}\nPola własne: {len(ufs)}\nLejki: {len(cats)}\nEtapy: {len(stages)}\n"
    f"Szablony dokumentów: {len(templates)}\nDeale przeanalizowane: {len(deals)}\n"
    "Najważniejszy plik: 12_field_audit_summary.csv\n"
    "AUDYT READ ONLY — skrypt niczego nie zmienia w Bitrix24.\n",
    encoding="utf-8"
)
print("Wyniki:",OUT.resolve())
