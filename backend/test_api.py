import urllib.request, urllib.parse, json, sys
base='http://127.0.0.1:8000'
# login
login_data = urllib.parse.urlencode({'username':'admin','password':'admin123'}).encode()
req = urllib.request.Request(base+'/api/auth/login', data=login_data)
try:
    with urllib.request.urlopen(req) as r:
        res = json.load(r)
        token = res.get('access_token')
        print('TOKEN:', token[:10]+'...' if token else 'NO')
except Exception as e:
    print('Login failed:', e)
    sys.exit(1)
# get customers
req2 = urllib.request.Request(base+'/api/customers')
req2.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req2) as r:
        data = json.load(r)
        print('CUSTOMERS OK, count:', data.get('total'))
except Exception as e:
    print('Customers failed:', e)
# get purchases
req3 = urllib.request.Request(base+'/api/purchases')
req3.add_header('Authorization', f'Bearer {token}')
try:
    with urllib.request.urlopen(req3) as r:
        data = json.load(r)
        print('PURCHASES OK, count:', data.get('total'))
except Exception as e:
    print('Purchases failed:', e)
