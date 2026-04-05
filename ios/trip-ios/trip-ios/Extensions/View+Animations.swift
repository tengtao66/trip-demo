import SwiftUI

struct StaggeredAppearance: ViewModifier {
    let index: Int
    let reduceMotion: Bool
    @State private var isVisible = false

    func body(content: Content) -> some View {
        content
            .opacity(isVisible ? 1 : 0)
            .offset(y: isVisible ? 0 : (reduceMotion ? 0 : 20))
            .onAppear {
                let delay = reduceMotion ? 0 : Double(index) * 0.05
                withAnimation(.easeOut(duration: reduceMotion ? 0 : 0.3).delay(delay)) {
                    isVisible = true
                }
            }
    }
}

extension View {
    func staggeredAppearance(index: Int, reduceMotion: Bool = false) -> some View {
        modifier(StaggeredAppearance(index: index, reduceMotion: reduceMotion))
    }
}
