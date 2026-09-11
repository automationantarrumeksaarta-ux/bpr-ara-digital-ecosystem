package com.bprara.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin pemeriksaan keutuhan perangkat untuk absensi.
        registerPlugin(KeamananPerangkat.class);
        super.onCreate(savedInstanceState);
    }
}
