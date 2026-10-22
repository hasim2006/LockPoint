# RoomTrace Coordinate Conventions & Math Reference

## 1. Coordinate Reference Frame

RoomTrace enforces a standardized, right-handed 3D Cartesian coordinate convention in **meters** across the entire stack:

- **+X**: Right (parallel to the baseline room reference floor)
- **+Y**: Upward (aligned against the gravity normal vector $[0, 1, 0]^T$ via IMU accelerometer)
- **+Z**: Depth / Forward into the room (-Z in standard OpenGL camera local frame, +Z depth in world space)

```
       +Y (Up / Height)
        |
        |
        +------ +X (Right / Width)
       /
      /
    +Z (Depth / Forward)
```

## 2. Measurement Physics & Unit Conventions

- **Storage & Compute**: All backend positions, dimensions, displacements, and transform matrices are stored canonical in **meters** (e.g. `0.43` m).
- **User Presentation**: Distances under 1 meter are dynamically formatted in **centimeters** rounded to the nearest integer (e.g. `43 cm`) with uncertainty intervals (e.g. `±2 cm`). Sub-centimeter shifts are shown in millimeters (e.g. `8 mm`).
- **No False Precision**: Raw floating point precision (such as `43.728491 cm`) is strictly forbidden in user-facing reports.

## 3. Umeyama Rigid Point-Set Registration

Given $N \ge 3$ corresponding points $\{x_i\}$ in Scan 1 and $\{y_i\}$ in Scan 2:

1. **Centroids**:
   $$\mu_x = \frac{1}{N}\sum_{i=1}^N x_i, \quad \mu_y = \frac{1}{N}\sum_{i=1}^N y_i$$
2. **Cross-Covariance Matrix**:
   $$\Sigma_{xy} = \frac{1}{N}\sum_{i=1}^N (x_i - \mu_x)(y_i - \mu_y)^T$$
3. **Singular Value Decomposition**:
   $$\Sigma_{xy} = U D V^T$$
4. **Optimal Rotation**:
   $$R = U S V^T, \quad S = \text{diag}(1, 1, \det(U)\det(V))$$
5. **Optimal Translation**:
   $$t = \mu_x - R \mu_y$$
