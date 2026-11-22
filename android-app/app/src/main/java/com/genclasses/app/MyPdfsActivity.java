package com.genclasses.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** "मेरी PDF": every PDF downloaded through the app, readable without internet. */
public class MyPdfsActivity extends Activity {

    private final List<Pdfs.Item> items = new ArrayList<>();
    private BaseAdapter adapter;
    private View empty;
    private ListView list;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Ui.edgeToEdgeSafe(this);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.BG);
        Ui.applyInsets(root);
        root.addView(Ui.toolbar(this, "मेरी PDF", v -> finish()));

        TextView hint = new TextView(this);
        hint.setText("ऐप से डाउनलोड की गई सारी PDF यहाँ हैं। ये बिना इंटरनेट भी खुलती हैं।\nकिसी PDF को देर तक दबाएँ: शेयर करें, दूसरे ऐप में खोलें या हटाएँ।");
        hint.setTextColor(Ui.MUTED);
        hint.setTextSize(13);
        hint.setPadding(Ui.dp(this, 18), Ui.dp(this, 10), Ui.dp(this, 18), Ui.dp(this, 6));
        root.addView(hint);

        list = new ListView(this);
        list.setDivider(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
        list.setDividerHeight(Ui.dp(this, 10));
        list.setSelector(android.R.color.transparent);
        list.setPadding(Ui.dp(this, 12), Ui.dp(this, 4), Ui.dp(this, 12), Ui.dp(this, 16));
        list.setClipToPadding(false);
        root.addView(list, new LinearLayout.LayoutParams(-1, 0, 1f));

        empty = emptyView();
        root.addView(empty, new LinearLayout.LayoutParams(-1, 0, 1f));

        adapter = new Adapter();
        list.setAdapter(adapter);
        list.setOnItemClickListener((p, v, pos, idd) -> open(items.get(pos)));
        list.setOnItemLongClickListener((p, v, pos, idd) -> {
            options(items.get(pos));
            return true;
        });
        setContentView(root);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private void refresh() {
        items.clear();
        items.addAll(Pdfs.list(this));
        adapter.notifyDataSetChanged();
        boolean none = items.isEmpty();
        empty.setVisibility(none ? View.VISIBLE : View.GONE);
        list.setVisibility(none ? View.GONE : View.VISIBLE);
    }

    private void open(Pdfs.Item it) {
        if (!it.done()) {
            Toast.makeText(this, "यह PDF अभी डाउनलोड हो रही है", Toast.LENGTH_SHORT).show();
            return;
        }
        Pdfs.openInApp(this, it);
    }

    private void options(Pdfs.Item it) {
        if (!it.done()) return;
        String[] opts = {"📖 ऐप में पढ़ें", "📤 शेयर करें", "↗ दूसरे ऐप में खोलें", "🗑 फ़ोन से हटाएँ"};
        new AlertDialog.Builder(this)
                .setTitle(it.title)
                .setItems(opts, (d, w) -> {
                    if (w == 0) Pdfs.openInApp(this, it);
                    else if (w == 1) Pdfs.share(this, it.id, it.title);
                    else if (w == 2) Pdfs.openOutside(this, it.id);
                    else confirmDelete(it);
                }).show();
    }

    private void confirmDelete(Pdfs.Item it) {
        new AlertDialog.Builder(this)
                .setMessage("“" + it.title + "” फ़ोन से हटा दें?")
                .setPositiveButton("हटाएँ", (d, w) -> {
                    Pdfs.dm(this).remove(it.id);
                    refresh();
                })
                .setNegativeButton("रहने दें", null)
                .show();
    }

    private View emptyView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(Ui.dp(this, 32), 0, Ui.dp(this, 32), Ui.dp(this, 40));

        ImageView ic = new ImageView(this);
        ic.setImageResource(R.drawable.ic_folder);
        ic.setImageTintList(ColorStateList.valueOf(Color.parseColor("#C9BFA8")));
        box.addView(ic, new LinearLayout.LayoutParams(Ui.dp(this, 72), Ui.dp(this, 72)));

        TextView t = new TextView(this);
        t.setText("अभी कोई PDF डाउनलोड नहीं की गई");
        t.setTextColor(Ui.NAVY);
        t.setTextSize(17);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, Ui.dp(this, 12), 0, Ui.dp(this, 4));
        box.addView(t);

        TextView s = new TextView(this);
        s.setText("PDF पन्ने से कोई भी PDF डाउनलोड करें, वह यहाँ आ जाएगी और बिना इंटरनेट भी खुलेगी।");
        s.setTextColor(Ui.MUTED);
        s.setGravity(Gravity.CENTER);
        s.setTextSize(14);
        box.addView(s);

        TextView btn = new TextView(this);
        btn.setText("मुफ़्त PDF देखें");
        btn.setTextColor(Color.WHITE);
        btn.setTextSize(16);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        btn.setGravity(Gravity.CENTER);
        btn.setBackground(Ui.ripple(Ui.round(Ui.ORANGE, Ui.dp(this, 26)), true));
        btn.setPadding(Ui.dp(this, 28), Ui.dp(this, 12), Ui.dp(this, 28), Ui.dp(this, 12));
        btn.setOnClickListener(v -> {
            Intent i = new Intent(this, MainActivity.class);
            i.setData(Uri.parse(MainActivity.PDF_URL));
            i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(i);
            finish();
        });
        LinearLayout.LayoutParams bl = new LinearLayout.LayoutParams(-2, -2);
        bl.topMargin = Ui.dp(this, 20);
        box.addView(btn, bl);
        return box;
    }

    private class Adapter extends BaseAdapter {
        private final SimpleDateFormat fmt = new SimpleDateFormat("d MMM yyyy", new Locale("hi", "IN"));

        @Override public int getCount() { return items.size(); }
        @Override public Object getItem(int i) { return items.get(i); }
        @Override public long getItemId(int i) { return items.get(i).id; }

        @Override
        public View getView(int i, View conv, ViewGroup parent) {
            Row r;
            if (conv == null) {
                r = new Row();
                conv = r.root;
                conv.setTag(r);
            } else {
                r = (Row) conv.getTag();
            }
            Pdfs.Item it = items.get(i);
            r.title.setText(it.title == null ? "PDF" : it.title.replace(".pdf", "").replace('-', ' '));
            if (it.done()) {
                String sz = Pdfs.size(it.size);
                String dt = it.time > 0 ? fmt.format(new Date(it.time)) : "";
                r.sub.setText(TextUtils.isEmpty(sz) ? dt : sz + " · " + dt);
                r.sub.setTextColor(Ui.MUTED);
            } else {
                r.sub.setText("डाउनलोड हो रही है…");
                r.sub.setTextColor(Ui.ORANGE);
            }
            return conv;
        }
    }

    private class Row {
        final LinearLayout root;
        final TextView title, sub;

        Row() {
            root = new LinearLayout(MyPdfsActivity.this);
            root.setOrientation(LinearLayout.HORIZONTAL);
            root.setGravity(Gravity.CENTER_VERTICAL);
            int p = Ui.dp(MyPdfsActivity.this, 12);
            root.setPadding(p, p, p, p);
            root.setBackground(Ui.ripple(Ui.round(Color.WHITE, Ui.dp(MyPdfsActivity.this, 14)), true));
            ListView.LayoutParams lp = new ListView.LayoutParams(-1, -2);
            root.setLayoutParams(lp);

            ImageView ic = new ImageView(MyPdfsActivity.this);
            ic.setImageResource(R.drawable.ic_pdf);
            ic.setImageTintList(ColorStateList.valueOf(Color.parseColor("#D93025")));
            root.addView(ic, new LinearLayout.LayoutParams(Ui.dp(MyPdfsActivity.this, 36), Ui.dp(MyPdfsActivity.this, 36)));

            LinearLayout col = new LinearLayout(MyPdfsActivity.this);
            col.setOrientation(LinearLayout.VERTICAL);
            col.setPadding(p, 0, 0, 0);
            title = new TextView(MyPdfsActivity.this);
            title.setTextColor(Ui.NAVY);
            title.setTextSize(15);
            title.setTypeface(Typeface.DEFAULT_BOLD);
            title.setMaxLines(2);
            title.setEllipsize(TextUtils.TruncateAt.END);
            sub = new TextView(MyPdfsActivity.this);
            sub.setTextSize(12.5f);
            col.addView(title);
            col.addView(sub);
            root.addView(col, new LinearLayout.LayoutParams(0, -2, 1f));
        }
    }
}
