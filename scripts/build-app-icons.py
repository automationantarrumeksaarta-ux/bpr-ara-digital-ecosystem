"""
Hasilkan seluruh ikon aplikasi dari satu berkas logo sumber.

Pakai:  python3 scripts/build-app-icons.py assets/brand/logo-master.png

Berkas sumber sengaja disimpan di assets/brand/, bukan public/, supaya tidak
ikut disalin ke dist/ dan dilayani ke pengguna.

Menghasilkan:
  - public/logo.png            logo untuk layar login & UI web
  - public/favicon.ico         favicon multi-ukuran yang sebenarnya (bukan PNG
                               yang sekadar diberi ekstensi .ico)
  - public/apple-touch-icon.png
  - android/.../mipmap-*/ic_launcher.png, ic_launcher_round.png,
    ic_launcher_foreground.png  untuk semua kepadatan layar
"""
import sys
import pathlib
from PIL import Image, ImageDraw

AKAR = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = AKAR / 'public'
RES = AKAR / 'android/app/src/main/res'

# Kepadatan Android -> ukuran ikon peluncur (px)
DENSITAS = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# Ikon adaptif berukuran 108dp, dan hanya 72dp di tengah (66,7%) yang dijamin
# tampil pada SEMUA bentuk mask peluncur. Batas itu ada terutama untuk
# melindungi SUDUT gambar dari mask lingkaran.
#
# Logo BPR ARA sendiri berbentuk lingkaran, jadi tidak punya sudut yang bisa
# terpotong — pada mask lingkaran, squircle, maupun rounded, lingkaran seukuran
# 75% lebar kanvas tetap utuh. Karena itu skalanya dilonggarkan sedikit supaya
# logo tidak tampak tenggelam di tengah ruang kosong. Kalau logo diganti
# dengan bentuk persegi, kembalikan ke 72/108.
FOREGROUND_SKALA = 0.75


def muat(sumber: pathlib.Path) -> Image.Image:
    im = Image.open(sumber).convert('RGBA')
    return rapatkan(im)


def rapatkan(im: Image.Image) -> Image.Image:
    """Buang ruang transparan di tepi supaya logo benar-benar terpusat."""
    kotak = im.getbbox()
    return im.crop(kotak) if kotak else im


def bujur_sangkar(im: Image.Image) -> Image.Image:
    """Letakkan logo di kanvas persegi transparan tanpa mengubah rasio."""
    sisi = max(im.size)
    kanvas = Image.new('RGBA', (sisi, sisi), (0, 0, 0, 0))
    kanvas.paste(im, ((sisi - im.width) // 2, (sisi - im.height) // 2), im)
    return kanvas


def ubah_ukuran(im: Image.Image, sisi: int) -> Image.Image:
    return im.resize((sisi, sisi), Image.LANCZOS)


def foreground_adaptif(im: Image.Image, sisi: int) -> Image.Image:
    """Kanvas penuh dengan logo diperkecil ke zona aman di tengah."""
    kanvas = Image.new('RGBA', (sisi, sisi), (0, 0, 0, 0))
    isi = max(1, int(sisi * FOREGROUND_SKALA))
    logo = ubah_ukuran(im, isi)
    off = (sisi - isi) // 2
    kanvas.paste(logo, (off, off), logo)
    return kanvas


def di_atas_putih(im: Image.Image) -> Image.Image:
    """
    Ikon peluncur lama (pra-Android 8) tidak punya lapisan latar, dan PNG
    transparan tampil buruk di atas wallpaper gelap. Jadi diberi alas putih
    berbentuk lingkaran, sewarna dengan @color/ic_launcher_background.
    """
    sisi = im.width
    alas = Image.new('RGBA', (sisi, sisi), (0, 0, 0, 0))
    d = ImageDraw.Draw(alas)
    d.ellipse((0, 0, sisi - 1, sisi - 1), fill=(255, 255, 255, 255))
    alas.paste(im, (0, 0), im)
    return alas


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit('Pakai: python3 scripts/build-app-icons.py assets/brand/logo-master.png')

    sumber = pathlib.Path(sys.argv[1])
    if not sumber.exists():
        sys.exit(f'Berkas tidak ditemukan: {sumber}')

    asli = bujur_sangkar(muat(sumber))
    print(f'Sumber: {sumber.name} -> dirapatkan & dipersegi menjadi {asli.size}')

    # --- Web ---
    PUBLIC.mkdir(exist_ok=True)
    ubah_ukuran(asli, 512).save(PUBLIC / 'logo.png')
    ubah_ukuran(asli, 180).save(PUBLIC / 'apple-touch-icon.png')
    # favicon.ico sungguhan: satu berkas berisi beberapa ukuran
    # Cukup sampai 64px. Menyertakan 128/256 membuat favicon membengkak jadi
    # ~140 KB padahal browser hanya memakai ukuran kecil; ukuran besar sudah
    # ditangani apple-touch-icon.png.
    ubah_ukuran(asli, 64).save(
        PUBLIC / 'favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    print('  public/logo.png (512), apple-touch-icon.png (180), favicon.ico (4 ukuran)')

    # --- Android ---
    for densitas, sisi in DENSITAS.items():
        folder = RES / f'mipmap-{densitas}'
        if not folder.exists():
            print(f'  lewati {folder} (tidak ada)')
            continue

        legacy = di_atas_putih(ubah_ukuran(asli, sisi))
        legacy.save(folder / 'ic_launcher.png')
        legacy.save(folder / 'ic_launcher_round.png')

        # foreground adaptif = 108/48 kali ukuran ikon
        sisi_fg = round(sisi * 108 / 48)
        foreground_adaptif(asli, sisi_fg).save(folder / 'ic_launcher_foreground.png')
        print(f'  mipmap-{densitas}: launcher {sisi}px, foreground {sisi_fg}px')

    print('\nSelesai. Jalankan `npx cap sync android` sebelum build APK.')


if __name__ == '__main__':
    main()
