"""把資料裡跟特定課程週次、課堂流程有關的字句改寫成通用說法。

用法：python tools/sanitize.py        （直接改寫 data/*.json）
      python tools/sanitize.py --check（只列出還殘留的字句）
"""
import glob
import json
import re
import sys

RULES = [
    (r"W3 現場帶讀但不建議從零帶", "建議先讀懂再修改，不建議從零寫"),
    (r"W3 現場從零帶寫", "適合從零實作"),
    (r"W3 現場帶寫的第一個範例", "適合作為第一個從零實作的範例"),
    (r"W3 開場暖身", "適合當暖身練習"),
    (r"W3 (現場)?帶寫", "適合從零實作"),
    (r"先回顧 W1", "先回顧 C# 基礎"),
    (r"W1 程度", "C# 基礎程度"),
    (r"W[0-9] ?", ""),
    (r"課堂 ?C# ?範例", "基礎 C# 範例"),
    (r"課堂 ?C#", "基礎範例的 C#"),
    (r"課堂展示", "展示"),
    (r"課堂中", ""),
    (r"課堂範例", "基礎範例"),
    (r"課堂", "基礎範例"),
    (r"學生自學", "自學"),
    (r"學生自寫", "自寫"),
    (r"學生", "學習者"),
    (r"同學", "學習者"),
    (r"老師", "講者"),
    (r"期末報告", "研究報告"),
    (r"期末", ""),
    (r"上課", "學習"),
    # 接縫與課程專屬用語
    (r"(非常|很)?適合 適合", r"\1適合"),
    (r"^適合 建議先讀懂", "建議先讀懂"),
    (r"不建議從零寫寫", "不建議從零寫"),
    (r"帶寫時", "實作時"),
    (r"現場只帶寫", "只從零寫"),
    (r"現場(建議|可只改|效果)", r"\1"),
    (r"可以現場把", "可以把"),
    (r"建議在 (C05) 之後帶", r"建議在 \1 之後學"),
    (r"先帶不含", "先寫不含"),
    (r"教學效果", "學習效果"),
    (r"教學點", "學習重點"),
    (r"先回顧 C# 基礎 懸垂鏈", "先寫一條一維懸垂鏈"),
    (r"和 懸垂鏈的", "和懸垂鏈粒子系統的"),
    (r"^懸垂鏈範例$", "粒子系統（力 → 速度 → 位置）"),
    (r"^懸垂鏈（", "粒子系統（"),
    (r"（[0-9]-[0-9]）", ""),
    (r"基礎範例建議", "建議"),
]
LEFT = re.compile(r"W[0-9]|課堂|期末|老師|學生|上課|同學|帶寫|現場|適合 適合|（[0-9]-[0-9]）|懸垂鏈")


def fix(s):
    for a, b in RULES:
        s = re.sub(a, b, s)
    return s


def walk(o, fn):
    if isinstance(o, dict):
        return {k: walk(v, fn) for k, v in o.items()}
    if isinstance(o, list):
        return [walk(v, fn) for v in o]
    if isinstance(o, str):
        return fn(o)
    return o


def main():
    check = "--check" in sys.argv
    left = []
    for f in sorted(glob.glob("data/*.json")):
        d = json.load(open(f, encoding="utf-8"))
        if not check:
            d = walk(d, fix)
            json.dump(d, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        walk(d, lambda s: left.append((f, s)) or s if LEFT.search(s) else s)
    for f, s in left:
        print(f, "|", s[:80])
    print("殘留", len(left))


if __name__ == "__main__":
    main()
