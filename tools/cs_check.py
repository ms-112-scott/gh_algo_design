"""檢查 Grasshopper C# 元件檔：用本機 Rhino 8 的 DLL 編譯＋格式檢查（多個 agent 同時執行也安全）。

python tools/cs_check.py FILE.cs ...     檢查指定檔案
python tools/cs_check.py --all           檢查 comp_codes/ 下全部 .cs
python tools/cs_check.py --no-compile …  只做格式檢查

編譯：VS Build Tools 的 Roslyn csc，以 C# 7.3 語法對 .NET Framework 4.8.1 參考組件＋RhinoCommon／Grasshopper 編成 library
（Rhino 8 不論用 .NET Framework 或 .NET 7 執行都能跑；輸出到 _tmp_cs/check/，不會加進 git）。
Script Editor 會自動產生的成員（InvokeRunScript、Print、Reflect…）由 SHIM 補上。找不到 csc 或 Rhino 8 時只做格式檢查並提示。
格式（對照 115-1_演算法設計/04_程式碼/C#_gh_comp_base_template.cs 與 W3 課堂完成版）：
  錯誤：第一行不是「// Grasshopper Script Instance」、缺範本的 using、缺 #region Usings／#region Notes、
        類別不是 Script_Instance : GH_ScriptInstance、沒有 RunScript、缺「// ===== 0. 防呆」「1. DATA」「4. OUTPUT」段落、
        檔頭沒有 輸入／輸出／規則、有疑似簡體字
  警告：超過 350 行、沒有 INIT／LOOP 段落（直接公式類可忽略）、會 bake 到 Rhino 文件、Tab 縮排
每個檔案印一行 OK／FAIL（下面接錯誤明細）；最後一行是摘要 JSON。有 FAIL 時 exit 1。
"""
import json
import os
import pathlib
import re
import subprocess
import sys

from wf_common import ROOT

CSC = os.environ.get("CSC_PATH", r"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe")
REF = pathlib.Path(r"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8.1")
RH = pathlib.Path(os.environ.get("RHINO_SYSTEM", r"C:\Program Files\Rhino 8\System"))
GH = pathlib.Path(os.environ.get("RHINO_GH", r"C:\Program Files\Rhino 8\Plug-ins\Grasshopper"))
OUTDIR = ROOT / "_tmp_cs" / "check"
REFS = [REF / "mscorlib.dll", REF / "System.dll", REF / "System.Core.dll", REF / "System.Drawing.dll",
        REF / "System.Windows.Forms.dll", REF / "System.Xml.dll", REF / "Facades" / "netstandard.dll",
        REF / "Facades" / "System.Runtime.dll", RH / "RhinoCommon.dll", RH / "Eto.dll",
        GH / "Grasshopper.dll", GH / "GH_IO.dll"]
USINGS = ["using System;", "using System.Linq;", "using System.Collections;", "using System.Collections.Generic;",
          "using System.Drawing;", "using Rhino;", "using Rhino.Geometry;", "using Grasshopper;",
          "using Grasshopper.Kernel;", "using Grasshopper.Kernel.Data;", "using Grasshopper.Kernel.Types;"]

try:
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from zhcheck import check_text
except SystemExit:          # 沒裝 opencc
    check_text = None


def can_compile():
    return pathlib.Path(CSC).exists() and all(p.exists() for p in REFS)


SHIM = """using System.Collections.Generic;
using Grasshopper.Kernel;
public partial class Script_Instance
{
    // Script Editor 產生的成員（範本 #region Notes 列出的那些）
    public override void InvokeRunScript(IGH_Component owner, object rhinoDocument, int iteration, List<object> inputs, IGH_DataAccess DA) { }
    Rhino.RhinoDoc RhinoDocument { get { return null; } }
    GH_Document GrasshopperDocument { get { return null; } }
    IGH_Component Component { get { return null; } }
    int Iteration { get { return 0; } }
    void Print(string text) { }
    void Print(string format, params object[] args) { }
    void Reflect(object obj) { }
    void Reflect(object obj, string method_name) { }
}
"""


