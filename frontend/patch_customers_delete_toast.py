from pathlib import Path
p=Path('src/pages/Customers.jsx')
s=p.read_text()
old="    } catch {\n      toast.error('Failed to delete')\n    } finally {"
new="    } catch (err) {\n      toast.error(err.response?.data?.detail || 'Failed to delete')\n    } finally {"
if old in s:
    s=s.replace(old,new)
    p.write_text(s)
    print('Patched Customers.jsx')
else:
    print('Pattern not found')
