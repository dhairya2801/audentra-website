"""Check the synthetic 10k HTTP results against the independent provider ledger."""
import json
import sys
from collections import Counter
from pathlib import Path


def verify(directory):
    rows = json.loads((directory / 'results.json').read_text())
    ledger = json.loads((directory / 'ledger.json').read_text())
    expected = {f'VM report {i}' for i in range(10_000)}
    received = Counter((row['subject'], row['key']) for row in rows
                       if row.get('status') == 201 and row.get('state') == 'received' and row.get('key'))
    delivered = Counter((subject, key) for key, subject, posts in ledger if posts == 1)
    if (len(rows) != len(ledger) or len(rows) != len(expected) or received != delivered
            or {subject for subject, _ in received} != expected
            or len({key for _, key in received}) != len(expected)):
        raise SystemExit('FAIL: submission, receipt, Jira issue or Slack message mismatch')
    print(f'PASS: {len(expected)} distinct submissions, receipts, Jira issues and Slack messages')


if __name__ == '__main__':
    verify(Path(sys.argv[1]))
