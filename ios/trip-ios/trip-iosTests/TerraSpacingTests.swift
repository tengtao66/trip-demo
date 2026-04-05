import Testing
import CoreFoundation
@testable import trip_ios

// MARK: - T1.5 TerraSpacing Tests

@Suite("TerraSpacing")
@MainActor
struct TerraSpacingTests {

    // T1.5.1: TerraSpacing.md equals 16
    @Test func mdEquals16() {
        #expect(TerraSpacing.md == 16.0)
    }

    // T1.5.2: Most spacing values are multiples of 4
    @Test func spacingValuesAreMultiplesOf4() {
        let multOf4: [CGFloat] = [
            TerraSpacing.xxs, TerraSpacing.xs, TerraSpacing.md,
            TerraSpacing.lg, TerraSpacing.xl, TerraSpacing.xxl,
            TerraSpacing.xxxl, TerraSpacing.cardPadding,
            TerraSpacing.sectionSpacing, TerraSpacing.screenEdge,
            TerraSpacing.screenEdgeIPad
        ]
        for val in multOf4 {
            #expect(val.truncatingRemainder(dividingBy: 4) == 0, "\(val) is not a multiple of 4")
        }
    }

    // T1.5.3: screenEdge < screenEdgeIPad
    @Test func screenEdgeLessThanIPad() {
        #expect(TerraSpacing.screenEdge < TerraSpacing.screenEdgeIPad)
    }
}
