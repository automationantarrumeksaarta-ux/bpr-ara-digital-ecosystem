"""Titik kelurahan/desa -> koordinat viewBox peta Karesidenan Surakarta.

Menghasilkan src/data/geo/kelurahanPoints.ts, dipakai Dashboard Heat Map untuk
menaruh lingkaran kepekatan per desa di atas peta kabupaten yang sudah ada.

Kenapa titik, bukan poligon: batas desa untuk tujuh kabupaten ini berukuran
puluhan megabita dan akan membengkakkan berkas aplikasi. Satu titik per desa
cukup untuk menunjukkan di mana kredit bermasalah menumpuk, dan ukurannya
hanya beberapa kilobita.

PENTING — proyeksinya harus sama persis dengan build-surakarta-map.py.
Konstanta k/scale/offx/offy tidak ditulis tetap di berkas mana pun; keduanya
dihitung dari all_kabkota.geojson yang sama. Karena itu skrip ini membaca
berkas geojson tersebut dan mengulang perhitungan yang identik. Bila memakai
sumber berbeda, lingkarannya akan meleset dari petanya.

Sumber koordinat: Nominatim (OpenStreetMap). Dibatasi satu permintaan per
detik sesuai ketentuan pemakaiannya. Desa yang tidak ditemukan TIDAK ditebak
posisinya — ditandai sebagai tidak ketemu, supaya tidak ada lingkaran yang
muncul di tempat yang salah.

Pakai:
    python3 scripts/build-kelurahan-points.py \
        --geojson all_kabkota.geojson \
        --daftar kelurahan.json \
        --keluaran src/data/geo/kelurahanPoints.ts
"""
import argparse
import json
import math
import sys
import time
import urllib.parse
import urllib.request

VIEW_W, VIEW_H, PAD = 1000.0, 1000.0, 12.0

WANT = {
    'BOYOLALI', 'KLATEN', 'SUKOHARJO', 'WONOGIRI',
    'KARANGANYAR', 'SRAGEN', 'KOTA SURAKARTA',
}

# Nama kabupaten di basis data -> nama di geojson BPS.
NAMA_GEOJSON = {
    'BOYOLALI': 'BOYOLALI', 'KLATEN': 'KLATEN', 'SUKOHARJO': 'SUKOHARJO',
    'WONOGIRI': 'WONOGIRI', 'KARANGANYAR': 'KARANGANYAR', 'SRAGEN': 'SRAGEN',
    'SURAKARTA': 'KOTA SURAKARTA',
}

NOMINATIM = 'https://nominatim.openstreetmap.org/search'
AGEN = 'bpr-ara-heatmap/1.0 (peta kepekatan kredit internal)'


def rings_of(geom):
    if geom['type'] == 'Polygon':
        return [geom['coordinates'][0]]
    return [poly[0] for poly in geom['coordinates']]


def di_dalam(lon, lat, rings):
    """Ray casting: apakah titik berada di dalam salah satu ring."""
    for r in rings:
        di = False
        n = len(r)
        for i in range(n):
            x1, y1 = r[i][0], r[i][1]
            x2, y2 = r[(i + 1) % n][0], r[(i + 1) % n][1]
            if (y1 > lat) != (y2 > lat):
                xin = (x2 - x1) * (lat - y1) / (y2 - y1) + x1
                if lon < xin:
                    di = not di
        if di:
            return True
    return False


def hitung_proyeksi(path_geojson):
    """Ulangi persis perhitungan proyeksi milik build-surakarta-map.py."""
    with open(path_geojson, encoding='utf-8') as f:
        gj = json.load(f)

    raw = {}
    for feat in gj['features']:
        nama = (feat['properties'].get('name') or '').upper()
        if nama in WANT:
            raw[nama] = rings_of(feat['geometry'])

    hilang = WANT - set(raw)
    assert not hilang, f'wilayah tidak ditemukan di geojson: {hilang}'

    all_pts = [pt for rings in raw.values() for r in rings for pt in r]
    lat0 = sum(p[1] for p in all_pts) / len(all_pts)
    k = math.cos(math.radians(lat0))
    xs = [p[0] * k for p in all_pts]
    ys = [-p[1] for p in all_pts]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    scale = min((VIEW_W - 2 * PAD) / (maxx - minx), (VIEW_H - 2 * PAD) / (maxy - miny))
    offx = (VIEW_W - (maxx - minx) * scale) / 2 - minx * scale
    offy = (VIEW_H - (maxy - miny) * scale) / 2 - miny * scale

    def project(lon, lat):
        return (lon * k * scale + offx, -lat * scale + offy)

    return project, raw


