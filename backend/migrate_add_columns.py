import sqlite3
from pathlib import Path

DB = Path(__file__).parent / 'tanvicrm.db'
if not DB.exists():
    print('Database not found:', DB)
    raise SystemExit(1)

conn = sqlite3.connect(str(DB))
cur = conn.cursor()

def has_column(table, column):
    cur.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    return column in cols

changes = []
# customers.notes
if not has_column('customers', 'notes'):
    cur.execute("ALTER TABLE customers ADD COLUMN notes TEXT DEFAULT ''")
    changes.append('customers.notes')
# customers.updated_at
if not has_column('customers', 'updated_at'):
    cur.execute("ALTER TABLE customers ADD COLUMN updated_at DATETIME")
    changes.append('customers.updated_at')
# purchases.updated_at
if not has_column('purchases', 'updated_at'):
    cur.execute("ALTER TABLE purchases ADD COLUMN updated_at DATETIME")
    changes.append('purchases.updated_at')

conn.commit()
conn.close()

if changes:
    print('Added columns:', ', '.join(changes))
else:
    print('No changes needed')