def compile_one(path):
    """Rhino 8 的 Script Editor 編譯時才產生 InvokeRunScript；這裡改成 partial 類別、另補一個空的覆寫，只檢查程式本身。"""
    OUTDIR.mkdir(parents=True, exist_ok=True)
    stem = re.sub(r"[^\w.-]", "_", path.stem)
    src = OUTDIR / (stem + ".src.cs")
    shim = OUTDIR / (stem + ".shim.cs")
    out = OUTDIR / (stem + ".dll")
    text = path.read_text(encoding="utf-8")
    patched, n = re.subn(r"public\s+class\s+Script_Instance\b", "public partial class Script_Instance", text, count=1)
    src.write_text(patched if n else text, encoding="utf-8")
    shim.write_text(SHIM, encoding="utf-8")
    cmd = [CSC, "-nologo", "-noconfig", "-nostdlib", "-target:library", "-langversion:7.3", "-warn:4",
           "-preferreduilang:en-US", "-nowarn:0169,0414,0649,1591", f"-out:{out}"] + [f"-r:{p}" for p in REFS]
    cmd += [str(src)] + ([str(shim)] if n else [])
    r = subprocess.run(cmd, capture_output=True)
    text = r.stdout.decode("utf-8", "replace") + r.stderr.decode("utf-8", "replace")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    errors = [ln for ln in lines if ": error " in ln]
    warns = [ln for ln in lines if ": warning " in ln and "shim.cs" not in ln]
    if r.returncode != 0 and not errors:
        errors = lines[:20] or [f"csc exit {r.returncode}"]
    short = lambda ln: re.sub(r"^.*?\((\d+),(\d+)\)", r"(\1,\2)", ln)
    return [short(e) for e in errors], [short(w) for w in warns]


def lint(path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    errors, warns = [], []
    first = next((ln for ln in lines if ln.strip()), "")
    if first.strip() != "// Grasshopper Script Instance":
        errors.append("第一行必須是「// Grasshopper Script Instance」（照範本）")
    for u in USINGS:
        if u not in text:
            errors.append(f"缺範本的 {u}")
    for need, msg in [("#region Usings", "缺 #region Usings"), ("#region Notes", "缺 #region Notes（照範本保留）"),
                      ("private void RunScript(", "缺 private void RunScript(")]:
        if need not in text:
            errors.append(msg)
    if not re.search(r"public\s+class\s+Script_Instance\s*:\s*GH_ScriptInstance", text):
        errors.append("類別必須是 public class Script_Instance : GH_ScriptInstance")
    for mark, msg in [(r"//\s*=====\s*0\.\s*防呆", "0. 防呆"), (r"//\s*=====\s*1\.\s*DATA", "1. DATA 資料"),
                      (r"//\s*=====\s*4\.\s*OUTPUT", "4. OUTPUT 輸出")]:
        if not re.search(mark, text):
            errors.append(f"缺段落標記「// ===== {msg} =====」")
    head = "\n".join(lines[:60])
    for word in ["輸入", "輸出", "規則"]:
        if not re.search(rf"^//\s*{word}", head, re.M):
            errors.append(f"檔頭缺「// {word}」區塊")
    if check_text:
        hits = check_text(text)
        if hits:
            errors.append("疑似簡體字：" + "、".join(sorted({f"{a}→{b}" for _, a, b in hits}))[:200])
    if len(lines) > 350:
        warns.append(f"{len(lines)} 行（建議 350 行內）")
    if not re.search(r"//\s*=====\s*2\.\s*INIT", text) or not re.search(r"//\s*=====\s*3\.", text):
        warns.append("沒有 2. INIT 或 3. LOOP 段落（直接公式類可忽略）")
    if re.search(r"\.Objects\.Add\w*\(|\.Bake\w*\(", text):
        warns.append("會把物件 bake 進 Rhino 文件；元件應只輸出幾何")
    if "\t" in text:
        warns.append("有 Tab，請改用 4 個空白")
    return errors, warns


def main():
    args = sys.argv[1:]
    no_compile = "--no-compile" in args
    args = [a for a in args if a != "--no-compile"]
    if not args:
        print(__doc__)
        return 2
    files = sorted((ROOT / "comp_codes").rglob("*.cs")) if args == ["--all"] else [pathlib.Path(a) for a in args]
    compile_ok = can_compile() and not no_compile
    if not no_compile and not compile_ok:
        print("注意：找不到 csc 或 Rhino 8 DLL，只做格式檢查")
    summary = {"ok": 0, "fail": 0, "compiled": compile_ok, "files": {}}
    for f in files:
        f = f if f.is_absolute() else (pathlib.Path.cwd() / f)
        if not f.exists():
            print(f"FAIL {f}：檔案不存在")
            summary["fail"] += 1
            summary["files"][str(f)] = "missing"
            continue
        errs, warns = lint(f)
        if compile_ok:
            ce, cw = compile_one(f)
            errs += ["編譯 " + e for e in ce]
            warns += ["編譯 " + w for w in cw]
        name = f.relative_to(ROOT).as_posix() if str(f).startswith(str(ROOT)) else str(f)
        if errs:
            summary["fail"] += 1
            summary["files"][name] = "fail"
            print(f"FAIL {name}（錯誤 {len(errs)}、警告 {len(warns)}）")
        else:
            summary["ok"] += 1
            summary["files"][name] = "ok"
            print(f"OK {name}（警告 {len(warns)}）")
        for e in errs:
            print(f"  錯誤 {e}")
        for w in warns[:15]:
            print(f"  警告 {w}")
    print(json.dumps(summary, ensure_ascii=False))
    return 1 if summary["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