def cari_koordinat(kelurahan, kecamatan, kabupaten):
    """Satu desa -> (lat, lon) atau None.

    Dicoba dari pertanyaan paling lengkap ke yang lebih longgar. Hasil di luar
    kotak Jawa Tengah bagian timur dibuang, karena Nominatim kadang
    mengembalikan tempat bernama sama di pulau lain.
    """
    kab = kabupaten.replace('Kab.', '').replace('Kabupaten', '').replace('Kota', '').strip()
    percobaan = [
        f'{kelurahan}, {kecamatan}, {kab}, Jawa Tengah, Indonesia',
        f'{kelurahan}, {kab}, Jawa Tengah, Indonesia',
    ]
    for q in percobaan:
        params = urllib.parse.urlencode({
            'q': q, 'format': 'json', 'limit': 1, 'countrycodes': 'id',
        })
        req = urllib.request.Request(f'{NOMINATIM}?{params}', headers={'User-Agent': AGEN})
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                hasil = json.load(r)
        except Exception as e:
            print(f'    ! gagal menghubungi Nominatim: {e}', file=sys.stderr)
            hasil = []
        time.sleep(1.1)   # ketentuan pemakaian: maksimal 1 permintaan/detik
        if hasil:
            lat, lon = float(hasil[0]['lat']), float(hasil[0]['lon'])
            # Kotak kasar Karesidenan Surakarta dan sekitarnya.
            if -8.4 <= lat <= -6.8 and 110.2 <= lon <= 111.6:
                return lat, lon
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--geojson', required=True)
    ap.add_argument('--daftar', required=True, help='JSON: [{kabupaten,kecamatan,kelurahan,n}]')
    ap.add_argument('--keluaran', required=True)
    ap.add_argument('--singgahan', help='JSON hasil geocoding sebelumnya, agar tidak mengulang')
    args = ap.parse_args()

    project, batas = hitung_proyeksi(args.geojson)

    with open(args.daftar, encoding='utf-8') as f:
        daftar = json.load(f)

    singgahan = {}
    if args.singgahan:
        try:
            with open(args.singgahan, encoding='utf-8') as f:
                singgahan = json.load(f)
        except FileNotFoundError:
            pass

    titik, gagal = [], []
    for i, d in enumerate(daftar, 1):
        kunci = f"{d['kabupaten']}|{d['kecamatan']}|{d['kelurahan']}"

        # Baris di luar Karesidenan Surakarta tidak punya kabupaten hasil
        # pemetaan (mis. Grobogan). Petanya memang tidak mencakup wilayah itu,
        # jadi dicatat sebagai tanpa titik alih-alih ditempatkan sembarangan.
        if not d.get('kabupaten'):
            gagal.append(kunci)
            continue

        if kunci in singgahan:
            koor = singgahan[kunci]
        else:
            print(f"[{i}/{len(daftar)}] {d['kelurahan']}, {d['kecamatan']}")
            koor = cari_koordinat(d['kelurahan'], d['kecamatan'], d['kabupaten'])
            singgahan[kunci] = koor
            if args.singgahan:
                with open(args.singgahan, 'w', encoding='utf-8') as f:
                    json.dump(singgahan, f)

        if not koor:
            gagal.append(kunci)
            continue

        # Periksa apakah titiknya benar-benar jatuh di dalam kabupatennya.
        #
        # Nominatim kadang mengembalikan desa bernama sama di kabupaten
        # tetangga. Tanpa pemeriksaan ini, satu desa Sukoharjo bisa muncul
        # sebagai lingkaran merah di tengah Klaten — dan peta risiko yang
        # menunjuk tempat yang salah lebih buruk daripada tidak ada peta.
        ring_kab = batas.get(NAMA_GEOJSON.get(d['kabupaten'], d['kabupaten'].upper()))
        if ring_kab and not di_dalam(koor[1], koor[0], ring_kab):
            gagal.append(kunci + ' (di luar batas kabupatennya)')
            continue

        x, y = project(koor[1], koor[0])
        titik.append({
            'kabupaten': d['kabupaten'], 'kecamatan': d['kecamatan'],
            'kelurahan': d['kelurahan'],
            'x': round(x, 1), 'y': round(y, 1),
        })

    baris = [
        '// GENERATED FILE - jangan diedit manual.',
        '// Dibuat oleh scripts/build-kelurahan-points.py',
        '// Sumber koordinat: Nominatim (OpenStreetMap), © kontributor OpenStreetMap.',
        '// Proyeksi mengikuti src/data/geo/surakartaMap.ts — viewBox 1000x1000.',
        '',
        'export interface TitikKelurahan {',
        '  kabupaten: string;',
        '  kecamatan: string;',
        '  kelurahan: string;',
        '  /** Koordinat dalam viewBox peta, bukan lintang/bujur. */',
        '  x: number;',
        '  y: number;',
        '}',
        '',
        f'export const TITIK_KELURAHAN: TitikKelurahan[] = [',
    ]
    for t in sorted(titik, key=lambda t: (t['kabupaten'], t['kecamatan'], t['kelurahan'])):
        baris.append(
            f"  {{ kabupaten: {json.dumps(t['kabupaten'])}, "
            f"kecamatan: {json.dumps(t['kecamatan'])}, "
            f"kelurahan: {json.dumps(t['kelurahan'])}, "
            f"x: {t['x']}, y: {t['y']} }},"
        )
    baris.append('];')
    baris.append('')
    baris.append('/** Desa yang koordinatnya belum ditemukan; sengaja tidak ditebak. */')
    baris.append('export const KELURAHAN_TANPA_TITIK: string[] = [')
    for g in sorted(gagal):
        baris.append(f'  {json.dumps(g)},')
    baris.append('];')
    baris.append('')

    with open(args.keluaran, 'w', encoding='utf-8') as f:
        f.write('\n'.join(baris))

    print(f'\nselesai: {len(titik)} titik ketemu, {len(gagal)} tidak ketemu -> {args.keluaran}')
    if gagal:
        print('tidak ketemu:', ', '.join(gagal[:10]), '...' if len(gagal) > 10 else '')


if __name__ == '__main__':
    main()
