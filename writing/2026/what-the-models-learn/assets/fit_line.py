import numpy as np
import matplotlib.pyplot as plt
import io
from PIL import Image

np.random.seed(42)

# 10 roughly linear points going up
x = np.linspace(1, 10, 10)
y = 2.0 * x + np.random.normal(0, 2, 10)

# Training params
w = 0.2
alpha = 0.001
frames_data = [(w, None, None)]

for epoch in range(6):
    for i in range(len(x)):
        pred = w * x[i]
        d = pred - y[i]
        frames_data.append((w, i, d))
        w = w - alpha * d * x[i]
        frames_data.append((w, None, None))

# --- Pastel colors ---
TEXT_COLOR = "#3a3a3a"
POINT_COLOR = "#7ba7cc"       # pastel blue
POINT_EDGE = "#a8c8e0"        # lighter pastel blue edge
LINE_COLOR = "#e88a8a"        # pastel red
HIGHLIGHT_COLOR = "#a0cfed"   # light pastel blue for ring
DIST_COLOR = "#a0cfed"        # same for distance line

pil_frames = []

for frame_idx in range(len(frames_data)):
    fig, ax = plt.subplots(figsize=(8, 5))
    fig.patch.set_alpha(0.0)
    ax.set_facecolor("none")
    ax.set_xlim(0, 11)
    ax.set_ylim(-2, 25)
    ax.set_xlabel("x", color=TEXT_COLOR, fontsize=13)
    ax.set_ylabel("y", color=TEXT_COLOR, fontsize=13)
    ax.tick_params(colors=TEXT_COLOR)

    # Only bottom and left spines, colored dark like text
    ax.spines["bottom"].set_color(TEXT_COLOR)
    ax.spines["left"].set_color(TEXT_COLOR)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    w_val, pt_idx, d = frames_data[frame_idx]

    # Line
    x_line = np.linspace(0, 11, 100)
    ax.plot(x_line, w_val * x_line, color=LINE_COLOR, linewidth=2.5)

    # Highlight + distance line
    if pt_idx is not None:
        pred = w_val * x[pt_idx]
        ax.plot([x[pt_idx], x[pt_idx]], [y[pt_idx], pred],
                color=DIST_COLOR, linewidth=1.5, linestyle="--", alpha=0.9)
        ax.plot(x[pt_idx], y[pt_idx], 'o', color="none", ms=14, mew=2,
                mec=HIGHLIGHT_COLOR, zorder=6, fillstyle='none')

    # Scatter points
    ax.scatter(x, y, c=POINT_COLOR, s=60, zorder=5,
               edgecolors=POINT_EDGE, linewidths=0.5)

    # Text
    ax.text(0.5, 23, f"w = {w_val:.4f}", color=TEXT_COLOR,
            fontsize=14, fontfamily="monospace")
    ax.text(7, -1.2, f"y = {w_val:.2f}x", color=LINE_COLOR,
            fontsize=12, fontfamily="monospace")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, transparent=True, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    pil_frames.append(Image.open(buf).copy())
    buf.close()

pil_frames[0].save(
    "/Users/vish/Desktop/hello/gradient_descent.gif",
    save_all=True,
    append_images=pil_frames[1:],
    duration=120,
    loop=0,
    disposal=2,
)
print(f"Saved gradient_descent.gif ({len(pil_frames)} frames)")
