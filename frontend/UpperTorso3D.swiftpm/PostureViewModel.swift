import Foundation
import Combine

final class PostureViewModel: ObservableObject {

    // Sensor-driven posture
    @Published var upperPitch: Double = 0
    @Published var upperRoll: Double = 0
    @Published var lowerPitch: Double = 0

    // Events
    @Published var lastEvent: String?
    
    // Insights
    @Published var latestInsight: Insight?
    @Published var insightHistory: [Insight] = []

    private let ws = TelemetryWebSocket()

    func start() {
        ws.onMessage = { [weak self] msg in
            DispatchQueue.main.async {
                self?.handle(msg)
            }
        }
        ws.connect()
    }

    func stop() {
        ws.disconnect()
    }

    private func handle(_ msg: TelemetryMessage) {
        // Handle insight updates
        if msg.type == "insight_update" || (msg.kind == nil && msg.type != nil) {
            if let insight = Insight.from(message: msg) {
                latestInsight = insight
                // Add to history if not already present
                if !insightHistory.contains(where: { $0.id == insight.id }) {
                    insightHistory.append(insight)
                    // Keep only last 48 insights (24 hours)
                    if insightHistory.count > 48 {
                        insightHistory.removeFirst()
                    }
                    // Sort by window start (most recent first)
                    insightHistory.sort { $0.windowStart > $1.windowStart }
                }
            }
            return
        }
        
        // Events
        if msg.kind == "event" {
            lastEvent = msg.event
            return
        }

        // Samples - prefer pitch_smooth over pitch if available
        guard msg.kind == "sample" else { return }
        
        let pitch = msg.pitch_smooth ?? msg.pitch ?? 0
        let roll = msg.roll ?? 0

        if msg.source == 1 {
            upperPitch = pitch
            upperRoll = roll
        } else if msg.source == 2 {
            lowerPitch = pitch
        }
    }
}
