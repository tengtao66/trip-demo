import Testing
import Foundation
@testable import trip_ios

// MARK: - Cross-Cutting: Currency Formatting

@Suite("Currency Formatting")
@MainActor
struct CurrencyFormattingTests {

    // TC.1: $162.00
    @Test func formatStandardAmount() {
        #expect(162.0.asCurrency == "$162.00")
    }

    // TC.2: $1,234.50 with thousands separator
    @Test func formatThousandsSeparator() {
        #expect(1234.5.asCurrency == "$1,234.50")
    }

    // TC.3: $0.00
    @Test func formatZero() {
        #expect(0.0.asCurrency == "$0.00")
    }

    // TC.4: Rounds correctly
    @Test func formatRoundsCorrectly() {
        #expect(99.999.asCurrency == "$100.00")
    }
}

// MARK: - T4.10 Pay Later Installment Math

@Suite("PayLater Installment")
@MainActor
struct PayLaterInstallmentTests {

    // T4.10.1: $162 / 4 = $40.50
    @Test func installment162() {
        #expect(PayLaterCalculator.installmentAmount(total: 162.0) == 40.50)
    }

    // T4.10.2: $100 / 4 = $25.00
    @Test func installment100() {
        #expect(PayLaterCalculator.installmentAmount(total: 100.0) == 25.00)
    }

    // T4.10.3: $99.99 / 4 rounds to $25.00
    @Test func installmentRounds() {
        let result = PayLaterCalculator.installmentAmount(total: 99.99)
        #expect(result == 25.00)
    }

    // T4.10.4: $0 / 4 = $0.00
    @Test func installmentZero() {
        #expect(PayLaterCalculator.installmentAmount(total: 0.0) == 0.0)
    }
}

// MARK: - T5.5 Booking Detail Business Logic

@Suite("Booking Calculations")
@MainActor
struct BookingCalculationTests {

    // T5.5.1: Progress ratio $200/$800 = 0.25
    @Test func progressRatioPartial() {
        #expect(BookingCalculator.progressRatio(paid: 200, total: 800) == 0.25)
    }

    // T5.5.2: Progress ratio $800/$800 = 1.0
    @Test func progressRatioFull() {
        #expect(BookingCalculator.progressRatio(paid: 800, total: 800) == 1.0)
    }

    // T5.5.3: Progress ratio $0/$800 = 0.0
    @Test func progressRatioZero() {
        #expect(BookingCalculator.progressRatio(paid: 0, total: 800) == 0.0)
    }

    // T5.5.4: Progress ratio with $0 total doesn't crash
    @Test func progressRatioZeroTotal() {
        let ratio = BookingCalculator.progressRatio(paid: 0, total: 0)
        #expect(ratio == 0.0) // avoid division by zero
    }

    // T6.5.1: Capture amount = total - deposit (800 - 200 = 600)
    @Test func captureAmountStandard() {
        #expect(BookingCalculator.captureAmount(total: 800, deposit: 200) == 600)
    }

    // T6.5.2: Capture amount when deposit = 0
    @Test func captureAmountNoDeposit() {
        #expect(BookingCalculator.captureAmount(total: 800, deposit: 0) == 800)
    }

    // T6.5.3: Capture amount when fully paid = 0
    @Test func captureAmountFullyPaid() {
        #expect(BookingCalculator.captureAmount(total: 800, deposit: 800) == 0)
    }
}

// MARK: - T5.5.4-7 Authorization Countdown

@Suite("Authorization Countdown")
@MainActor
struct AuthorizationCountdownTests {

    private let fixedNow = Date(timeIntervalSinceReferenceDate: 0) // Jan 1, 2001

    // T5.5.4: 29 days remaining
    @Test func countdownFull() {
        let expiresAt = Calendar.current.date(byAdding: .day, value: 29, to: fixedNow)!
        let remaining = BookingCalculator.daysRemaining(expiresAt: expiresAt, now: fixedNow)
        #expect(remaining == 29)
    }

    // T5.5.5: 4 days remaining
    @Test func countdownPartial() {
        let expiresAt = Calendar.current.date(byAdding: .day, value: 4, to: fixedNow)!
        let remaining = BookingCalculator.daysRemaining(expiresAt: expiresAt, now: fixedNow)
        #expect(remaining == 4)
    }

    // T5.5.6: Expired → negative or zero
    @Test func countdownExpired() {
        let expiresAt = Calendar.current.date(byAdding: .day, value: -1, to: fixedNow)!
        let remaining = BookingCalculator.daysRemaining(expiresAt: expiresAt, now: fixedNow)
        #expect(remaining <= 0)
    }
}

// MARK: - T6.6 ChargeAddon Validation

@Suite("ChargeAddon Validation")
@MainActor
struct ChargeAddonValidationTests {

    // T6.6.1: "50" parses to 50.0
    @Test func validAmount() {
        #expect(ChargeAddonValidator.parseAmount("50") == 50.0)
    }

    // T6.6.2: "0" is invalid
    @Test func zeroIsInvalid() {
        #expect(ChargeAddonValidator.parseAmount("0") == nil)
    }

    // T6.6.3: "-10" is invalid
    @Test func negativeIsInvalid() {
        #expect(ChargeAddonValidator.parseAmount("-10") == nil)
    }

    // T6.6.4: "" is invalid
    @Test func emptyIsInvalid() {
        #expect(ChargeAddonValidator.parseAmount("") == nil)
    }

    // T6.6.5: "abc" is invalid
    @Test func nonNumericIsInvalid() {
        #expect(ChargeAddonValidator.parseAmount("abc") == nil)
    }

    // T6.6.6: "50.99" parses correctly
    @Test func decimalAmount() {
        #expect(ChargeAddonValidator.parseAmount("50.99") == 50.99)
    }

    // T6.6.7: Preset populates both fields
    @Test func presetPopulatesFields() {
        let preset = ChargeAddonPreset(name: "Travel Insurance", amount: 50.0)
        #expect(preset.name == "Travel Insurance")
        #expect(preset.amount == 50.0)
    }
}
