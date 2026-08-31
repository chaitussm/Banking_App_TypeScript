#!/usr/bin/env python3
"""Generate an HTML email report with per-module Playwright test counts and statuses."""

from __future__ import annotations

import html
import json
import os
from collections import OrderedDict
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class TestResult:
    module: str
    classname: str
    name: str
    status: str  # PASS, FAIL, SKIP
    duration: str
    message: str
    suite: str = ""


@dataclass
class ModuleStats:
    name: str
    total: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    tests: list[TestResult] = field(default_factory=list)

    def status_label(self) -> str:
        if self.failed > 0:
            return "FAILED"
        if self.skipped > 0 and self.passed == 0:
            return "SKIPPED"
        if self.skipped > 0:
            return "PASSED (with skips)"
        if self.passed > 0:
            return "PASSED"
        return "NO RESULTS"


MODULE_NAMES = OrderedDict(
    [
        ("auth.spec.ts", "Authentication"),
        ("banking-flows.spec.ts", "Core banking flows"),
        ("accounts.spec.ts", "Accounts"),
        ("dashboard.spec.ts", "Dashboard"),
        ("transactions.spec.ts", "Transactions"),
        ("transfers.spec.ts", "Transfers"),
        ("users.spec.ts", "Users"),
        ("unauthorized.spec.ts", "Unauthorized"),
    ]
)


def format_duration(ms) -> str:
    try:
        return f"{float(ms) / 1000:.3f}s"
    except (TypeError, ValueError):
        return "0.000s"


def module_from_file(file_name: str) -> str:
    base = Path(file_name or "").name
    if base in MODULE_NAMES:
        return MODULE_NAMES[base]
    if base.endswith(".spec.ts"):
        return base[: -len(".spec.ts")].replace("-", " ").title()
    return base or "Unknown"


def outcome_from_test(test: dict) -> tuple[str, str, str]:
    expected = test.get("expectedStatus") or "passed"
    results = test.get("results") or []
    last = results[-1] if results else {}
    raw = test.get("status") or last.get("status") or "unknown"
    duration = format_duration(last.get("duration", 0))
    errors = last.get("errors") or []
    message = "—"
    if errors:
        first = errors[0]
        if isinstance(first, dict):
            message = (first.get("message") or first.get("error", {}).get("message") or str(first)).strip()
        else:
            message = str(first).strip()
        message = " ".join(message.split())
        if len(message) > 500:
            message = message[:500] + "…"

    if raw in ("skipped", "skipped") or expected == "skipped":
        return "SKIP", duration, message if message != "—" else "Skipped"
    if raw in ("unexpected", "failed", "timedOut", "interrupted"):
        return "FAIL", duration, message
    if raw in ("flaky",):
        return "PASS", duration, "Flaky (passed on retry)"
    if raw in ("expected", "passed"):
        return "PASS", duration, message
    if last.get("status") == "skipped":
        return "SKIP", duration, message if message != "—" else "Skipped"
    if last.get("status") in ("failed", "timedOut", "interrupted"):
        return "FAIL", duration, message
    return "PASS", duration, message


def walk_suites(suites: list[dict], file_name: str = "", suite_title: str = "") -> list[TestResult]:
    results: list[TestResult] = []
    for suite in suites or []:
        current_file = suite.get("file") or file_name
        current_suite = suite.get("title") or suite_title
        for spec in suite.get("specs") or []:
            spec_file = spec.get("file") or current_file
            module = module_from_file(spec_file)
            title = spec.get("title") or "(unnamed)"
            tests = spec.get("tests") or [{}]
            test = tests[0]
            status, duration, message = outcome_from_test(test)
            results.append(
                TestResult(
                    module=module,
                    classname=current_suite or Path(spec_file).name,
                    name=title,
                    status=status,
                    duration=duration,
                    message=message,
                    suite=current_suite,
                )
            )
        results.extend(walk_suites(suite.get("suites") or [], current_file, current_suite))
    return results


def parse_playwright_json(path: Path) -> list[TestResult]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [
            TestResult(
                module="Parse Error",
                classname=path.name,
                name="(parse failed)",
                status="FAIL",
                duration="0.000s",
                message=str(exc),
            )
        ]
    return walk_suites(data.get("suites") or [])


