#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "artifacts" / "supabase-convex-import-20261109-retry"
OUT = ROOT / "artifacts" / "supabase-convex-transformed"

def load(n):
    p = RAW / n / "documents.jsonl"
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []

def save(n, rows):
    d = OUT / n
    d.mkdir(parents=True, exist_ok=True)
    d.joinpath("documents.jsonl").write_text("\n".join(json.dumps(r) for r in rows)+"\n")
    print(f"  OK {n}: {len(rows)}")

def idx(rows):
    out = {}
    for r in rows:
        for k in ["_id","id","supabaseId"]:
            v = r.get(k)
            if v is not None:
                out[v] = r
    return out

A=idx(load("authors"))
B=idx(load("books"))
U=idx(load("users"))
G=idx(load("groups"))
P=idx(load("publishers"))

def res(key,m):
    if key is None:
        return key
    r = m.get(key) or m.get(str(key))
    return (r or {}).get("_id", key)

print("building id-maps ...")
save("authors",load("authors"))
save("books",load("books"))
save("users",load("users"))
save("groups",load("groups"))
save("publishers",load("publishers"))

FK = {"group_id":G,"user_id":U,"follower_id":U,"following_id":U,"book_id":B}

for tbl,cols in [
    ("group_members",["group_id","user_id"]),
    ("follows",["follower_id","following_id"]),
    ("reading_progress",["user_id","book_id"]),
    ("notifications",["user_id"]),
]:
    rows=load(tbl)
    out=[]
    for r in rows:
        m=dict(r)
        for c in cols:
            v=m.get(c)
            if v is not None:
                m[c]=res(v,FK.get(c,U))
        out.append(m)
    save(tbl,out)
    ch=sum(1 for a,b in zip(rows,out) if any(a.get(x)!=b.get(x) for x in cols))
    print(f"  updated {tbl}: {ch}/{len(rows)}")

print("done")
