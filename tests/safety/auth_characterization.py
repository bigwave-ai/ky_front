#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KY 프론트엔드 리팩토링 안전망 — 인증/인가 characterization.

호스트에서 실행(stdlib만, 라이브 프론트 localhost:23010 대상):
    python3 tests/safety/auth_characterization.py capture
    python3 tests/safety/auth_characterization.py verify

잠그는 계약(프론트 트랙 F1/F2가 건드리는 핵심):
  - 로그인(admin/member) status·응답구조·role
  - JWT(session-Info) 헤더 alg + 클레임 키셋 + role  (exp/iat 등 휘발값은 제외)
  - 인증 게이팅: 미인증 admin API 401, 멤버의 admin API/타고객 IDOR 403
  - 로그아웃 쿠키 삭제

verify 는 회귀 시 종료코드 1. 값이 아니라 status+구조+클레임키를 비교(라이브 데이터 허용).
"""
import sys
import os
import json
import base64
import urllib.request
import urllib.error
import http.cookiejar

HERE = os.path.dirname(os.path.abspath(__file__))
GOLDEN_DIR = os.path.join(HERE, "golden")
BASE = "http://localhost:23010"

ADMIN_ID, ADMIN_PW = "admin", base64.b64encode(b"admin").decode()
MEMBER_ID, MEMBER_PW = "(주) 유니켐", base64.b64encode(b"1234").decode()
MEMBER_CID = "7066135d-819d-5ffc-a1cf-9cea2f82b133"   # 유니켐(본인)
OTHER_CID = "0af43a3e-43e0-5342-bc46-97c2a00d94d9"    # 금창(타 고객 — IDOR 대상)


def _skeleton(obj):
    if isinstance(obj, dict):
        if not obj:
            return {}
        sub = {k: _skeleton(obj[k]) for k in obj}
        vals = list(sub.values())
        if len(sub) >= 5 and all(v == vals[0] for v in vals):
            return {"<dynamic>": vals[0]}
        return {k: sub[k] for k in sorted(sub.keys())}
    if isinstance(obj, list):
        return [] if not obj else [_skeleton(obj[0])]
    if isinstance(obj, bool):
        return "bool"
    if isinstance(obj, int):
        return "int"
    if isinstance(obj, float):
        return "float"
    if obj is None:
        return "null"
    return "str"


def _new_session():
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    return opener, jar


def _req(opener, method, path, body=None):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = opener.open(req, timeout=20)
        raw = resp.read().decode("utf-8", "replace")
        status = resp.getcode()
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        status = e.code
    except Exception as e:  # noqa: BLE001
        return {"status": "EXC", "structure": "%s: %s" % (type(e).__name__, e)}, None
    try:
        parsed = json.loads(raw)
        struct = _skeleton(parsed)
    except Exception:  # noqa: BLE001
        parsed, struct = None, "<non-json>"
    return {"status": status, "structure": struct}, parsed


def _cookie_value(jar, name="session-Info"):
    for c in jar:
        if c.name == name:
            return c.value
    return None


def _decode_jwt(token):
    """서명검증 없이 헤더 alg + 클레임 키셋 + role 만 추출(계약 잠금용)."""
    if not token or token.count(".") != 2:
        return {"present": False}
    h, p, _ = token.split(".")

    def b64u(s):
        s += "=" * (-len(s) % 4)
        return json.loads(base64.urlsafe_b64decode(s).decode("utf-8", "replace"))

    try:
        header = b64u(h)
        payload = b64u(p)
        return {
            "present": True,
            "alg": header.get("alg"),
            "claim_keys": sorted(payload.keys()),
            "role": payload.get("role"),
            "has_plant_code": "plant_code" in payload,
        }
    except Exception as e:  # noqa: BLE001
        return {"present": True, "error": str(e)}


def run_all():
    out = {}

    # 1) admin 로그인
    admin_op, admin_jar = _new_session()
    res, body = _req(admin_op, "POST", "/api/auth/signin", {"id": ADMIN_ID, "pw": ADMIN_PW})
    role = (body or {}).get("data", {}).get("role") if body else None
    out["admin_login"] = {"status": res["status"], "structure": res["structure"], "role": role,
                          "jwt": _decode_jwt(_cookie_value(admin_jar))}

    # 2) admin → getCustomers (인증)
    res, _ = _req(admin_op, "GET", "/api/admin/getCustomers")
    out["admin_get_customers"] = res

    # 3) 미인증 → getCustomers (401 기대)
    noauth_op, _ = _new_session()
    res, _ = _req(noauth_op, "GET", "/api/admin/getCustomers")
    out["noauth_get_customers"] = {"status": res["status"]}

    # 4) member 로그인
    mem_op, mem_jar = _new_session()
    res, body = _req(mem_op, "POST", "/api/auth/signin", {"id": MEMBER_ID, "pw": MEMBER_PW})
    role = (body or {}).get("data", {}).get("role") if body else None
    out["member_login"] = {"status": res["status"], "structure": res["structure"], "role": role,
                           "jwt": _decode_jwt(_cookie_value(mem_jar))}

    # 5) member → 본인 고객 장비 (200 기대)
    res, _ = _req(mem_op, "GET", "/api/member/getDevices?customerId=%s" % MEMBER_CID)
    out["member_get_own_devices"] = res

    # 6) member → 타 고객 장비 IDOR (403 기대)
    res, _ = _req(mem_op, "GET", "/api/member/getDevices?customerId=%s" % OTHER_CID)
    out["member_idor_other_devices"] = {"status": res["status"]}

    # 7) member → admin API (403 기대)
    res, _ = _req(mem_op, "GET", "/api/admin/getCustomers")
    out["member_access_admin_api"] = {"status": res["status"]}

    # 8) 로그아웃
    res, _ = _req(mem_op, "POST", "/api/auth/deleteCookies")
    out["logout"] = {"status": res["status"]}

    return out


def _save(name, data):
    os.makedirs(GOLDEN_DIR, exist_ok=True)
    with open(os.path.join(GOLDEN_DIR, name + ".json"), "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)


def _load(name):
    with open(os.path.join(GOLDEN_DIR, name + ".json")) as f:
        return json.load(f)


def do_capture():
    res = run_all()
    _save("auth", res)
    print("[capture] 프론트 인증 골든 저장 →", GOLDEN_DIR)
    for k, v in res.items():
        extra = ""
        if "role" in v:
            extra = " role=%s jwt_alg=%s claims=%s" % (v.get("role"), v.get("jwt", {}).get("alg"), v.get("jwt", {}).get("claim_keys"))
        print("  %-26s status=%s%s" % (k, v.get("status"), extra))


def do_verify():
    try:
        golden = _load("auth")
    except FileNotFoundError:
        print("[verify] 골든 없음 — capture 먼저"); sys.exit(2)
    current = run_all()
    diffs = []
    for k in set(list(golden.keys()) + list(current.keys())):
        if golden.get(k) != current.get(k):
            diffs.append("  %s:\n    golden=%r\n    now   =%r" % (k, golden.get(k), current.get(k)))
    if diffs:
        print("[verify] ❌ 회귀 감지 — 불일치 %d건:" % len(diffs))
        for d in diffs:
            print(d)
        sys.exit(1)
    print("[verify] ✅ 프론트 인증 전체 PASS (회귀 없음)")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "verify"
    if mode == "capture":
        do_capture()
    elif mode == "verify":
        do_verify()
    else:
        print("usage: auth_characterization.py [capture|verify]"); sys.exit(2)
