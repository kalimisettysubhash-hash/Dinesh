from pathlib import Path
p=Path('app/api/customers.py')
s=p.read_text()
old='    customer = db.query(Customer).filter(Customer.id == cid).first()\n    if not customer:\n        raise HTTPException(status_code=404, detail="Customer not found")\n    db.delete(customer)\n    db.commit()'
new='    customer = db.query(Customer).filter(Customer.id == cid).first()\n    if not customer:\n        raise HTTPException(status_code=404, detail="Customer not found")\n    try:\n        db.delete(customer)\n        db.commit()\n    except Exception as e:\n        db.rollback()\n        raise HTTPException(status_code=500, detail=str(e))'
if old in s:
    s=s.replace(old,new)
    p.write_text(s)
    print('Patched delete')
else:
    print('Pattern not found')
