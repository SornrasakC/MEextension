from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

from PIL import Image, ImageOps, ImageChops, ImageStat


SHUFFLE_PATTERN = [11, 6, 1, 8, 14, 7, 0, 4, 9, 15, 13, 10, 12, 5, 2, 3]
SHAPES = [(1, 16), (2, 8), (4, 4), (8, 2), (16, 1)]
POST_OPS = {
    "identity": lambda im: im,
    "flip_lr": ImageOps.mirror,
    "flip_ud": ImageOps.flip,
    "rot180": lambda im: im.rotate(180, expand=False),
}


@dataclass(frozen=True)
class Result:
    rows: int
    cols: int
    permutation_mode: str
    index_space: str
    dest_transform: str
    src_transform: str
    post_op: str
    mse: float
    note: str
    candidate: Image.Image


def load_image(path: Path) -> Image.Image:
    image = Image.open(path)  # type: ignore[arg-type]
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def center_crop(image: Image.Image, target_size: Tuple[int, int]) -> Image.Image:
    target_w, target_h = target_size
    if target_w > image.width or target_h > image.height:
        raise ValueError("Target size must be smaller than input image")
    if (target_w, target_h) == image.size:
        return image
    left = (image.width - target_w) // 2
    top = (image.height - target_h) // 2
    right = left + target_w
    bottom = top + target_h
    return image.crop((left, top, right, bottom))


def divisible_center_crop(image: Image.Image, rows: int, cols: int) -> Image.Image:
    new_w = image.width - (image.width % cols)
    new_h = image.height - (image.height % rows)
    if new_w <= 0 or new_h <= 0:
        raise ValueError("Invalid crop size derived from rows/cols")
    return center_crop(image, (new_w, new_h))


def split_tiles(image: Image.Image, rows: int, cols: int) -> List[Image.Image]:
    tile_w = image.width // cols
    tile_h = image.height // rows
    tiles = []
    for r in range(rows):
        for c in range(cols):
            left = c * tile_w
            top = r * tile_h
            right = left + tile_w
            bottom = top + tile_h
            tiles.append(image.crop((left, top, right, bottom)))
    return tiles


def combine_tiles(tiles: Sequence[Image.Image], rows: int, cols: int) -> Image.Image:
    assert len(tiles) == rows * cols
    tile_w, tile_h = tiles[0].size
    target = Image.new("RGB", (tile_w * cols, tile_h * rows))
    for idx, tile in enumerate(tiles):
        r = idx // cols
        c = idx % cols
        target.paste(tile, (c * tile_w, r * tile_h))
    return target


def convert_pattern(pattern: Sequence[int], rows: int, cols: int, index_space: str) -> List[int]:
    if index_space == "row":
        return list(pattern)
    if index_space != "col":
        raise ValueError(f"Unknown index space: {index_space}")
    converted = []
    for idx in pattern:
        r = idx % rows
        c = idx // rows
        converted.append(r * cols + c)
    return converted


def apply_permutation(
    tiles: Sequence[Image.Image], pattern: Sequence[int], mode: str
) -> List[Image.Image]:
    n = len(pattern)
    if len(tiles) != n:
        raise ValueError("Tile count and pattern length do not match")
    if mode == "dst_from_src":
        # The pattern tells us where each source tile moves to.
        ordered = [None] * n
        for src_idx, dst_idx in enumerate(pattern):
            ordered[dst_idx] = tiles[src_idx]
        return ordered  # type: ignore[return-value]
    if mode == "src_from_dst":
        # The pattern lists source indices for each destination slot.
        return [tiles[src_idx] for src_idx in pattern]
    raise ValueError(f"Unknown permutation mode: {mode}")


