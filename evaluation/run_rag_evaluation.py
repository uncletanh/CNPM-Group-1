import json
import os
import sys
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4

ROOT = Path(__file__).resolve().parent
DATASET_PATH = ROOT / "rag_evaluation_50.json"


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def post_chat(api_url: str, workspace_id: str, widget_token: str, payload: dict) -> dict:
    request = Request(
        f"{api_url.rstrip('/')}/chat/{workspace_id}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Widget-Token": widget_token,
        },
        method="POST",
    )
    with urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def score_case(case: dict, response: dict) -> dict:
    answer = response.get("answer", "")
    normalized_answer = normalize(answer)
    sources = response.get("sources") or []
    actual_behavior = "answer" if response.get("context_chunks", 0) else "handoff"
    behavior_ok = actual_behavior == case["expected_behavior"]
    keywords_ok = all(normalize(keyword) in normalized_answer for keyword in case["required_keywords"])
    expected_source = case.get("expected_source")
    source_ok = (
        not expected_source
        if actual_behavior == "handoff"
        else any(source.get("source_filename") == expected_source for source in sources)
    )
    passed = behavior_ok and keywords_ok and source_ok
    return {
        "id": case["id"],
        "category": case["category"],
        "passed": passed,
        "behavior_ok": behavior_ok,
        "keywords_ok": keywords_ok,
        "source_ok": source_ok,
        "actual_behavior": actual_behavior,
        "answer": answer,
        "sources": sources,
    }


def main() -> int:
    api_url = os.getenv("NOVACHAT_API_URL", "").strip()
    workspace_id = os.getenv("EVAL_WORKSPACE_ID", "").strip()
    widget_token = os.getenv("EVAL_WIDGET_TOKEN", "").strip()
    if not api_url or not workspace_id or not widget_token:
        print("Thiếu NOVACHAT_API_URL, EVAL_WORKSPACE_ID hoặc EVAL_WIDGET_TOKEN.")
        return 2

    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    results = []
    try:
        for case in dataset["cases"]:
            session_key = f"eval-{case['id'].lower()}-{uuid4().hex[:8]}"
            for turn in case.get("conversation", []):
                if turn.get("role") == "user":
                    post_chat(
                        api_url,
                        workspace_id,
                        widget_token,
                        {"message": turn["content"], "session_key": session_key, "top_k": 3},
                    )
            response = post_chat(
                api_url,
                workspace_id,
                widget_token,
                {"message": case["question"], "session_key": session_key, "top_k": 3},
            )
            result = score_case(case, response)
            results.append(result)
            print(f"[{('PASS' if result['passed'] else 'FAIL')}] {case['id']} {case['category']}")
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"Không thể chạy evaluation: {exc}")
        return 2

    passed = sum(result["passed"] for result in results)
    report = {
        "dataset": dataset["dataset"],
        "passed": passed,
        "total": len(results),
        "results": results,
    }
    report_path = ROOT / "rag_evaluation_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nKết quả: {passed}/{len(results)}. Báo cáo: {report_path}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
