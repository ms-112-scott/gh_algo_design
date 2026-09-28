"""用遠端分支 wf-lock 當作排程工作流程的鎖，避免兩次執行重疊。

python tools/wf_lock.py acquire RUN [--wait 分鐘]   取得鎖（成功 exit 0；被占用 exit 1 並印出持有者）
python tools/wf_lock.py release       釋放鎖（刪除遠端分支）
python tools/wf_lock.py status        顯示目前狀態
鎖超過 config 的 lock_stale_minutes（預設 170 分鐘）視為前次執行當掉，可以接手。
只用 git plumbing 建 orphan commit，不會動到工作目錄或 main。
"""
import datetime as dt
import json
import subprocess
import sys
import time

from wf_common import ROOT, config, now_tpe

CFG = config()
BR = CFG.get("lock_branch", "wf-lock")
REF = f"refs/heads/{BR}"


def git(*args, inp=None, check=True):
    # 一律用 bytes 傳給 git：Windows 的文字模式會把 \n 換成 \r\n，mktree 的檔名就會多出 \r
    data = inp.encode("utf-8") if isinstance(inp, str) else inp
    r = subprocess.run(["git", *args], cwd=ROOT, input=data, capture_output=True)
    r.stdout = r.stdout.decode("utf-8", "replace")
    r.stderr = r.stderr.decode("utf-8", "replace")
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 失敗：{r.stderr.strip()}")
    return r


def remote_lock():
    r = git("ls-remote", "origin", REF)
    if not r.stdout.strip():
        return None
    git("fetch", "--depth=1", "origin", f"+{REF}:refs/remotes/origin/{BR}")
    # 找名稱以 lock.json 開頭的檔案（相容舊版在 Windows 產生的「lock.json\r」）
    for entry in git("ls-tree", "-z", f"refs/remotes/origin/{BR}").stdout.split("\0"):
        if not entry:
            continue
        meta, name = entry.split("\t", 1)
        if name.strip().startswith("lock.json"):
            return json.loads(git("cat-file", "blob", meta.split()[2]).stdout)
    # 讀不到內容：用 commit 時間與訊息推回持有者
    t = git("log", "-1", "--format=%cI%n%s", f"refs/remotes/origin/{BR}").stdout.split("\n")
    utc = dt.datetime.fromisoformat(t[0]).astimezone(dt.timezone.utc).isoformat(timespec="seconds")
    return {"run": t[1].replace("wf lock ", ""), "taipei": t[0], "utc": utc}


def age_minutes(info):
    t = dt.datetime.fromisoformat(info["utc"])
    return (dt.datetime.now(dt.timezone.utc) - t).total_seconds() / 60


def push_lock(run):
    info = {"run": run, "taipei": now_tpe().isoformat(timespec="seconds"),
            "utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")}
    blob = git("hash-object", "-w", "--stdin", inp=json.dumps(info, ensure_ascii=False)).stdout.strip()
    tree = git("mktree", inp=f"100644 blob {blob}\tlock.json\n").stdout.strip()
    commit = git("commit-tree", tree, "-m", f"wf lock {run}").stdout.strip()
    r = git("push", "origin", f"{commit}:{REF}", check=False)
    return r.returncode == 0, info


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        info = remote_lock()
        print("未上鎖" if not info else f"上鎖中：{info['run']}（{info['taipei']}，{age_minutes(info):.0f} 分鐘前）")
    elif cmd == "acquire":
        run = sys.argv[2]
        # --wait N：鎖被占用時每 60 秒重試，最多等 N 分鐘（單次指令請 ≤ 9，避免超過工具逾時；需要更久就重複呼叫）
        wait = float(sys.argv[sys.argv.index("--wait") + 1]) if "--wait" in sys.argv else 0
        deadline = time.time() + wait * 60
        while True:
            info = remote_lock()
            if not info or age_minutes(info) >= CFG.get("lock_stale_minutes", 170) or time.time() >= deadline:
                break
            time.sleep(60)
        if info:
            age = age_minutes(info)
            if age < CFG.get("lock_stale_minutes", 170):
                print(f"LOCKED 被 {info['run']} 占用（{age:.0f} 分鐘前）")
                sys.exit(1)
            print(f"前次的鎖 {info['run']} 已過期（{age:.0f} 分鐘），接手")
            git("push", "origin", "--delete", BR, check=False)
        ok, info = push_lock(run)
        if not ok:
            print("LOCKED 取得鎖時被搶先")
            sys.exit(1)
        print(f"ACQUIRED {run}")
    elif cmd == "release":
        r = git("push", "origin", "--delete", BR, check=False)
        print("RELEASED" if r.returncode == 0 else f"釋放時沒有找到鎖：{r.stderr.strip()[:120]}")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
