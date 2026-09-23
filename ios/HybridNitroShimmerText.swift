//
//  HybridNitroShimmerText.swift
//  Pods
//
//  Created by Alejandro Paredes Alva on 4/23/2026.
//

import Foundation
import UIKit

// MARK: - ShimmerLabel

/// A UIView that draws text with an animated shimmer highlight sweeping left-to-right.
/// It renders a base-colored label and a highlight-colored label on top; the highlight label
/// is masked by a narrow CAGradientLayer band that animates across the view.
private class ShimmerLabel: UIView {
    let baseLabel = UILabel()
    private let highlightLabel = UILabel()
    private let maskLayer = CAGradientLayer()

    /// Called when the system text size changes, so the owner can rebuild the font.
    var onContentSizeCategoryChange: (() -> Void)?

    var text: String = "" {
        didSet {
            guard text != oldValue else { return }
            baseLabel.text = text
            highlightLabel.text = text
            accessibilityLabel = text
            updateAnimationState()
        }
    }
    var baseColor: UIColor = UIColor(white: 0.5, alpha: 1) {
        didSet { baseLabel.textColor = baseColor }
    }
    var highlightColor: UIColor = .white {
        didSet { highlightLabel.textColor = highlightColor }
    }
    var labelFont: UIFont = .systemFont(ofSize: 16) {
        didSet { baseLabel.font = labelFont; highlightLabel.font = labelFont }
    }
    var shimmerDuration: TimeInterval = 1.5 {
        didSet {
            guard shimmerDuration != oldValue else { return }
            updateAnimationState()
        }
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }
    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        clipsToBounds = true
        // Expose a single element to VoiceOver instead of both stacked labels
        isAccessibilityElement = true
        accessibilityTraits = .staticText
        for label in [baseLabel, highlightLabel] {
            // Single-line keeps render and afterUpdate measurement consistent
            label.numberOfLines = 1
            label.textAlignment = .center
            label.lineBreakMode = .byTruncatingTail
            label.isAccessibilityElement = false
            label.font = labelFont
            label.translatesAutoresizingMaskIntoConstraints = false
            addSubview(label)
            NSLayoutConstraint.activate([
                label.topAnchor.constraint(equalTo: topAnchor),
                label.leadingAnchor.constraint(equalTo: leadingAnchor),
                label.trailingAnchor.constraint(equalTo: trailingAnchor),
                label.bottomAnchor.constraint(equalTo: bottomAnchor),
            ])
        }
        baseLabel.textColor = baseColor
        highlightLabel.textColor = highlightColor
        // Narrow band: transparent → white (highlight visible) → transparent
        maskLayer.colors = [UIColor.clear.cgColor, UIColor.white.cgColor, UIColor.clear.cgColor]
        maskLayer.locations = [0.3, 0.5, 0.7]
        maskLayer.startPoint = CGPoint(x: 0, y: 0.5)
        maskLayer.endPoint = CGPoint(x: 1, y: 0.5)
        highlightLabel.layer.mask = maskLayer

        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(reduceMotionChanged),
                           name: UIAccessibility.reduceMotionStatusDidChangeNotification, object: nil)
        center.addObserver(self, selector: #selector(appWillEnterForeground),
                           name: UIApplication.willEnterForegroundNotification, object: nil)
        center.addObserver(self, selector: #selector(contentSizeCategoryChanged),
                           name: UIContentSizeCategory.didChangeNotification, object: nil)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let widthChanged = maskLayer.frame.width != bounds.width
        maskLayer.frame = bounds
        if widthChanged { updateAnimationState() }
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        updateAnimationState()
    }

    @objc private func reduceMotionChanged() {
        updateAnimationState()
    }

    @objc private func appWillEnterForeground() {
        // Core Animation may drop layer animations while the app is backgrounded
        if maskLayer.animation(forKey: "shimmer") == nil { updateAnimationState() }
    }

    @objc private func contentSizeCategoryChanged() {
        onContentSizeCategoryChange?()
    }

    private func updateAnimationState() {
        let shouldAnimate = window != nil && !text.isEmpty && bounds.width > 0
            && !UIAccessibility.isReduceMotionEnabled
        // With no sweep, show only the base text instead of a frozen highlight band
        highlightLabel.isHidden = !shouldAnimate
        if shouldAnimate {
            restartAnimation()
        } else {
            maskLayer.removeAnimation(forKey: "shimmer")
        }
    }

    private func restartAnimation() {
        maskLayer.removeAnimation(forKey: "shimmer")
        let anim = CABasicAnimation(keyPath: "transform.translation.x")
        anim.fromValue = -bounds.width
        anim.toValue = bounds.width
        anim.duration = shimmerDuration
        anim.repeatCount = .infinity
        anim.timingFunction = CAMediaTimingFunction(name: .linear)
        anim.isRemovedOnCompletion = false
        maskLayer.add(anim, forKey: "shimmer")
    }
}

