package com.genclasses.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
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
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {

    static final String HOME = "https://genclasses.com/";
    static final String TESTS_URL = HOME + "#tests";
    static final String CA_URL = HOME + "#daily-ca";
    static final String PDF_URL = HOME + "downloads/";
    static final String TELEGRAM = "https://t.me/genclassesofficial";
    private static final String OFFLINE = "file:///android_asset/offline.html";
    private static final Set<String> APP_HOSTS = new HashSet<>(Arrays.asList(
            "genclasses.com", "www.genclasses.com",
            "genclasses.github.io", "genclassessupport-creator.github.io"));
    private static final int REQ_STORAGE = 11;
    private static final int REQ_FILE = 12;
    private static final int REQ_NOTIFY = 13;

    private static final int TAB_HOME = 0, TAB_TESTS = 1, TAB_PDF = 2, TAB_CA = 3, TAB_TG = 4;

    /** Hides the website's own header, footer and floating buttons: the app has its own bars. */
    private static final String APP_JS =
            "(function(){if(window.__genApp)return;window.__genApp=1;" +
            "var css='#nav.gx,nav.hub-nav,nav.v-nav,body>footer:not([class]),footer.v-footer,footer.hub-foot," +
            ".hub-contact-bar,.gc-fabs,#gcVisitCounter,.tg-fab,.wa-fab{display:none!important}" +
            "html{scroll-padding-top:12px!important}.ticker-wrap,a.cat#caTicker{margin-top:0!important}';" +
            "function add(){if(document.getElementById('gen-app-css'))return;var s=document.createElement('style');" +
            "s.id='gen-app-css';s.textContent=css;(document.head||document.documentElement).appendChild(s);}" +
            "if(document.documentElement)add();else document.addEventListener('readystatechange',add);" +
            "document.addEventListener('DOMContentLoaded',add);" +
            "window.print=function(){GenApp.print(document.title||'GenClasses')};})();";

    private static final String COLOR_JS =
            "(function(){try{var c=getComputedStyle(document.body).backgroundColor;" +
            "if(!c||c==='rgba(0, 0, 0, 0)')c=getComputedStyle(document.documentElement).backgroundColor;" +
            "GenApp.barColor(c||'');GenApp.lang(document.documentElement.lang||'')}catch(e){}})()";

    private final Handler ui = new Handler(Looper.getMainLooper());
    private FrameLayout root;
    private LinearLayout topBar, bottomBar;
    private TextView topTitle;
    private final ImageView[] topIcons = new ImageView[3];
    private final LinearLayout[] tabs = new LinearLayout[5];
    private WebView web;
    private ProgressBar bar;
    private TextView myPdfPill;
    private FrameLayout panel;
    private int panelTab = -1;
    private String lang = "hi";
    private View splash;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCallback;
    private ValueCallback<Uri[]> fileCallback;
    private String failedUrl;
    private String pendingDownload;
    private long lastBack;
    private long splashShownAt;
    private boolean docStartJs;
    private boolean resumed;
    private boolean imeOpen;
    private int chrome = Ui.BG;
    private int currentTab = -1;
    private int tabMuted = Ui.MUTED;
    private boolean tabLight = true;
    private final Set<Long> openWhenDone = new HashSet<>();
    private BroadcastReceiver downloadDone;

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Ui.edgeToEdgeSafe(this);
        buildLayout(state == null);
        setupWeb();
        applyChrome(Ui.BG);
        CaJob.createChannel(this);
        CaJob.schedule(this);

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }

        downloadDone = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                onDownloadDone(i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1));
            }
        };
        IntentFilter f = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(downloadDone, f, Context.RECEIVER_EXPORTED);
        else registerReceiver(downloadDone, f);

        if (state != null) {
            web.restoreState(state);
        } else {
            Uri data = getIntent() != null ? getIntent().getData() : null;
            boolean ca = data != null && CA_URL.equals(data.toString());
            web.loadUrl(data != null && isAppUrl(data) && !ca ? data.toString() : HOME);
            if (ca) showPanel(TAB_CA);
        }
    }

    // ---------- layout ----------

    private void buildLayout(boolean withSplash) {
        root = new FrameLayout(this);
        root.setBackgroundColor(Ui.BG);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        root.addView(col, new FrameLayout.LayoutParams(-1, -1));

        topBar = buildTopBar();
        col.addView(topBar, new LinearLayout.LayoutParams(-1, Ui.dp(this, 56)));

        FrameLayout content = new FrameLayout(this);
        col.addView(content, new LinearLayout.LayoutParams(-1, 0, 1f));
        web = new WebView(this);
        content.addView(web, new FrameLayout.LayoutParams(-1, -1));
        bar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        bar.setMax(100);
        bar.setProgressTintList(ColorStateList.valueOf(Ui.ORANGE));
        content.addView(bar, new FrameLayout.LayoutParams(-1, Ui.dp(this, 3), Gravity.TOP));

        myPdfPill = new TextView(this);
        myPdfPill.setText("📂  मेरी PDF");
        myPdfPill.setTextColor(Color.WHITE);
        myPdfPill.setTextSize(15);
        myPdfPill.setTypeface(Typeface.DEFAULT_BOLD);
        myPdfPill.setPadding(Ui.dp(this, 18), Ui.dp(this, 11), Ui.dp(this, 20), Ui.dp(this, 11));
        myPdfPill.setBackground(Ui.ripple(Ui.round(Ui.NAVY, Ui.dp(this, 24)), true));
        myPdfPill.setElevation(Ui.dp(this, 6));
        myPdfPill.setVisibility(View.GONE);
        myPdfPill.setOnClickListener(v -> startActivity(new Intent(this, MyPdfsActivity.class)));
        FrameLayout.LayoutParams pl = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.END);
        pl.setMargins(0, 0, Ui.dp(this, 16), Ui.dp(this, 16));
        content.addView(myPdfPill, pl);

        panel = new FrameLayout(this);
        panel.setClickable(true);
        panel.setVisibility(View.GONE);
        content.addView(panel, new FrameLayout.LayoutParams(-1, -1));

        bottomBar = buildBottomBar();
        col.addView(bottomBar, new LinearLayout.LayoutParams(-1, Ui.dp(this, 64)));

        if (withSplash) {
            splash = buildSplash();
            root.addView(splash, new FrameLayout.LayoutParams(-1, -1));
            splashShownAt = System.currentTimeMillis();
            ui.postDelayed(this::hideSplash, 6000); // never keep it longer than this
        }

        setContentView(root);

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int[] p = Ui.bars(insets);
            if (fullView == null) v.setPadding(p[0], p[1], p[2], p[3]);
            boolean ime = Ui.imeVisible(insets);
            if (ime != imeOpen) {
                imeOpen = ime;
                bottomBar.setVisibility(ime || fullView != null ? View.GONE : View.VISIBLE);
            }
            return insets;
        });
    }

    private LinearLayout buildTopBar() {
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.HORIZONTAL);
        t.setGravity(Gravity.CENTER_VERTICAL);
        t.setPadding(Ui.dp(this, 12), 0, Ui.dp(this, 4), 0);

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.HORIZONTAL);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        brand.setOnClickListener(v -> goTab(TAB_HOME));
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.logo);
        brand.addView(logo, new LinearLayout.LayoutParams(Ui.dp(this, 38), Ui.dp(this, 38)));
        LinearLayout words = new LinearLayout(this);
        words.setOrientation(LinearLayout.VERTICAL);
        words.setPadding(Ui.dp(this, 10), 0, 0, 0);
        topTitle = new TextView(this);
        topTitle.setText("GenClasses");
        topTitle.setTextSize(18);
        topTitle.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        TextView sub = new TextView(this);
        sub.setText("Your goal Our support");
        sub.setTextSize(10.5f);
        sub.setTypeface(Typeface.DEFAULT_BOLD);
        sub.setTextColor(Ui.ORANGE);
        words.addView(topTitle);
        words.addView(sub);
        brand.addView(words);
        t.addView(brand, new LinearLayout.LayoutParams(0, -1, 1f));

        topIcons[0] = Ui.iconButton(this, R.drawable.ic_translate, "हिंदी / English", v -> toggleLanguage());
        topIcons[1] = Ui.iconButton(this, R.drawable.ic_moon, "रात / दिन थीम", v -> toggleTheme());
        topIcons[2] = Ui.iconButton(this, R.drawable.ic_menu, "पूरा मेनू", v -> showMenu());
        for (ImageView i : topIcons) t.addView(i);
        t.setElevation(Ui.dp(this, 2));
        return t;
    }

    private LinearLayout buildBottomBar() {
        LinearLayout b = new LinearLayout(this);
        b.setOrientation(LinearLayout.HORIZONTAL);
        b.setElevation(Ui.dp(this, 8));
        int[] icons = {R.drawable.ic_home, R.drawable.ic_tests, R.drawable.ic_pdf, R.drawable.ic_news, R.drawable.ic_send};
        String[] labels = {"होम", "टेस्ट", "PDF", "करंट", "Telegram"};
        for (int i = 0; i < 5; i++) {
            final int idx = i;
            LinearLayout tab = new LinearLayout(this);
            tab.setOrientation(LinearLayout.VERTICAL);
            tab.setGravity(Gravity.CENTER);
            tab.setBackground(Ui.ripple(null, false));
            tab.setContentDescription(labels[i]);
            tab.setOnClickListener(v -> goTab(idx));

            ImageView ic = new ImageView(this);
            ic.setImageResource(icons[i]);
            ic.setScaleType(ImageView.ScaleType.CENTER);
            tab.addView(ic, new LinearLayout.LayoutParams(Ui.dp(this, 56), Ui.dp(this, 30)));

            TextView tx = new TextView(this);
            tx.setText(labels[i]);
            tx.setTextSize(11.5f);
            tx.setGravity(Gravity.CENTER);
            tx.setPadding(0, Ui.dp(this, 2), 0, 0);
            tab.addView(tx);
            tabs[i] = tab;
            b.addView(tab, new LinearLayout.LayoutParams(0, -1, 1f));
        }
        return b;
    }

    private View buildSplash() {
        LinearLayout s = new LinearLayout(this);
        s.setOrientation(LinearLayout.VERTICAL);
        s.setGravity(Gravity.CENTER);
        s.setBackgroundColor(Ui.BG);
        s.setClickable(true);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.logo);
        logo.setElevation(Ui.dp(this, 6));
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(Color.WHITE);
        logo.setBackground(circle);
        s.addView(logo, new LinearLayout.LayoutParams(Ui.dp(this, 150), Ui.dp(this, 150)));

        TextView name = new TextView(this);
        name.setText("GenClasses");
        name.setTextColor(Ui.NAVY);
        name.setTextSize(32);
        name.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        name.setPadding(0, Ui.dp(this, 18), 0, 0);
        name.setGravity(Gravity.CENTER);
        s.addView(name, new LinearLayout.LayoutParams(-1, -2));

        TextView tag = new TextView(this);
        tag.setText("Your goal Our support");
        tag.setTextColor(Ui.ORANGE);
        tag.setTextSize(15);
        tag.setTypeface(Typeface.DEFAULT_BOLD);
        tag.setGravity(Gravity.CENTER);
        s.addView(tag, new LinearLayout.LayoutParams(-1, -2));

        TextView exams = new TextView(this);
        exams.setText("UPSC · UPPCS · RO/ARO · TGT/PGT");
        exams.setTextColor(Ui.MUTED);
        exams.setTextSize(13);
        exams.setPadding(0, Ui.dp(this, 6), 0, Ui.dp(this, 26));
        exams.setGravity(Gravity.CENTER);
        s.addView(exams, new LinearLayout.LayoutParams(-1, -2));

        ProgressBar p = new ProgressBar(this);
        p.setIndeterminateTintList(ColorStateList.valueOf(Ui.ORANGE));
        s.addView(p, new LinearLayout.LayoutParams(Ui.dp(this, 30), Ui.dp(this, 30)));

        logo.setScaleX(0.85f);
        logo.setScaleY(0.85f);
        logo.animate().scaleX(1f).scaleY(1f).setDuration(500).start();
        return s;
    }

    private void hideSplash() {
        if (splash == null) return;
        long wait = 900 - (System.currentTimeMillis() - splashShownAt);
        if (wait > 0) { ui.postDelayed(this::hideSplash, wait); return; }
        final View s = splash;
        splash = null;
        s.animate().alpha(0f).setDuration(350).withEndAction(() -> {
            root.removeView(s);
            askNotificationsOnce();
        }).start();
    }

    // ---------- chrome colours (follow the website's light / dark theme) ----------

    @SuppressWarnings("deprecation")
    private void applyChrome(int c) {
        boolean changed = c != chrome;
        chrome = c;
        boolean light = (Color.red(c) * 299 + Color.green(c) * 587 + Color.blue(c) * 114) / 1000 > 140;
        int fg = light ? Ui.NAVY : Color.parseColor("#F2EBDA");
        int muted = light ? Ui.MUTED : Color.parseColor("#98A6BE");
        root.setBackgroundColor(c);
        topBar.setBackgroundColor(c);
        bottomBar.setBackgroundColor(c);
        topTitle.setTextColor(fg);
        for (ImageView i : topIcons) i.setImageTintList(ColorStateList.valueOf(fg));
        tabMuted = muted;
        tabLight = light;
        styleTabs();
        if (changed && panelTab != -1) showPanel(panelTab);

        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT < 35) {
            w.setStatusBarColor(c);
            if (Build.VERSION.SDK_INT >= 26) w.setNavigationBarColor(c);
        }
        View d = w.getDecorView();
        if (Build.VERSION.SDK_INT >= 30 && w.getInsetsController() != null) {
            int mask = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            w.getInsetsController().setSystemBarsAppearance(light ? mask : 0, mask);
        } else if (Build.VERSION.SDK_INT >= 23) {
            int f = d.getSystemUiVisibility();
            f = light ? f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR : f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                f = light ? f | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : f & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            d.setSystemUiVisibility(f);
        }
    }

    private void styleTabs() {
        for (int i = 0; i < 5; i++) {
            boolean sel = i == currentTab;
            ImageView ic = (ImageView) tabs[i].getChildAt(0);
            TextView tx = (TextView) tabs[i].getChildAt(1);
            int col = sel ? Ui.ORANGE : tabMuted;
            ic.setImageTintList(ColorStateList.valueOf(col));
            ic.setBackground(sel ? Ui.round(Color.parseColor(tabLight ? "#26F58220" : "#40F58220"),
                    Ui.dp(this, 15)) : null);
            tx.setTextColor(col);
            tx.setTypeface(sel ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        }
    }

    private void selectTab(int t) {
        if (t == currentTab) return;
        currentTab = t;
        styleTabs();
    }

    private static int tabFor(String url) {
        if (url == null) return -1;
        Uri u = Uri.parse(url);
        String p = u.getPath() == null || u.getPath().isEmpty() ? "/" : u.getPath().toLowerCase(Locale.ROOT);
        boolean home = p.equals("/") || p.equals("/index.html");
        if (p.startsWith("/downloads")) return TAB_PDF;
        if (p.startsWith("/up-ca")) return TAB_CA;
        if (home) return TAB_HOME;
        if (p.startsWith("/tests") || p.startsWith("/polity") || p.startsWith("/uppcs-prelims-pyq")
                || p.startsWith("/uppcs-2026-mock") || p.startsWith("/up-tgt-pgt-gic-mock")
                || p.startsWith("/daily") || p.startsWith("/csat") || isTestPage(p)) return TAB_TESTS;
        return -1;
    }

    /** A page where a test is being taken (leaving it could lose answers). */
    private static boolean isTestPage(String path) {
        if (path == null) return false;
        String p = path.toLowerCase(Locale.ROOT);
        if (!p.endsWith(".html") || p.endsWith("/index.html")) return false;
        return p.startsWith("/tests/") || p.contains("mock") || p.contains("test") || p.contains("pyq");
    }

    private void onUrlChanged(String url) {
        if (url == null || url.startsWith("file:") || panelTab != -1) return;
        selectTab(tabFor(url));
        Uri u = Uri.parse(url);
        boolean pdfPage = u.getPath() != null && u.getPath().startsWith("/downloads");
        myPdfPill.setVisibility(pdfPage ? View.VISIBLE : View.GONE);
    }

    // ---------- tabs & menu ----------

    private void goTab(int t) {
        if (t == TAB_TG) {
            openExternal(Uri.parse(TELEGRAM));
            return;
        }
        if (t == TAB_TESTS || t == TAB_CA) {
            showPanel(t);
            return;
        }
        boolean hadPanel = panelTab != -1;
        hidePanel();
        if (tabFor(web.getUrl()) == t) { // already there: just go to the top of the page
            if (!hadPanel || t == TAB_HOME) {
                web.evaluateJavascript("window.scrollTo({top:0,behavior:'smooth'})", null);
            }
            return;
        }
        openGuarded(t == TAB_HOME ? HOME : PDF_URL);
    }

    /** The app's own screen for a tab, shown over the web page (which stays as it is underneath). */
    private void showPanel(int t) {
        panel.removeAllViews();
        Screens sc = new Screens(this, chrome);
        if (t == TAB_TESTS) sc.tests(panel);
        else sc.current(panel, lang);
        panel.setVisibility(View.VISIBLE);
        myPdfPill.setVisibility(View.GONE);
        panelTab = t;
        selectTab(t);
    }

    private void hidePanel() {
        if (panelTab == -1) return;
        panelTab = -1;
        panel.setVisibility(View.GONE);
        panel.removeAllViews();
        currentTab = -2;
        onUrlChanged(web.getUrl());
    }

    /** Opens a website page; asks first if a test is in progress. */
    void openGuarded(String url) {
        String cur = web.getUrl();
        Uri cu = cur == null ? null : Uri.parse(cur);
        if (cu != null && isAppUrl(cu) && isTestPage(cu.getPath())) {
            new AlertDialog.Builder(this)
                    .setMessage("टेस्ट बीच में छोड़कर जाना चाहते हैं?")
                    .setPositiveButton("हाँ, जाएँ", (d, w) -> { hidePanel(); web.loadUrl(url); })
                    .setNegativeButton("टेस्ट जारी रखें", null)
                    .show();
            return;
        }
        hidePanel();
        web.loadUrl(url);
    }

    private void showMenu() {
        final Dialog d = new Dialog(this);
        d.requestWindowFeature(Window.FEATURE_NO_TITLE);

        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(0, Ui.dp(this, 10), 0, Ui.dp(this, 56));

        View handle = new View(this);
        handle.setBackground(Ui.round(Color.parseColor("#33000000"), Ui.dp(this, 3)));
        LinearLayout.LayoutParams hl = new LinearLayout.LayoutParams(Ui.dp(this, 40), Ui.dp(this, 5));
        hl.gravity = Gravity.CENTER_HORIZONTAL;
        hl.bottomMargin = Ui.dp(this, 6);
        list.addView(handle, hl);

        header(list, "पढ़ाई");
        row(list, d, "📂", "मेरी PDF (बिना इंटरनेट)", () -> startActivity(new Intent(this, MyPdfsActivity.class)));
        row(list, d, "🗺️", "सिलेबस", () -> open("syllabus/"));
        row(list, d, "📗", "NCERT किताबें", () -> open("ncert/"));
        row(list, d, "🎨", "विज़ुअल नोट्स", () -> open("learn/"));
        row(list, d, "🃏", "फ्लैशकार्ड", () -> open("flashcards/"));
        header(list, "टेस्ट");
        row(list, d, "📝", "UPPCS प्रारंभिक PYQ", () -> open("uppcs-prelims-pyq/"));
        row(list, d, "🧪", "UPPCS 2026 मॉक टेस्ट", () -> open("uppcs-2026-mock/"));
        row(list, d, "⚖️", "राजव्यवस्था PYQ", () -> open("polity/"));
        row(list, d, "🧮", "CSAT", () -> open("csat/"));
        row(list, d, "✅", "डेली 5 क्विज़", () -> open("daily/"));
        row(list, d, "🏫", "TGT / PGT / GIC मॉक", () -> open("up-tgt-pgt-gic-mock/"));
        row(list, d, "✍️", "RO/ARO हिंदी आलेखन", () -> open("ro-aro/drafting/"));
        row(list, d, "🗞️", "UP करंट अफेयर्स", () -> open("up-ca/"));
        header(list, "ऐप");
        boolean on = CaJob.enabled(this);
        row(list, d, "🔔", "रोज़ के करंट की सूचना: " + (on ? "चालू" : "बंद"), () -> toggleNotify(!on));
        row(list, d, "📤", "ऐप दोस्तों से शेयर करें", this::shareApp);
        row(list, d, "🔄", "पन्ना फिर से लोड करें", () -> { hidePanel(); web.reload(); });
        header(list, "संपर्क");
        row(list, d, "✈️", "Telegram चैनल", () -> openExternal(Uri.parse(TELEGRAM)));
        row(list, d, "💬", "Telegram पर बात करें", () -> openExternal(Uri.parse("https://t.me/GenClasses_Support")));
        row(list, d, "🟢", "WhatsApp: 9506321415", () -> openExternal(Uri.parse("https://wa.me/919506321415")));
        row(list, d, "📸", "Instagram", () -> openExternal(Uri.parse("https://www.instagram.com/genclasses")));
        row(list, d, "✉️", "ईमेल करें", () -> openExternal(Uri.parse("mailto:genclassessupport@gmail.com")));

        TextView ver = new TextView(this);
        ver.setText("GenClasses ऐप · संस्करण " + appVersion());
        ver.setTextColor(Ui.MUTED);
        ver.setTextSize(12);
        ver.setGravity(Gravity.CENTER);
        ver.setPadding(0, Ui.dp(this, 14), 0, 0);
        list.addView(ver);

        ScrollView sv = new ScrollView(this);
        sv.addView(list);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Ui.BG);
        float r = Ui.dp(this, 22);
        bg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
        sv.setBackground(bg);
        d.setContentView(sv);

        Window w = d.getWindow();
        if (w != null) {
            w.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            w.setGravity(Gravity.BOTTOM);
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.width = ViewGroup.LayoutParams.MATCH_PARENT;
            lp.height = Math.round(getResources().getDisplayMetrics().heightPixels * 0.78f);
            w.setAttributes(lp);
            w.setWindowAnimations(android.R.style.Animation_InputMethod);
        }
        d.show();
    }

    private void header(LinearLayout list, String text) {
        TextView h = new TextView(this);
        h.setText(text);
        h.setTextColor(Ui.ORANGE);
        h.setTextSize(13);
        h.setTypeface(Typeface.DEFAULT_BOLD);
        h.setPadding(Ui.dp(this, 22), Ui.dp(this, 14), Ui.dp(this, 22), Ui.dp(this, 4));
        list.addView(h);
    }

    private void row(LinearLayout list, Dialog d, String emoji, String text, Runnable action) {
        TextView t = new TextView(this);
        t.setText(emoji + "   " + text);
        t.setTextColor(Ui.NAVY);
        t.setTextSize(16);
        t.setMinHeight(Ui.dp(this, 48));
        t.setGravity(Gravity.CENTER_VERTICAL);
        t.setPadding(Ui.dp(this, 22), 0, Ui.dp(this, 22), 0);
        t.setBackground(Ui.ripple(null, true));
        t.setOnClickListener(v -> {
            d.dismiss();
            action.run();
        });
        list.addView(t);
    }

    private void open(String path) {
        openGuarded(HOME + path);
    }

    private void shareApp() {
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TEXT, "UPSC / UPPCS की तैयारी के लिए GenClasses का मुफ़्त ऐप: टेस्ट, PDF, रोज़ का करंट अफेयर्स।\n"
                + "डाउनलोड करें: https://genclasses.com/app/");
        try { startActivity(Intent.createChooser(i, "ऐप शेयर करें")); } catch (ActivityNotFoundException ignored) { }
    }

    private void toggleLanguage() {
        web.evaluateJavascript("(function(){var b=document.getElementById('langBtn');if(b){b.click();return}" +
                "try{var L=localStorage.getItem('gen_lang')==='en'?'hi':'en';localStorage.setItem('gen_lang',L);location.reload()}catch(e){}})()", null);
        ui.postDelayed(() -> web.evaluateJavascript(COLOR_JS, null), 350);
    }

    private void toggleTheme() {
        web.evaluateJavascript("(function(){var b=document.getElementById('themeBtn');if(b){b.click();return}" +
                "try{var T=localStorage.getItem('gen_theme')==='dark'?'light':'dark';localStorage.setItem('gen_theme',T);location.reload()}catch(e){}})()", null);
        ui.postDelayed(() -> web.evaluateJavascript(COLOR_JS, null), 350);
    }

    // ---------- notifications ----------

    private SharedPreferences appPrefs() { return getSharedPreferences("app", MODE_PRIVATE); }

    private void askNotificationsOnce() {
        if (Build.VERSION.SDK_INT < 33 || isFinishing()) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        if (appPrefs().getBoolean("asked_notify", false)) return;
        appPrefs().edit().putBoolean("asked_notify", true).apply();
        new AlertDialog.Builder(this)
                .setTitle("🔔 रोज़ का करंट अफेयर्स")
                .setMessage("हर दिन नया करंट अफेयर्स आते ही आपको सूचना मिले? (दिन में एक बार, रात में कभी नहीं)")
                .setPositiveButton("हाँ, सूचना दें", (d, w) ->
                        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFY))
                .setNegativeButton("अभी नहीं", (d, w) -> CaJob.setEnabled(this, false))
                .show();
    }

    private void toggleNotify(boolean on) {
        CaJob.setEnabled(this, on);
        if (on && Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFY);
            return;
        }
        Toast.makeText(this, on ? "रोज़ की सूचना चालू हो गई" : "रोज़ की सूचना बंद कर दी गई", Toast.LENGTH_SHORT).show();
    }

    // ---------- lifecycle ----------

    private String appVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data == null || !isAppUrl(data)) return;
        if (CA_URL.equals(data.toString())) { showPanel(TAB_CA); return; }
        hidePanel();
        web.loadUrl(data.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        web.onResume();
    }

    @Override
    protected void onPause() {
        resumed = false;
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        try { unregisterReceiver(downloadDone); } catch (Exception ignored) { }
        ui.removeCallbacksAndMessages(null);
        if (web != null) {
            ((ViewGroup) web.getParent()).removeView(web);
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
        if (panelTab != -1) {
            hidePanel();
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

    // ---------- web ----------

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWeb() {
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

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                Set<String> origins = new HashSet<>();
                for (String h : APP_HOSTS) origins.add("https://" + h);
                WebViewCompat.addDocumentStartJavaScript(web, APP_JS, origins);
                docStartJs = true;
            } catch (Exception ignored) { }
        }
    }

    private boolean isAppUrl(Uri u) {
        String scheme = u.getScheme();
        String host = u.getHost();
        return ("https".equals(scheme) || "http".equals(scheme)) && host != null
                && APP_HOSTS.contains(host.toLowerCase(Locale.ROOT));
    }

    private boolean handleUrl(Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase(Locale.ROOT);
        String url = u.toString();
        if (scheme.equals("file") || scheme.equals("about") || scheme.equals("data") || scheme.equals("blob")) return false;
        if (isAppUrl(u)) {
            String path = u.getPath() == null ? "" : u.getPath().toLowerCase(Locale.ROOT);
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

    void openExternal(Uri u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, u);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "यह लिंक खोलने के लिए कोई ऐप नहीं मिला", Toast.LENGTH_SHORT).show();
        }
    }

    @SuppressWarnings("deprecation")
    private boolean online() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        NetworkInfo ni = cm.getActiveNetworkInfo();
        return ni != null && ni.isConnected();
    }

    private void injectPageJs(WebView v) {
        if (!docStartJs) v.evaluateJavascript(APP_JS, null);
        v.evaluateJavascript("window.print=function(){GenApp.print(document.title||'GenClasses')};", null);
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
            onUrlChanged(url);
        }

        @Override
        public void onPageCommitVisible(WebView v, String url) {
            if (!url.startsWith("file:")) injectPageJs(v);
        }

        @Override
        public void doUpdateVisitedHistory(WebView v, String url, boolean reload) {
            onUrlChanged(url);
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            bar.setVisibility(View.GONE);
            hideSplash();
            if (url.startsWith("file:")) {
                applyChrome(Ui.BG);
                return;
            }
            injectPageJs(v);
            v.evaluateJavascript(COLOR_JS, null);
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
            topBar.setVisibility(View.GONE);
            bottomBar.setVisibility(View.GONE);
            root.addView(view, new FrameLayout.LayoutParams(-1, -1));
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
        topBar.setVisibility(View.VISIBLE);
        bottomBar.setVisibility(imeOpen ? View.GONE : View.VISIBLE);
        if (fullCallback != null) fullCallback.onCustomViewHidden();
        fullCallback = null;
        setFullscreenUi(false);
        root.requestApplyInsets();
    }

    @SuppressWarnings("deprecation")
    private void setFullscreenUi(boolean on) {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(on ? View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY : View.SYSTEM_UI_FLAG_VISIBLE);
        if (!on) applyChrome(chrome);
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
        Pdfs.Item have = Pdfs.findDone(this, url);
        if (have != null) { // already on the phone: open it straight away, no internet needed
            Pdfs.openInApp(this, have);
            return;
        }
        if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT < 29
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
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
            long id = Pdfs.dm(this).enqueue(r);
            boolean pdf = name.toLowerCase(Locale.ROOT).endsWith(".pdf");
            if (pdf) openWhenDone.add(id);
            Toast.makeText(this, pdf ? "PDF डाउनलोड हो रही है… पूरी होते ही यहीं खुल जाएगी\n(बाद में ☰ › मेरी PDF में भी मिलेगी)"
                    : "डाउनलोड शुरू: " + name, Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            openExternal(Uri.parse(url));
        }
    }

    private void onDownloadDone(long id) {
        if (!openWhenDone.remove(id)) return;
        for (Pdfs.Item it : Pdfs.list(this)) {
            if (it.id == id && it.done()) {
                if (resumed) Pdfs.openInApp(this, it);
                else Toast.makeText(this, "PDF सहेज ली गई: ☰ › मेरी PDF", Toast.LENGTH_SHORT).show();
                return;
            }
        }
        Toast.makeText(this, "PDF डाउनलोड नहीं हो पाई, फिर से कोशिश करें", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        boolean granted = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
        if (req == REQ_STORAGE) {
            String u = pendingDownload;
            pendingDownload = null;
            if (u == null) return;
            if (granted) download(u, null, null);
            else openExternal(Uri.parse(u));
        } else if (req == REQ_NOTIFY) {
            CaJob.setEnabled(this, granted);
            Toast.makeText(this, granted ? "ठीक है! नया करंट आते ही सूचना मिलेगी" : "सूचना बंद है, ☰ मेनू से कभी भी चालू कर सकते हैं",
                    Toast.LENGTH_SHORT).show();
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
        public void myPdfs() {
            runOnUiThread(() -> startActivity(new Intent(MainActivity.this, MyPdfsActivity.class)));
        }

        @JavascriptInterface
        public void lang(String l) {
            final String v = "en".equals(l) ? "en" : "hi";
            runOnUiThread(() -> {
                if (v.equals(lang)) return;
                lang = v;
                if (panelTab == TAB_CA) showPanel(TAB_CA);
            });
        }

        @JavascriptInterface
        public void barColor(String css) {
            final int c = parseCss(css);
            if (c == 0) return;
            runOnUiThread(() -> applyChrome(c));
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
}
