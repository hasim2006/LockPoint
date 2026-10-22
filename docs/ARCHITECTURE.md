# RoomTrace System Architecture

RoomTrace is an end-to-end spatial computing and computer vision platform designed to detect, track, and measure the physical displacement of indoor objects across distinct temporal scans using smartphone AR sensors (ARCore/ARKit).

---

## 1. High-Level System Architecture

RoomTrace separates high-speed capture, API orchestration, and computational spatial geometry into distinct layers:

```
+-------------------------------------------------------------------------+
|                         Mobile Client Layer                             |
|  - Android Native ARCore Bridge (6-DoF, Planes, Feature Point Cloud)     |
|  - Offline SQLite/Queue Sync                                            |
|  - Real-time Scanning HUD & Sensor Quality Meter                        |
+-------------------------------------------------------------------------+
                                    |
                                    v (HTTPS / REST)
+-------------------------------------------------------------------------+
|                       API & Gateway Layer (Fastify)                     |
|  - /api/v1/auth (JWT Access/Refresh, RBAC)                              |
|  - /api/v1/rooms, /api/v1/scans, /api/v1/objects, /api/v1/movements    |
|  - Swagger / OpenAPI Auto-Documentation                                 |
+-------------------------------------------------------------------------+
         |                                           |
         v                                           v
+-----------------------+                 +-------------------------------+
| PostgreSQL 16 DB      |                 | Object Storage (S3 / R2)      |
|  - 24 Normalized      |                 |  - Raw Scans, Point Clouds    |
|    Tables             |                 |  - Plane Meshes & Trajectory  |
+-----------------------+                 +-------------------------------+
         |
         v
+-------------------------------------------------------------------------+
|               Asynchronous Compute & Movement Engine                    |
|  - Scan Registration Pipeline: Umeyama SVD + RANSAC Outlier Rejection   |
|  - 2D-to-3D Raycasting Projection over AR Plane Meshes                  |
|  - Movement Engine: Euclidean, Horizontal, Vertical, & Direction        |
|  - Multi-State Classifier (STABLE, MINOR, SIGNIFICANT, ROTATED_ONLY)   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       Web Dashboard (Next.js 15)                        |
|  - Interactive 3D Canvas Visualizer (Grid, Boxes, Displacement Vectors)  |
|  - Web Scan Simulator with Live Viewport                                |
|  - Executive Movement Reports & Audit Log Exporter                      |
+-------------------------------------------------------------------------+
```

---

## 2. Core Mathematical Workflow

1. **Baseline Scan ($S_1$)**:
   - Camera tracks indoor environment in local metric frame $W_1$.
   - Major planes (floor, tables) and visual feature points are stored.
   - Objects are detected and projected into 3D world space:
     $$P_{3D} = \text{Raycast}(\text{center}(u, v), K^{-1}, T_{C \to W}, \text{Plane})$$
   - Persistent identities (`chair-01`, `laptop-01`) and baseline coordinates are stored.

2. **Follow-Up Scan ($S_2$)**:
   - Camera begins tracking in a brand new local frame $W_2$ with an arbitrary origin.
   - The **Scan-Registration Pipeline** matches planar normal vectors and 3D feature keypoint clusters.
   - Computes rigid body transformation $[R_{12} \mid t_{12}] \in SE(3)$ via **Umeyama algorithm** with **RANSAC outlier rejection**:
     $$p^{(1)} = R_{12} p^{(2)} + t_{12}$$
   - If residual error $\text{RMSE} > 0.08$ m, registration is flagged as uncertain.

3. **Displacement Measurement**:
   - Euclidean distance: $d = \|p_2' - p_1\|_2$
   - Horizontal displacement: $d_h = \sqrt{(\Delta x)^2 + (\Delta z)^2}$
   - Vertical displacement: $d_v = |\Delta y|$
   - Rotation difference: $\Delta \theta = 2 \arccos(|q_1 \cdot q_2'|)$
   - Displacements $< 2$ cm are classified as **STABLE** (sensor noise).
   - Displacements between $2$ cm and $10$ cm are classified as **MINOR_MOVEMENT**.
   - Displacements $\ge 10$ cm are classified as **SIGNIFICANT_MOVEMENT**.
