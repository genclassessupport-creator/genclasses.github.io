package com.genclasses.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.util.LruCache;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Reads a downloaded PDF inside the app, page by page, with zoom. Needs no internet. */
public class PdfViewerActivity extends Activity {

    private static final float[] ZOOMS = {1f, 1.5f, 2f, 3f};
    private static final int MAX_BITMAP_W = 1800;

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler ui = new Handler(Looper.getMainLooper());
    private PdfRenderer renderer;
    private ParcelFileDescriptor fd;
    private int[] pageW, pageH;
    private int zoomIdx;
    private int viewW;
    private long id;
    private String title;

    private LruCache<String, Bitmap> cache;
    private ListView list;
    private ZoomScroll hs;
    private TextView pageLabel;
    private ProgressBar spinner;
    private Adapter adapter;
    private boolean closed;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        id = getIntent().getLongExtra("id", -1);
        title = getIntent().getStringExtra("title");
        Ui.edgeToEdgeSafe(this);

        int maxKb = (int) (Runtime.getRuntime().maxMemory() / 1024);
        cache = new LruCache<String, Bitmap>(maxKb / 5) {
            @Override
            protected int sizeOf(String k, Bitmap b) { return b.getByteCount() / 1024; }
        };

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.BG);
        Ui.applyInsets(root);

        LinearLayout bar = Ui.toolbar(this, title == null ? "PDF" : title.replace(".pdf", ""), v -> finish());
        bar.addView(Ui.iconButton(this, R.drawable.ic_zoom_out, "छोटा करें", v -> setZoom(zoomIdx - 1)));
        bar.addView(Ui.iconButton(this, R.drawable.ic_zoom_in, "बड़ा करें", v -> setZoom(zoomIdx + 1)));
        bar.addView(Ui.iconButton(this, R.drawable.ic_share, "शेयर करें", v -> Pdfs.share(this, id, title)));
        bar.addView(Ui.iconButton(this, R.drawable.ic_open, "दूसरे ऐप में खोलें", v -> Pdfs.openOutside(this, id)));
        root.addView(bar);

        FrameLayout body = new FrameLayout(this);
        body.setBackgroundColor(Color.parseColor("#D9D4C8"));
        root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1f));

        hs = new ZoomScroll(this);
        hs.setFillViewport(true);
        hs.setHorizontalScrollBarEnabled(true);
        list = new ListView(this) {
            @Override
            protected void onMeasure(int wSpec, int hSpec) {
                // a horizontal scroller gives no width limit: always be exactly the zoomed page width
                int w = viewW > 0 ? contentW() : MeasureSpec.getSize(wSpec);
                super.onMeasure(w > 0 ? MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY) : wSpec, hSpec);
            }
        };
        list.setDivider(null);
        list.setDividerHeight(0);
        list.setSelector(android.R.color.transparent);
        list.setCacheColorHint(Color.TRANSPARENT);
        hs.addView(list, new FrameLayout.LayoutParams(-1, -1));
        body.addView(hs, new FrameLayout.LayoutParams(-1, -1));

        spinner = new ProgressBar(this);
        body.addView(spinner, new FrameLayout.LayoutParams(Ui.dp(this, 48), Ui.dp(this, 48), Gravity.CENTER));

        pageLabel = new TextView(this);
        pageLabel.setTextColor(Color.WHITE);
        pageLabel.setTextSize(13);
        pageLabel.setPadding(Ui.dp(this, 12), Ui.dp(this, 4), Ui.dp(this, 12), Ui.dp(this, 4));
        pageLabel.setBackground(Ui.round(Color.parseColor("#B31B2A57"), Ui.dp(this, 14)));
        pageLabel.setVisibility(View.GONE);
        FrameLayout.LayoutParams pl = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        pl.bottomMargin = Ui.dp(this, 14);
        body.addView(pageLabel, pl);

        setContentView(root);

        list.setOnScrollListener(new AbsListView.OnScrollListener() {
            @Override public void onScrollStateChanged(AbsListView v, int s) { }
            @Override
            public void onScroll(AbsListView v, int first, int count, int total) {
                if (total > 0) pageLabel.setText("पेज " + (first + 1) + " / " + total);
            }
        });

        open();
    }

    private void open() {
        final Uri u = Pdfs.uri(this, id);
        if (u == null) { fail(); return; }
        worker.execute(() -> {
            try {
                fd = getContentResolver().openFileDescriptor(u, "r");
                renderer = new PdfRenderer(fd);
                int n = renderer.getPageCount();
                int[] w = new int[n], h = new int[n];
                for (int i = 0; i < n; i++) {
                    PdfRenderer.Page p = renderer.openPage(i);
                    w[i] = p.getWidth();
                    h[i] = p.getHeight();
                    p.close();
                }
                ui.post(() -> ready(w, h));
            } catch (Exception | OutOfMemoryError e) {
                ui.post(this::fail);
            }
        });
    }

    private void fail() {
        if (closed) return;
        Toast.makeText(this, "यह PDF ऐप में नहीं खुल पाई, दूसरे ऐप में खोल रहे हैं", Toast.LENGTH_LONG).show();
        Pdfs.openOutside(this, id);
        finish();
    }

    private void ready(int[] w, int[] h) {
        if (closed) return;
        pageW = w;
        pageH = h;
        spinner.setVisibility(View.GONE);
        pageLabel.setVisibility(View.VISIBLE);
        hs.post(() -> {
            viewW = hs.getWidth();
            if (viewW <= 0) viewW = getResources().getDisplayMetrics().widthPixels;
            adapter = new Adapter();
            list.setAdapter(adapter);
            applyWidth();
            int last = prefs().getInt("page_" + id, 0);
            if (last > 0 && last < w.length) list.setSelection(last);
            pageLabel.setText("पेज " + (Math.max(0, last) + 1) + " / " + w.length);
        });
    }

    private SharedPreferences prefs() { return getSharedPreferences("pdf", MODE_PRIVATE); }

    private int contentW() { return Math.round(viewW * ZOOMS[zoomIdx]); }

    private void applyWidth() {
        ViewGroup.LayoutParams lp = list.getLayoutParams();
        lp.width = contentW();
        list.setLayoutParams(lp);
    }

    private void setZoom(int idx) {
        if (adapter == null) return;
        idx = Math.max(0, Math.min(ZOOMS.length - 1, idx));
        if (idx == zoomIdx) {
            Toast.makeText(this, idx == 0 ? "सबसे छोटा आकार" : "सबसे बड़ा आकार", Toast.LENGTH_SHORT).show();
            return;
        }
        int first = list.getFirstVisiblePosition();
        float ratio = ZOOMS[idx] / ZOOMS[zoomIdx];
        View top = list.getChildAt(0);
        int offset = top == null ? 0 : Math.round(top.getTop() * ratio);
        float hFrac = contentW() <= viewW ? 0.5f
                : (hs.getScrollX() + viewW / 2f) / contentW();
        zoomIdx = idx;
        applyWidth();
        adapter.notifyDataSetChanged();
        list.setSelectionFromTop(first, offset);
        hs.post(() -> hs.scrollTo(Math.max(0, Math.round(hFrac * contentW() - viewW / 2f)), 0));
    }

    private class Adapter extends BaseAdapter {
        @Override public int getCount() { return pageW == null ? 0 : pageW.length; }
        @Override public Object getItem(int i) { return i; }
        @Override public long getItemId(int i) { return i; }

        @Override
        public View getView(int i, View conv, ViewGroup parent) {
            ImageView iv = conv instanceof ImageView ? (ImageView) conv : new ImageView(PdfViewerActivity.this);
            int w = contentW();
            int gap = Ui.dp(PdfViewerActivity.this, 6);
            int h = Math.round(w * (pageH[i] / (float) pageW[i]));
            iv.setLayoutParams(new AbsListView.LayoutParams(w, h + gap));
            iv.setPadding(0, gap / 2, 0, gap / 2);
            iv.setScaleType(ImageView.ScaleType.FIT_XY);
            iv.setBackgroundColor(Color.parseColor("#D9D4C8"));
            final String key = i + "@" + zoomIdx;
            iv.setTag(key);
            Bitmap b = cache.get(key);
            if (b != null) {
                iv.setImageBitmap(b);
            } else {
                iv.setImageDrawable(new android.graphics.drawable.ColorDrawable(Color.WHITE));
                render(i, key, iv);
            }
            return iv;
        }
    }

    private void render(int page, String key, ImageView target) {
        final int bw = Math.min(contentW(), MAX_BITMAP_W);
        final int bh = Math.max(1, Math.round(bw * (pageH[page] / (float) pageW[page])));
        worker.execute(() -> {
            if (closed || renderer == null || !key.equals(target.getTag())) return;
            Bitmap cached = cache.get(key);
            if (cached != null) { ui.post(() -> show(key, cached, target)); return; }
            try {
                Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
                bmp.eraseColor(Color.WHITE);
                PdfRenderer.Page p = renderer.openPage(page);
                p.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                p.close();
                cache.put(key, bmp);
                ui.post(() -> show(key, bmp, target));
            } catch (OutOfMemoryError e) {
                cache.evictAll();
            } catch (Exception ignored) { }
        });
    }

    private void show(String key, Bitmap b, ImageView target) {
        if (key.equals(target.getTag())) target.setImageBitmap(b);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (adapter != null) prefs().edit().putInt("page_" + id, list.getFirstVisiblePosition()).apply();
    }

    @Override
    protected void onDestroy() {
        closed = true;
        worker.execute(() -> {
            try { if (renderer != null) renderer.close(); } catch (Exception ignored) { }
            try { if (fd != null) fd.close(); } catch (Exception ignored) { }
        });
        worker.shutdown();
        cache.evictAll();
        super.onDestroy();
    }

    /** Horizontal scroller that also turns a two-finger pinch into the next/previous zoom step. */
    private class ZoomScroll extends HorizontalScrollView {
        private final ScaleGestureDetector det;
        private float total = 1f;

        ZoomScroll(Activity a) {
            super(a);
            det = new ScaleGestureDetector(a, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
                @Override
                public boolean onScaleBegin(ScaleGestureDetector d) { total = 1f; return true; }

                @Override
                public boolean onScale(ScaleGestureDetector d) { total *= d.getScaleFactor(); return true; }

                @Override
                public void onScaleEnd(ScaleGestureDetector d) {
                    if (total > 1.15f) setZoom(zoomIdx + 1);
                    else if (total < 0.87f) setZoom(zoomIdx - 1);
                }
            });
        }

        @Override
        public boolean dispatchTouchEvent(MotionEvent e) {
            det.onTouchEvent(e);
            if (e.getPointerCount() > 1) {
                // keep the pinch from scrolling the pages underneath
                MotionEvent cancel = MotionEvent.obtain(e);
                cancel.setAction(MotionEvent.ACTION_CANCEL);
                super.dispatchTouchEvent(cancel);
                cancel.recycle();
                return true;
            }
            return super.dispatchTouchEvent(e);
        }
    }
}
