package com.genclasses.app;

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** PDFs this app downloaded, read back from the system DownloadManager (works offline). */
final class Pdfs {

    static final class Item {
        long id;
        String title;
        String url;
        long size;
        long time;
        int status;

        boolean done() { return status == DownloadManager.STATUS_SUCCESSFUL; }
    }

    private Pdfs() { }

    static DownloadManager dm(Context c) {
        return (DownloadManager) c.getSystemService(Context.DOWNLOAD_SERVICE);
    }

    static List<Item> list(Context c) {
        List<Item> out = new ArrayList<>();
        DownloadManager dm = dm(c);
        if (dm == null) return out;
        try (Cursor cur = dm.query(new DownloadManager.Query())) {
            if (cur == null) return out;
            int cId = cur.getColumnIndex(DownloadManager.COLUMN_ID);
            int cTitle = cur.getColumnIndex(DownloadManager.COLUMN_TITLE);
            int cUri = cur.getColumnIndex(DownloadManager.COLUMN_URI);
            int cSize = cur.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
            int cTime = cur.getColumnIndex(DownloadManager.COLUMN_LAST_MODIFIED_TIMESTAMP);
            int cStatus = cur.getColumnIndex(DownloadManager.COLUMN_STATUS);
            int cMime = cur.getColumnIndex(DownloadManager.COLUMN_MEDIA_TYPE);
            while (cur.moveToNext()) {
                Item it = new Item();
                it.id = cur.getLong(cId);
                it.title = cur.getString(cTitle);
                it.url = cur.getString(cUri);
                it.size = cur.getLong(cSize);
                it.time = cur.getLong(cTime);
                it.status = cur.getInt(cStatus);
                String mime = cMime >= 0 ? cur.getString(cMime) : null;
                boolean pdf = (mime != null && mime.contains("pdf"))
                        || (it.title != null && it.title.toLowerCase(Locale.ROOT).endsWith(".pdf"));
                if (!pdf || it.status == DownloadManager.STATUS_FAILED) continue;
                if (it.done() && !readable(c, it.id)) continue; // file removed from the phone
                out.add(it);
            }
        } catch (Exception ignored) { }
        java.util.Collections.sort(out, (a, b) -> Long.compare(b.time, a.time));
        return out;
    }

    /** A finished download of this exact URL that is still on the phone, or null. */
    static Item findDone(Context c, String url) {
        if (url == null) return null;
        for (Item it : list(c)) if (it.done() && url.equals(it.url)) return it;
        return null;
    }

    static Uri uri(Context c, long id) {
        DownloadManager dm = dm(c);
        return dm == null ? null : dm.getUriForDownloadedFile(id);
    }

    static boolean readable(Context c, long id) {
        try {
            Uri u = uri(c, id);
            if (u == null) return false;
            ParcelFileDescriptor p = c.getContentResolver().openFileDescriptor(u, "r");
            if (p == null) return false;
            p.close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static void openInApp(Context c, Item it) {
        Intent i = new Intent(c, PdfViewerActivity.class);
        i.putExtra("id", it.id);
        i.putExtra("title", it.title);
        c.startActivity(i);
    }

    static void openOutside(Context c, long id) {
        Uri u = uri(c, id);
        if (u == null) return;
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(u, "application/pdf");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            c.startActivity(Intent.createChooser(i, "PDF खोलें"));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(c, "फ़ोन में PDF खोलने वाला कोई ऐप नहीं मिला", Toast.LENGTH_SHORT).show();
        }
    }

    static void share(Context c, long id, String title) {
        Uri u = uri(c, id);
        if (u == null) return;
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("application/pdf");
        i.putExtra(Intent.EXTRA_STREAM, u);
        i.putExtra(Intent.EXTRA_TEXT, (title == null ? "" : title + "\n") + "GenClasses ऐप: https://genclasses.com/app/");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            c.startActivity(Intent.createChooser(i, "PDF शेयर करें"));
        } catch (ActivityNotFoundException ignored) { }
    }

    static String size(long b) {
        if (b <= 0) return "";
        if (b < 1024 * 1024) return Math.max(1, b / 1024) + " KB";
        return String.format(Locale.ROOT, "%.1f MB", b / (1024f * 1024f));
    }
}