def build_module_stats(results: list[TestResult]) -> OrderedDict[str, ModuleStats]:
    stats: OrderedDict[str, ModuleStats] = OrderedDict()
    for name in MODULE_NAMES.values():
        stats[name] = ModuleStats(name=name)

    for result in results:
        module = result.module
        if module not in stats:
            stats[module] = ModuleStats(name=module)
        bucket = stats[module]
        bucket.total += 1
        bucket.tests.append(result)
        if result.status == "FAIL":
            bucket.failed += 1
        elif result.status == "SKIP":
            bucket.skipped += 1
        else:
            bucket.passed += 1

    return OrderedDict((k, v) for k, v in stats.items() if v.total > 0)


def status_badge(status: str) -> str:
    colors = {
        "PASS": "#27ae60",
        "PASSED": "#27ae60",
        "PASSED (with skips)": "#27ae60",
        "FAIL": "#e74c3c",
        "FAILED": "#e74c3c",
        "SKIP": "#f39c12",
        "SKIPPED": "#f39c12",
        "NO RESULTS": "#7f8c8d",
    }
    color = colors.get(status, "#7f8c8d")
    return (
        f'<span style="display:inline-block;padding:4px 10px;border-radius:999px;'
        f'color:#fff;background:{color};font-weight:bold;">{html.escape(status)}</span>'
    )


def render_html(
    modules: OrderedDict[str, ModuleStats],
    results: list[TestResult],
    job_status: str,
    branch: str,
    sha: str,
    run_url: str,
) -> str:
    total = passed = failed = skipped = 0
    for mod in modules.values():
        total += mod.total
        passed += mod.passed
        failed += mod.failed
        skipped += mod.skipped

    banner_color = "#27ae60" if job_status == "success" and failed == 0 else "#e74c3c"
    artifacts_url = run_url + "#artifacts"

    module_rows = []
    for mod in modules.values():
        module_rows.append(
            "<tr>"
            f"<td><strong>{html.escape(mod.name)}</strong></td>"
            f'<td style="text-align:center;">{mod.total}</td>'
            f'<td style="text-align:center;color:#27ae60;font-weight:bold;">{mod.passed}</td>'
            f'<td style="text-align:center;color:#e74c3c;font-weight:bold;">{mod.failed}</td>'
            f'<td style="text-align:center;color:#f39c12;font-weight:bold;">{mod.skipped}</td>'
            f'<td style="text-align:center;">{status_badge(mod.status_label())}</td>'
            "</tr>"
        )
    if not module_rows:
        module_rows.append('<tr><td colspan="6">No test results found.</td></tr>')

    detail_rows = []
    for result in results:
        detail_rows.append(
            "<tr>"
            f"<td>{html.escape(result.module)}</td>"
            f"<td>{html.escape(result.classname)}</td>"
            f"<td>{html.escape(result.name)}</td>"
            f'<td style="text-align:center;">{status_badge(result.status)}</td>'
            f'<td style="text-align:right;">{html.escape(result.duration)}</td>'
            f'<td style="max-width:460px;white-space:pre-wrap;word-break:break-word;">'
            f"{html.escape(result.message)}</td>"
            "</tr>"
        )
    if not detail_rows:
        detail_rows.append('<tr><td colspan="6">No test results found.</td></tr>')

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Playwright Report</title>
</head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f4f4f4">
  <div style="max-width:1200px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15)">
    <div style="background:{banner_color};color:#fff;padding:20px 30px">
      <h2 style="margin:0">Playwright E2E Pipeline Report</h2>
      <p style="margin:4px 0 0">Status: <strong>{html.escape(job_status.upper())}</strong></p>
    </div>
    <div style="padding:20px 30px">
      <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
        <tr>
          <td style="padding:8px 16px;background:#ecf0f1"><strong>Branch</strong></td>
          <td style="padding:8px 16px">{html.escape(branch)}</td>
          <td style="padding:8px 16px;background:#ecf0f1"><strong>Commit</strong></td>
          <td style="padding:8px 16px">{html.escape(sha[:8])}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;background:#ecf0f1"><strong>Total Test Cases</strong></td>
          <td style="padding:8px 16px">{total}</td>
          <td style="padding:8px 16px;background:#ecf0f1"><strong>Passed / Failed / Skipped</strong></td>
          <td style="padding:8px 16px">
            <span style="color:#27ae60">{passed}</span> /
            <span style="color:#e74c3c">{failed}</span> /
            <span style="color:#f39c12">{skipped}</span>
          </td>
        </tr>
      </table>

      <h3 style="margin:0 0 10px">Module Summary</h3>
      <p style="margin:0 0 12px;color:#555">Module name — number of test cases — passed / failed / skipped</p>
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;width:100%;font-size:13px;border-color:#d0d7de;margin-bottom:28px;">
        <thead style="background:#2c3e50;color:#fff;text-align:left;">
          <tr>
            <th>Module</th>
            <th style="text-align:center;">Test Cases</th>
            <th style="text-align:center;">Passed</th>
            <th style="text-align:center;">Failed</th>
            <th style="text-align:center;">Skipped</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          {''.join(module_rows)}
        </tbody>
      </table>

      <h3 style="margin:0 0 10px">All Test Cases</h3>
      <table border="1" cellpadding="8" cellspacing="0"
             style="border-collapse:collapse;width:100%;font-size:13px;border-color:#d0d7de;">
        <thead style="background:#2c3e50;color:#fff;text-align:left;">
          <tr>
            <th>Module</th>
            <th>Class</th>
            <th>Test Case</th>
            <th style="text-align:center;">Status</th>
            <th style="text-align:right;">Time</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {''.join(detail_rows)}
        </tbody>
      </table>
      <p style="margin-top:20px">
        <a href="{html.escape(run_url)}" style="background:#2c3e50;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">
          View Full Run
        </a>
        &nbsp;
        <a href="{html.escape(artifacts_url)}" style="background:#2980b9;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">
          Download Reports
        </a>
      </p>
    </div>
  </div>
