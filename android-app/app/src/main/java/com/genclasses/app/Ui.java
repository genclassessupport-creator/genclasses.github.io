package com.genclasses.app;

import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Small shared helpers for the app's native screens (colours, toolbar, insets). */
final class Ui {
    static final int BG = Color.parseColor("#F3EDDF");
    static final int NAVY = Color.parseColor("#1B2A57");
    static final int ORANGE = Color.parseColor("#F58220");
    static final int MUTED = Color.parseColor("#6B7385");
    static final int LINE = Color.parseColor("#22000000");

    private Ui() { }

    static int dp(Context c, float v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    static GradientDrawable round(int color, float radius) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(radius);
        return g;
    }

    static Drawable ripple(Drawable content, boolean bounded) {
        ColorStateList rc = ColorStateList.valueOf(Color.parseColor("#33F58220"));
        Drawable mask = bounded ? round(Color.WHITE, 0) : null;
        return new RippleDrawable(rc, content, mask);
    }

    /** Pads a screen's root so nothing sits under the status bar, navigation bar or keyboard. */
    static void applyInsets(View root) {
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int[] p = bars(insets);
            v.setPadding(p[0], p[1], p[2], p[3]);
            return insets;
        });
    }

    @SuppressWarnings("deprecation")
    static int[] bars(WindowInsets insets) {
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars()
                    | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
            return new int[]{i.left, i.top, i.right, i.bottom};
        }
        return new int[]{insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom()};
    }

    @SuppressWarnings("deprecation")
    static boolean imeVisible(WindowInsets insets) {
        if (Build.VERSION.SDK_INT >= 30) return insets.isVisible(WindowInsets.Type.ime());
        return insets.getSystemWindowInsetBottom() > insets.getStableInsetBottom() + 100;
    }

    /** Light system bars in the cream colour on Android 6+, dark navy bars before that. */
    @SuppressWarnings("deprecation")
    static void edgeToEdgeSafe(Activity a) {
        Window w = a.getWindow();
        if (Build.VERSION.SDK_INT >= 35) return; // edge-to-edge: the root background shows through
        if (Build.VERSION.SDK_INT >= 23) {
            w.setStatusBarColor(BG);
            View d = w.getDecorView();
            int f = d.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                w.setNavigationBarColor(BG);
                f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            d.setSystemUiVisibility(f);
        } else {
            w.setStatusBarColor(NAVY);
            w.setNavigationBarColor(NAVY);
        }
    }

    static ImageView iconButton(Context c, int icon, String label, View.OnClickListener l) {
        ImageView b = new ImageView(c);
        b.setImageResource(icon);
        b.setImageTintList(ColorStateList.valueOf(NAVY));
        b.setScaleType(ImageView.ScaleType.CENTER);
        b.setContentDescription(label);
        b.setBackground(ripple(null, false));
        b.setOnClickListener(l);
        b.setLayoutParams(new LinearLayout.LayoutParams(dp(c, 44), dp(c, 48)));
        if (Build.VERSION.SDK_INT >= 26) b.setTooltipText(label);
        return b;
    }

    /** A plain top bar: back arrow and a one-line title. Callers may append icon buttons. */
    static LinearLayout toolbar(Context c, String title, View.OnClickListener back) {
        LinearLayout bar = new LinearLayout(c);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(BG);
        bar.setPadding(dp(c, 4), 0, dp(c, 4), 0);
        bar.setMinimumHeight(dp(c, 56));
        bar.addView(iconButton(c, R.drawable.ic_back, "वापस", back));
        TextView t = new TextView(c);
        t.setText(title);
        t.setTextColor(NAVY);
        t.setTextSize(17);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setSingleLine(true);
        t.setEllipsize(TextUtils.TruncateAt.END);
        t.setPadding(dp(c, 6), 0, dp(c, 6), 0);
        bar.addView(t, new LinearLayout.LayoutParams(0, -2, 1f));
        bar.setElevation(dp(c, 3));
        return bar;
    }
}
