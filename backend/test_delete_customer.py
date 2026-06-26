import urllib.request, urllib.parse, json, sys
base='http://127.0.0.1:8000'
# login
login_data = urllib.parse.urlencode({'username':'admin','password':'admin123'}).encode()
req = urllib.request.Request(base+'/api/auth/login', data=login_data)
try:
    with urllib.request.urlopen(req) as r:
        res = json.load(r)
        token = res.get('access_token')
        print('TOKEN OK')
except Exception as e:
    print('Login failed:', e)
    sys.exit(1)
# list customers
req2 = urllib.request.Request(base+'/api/customers')
req2.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req2) as r:
        data = json.load(r)
        print('CUSTOMERS:', data.get('total'))
        if data.get('total') == 0:
            print('No customers to delete')
            sys.exit(0)
        cid = data['data'][0]['id']
        print('Deleting customer id', cid)
except Exception as e:
    print('List failed:', e)
    try:
        print(e.read().decode())
    except Exception:
        pass
    sys.exit(1)
# delete
req3 = urllib.request.Request(base+f'/api/customers/{cid}', method='DELETE')
req3.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req3) as r:
        print('Delete response code', r.getcode())
except Exception as e:
    print('Delete failed:', e)
    try:
        print(e.read().decode())
    except Exception:
        pass
    sys.exit(1)
# verify
req4 = urllib.request.Request(base+f'/api/customers/{cid}')
req4.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req4) as r:
        print('Customer still exists, status', r.getcode())
except Exception as e:
    print('Verify after delete:', e)
    try:
        print(e.read().decode())
    except Exception:
        pass