</body>
</html>"""


def write_github_step_summary(summary: dict) -> None:
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not step_summary:
        return
    lines = [
        "## Module test summary",
        "",
        "| Module | Test Cases | Passed | Failed | Skipped | Status |",
        "| --- | ---: | ---: | ---: | ---: | --- |",
    ]
    for name, stats in summary["modules"].items():
        lines.append(
            f"| {name} | {stats['total']} | {stats['passed']} | {stats['failed']} | "
            f"{stats['skipped']} | {stats['status']} |"
        )
    lines.extend(
        [
            "",
            f"**Total:** {summary['total']}  |  **Passed:** {summary['passed']}  |  "
            f"**Failed:** {summary['failed']}  |  **Skipped:** {summary['skipped']}",
        ]
    )
    with Path(step_summary).open("a", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")


def generate_report(workspace: Path | None = None, output_path: Path | None = None) -> dict:
    workspace = workspace or Path.cwd()
    output_path = output_path or workspace / "email-report.html"

    results = parse_playwright_json(workspace / "playwright-report.json")
    modules = build_module_stats(results)

    job_status = os.environ.get("JOB_STATUS", "unknown")
    branch = os.environ.get("BRANCH", "")
    sha = os.environ.get("SHA", "")
    run_url = os.environ.get("RUN_URL", "#")

    report_html = render_html(modules, results, job_status, branch, sha, run_url)
    output_path.write_text(report_html, encoding="utf-8")

    summary = {
        "modules": {
            name: {
                "total": mod.total,
                "passed": mod.passed,
                "failed": mod.failed,
                "skipped": mod.skipped,
                "status": mod.status_label(),
            }
            for name, mod in modules.items()
        },
        "total": sum(m.total for m in modules.values()),
        "passed": sum(m.passed for m in modules.values()),
        "failed": sum(m.failed for m in modules.values()),
        "skipped": sum(m.skipped for m in modules.values()),
        "output": str(output_path),
    }
    write_github_step_summary(summary)
    return summary


def main() -> None:
    summary = generate_report()
    print("email-report.html written successfully.")
    print(
        f"Total test cases: {summary['total']} "
        f"(passed={summary['passed']}, failed={summary['failed']}, skipped={summary['skipped']})"
    )
    print("Module name - number of test cases - passed / failed / skipped")
    for name, stats in summary["modules"].items():
        print(
            f"  {name} - {stats['total']} - "
            f"passed {stats['passed']} / failed {stats['failed']} / skipped {stats['skipped']} "
            f"[{stats['status']}]"
        )


if __name__ == "__main__":
    main()
