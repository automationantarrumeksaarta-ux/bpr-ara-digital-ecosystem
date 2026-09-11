import React from 'react';
import { GerbangKeamanan } from './components/mobile/GerbangKeamanan';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppRouter } from './app/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        {/*
          Gerbang keutuhan perangkat membungkus SELURUH aplikasi, bukan hanya
          layar absen. Kalau hanya layar absen yang dijaga, ponsel dengan lokasi
          tiruan masih bisa membuka modul lain — dan yang diminta adalah
          aplikasinya tidak dapat dibuka sama sekali.

          Di peramban gerbang ini tidak aktif: pemeriksaannya native, dan
          hasilnya gagal-terbuka bila tidak tersedia.
        */}
        <GerbangKeamanan>
          <AppRouter />
        </GerbangKeamanan>
      </AppProvider>
    </BrowserRouter>
  );
}
