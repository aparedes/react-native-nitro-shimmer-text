//
//  HybridNitroShimmerText.swift
//  Pods
//
//  Created by Alejandro Paredes Alva on 4/23/2026.
//

import Foundation
import UIKit

class HybridNitroShimmerText : HybridNitroShimmerTextSpec {
  // UIView
  var view: UIView = UIView()

  // Props
  var isRed: Bool = false {
    didSet {
      view.backgroundColor = isRed ? .red : .black
    }
  }
}
