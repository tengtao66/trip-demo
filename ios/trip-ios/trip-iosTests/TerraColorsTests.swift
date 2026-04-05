import Testing
import SwiftUI
@testable import trip_ios

// MARK: - T1.3 TerraColors Tests

@Suite("TerraColors")
@MainActor
struct TerraColorsTests {

    // T1.3.1: Color.terraTerracotta RGB matches #A0522D
    @Test func terraTerracottaMatchesHex() {
        let components = Color.terraTerracotta.rgbComponents
        #expect(components.red == 160)
        #expect(components.green == 82)
        #expect(components.blue == 45)
    }

    // T1.3.2: Color(hex:) produces correct red
    @Test func hexInitializerProducesCorrectColor() {
        let red = Color(hex: "#FF0000")
        let components = red.rgbComponents
        #expect(components.red == 255)
        #expect(components.green == 0)
        #expect(components.blue == 0)
    }

    // T1.3.3: Color(hex: "invalid") falls back to black (0,0,0)
    @Test func hexInitializerHandlesInvalidInput() {
        let color = Color(hex: "invalid")
        let components = color.rgbComponents
        #expect(components.red == 0)
        #expect(components.green == 0)
        #expect(components.blue == 0)
    }

    // T1.3.4: Color(hex:) handles 3-char shorthand
    @Test func hexInitializerHandlesShorthand() {
        let color = Color(hex: "#F00")
        let components = color.rgbComponents
        #expect(components.red == 255)
        #expect(components.green == 0)
        #expect(components.blue == 0)
    }

    // T1.3.5: All 12 color constants are distinct
    @Test func allColorConstantsAreDistinct() {
        let colors: [Color] = [
            .terraMocha, .terraTerracotta, .terraSage, .terraSageText,
            .terraAlpineOat, .terraIvory, .terraBorder, .terraText,
            .terraTextMuted, .terraWarning, .terraWarningText, .terraDestructive
        ]
        let hexSet = Set(colors.map { $0.hexString })
        #expect(hexSet.count == 12, "Expected 12 unique colors, got \(hexSet.count)")
    }
}
