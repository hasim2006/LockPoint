package com.roomtrace.ar

import android.content.Context
import android.util.Log
import com.google.ar.core.*
import com.google.ar.core.exceptions.*
import java.nio.FloatBuffer

/**
 * RoomTrace ARCore Native Scanner Module
 * Provides direct bridge to Google ARCore native APIs for Android devices.
 * Extracts 6-DoF camera poses, planar anchor meshes, 3D point cloud feature points,
 * and raycast hit testing for millimeter/centimeter spatial tracking.
 */
class ARCoreScannerModule(private val context: Context) {

    private var arSession: Session? = null
    private var isTracking = false
    private val TAG = "RoomTraceARCore"

    interface ARScanCallback {
        fun onTrackingQualityUpdated(qualityScore: Int, featureCount: Int, planeCount: Int, lightLux: Float)
        fun onPlaneDetected(planeId: String, normal: FloatArray, center: FloatArray, extentX: Float, extentZ: Float)
        fun onPointCloudUpdated(points: FloatArray)
        fun onError(errorCode: String, message: String)
    }

    /**
     * Initializes Google ARCore session with HDR lighting and horizontal/vertical plane finding
     */
    fun initializeSession(callback: ARScanCallback): Boolean {
        try {
            val availability = ArCoreApk.getInstance().checkAvailability(context)
            if (availability.isTransient) {
                Log.i(TAG, "ARCore availability checking...")
            }
            if (!availability.isSupported) {
                callback.onError("AR_NOT_SUPPORTED", "Google ARCore is not supported on this device hardware")
                return false
            }

            arSession = Session(context).apply {
                val config = Config(this).apply {
                    focusMode = Config.FocusMode.AUTO
                    planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                    lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
                    updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
                }
                configure(config)
            }
            arSession?.resume()
            isTracking = true
            Log.i(TAG, "ARCore Session initialized successfully")
            return true
        } catch (e: UnavailableArcoreNotInstalledException) {
            callback.onError("ARCORE_NOT_INSTALLED", "Please install Google Play Services for AR")
        } catch (e: UnavailableDeviceNotCompatibleException) {
            callback.onError("DEVICE_INCOMPATIBLE", "This device does not meet ARCore hardware requirements")
        } catch (e: Exception) {
            callback.onError("INIT_FAILED", e.message ?: "Unknown ARCore session initialization error")
        }
        return false
    }

    /**
     * Process each camera frame during room scan pass
     */
    fun processFrame(frame: Frame, callback: ARScanCallback) {
        val camera = frame.camera
        val trackingState = camera.trackingState

        if (trackingState != TrackingState.TRACKING) {
            callback.onTrackingQualityUpdated(20, 0, 0, 0f)
            return
        }

        // 1. Camera Pose Matrix (4x4 column-major)
        val cameraPose = camera.pose
        val poseMatrix = FloatArray(16)
        cameraPose.toMatrix(poseMatrix, 0)

        // 2. Light estimation
        val lightLux = frame.lightEstimate.averagePixelIntensity * 500f

        // 3. Detected Planar Anchors
        val planes = arSession?.getAllTrackables(Plane::class.java) ?: emptyList()
        var validPlanesCount = 0
        for (plane in planes) {
            if (plane.trackingState == TrackingState.TRACKING && plane.subsumedBy == null) {
                validPlanesCount++
                val center = floatArrayOf(plane.centerPose.tx(), plane.centerPose.ty(), plane.centerPose.tz())
                val normal = floatArrayOf(0f, 1f, 0f) // Default upward normal for horizontal floor
                callback.onPlaneDetected(
                    plane.hashCode().toString(),
                    normal,
                    center,
                    plane.extentX,
                    plane.extentZ
                )
            }
        }

        // 4. Point Cloud Features
        frame.acquirePointCloud().use { pointCloud ->
            val pointsBuffer: FloatBuffer = pointCloud.points
            val featurePoints = FloatArray(pointsBuffer.remaining())
            pointsBuffer.get(featurePoints)
            val featureCount = featurePoints.size / 4 // (x, y, z, confidence)
            callback.onPointCloudUpdated(featurePoints)

            // Compute composite quality score [0 - 100]
            val featureScore = Math.min(60, (featureCount / 20))
            val planeScore = Math.min(30, (validPlanesCount * 10))
            val lightScore = if (lightLux in 100f..1500f) 10 else 5
            val qualityScore = featureScore + planeScore + lightScore

            callback.onTrackingQualityUpdated(qualityScore, featureCount, validPlanesCount, lightLux)
        }
    }

    /**
     * Perform Raycast hit test from 2D pixel coordinate (e.g. object bounding box center)
     * onto detected 3D physical surfaces
     */
    fun hitTest(pixelX: Float, pixelY: Float, frame: Frame): FloatArray? {
        val hitResults = frame.hitTest(pixelX, pixelY)
        for (hit in hitResults) {
            val trackable = hit.trackable
            if (trackable is Plane && trackable.isPoseInPolygon(hit.hitPose)) {
                val hitPose = hit.hitPose
                // Returns [x, y, z, qx, qy, qz, qw] in metric meters
                return floatArrayOf(
                    hitPose.tx(),
                    hitPose.ty(),
                    hitPose.tz(),
                    hitPose.qx(),
                    hitPose.qy(),
                    hitPose.qz(),
                    hitPose.qw()
                )
            }
        }
        return null
    }

    fun pause() {
        arSession?.pause()
        isTracking = false
    }

    fun destroy() {
        arSession?.close()
        arSession = null
        isTracking = false
    }
}
