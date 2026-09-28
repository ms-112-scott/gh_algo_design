"""簡體字檢查（只回報、不修改）。

python tools/zhcheck.py --all        檢查全部 data/*.json
python tools/zhcheck.py --new RUN    只檢查 _workflow/stage/RUN/ 的暫存檔
python tools/zhcheck.py FILE ...     檢查指定的 JSON 檔
需要：pip install opencc-python-reimplemented
用 OpenCC s2tw 轉換，會被改變的字元就可能是簡體字；台灣常用、兩岸共用而會被誤判的字列在 ALLOW。
有疑似簡體字時 exit code 1。
"""
import json
import pathlib
import sys

from wf_common import DATA, WF

try:
    from opencc import OpenCC
except ImportError:
    print("缺少 opencc：pip install opencc-python-reimplemented")
    sys.exit(2)

CC = OpenCC("s2tw")
ALLOW = set("台里岩污游干准采范占斗划咸朴吁丑凶涂后余")  # 台灣正體也通用、OpenCC 卻會轉換的字


def walk(obj, path=""):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("url", "license_url", "page", "file"):
                continue
            yield from walk(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk(v, f"{path}[{i}]")


_memo = {}


def conv(ch):
    if ch not in _memo:
        _memo[ch] = CC.convert(ch)
    return _memo[ch]


def check_text(s):
    """逐字轉換（不用詞組轉換，避免「家具→傢俱」這類詞彙差異被當成簡體字）。"""
    return [(i, ch, conv(ch)) for i, ch in enumerate(s)
            if "\u4e00" <= ch <= "\u9fff" and ch not in ALLOW and conv(ch) != ch]


def check_file(p):
    hits = []
    doc = json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
    for path, s in walk(doc):
        for i, a, b in check_text(s):
            hits.append(f"{pathlib.Path(p).name} {path}：「{a}」→「{b}」…{s[max(0, i - 8):i + 8]}…")
    return hits


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    if args[0] == "--all":
        files = sorted(DATA.glob("*.json"))
    elif args[0] == "--new":
        files = sorted(p for p in (WF / "stage" / args[1]).glob("*.json") if not p.name.startswith("_"))
    else:
        files = [pathlib.Path(a) for a in args]
    hits = []
    for f in files:
        hits += check_file(f)
    for h in hits:
        print(h)
    print(f"檢查 {len(files)} 個檔案，疑似簡體字 {len(hits)} 處")
    sys.exit(1 if hits else 0)


if __name__ == "__main__":
    main()
