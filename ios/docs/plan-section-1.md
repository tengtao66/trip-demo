# Section 1: Project Foundation & Theme

> Prerequisite: Fresh Xcode project exists at `trip-ios/` with default `trip_iosApp.swift` and `ContentView.swift`.

---

## Task 1.1: Create Folder Structure

**Files to create:** Empty directories matching the design spec architecture.

```
trip-ios/trip-ios/
  Theme/
  Models/
  Services/
  Stores/
  Views/Explore/Checkout/
  Views/Bookings/
  Views/Merchant/
  Views/Profile/
  Views/Shared/
  Views/Components/
  Extensions/
```

**Output:** All group folders exist in the Xcode project navigator (add as groups, not folder references).

**Dependencies:** None.

**Acceptance criteria:** Project builds with no errors. Folders visible in Xcode navigator.

---

## Task 1.2: Bundle Inter Font

**Files to create/modify:**
- Download `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf` from Google Fonts and add to `trip-ios/trip-ios/Fonts/`.
- Add font filenames to `Info.plist` under `UIAppFonts` (or the target's Info tab in Xcode).
- Add all 4 `.ttf` files to the app target's "Copy Bundle Resources" build phase.

**Output:** `UIFont(name: "Inter-SemiBold", size: 16)` returns non-nil at runtime.

**Dependencies:** None.

**Acceptance criteria:** A test preview renders text with `Font.custom("Inter-SemiBold", size: 22)` and the font is visibly different from San Francisco.

---

## Task 1.3: TerraColors — Color Palette

**File to create:** `Theme/TerraColors.swift`

**Contents:**
- A `Color` extension with a `hex` initializer: `Color(hex: String)` that parses 6-digit hex strings into RGB components.
- Static color constants matching the design spec exactly:

| Constant | Hex | Usage |
|---|---|---|
| `terraMocha` | `#5C3D2E` | Dark brown accents |
| `terraTerracotta` | `#A0522D` | Primary buttons, links |
| `terraSage` | `#86A873` | Success / completed badges |
| `terraAlpineOat` | `#FAF6F1` | Screen backgrounds |
| `terraIvory` | `#FFFDF9` | Card backgrounds |
| `terraBorder` | `#E8DFD4` | Dividers, card borders |
| `terraText` | `#3D2B1F` | Primary text |
| `terraTextMuted` | `#8B7355` | Secondary / label text |
| `terraWarning` | `#B8860B` | Pending status |
| `terraDestructive` | `#DC2626` | Destructive actions |

**Dependencies:** None.

**Acceptance criteria:** `Color.terraTerracotta` compiles and renders the correct sienna-brown in a SwiftUI preview.

---

## Task 1.4: TerraTypography — Font Styles

**File to create:** `Theme/TerraTypography.swift`

**Contents:**
- A `Font` extension (or enum `TerraFont`) with static methods/properties for the type scale. Headings use Inter (custom font); body uses the system font (San Francisco).

```swift
extension Font {
    static let terraLargeTitle = Font.custom("Inter-Bold", size: 28)       // screen titles
    static let terraTitle      = Font.custom("Inter-SemiBold", size: 22)   // section headers
    static let terraHeadline   = Font.custom("Inter-SemiBold", size: 16)   // card titles
    static let terraBody       = Font.system(size: 14)                     // body text (SF)
    static let terraCaption    = Font.system(size: 12)                     // secondary info
    static let terraFootnote   = Font.system(size: 10)                     // fine print
}
```

**Dependencies:** Task 1.2 (Inter font bundle).

**Acceptance criteria:** A preview showing all 6 styles confirms headings render in Inter and body in SF.

---

## Task 1.5: TerraSpacing — Spacing Scale

**File to create:** `Theme/TerraSpacing.swift`

**Contents:**
- An enum `TerraSpacing` (no cases, constants only) with the 4pt-based scale:

```swift
enum TerraSpacing {
    static let xxs: CGFloat = 4
    static let xs:  CGFloat = 8
    static let sm:  CGFloat = 12
    static let md:  CGFloat = 16
    static let lg:  CGFloat = 20
    static let xl:  CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48

    static let cardPadding: CGFloat = 16     // inner card padding
    static let sectionSpacing: CGFloat = 24  // vertical gap between sections
    static let screenEdge: CGFloat = 16      // horizontal safe-area inset (iPhone)
    static let screenEdgeIPad: CGFloat = 20  // horizontal safe-area inset (iPad)
}
```

**Dependencies:** None.

**Acceptance criteria:** `TerraSpacing.md` equals `16` and is usable in `.padding(TerraSpacing.md)`.

---

## Task 1.6: Shared Components — TerraCard, TerraButton, StatusBadge, InfoRow

**Files to create:**
- `Views/Components/TerraCard.swift`
- `Views/Components/TerraButton.swift`
- `Views/Components/StatusBadge.swift`
- `Views/Components/InfoRow.swift`
- `Views/Components/SectionHeader.swift`

**TerraCard:** A container view with `terraIvory` background, 12pt corner radius, and a subtle shadow (`color: .black.opacity(0.06), radius: 4, y: 2`). Accepts `@ViewBuilder content` as a generic parameter. Applies `TerraSpacing.cardPadding` inner padding.

**TerraButton:** An enum `TerraButtonStyle` with cases `.primary`, `.outline`, `.destructive`, `.ghost`. The view accepts a label string, optional SF Symbol icon name, style variant, optional `isLoading` bool (shows `ProgressView`), and an action closure. Styling per variant:
- `.primary`: `terraTerracotta` fill, white text, 10pt corner radius, Inter-SemiBold 16pt.
- `.outline`: clear fill, `terraTerracotta` border (1.5pt), terracotta text.
- `.destructive`: clear fill, `terraDestructive` border, destructive text.
- `.ghost`: no background/border, `terraTextMuted` text.
- All variants: 44pt minimum height (touch target), full-width by default via `.frame(maxWidth: .infinity)`.

**StatusBadge:** Accepts a `status: String` and maps it to a background/text color pair. Pill shape (capsule). Mappings: "completed"/"captured" -> sage bg, "pending"/"authorized" -> warning bg, "active"/"processing" -> blue bg, "merchant" -> purple bg, default -> gray bg. Font: `terraCaption`, bold.

**InfoRow:** Horizontal `HStack` with label (left, `terraTextMuted`, `terraCaption`) and value (right, `terraText`, `terraBody`). Optional SF Symbol icon before the label.

**SectionHeader:** Text styled with `terraTitle` font and `terraText` color, with `TerraSpacing.sectionSpacing` top padding.

**Dependencies:** Tasks 1.3, 1.4, 1.5.

**Acceptance criteria:** Each component has a `#Preview` block demonstrating all variants. Previews render correctly in Xcode canvas. TerraButton touch targets are at least 44pt tall.

---

## Task 1.7: PayPalButton Component

**File to create:** `Views/Components/PayPalButton.swift`

**Contents:** A branded PayPal checkout button following PayPal design guidelines. Yellow background (`#FFC439`), dark text (`#253B80`), 24pt corner radius, 50pt height. Displays the PayPal wordmark (use SF Symbol `creditcard` as placeholder until PayPal logo asset is added; add a `// TODO: Replace with PayPal logo SVG` comment). Accepts `isLoading` and `action` parameters. Disabled state dims opacity to 0.6.

**Dependencies:** Task 1.3.

**Acceptance criteria:** Preview shows a yellow rounded button. Tap triggers the action closure. Loading state shows a spinner.

---

## Task 1.8: APIClient — Base Networking Layer

**File to create:** `Services/APIClient.swift`

**Contents:**
- An `actor APIClient` (actor for thread safety) with:
  - `baseURL: URL` — defaults to `http://localhost:3001`, overridable via `UserDefaults` key `"terra_base_url"`.
  - `userRole: String` — set by AuthStore, sent as `X-User-Role` header.
  - `func request<T: Decodable>(method: HTTPMethod, path: String, body: Encodable?) async throws -> T` — generic JSON request with 30-second timeout.
  - `enum HTTPMethod { case get, post, put, delete }`.
  - `enum APIError: Error, LocalizedError` with cases `.networkError(Error)`, `.serverError(statusCode: Int, message: String)`, `.decodingError(Error)` and user-facing `errorDescription` strings.
- Adds headers: `Content-Type: application/json`, `X-User-Role`.
- Uses `JSONEncoder`/`JSONDecoder` with `.convertFromSnakeCase` decoding strategy.

**Dependencies:** None.

**Acceptance criteria:** Calling `try await apiClient.request(method: .get, path: "/api/trips", body: nil)` compiles. `APIError.serverError(statusCode: 500, message: "fail").localizedDescription` returns a human-readable string. Unit-testable via protocol extraction if needed.