// MARK: - HybridNitroShimmerText

class HybridNitroShimmerText: HybridNitroShimmerTextSpec {
    private let shimmerLabel = ShimmerLabel()
    var view: UIView { shimmerLabel }

    var text: String = "" {
        didSet { shimmerLabel.text = text }
    }

    var shimmerBaseColor: Double? = nil {
        didSet {
            shimmerLabel.baseColor = shimmerBaseColor.flatMap(UIColor.init(argb:))
                ?? UIColor(white: 0.5, alpha: 1)
        }
    }

    var shimmerHighlightColor: Double? = nil {
        didSet {
            shimmerLabel.highlightColor = shimmerHighlightColor.flatMap(UIColor.init(argb:)) ?? .white
        }
    }

    var shimmerDuration: Double? = nil {
        didSet { shimmerLabel.shimmerDuration = (shimmerDuration ?? 1500) / 1000.0 }
    }

    var fontSize: Double? = nil {
        didSet { updateFont() }
    }

    var fontFamily: String? = nil {
        didSet { updateFont() }
    }

    var fontWeight: FontWeight? = nil {
        didSet { updateFont() }
    }

    var allowFontScaling: Bool? = nil {
        didSet { updateFont() }
    }

    var onContentSizeChange: ((Double, Double) -> Void)? = nil

    override init() {
        super.init()
        shimmerLabel.labelFont = makeFont()
        shimmerLabel.onContentSizeCategoryChange = { [weak self] in
            guard let self, self.allowFontScaling ?? true else { return }
            self.updateFont()
            self.reportContentSize()
        }
    }

    func afterUpdate() {
        reportContentSize()
    }

    private func reportContentSize() {
        // Measure text using an unconstrained fit — works before the view is in a window
        let size = shimmerLabel.baseLabel.sizeThatFits(
            CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        )
        guard size.width > 0, size.height > 0 else { return }
        onContentSizeChange?(Double(size.width), Double(size.height))
    }

    private func updateFont() {
        shimmerLabel.labelFont = makeFont()
    }

    private func makeFont() -> UIFont {
        let size = CGFloat(fontSize ?? 16)
        let weight = uiFontWeight(from: fontWeight)
        var font = fontFamily.flatMap { customFont(family: $0, size: size, weight: weight) }
            ?? .systemFont(ofSize: size, weight: weight)
        if allowFontScaling ?? true {
            font = UIFontMetrics.default.scaledFont(for: font)
        }
        return font
    }

    /// Picks the non-italic face of `family` whose weight is closest to `weight`.
    /// Falls back to treating `family` as a font name (e.g. "Georgia-Bold").
    private func customFont(family: String, size: CGFloat, weight: UIFont.Weight) -> UIFont? {
        var best: UIFont?
        var bestDelta = CGFloat.greatestFiniteMagnitude
        for name in UIFont.fontNames(forFamilyName: family) {
            guard let candidate = UIFont(name: name, size: size),
                  !candidate.fontDescriptor.symbolicTraits.contains(.traitItalic) else { continue }
            let traits = candidate.fontDescriptor.object(forKey: .traits) as? [UIFontDescriptor.TraitKey: Any]
            let candidateWeight = traits?[.weight] as? CGFloat ?? UIFont.Weight.regular.rawValue
            let delta = abs(candidateWeight - weight.rawValue)
            if delta < bestDelta {
                best = candidate
                bestDelta = delta
            }
        }
        return best ?? UIFont(name: family, size: size)
    }

    private func uiFontWeight(from weight: FontWeight?) -> UIFont.Weight {
        switch weight {
        case ._100: return .ultraLight
        case ._200: return .thin
        case ._300: return .light
        case ._400, .normal, nil: return .regular
        case ._500: return .medium
        case ._600: return .semibold
        case ._700, .bold: return .bold
        case ._800: return .heavy
        case ._900: return .black
        }
    }
}

// MARK: - UIColor ARGB init

private extension UIColor {
    /// Creates a color from a `processColor` value (0xAARRGGBB, signed or unsigned).
    convenience init?(argb value: Double) {
        guard value.isFinite else { return nil }
        let argb = UInt32(truncatingIfNeeded: Int64(value))
        self.init(red: CGFloat((argb >> 16) & 0xFF) / 255,
                  green: CGFloat((argb >> 8) & 0xFF) / 255,
                  blue: CGFloat(argb & 0xFF) / 255,
                  alpha: CGFloat((argb >> 24) & 0xFF) / 255)
    }
}
