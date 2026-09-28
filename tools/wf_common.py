"""排程工作流程（_workflow/）共用函式：讀設定與資料、網址／標題正規化、相似度、時間。

其他 wf_*.py 都從這裡 import；Windows 與 Linux 都能跑（UTF-8 讀寫）。
"""
import datetime as _dt
import difflib
import json
import pathlib
import re
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
WF = ROOT / "_workflow"

CATEGORIES = ["2d-pattern", "3d-architecture", "modeling", "drawing",
              "urban-landscape", "fabrication", "performance", "art-installation"]
SCALES = ["物件", "構件", "立面／表皮", "建築", "群體／都市", "地景"]
LOGICS = ["直接公式", "改寫／遞迴", "迭代模擬", "搜尋／求解", "幾何轉換"]
CC_START = 51          # creative coding 案例從 51 起編
TPE = _dt.timezone(_dt.timedelta(hours=8))


# ---------------------------------------------------------------- 檔案讀寫
def detect_indent(text):
    """偵測 JSON 檔的縮排格數（沿用原檔風格）。"""
    m = re.search(r"\n( +)\S", text)
    return len(m.group(1)) if m else 1


def load_json(path, default=None):
    path = pathlib.Path(path)
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path, obj, indent=None):
    path = pathlib.Path(path)
    if indent is None:
        indent = detect_indent(path.read_text(encoding="utf-8")) if path.exists() else 1
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=indent) + "\n", encoding="utf-8")


def config():
    return load_json(WF / "config.json", {})


def load_data():
    """回傳 (algos, cases, where)。
    algos：{id: 演算法物件}；cases：[案例物件]；
    where：{"algo:<id>": 檔名, "case:<id>": 檔名}，記錄每筆資料出自哪個 data/*.json。
    """
    algos, cases, where = {}, [], {}
    for p in sorted(DATA.glob("*.json")):
        doc = json.loads(p.read_text(encoding="utf-8"))
        for a in doc.get("algorithms", []):
            algos[a["id"]] = a
            where["algo:" + a["id"]] = p.name
        for c in doc.get("cases", []):
            cases.append(c)
            where["case:" + c["id"]] = p.name
    return algos, cases, where


def case_num(cid):
    try:
        return int(str(cid).split("-")[1])
    except (IndexError, ValueError):
        return 0


def is_cc(c):
    return case_num(c["id"]) >= CC_START


def has_image(cid):
    return (ROOT / "img" / "cases" / f"{cid}.jpg").exists()


# ---------------------------------------------------------------- 正規化與相似度
_TRACK = re.compile(r"^(utm_.*|fbclid|gclid|ref|ref_src|source|si)$", re.I)


def norm_url(u):
    """把網址正規化成比對用的鍵；同一件作品的不同寫法會得到同一個鍵。"""
    u = (u or "").strip()
    if not u:
        return ""
    if "://" not in u:
        u = "https://" + u
    p = urllib.parse.urlsplit(u)
    host = p.netloc.lower().split("@")[-1].split(":")[0]
    stripped = True
    while stripped:
        stripped = False
        for pre in ("www.", "m.", "mobile."):
            if host.startswith(pre):
                host, stripped = host[len(pre):], True
    path = re.sub(r"/+$", "", p.path)
    q = urllib.parse.parse_qs(p.query)
    # YouTube
    if host in ("youtube.com", "youtu.be", "youtube-nocookie.com"):
        vid = None
        if host == "youtu.be":
            vid = path.strip("/").split("/")[0]
        elif "v" in q:
            vid = q["v"][0]
        else:
            m = re.match(r"^/(shorts|embed|live|v)/([^/]+)", path)
            vid = m.group(2) if m else None
        if vid:
            return "youtube:" + vid
    # GitHub（gist 保留 id；一般 repo 只取 owner/repo）
    if host == "gist.github.com":
        parts = [x for x in path.split("/") if x]
        return "gist:" + (parts[-1] if parts else "").lower()
    if host == "github.com":
        parts = [x for x in path.split("/") if x]
        if len(parts) >= 2:
            return "github:" + "/".join(parts[:2]).lower()
    if host.endswith(".github.io"):
        parts = [x for x in path.split("/") if x]
        return "github:" + host.split(".")[0] + ("/" + parts[0] if parts else "")
    m = re.match(r"^/sketch/(\d+)", path)
    if host == "openprocessing.org" and m:
        return "openprocessing:" + m.group(1)
    m = re.match(r"^/view/(\w+)", path)
    if host == "shadertoy.com" and m:
        return "shadertoy:" + m.group(1)
    m = re.match(r"^/(\d+)", path)
    if host == "vimeo.com" and m:
        return "vimeo:" + m.group(1)
    m = re.match(r"^/(abs|pdf)/([\d.]+)", path)
    if host == "arxiv.org" and m:
        return "arxiv:" + re.sub(r"v\d+$", "", m.group(2))
    m = re.search(r"(10\.\d{4,9}/[^?#\s]+)", u)
    if m and host in ("doi.org", "dx.doi.org", "dl.acm.org", "link.springer.com", "sciencedirect.com",
                      "tandfonline.com", "onlinelibrary.wiley.com", "ieeexplore.ieee.org", "mdpi.com"):
        return "doi:" + m.group(1).lower().rstrip(".")
    keep = sorted((k, v) for k, vs in q.items() if not _TRACK.match(k) for v in vs)
    qs = urllib.parse.urlencode(keep)
    return (host + path + ("?" + qs if qs else "")).lower()


def norm_title(t):
    t = (t or "").lower()
    t = re.sub(r"[（(【\[].*?[）)】\]]", "", t)   # 去掉括號內的翻譯或補充
    return re.sub(r"[\W_]+", "", t)


def title_sim(a, b):
    a, b = norm_title(a), norm_title(b)
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def bigrams(text):
    """中文取相鄰雙字，英文取單字；用來比對變形文字是否雷同。"""
    text = (text or "").lower()
    out = set()
    for seg in re.findall(r"[一-鿿]+", text):
        out |= {seg[i:i + 2] for i in range(len(seg) - 1)} or {seg}
    out |= set(w for w in re.findall(r"[a-z0-9]{3,}", text))
    return out


def jaccard(a, b):
    a, b = bigrams(a), bigrams(b)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


# ---------------------------------------------------------------- 時間
def now_tpe():
    return _dt.datetime.now(TPE)


def run_id(t=None):
    t = t or now_tpe()
    return t.strftime("R%Y%m%d-%H%M")


def families(algos):
    """資料驅動的家族清單（不寫死 A–F，新家族加入後自動納入）。"""
    return sorted({a["family"] for a in algos.values()})
