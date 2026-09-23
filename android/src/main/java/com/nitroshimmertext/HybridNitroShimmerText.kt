package com.nitroshimmertext

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Build
import android.text.TextPaint
import android.text.TextUtils
import android.util.TypedValue
import android.view.View
import android.view.animation.LinearInterpolator
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.ThemedReactContext
import com.margelo.nitro.nitroshimmertext.FontWeight
import com.margelo.nitro.nitroshimmertext.HybridNitroShimmerTextSpec

// MARK: - ShimmerTextView

private class ShimmerTextView(context: Context) : View(context) {
    var text: String = ""
        set(value) {
            if (field == value) return
            field = value
            contentDescription = value
            measurementsDirty = true
            updateAnimationState()
            invalidate()
        }

    var baseColor: Int = DEFAULT_BASE_COLOR
        set(value) {
            if (field == value) return
            field = value
            basePaint.color = value
            invalidate()
        }

    var highlightColor: Int = DEFAULT_HIGHLIGHT_COLOR
        set(value) {
            if (field == value) return
            field = value
            cachedShader = null
            invalidate()
        }

    var textSizePx: Float = 48f
        set(value) {
            if (field == value) return
            field = value
            basePaint.textSize = value
            shimmerPaint.textSize = value
            measurementsDirty = true
            invalidate()
        }

    var typeface: Typeface = Typeface.DEFAULT
        set(value) {
            if (field == value) return
            field = value
            basePaint.typeface = value
            shimmerPaint.typeface = value
            measurementsDirty = true
            invalidate()
        }

    var animDuration: Long = 1500L
        set(value) {
            if (field == value) return
            field = value
            animator?.duration = value
        }

    private val basePaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = textSizePx
        typeface = this@ShimmerTextView.typeface
        color = baseColor
    }
    private val shimmerPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = textSizePx
        typeface = this@ShimmerTextView.typeface
    }
    private val shaderMatrix = Matrix()

    // Cached text measurements — recomputed only when text/font/size changes
    private var measurementsDirty: Boolean = true
    private var displayText: String = ""
    private var textX: Float = 0f
    private var textY: Float = 0f

    private fun ensureMeasurements() {
        if (!measurementsDirty) return
        val available = width.toFloat()
        // Truncate with an ellipsis when the view is narrower than the text (matches iOS UILabel)
        displayText = if (text.isNotEmpty() && available > 0f && basePaint.measureText(text) > available) {
            TextUtils.ellipsize(text, basePaint, available, TextUtils.TruncateAt.END).toString()
        } else {
            text
        }
        val fm = basePaint.fontMetrics
        textX = (available - basePaint.measureText(displayText)) / 2f
        textY = (height - (fm.descent + fm.ascent)) / 2f
        measurementsDirty = false
    }

    /** Returns the natural text size in pixels using the current font config. */
    fun measureNaturalSize(): Pair<Float, Float> {
        if (text.isEmpty()) return 0f to 0f
        val w = basePaint.measureText(text)
        val fm = basePaint.fontMetrics
        return w to (fm.descent - fm.ascent)
    }

    // Cached shader — recreated only when size or highlight color changes
    private var cachedShader: LinearGradient? = null
    private var cachedShaderWidth: Float = 0f

    // Normalised sweep position: 0 (off-screen left) → 1 (off-screen right)
    private var sweepOffset: Float = 0f
    private var animator: ValueAnimator? = null
    private var isVisibleToUser: Boolean = true

    init {
        // Plain View subclasses can be flagged WILL_NOT_DRAW under hardware acceleration;
        // force onDraw to be called.
        setWillNotDraw(false)
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    private fun animatorsEnabled(): Boolean =
        // Respects "Remove animations" / animator duration scale 0 in system settings
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || ValueAnimator.areAnimatorsEnabled()

    private fun updateAnimationState() {
        val shouldAnimate = isAttachedToWindow && isVisibleToUser && text.isNotEmpty() && animatorsEnabled()
        if (!shouldAnimate) {
            if (animator != null) {
                animator?.cancel()
                animator = null
                invalidate()
            }
            return
        }
        if (animator != null) return
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = animDuration
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
            addUpdateListener { anim ->
                // animatedFraction returns primitive float — avoids the
                // Float boxing that animatedValue triggers every frame
                sweepOffset = anim.animatedFraction
                invalidate()
            }
            start()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        updateAnimationState()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        updateAnimationState()
    }

    override fun onVisibilityAggregated(isVisible: Boolean) {
        // Only called on API 24+; on older devices the animation simply keeps running while hidden
        super.onVisibilityAggregated(isVisible)
        isVisibleToUser = isVisible
        updateAnimationState()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        measurementsDirty = true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (text.isEmpty()) return

        ensureMeasurements()

        // Draw base text
        canvas.drawText(displayText, textX, textY, basePaint)

        // Without a running sweep (e.g. animations disabled) show only the base text
        if (animator == null) return

        // Rebuild shader only when view width or highlight color changed
        val w = width.toFloat()
        var shader = cachedShader
        if (shader == null || cachedShaderWidth != w) {
            shader = LinearGradient(
                0f, 0f, w, 0f,
                intArrayOf(Color.TRANSPARENT, highlightColor, Color.TRANSPARENT),
                floatArrayOf(0.3f, 0.5f, 0.7f),
                Shader.TileMode.CLAMP
            )
            cachedShader = shader
            cachedShaderWidth = w
            shimmerPaint.shader = shader
        }

        // Translate gradient: bright band sweeps from -w (off-screen left) to +w (off-screen right)
        // matching the 2×width sweep distance of the iOS CAAnimation
        shaderMatrix.setTranslate((sweepOffset * 2f - 1f) * w, 0f)
        shader.setLocalMatrix(shaderMatrix)

        canvas.drawText(displayText, textX, textY, shimmerPaint)
    }

    companion object {
        val DEFAULT_BASE_COLOR: Int = Color.rgb(128, 128, 128)
        val DEFAULT_HIGHLIGHT_COLOR: Int = Color.WHITE
    }
}

