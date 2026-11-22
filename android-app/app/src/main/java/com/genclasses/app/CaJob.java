package com.genclasses.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Every couple of hours (when online) reads genclasses.com/ca/daily.json and, once per new day,
 * shows "आज का करंट अफेयर्स आ गया". Quiet between 10 pm and 7 am.
 */
public class CaJob extends JobService {

    static final int JOB_ID = 7001;
    static final String CHANNEL = "daily_ca";
    static final String FEED = "https://genclasses.com/ca/daily.json";
    private static final long PERIOD = 2 * 60 * 60 * 1000L;

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            boolean ok = check(getApplicationContext());
            jobFinished(params, !ok);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("notify", Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) { return prefs(c).getBoolean("on", true); }

    static void setEnabled(Context c, boolean on) {
        prefs(c).edit().putBoolean("on", on).apply();
        if (on) schedule(c);
        else {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js != null) js.cancel(JOB_ID);
        }
    }

    static void schedule(Context c) {
        if (!enabled(c)) return;
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
        JobInfo.Builder b = new JobInfo.Builder(JOB_ID, new ComponentName(c, CaJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPersisted(true);
        if (Build.VERSION.SDK_INT >= 24) b.setPeriodic(PERIOD, 60 * 60 * 1000L);
        else b.setPeriodic(PERIOD);
        try { js.schedule(b.build()); } catch (Exception ignored) { }
    }

    static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "रोज़ का करंट अफेयर्स",
                NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("नया करंट अफेयर्स आने पर सूचना");
        nm.createNotificationChannel(ch);
    }

    /** @return false only when the check should be retried (network error). */
    static boolean check(Context c) {
        if (!enabled(c)) return true;
        TimeZone ist = TimeZone.getTimeZone("Asia/Kolkata");
        Calendar now = Calendar.getInstance(ist);
        int hour = now.get(Calendar.HOUR_OF_DAY);
        if (hour < 7 || hour >= 22) return true;
        try {
            JSONObject root = new JSONObject(fetch(FEED));
            JSONArray days = root.getJSONArray("days");
            if (days.length() == 0) return true;
            JSONObject day = days.getJSONObject(0);
            String date = day.optString("date", "");
            SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
            f.setTimeZone(ist);
            String today = f.format(new Date());
            if (!date.equals(today)) return true;              // nothing new today yet
            SharedPreferences p = prefs(c);
            if (date.equals(p.getString("last", ""))) return true; // already told the user
            JSONArray pts = day.optJSONArray("points");
            int n = pts == null ? 0 : pts.length();
            String first = n > 0 ? pts.getJSONObject(0).optString("hi", "") : "";
            notify(c, n, first);
            p.edit().putString("last", date).apply();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static String fetch(String u) throws Exception {
        HttpURLConnection con = (HttpURLConnection) new URL(u + "?t=" + System.currentTimeMillis()).openConnection();
        con.setConnectTimeout(15000);
        con.setReadTimeout(20000);
        con.setRequestProperty("Cache-Control", "no-cache");
        try (InputStream in = con.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
            return out.toString("UTF-8");
        } finally {
            con.disconnect();
        }
    }

    @SuppressWarnings("deprecation")
    static void notify(Context c, int count, String first) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 24 && !nm.areNotificationsEnabled()) return;
        createChannel(c);
        Intent open = new Intent(c, MainActivity.class)
                .setData(Uri.parse(MainActivity.CA_URL))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(c, 1, open, fl);
        String title = "📰 आज का करंट अफेयर्स आ गया";
        String text = (count > 0 ? count + " नए परीक्षा-उपयोगी बिंदु। " : "") + first;
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_bell)
                .setColor(Ui.ORANGE)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true);
        try { nm.notify(1, b.build()); } catch (SecurityException ignored) { }
    }
}
