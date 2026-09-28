"""用遠端分支 wf-lock 當作排程工作流程的鎖，避免兩次執行重疊。

python tools/wf_lock.py acquire RUN   取得鎖（成功 exit 0；被占用 exit 1 並印出持有者）
python tools/wf_lock.py release       釋放鎖（刪除遠端分支）
python tools/wf_lock.py status        顯示目前狀態
鎖超過 config 的 lock_stale_minutes（預設 170 分鐘）視為前次執行當掉，可以接手。
只用 git plumbing 建 orphan commit，不會動到工作目錄或 main。
"""
import datetime as dt
import json
import subprocess
import sys

from wf_common import ROOT, config, now_tpe

CFG = config()
BR = CFG.get("lock_branch", "wf-lock")
REF = f"refs/heads/{BR}"


def git(*args, inp=None, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, input=inp, capture_output=True, text=True, encoding="utf-8")
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 失敗：{r.stderr.strip()}")
    return r


def remote_lock():
    r = git("ls-remote", "origin", REF)
    if not r.stdout.strip():
        return None
    git("fetch", "--depth=1", "origin", f"+{REF}:refs/remotes/origin/{BR}")
    body = git("show", f"refs/remotes/origin/{BR}:lock.json").stdout
    return json.loads(body)


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
        info = remote_lock()
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
