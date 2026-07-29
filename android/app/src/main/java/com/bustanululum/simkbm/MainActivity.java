package com.bustanululum.simkbm;

import android.os.Bundle;
import android.content.pm.ApplicationInfo;
import android.webkit.WebView;
import android.view.WindowManager;
import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge: lay out content behind system bars (status & navigation)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }

        // Enable hardware acceleration for smooth WebView rendering
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // Allow WebView debugging in debug builds only
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        }
    }

    @Override
    public void onBackPressed() {
        // Let the Capacitor bridge handle the back button (navigates WebView history,
        // then exits app when at root). This preserves the in-app back logic.
        if (bridge != null && bridge.getWebView() != null) {
            if (bridge.getWebView().canGoBack()) {
                bridge.getWebView().goBack();
            } else {
                super.onBackPressed();
            }
        } else {
            super.onBackPressed();
        }
    }
}
