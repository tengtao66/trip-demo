import Testing
import Foundation
@testable import trip_ios

@Suite("Date Formatting")
@MainActor
struct DateFormattingTests {

    // TC.5: ISO date formats as "Apr 10, 2026"
    @Test func isoDateFormatsCorrectly() {
        let date = ISO8601DateFormatter.standard.date(from: "2026-04-10T00:00:00Z")!
        #expect(date.formatted_MMMddyyyy == "Apr 10, 2026")
    }

    // String.asDate parses ISO8601 with fractional seconds
    @Test func stringAsDateParsesFractionalSeconds() {
        let date = "2026-04-10T14:30:00.000Z".asDate
        #expect(date != nil)
    }

    // String.asDate parses ISO8601 without fractional seconds
    @Test func stringAsDateParsesStandard() {
        let date = "2026-04-10T14:30:00Z".asDate
        #expect(date != nil)
    }

    // TC.7: Invalid string returns nil (no crash)
    @Test func invalidStringAsDateReturnsNil() {
        let date = "not-a-date".asDate
        #expect(date == nil)
    }

    // Empty string returns nil
    @Test func emptyStringAsDateReturnsNil() {
        let date = "".asDate
        #expect(date == nil)
    }
}
