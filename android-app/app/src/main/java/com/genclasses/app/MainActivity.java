package com.genclasses.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends Activity {

    private static final String HOME = "https://genclasses.com/";
    private static final String OFFLINE = "file:///android_asset/offline.html";
    private static final Set<String> APP_HOSTS = new HashSet<>(Arrays.asList(
            "genclasses.com", "www.genclasses.com",
            "genclasses.github.io", "genclassessupport-creator.github.io"));
    private static final int REQ_STORAGE = 11;
    private static final int REQ_FILE = 12;

    private WebView web;
    private ProgressBar bar;
    private FrameLayout root;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;
    private ValueCallback<Uri[]> fileCallback;
    private String failedUrl;
    private String pendingDownload;
    private long lastBack;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#F3EDDF"));
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));

        bar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        bar.setMax(100);
        bar.setProgressTintList(android.content.res.ColorStateList.valueOf(Color.parseColor("#F58220")));
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP);
        root.addView(bar, lp);
        setContentView(root);

        // Android 15+ draws behind system bars: keep the page clear of them and the keyboard.
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                l = i.left; t = i.top; r = i.right; b = i.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            if (fullView == null) v.setPadding(l, t, r, b);
            return insets;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setAllowFileAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " GenClassesApp/" + appVersion());
        if (Build.VERSION.SDK_INT >= 29) s.setForceDark(WebSettings.FORCE_DARK_OFF);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "GenApp");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener((url, ua, cd, mime, len) -> download(url, cd, mime));

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }

        if (state != null) {
            web.restoreState(state);
        } else {
            Uri data = getIntent() != null ? getIntent().getData() : null;
            web.loadUrl(data != null && isAppUrl(data) ? data.toString() : HOME);
        }
    }

    private String appVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1";
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data != null && isAppUrl(data)) web.loadUrl(data.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    protected void onPause() {
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }

    @SuppressLint("GestureBackNavigation")
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        handleBack(); // Android 12 and older (13+ uses the callback registered in onCreate)
    }

    private void handleBack() {
        if (fullView != null) {
            exitFullscreen();
            return;
        }
        if (OFFLINE.equals(web.getUrl()) && web.canGoBackOrForward(-2)) {
            web.goBackOrForward(-2); // skip the page that failed to load
            return;
        }
        if (web.canGoBack()) {
            web.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBack < 2000) {
            finish();
        } else {
            lastBack = now;
            Toast.makeText(this, "बाहर निकलने के लिए दोबारा दबाएँ", Toast.LENGTH_SHORT).show();
        }
    }

    // ---------- navigation ----------

    private boolean isAppUrl(Uri u) {
        String scheme = u.getScheme();
        String host = u.getHost();
        return ("https".equals(scheme) || "http".equals(scheme)) && host != null && APP_HOSTS.contains(host.toLowerCase(java.util.Locale.ROOT));
    }

    private boolean handleUrl(Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase(java.util.Locale.ROOT);
        String url = u.toString();
        if (scheme.equals("file") || scheme.equals("about") || scheme.equals("data") || scheme.equals("blob")) return false;
        if (isAppUrl(u)) {
            String path = u.getPath() == null ? "" : u.getPath().toLowerCase(java.util.Locale.ROOT);
            if (path.endsWith(".pdf") || path.endsWith(".apk")) {
                download(url, null, path.endsWith(".pdf") ? "application/pdf" : null);
                return true;
            }
            return false;
        }
        if (scheme.equals("intent")) {
            try {
                Intent i = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                i.addCategory(Intent.CATEGORY_BROWSABLE);
                i.setComponent(null);
                i.setSelector(null);
                startActivity(i);
            } catch (Exception e) {
                try {
                    String fb = Intent.parseUri(url, Intent.URI_INTENT_SCHEME).getStringExtra("browser_fallback_url");
                    if (fb != null) openExternal(Uri.parse(fb));
                } catch (Exception ignored) { }
            }
            return true;
        }
        openExternal(u);
        return true;
    }

    private void openExternal(Uri u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "यह लिंक खोलने के लिए कोई ऐप नहीं मिला", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean online() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        NetworkInfo ni = cm.getActiveNetworkInfo();
        return ni != null && ni.isConnected();
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
            return handleUrl(req.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, String url) {
            return handleUrl(Uri.parse(url));
        }

        @Override
        public void onPageStarted(WebView v, String url, Bitmap fav) {
            bar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            bar.setVisibility(View.GONE);
            if (url.startsWith("file:")) return;
            // window.print() → Android print / "Save as PDF"; match the system bars to the page colour.
            v.evaluateJavascript(
                    "(function(){try{window.print=function(){GenApp.print(document.title||'GenClasses')};" +
                    "var c=getComputedStyle(document.body).backgroundColor;" +
                    "if(!c||c==='rgba(0, 0, 0, 0)')c=getComputedStyle(document.documentElement).backgroundColor;" +
                    "GenApp.barColor(c||'')}catch(e){}})()", null);
        }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
            if (req.isForMainFrame()) showOffline(req.getUrl().toString());
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView v, int code, String desc, String url) {
            if (url != null && url.equals(v.getUrl())) showOffline(url);
        }
    }

    private void showOffline(String url) {
        if (url != null && !url.startsWith("file:")) failedUrl = url;
        web.loadUrl(OFFLINE);
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView v, int p) {
            bar.setProgress(p);
            bar.setVisibility(p >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback cb) {
            if (fullView != null) { cb.onCustomViewHidden(); return; }
            fullView = view;
            fullCallback = cb;
            root.setPadding(0, 0, 0, 0);
            root.addView(view, new FrameLayout.LayoutParams(-1, -1));
            web.setVisibility(View.GONE);
            setFullscreenUi(true);
        }

        @Override
        public void onHideCustomView() { exitFullscreen(); }

        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = cb;
            try {
                startActivityForResult(p.createIntent(), REQ_FILE);
            } catch (Exception e) {
                fileCallback = null;
                return false;
            }
            return true;
        }
    }

    private void exitFullscreen() {
        if (fullView == null) return;
        root.removeView(fullView);
        fullView = null;
        web.setVisibility(View.VISIBLE);
        if (fullCallback != null) fullCallback.onCustomViewHidden();
        fullCallback = null;
        setFullscreenUi(false);
        root.requestApplyInsets();
    }

    @SuppressWarnings("deprecation")
    private void setFullscreenUi(boolean on) {
        View d = getWindow().getDecorView();
        if (on) {
            d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        } else {
            d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    // ---------- downloads ----------

    private void download(String url, String contentDisposition, String mime) {
        if (url == null || url.startsWith("blob:") || url.startsWith("data:")) {
            Toast.makeText(this, "यह फ़ाइल ऐप में सहेजी नहीं जा सकती", Toast.LENGTH_SHORT).show();
            return;
        }
        if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            pendingDownload = url;
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
            return;
        }
        try {
            String name = URLUtil.guessFileName(url, contentDisposition, mime);
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            if (mime != null) r.setMimeType(mime);
            r.addRequestHeader("User-Agent", web.getSettings().getUserAgentString());
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) r.addRequestHeader("Cookie", cookies);
            r.setTitle(name);
            r.setDescription("GenClasses");
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "GenClasses/" + name);
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            dm.enqueue(r);
            Toast.makeText(this, "डाउनलोड शुरू: " + name + "\n(Downloads › GenClasses में मिलेगी)", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            openExternal(Uri.parse(url));
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        if (req == REQ_STORAGE) {
            String u = pendingDownload;
            pendingDownload = null;
            if (u == null) return;
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) download(u, null, null);
            else openExternal(Uri.parse(u));
        }
    }

    // ---------- JS bridge ----------

    class Bridge {
        @JavascriptInterface
        public void print(String title) {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (pm == null) return;
                String job = (title == null || title.isEmpty()) ? "GenClasses" : title;
                PrintDocumentAdapter ad = web.createPrintDocumentAdapter(job);
                pm.print(job, ad, new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
            });
        }

        @JavascriptInterface
        public void retry() {
            runOnUiThread(() -> {
                if (!online()) {
                    Toast.makeText(MainActivity.this, "अभी भी इंटरनेट नहीं है", Toast.LENGTH_SHORT).show();
                    return;
                }
                web.loadUrl(failedUrl != null ? failedUrl : HOME);
            });
        }

        @JavascriptInterface
        public void barColor(String css) {
            final int c = parseCss(css);
            if (c == 0) return;
            runOnUiThread(() -> applyBarColor(c));
        }
    }

    private static int parseCss(String css) {
        try {
            if (css == null) return 0;
            css = css.trim();
            if (css.startsWith("rgb")) {
                String[] p = css.substring(css.indexOf('(') + 1, css.indexOf(')')).split(",");
                if (p.length == 4 && Float.parseFloat(p[3].trim()) < 0.5f) return 0;
                return Color.rgb(Math.round(Float.parseFloat(p[0].trim())),
                        Math.round(Float.parseFloat(p[1].trim())),
                        Math.round(Float.parseFloat(p[2].trim())));
            }
            if (css.startsWith("#")) return Color.parseColor(css);
        } catch (Exception ignored) { }
        return 0;
    }

    @SuppressWarnings("deprecation")
    private void applyBarColor(int c) {
        Window w = getWindow();
        root.setBackgroundColor(c);
        if (Build.VERSION.SDK_INT < 35) {
            w.setStatusBarColor(c);
            w.setNavigationBarColor(c);
        }
        boolean light = (Color.red(c) * 299 + Color.green(c) * 587 + Color.blue(c) * 114) / 1000 > 140;
        View d = w.getDecorView();
        if (Build.VERSION.SDK_INT >= 30 && w.getInsetsController() != null) {
            int mask = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            w.getInsetsController().setSystemBarsAppearance(light ? mask : 0, mask);
        } else {
            int f = d.getSystemUiVisibility();
            if (light) f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            else f &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                if (light) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                else f &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            d.setSystemUiVisibility(f);
        }
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
