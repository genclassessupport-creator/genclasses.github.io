package com.genclasses.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The app's own (non-web) screens for the "टेस्ट" and "करंट" tabs. */
final class Screens {

    private static final String FILES = MainActivity.HOME + "files.json";
    private static final Handler UI = new Handler(Looper.getMainLooper());

    private final MainActivity a;
    private final boolean light;
    private final int bg, card, fg, muted, line;

    Screens(MainActivity a, int chrome) {
        this.a = a;
        this.bg = chrome;
        light = (Color.red(chrome) * 299 + Color.green(chrome) * 587 + Color.blue(chrome) * 114) / 1000 > 140;
        card = light ? Color.WHITE : Color.parseColor("#14203A");
        fg = light ? Ui.NAVY : Color.parseColor("#F2EBDA");
        muted = light ? Ui.MUTED : Color.parseColor("#98A6BE");
        line = light ? Color.parseColor("#1A000000") : Color.parseColor("#26FFFFFF");
    }

    private int dp(float v) { return Ui.dp(a, v); }

    // ---------- shared pieces ----------

    private LinearLayout page(FrameLayout into) {
        ScrollView sv = new ScrollView(a);
        sv.setBackgroundColor(bg);
        sv.setFillViewport(true);
        LinearLayout col = new LinearLayout(a);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(16), dp(14), dp(16), dp(28));
        sv.addView(col, new FrameLayout.LayoutParams(-1, -2));
        into.addView(sv, new FrameLayout.LayoutParams(-1, -1));
        return col;
    }

    private TextView text(String s, float size, int color, boolean bold) {
        TextView t = new TextView(a);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private void title(LinearLayout col, String big, String small) {
        TextView t = text(big, 24, fg, true);
        t.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
        col.addView(t);
        TextView s = text(small, 13.5f, muted, false);
        s.setPadding(0, dp(2), 0, dp(10));
        col.addView(s);
    }

    private void section(LinearLayout col, String s) {
        TextView t = text(s, 13, Ui.ORANGE, true);
        t.setPadding(dp(2), dp(16), 0, dp(8));
        col.addView(t);
    }

    private GradientDrawable cardBg() {
        GradientDrawable g = Ui.round(card, dp(14));
        g.setStroke(dp(1), line);
        return g;
    }

    private LinearLayout.LayoutParams gap(int w, int h, int bottom) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(w, h);
        lp.bottomMargin = dp(bottom);
        return lp;
    }

    private void status(LinearLayout box, String msg, Runnable retry) {
        box.removeAllViews();
        if (msg == null) {
            ProgressBar p = new ProgressBar(a);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(32), dp(32));
            lp.gravity = Gravity.CENTER_HORIZONTAL;
            lp.topMargin = dp(24);
            box.addView(p, lp);
            return;
        }
        TextView t = text(msg, 14.5f, muted, false);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, dp(20), 0, dp(12));
        box.addView(t, new LinearLayout.LayoutParams(-1, -2));
        TextView b = text("↻ फिर से कोशिश करें", 15, Color.WHITE, true);
        b.setBackground(Ui.ripple(Ui.round(Ui.ORANGE, dp(22)), true));
        b.setPadding(dp(22), dp(10), dp(22), dp(10));
        b.setOnClickListener(v -> retry.run());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(b, lp);
    }

    private interface Done { void on(String json, boolean fresh); }

    /** Shows the saved copy at once (if any), then refreshes from the website. */
    private void load(String url, String key, Done done) {
        SharedPreferences p = a.getSharedPreferences("cache", Context.MODE_PRIVATE);
        final String saved = p.getString(key, null);
        if (saved != null) done.on(saved, false);
        new Thread(() -> {
            String got = null;
            try { got = CaJob.fetch(url); } catch (Exception ignored) { }
            final String res = got;
            if (res != null) p.edit().putString(key, res).apply();
            UI.post(() -> {
                if (res != null) { if (!res.equals(saved)) done.on(res, true); }
                else if (saved == null) done.on(null, true);
            });
        }).start();
    }

    // ---------- टेस्ट ----------

    void tests(FrameLayout into) {
        LinearLayout col = page(into);
        title(col, "टेस्ट", "सीरीज़ चुनें या नीचे से कोई भी टेस्ट सीधे खोलें");

        section(col, "टेस्ट सीरीज़");
        String[][] hubs = {
                {"📝", "UPPCS प्रारंभिक PYQ", "2018–2025, विषयवार", "uppcs-prelims-pyq/"},
                {"🧪", "UPPCS 2026 मॉक", "पूरे 150 प्रश्न वाले टेस्ट", "uppcs-2026-mock/"},
                {"⚖️", "राजव्यवस्था PYQ", "अध्यायवार 21 टेस्ट", "polity/"},
                {"🧮", "CSAT", "गणित, तर्क, हिंदी, अंग्रेज़ी", "csat/"},
                {"✅", "डेली 5 क्विज़", "रोज़ पाँच नए प्रश्न", "daily/"},
                {"🏫", "TGT / PGT / GIC", "GS खंड के मॉक टेस्ट", "up-tgt-pgt-gic-mock/"},
        };
        for (int i = 0; i < hubs.length; i += 2) {
            LinearLayout row = new LinearLayout(a);
            row.setOrientation(LinearLayout.HORIZONTAL);
            for (int j = i; j < i + 2; j++) {
                final String[] h = hubs[j];
                LinearLayout c = new LinearLayout(a);
                c.setOrientation(LinearLayout.VERTICAL);
                c.setBackground(Ui.ripple(cardBg(), true));
                c.setPadding(dp(14), dp(12), dp(12), dp(14));
                c.addView(text(h[0], 24, fg, false));
                TextView t = text(h[1], 15.5f, fg, true);
                t.setPadding(0, dp(4), 0, 0);
                c.addView(t);
                c.addView(text(h[2], 12.5f, muted, false));
                c.setOnClickListener(v -> a.openGuarded(MainActivity.HOME + h[3]));
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -1, 1f);
                if (j == i) lp.rightMargin = dp(10);
                row.addView(c, lp);
            }
            col.addView(row, gap(-1, -2, 10));
        }

        section(col, "सभी टेस्ट (श्रेणीवार)");
        final LinearLayout box = new LinearLayout(a);
        box.setOrientation(LinearLayout.VERTICAL);
        col.addView(box, new LinearLayout.LayoutParams(-1, -2));
        loadTests(box);
    }

    private void loadTests(LinearLayout box) {
        status(box, null, null);
        load(FILES, "files", (json, fresh) -> {
            if (json == null) {
                status(box, "टेस्ट-सूची नहीं आ पाई। इंटरनेट जाँचें।", () -> loadTests(box));
                return;
            }
            try { fillTests(box, new JSONArray(json)); }
            catch (Exception e) { status(box, "टेस्ट-सूची पढ़ी नहीं जा सकी।", () -> loadTests(box)); }
        });
    }

    private static final String[][] CATS = {
            {"uppcs2026", "UP PCS प्रारंभिक 2026"}, {"uppcs-prelims-pyq", "UPPCS प्रारंभिक PYQ"},
            {"polity", "राजव्यवस्था PYQ"}, {"ca", "करंट अफेयर्स"}, {"gs", "सामान्य अध्ययन"},
            {"csat", "CSAT"}, {"ncert", "NCERT"}, {"upspecial", "UP विशेष"},
            {"upsssc", "UPSSSC"}, {"up-tgt-pgt-gic", "TGT / PGT / GIC"},
    };

    private void fillTests(LinearLayout box, JSONArray files) throws Exception {
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String[] c : CATS) groups.put(c[0], new ArrayList<>());
        for (int i = 0; i < files.length(); i++) {
            String p = files.getString(i);
            if (!p.startsWith("tests/") || !p.endsWith(".html")) continue;
            String[] parts = p.split("/");
            if (parts.length < 3) continue;
            List<String> l = groups.get(parts[1]);
            if (l == null) { l = new ArrayList<>(); groups.put(parts[1], l); }
            l.add(p);
        }
        box.removeAllViews();
        for (Map.Entry<String, List<String>> e : groups.entrySet()) {
            final List<String> list = e.getValue();
            if (list.isEmpty()) continue;
            String name = e.getKey();
            for (String[] c : CATS) if (c[0].equals(name)) name = c[1];

            LinearLayout cardV = new LinearLayout(a);
            cardV.setOrientation(LinearLayout.VERTICAL);
            cardV.setBackground(cardBg());

            LinearLayout head = new LinearLayout(a);
            head.setGravity(Gravity.CENTER_VERTICAL);
            head.setPadding(dp(14), dp(13), dp(14), dp(13));
            head.setBackground(Ui.ripple(null, true));
            TextView n = text(name, 16, fg, true);
            head.addView(n, new LinearLayout.LayoutParams(0, -2, 1f));
            TextView cnt = text(list.size() + " टेस्ट", 12.5f, Ui.ORANGE, true);
            cnt.setPadding(dp(8), 0, dp(8), 0);
            head.addView(cnt);
            final TextView arrow = text("▾", 16, muted, false);
            head.addView(arrow);
            cardV.addView(head);

            final LinearLayout items = new LinearLayout(a);
            items.setOrientation(LinearLayout.VERTICAL);
            items.setVisibility(View.GONE);
            cardV.addView(items);

            head.setOnClickListener(v -> {
                boolean open = items.getVisibility() != View.VISIBLE;
                if (open && items.getChildCount() == 0) {
                    for (String p : list) items.addView(testRow(p));
                }
                items.setVisibility(open ? View.VISIBLE : View.GONE);
                arrow.setText(open ? "▴" : "▾");
            });
            box.addView(cardV, gap(-1, -2, 10));
        }
        if (box.getChildCount() == 0) status(box, "अभी कोई टेस्ट नहीं मिला।", () -> loadTests(box));
    }

    private View testRow(String path) {
        String file = path.substring(path.lastIndexOf('/') + 1).replace(".html", "");
        String name = file.replace('-', ' ').replace('_', ' ').trim();
        LinearLayout row = new LinearLayout(a);
        row.setOrientation(LinearLayout.VERTICAL);
        View div = new View(a);
        div.setBackgroundColor(line);
        row.addView(div, new LinearLayout.LayoutParams(-1, dp(1)));
        TextView t = text(name, 14.5f, fg, false);
        t.setPadding(dp(14), dp(12), dp(14), dp(12));
        t.setBackground(Ui.ripple(null, true));
        t.setOnClickListener(v -> a.openGuarded(MainActivity.HOME + Uri.encode(path, "/")));
        row.addView(t, new LinearLayout.LayoutParams(-1, -2));
        return row;
    }

    // ---------- करंट ----------

    void current(FrameLayout into, String lang) {
        final boolean en = "en".equals(lang);
        LinearLayout col = page(into);
        title(col, en ? "Current Affairs" : "करंट अफेयर्स",
                en ? "Exam-relevant points, day by day" : "रोज़ के परीक्षा-उपयोगी बिंदु, दिनवार");
        final LinearLayout box = new LinearLayout(a);
        box.setOrientation(LinearLayout.VERTICAL);
        col.addView(box, new LinearLayout.LayoutParams(-1, -2));

        section(col, en ? "MORE" : "और भी");
        col.addView(linkCard("🗞️", en ? "UP Current Affairs" : "UP करंट अफेयर्स",
                en ? "Uttar Pradesh special, date-wise" : "उत्तर प्रदेश विशेष, तिथिवार", "up-ca/"), gap(-1, -2, 10));
        col.addView(linkCard("📚", en ? "Current Affairs PDFs" : "करंट अफेयर्स की PDF",
                en ? "Highlight book and one-liners" : "हाइलाइट बुक और वन-लाइनर", "downloads/"), gap(-1, -2, 10));
        loadCa(box, en);
    }

    private View linkCard(String emoji, String name, String sub, String path) {
        LinearLayout c = new LinearLayout(a);
        c.setGravity(Gravity.CENTER_VERTICAL);
        c.setBackground(Ui.ripple(cardBg(), true));
        c.setPadding(dp(14), dp(12), dp(14), dp(12));
        c.addView(text(emoji, 22, fg, false));
        LinearLayout w = new LinearLayout(a);
        w.setOrientation(LinearLayout.VERTICAL);
        w.setPadding(dp(12), 0, 0, 0);
        w.addView(text(name, 15.5f, fg, true));
        w.addView(text(sub, 12.5f, muted, false));
        c.addView(w, new LinearLayout.LayoutParams(0, -2, 1f));
        c.addView(text("›", 22, muted, false));
        c.setOnClickListener(v -> a.openGuarded(MainActivity.HOME + path));
        return c;
    }

    private void loadCa(LinearLayout box, boolean en) {
        status(box, null, null);
        load(CaJob.FEED, "ca", (json, fresh) -> {
            if (json == null) {
                status(box, "करंट अफेयर्स नहीं आ पाया। इंटरनेट जाँचें।", () -> loadCa(box, en));
                return;
            }
            try { fillCa(box, new JSONObject(json).getJSONArray("days"), en, 0); }
            catch (Exception e) { status(box, "करंट अफेयर्स पढ़ा नहीं जा सका।", () -> loadCa(box, en)); }
        });
    }

    private static final String[] MON_HI = {"जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई",
            "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"};
    private static final String[] MON_EN = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

    private static String nice(String date, boolean en) {
        try {
            String[] p = date.split("-");
            int m = Integer.parseInt(p[1]) - 1;
            return Integer.parseInt(p[2]) + " " + (en ? MON_EN[m] : MON_HI[m]);
        } catch (Exception e) {
            return date;
        }
    }

    private void fillCa(LinearLayout box, JSONArray days, boolean en, int sel) throws Exception {
        box.removeAllViews();
        if (days.length() == 0) {
            status(box, "अभी कोई बिंदु नहीं है।", () -> loadCa(box, en));
            return;
        }
        HorizontalScrollView hs = new HorizontalScrollView(a);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout chips = new LinearLayout(a);
        hs.addView(chips);
        int n = Math.min(days.length(), 14);
        for (int i = 0; i < n; i++) {
            final int idx = i;
            boolean on = i == sel;
            String label = nice(days.getJSONObject(i).optString("date"), en);
            if (i == 0) label = (en ? "Latest · " : "नवीनतम · ") + label;
            TextView c = text(label, 13.5f, on ? Color.WHITE : fg, true);
            GradientDrawable g = Ui.round(on ? Ui.ORANGE : card, dp(18));
            if (!on) g.setStroke(dp(1), line);
            c.setBackground(g);
            c.setPadding(dp(14), dp(7), dp(14), dp(7));
            c.setOnClickListener(v -> {
                try { fillCa(box, days, en, idx); } catch (Exception ignored) { }
            });
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
            lp.rightMargin = dp(8);
            chips.addView(c, lp);
        }
        box.addView(hs, gap(-1, -2, 12));

        JSONArray pts = days.getJSONObject(sel).optJSONArray("points");
        for (int i = 0; pts != null && i < pts.length(); i++) {
            JSONObject p = pts.getJSONObject(i);
            String tag = p.optString(en ? "tag_en" : "tag_hi", p.optString("tag_hi"));
            String body = p.optString(en ? "en" : "hi", p.optString("hi"));
            final String src = p.optString("src", "");

            LinearLayout c = new LinearLayout(a);
            c.setOrientation(LinearLayout.VERTICAL);
            c.setBackground(cardBg());
            c.setPadding(dp(14), dp(12), dp(14), dp(12));

            LinearLayout top = new LinearLayout(a);
            top.setGravity(Gravity.CENTER_VERTICAL);
            TextView num = text(String.valueOf(i + 1), 12.5f, Color.WHITE, true);
            num.setGravity(Gravity.CENTER);
            num.setBackground(Ui.round(light ? Ui.NAVY : Color.parseColor("#33507A"), dp(11)));
            top.addView(num, new LinearLayout.LayoutParams(dp(22), dp(22)));
            if (!TextUtils.isEmpty(tag)) {
                TextView tg = text(tag, 12, Ui.ORANGE, true);
                tg.setBackground(Ui.round(Color.parseColor(light ? "#1FF58220" : "#33F58220"), dp(10)));
                tg.setPadding(dp(9), dp(2), dp(9), dp(2));
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
                lp.leftMargin = dp(8);
                top.addView(tg, lp);
            }
            c.addView(top);

            TextView b = text(body, 15.5f, fg, false);
            b.setLineSpacing(dp(3), 1f);
            b.setPadding(0, dp(8), 0, 0);
            b.setTextIsSelectable(true);
            c.addView(b);

            if (src.startsWith("https://")) {
                TextView s = text(en ? "Source ↗" : "स्रोत ↗", 12.5f, muted, true);
                s.setPadding(0, dp(8), dp(12), 0);
                s.setOnClickListener(v -> a.openExternal(Uri.parse(src)));
                c.addView(s, new LinearLayout.LayoutParams(-2, -2));
            }
            box.addView(c, gap(-1, -2, 10));
        }
    }
}
