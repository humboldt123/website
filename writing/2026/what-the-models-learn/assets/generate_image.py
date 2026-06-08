"""
Generate a single image with FLUX.1-dev for the essay.
Prompt: AI-generated image of realistic, well-rendered hands.
"""

import torch
from diffusers import FluxPipeline

DEVICE = "cuda:3"
DTYPE  = torch.bfloat16

PROMPT = (
    "anime illustration, a single human hand and arm reaching away, "
    "toward a small distant bright white-gold starburst far above, "
    "low angle perspective looking up, warm golden rim light on the edges of the fingers, "
    "moody deep blue twilight sky, atmospheric haze, "
    "beautifully rendered, studio ghibli style, "
    "cinematic lighting, "
    "clean minimal linework, flat cel shading, simple hand"
)

NEGATIVE = "detailed, wrinkles, skin texture, realistic skin, linework on palm"
OUTPUT = "/home/vvm33/essay/hands.png"

print("Loading FLUX.1-dev ...")
pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev",
    torch_dtype=DTYPE,
    token="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",
)
pipe = pipe.to(DEVICE)
pipe.set_progress_bar_config(disable=True)

print("Generating image ...")
gen = torch.Generator(device=DEVICE).manual_seed(1337)
with torch.autocast("cuda", dtype=DTYPE):
    out = pipe(
        prompt=PROMPT,
        height=512,
        width=512,
        num_inference_steps=28,
        guidance_scale=3.5,
        generator=gen,
        output_type="pil",
    )

img = out.images[0]
img.save(OUTPUT)
print(f"Saved to {OUTPUT}")