def mse_score(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(a, b)
    stats = ImageStat.Stat(diff)
    channel_mses = [(rms ** 2) / (255.0 ** 2) for rms in stats.rms]
    return float(sum(channel_mses) / len(channel_mses))


def crop_to_ratio(image: Image.Image, ratio: float) -> Image.Image:
    current_ratio = image.width / image.height
    if abs(current_ratio - ratio) < 1e-6:
        return image
    if current_ratio > ratio:
        # Trim width to match target ratio.
        new_w = int(round(image.height * ratio))
        new_w = max(1, min(new_w, image.width))
        return center_crop(image, (new_w, image.height))
    # Trim height instead.
    new_h = int(round(image.width / ratio))
    new_h = max(1, min(new_h, image.height))
    return center_crop(image, (image.width, new_h))


def prepare_solution_for_shape(
    solution: Image.Image, target_size: Tuple[int, int], rows: int, cols: int
) -> Image.Image:
    target_ratio = target_size[0] / target_size[1]
    adjusted = crop_to_ratio(solution, target_ratio)
    resized = adjusted.resize(target_size, Image.LANCZOS)
    return divisible_center_crop(resized, rows, cols)


def build_transforms(rows: int, cols: int) -> dict[str, Tuple]:
    def identity(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return r, c

    def flip_lr(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return r, cols - 1 - c

    def flip_ud(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return rows - 1 - r, c

    def rot180(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return rows - 1 - r, cols - 1 - c

    def transpose(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return c, r

    def anti_transpose(r: int, c: int, rows: int, cols: int) -> Tuple[int, int]:
        return cols - 1 - c, rows - 1 - r

    transforms: dict[str, Tuple] = {
        "identity": (identity, rows, cols),
        "flip_lr": (flip_lr, rows, cols),
        "flip_ud": (flip_ud, rows, cols),
        "rot180": (rot180, rows, cols),
    }

    if rows == cols:
        transforms["transpose"] = (transpose, rows, cols)
        transforms["anti_transpose"] = (anti_transpose, rows, cols)
    return transforms


def apply_dest_transform(
    pattern: Sequence[int], rows: int, cols: int, transform: Tuple
) -> List[int]:
    fn, tr_rows, tr_cols = transform
    if tr_rows != rows or tr_cols != cols:
        # For now we only support transforms that keep dimensions.
        raise ValueError("Transform incompatible with dimensions")
    matrix = [list(pattern[i * cols : (i + 1) * cols]) for i in range(rows)]
    transformed = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            nr, nc = fn(r, c, rows, cols)
            transformed[nr][nc] = matrix[r][c]
    return [val for row in transformed for val in row]


def apply_src_transform(
    value: int, rows: int, cols: int, transform: Tuple
) -> int:
    fn, tr_rows, tr_cols = transform
    if tr_rows != rows or tr_cols != cols:
        raise ValueError("Transform incompatible with dimensions")
    r = value // cols
    c = value % cols
    nr, nc = fn(r, c, rows, cols)
    return nr * cols + nc


def evaluate(
    master_img: Image.Image, solution_img: Image.Image
) -> Iterable[Result]:
    for rows, cols in SHAPES:
        try:
            master_cropped = divisible_center_crop(master_img, rows, cols)
        except ValueError:
            continue
        solution_prepared = prepare_solution_for_shape(solution_img, master_cropped.size, rows, cols)
        tiles = split_tiles(master_cropped, rows, cols)
        dest_transforms = build_transforms(rows, cols)
        src_transforms = dest_transforms  # identical options
        for index_space in ("row", "col"):
            pattern = convert_pattern(SHUFFLE_PATTERN, rows, cols, index_space)
            for dest_name, dest_transform in dest_transforms.items():
                try:
                    dest_adjusted = apply_dest_transform(pattern, rows, cols, dest_transform)
                except ValueError:
                    continue
                for src_name, src_transform in src_transforms.items():
                    try:
                        transformed_pattern = [
                            apply_src_transform(val, rows, cols, src_transform)
                            for val in dest_adjusted
                        ]
                    except ValueError:
                        continue
                    for perm_mode in ("dst_from_src", "src_from_dst"):
                        try:
                            ordered_tiles = apply_permutation(tiles, transformed_pattern, perm_mode)
                        except ValueError as exc:
                            note = f"permutation error: {exc}"
                            yield Result(
                                rows,
                                cols,
                                perm_mode,
                                index_space,
                                dest_name,
                                src_name,
                                "identity",
                                float("inf"),
                                note,
                                master_cropped,
                            )
                            continue
                        candidate = combine_tiles(ordered_tiles, rows, cols)
                        for post_name, post_fn in POST_OPS.items():
                            candidate_adj = post_fn(candidate)
                            mse = mse_score(candidate_adj, solution_prepared)
                            note = "ok"
                            yield Result(
                                rows,
                                cols,
                                perm_mode,
                                index_space,
                                dest_name,
                                src_name,
                                post_name,
                                mse,
                                note,
                                candidate_adj,
                            )


def main() -> None:
    base = Path(__file__).resolve().parent
    solution = load_image(base / "02-unshuffled.png")
    shuffled = load_image(base / "master-1759733957358-02.jpg")

    results = sorted(evaluate(shuffled, solution), key=lambda r: r.mse)
    for result in results[:10]:
        print(
            f"rows={result.rows:2d} cols={result.cols:2d} "
            f"mode={result.permutation_mode:12s} index={result.index_space:3s} "
            f"dest={result.dest_transform:12s} src={result.src_transform:12s} "
            f"post={result.post_op:8s} mse={result.mse:.6f} note={result.note}"
        )
    best = results[0]
    out_name = (
        f"candidate_{best.rows}x{best.cols}_{best.permutation_mode}"
        f"_{best.index_space}_{best.dest_transform}_{best.src_transform}_{best.post_op}.png"
    )
    out_path = Path("shuffler") / out_name
    best.candidate.save(out_path)
    resized_path = Path("shuffler") / f"{out_path.stem}_to_original.png"
    best.candidate.resize(solution.size, Image.LANCZOS).save(resized_path)
    print(f"Best candidate saved to {out_path}")
    print(f"Resized candidate (original dimensions) saved to {resized_path}")


if __name__ == "__main__":
    main()
