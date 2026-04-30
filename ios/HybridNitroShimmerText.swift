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

    var text: String = "" {
        didSet {
            baseLabel.text = text
            highlightLabel.text = text
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
        didSet { updateAnimationState() }
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }
    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        clipsToBounds = true
        for label in [baseLabel, highlightLabel] {
            // Single-line keeps render and afterUpdate measurement consistent
            label.numberOfLines = 1
            label.translatesAutoresizingMaskIntoConstraints = false
            addSubview(label)
            NSLayoutConstraint.activate([
                label.topAnchor.constraint(equalTo: topAnchor),
                label.leadingAnchor.constraint(equalTo: leadingAnchor),
                label.trailingAnchor.constraint(equalTo: trailingAnchor),
                label.bottomAnchor.constraint(equalTo: bottomAnchor),
            ])
        }
        // Narrow band: transparent → white (highlight visible) → transparent
        maskLayer.colors = [UIColor.clear.cgColor, UIColor.white.cgColor, UIColor.clear.cgColor]
        maskLayer.locations = [0.3, 0.5, 0.7]
        maskLayer.startPoint = CGPoint(x: 0, y: 0.5)
        maskLayer.endPoint = CGPoint(x: 1, y: 0.5)
        highlightLabel.layer.mask = maskLayer
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

    private func updateAnimationState() {
        let shouldAnimate = window != nil && !text.isEmpty && bounds.width > 0
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
        maskLayer.add(anim, forKey: "shimmer")
    }
}

// MARK: - HybridNitroShimmerText

class HybridNitroShimmerText: HybridNitroShimmerTextSpec {
    var view: UIView = ShimmerLabel()
    private var shimmerLabel: ShimmerLabel { view as! ShimmerLabel }

    var text: String = "" {
        didSet { shimmerLabel.text = text }
    }

    var shimmerBaseColor: String? = nil {
        didSet {
            shimmerLabel.baseColor = shimmerBaseColor.flatMap(UIColor.init(hex:))
                ?? UIColor(white: 0.5, alpha: 1)
        }
    }

    var shimmerHighlightColor: String? = nil {
        didSet {
            shimmerLabel.highlightColor = shimmerHighlightColor.flatMap(UIColor.init(hex:)) ?? .white
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

    private func updateFont() {
        let size = CGFloat(fontSize ?? 16)
        let weight = uiFontWeight(from: fontWeight)
        if let family = fontFamily,
           let font = UIFont(name: family, size: size) {
            // Apply weight via font descriptor when a custom family is set
            let descriptor = font.fontDescriptor.addingAttributes([
                .traits: [UIFontDescriptor.TraitKey.weight: weight]
            ])
            shimmerLabel.labelFont = UIFont(descriptor: descriptor, size: size)
        } else {
            shimmerLabel.labelFont = .systemFont(ofSize: size, weight: weight)
        }
    }

    var onContentSizeChange: ((Double, Double) -> Void)? = nil

    func afterUpdate() {
        // Measure text using an unconstrained fit — works before the view is in a window
        let size = shimmerLabel.baseLabel.sizeThatFits(
            CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        )
        guard size.width > 0, size.height > 0 else { return }
        onContentSizeChange?(Double(size.width), Double(size.height))
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

// MARK: - UIColor hex init

private extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s = String(s.dropFirst()) }
        var rgb: UInt64 = 0
        guard Scanner(string: s).scanHexInt64(&rgb) else { return nil }
        switch s.count {
        case 6:
            self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255,
                      green: CGFloat((rgb >> 8) & 0xFF) / 255,
                      blue: CGFloat(rgb & 0xFF) / 255,
                      alpha: 1)
        case 8:
            self.init(red: CGFloat((rgb >> 24) & 0xFF) / 255,
                      green: CGFloat((rgb >> 16) & 0xFF) / 255,
                      blue: CGFloat((rgb >> 8) & 0xFF) / 255,
                      alpha: CGFloat(rgb & 0xFF) / 255)
        default: return nil
        }
    }
}
