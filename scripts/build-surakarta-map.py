"""Ekstrak batas 7 kabupaten/kota Karesidenan Surakarta -> SVG path (TypeScript)."""
import json, math

SRC = 'all_kabkota.geojson'

# nama di geojson -> (id, label tampil)
WANT = {
    'BOYOLALI':       ('BOYOLALI',    'Boyolali',    'Kabupaten Boyolali'),
    'KLATEN':         ('KLATEN',      'Klaten',      'Kabupaten Klaten'),
    'SUKOHARJO':      ('SUKOHARJO',   'Sukoharjo',   'Kabupaten Sukoharjo'),
    'WONOGIRI':       ('WONOGIRI',    'Wonogiri',    'Kabupaten Wonogiri'),
    'KARANGANYAR':    ('KARANGANYAR', 'Karanganyar', 'Kabupaten Karanganyar'),
    'SRAGEN':         ('SRAGEN',      'Sragen',      'Kabupaten Sragen'),
    'KOTA SURAKARTA': ('SURAKARTA',   'Surakarta',   'Kota Surakarta'),
}

VIEW_W, VIEW_H, PAD = 1000.0, 1000.0, 12.0


def rings_of(geom):
    """Semua ring terluar dari Polygon / MultiPolygon (lubang diabaikan)."""
    if geom['type'] == 'Polygon':
        return [geom['coordinates'][0]]
    return [poly[0] for poly in geom['coordinates']]


def perp_dist(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def rdp(pts, eps):
    """Douglas-Peucker iteratif (hindari rekursi dalam)."""
    if len(pts) < 3:
        return pts[:]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        dmax, idx = 0.0, lo
        for i in range(lo + 1, hi):
            d = perp_dist(pts[i], pts[lo], pts[hi])
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps:
            keep[idx] = True
            stack.append((lo, idx))
            stack.append((idx, hi))
    return [p for p, k in zip(pts, keep) if k]


def signed_area(ring):
    s = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        s += x1 * y2 - x2 * y1
    return s / 2.0


def centroid(ring):
    a = signed_area(ring)
    if abs(a) < 1e-12:
        n = len(ring)
        return (sum(p[0] for p in ring) / n, sum(p[1] for p in ring) / n)
    cx = cy = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        cr = x1 * y2 - x2 * y1
        cx += (x1 + x2) * cr
        cy += (y1 + y2) * cr
    return (cx / (6 * a), cy / (6 * a))


# ---------- 1. ambil fitur ----------
data = json.load(open(SRC))
raw = {}
for f in data['features']:
    p = f['properties']
    if p['prov_name'] == 'JAWA TENGAH' and p['name'] in WANT:
        raw[p['name']] = rings_of(f['geometry'])
missing = set(WANT) - set(raw)
assert not missing, f'wilayah tidak ditemukan: {missing}'

# ---------- 2. proyeksi equirectangular ----------
all_pts = [pt for rings in raw.values() for r in rings for pt in r]
lat0 = sum(p[1] for p in all_pts) / len(all_pts)
k = math.cos(math.radians(lat0))          # koreksi bujur pada lintang tsb
xs = [p[0] * k for p in all_pts]
ys = [-p[1] for p in all_pts]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
scale = min((VIEW_W - 2 * PAD) / (maxx - minx), (VIEW_H - 2 * PAD) / (maxy - miny))
offx = (VIEW_W - (maxx - minx) * scale) / 2 - minx * scale
offy = (VIEW_H - (maxy - miny) * scale) / 2 - miny * scale

def project(lon, lat):
    return (lon * k * scale + offx, -lat * scale + offy)

# ---------- 3. simplifikasi + path ----------
EPS = 0.55   # toleransi dalam satuan viewBox (~0.05% lebar)
out, total_pts = [], 0
for name, rings in raw.items():
    rid, label, full = WANT[name]
    projected = [[project(lon, lat) for lon, lat, *_ in r] for r in rings]
    # buang pulau/sliver sangat kecil, sisakan yang bermakna
    projected = [r for r in projected if abs(signed_area(r)) > 1.5]
    projected.sort(key=lambda r: abs(signed_area(r)), reverse=True)

    parts = []
    for r in projected:
        s = rdp(r, EPS)
        if len(s) < 4:
            continue
        if s[0] != s[-1]:
            s.append(s[0])
        total_pts += len(s)
        d = 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in s[:-1]) + ' Z'
        parts.append(d)
    main = max(projected, key=lambda r: abs(signed_area(r)))
    cx, cy = centroid(main)
    out.append({
        'id': rid, 'name': label, 'fullName': full,
        'd': ' '.join(parts),
        'labelX': round(cx, 1), 'labelY': round(cy, 1),
    })

order = ['BOYOLALI', 'SRAGEN', 'KLATEN', 'SURAKARTA', 'KARANGANYAR', 'SUKOHARJO', 'WONOGIRI']
out.sort(key=lambda o: order.index(o['id']))

ts = ['// GENERATED FILE - jangan diedit manual.',
      '// Sumber: batas administrasi kabupaten/kota BPS (eppofahmi/geojson-indonesia),',
      '// diproyeksikan equirectangular (koreksi cos-lat) & disederhanakan Douglas-Peucker.',
      '// Regenerate: lihat scripts/build-surakarta-map.py',
      '',
      'export interface KabupatenShape {',
      '  id: string;',
      '  name: string;',
      '  fullName: string;',
      '  /** SVG path pada viewBox 0 0 1000 1000 */',
      '  d: string;',
      '  /** titik tengah untuk label */',
      '  labelX: number;',
      '  labelY: number;',
      '}',
      '',
      'export const SURAKARTA_VIEWBOX = "0 0 1000 1000";',
      '',
      'export const KARESIDENAN_SURAKARTA: KabupatenShape[] = [']
for o in out:
    ts.append('  {')
    ts.append(f'    id: {json.dumps(o["id"])},')
    ts.append(f'    name: {json.dumps(o["name"])},')
    ts.append(f'    fullName: {json.dumps(o["fullName"])},')
    ts.append(f'    labelX: {o["labelX"]},')
    ts.append(f'    labelY: {o["labelY"]},')
    ts.append(f'    d: {json.dumps(o["d"])},')
    ts.append('  },')
ts.append('];')
ts.append('')
open('surakartaMap.ts', 'w').write('\n'.join(ts))

print(f'lat0={lat0:.4f} scale={scale:.1f}')
for o in out:
    print(f'  {o["id"]:12} path_len={len(o["d"]):6}  label=({o["labelX"]},{o["labelY"]})')
print('total titik:', total_pts)
import os
print('ukuran file:', os.path.getsize('surakartaMap.ts'), 'byte')
