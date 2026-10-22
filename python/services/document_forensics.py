"""
Document forensic analysis — real pixel-level checks, no LLM needed.

Techniques:
1. EXIF Metadata — detect editing software signatures
2. Error Level Analysis (ELA) — find tampered regions via JPEG recompression
3. Noise Consistency — uniform sensor noise = real camera, patchy = edited
4. Statistical Analysis — entropy, color distribution, edge sharpness
"""

import io
import math
import struct
import httpx
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ExifTags


async def fetch_image(url: str) -> Image.Image:
    """Download image from URL and return as PIL Image."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))


def check_exif_metadata(img: Image.Image) -> dict:
    """
    Check EXIF metadata for signs of editing software.
    Real camera photos have rich EXIF; AI/edited images often have none or tool signatures.
    """
    result = {"passed": None, "detail": "", "software": None, "has_camera_info": False}

    try:
        exif = img._getexif()
        if exif is None:
            result["detail"] = "No EXIF metadata found — could be a screenshot, scan, or AI-generated image"
            result["passed"] = None  # inconclusive
            return result

        exif_data = {}
        for tag_id, value in exif.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if isinstance(value, bytes):
                continue  # skip binary data
            exif_data[tag] = str(value)

        # Check for editing software
        software = exif_data.get("Software", "")
        processing = exif_data.get("ProcessingSoftware", "")
        tool = software or processing

        suspicious_tools = ["photoshop", "gimp", "affinity", "canva", "figma", "illustrator",
                           "midjourney", "dall-e", "stable diffusion", "ai", "generated"]

        if tool:
            result["software"] = tool
            tool_lower = tool.lower()
            if any(s in tool_lower for s in suspicious_tools):
                result["passed"] = False
                result["detail"] = f"Editing software detected in metadata: {tool}"
                return result

        # Check for camera info (real photos have Make/Model)
        make = exif_data.get("Make", "")
        model = exif_data.get("Model", "")
        if make or model:
            result["has_camera_info"] = True
            result["passed"] = True
            result["detail"] = f"Camera metadata found: {make} {model}".strip()
        else:
            result["passed"] = None
            result["detail"] = f"EXIF present but no camera info{f' — Software: {tool}' if tool else ''}"

    except Exception:
        result["detail"] = "Could not read EXIF metadata"
        result["passed"] = None

    return result


def error_level_analysis(img: Image.Image, quality: int = 90) -> dict:
    """
    ELA: Re-save the image at known quality and compare.
    Tampered regions show higher error levels than untampered regions.
    A uniform ELA image = likely untampered. High-variance ELA = suspicious.
    """
    result = {"passed": None, "detail": "", "max_error": 0, "mean_error": 0, "variance": 0}

    try:
        # Convert to RGB
        rgb = img.convert("RGB")

        # Re-save at known quality
        buffer = io.BytesIO()
        rgb.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer)

        # Compute difference
        diff = ImageChops.difference(rgb, resaved)
        diff_array = np.array(diff, dtype=np.float64)

        # Scale for visibility (ELA typically has very low values)
        ela_values = diff_array.mean(axis=2)  # Average across RGB channels

        max_error = float(np.max(ela_values))
        mean_error = float(np.mean(ela_values))
        variance = float(np.var(ela_values))

        result["max_error"] = round(max_error, 2)
        result["mean_error"] = round(mean_error, 2)
        result["variance"] = round(variance, 2)

        # High variance in ELA suggests different regions were compressed differently
        # (i.e., some regions were pasted in from another image)
        if variance > 50:
            result["passed"] = False
            result["detail"] = f"High ELA variance ({variance:.1f}) — regions show inconsistent compression, suggesting tampering"
        elif variance > 25:
            result["passed"] = None
            result["detail"] = f"Moderate ELA variance ({variance:.1f}) — minor inconsistencies detected"
        else:
            result["passed"] = True
            result["detail"] = f"Uniform compression levels (variance {variance:.1f}) — no tampering signs"

    except Exception as e:
        result["detail"] = f"ELA analysis failed: {str(e)}"

    return result


def noise_consistency_check(img: Image.Image) -> dict:
    """
    Real camera photos have consistent sensor noise across the image.
    AI-generated images have unnaturally smooth areas or patchy noise.
    Edited images have noise mismatches between original and pasted regions.
    """
    result = {"passed": None, "detail": "", "noise_std": 0, "noise_uniformity": 0}

    try:
        rgb = img.convert("RGB")
        arr = np.array(rgb, dtype=np.float64)

        # Extract high-frequency noise using Laplacian-like filter
        # Split image into blocks and compare noise levels
        h, w = arr.shape[:2]
        block_size = max(32, min(h, w) // 8)
        noise_levels = []

        for y in range(0, h - block_size, block_size):
            for x in range(0, w - block_size, block_size):
                block = arr[y:y+block_size, x:x+block_size]
                # High-pass filter: standard deviation of Laplacian
                gray_block = block.mean(axis=2)
                laplacian = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float64)
                from scipy.signal import convolve2d
                filtered = convolve2d(gray_block, laplacian, mode='valid')
                noise_levels.append(float(np.std(filtered)))

        if len(noise_levels) < 4:
            result["detail"] = "Image too small for noise analysis"
            return result

        noise_std = float(np.std(noise_levels))
        noise_mean = float(np.mean(noise_levels))
        uniformity = 1.0 - (noise_std / (noise_mean + 1e-8))  # 1.0 = perfectly uniform

        result["noise_std"] = round(noise_std, 2)
        result["noise_uniformity"] = round(max(0, min(1, uniformity)), 3)

        if uniformity > 0.7:
            result["passed"] = True
            result["detail"] = f"Noise pattern is consistent ({uniformity:.0%} uniform) — typical of real camera photo"
        elif uniformity > 0.4:
            result["passed"] = None
            result["detail"] = f"Moderate noise variation ({uniformity:.0%} uniform) — could be compression or mild editing"
        else:
            result["passed"] = False
            result["detail"] = f"Inconsistent noise pattern ({uniformity:.0%} uniform) — different regions have different noise levels"

    except ImportError:
        # scipy not available — fallback to simpler check
        try:
            rgb = img.convert("RGB")
            arr = np.array(rgb, dtype=np.float64)
            gray = arr.mean(axis=2)

            # Simple: compare std of top half vs bottom half
            mid = gray.shape[0] // 2
            top_std = float(np.std(gray[:mid]))
            bot_std = float(np.std(gray[mid:]))
            ratio = min(top_std, bot_std) / (max(top_std, bot_std) + 1e-8)

            result["noise_uniformity"] = round(ratio, 3)
            if ratio > 0.7:
                result["passed"] = True
                result["detail"] = f"Noise levels consistent between image halves ({ratio:.0%})"
            elif ratio > 0.4:
                result["passed"] = None
                result["detail"] = f"Some noise variation between image regions ({ratio:.0%})"
            else:
                result["passed"] = False
                result["detail"] = f"Significant noise mismatch between regions ({ratio:.0%})"
        except Exception:
            result["detail"] = "Noise analysis unavailable"

    except Exception as e:
        result["detail"] = f"Noise analysis failed: {str(e)}"

    return result


def statistical_analysis(img: Image.Image) -> dict:
    """
    Statistical checks:
    - Entropy: real photos have high entropy; simple fakes/templates have low
    - Color distribution: AI images often have unusual color histograms
    - Edge sharpness: AI images tend to have unnaturally sharp or uniformly soft edges
    """
    result = {"passed": None, "detail": "", "entropy": 0, "edge_score": 0}

    try:
        rgb = img.convert("RGB")
        gray = img.convert("L")

        # Entropy (information density)
        entropy = gray.entropy()
        result["entropy"] = round(entropy, 2)

        # Edge analysis
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_arr = np.array(edges, dtype=np.float64)
        edge_mean = float(np.mean(edge_arr))
        edge_std = float(np.std(edge_arr))
        result["edge_score"] = round(edge_mean, 2)

        # Color channel correlation (natural images have correlated R/G/B)
        arr = np.array(rgb, dtype=np.float64)
        r, g, b = arr[:,:,0].flatten(), arr[:,:,1].flatten(), arr[:,:,2].flatten()
        rg_corr = float(np.corrcoef(r, g)[0, 1])
        rb_corr = float(np.corrcoef(r, b)[0, 1])

        issues = []

        # Very low entropy = likely a simple template or solid colors
        if entropy < 4.0:
            issues.append(f"Very low entropy ({entropy:.1f}) — image lacks natural complexity")
        # Very high uniform edges = AI sharpening artifact
        if edge_std < 10 and edge_mean > 30:
            issues.append("Unnaturally uniform edge sharpness — possible AI generation")
        # Low color correlation = unusual for natural images
        if rg_corr < 0.3 or rb_corr < 0.3:
            issues.append(f"Unusual color channel correlation (R-G: {rg_corr:.2f}, R-B: {rb_corr:.2f})")

        if len(issues) >= 2:
            result["passed"] = False
            result["detail"] = "; ".join(issues)
        elif len(issues) == 1:
            result["passed"] = None
            result["detail"] = issues[0]
        else:
            result["passed"] = True
            result["detail"] = f"Image statistics look natural (entropy: {entropy:.1f}, edge clarity: {edge_mean:.0f})"

    except Exception as e:
        result["detail"] = f"Statistical analysis failed: {str(e)}"

    return result


async def verify_document(image_url: str, expected_type: str = "document") -> dict:
    """
    Run all forensic checks on a document image and return a combined verdict.
    """
    try:
        img = await fetch_image(image_url)
    except Exception as e:
        return {
            "authentic": False,
            "confidence": 30,
            "verdict": "suspicious",
            "reasons": [f"Could not download image: {str(e)}"],
            "documentType": expected_type,
            "checks": {},
        }

    # Run all checks
    exif_result = check_exif_metadata(img)
    ela_result = error_level_analysis(img)
    noise_result = noise_consistency_check(img)
    stats_result = statistical_analysis(img)

    checks = {
        "metadataCheck": exif_result,
        "tamperCheck": ela_result,
        "noiseCheck": noise_result,
        "statisticalCheck": stats_result,
    }

    # Score: count passes, fails, and inconclusives
    passes = sum(1 for c in checks.values() if c.get("passed") is True)
    fails = sum(1 for c in checks.values() if c.get("passed") is False)
    inconclusive = sum(1 for c in checks.values() if c.get("passed") is None)

    reasons = []
    for name, check in checks.items():
        if check.get("detail"):
            reasons.append(check["detail"])

    # Determine verdict
    if fails >= 2:
        verdict = "likely_fake"
        confidence = min(95, 60 + fails * 15)
        authentic = False
    elif fails == 1:
        verdict = "suspicious"
        confidence = 55 + passes * 10
        authentic = False
    elif passes >= 3:
        verdict = "authentic"
        confidence = min(95, 50 + passes * 15)
        authentic = True
    else:
        verdict = "suspicious" if inconclusive >= 3 else "authentic"
        confidence = 50 + passes * 10
        authentic = verdict == "authentic"

    return {
        "authentic": authentic,
        "confidence": min(95, max(30, confidence)),
        "verdict": verdict,
        "reasons": reasons[:5],
        "documentType": expected_type,
        "checks": checks,
        "analysis": {
            "checks_passed": passes,
            "checks_failed": fails,
            "checks_inconclusive": inconclusive,
        },
    }
