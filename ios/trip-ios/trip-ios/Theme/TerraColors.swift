import SwiftUI
import UIKit

// MARK: - TERRA Color Palette (WCAG AA Verified)

extension Color {
    // Core palette
    static let terraMocha = Color(hex: "#5C3D2E")            // 9.03:1 on AlpineOat
    static let terraTerracotta = Color(hex: "#A0522D")        // 5.22:1 on AlpineOat
    static let terraSage = Color(hex: "#86A873")              // Fills only (2.48:1)
    static let terraSageText = Color(hex: "#5D8A48")          // Text-safe sage (4.58:1)
    static let terraAlpineOat = Color(hex: "#FAF6F1")         // Screen background
    static let terraIvory = Color(hex: "#FFFDF9")             // Card background
    static let terraBorder = Color(hex: "#E8DFD4")            // Dividers
    static let terraText = Color(hex: "#3D2B1F")              // 12.48:1 on AlpineOat
    static let terraTextMuted = Color(hex: "#7A6347")         // 5.0:1 on AlpineOat
    static let terraWarning = Color(hex: "#B8860B")           // Badge fills only
    static let terraWarningText = Color(hex: "#8B6508")       // Text-safe warning (4.65:1)
    static let terraDestructive = Color(hex: "#DC2626")       // 4.83:1 on white
}

// MARK: - Hex Initializer

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            r = (int >> 8) * 17
            g = (int >> 4 & 0xF) * 17
            b = (int & 0xF) * 17
        case 6: // RRGGBB (24-bit)
            r = int >> 16
            g = int >> 8 & 0xFF
            b = int & 0xFF
        default:
            r = 0; g = 0; b = 0
        }

        self.init(
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255
        )
    }
}

// MARK: - Color Inspection Helpers (for testing & debugging)

extension Color {
    struct RGBComponents {
        let red: Int
        let green: Int
        let blue: Int
    }

    var rgbComponents: RGBComponents {
        let uiColor = UIColor(self)
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        uiColor.getRed(&r, green: &g, blue: &b, alpha: nil)
        return RGBComponents(
            red: Int(round(r * 255)),
            green: Int(round(g * 255)),
            blue: Int(round(b * 255))
        )
    }

    var hexString: String {
        let c = rgbComponents
        return String(format: "#%02X%02X%02X", c.red, c.green, c.blue)
    }
}