// MARK: - HybridNitroShimmerText

@Keep
@DoNotStrip
class HybridNitroShimmerText(val context: ThemedReactContext) : HybridNitroShimmerTextSpec() {
    private val shimmerView = ShimmerTextView(context)
    override val view: View = shimmerView

    private var _text: String = ""
    override var text: String
        get() = _text
        set(value) { _text = value; shimmerView.text = value }

    private var _shimmerBaseColor: Double? = null
    override var shimmerBaseColor: Double?
        get() = _shimmerBaseColor
        set(value) {
            _shimmerBaseColor = value
            shimmerView.baseColor = toColorInt(value, ShimmerTextView.DEFAULT_BASE_COLOR)
        }

    private var _shimmerHighlightColor: Double? = null
    override var shimmerHighlightColor: Double?
        get() = _shimmerHighlightColor
        set(value) {
            _shimmerHighlightColor = value
            shimmerView.highlightColor = toColorInt(value, ShimmerTextView.DEFAULT_HIGHLIGHT_COLOR)
        }

    private var _shimmerDuration: Double? = null
    override var shimmerDuration: Double?
        get() = _shimmerDuration
        set(value) { _shimmerDuration = value; shimmerView.animDuration = (value ?: 1500.0).toLong() }

    private var _fontSize: Double? = null
    override var fontSize: Double?
        get() = _fontSize
        set(value) { _fontSize = value; updateTextSize() }

    private var _allowFontScaling: Boolean? = null
    override var allowFontScaling: Boolean?
        get() = _allowFontScaling
        set(value) { _allowFontScaling = value; updateTextSize() }

    private var _fontFamily: String? = null
    override var fontFamily: String?
        get() = _fontFamily
        set(value) { _fontFamily = value; updateTypeface() }

    private var _fontWeight: FontWeight? = null
    override var fontWeight: FontWeight?
        get() = _fontWeight
        set(value) { _fontWeight = value; updateTypeface() }

    private var _onContentSizeChange: ((Double, Double) -> Unit)? = null
    override var onContentSizeChange: ((Double, Double) -> Unit)?
        get() = _onContentSizeChange
        set(value) { _onContentSizeChange = value }

    init {
        // Setters only run for props JS actually passes, so apply the default size up front
        updateTextSize()
    }

    override fun afterUpdate() {
        val (widthPx, heightPx) = shimmerView.measureNaturalSize()
        if (widthPx == 0f || heightPx == 0f) return
        // Paint returns pixels; React Native layout expects dp
        val density = context.resources.displayMetrics.density
        _onContentSizeChange?.invoke((widthPx / density).toDouble(), (heightPx / density).toDouble())
    }

    private fun updateTextSize() {
        val size = (_fontSize ?: 16.0).toFloat()
        // sp follows the system font scale, dp ignores it
        val unit = if (_allowFontScaling ?: true) TypedValue.COMPLEX_UNIT_SP else TypedValue.COMPLEX_UNIT_DIP
        shimmerView.textSizePx = TypedValue.applyDimension(unit, size, context.resources.displayMetrics)
    }

    private fun updateTypeface() {
        val weight = when (_fontWeight) {
            FontWeight._100 -> 100
            FontWeight._200 -> 200
            FontWeight._300 -> 300
            FontWeight._400, FontWeight.NORMAL, null -> 400
            FontWeight._500 -> 500
            FontWeight._600 -> 600
            FontWeight._700, FontWeight.BOLD -> 700
            FontWeight._800 -> 800
            FontWeight._900 -> 900
        }
        val family = _fontFamily
        shimmerView.typeface = when {
            // ReactFontManager resolves fonts from assets/fonts and res/font like <Text> does
            !family.isNullOrEmpty() ->
                ReactFontManager.getInstance().getTypeface(family, weight, false, context.assets)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ->
                Typeface.create(Typeface.DEFAULT, weight, false)
            else ->
                Typeface.create(Typeface.DEFAULT, if (weight >= 600) Typeface.BOLD else Typeface.NORMAL)
        }
    }

    /** Converts a `processColor` value (ARGB, signed or unsigned) to an Android color int. */
    private fun toColorInt(value: Double?, default: Int): Int =
        if (value == null || !value.isFinite()) default else value.toLong().toInt()
}
