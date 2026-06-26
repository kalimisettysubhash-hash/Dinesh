from pathlib import Path
p=Path('app/api/customers.py')
s=p.read_text()
old='customer = db.query(Customer).filter(Customer.id == customer_id).first()'
new=('try:\n'
     "        cid = UUID(customer_id)\n"
     "    except Exception:\n"
     "        raise HTTPException(status_code=400, detail=\"Invalid customer id\")\n\n"
     "    customer = db.query(Customer).filter(Customer.id == cid).first()")
if old in s:
    s=s.replace(old,new)
    p.write_text(s)
    print('Patched')
else:
    print('Pattern not found')
